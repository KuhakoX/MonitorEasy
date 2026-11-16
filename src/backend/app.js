import "dotenv/config";
import cors from "cors";
import express from "express";
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
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
