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

export async function getUsuarioAutenticado(idUsuario) {
  const { rows } = await db.query(
    `
      SELECT
        id_usuario AS id,
        nome,
        email,
        tipo_usuario AS "tipoUsuario"
      FROM usuario
      WHERE id_usuario = $1
      LIMIT 1
    `,
    [idUsuario],
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
        ca.descricao,
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

export async function createAulaMonitor(
  idUsuario,
  data,
  hora,
  titulo,
  descricao,
) {
  const idMonitor = await getMonitorAgendaId(idUsuario);

  if (!idMonitor) {
    return null;
  }

  const { rows } = await db.query(
    `
      INSERT INTO calendario (
        data_hora,
        titulo,
        descricao,
        monitor_id
      )
      VALUES ($1::date + $2::time, $3, $4, $5)
      RETURNING id_calendario AS id
    `,
    [data, hora, titulo, descricao, idMonitor],
  );

  return rows[0];
}

export async function updateAulaMonitor(
  idAula,
  idUsuario,
  data,
  hora,
  titulo,
  descricao,
) {
  const { rows } = await db.query(
    `
      UPDATE calendario ca
      SET
        data_hora = $1::date + $2::time,
        titulo = $3,
        descricao = $4
      FROM monitor m
      WHERE ca.id_calendario = $5
        AND ca.monitor_id = m.id_monitor
        AND m.usuario_id = $6
      RETURNING ca.id_calendario AS id
    `,
    [data, hora, titulo, descricao, idAula, idUsuario],
  );

  return rows[0] || null;
}

export async function deleteAulaMonitor(idAula, idUsuario) {
  const { rows } = await db.query(
    `
      DELETE FROM calendario ca
      USING monitor m
      WHERE ca.id_calendario = $1
        AND ca.monitor_id = m.id_monitor
        AND m.usuario_id = $2
      RETURNING ca.id_calendario AS id
    `,
    [idAula, idUsuario],
  );

  return rows[0] || null;
}

export async function listMonitorMaterials(idUsuario) {
  const idMonitor = await getMonitorAgendaId(idUsuario);

  if (!idMonitor) {
    return [];
  }

  const { rows } = await db.query(
    `
      SELECT
        id_material AS id,
        titulo,
        descricao,
        nome_arquivo AS "nomeArquivo",
        content_type AS "contentType",
        tamanho_bytes AS "tamanhoBytes",
        criado_em AS "criadoEm"
      FROM monitor_material
      WHERE monitor_id = $1
        AND arquivo_enviado = TRUE
      ORDER BY criado_em DESC
    `,
    [idMonitor],
  );

  return rows;
}

export async function createMonitorMaterial(
  idUsuario,
  { titulo, descricao, storagePath, fileName, contentType, fileSize },
) {
  const idMonitor = await getMonitorAgendaId(idUsuario);

  if (!idMonitor) {
    return null;
  }

  const { rows } = await db.query(
    `
      INSERT INTO monitor_material (
        monitor_id,
        titulo,
        descricao,
        storage_path,
        nome_arquivo,
        content_type,
        tamanho_bytes,
        arquivo_enviado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id_material AS id,
        titulo,
        descricao,
        nome_arquivo AS "nomeArquivo",
        content_type AS "contentType",
        tamanho_bytes AS "tamanhoBytes",
        criado_em AS "criadoEm"
    `,
    [
      idMonitor,
      titulo,
      descricao,
      storagePath,
      fileName,
      contentType,
      fileSize,
      !storagePath,
    ],
  );

  return rows[0];
}

export async function markMonitorMaterialUploaded(idMaterial, idUsuario) {
  const { rows } = await db.query(
    `
      UPDATE monitor_material mm
      SET arquivo_enviado = TRUE
      FROM monitor m
      WHERE mm.id_material = $1
        AND mm.monitor_id = m.id_monitor
        AND m.usuario_id = $2
        AND mm.storage_path IS NOT NULL
      RETURNING
        mm.id_material AS id,
        mm.titulo,
        mm.descricao,
        mm.nome_arquivo AS "nomeArquivo",
        mm.content_type AS "contentType",
        mm.tamanho_bytes AS "tamanhoBytes",
        mm.criado_em AS "criadoEm"
    `,
    [idMaterial, idUsuario],
  );

  return rows[0] || null;
}

export async function getMonitorMaterial(idMaterial, idUsuario) {
  const { rows } = await db.query(
    `
      SELECT
        mm.id_material AS id,
        mm.monitor_id AS "monitorId",
        mm.titulo,
        mm.descricao,
        mm.storage_path AS "storagePath",
        mm.nome_arquivo AS "nomeArquivo",
        mm.content_type AS "contentType",
        mm.tamanho_bytes AS "tamanhoBytes",
        mm.arquivo_enviado AS "arquivoEnviado"
      FROM monitor_material mm
      INNER JOIN monitor m ON m.id_monitor = mm.monitor_id
      WHERE mm.id_material = $1
        AND m.usuario_id = $2
      LIMIT 1
    `,
    [idMaterial, idUsuario],
  );

  return rows[0] || null;
}

export async function getMonitorMaterialByProfile(idMaterial, idMonitorUsuario) {
  const { rows } = await db.query(
    `
      SELECT
        mm.id_material AS id,
        mm.monitor_id AS "monitorId",
        mm.titulo,
        mm.descricao,
        mm.storage_path AS "storagePath",
        mm.nome_arquivo AS "nomeArquivo",
        mm.content_type AS "contentType",
        mm.tamanho_bytes AS "tamanhoBytes",
        mm.arquivo_enviado AS "arquivoEnviado"
      FROM monitor_material mm
      INNER JOIN monitor m ON m.id_monitor = mm.monitor_id
      WHERE mm.id_material = $1
        AND m.usuario_id = $2
        AND mm.arquivo_enviado = TRUE
      LIMIT 1
    `,
    [idMaterial, idMonitorUsuario],
  );

  return rows[0] || null;
}

export async function deleteMonitorMaterialRecord(idMaterial, idUsuario) {
  const { rows } = await db.query(
    `
      DELETE FROM monitor_material mm
      USING monitor m
      WHERE mm.id_material = $1
        AND mm.monitor_id = m.id_monitor
        AND m.usuario_id = $2
      RETURNING mm.id_material AS id
    `,
    [idMaterial, idUsuario],
  );

  return rows[0] || null;
}

export async function listMonitorReviews(idUsuario, viewerId) {
  const idMonitor = await getMonitorAgendaId(idUsuario);

  if (!idMonitor) {
    return { average: 0, count: 0, reviews: [], myReview: null };
  }

  const [{ rows: reviews }, { rows: aggregate }] = await Promise.all([
    db.query(
      `
        SELECT
          r.id_review AS id,
          r.usuario_id AS "usuarioId",
          u.nome AS "autor",
          r.nota,
          r.comentario,
          r.criado_em AS "criadoEm",
          r.atualizado_em AS "atualizadoEm"
        FROM monitor_review r
        INNER JOIN usuario u ON u.id_usuario = r.usuario_id
        WHERE r.monitor_id = $1
        ORDER BY r.criado_em DESC
      `,
      [idMonitor],
    ),
    db.query(
      `
        SELECT
          COALESCE(ROUND(AVG(nota)::numeric, 2), 0) AS average,
          COUNT(*)::integer AS count
        FROM monitor_review
        WHERE monitor_id = $1
      `,
      [idMonitor],
    ),
  ]);

  const minhaAvaliacao =
    reviews.find((review) => review.usuarioId === viewerId) || null;

  return {
    average: Number(aggregate[0].average),
    count: aggregate[0].count,
    reviews: reviews.map(({ usuarioId, ...review }) => ({
      ...review,
      minha: usuarioId === viewerId,
    })),
    myReview: minhaAvaliacao
      ? {
          id: minhaAvaliacao.id,
          nota: minhaAvaliacao.nota,
          comentario: minhaAvaliacao.comentario,
          criadoEm: minhaAvaliacao.criadoEm,
          atualizadoEm: minhaAvaliacao.atualizadoEm,
        }
      : null,
  };
}

export async function createMonitorReview(
  idMonitorUsuario,
  idAutor,
  nota,
  comentario,
) {
  const idMonitor = await getMonitorAgendaId(idMonitorUsuario);

  if (!idMonitor) {
    return null;
  }

  const { rows } = await db.query(
    `
      INSERT INTO monitor_review (monitor_id, usuario_id, nota, comentario)
      VALUES ($1, $2, $3, $4)
      RETURNING id_review AS id
    `,
    [idMonitor, idAutor, nota, comentario],
  );

  return rows[0] || null;
}

export async function updateMonitorReview(
  idReview,
  idMonitorUsuario,
  idAutor,
  nota,
  comentario,
) {
  const { rows } = await db.query(
    `
      UPDATE monitor_review r
      SET
        nota = $1,
        comentario = $2,
        atualizado_em = now()
      FROM monitor m
      WHERE r.id_review = $3
        AND r.monitor_id = m.id_monitor
        AND m.usuario_id = $4
        AND r.usuario_id = $5
      RETURNING r.id_review AS id
    `,
    [nota, comentario, idReview, idMonitorUsuario, idAutor],
  );

  return rows[0] || null;
}

export async function deleteMonitorReview(
  idReview,
  idMonitorUsuario,
  idAutor,
  moderador,
) {
  const { rows } = await db.query(
    `
      DELETE FROM monitor_review r
      USING monitor m
      WHERE r.id_review = $1
        AND r.monitor_id = m.id_monitor
        AND m.usuario_id = $2
        AND (r.usuario_id = $3 OR $4::boolean)
      RETURNING r.id_review AS id
    `,
    [idReview, idMonitorUsuario, idAutor, moderador],
  );

  return rows[0] || null;
}
