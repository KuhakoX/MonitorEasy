import "dotenv/config";
import cors from "cors";
import express from "express";
import db from "./bd/db.js";
import rotasUsuarios from "../routes/rotasUsuarios.js";

const app = express();

const origensPermitidas = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(
  cors((req, callback) => {
    const origem = req.headers.origin;

    if (!origem) {
      return callback(null, { origin: false });
    }

    let permitida = origensPermitidas.includes(origem);

    if (!permitida) {
      try {
        permitida = new URL(origem).host === req.headers.host;
      } catch {
        permitida = false;
      }
    }

    return callback(null, {
      origin: permitida ? origem : false,
      credentials: true,
    });
  }),
);
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    return res.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check falhou ao conectar ao PostgreSQL:", error);
    return res.status(503).json({
      status: "error",
      database: "unavailable",
      error: "Banco indisponivel. Confira DATABASE_URL e a conexao do backend.",
    });
  }
});

app.use("/api", rotasUsuarios);

app.use((error, req, res, next) => {
  console.error("Erro nao tratado na API:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({ error: "Erro interno no servidor." });
});

export default app;
