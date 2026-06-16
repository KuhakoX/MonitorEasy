import cors from "cors";
import express from "express";
import rotasUsuarios from "../routes/rotasUsuarios.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", rotasUsuarios);

app.listen(PORT, () => {
  console.log(`API MonitorEasy rodando em http://localhost:${PORT}`);
});
