const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function apiUrl(path) {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function lerRespostaApi(resposta) {
  const contentType = resposta.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `A API retornou uma resposta inesperada (HTTP ${resposta.status}). Verifique se as funções /api foram incluídas no deploy da Vercel.`,
    );
  }

  try {
    return await resposta.json();
  } catch {
    throw new Error("O servidor da API retornou um JSON inválido.");
  }
}
