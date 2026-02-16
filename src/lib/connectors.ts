export interface ConnectorInfo {
    id: string;
    name: string;
    description: string;
    logo: string;
    setupTitle: string;
    setupDescription: string;
    fields: string[];
    placeholders?: Record<string, string>;
}

export const CONNECTORS_INFO: Record<string, ConnectorInfo> = {
    'postgres': {
        id: 'postgres',
        name: 'Postgres',
        description: 'Connect your Postgres data for instant AI analysis',
        logo: 'https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg',
        setupTitle: 'Configure a connector to analyze your Postgres data with DataIQ.',
        setupDescription: "You'll need a host, port, database name, and credentials. IP whitelisting is optional. Your credentials are encrypted and never stored in plain text.",
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database'],
        placeholders: {
            'Connection Name': 'My PostgreSQL Database',
            'Username': 'postgres',
            'Password': 'Enter your password',
            'Host': 'localhost or db.example.com',
            'Port': '5432',
            'Database': 'mydb'
        }
    },
    'supabase': {
        id: 'supabase',
        name: 'Supabase',
        description: 'Direct connection to your Supabase projects',
        logo: 'https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg',
        setupTitle: 'Connect your Supabase project to DataIQ.',
        setupDescription: "Connects via Supabase Database Credentials (found in Project Settings > Database). Required for Schema Access.",
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database'],
        placeholders: {
            'Connection Name': 'My Supabase Project',
            'Username': 'postgres',
            'Password': 'Your database password',
            'Host': 'db.xyz.supabase.co',
            'Port': '5432 or 6543',
            'Database': 'postgres'
        }
    },
    'vertica': {
        id: 'vertica',
        name: 'Vertica',
        description: 'Enterprise analytics database connection',
        logo: '/logos/vertica.svg',
        setupTitle: 'Configure a connector to analyze your Vertica data with DataIQ.',
        setupDescription: "Enterprise Vertica connection details required. Optimized for large-scale analytical workloads.",
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database']
    },
    'mysql': {
        id: 'mysql',
        name: 'MySQL',
        description: 'Connect your MySQL data for instant AI analysis',
        logo: 'https://cdn.simpleicons.org/mysql/4479A1',
        setupTitle: 'Configure a connector to analyze your MySQL data with DataIQ.',
        setupDescription: "Standard MySQL connection details required. Your data remains secure with enterprise-grade encryption.",
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database'],
        placeholders: {
            'Connection Name': 'My MySQL Database',
            'Username': 'root',
            'Password': 'Enter your password',
            'Host': 'localhost or mysql.example.com',
            'Port': '3306',
            'Database': 'mydb'
        }
    },
    'sqlserver': {
        id: 'sqlserver',
        name: 'SQL Server',
        description: 'Connect your SqlServer data for instant AI analysis',
        logo: '/logos/sqlserver.svg',
        setupTitle: 'Configure a connector to analyze your SQL Server data with DataIQ.',
        setupDescription: "Microsoft SQL Server connection details required. Ensure the database allows remote connections.",
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database']
    },
    'mongodb': {
        id: 'mongodb',
        name: 'MongoDB',
        description: 'NoSQL document-based database connection',
        logo: 'https://www.vectorlogo.zone/logos/mongodb/mongodb-icon.svg',
        setupTitle: 'Configure a connector to analyze your MongoDB data with DataIQ.',
        setupDescription: "Connection string or individual parameters required. DataIQ handles BSON to JSON transformation automatically.",
        fields: ['Connection Name', 'Connection String', 'Database']
    },
    'bigquery': {
        id: 'bigquery',
        name: 'BigQuery',
        description: 'Connect your BigQuery data for instant AI analysis',
        logo: 'https://www.vectorlogo.zone/logos/google_bigquery/google_bigquery-icon.svg',
        setupTitle: 'Configure a connector to analyze your BigQuery data with DataIQ.',
        setupDescription: "Service account credentials (JSON) and project ID required for integration.",
        fields: ['Connection Name', 'Project ID', 'Client Email', 'Private Key']
    },
    'snowflake': {
        id: 'snowflake',
        name: 'Snowflake',
        description: 'Data warehouse connection for massive datasets',
        logo: 'https://www.vectorlogo.zone/logos/snowflake/snowflake-icon.svg',
        setupTitle: 'Configure a connector to analyze your Snowflake data with DataIQ.',
        setupDescription: "Account URL and credentials required. Optimized for high-performance enterprise analytics.",
        fields: ['Connection Name', 'Account Name', 'Username', 'Password', 'Warehouse', 'Database', 'Schema']
    },
    'gdrive': {
        id: 'gdrive',
        name: 'Google Drive',
        description: 'Connect your Google Drive files for instant AI analysis',
        logo: 'https://www.vectorlogo.zone/logos/google_drive/google_drive-icon.svg',
        setupTitle: 'Connect your Google Drive to DataIQ.',
        setupDescription: "Authorize DataIQ to access your Google Sheets and Drive files. We only access files you explicitly share with us.",
        fields: []
    },
    'google-sheets': {
        id: 'google-sheets',
        name: 'Google Sheets',
        description: 'Live connection to your Google Sheets',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg',
        setupTitle: 'Connect Google Workspace to DataIQ.',
        setupDescription: "Authorize once to access Google Sheets, Drive, and Ads data. OAuth 2.0 secured.",
        fields: []
    },
    'gads': {
        id: 'gads',
        name: 'Google Ads',
        description: 'Analyze your Google Ads campaigns and performance data',
        logo: 'https://www.vectorlogo.zone/logos/google_ads/google_ads-icon.svg',
        setupTitle: 'Connect Google Ads to DataIQ.',
        setupDescription: "Authorize DataIQ to access your Google Ads account data. Analyze campaigns, keywords, and conversions.",
        fields: []
    }
};

export const getConnectorLogo = (method: string) => {
    if (!method) return null;

    const searchStr = method.toLowerCase();

    // 1. Direct ID match or "Database: id"
    if (method.startsWith('Database:')) {
        const id = method.replace('Database:', '').trim().toLowerCase();
        if (CONNECTORS_INFO[id]) return CONNECTORS_INFO[id].logo;
    }

    // 2. Fuzzy match against all connector names and IDs
    const match = Object.values(CONNECTORS_INFO).find(c =>
        searchStr.includes(c.id.toLowerCase()) ||
        searchStr.includes(c.name.toLowerCase())
    );

    return match ? match.logo : null;
};
