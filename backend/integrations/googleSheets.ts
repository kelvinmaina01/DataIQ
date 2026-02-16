import { google } from 'googleapis';
import type { Request, Response } from 'express';

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
];

// Initialize OAuth2 client lazily
const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.VITE_GOOGLE_CLIENT_SECRET,
        process.env.VITE_GOOGLE_REDIRECT_URI
    );
};

/**
 * Initiate OAuth flow
 * GET /api/integrations/google/auth
 */
export const initiateGoogleAuth = (req: Request, res: Response) => {
    const authUrl = getOAuth2Client().generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Force consent screen to get refresh token
    });

    res.json({ authUrl });
};

/**
 * Handle OAuth callback
 * GET /api/integrations/google/callback
 */
export const handleGoogleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Authorization code is required' });
    }

    try {
        // Exchange code for tokens
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get user info
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();

        // TODO: Store tokens in database
        // For now, return them (in production, store securely)
        res.json({
            success: true,
            user: {
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            },
            tokens: {
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date
            }
        });
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
};

/**
 * List user's Google Sheets
 * GET /api/integrations/google/sheets/list
 */
export const listGoogleSheets = async (req: Request, res: Response) => {
    const { access_token } = req.query;

    if (!access_token || typeof access_token !== 'string') {
        return res.status(401).json({ error: 'Access token is required' });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Query for Google Sheets files
        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id, name, owners, modifiedTime, iconLink, webViewLink)',
            orderBy: 'modifiedTime desc',
            pageSize: 100
        });

        const sheets = response.data.files?.map(file => ({
            id: file.id,
            name: file.name,
            owner: file.owners?.[0]?.emailAddress || 'Unknown',
            modifiedTime: file.modifiedTime,
            iconLink: file.iconLink,
            webViewLink: file.webViewLink
        })) || [];

        res.json({ sheets });
    } catch (error) {
        console.error('Error listing sheets:', error);
        res.status(500).json({ error: 'Failed to fetch Google Sheets' });
    }
};

/**
 * Get sheet data with schema detection
 * GET /api/integrations/google/sheets/:sheetId/schema
 */
export const getSheetSchema = async (req: Request, res: Response) => {
    const { sheetId } = req.params;
    const { access_token } = req.query;

    if (!access_token || typeof access_token !== 'string') {
        return res.status(401).json({ error: 'Access token is required' });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token });
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

        // Get spreadsheet metadata
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: sheetId
        });

        const firstSheet = metadata.data.sheets?.[0];
        const sheetName = firstSheet?.properties?.title || 'Sheet1';

        // Fetch first 100 rows for schema detection
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1:ZZ100`
        });

        const rows = response.data.values || [];

        if (rows.length === 0) {
            return res.json({
                schema: [],
                preview: [],
                metadata: {
                    name: metadata.data.properties?.title,
                    sheetName
                }
            });
        }

        // Detect schema from first row (headers) and subsequent rows
        const headers = rows[0];
        const dataRows = rows.slice(1);

        const schema = headers.map((header, index) => {
            const columnData = dataRows.map(row => row[index]).filter(val => val !== undefined && val !== '');
            const dataType = inferDataType(columnData);

            return {
                name: header || `Column ${index + 1}`,
                type: dataType,
                index,
                sampleValues: columnData.slice(0, 5)
            };
        });

        res.json({
            schema,
            preview: dataRows.slice(0, 10),
            metadata: {
                name: metadata.data.properties?.title,
                sheetName,
                totalRows: rows.length - 1
            }
        });
    } catch (error) {
        console.error('Error fetching sheet schema:', error);
        res.status(500).json({ error: 'Failed to fetch sheet data' });
    }
};

/**
 * Import full sheet data
 * POST /api/integrations/google/sheets/:sheetId/import
 */
export const importSheetData = async (req: Request, res: Response) => {
    const { sheetId } = req.params;
    const { access_token, datasetName, selectedColumns } = req.body;

    if (!access_token) {
        return res.status(401).json({ error: 'Access token is required' });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token });
        const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

        // Get spreadsheet metadata
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: sheetId
        });

        const firstSheet = metadata.data.sheets?.[0];
        const sheetName = firstSheet?.properties?.title || 'Sheet1';

        // Fetch all data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${sheetName}!A1:ZZ`
        });

        const rows = response.data.values || [];
        const headers = rows[0];
        const dataRows = rows.slice(1);

        // Convert to dataset format
        const dataset = {
            name: datasetName || metadata.data.properties?.title,
            source: 'google_sheets',
            sheetId,
            columns: headers,
            rows: dataRows,
            metadata: {
                sheetName,
                totalRows: dataRows.length,
                importedAt: new Date().toISOString()
            }
        };

        // TODO: Store in Supabase datasets table
        // For now, return the processed data
        res.json({
            success: true,
            dataset
        });
    } catch (error) {
        console.error('Error importing sheet:', error);
        res.status(500).json({ error: 'Failed to import sheet data' });
    }
};

/**
 * Infer data type from column values
 */
function inferDataType(values: any[]): 'string' | 'number' | 'date' | 'boolean' {
    if (values.length === 0) return 'string';

    const sample = values.slice(0, 20); // Check first 20 values

    // Check if all are numbers
    const allNumbers = sample.every(val => !isNaN(Number(val)) && val !== '');
    if (allNumbers) return 'number';

    // Check if all are booleans
    const allBooleans = sample.every(val =>
        val.toLowerCase() === 'true' || val.toLowerCase() === 'false' ||
        val === '1' || val === '0'
    );
    if (allBooleans) return 'boolean';

    // Check if all are dates
    const allDates = sample.every(val => !isNaN(Date.parse(val)));
    if (allDates) return 'date';

    return 'string';
}
