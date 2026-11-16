import express from "express";

import {
  buscarMonitor,
  buscarSessao,
  buscarConfiguracoesUsuario,
  cadastrarAulaMonitor,
  cadastrarUsuario,
  editarAulaMonitor,
  excluirAulaMonitor,
  loginUsuario,
  logoutUsuario,
  salvarConfiguracoesUsuario,
  trocarSenhaUsuario,
  listarAulasMonitor,
  listarMonitores,
  listarUsuarios,
} from "../controller/usuarioController.js";
import { exigirAutenticacao, verificarOrigem } from "../backend/auth.js";

const router = express.Router();

router.post("/cadastro", cadastrarUsuario);
router.post("/login", verificarOrigem, loginUsuario);
router.get("/session", exigirAutenticacao, buscarSessao);
router.post("/logout", verificarOrigem, logoutUsuario);
router.get("/usuarios/:id/configuracoes", buscarConfiguracoesUsuario);
router.put("/usuarios/:id/configuracoes", salvarConfiguracoesUsuario);
router.patch("/usuarios/:id/senha", trocarSenhaUsuario);
router.get("/usuarios", listarUsuarios);
router.get("/monitores", listarMonitores);
router.get("/monitores/:id", buscarMonitor);
router.get("/monitores/:id/aulas", exigirAutenticacao, listarAulasMonitor);
router.post(
  "/monitores/:id/aulas",
  verificarOrigem,
  exigirAutenticacao,
  cadastrarAulaMonitor,
);
router.put(
  "/monitores/:id/aulas/:aulaId",
  verificarOrigem,
  exigirAutenticacao,
  editarAulaMonitor,
);
router.delete(
  "/monitores/:id/aulas/:aulaId",
  verificarOrigem,
  exigirAutenticacao,
  excluirAulaMonitor,
);

export default router;
