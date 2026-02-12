export interface ConnectorInfo {
    id: string;
    name: string;
    description: string;
    logo: string;
    setupTitle: string;
    setupDescription: string;
    fields: string[];
}

export const CONNECTORS_INFO: Record<string, ConnectorInfo> = {
    'postgres': {
        id: 'postgres',
        name: 'Postgres',
        description: 'Connect your Postgres data for instant AI analysis',
        logo: 'https://www.vectorlogo.zone/logos/postgresql/postgresql-icon.svg',
        setupTitle: 'Configure a connector to analyze your Postgres data with DataIQ.',
        setupDescription: "You'll need a host, port, database name, and credentials. IP whitelisting is optional. Your credentials are encrypted and never stored in plain text.",
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database']
    },
    'supabase': {
        id: 'supabase',
        name: 'Supabase',
        description: 'Direct connection to your Supabase projects',
        logo: 'https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg',
        setupTitle: 'Connect your Supabase project to DataIQ.',
        setupDescription: "Provide your database host, name, and credentials. Ensure your database is accessible (check IP settings if needed).",
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database']
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
        fields: ['Connection Name', 'Username', 'Password', 'Host', 'Port', 'Database']
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
