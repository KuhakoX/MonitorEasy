import {
  createUsuario,
  createAulaMonitor,
  deleteAulaMonitor,
  getAulasMonitor,
  alterarSenhaUsuario,
  atualizarConfiguracoesUsuario,
  getConfiguracoesUsuario,
  findUsuarioByEmail,
  getAllUsuarios,
  createMonitorMaterial,
  createMonitorReview,
  deleteMonitorMaterialRecord,
  deleteMonitorReview,
  getMonitorMaterial,
  getMonitorMaterialByProfile,
  getMonitorById,
  getMonitores,
  listMonitorMaterials,
  listMonitorReviews,
  markMonitorMaterialUploaded,
  updateMonitorReview,
  updateAulaMonitor,
  verifyPassword,
} from "../models/usuarioModel.js";
import { criarSessao, encerrarSessao } from "../backend/auth.js";
import {
  baixarConteudoMaterial,
  criarUrlDownloadMaterial,
  criarUrlUploadMaterial,
  detalhesErroStorage,
  materialExiste,
  removerArquivoMaterial,
} from "../backend/storage.js";
import {
  TAMANHO_MAXIMO_MATERIAL,
  validarAssinaturaArquivo,
  validarConteudoMaterial,
  validarDadosArquivo,
} from "../backend/materialValidation.js";
import { randomUUID } from "node:crypto";

function materialPublico(material) {
  const dadosPublicos = { ...material };
  delete dadosPublicos.storagePath;
  delete dadosPublicos.monitorId;
  delete dadosPublicos.arquivoEnviado;
  return dadosPublicos;
}

async function validarPerfilMonitor(req, res) {
  if (!validarIdUsuario(req.params.id)) {
    res.status(400).json({ error: "Monitor invalido." });
    return false;
  }

  const monitor = await getMonitorById(req.params.id);

  if (!monitor) {
    res.status(404).json({ error: "Monitor nao encontrado." });
    return false;
  }

  return true;
}

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

    criarSessao(res, usuario.id);

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

    let mensagemErro = "Erro interno no servidor.";

    if (
      error.message === "SESSION_SECRET deve ter pelo menos 32 caracteres." ||
      error.message === "Defina SESSION_SECRET ou DATABASE_URL para assinar a sessao."
    ) {
      mensagemErro =
        "A sessao de login nao esta configurada. Defina SESSION_SECRET com pelo menos 32 caracteres.";
    } else if (
      error.message === "SESSION_COOKIE_SAME_SITE deve ser Lax, Strict ou None."
    ) {
      mensagemErro =
        "A configuracao SESSION_COOKIE_SAME_SITE deve ser Lax, Strict ou None.";
    }

    return res.status(500).json({
      error: mensagemErro,
    });
  }
}

export async function buscarSessao(req, res) {
  return res.status(200).json({ usuario: req.usuario });
}

export async function logoutUsuario(req, res) {
  encerrarSessao(res);
  return res.status(200).json({ message: "Sessao encerrada." });
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

function validarDataHora(data, hora) {
  if (
    typeof data !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
    Number.isNaN(Date.parse(`${data}T00:00:00Z`)) ||
    new Date(`${data}T00:00:00Z`).toISOString().slice(0, 10) !== data ||
    typeof hora !== "string" ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora)
  ) {
    return false;
  }

  return true;
}

function validarConteudoAula(titulo, descricao) {
  return (
    typeof titulo === "string" &&
    Boolean(titulo.trim()) &&
    titulo.trim().length <= 200 &&
    typeof descricao === "string" &&
    Boolean(descricao.trim()) &&
    descricao.trim().length <= 2000
  );
}

async function verificarDonoDoPerfil(req, res) {
  if (req.usuario.tipoUsuario.trim().toLowerCase() !== "monitor") {
    res.status(403).json({ error: "Somente o monitor pode gerenciar as aulas." });
    return false;
  }

  if (!validarIdUsuario(req.params.id)) {
    res.status(400).json({ error: "Monitor invalido." });
    return false;
  }

  if (Number(req.params.id) !== req.usuario.id) {
    res.status(403).json({ error: "Voce so pode gerenciar as aulas do seu perfil." });
    return false;
  }

  const monitor = await getMonitorById(req.params.id);

  if (!monitor) {
    res.status(404).json({ error: "Monitor nao encontrado." });
    return false;
  }

  return true;
}

export async function cadastrarAulaMonitor(req, res) {
  try {
    const { data, hora, titulo, descricao } = req.body;

    if (!(await verificarDonoDoPerfil(req, res))) {
      return;
    }

    if (!validarDataHora(data, hora) || !validarConteudoAula(titulo, descricao)) {
      return res.status(400).json({
        error: "Informe data, horario, titulo e descricao validos.",
      });
    }

    const aulaCriada = await createAulaMonitor(
      req.params.id,
      data,
      hora,
      titulo.trim(),
      descricao.trim(),
    );

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

export async function editarAulaMonitor(req, res) {
  try {
    const { data, hora, titulo, descricao } = req.body;

    if (!(await verificarDonoDoPerfil(req, res))) {
      return;
    }

    if (!validarIdUsuario(req.params.aulaId)) {
      return res.status(400).json({ error: "Aula invalida." });
    }

    if (!validarDataHora(data, hora) || !validarConteudoAula(titulo, descricao)) {
      return res.status(400).json({
        error: "Informe data, horario, titulo e descricao validos.",
      });
    }

    const aulaAtualizada = await updateAulaMonitor(
      req.params.aulaId,
      req.usuario.id,
      data,
      hora,
      titulo.trim(),
      descricao.trim(),
    );

    if (!aulaAtualizada) {
      return res.status(404).json({ error: "Aula nao encontrada." });
    }

    return res.status(200).json(await getAulasMonitor(req.params.id));
  } catch (error) {
    console.error("Erro ao editar aula:", error);

    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

export async function excluirAulaMonitor(req, res) {
  try {
    if (!(await verificarDonoDoPerfil(req, res))) {
      return;
    }

    if (!validarIdUsuario(req.params.aulaId)) {
      return res.status(400).json({ error: "Aula invalida." });
    }

    const aulaExcluida = await deleteAulaMonitor(
      req.params.aulaId,
      req.usuario.id,
    );

    if (!aulaExcluida) {
      return res.status(404).json({ error: "Aula nao encontrada." });
    }

    return res.status(200).json(await getAulasMonitor(req.params.id));
  } catch (error) {
    console.error("Erro ao excluir aula:", error);

    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

export async function listarMateriaisMonitor(req, res) {
  try {
    if (!(await validarPerfilMonitor(req, res))) {
      return;
    }

    return res.status(200).json(await listMonitorMaterials(req.params.id));
  } catch (error) {
    console.error("Erro ao listar materiais do monitor:", error);

    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

export async function criarMaterialMonitor(req, res) {
  let materialCriado;

  try {
    if (!(await verificarDonoDoPerfil(req, res))) {
      return;
    }

    const {
      titulo,
      descricao = "",
      fileName,
      contentType,
      fileSize,
    } = req.body || {};

    if (!validarConteudoMaterial(titulo, descricao)) {
      return res.status(400).json({
        error: "Informe um titulo e uma descricao validos (ate 2000 caracteres).",
      });
    }

    const temArquivo =
      fileName !== undefined || contentType !== undefined || fileSize !== undefined;
    let nomeSeguro = null;

    if (temArquivo) {
      nomeSeguro = validarDadosArquivo({ fileName, contentType, fileSize });

      if (!nomeSeguro) {
        return res.status(400).json({
          error:
            "Arquivo invalido. Envie PDF, imagem ou documento permitido com ate 10 MB.",
        });
      }
    } else if (!descricao.trim()) {
      return res.status(400).json({
        error: "Um aviso sem arquivo precisa de uma descricao.",
      });
    }

    const storagePath = nomeSeguro
      ? `${req.usuario.id}/${randomUUID()}-${nomeSeguro}`
      : null;
    try {
      materialCriado = await createMonitorMaterial(req.params.id, {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        storagePath,
        fileName: nomeSeguro,
        contentType: nomeSeguro ? contentType : null,
        fileSize: nomeSeguro ? fileSize : null,
      });
    } catch (error) {
      console.error("Erro ao registrar metadados do material:", error);
      return res.status(500).json({
        error: "Nao foi possivel registrar o material no banco de dados.",
      });
    }

    if (!materialCriado) {
      return res.status(404).json({ error: "Perfil de monitor nao encontrado." });
    }

    if (!storagePath) {
      return res.status(201).json(materialPublico(materialCriado));
    }

    try {
      const signedUrl = await criarUrlUploadMaterial(storagePath);
      return res.status(201).json({
        material: materialPublico(materialCriado),
        signedUrl,
      });
    } catch (error) {
      try {
        await deleteMonitorMaterialRecord(materialCriado.id, req.usuario.id);
      } catch (cleanupError) {
        console.error(
          "Erro ao remover metadados apos falha ao preparar o upload:",
          cleanupError,
        );
      }

      const detalheStorage = detalhesErroStorage(error);
      console.error(
        "Erro ao gerar URL assinada para upload de material:",
        detalheStorage,
      );
      const erroConfiguracao =
        typeof error?.message === "string" &&
        (error.message.includes("SUPABASE_URL") ||
          error.message.includes("SUPABASE_SERVICE_ROLE_KEY"));

      return res.status(502).json({
        error: erroConfiguracao
          ? error.message
          : `Nao foi possivel preparar o upload no Supabase Storage. Detalhe: ${detalheStorage}`,
      });
    }
  } catch (error) {
    console.error("Erro ao criar material do monitor:", error);

    return res.status(500).json({
      error:
        typeof error.message === "string" &&
        (error.message.includes("SUPABASE_URL") ||
          error.message.includes("SUPABASE_SERVICE_ROLE_KEY"))
          ? error.message
          : "Nao foi possivel criar o material.",
    });
  }
}

export async function confirmarMaterialMonitor(req, res) {
  try {
    if (!(await verificarDonoDoPerfil(req, res))) {
      return;
    }

    if (!validarIdUsuario(req.params.materialId)) {
      return res.status(400).json({ error: "Material invalido." });
    }

    const material = await getMonitorMaterial(
      req.params.materialId,
      req.usuario.id,
    );

    if (!material || !material.storagePath) {
      return res.status(404).json({ error: "Material nao encontrado." });
    }

    if (!material.arquivoEnviado) {
      if (!(await materialExiste(material.storagePath))) {
        return res.status(400).json({ error: "O arquivo ainda nao foi enviado." });
      }

      const conteudo = await baixarConteudoMaterial(material.storagePath);

      if (
        conteudo.length !== Number(material.tamanhoBytes) ||
        conteudo.length > TAMANHO_MAXIMO_MATERIAL ||
        !validarAssinaturaArquivo(conteudo, material.contentType)
      ) {
        return res.status(400).json({
          error: "O conteudo do arquivo nao corresponde ao tipo informado.",
        });
      }
    }

    const confirmado = await markMonitorMaterialUploaded(
      req.params.materialId,
      req.usuario.id,
    );

    if (!confirmado) {
      return res.status(404).json({ error: "Material nao encontrado." });
    }

    return res.status(200).json(materialPublico(confirmado));
  } catch (error) {
    console.error("Erro ao confirmar arquivo do material:", error);

    return res.status(500).json({ error: "Nao foi possivel confirmar o arquivo." });
  }
}

export async function excluirMaterialMonitor(req, res) {
  try {
    if (!(await verificarDonoDoPerfil(req, res))) {
      return;
    }

    if (!validarIdUsuario(req.params.materialId)) {
      return res.status(400).json({ error: "Material invalido." });
    }

    const material = await getMonitorMaterial(
      req.params.materialId,
      req.usuario.id,
    );

    if (!material) {
      return res.status(404).json({ error: "Material nao encontrado." });
    }

    if (
      material.storagePath &&
      (await materialExiste(material.storagePath))
    ) {
      await removerArquivoMaterial(material.storagePath);
    }

    const removido = await deleteMonitorMaterialRecord(
      material.id,
      req.usuario.id,
    );

    if (!removido) {
      return res.status(404).json({ error: "Material nao encontrado." });
    }

    return res.status(200).json({ message: "Material removido." });
  } catch (error) {
    console.error("Erro ao excluir material do monitor:", error);

    return res.status(500).json({ error: "Nao foi possivel remover o material." });
  }
}

export async function baixarMaterialMonitor(req, res) {
  try {
    if (!(await validarPerfilMonitor(req, res))) {
      return;
    }

    if (!validarIdUsuario(req.params.materialId)) {
      return res.status(400).json({ error: "Material invalido." });
    }

    const material = await getMonitorMaterialByProfile(
      req.params.materialId,
      req.params.id,
    );

    if (!material || !material.storagePath) {
      return res.status(404).json({ error: "Arquivo nao encontrado." });
    }

    const url = await criarUrlDownloadMaterial(material.storagePath);
    return res.status(200).json({ url });
  } catch (error) {
    console.error("Erro ao preparar download de material:", error);

    return res.status(500).json({ error: "Nao foi possivel acessar o arquivo." });
  }
}

export async function listarAvaliacoesMonitor(req, res) {
  try {
    if (!(await validarPerfilMonitor(req, res))) {
      return;
    }

    return res
      .status(200)
      .json(await listMonitorReviews(req.params.id, req.usuario.id));
  } catch (error) {
    console.error("Erro ao listar avaliacoes do monitor:", error);

    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

function validarAvaliacao(nota, comentario) {
  return (
    Number.isInteger(nota) &&
    nota >= 1 &&
    nota <= 5 &&
    typeof comentario === "string" &&
    comentario.length <= 2000
  );
}

export async function criarAvaliacaoMonitor(req, res) {
  try {
    if (!(await validarPerfilMonitor(req, res))) {
      return;
    }

    const { nota, comentario = "" } = req.body || {};

    if (!validarAvaliacao(nota, comentario)) {
      return res.status(400).json({
        error: "A nota deve ser de 1 a 5 e o comentario ter ate 2000 caracteres.",
      });
    }

    await createMonitorReview(
      req.params.id,
      req.usuario.id,
      nota,
      comentario.trim(),
    );

    return res
      .status(201)
      .json(await listMonitorReviews(req.params.id, req.usuario.id));
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Voce ja avaliou este monitor. Edite sua avaliacao existente.",
      });
    }

    console.error("Erro ao criar avaliacao do monitor:", error);
    return res.status(500).json({ error: "Nao foi possivel publicar a avaliacao." });
  }
}

export async function editarAvaliacaoMonitor(req, res) {
  try {
    if (!(await validarPerfilMonitor(req, res))) {
      return;
    }

    if (!validarIdUsuario(req.params.avaliacaoId)) {
      return res.status(400).json({ error: "Avaliacao invalida." });
    }

    const { nota, comentario = "" } = req.body || {};

    if (!validarAvaliacao(nota, comentario)) {
      return res.status(400).json({
        error: "A nota deve ser de 1 a 5 e o comentario ter ate 2000 caracteres.",
      });
    }

    const atualizada = await updateMonitorReview(
      req.params.avaliacaoId,
      req.params.id,
      req.usuario.id,
      nota,
      comentario.trim(),
    );

    if (!atualizada) {
      return res.status(404).json({
        error: "Avaliacao nao encontrada ou nao pertence a sua conta.",
      });
    }

    return res
      .status(200)
      .json(await listMonitorReviews(req.params.id, req.usuario.id));
  } catch (error) {
    console.error("Erro ao editar avaliacao do monitor:", error);
    return res.status(500).json({ error: "Nao foi possivel editar a avaliacao." });
  }
}

export async function excluirAvaliacaoMonitor(req, res) {
  try {
    if (!(await validarPerfilMonitor(req, res))) {
      return;
    }

    if (!validarIdUsuario(req.params.avaliacaoId)) {
      return res.status(400).json({ error: "Avaliacao invalida." });
    }

    const moderador =
      req.usuario.tipoUsuario.trim().toLowerCase() === "monitor" &&
      Number(req.usuario.id) === Number(req.params.id);
    const removida = await deleteMonitorReview(
      req.params.avaliacaoId,
      req.params.id,
      req.usuario.id,
      moderador,
    );

    if (!removida) {
      return res.status(404).json({
        error: "Avaliacao nao encontrada ou sem permissao para remove-la.",
      });
    }

    return res
      .status(200)
      .json(await listMonitorReviews(req.params.id, req.usuario.id));
  } catch (error) {
    console.error("Erro ao excluir avaliacao do monitor:", error);
    return res.status(500).json({ error: "Nao foi possivel remover a avaliacao." });
  }
}
