import "dotenv/config";
import cors from "cors";
import express from "express";
import rotasUsuarios from "../routes/rotasUsuarios.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", rotasUsuarios);

export default app;
