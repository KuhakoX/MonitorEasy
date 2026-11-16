import assert from "node:assert/strict";
import test from "node:test";
import {
  limparNomeArquivo,
  TAMANHO_MAXIMO_MATERIAL,
  validarAssinaturaArquivo,
  validarConteudoMaterial,
  validarDadosArquivo,
} from "./materialValidation.js";

test("validates material title and description limits", () => {
  assert.equal(validarConteudoMaterial("Aula 1", ""), true);
  assert.equal(validarConteudoMaterial("  ", "Aviso"), false);
  assert.equal(validarConteudoMaterial("a".repeat(201), ""), false);
  assert.equal(validarConteudoMaterial("Aula", "d".repeat(2001)), false);
});

test("accepts supported files only when extension, type and size match", () => {
  assert.equal(
    validarDadosArquivo({
      fileName: "apostila.pdf",
      contentType: "application/pdf",
      fileSize: TAMANHO_MAXIMO_MATERIAL,
    }),
    "apostila.pdf",
  );
  assert.equal(
    validarDadosArquivo({
      fileName: "apostila.exe",
      contentType: "application/pdf",
      fileSize: 1024,
    }),
    null,
  );
  assert.equal(
    validarDadosArquivo({
      fileName: "apostila.pdf",
      contentType: "application/pdf",
      fileSize: TAMANHO_MAXIMO_MATERIAL + 1,
    }),
    null,
  );
  assert.equal(
    validarDadosArquivo({
      fileName: "apostila.pdf",
      contentType: "application/pdf",
      fileSize: 0,
    }),
    null,
  );
});

test("removes path components and control characters from uploaded names", () => {
  assert.equal(limparNomeArquivo("C:\\temp\\aula\u0000.pdf"), "aula.pdf");
});

test("checks file signatures instead of trusting the declared MIME type", () => {
  assert.equal(
    validarAssinaturaArquivo(Buffer.from("%PDF-1.7"), "application/pdf"),
    true,
  );
  assert.equal(
    validarAssinaturaArquivo(Buffer.from("not a pdf"), "application/pdf"),
    false,
  );
  assert.equal(
    validarAssinaturaArquivo(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      "image/png",
    ),
    true,
  );
});
