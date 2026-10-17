import {
  createUsuario,
  createAulaMonitor,
  getAulasMonitor,
  alterarSenhaUsuario,
  atualizarConfiguracoesUsuario,
  getConfiguracoesUsuario,
  findUsuarioByEmail,
  getAllUsuarios,
  getMonitorById,
  getMonitores,
  verifyPassword,
} from "../models/usuarioModel.js";

function validarMeetLink(valor) {
  if (typeof valor !== "string" || !valor.trim()) {
    return "";
  }

  const link = valor.trim();
  const linkComProtocolo = /^https?:\/\//i.test(link)
    ? link
    : `https://${link}`;

  try {
    const url = new URL(linkComProtocolo);

    if (url.hostname.toLowerCase() !== "meet.google.com") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function validarIdUsuario(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

export async function cadastrarUsuario(req, res) {
  try {
    const { nome, email, senha, tipoUsuario } = req.body;
    const tipoNormalizado =
      typeof tipoUsuario === "string" ? tipoUsuario.trim().toLowerCase() : "";

    if (!nome || !email || !senha || !tipoUsuario) {
      return res.status(400).json({
        error: "Preencha todos os campos.",
      });
    }

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      nome.trim().length > 100 ||
      typeof email !== "string" ||
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof senha !== "string" ||
      !["aluno", "monitor"].includes(tipoNormalizado)
    ) {
      return res.status(400).json({
        error: "Confira os dados informados.",
      });
    }

    const usuarioExiste = await findUsuarioByEmail(email);

    if (usuarioExiste) {
      return res.status(400).json({
        error: "Este email ja esta cadastrado.",
      });
    }

    const usuario = await createUsuario(nome, email, senha, tipoUsuario);

    if (!usuario) {
      return res.status(400).json({
        error: "Este email ja esta cadastrado.",
      });
    }

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

export async function buscarConfiguracoesUsuario(req, res) {
  try {
    if (!validarIdUsuario(req.params.id)) {
      return res.status(400).json({ error: "Usuario invalido." });
    }

    const configuracoes = await getConfiguracoesUsuario(req.params.id);

    if (!configuracoes) {
      return res.status(404).json({ error: "Usuario nao encontrado." });
    }

    return res.status(200).json(configuracoes);
  } catch (error) {
    console.error("Erro ao buscar configuracoes do usuario:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function salvarConfiguracoesUsuario(req, res) {
  try {
    const { nome, biografia, materias, meetLink } = req.body;

    if (!validarIdUsuario(req.params.id)) {
      return res.status(400).json({ error: "Usuario invalido." });
    }

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      nome.trim().length > 100 ||
      typeof biografia !== "string" ||
      biografia.length > 2000 ||
      (typeof meetLink === "string" && meetLink.length > 500)
    ) {
      return res.status(400).json({
        error: "Confira o nome e a biografia informados.",
      });
    }

    if (
      materias !== undefined &&
      (!Array.isArray(materias) ||
        materias.length > 30 ||
        materias.some(
          (materia) =>
            typeof materia !== "string" ||
            !materia.trim() ||
            materia.trim().length > 100,
        ))
    ) {
      return res.status(400).json({ error: "Confira a lista de materias." });
    }

    const meetNormalizado = validarMeetLink(meetLink);

    if (meetNormalizado === null) {
      return res.status(400).json({
        error: "Informe um link valido do Google Meet.",
      });
    }

    const resultado = await atualizarConfiguracoesUsuario(req.params.id, {
      nome: nome.trim(),
      biografia: biografia.trim(),
      materias: (materias || []).map((materia) => materia.trim()),
      meetLink: meetNormalizado || null,
    });

    if (!resultado.encontrado) {
      return res.status(404).json({ error: "Usuario nao encontrado." });
    }

    return res.status(200).json({ message: "Configuracoes salvas." });
  } catch (error) {
    console.error("Erro ao salvar configuracoes do usuario:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}

export async function trocarSenhaUsuario(req, res) {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!validarIdUsuario(req.params.id)) {
      return res.status(400).json({ error: "Usuario invalido." });
    }

    if (
      typeof senhaAtual !== "string" ||
      !senhaAtual ||
      typeof novaSenha !== "string" ||
      !novaSenha.trim()
    ) {
      return res.status(400).json({
        error: "Informe a senha atual e a nova senha.",
      });
    }

    if (senhaAtual === novaSenha) {
      return res.status(400).json({
        error: "A nova senha deve ser diferente da senha atual.",
      });
    }

    const resultado = await alterarSenhaUsuario(
      req.params.id,
      senhaAtual,
      novaSenha,
    );

    if (!resultado.encontrado) {
      return res.status(404).json({ error: "Usuario nao encontrado." });
    }

    if (resultado.senhaInvalida) {
      return res.status(401).json({ error: "A senha atual esta incorreta." });
    }

    return res.status(200).json({ message: "Senha alterada com sucesso." });
  } catch (error) {
    console.error("Erro ao trocar senha do usuario:", error);

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

    if (!(await verifyPassword(senha, usuario.senha))) {
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

    const aulaCriada = await createAulaMonitor(req.params.id, data, hora);

    if (!aulaCriada) {
      return res.status(400).json({
        error: "Este monitor ainda nao possui agenda configurada.",
      });
    }

    const aulas = await getAulasMonitor(req.params.id);

    return res.status(201).json(aulas);
  } catch (error) {
    console.error("Erro ao cadastrar aula:", error);

    return res.status(500).json({
      error: "Erro interno no servidor.",
    });
  }
}
