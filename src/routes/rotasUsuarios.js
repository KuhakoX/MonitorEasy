import express from "express";

import {
  buscarMonitor,
  buscarSessao,
  baixarMaterialMonitor,
  buscarConfiguracoesUsuario,
  cadastrarAulaMonitor,
  cadastrarUsuario,
  confirmarMaterialMonitor,
  criarAvaliacaoMonitor,
  criarMaterialMonitor,
  editarAulaMonitor,
  editarAvaliacaoMonitor,
  excluirAvaliacaoMonitor,
  excluirAulaMonitor,
  excluirMaterialMonitor,
  loginUsuario,
  listarAvaliacoesMonitor,
  logoutUsuario,
  listarMateriaisMonitor,
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
router.get(
  "/monitores/:id/materiais",
  exigirAutenticacao,
  listarMateriaisMonitor,
);
router.post(
  "/monitores/:id/materiais",
  verificarOrigem,
  exigirAutenticacao,
  criarMaterialMonitor,
);
router.post(
  "/monitores/:id/materiais/:materialId/confirm",
  verificarOrigem,
  exigirAutenticacao,
  confirmarMaterialMonitor,
);
router.get(
  "/monitores/:id/materiais/:materialId/download",
  exigirAutenticacao,
  baixarMaterialMonitor,
);
router.delete(
  "/monitores/:id/materiais/:materialId",
  verificarOrigem,
  exigirAutenticacao,
  excluirMaterialMonitor,
);
router.get(
  "/monitores/:id/avaliacoes",
  exigirAutenticacao,
  listarAvaliacoesMonitor,
);
router.post(
  "/monitores/:id/avaliacoes",
  verificarOrigem,
  exigirAutenticacao,
  criarAvaliacaoMonitor,
);
router.put(
  "/monitores/:id/avaliacoes/:avaliacaoId",
  verificarOrigem,
  exigirAutenticacao,
  editarAvaliacaoMonitor,
);
router.delete(
  "/monitores/:id/avaliacoes/:avaliacaoId",
  verificarOrigem,
  exigirAutenticacao,
  excluirAvaliacaoMonitor,
);
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
