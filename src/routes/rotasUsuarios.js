import express from "express";

import {
  buscarMonitor,
  buscarConfiguracoesUsuario,
  cadastrarAulaMonitor,
  cadastrarUsuario,
  loginUsuario,
  salvarConfiguracoesUsuario,
  trocarSenhaUsuario,
  listarAulasMonitor,
  listarMonitores,
  listarUsuarios,
} from "../controller/usuarioController.js";

const router = express.Router();

router.post("/cadastro", cadastrarUsuario);
router.post("/login", loginUsuario);
router.get("/usuarios/:id/configuracoes", buscarConfiguracoesUsuario);
router.put("/usuarios/:id/configuracoes", salvarConfiguracoesUsuario);
router.patch("/usuarios/:id/senha", trocarSenhaUsuario);
router.get("/usuarios", listarUsuarios);
router.get("/monitores", listarMonitores);
router.get("/monitores/:id", buscarMonitor);
router.get("/monitores/:id/aulas", listarAulasMonitor);
router.post("/monitores/:id/aulas", cadastrarAulaMonitor);

export default router;
