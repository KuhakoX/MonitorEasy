export const TAMANHO_MAXIMO_MATERIAL = 10 * 1024 * 1024;

const TIPOS_ARQUIVO_PERMITIDOS = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "text/plain": [".txt"],
  "application/rtf": [".rtf"],
  "text/rtf": [".rtf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "application/vnd.oasis.opendocument.text": [".odt"],
  "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
  "application/vnd.oasis.opendocument.presentation": [".odp"],
};

export function validarConteudoMaterial(titulo, descricao) {
  return (
    typeof titulo === "string" &&
    Boolean(titulo.trim()) &&
    titulo.trim().length <= 200 &&
    typeof descricao === "string" &&
    descricao.length <= 2000
  );
}

export function limparNomeArquivo(nome) {
  if (typeof nome !== "string") {
    return "";
  }

  const nomeBase = nome.split(/[\\/]/).pop();
  const nomeSemControles = [...nomeBase]
    .filter((caractere) => {
      const codigo = caractere.charCodeAt(0);
      return codigo > 31 && codigo !== 127;
    })
    .join("");

  return nomeSemControles.trim().slice(0, 255);
}

export function validarDadosArquivo({ fileName, contentType, fileSize }) {
  const nomeSeguro = limparNomeArquivo(fileName);
  const extensao = nomeSeguro.slice(nomeSeguro.lastIndexOf(".")).toLowerCase();
  const extensoesPermitidas = TIPOS_ARQUIVO_PERMITIDOS[contentType];

  if (
    !nomeSeguro ||
    !extensoesPermitidas?.includes(extensao) ||
    !Number.isSafeInteger(fileSize) ||
    fileSize <= 0 ||
    fileSize > TAMANHO_MAXIMO_MATERIAL
  ) {
    return null;
  }

  return nomeSeguro;
}

export function validarAssinaturaArquivo(buffer, contentType) {
  const comecaCom = (...bytes) =>
    bytes.every((byte, index) => buffer[index] === byte);

  if (contentType === "application/pdf") {
    return buffer.subarray(0, 5).toString() === "%PDF-";
  }

  if (contentType === "image/jpeg") {
    return comecaCom(0xff, 0xd8, 0xff);
  }

  if (contentType === "image/png") {
    return comecaCom(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  }

  if (contentType === "image/gif") {
    return ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString());
  }

  if (contentType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WEBP"
    );
  }

  if (contentType === "text/plain") {
    return !buffer.includes(0) && !buffer.toString("utf8").includes("\ufffd");
  }

  if (contentType === "text/rtf" || contentType === "application/rtf") {
    return buffer.subarray(0, 16).toString().trimStart().startsWith("{\\rtf");
  }

  if (
    [
      "application/msword",
      "application/vnd.ms-excel",
      "application/vnd.ms-powerpoint",
    ].includes(contentType)
  ) {
    return comecaCom(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
  }

  return comecaCom(0x50, 0x4b, 0x03, 0x04);
}
