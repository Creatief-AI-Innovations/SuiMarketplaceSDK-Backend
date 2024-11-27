import mysql, { Pool, PoolConfig, PoolConnection, escape } from 'promise-mysql';
import { ConnectionConfig } from 'mysql';
import dotenv from 'dotenv';
  
dotenv.config();

interface DatabaseConfig extends ConnectionConfig {
  user: string;
  password: string;
  database: string;
  host: string;
  socketPath?: string;
}

class Database {
  private static pool: Pool | undefined;
  private static config: DatabaseConfig;
  private static poolConfig: PoolConfig = {
    connectionLimit: 10,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    waitForConnections: true,
    queueLimit: 0,
  };

  private static validateConfig(): DatabaseConfig {
    const requiredKeys = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);

    if (missingKeys.length) {
      throw new Error(
        `Missing required environment variables: ${missingKeys.join(', ')}`,
      );
    }

    // Need either DB_HOST or DB_SOCKET_PATH
    if (!process.env.DB_HOST && !process.env.DB_SOCKET_PATH) {
      throw new Error(
        'Missing required environment variables: DB_HOST or DB_SOCKET_PATH',
      );
    }

    return {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      host: process.env.DB_HOST!,
      socketPath: process.env.DB_SOCKET_PATH,
      charset: 'utf8mb4',
    };
  }

  private static async createPool(): Promise<Pool> {
    this.config = this.validateConfig();
    return mysql.createPool({
      ...this.config,
      ...this.poolConfig,
    });
  }

  public static async getPool(): Promise<Pool> {
    if (!this.pool) {
      this.pool = await this.createPool();
    }
    return this.pool;
  }

  public static async query<T = any>(
    sql: string,
    params?: any[],
    connection?: PoolConnection,
  ): Promise<T> {
    try {
      const pool = await this.getPool();
      const conn = connection || pool;
      //Escape only strings
      const escapedParams = params?.map((param) =>
        typeof param === 'string' ? param.replace(/'/g, "''") : param,
      );
      return await conn.query(sql, escapedParams);
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${(error as Error).message}`);
    }
  }


  public static async queryAndClose<T = any>(
    sql: string,
    params?: any[],
  ): Promise<T> {
    const pool = await this.getPool();
    const connection = await pool.getConnection();

    try {
      // escapedParams : escape single quotes if exists
      const escapedParams = params?.map((param) =>
        typeof param === 'string' ? param.replace(/'/g, "''") : param,
      );

      const result = await connection.query<T>(sql, escapedParams);
      connection.release(); // Release connection instead of closing the pool
      return result;
    } catch (error) {
      connection.release(); // Ensure connection is released on error as well
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${(error as Error).message}`);
    }
  }

  public static async testConnection(): Promise<void> {
    try {
      const pool = await this.getPool();
      await pool.query('SELECT 1');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection test failed:', error);
      throw new Error('Database connection test failed');
    }
  }

  public static async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('Database pool closed');
      this.pool = undefined; // Reset the pool reference
    }
  }

  // Transaction Methods
  public static async beginTransaction(
    connection: PoolConnection,
  ): Promise<void> {
    try {
      await connection.beginTransaction();
    } catch (error) {
      console.error('Failed to begin transaction:', error);
      throw new Error('Failed to begin transaction');
    }
  }

  public static async commitTransaction(
    connection: PoolConnection,
  ): Promise<void> {
    try {
      await connection.commit();
    } catch (error) {
      console.error('Failed to commit transaction:', error);
      throw new Error('Failed to commit transaction');
    }
  }

  public static async rollbackTransaction(
    connection: PoolConnection,
  ): Promise<void> {
    try {
      await connection.rollback();
    } catch (error) {
      console.error('Failed to rollback transaction:', error);
      throw new Error('Failed to rollback transaction');
    }
  }

  // Transaction handler
  public static async transaction(
    queries: Array<(connection: PoolConnection) => Promise<any>>,
  ): Promise<any[]> {
    const pool = await this.getPool();
    const connection = await pool.getConnection();
    const results: any[] = [];

    try {
      await this.beginTransaction(connection);

      for (const query of queries) {
        results.push(await query(connection));
      }

      await this.commitTransaction(connection);
    } catch (error) {
      await this.rollbackTransaction(connection);
      console.error('Transaction error:', error);
      throw new Error(`Transaction failed: ${(error as Error).message}`);
    } finally {
      connection.release();
    }

    return results;
  }
}

export default Database;
