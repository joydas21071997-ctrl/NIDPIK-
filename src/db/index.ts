import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

declare global {
  var _postgresPool: InstanceType<typeof Pool> | undefined;
}

export interface ResolvedDbConfig {
  host: string | undefined;
  user: string | undefined;
  password: string | undefined;
  database: string;
  port?: number;
  isSocket: boolean;
}

export function getResolvedDbConfig(): ResolvedDbConfig {
  const rawInstanceConn = process.env.INSTANCE_CONNECTION_NAME?.trim();
  const rawSqlHost = process.env.SQL_HOST?.trim();

  // Prefer AI Studio's mounted socket when running inside the AI Studio preview container
  let host: string | undefined;
  if (rawSqlHost?.startsWith('/app/cloudsql/')) {
    host = rawSqlHost;
  } else if (rawInstanceConn) {
    host = rawInstanceConn.startsWith('/cloudsql/')
      ? rawInstanceConn
      : `/cloudsql/${rawInstanceConn}`;
  } else {
    host = rawSqlHost;
  }

  // In the AI Studio preview environment (/app/cloudsql/*), SQL_ADMIN_USER is injected by the platform.
  // On Cloud Run, SQL_USER and SQL_PASSWORD are used.
  const useAiStudioAdmin = Boolean(
    rawSqlHost?.startsWith('/app/cloudsql/') &&
    process.env.SQL_ADMIN_USER &&
    process.env.SQL_ADMIN_PASSWORD
  );

  const user = (useAiStudioAdmin ? process.env.SQL_ADMIN_USER : process.env.SQL_USER)?.trim();
  const password = (useAiStudioAdmin ? process.env.SQL_ADMIN_PASSWORD : process.env.SQL_PASSWORD)?.trim();
  const database = (process.env.SQL_DB_NAME || 'cloud_sql_development_database').trim();
  const isSocket = Boolean(host?.startsWith('/'));

  let port: number | undefined;
  if (process.env.SQL_PORT && !isSocket) {
    const parsed = parseInt(process.env.SQL_PORT.trim(), 10);
    if (!Number.isNaN(parsed)) {
      port = parsed;
    }
  }

  return {
    host,
    user,
    password,
    database,
    port,
    isSocket,
  };
}

export const createPool = () => {
  if (!global._postgresPool) {
    const resolved = getResolvedDbConfig();

    const poolConfig: pg.PoolConfig = {
      host: resolved.host,
      user: resolved.user,
      password: resolved.password,
      database: resolved.database,
      max: parseInt(process.env.SQL_MAX_CONNECTIONS || '10', 10),
      connectionTimeoutMillis: 15000,
    };

    if (resolved.port && !resolved.isSocket) {
      poolConfig.port = resolved.port;
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err: any) => {
      console.error('Unexpected error on idle SQL pool client:', err?.code || err?.message || err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
