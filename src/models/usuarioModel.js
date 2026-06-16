import db from "../backend/bd/db.js";

function formatMeetLink(meet) {
  if (!meet) {
    return null;
  }

  if (meet.startsWith("http://") || meet.startsWith("https://")) {
    return meet;
  }

  return `https://meet.google.com/${meet}`;
}

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
      m.MonitorNota AS avaliacao,
      m.Meet AS meetLink
    FROM monitor m
    INNER JOIN usuario u ON u.idUsuario = m.Usuario_idUsuario
    INNER JOIN materias ma ON ma.idMaterias = m.Materias_idMaterias
    ORDER BY u.UsuarioNome
  `;

  const [rows] = await db.execute(sql);

  return rows.map((monitor) => ({
    ...monitor,
    avaliacao: String(monitor.avaliacao),
    meetLink: formatMeetLink(monitor.meetLink),
  }));
}

export async function getMonitorById(idMonitor) {
  const sql = `
    SELECT
      m.idMonitor AS id,
      u.UsuarioNome AS nome,
      u.UsuarioEmail AS email,
      ma.MateriasNome AS materia,
      ma.MateriasAssunto AS descricao,
      m.MonitorNota AS avaliacao,
      m.Meet AS meetLink
    FROM monitor m
    INNER JOIN usuario u ON u.idUsuario = m.Usuario_idUsuario
    INNER JOIN materias ma ON ma.idMaterias = m.Materias_idMaterias
    WHERE m.idMonitor = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [idMonitor]);
  const monitor = rows[0];

  if (!monitor) {
    return null;
  }

  return {
    ...monitor,
    avaliacao: String(monitor.avaliacao),
    meetLink: formatMeetLink(monitor.meetLink),
  };
}

export async function getAulasMonitor(idMonitor) {
  const sql = `
    SELECT
      idCalendario AS id,
      CalendarioTitulo AS titulo,
      DATE_FORMAT(CalendarioData, '%Y-%m-%d') AS data,
      DATE_FORMAT(CalendarioData, '%H:%i') AS hora,
      m.Meet AS meetLink
    FROM calendario c
    INNER JOIN monitor m ON m.idMonitor = c.Monitor_idMonitor
    WHERE c.Monitor_idMonitor = ?
    ORDER BY c.CalendarioData
  `;

  const [rows] = await db.execute(sql, [idMonitor]);

  return rows.map((aula) => ({
    ...aula,
    meetLink: formatMeetLink(aula.meetLink),
  }));
}

export async function createAulaMonitor(idMonitor, data, hora) {
  const dataHora = `${data} ${hora}:00`;

  const sql = `
    INSERT INTO calendario (
      idCalendario,
      CalendarioData,
      CalendarioTitulo,
      Monitor_idMonitor
    )
    SELECT
      COALESCE(MAX(idCalendario), 0) + 1,
      ?,
      'Aula agendada',
      ?
    FROM calendario
  `;

  const [result] = await db.execute(sql, [dataHora, idMonitor]);

  return result;
}
