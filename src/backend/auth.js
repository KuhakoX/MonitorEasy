import { createHmac, timingSafeEqual } from "node:crypto";
import { getUsuarioAutenticado } from "../models/usuarioModel.js";

const COOKIE_NAME = "monitoreasy_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET deve ter pelo menos 32 caracteres.");
  }

  return secret;
}

function assinar(payload) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function lerCookie(req, nome) {
  const cookies = req.headers.cookie?.split(";") || [];
  const cookie = cookies.find((item) => item.trim().startsWith(`${nome}=`));

  return cookie ? cookie.trim().slice(nome.length + 1) : null;
}

function validarSessao(token) {
  if (!token) {
    return null;
  }

  const [payload, assinatura, extra] = token.split(".");

  if (!payload || !assinatura || extra) {
    return null;
  }

  const assinaturaEsperada = Buffer.from(assinar(payload));
  const assinaturaRecebida = Buffer.from(assinatura);

  if (
    assinaturaEsperada.length !== assinaturaRecebida.length ||
    !timingSafeEqual(assinaturaEsperada, assinaturaRecebida)
  ) {
    return null;
  }

  try {
    const sessao = JSON.parse(Buffer.from(payload, "base64url").toString());

    if (
      !Number.isSafeInteger(sessao.id) ||
      sessao.id < 1 ||
      !Number.isSafeInteger(sessao.exp) ||
      sessao.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return sessao;
  } catch {
    return null;
  }
}

function opcoesCookie() {
  const sameSiteConfigurado = process.env.SESSION_COOKIE_SAME_SITE || "Lax";
  const valoresSameSite = {
    lax: "Lax",
    strict: "Strict",
    none: "None",
  };
  const sameSite = valoresSameSite[sameSiteConfigurado.toLowerCase()];

  if (!sameSite) {
    throw new Error("SESSION_COOKIE_SAME_SITE deve ser Lax, Strict ou None.");
  }

  return [
    "Path=/",
    "HttpOnly",
    `SameSite=${sameSite}`,
    ...(process.env.NODE_ENV === "production" || sameSite === "None"
      ? ["Secure"]
      : []),
  ];
}

export function criarSessao(res, usuarioId) {
  const sessao = {
    id: Number(usuarioId),
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(sessao)).toString("base64url");
  const token = `${payload}.${assinar(payload)}`;

  res.append(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=${token}`,
      ...opcoesCookie(),
      `Max-Age=${SESSION_DURATION_SECONDS}`,
    ].join("; "),
  );
}

export function encerrarSessao(res) {
  res.append(
    "Set-Cookie",
    [
      `${COOKIE_NAME}=`,
      ...opcoesCookie(),
      "Max-Age=0",
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    ].join("; "),
  );
}

export async function exigirAutenticacao(req, res, next) {
  try {
    const sessao = validarSessao(lerCookie(req, COOKIE_NAME));

    if (!sessao) {
      encerrarSessao(res);
      return res.status(401).json({ error: "Entre na sua conta para continuar." });
    }

    const usuario = await getUsuarioAutenticado(sessao.id);

    if (!usuario) {
      encerrarSessao(res);
      return res.status(401).json({ error: "Sua sessao expirou. Entre novamente." });
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function verificarOrigem(req, res, next) {
  const origem = req.get("origin");

  if (!origem) {
    return next();
  }

  const origensConfiguradas = (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((valor) => valor.trim())
    .filter(Boolean);

  let origemPermitida = origensConfiguradas.includes(origem);

  if (!origemPermitida) {
    try {
      const urlOrigem = new URL(origem);
      origemPermitida = urlOrigem.host === req.get("host");
    } catch {
      origemPermitida = false;
    }
  }

  if (!origemPermitida) {
    return res.status(403).json({ error: "Origem da requisicao nao permitida." });
  }

  return next();
}
