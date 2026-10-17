import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const supabaseCaCert = process.env.SUPABASE_CA_CERT?.replace(/\\n/g, "\n").trim();

if (!connectionString) {
  throw new Error("DATABASE_URL nao foi definida para conectar ao Supabase.");
}

const poolConfig = {
  connectionString,
  max: process.env.VERCEL ? 1 : 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
};

if (supabaseCaCert) {
  const connectionUrl = new URL(connectionString);
  connectionUrl.searchParams.delete("sslmode");
  connectionUrl.searchParams.delete("sslrootcert");
  poolConfig.connectionString = connectionUrl.toString();
  poolConfig.ssl = {
    ca: supabaseCaCert,
    rejectUnauthorized: true,
  };
}

const db = new Pool(poolConfig);

db.on("error", (error) => {
  console.error("Erro inesperado no pool PostgreSQL:", error);
});

export default db;
