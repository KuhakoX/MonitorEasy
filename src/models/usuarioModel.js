import db from '../backend/bd/db.js';

export async function createUsuario(nome, email, senha, tipoUsuario) {
  const sql = `
    INSERT INTO usuarios (nome, email, senha, tipo_usuario)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    nome,
    email,
    senha,
    tipoUsuario,
  ]);

  return result;
}

export async function findUsuarioByEmail(email) {
  const sql = "SELECT * FROM usuarios WHERE email = ?";

  const [rows] = await db.execute(sql, [email]);

  return rows[0];
}

export async function getAllUsuarios() {
  const sql = `
    SELECT id, nome, email, tipo_usuario, criado_em
    FROM usuarios
  `;

  const [rows] = await db.execute(sql);

  return rows;
}