import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL nao foi definida para conectar ao Supabase.");
}

const db = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

db.on("error", (error) => {
  console.error("Erro inesperado no pool PostgreSQL:", error);
});

export default db;
