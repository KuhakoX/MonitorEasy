import express from "express";

import {
  cadastrarUsuario,
  loginUsuario,
  listarMonitores,
  listarUsuarios,
} from "../controller/usuarioController.js";

const router = express.Router();

router.post("/cadastro", cadastrarUsuario);
router.post("/login", loginUsuario);
router.get("/usuarios", listarUsuarios);
router.get("/monitores", listarMonitores);

export default router;
