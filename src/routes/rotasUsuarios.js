import express from "express";

import {
  cadastrarUsuario,
  loginUsuario,
  listarUsuarios,
} from "../controllers/usuarioController.js";

const router = express.Router();

router.post("/cadastro", cadastrarUsuario);
router.post("/login", loginUsuario);
router.get("/usuarios", listarUsuarios);

export default router;