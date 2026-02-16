import { parseFile } from './fileParser';

export interface ExtractionResult {
    id: string;
    file: File;
    result: any;
    status: 'review' | 'success';
}

/**
 * Simulates a database connection and table extraction.
 * In a production environment, this would call a backend endpoint that performs the SQL query
 * and streams the result back as a CSV/JSON blob.
 */
export async function connectAndExtract(connectorId: string, config: any): Promise<ExtractionResult> {
    console.log(`[DatabaseService] Connecting to ${connectorId}...`, config);

    // 1. Simulating connection and extraction latency
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 2. Generate mock "extracted" CSV content
    let csvContent = '';
    let tableName = '';

    if (connectorId === 'postgres' || connectorId === 'supabase' || connectorId === 'mysql' || connectorId === 'sqlserver') {
        csvContent = `id,customer_name,email,plan,signup_date,last_active,total_spend,status
1,Enterprise Corp,admin@enterprisecorp.com,Pro,2023-05-12,2024-02-10,45000.00,Active
2,Startup Inc,founder@startup.io,Basic,2023-11-01,2024-02-12,1200.50,Active
3,Individual User,user@gmail.com,Free,2024-01-05,2024-01-20,0.00,Churned
4,Global Logistics,ops@globallog.net,Enterprise,2022-08-14,2024-02-11,280000.00,Active
5,Retail Solutions,billing@retailsol.com,Pro,2023-09-22,2024-02-09,15600.75,Active
6,Creative Studio,hello@creativestudio.com,Basic,2023-12-10,2024-02-12,2400.00,Active
7,Tech Innovators,dev@techin.io,Enterprise,2023-01-30,2024-02-10,125000.00,Active`;
        tableName = `${config.database || 'public'}.customers`;
    } else if (connectorId === 'snowflake' || connectorId === 'bigquery' || connectorId === 'databricks') {
        let sourceName = '';
        if (connectorId === 'bigquery') sourceName = config['Project ID'] || 'gbq-research-prod';
        else if (connectorId === 'snowflake') sourceName = config['Account'] || 'snowflake-enterprise';
        else sourceName = config['Server Hostname'] || 'databricks-workspace';

        csvContent = `event_id,timestamp,user_id,event_type,platform,session_duration,is_converted,revenue
ev_9021,2024-02-12 10:00:00,u_101,page_view,Web,120,false,0.00
ev_9022,2024-02-12 10:05:00,u_101,add_to_cart,Web,45,false,0.00
ev_9023,2024-02-12 10:10:00,u_101,purchase,Web,300,true,149.99
ev_9024,2024-02-12 11:00:00,u_552,page_view,iOS,80,false,0.00
ev_9025,2024-02-12 11:15:00,u_552,search,iOS,200,false,0.00
ev_9026,2024-02-12 11:20:00,u_552,page_view,iOS,45,false,0.00
ev_9027,2024-02-12 11:25:00,u_303,purchase,Android,600,true,89.50`;

        const schema = config.Schema || config.Catalog || 'ANALYTICS';
        const table = connectorId === 'databricks' ? 'EVENTS_STREAM' : 'EVENTS_JSON';
        tableName = `${sourceName}.${schema}.PUBLIC.${table}`;
    } else {
        csvContent = `id,sensor_name,reading,unit,timestamp
1,Temp_01,22.5,Celsius,2024-02-12T12:00:00Z
2,Temp_01,22.7,Celsius,2024-02-12T12:01:00Z
3,Humid_01,45.2,%,2024-02-12T12:00:00Z
4,Humid_01,44.9,%,2024-02-12T12:01:00Z`;
        tableName = `sensor_data_dump`;
    }

    const fileName = `${connectorId}_${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
    const virtualFile = new File([csvContent], fileName, { type: 'text/csv' });

    // 3. Run the extraction through the existing file analysis engine
    const parsingResult = await parseFile(virtualFile);

    return {
        id: Math.random().toString(36).substring(7),
        file: virtualFile,
        result: parsingResult,
        status: 'success'
    };
}
