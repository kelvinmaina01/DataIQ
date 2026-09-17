
import { google } from 'googleapis';
import type { Request, Response } from 'express';

// Initialize OAuth2 client (reusing env vars from googleSheets.ts logic)
// Initialize OAuth2 client lazily
const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.VITE_GOOGLE_CLIENT_ID,
        process.env.VITE_GOOGLE_CLIENT_SECRET,
        process.env.VITE_GOOGLE_REDIRECT_URI
    );
};

/**
 * List files in Google Drive
 * GET /api/integrations/google/drive/list
 */
export const listDriveFiles = async (req: Request, res: Response) => {
    const { access_token } = req.query;

    if (!access_token || typeof access_token !== 'string') {
        return res.status(401).json({ error: 'Access token is required' });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const response = await drive.files.list({
            pageSize: 50,
            fields: 'nextPageToken, files(id, name, mimeType, owners, modifiedTime, iconLink, webViewLink, size)',
            orderBy: 'modifiedTime desc'
        });

        const files = response.data.files || [];
        res.json({ files });
    } catch (error) {
        console.error('Error listing drive files:', error);
        res.status(500).json({ error: 'Failed to list Drive files' });
    }
};

/**
 * Get file metadata "schema"
 * GET /api/integrations/google/drive/:fileId/schema
 */
export const getDriveFileSchema = async (req: Request, res: Response) => {
    const { fileId } = req.params;
    const { access_token } = req.query;

    if (!access_token || typeof access_token !== 'string') {
        return res.status(401).json({ error: 'Access token is required' });
    }

    try {
        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({ access_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const response = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size, createdTime, modifiedTime, owners, parents'
        });

        const file = response.data;

        // Construct a "schema" based on file properties
        // For non-tabular files, the schema is the metadata structure itself
        const schema = [
            { name: 'File Name', type: 'string', value: file.name },
            { name: 'File Type', type: 'string', value: file.mimeType },
            { name: 'Size', type: 'number', value: file.size },
            { name: 'Created', type: 'date', value: file.createdTime },
            { name: 'Modified', type: 'date', value: file.modifiedTime },
            { name: 'Owner', type: 'string', value: file.owners?.[0]?.emailAddress }
        ];

        res.json({
            schema,
            metadata: file
        });
    } catch (error) {
        console.error('Error fetching file schema:', error);
        res.status(500).json({ error: 'Failed to fetch file metadata' });
    }
};
