import db from "../backend/bd/db.js";

export async function createUsuario(nome, email, senha, tipoUsuario) {
  const sql = `
    INSERT INTO usuario (
      idUsuario,
      UsuarioNome,
      UsuarioEmail,
      UsuarioSenha,
      UsuarioTipo
    )
    SELECT
      COALESCE(MAX(idUsuario), 0) + 1,
      ?,
      ?,
      ?,
      ?
    FROM usuario
  `;

  const [result] = await db.execute(sql, [nome, email, senha, tipoUsuario]);

  return result;
}

export async function findUsuarioByEmail(email) {
  const sql = `
    SELECT
      idUsuario AS id,
      UsuarioNome AS nome,
      UsuarioEmail AS email,
      UsuarioSenha AS senha,
      UsuarioTipo AS tipoUsuario
    FROM usuario
    WHERE UsuarioEmail = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [email]);

  return rows[0];
}

export async function getAllUsuarios() {
  const sql = `
    SELECT
      idUsuario AS id,
      UsuarioNome AS nome,
      UsuarioEmail AS email,
      UsuarioTipo AS tipoUsuario
    FROM usuario
    ORDER BY UsuarioNome
  `;

  const [rows] = await db.execute(sql);

  return rows;
}

export async function getMonitores() {
  const sql = `
    SELECT
      m.idMonitor AS id,
      u.UsuarioNome AS nome,
      u.UsuarioEmail AS email,
      ma.MateriasNome AS materia,
      ma.MateriasAssunto AS descricao,
      m.MonitorNota AS avaliacao
    FROM monitor m
    INNER JOIN usuario u ON u.idUsuario = m.Usuario_idUsuario
    INNER JOIN materias ma ON ma.idMaterias = m.Materias_idMaterias
    ORDER BY u.UsuarioNome
  `;

  const [rows] = await db.execute(sql);

  return rows.map((monitor) => ({
    ...monitor,
    avaliacao: String(monitor.avaliacao),
  }));
}
