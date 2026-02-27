/* conflict-resolver.js — Resolução de conflitos de dados */
'use strict';

/**
 * ConflictResolver — estratégias para resolver conflitos entre dados locais e remotos.
 *
 * Estratégias disponíveis:
 *  - 'last-write-wins' : timestamp mais recente prevalece (padrão)
 *  - 'merge'           : combina campos dos dois registros (local tem prioridade em campos não nulos)
 *  - 'local-wins'      : dados locais sempre prevalecem
 *  - 'remote-wins'     : dados remotos sempre prevalecem
 */
var ConflictResolver = (function () {

  /* ------------------------------------------------------------------ */
  /* Extrai timestamp de um registro                                     */
  /* ------------------------------------------------------------------ */
  function _getTimestamp(record) {
    var ts = record.data_sincronizacao
          || record.dataCadastro
          || record.dataISO
          || record.timestamp
          || null;
    return ts ? new Date(ts).getTime() : 0;
  }

  /* ------------------------------------------------------------------ */
  /* Last-write-wins: registro com timestamp mais recente prevalece      */
  /* ------------------------------------------------------------------ */
  function resolveLastWriteWins(localRecord, remoteRecord) {
    return _getTimestamp(localRecord) >= _getTimestamp(remoteRecord)
      ? localRecord
      : remoteRecord;
  }

  /* ------------------------------------------------------------------ */
  /* Merge: combina campos; local tem prioridade em campos não nulos     */
  /* ------------------------------------------------------------------ */
  function resolveMerge(localRecord, remoteRecord) {
    var merged = Object.assign({}, remoteRecord);
    Object.keys(localRecord).forEach(function (key) {
      if (localRecord[key] !== null && localRecord[key] !== undefined && localRecord[key] !== '') {
        merged[key] = localRecord[key];
      }
    });
    return merged;
  }

  /* ------------------------------------------------------------------ */
  /* Resolve lista de registros locais vs remotos                        */
  /* ------------------------------------------------------------------ */
  function resolveList(localRecords, remoteRecords, strategy) {
    strategy = strategy || 'last-write-wins';

    var remoteMap = {};
    (remoteRecords || []).forEach(function (r) {
      if (r && r.id != null) remoteMap[r.id] = r;
    });

    var resolved   = [];
    var seenIds    = {};

    (localRecords || []).forEach(function (local) {
      if (!local || local.id == null) return;
      seenIds[local.id] = true;
      var remote = remoteMap[local.id];

      if (!remote) {
        resolved.push(local);
        return;
      }

      switch (strategy) {
        case 'last-write-wins':
          resolved.push(resolveLastWriteWins(local, remote));
          break;
        case 'merge':
          resolved.push(resolveMerge(local, remote));
          break;
        case 'remote-wins':
          resolved.push(remote);
          break;
        default: /* 'local-wins' */
          resolved.push(local);
      }
    });

    /* Acrescenta registros remotos que não existem localmente */
    (remoteRecords || []).forEach(function (remote) {
      if (remote && remote.id != null && !seenIds[remote.id]) {
        resolved.push(remote);
      }
    });

    return resolved;
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    resolveLastWriteWins : resolveLastWriteWins,
    resolveMerge         : resolveMerge,
    resolveList          : resolveList
  };

}());
