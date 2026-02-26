/* upload.js — Upload de fotos para o Supabase Storage */
'use strict';

const Upload = (() => {
  const BUCKET = 'fotos';

  /**
   * Faz upload de um arquivo para o bucket de fotos.
   * @param {File} file — objeto File obtido de um <input type="file">
   * @param {string} path — caminho dentro do bucket (ex: 'lotes/lote-1/foto.jpg')
   * @returns {Promise<string>} URL pública do arquivo enviado
   */
  async function uploadFoto(file, path) {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    return getFotoUrl(path);
  }

  /**
   * Retorna a URL pública de um arquivo no bucket.
   * @param {string} path — caminho dentro do bucket
   * @returns {string} URL pública
   */
  function getFotoUrl(path) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Remove um arquivo do bucket.
   * @param {string} path — caminho dentro do bucket
   */
  async function deleteFoto(path) {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
  }

  return { uploadFoto, getFotoUrl, deleteFoto };
})();
