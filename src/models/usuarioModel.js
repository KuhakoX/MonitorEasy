import bcrypt from "bcryptjs";
import db from "../backend/bd/db.js";

const SALT_ROUNDS = 12;

function formatMeetLink(meet) {
  if (!meet) {
    return null;
  }

  if (meet.startsWith("http://") || meet.startsWith("https://")) {
    return meet;
  }

  return `https://meet.google.com/${meet}`;
}

function formatarMonitor(monitor) {
  const {
    materiaLegada,
    materiasConfiguradas = [],
    ...dadosMonitor
  } = monitor;
  const materias =
    materiasConfiguradas.length > 0
      ? materiasConfiguradas
      : [materiaLegada].filter(Boolean);

  return {
    ...dadosMonitor,
    materia: materias.join(", ") || "Monitor",
    avaliacao: dadosMonitor.avaliacao
      ? String(dadosMonitor.avaliacao)
      : "Sem nota",
    meetLink: formatMeetLink(dadosMonitor.meetLink),
  };
}

async function getMonitorAgendaId(idUsuario) {
  const { rows } = await db.query(
    "SELECT id_monitor FROM monitor WHERE usuario_id = $1 LIMIT 1",
    [idUsuario],
  );

  return rows[0]?.id_monitor || null;
}

async function withTransaction(callback) {
  const connection = await db.connect();

  try {
    await connection.query("BEGIN");
    const result = await callback(connection);
    await connection.query("COMMIT");
    return result;
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function createUsuario(nome, email, senha, tipoUsuario) {
  const senhaHash = await hashPassword(senha);
  const tipoNormalizado = tipoUsuario.trim().toLowerCase();

  return withTransaction(async (connection) => {
    const { rows } = await connection.query(
      `
        INSERT INTO usuario (nome, email, senha_hash, tipo_usuario)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ((lower(email))) DO NOTHING
        RETURNING id_usuario AS id
      `,
      [nome.trim(), email.trim(), senhaHash, tipoNormalizado],
    );

    if (!rows[0]) {
      return null;
    }

    if (tipoNormalizado === "monitor") {
      await connection.query(
        "INSERT INTO monitor (usuario_id) VALUES ($1)",
        [rows[0].id],
      );
    }

    return rows[0];
  });
}

export async function findUsuarioByEmail(email) {
  const { rows } = await db.query(
    `
      SELECT
        id_usuario AS id,
        nome,
        email,
        senha_hash AS senha,
        tipo_usuario AS "tipoUsuario"
      FROM usuario
      WHERE lower(email) = lower($1)
      LIMIT 1
    `,
    [email.trim()],
  );

  return rows[0];
}

export async function getAllUsuarios() {
  const { rows } = await db.query(
    `
      SELECT
        id_usuario AS id,
        nome,
        email,
        tipo_usuario AS "tipoUsuario"
      FROM usuario
      ORDER BY nome
    `,
  );

  return rows;
}

export async function getConfiguracoesUsuario(idUsuario) {
  const { rows } = await db.query(
    `
      SELECT
        u.id_usuario AS id,
        u.nome,
        u.email,
        u.tipo_usuario AS "tipoUsuario",
        c.biografia,
        COALESCE(
          (
            SELECT array_agg(ma.nome ORDER BY ma.nome)
            FROM monitor_materias mm
            INNER JOIN materias ma ON ma.id_materia = mm.materia_id
            WHERE mm.monitor_id = m.id_monitor
          ),
          CASE WHEN legado.nome IS NULL THEN ARRAY[]::text[] ELSE ARRAY[legado.nome] END
        ) AS materias,
        COALESCE(c.meet_link, m.meet_link) AS "meetLink"
      FROM usuario u
      LEFT JOIN usuario_configuracao c ON c.usuario_id = u.id_usuario
      LEFT JOIN monitor m ON m.usuario_id = u.id_usuario
      LEFT JOIN materias legado ON legado.id_materia = m.materia_id
      WHERE u.id_usuario = $1
      LIMIT 1
    `,
    [idUsuario],
  );

  const usuario = rows[0];

  if (!usuario) {
    return null;
  }

  return {
    ...usuario,
    biografia: usuario.biografia || "",
    materias: usuario.materias || [],
    meetLink: formatMeetLink(usuario.meetLink) || "",
  };
}

export async function atualizarConfiguracoesUsuario(
  idUsuario,
  { nome, biografia, materias, meetLink },
) {
  return withTransaction(async (connection) => {
    const { rows } = await connection.query(
      `
        SELECT u.tipo_usuario, m.id_monitor
        FROM usuario u
        LEFT JOIN monitor m ON m.usuario_id = u.id_usuario
        WHERE u.id_usuario = $1
        FOR UPDATE OF u
      `,
      [idUsuario],
    );
    const usuario = rows[0];

    if (!usuario) {
      return { encontrado: false };
    }

    await connection.query(
      "UPDATE usuario SET nome = $1 WHERE id_usuario = $2",
      [nome, idUsuario],
    );

    await connection.query(
      `
        INSERT INTO usuario_configuracao (usuario_id, biografia)
        VALUES ($1, $2)
        ON CONFLICT (usuario_id)
        DO UPDATE SET biografia = EXCLUDED.biografia
      `,
      [idUsuario, biografia],
    );

    if (usuario.tipo_usuario.trim().toLowerCase() === "monitor") {
      const monitorId =
        usuario.id_monitor ||
        (
          await connection.query(
            `
              INSERT INTO monitor (usuario_id)
              VALUES ($1)
              ON CONFLICT (usuario_id)
              DO UPDATE SET usuario_id = EXCLUDED.usuario_id
              RETURNING id_monitor
            `,
            [idUsuario],
          )
        ).rows[0].id_monitor;

      await connection.query(
        `
          UPDATE usuario_configuracao
          SET meet_link = $1
          WHERE usuario_id = $2
        `,
        [meetLink, idUsuario],
      );

      await connection.query(
        "UPDATE monitor SET meet_link = $1 WHERE id_monitor = $2",
        [meetLink, monitorId],
      );

      await connection.query(
        "DELETE FROM monitor_materias WHERE monitor_id = $1",
        [monitorId],
      );

      const materiasUnicas = [
        ...new Map(
          materias.map((materia) => [
            materia.trim().toLocaleLowerCase("pt-BR"),
            materia.trim(),
          ]),
        ).values(),
      ];

      for (const materia of materiasUnicas) {
        await connection.query(
          `
            INSERT INTO materias (nome)
            VALUES ($1)
            ON CONFLICT ((lower(nome))) DO NOTHING
          `,
          [materia],
        );

        const materiaResult = await connection.query(
          "SELECT id_materia FROM materias WHERE lower(nome) = lower($1)",
          [materia],
        );

        await connection.query(
          `
            INSERT INTO monitor_materias (monitor_id, materia_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `,
          [monitorId, materiaResult.rows[0].id_materia],
        );
      }
    }

    return { encontrado: true };
  });
}

export async function alterarSenhaUsuario(idUsuario, senhaAtual, novaSenha) {
  return withTransaction(async (connection) => {
    const { rows } = await connection.query(
      `
        SELECT senha_hash
        FROM usuario
        WHERE id_usuario = $1
        FOR UPDATE
      `,
      [idUsuario],
    );
    const usuario = rows[0];

    if (!usuario) {
      return { encontrado: false };
    }

    if (!(await verifyPassword(senhaAtual, usuario.senha_hash))) {
      return { senhaInvalida: true };
    }

    const senhaHash = await hashPassword(novaSenha);

    await connection.query(
      "UPDATE usuario SET senha_hash = $1 WHERE id_usuario = $2",
      [senhaHash, idUsuario],
    );

    return { encontrado: true };
  });
}

const monitorSelect = `
  SELECT
    u.id_usuario AS id,
    m.id_monitor AS "monitorId",
    u.nome,
    u.email,
    legado.nome AS "materiaLegada",
    COALESCE(
      NULLIF(c.biografia, ''),
      legado.assunto,
      'Monitor cadastrado na plataforma.'
    ) AS descricao,
    m.nota AS avaliacao,
    COALESCE(c.meet_link, m.meet_link) AS "meetLink",
    COALESCE(
      (
        SELECT array_agg(ma.nome ORDER BY ma.nome)
        FROM monitor_materias mm
        INNER JOIN materias ma ON ma.id_materia = mm.materia_id
        WHERE mm.monitor_id = m.id_monitor
      ),
      ARRAY[]::text[]
    ) AS "materiasConfiguradas"
  FROM usuario u
  LEFT JOIN monitor m ON m.usuario_id = u.id_usuario
  LEFT JOIN materias legado ON legado.id_materia = m.materia_id
  LEFT JOIN usuario_configuracao c ON c.usuario_id = u.id_usuario
`;

export async function getMonitores() {
  const { rows } = await db.query(
    `
      ${monitorSelect}
      WHERE lower(trim(u.tipo_usuario)) = 'monitor'
      ORDER BY u.nome
    `,
  );

  return rows.map(formatarMonitor);
}

export async function getMonitorById(idUsuario) {
  const { rows } = await db.query(
    `
      ${monitorSelect}
      WHERE u.id_usuario = $1
        AND lower(trim(u.tipo_usuario)) = 'monitor'
      LIMIT 1
    `,
    [idUsuario],
  );

  return rows[0] ? formatarMonitor(rows[0]) : null;
}

export async function getAulasMonitor(idUsuario) {
  const idMonitor = await getMonitorAgendaId(idUsuario);

  if (!idMonitor) {
    return [];
  }

  const { rows } = await db.query(
    `
      SELECT
        ca.id_calendario AS id,
        ca.titulo,
        to_char(ca.data_hora, 'YYYY-MM-DD') AS data,
        to_char(ca.data_hora, 'HH24:MI') AS hora,
        COALESCE(c.meet_link, m.meet_link) AS "meetLink"
      FROM calendario ca
      INNER JOIN monitor m ON m.id_monitor = ca.monitor_id
      LEFT JOIN usuario_configuracao c ON c.usuario_id = m.usuario_id
      WHERE ca.monitor_id = $1
      ORDER BY ca.data_hora
    `,
    [idMonitor],
  );

  return rows.map((aula) => ({
    ...aula,
    meetLink: formatMeetLink(aula.meetLink),
  }));
}

export async function createAulaMonitor(idUsuario, data, hora) {
  const idMonitor = await getMonitorAgendaId(idUsuario);

  if (!idMonitor) {
    return null;
  }

  const { rows } = await db.query(
    `
      INSERT INTO calendario (data_hora, titulo, monitor_id)
      VALUES ($1::date + $2::time, 'Aula agendada', $3)
      RETURNING id_calendario AS id
    `,
    [data, hora, idMonitor],
  );

  return rows[0];
}
