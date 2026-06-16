import {
  createUsuario,
  createAulaMonitor,
  getAulasMonitor,
  findUsuarioByEmail,
  getAllUsuarios,
  getMonitorById,
  getMonitores,
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
        error: "Este email ja esta cadastrado.",
      });
    }

    await createUsuario(nome, email, senha, tipoUsuario);

    return res.status(201).json({
      message: "Usuario cadastrado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuario:", error);

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
        error: "Usuario nao encontrado.",
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
        tipoUsuario: usuario.tipoUsuario,
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
    console.error("Erro ao listar usuarios:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function listarMonitores(req, res) {
  try {
    const monitores = await getMonitores();

    return res.status(200).json(monitores);
  } catch (error) {
    console.error("Erro ao listar monitores:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function buscarMonitor(req, res) {
  try {
    const monitor = await getMonitorById(req.params.id);

    if (!monitor) {
      return res.status(404).json({
        error: "Monitor nao encontrado.",
      });
    }

    return res.status(200).json(monitor);
  } catch (error) {
    console.error("Erro ao buscar monitor:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function listarAulasMonitor(req, res) {
  try {
    const aulas = await getAulasMonitor(req.params.id);

    return res.status(200).json(aulas);
  } catch (error) {
    console.error("Erro ao listar aulas:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function cadastrarAulaMonitor(req, res) {
  try {
    const { data, hora } = req.body;

    if (!data || !hora) {
      return res.status(400).json({
        error: "Selecione uma data e um horario.",
      });
    }

    const monitor = await getMonitorById(req.params.id);

    if (!monitor) {
      return res.status(404).json({
        error: "Monitor nao encontrado.",
      });
    }

    await createAulaMonitor(req.params.id, data, hora);
    const aulas = await getAulasMonitor(req.params.id);

    return res.status(201).json(aulas);
  } catch (error) {
    console.error("Erro ao cadastrar aula:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}
