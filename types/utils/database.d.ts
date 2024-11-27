import { Pool, PoolConnection } from 'promise-mysql';
declare class Database {
    private static pool;
    private static config;
    private static poolConfig;
    private static validateConfig;
    private static createPool;
    static getPool(): Promise<Pool>;
    static query<T = any>(sql: string, params?: any[], connection?: PoolConnection): Promise<T>;
    static queryAndClose<T = any>(sql: string, params?: any[]): Promise<T>;
    static testConnection(): Promise<void>;
    static closePool(): Promise<void>;
    static beginTransaction(connection: PoolConnection): Promise<void>;
    static commitTransaction(connection: PoolConnection): Promise<void>;
    static rollbackTransaction(connection: PoolConnection): Promise<void>;
    static transaction(queries: Array<(connection: PoolConnection) => Promise<any>>): Promise<any[]>;
}
export default Database;
//# sourceMappingURL=database.d.ts.map