import {
  createUsuario,
  findUsuarioByEmail,
  getAllUsuarios,
} from "../models/usuarioModel.js";

export async function cadastrarUsuario(req, res) {
  try {
    const { nome, email, senha, tipoUsuario } = req.body;

    if (!nome || !email || !senha || !tipoUsuario) {
      return res.status(400).json({
        error: "Preencha todos os campos.",
      });
    }

    const usuarioExiste = await findUsuarioByEmail(email);

    if (usuarioExiste) {
      return res.status(400).json({
        error: "Este email já está cadastrado.",
      });
    }

    await createUsuario(nome, email, senha, tipoUsuario);

    return res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function loginUsuario(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        error: "Preencha email e senha.",
      });
    }

    const usuario = await findUsuarioByEmail(email);

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado.",
      });
    }

    if (senha !== usuario.senha) {
      return res.status(401).json({
        error: "Email ou senha incorretos.",
      });
    }

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipoUsuario: usuario.tipo_usuario,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function listarUsuarios(req, res) {
  try {
    const usuarios = await getAllUsuarios();

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}