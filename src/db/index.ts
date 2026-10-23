import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

declare global {
  var _postgresPool: InstanceType<typeof Pool> | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const host = process.env.INSTANCE_CONNECTION_NAME
      ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
      : process.env.SQL_HOST;

    const poolConfig: pg.PoolConfig = {
      host: host,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: parseInt(process.env.SQL_MAX_CONNECTIONS || '10', 10),
      connectionTimeoutMillis: 15000,
    };

    if (process.env.SQL_PORT && !host?.startsWith('/cloudsql/')) {
      poolConfig.port = parseInt(process.env.SQL_PORT, 10);
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err: any) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
