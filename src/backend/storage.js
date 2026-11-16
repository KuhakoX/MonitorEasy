import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "monitor-materials";
let clienteStorage;

function getStorage() {
  if (clienteStorage) {
    return clienteStorage;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend para usar materiais.",
    );
  }

  clienteStorage = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }).storage.from(BUCKET_NAME);

  return clienteStorage;
}

export async function criarUrlUploadMaterial(caminho) {
  const { data, error } = await getStorage().createSignedUploadUrl(caminho, {
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function materialExiste(caminho) {
  const separador = caminho.lastIndexOf("/");
  const pasta = caminho.slice(0, separador);
  const nome = caminho.slice(separador + 1);
  const { data, error } = await getStorage().list(pasta, {
    limit: 100,
    search: nome,
  });

  if (error) {
    throw error;
  }

  return data.some((arquivo) => arquivo.name === nome);
}

export async function baixarConteudoMaterial(caminho) {
  const { data, error } = await getStorage().download(caminho);

  if (error) {
    throw error;
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function criarUrlDownloadMaterial(caminho) {
  const { data, error } = await getStorage().createSignedUrl(caminho, 300, {
    download: true,
  });

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function removerArquivoMaterial(caminho) {
  const { error } = await getStorage().remove([caminho]);

  if (error) {
    throw error;
  }
}
