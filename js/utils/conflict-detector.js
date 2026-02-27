/* conflict-detector.js — Detecção e notificação de conflitos de sincronização */
'use strict';

/**
 * ConflictDetector — detecta conflitos, notifica o usuário e resolve usando
 * estratégias configuráveis.
 *
 * Estratégias:
 *  'last-write-wins' (padrão) — timestamp mais recente prevalece
 *  'merge'                    — combina campos (local tem prioridade em não-nulos)
 *  'local-wins'               — dados locais sempre prevalecem
 *  'remote-wins'              — dados remotos sempre prevalecem
 */
var ConflictDetector = (function () {

  var _strategy     = 'last-write-wins';
  var _totalConflicts = 0;
  var _toastTimeout = null;

  /* ------------------------------------------------------------------ */
  /* Compara timestamps de dois registros                                */
  /* Retorna 1 se local é mais recente, -1 se remoto é mais recente,    */
  /* 0 se iguais.                                                        */
  /* ------------------------------------------------------------------ */
  function compareTimestamps(local, remote) {
    var localTs  = _getTimestamp(local);
    var remoteTs = _getTimestamp(remote);
    if (localTs > remoteTs)  return  1;
    if (localTs < remoteTs)  return -1;
    return 0;
  }

  /* ------------------------------------------------------------------ */
  /* Merge inteligente: campos não-nulos do local sobrescrevem o remoto  */
  /* ------------------------------------------------------------------ */
  function mergeData(local, remote) {
    if (typeof ConflictResolver !== 'undefined') {
      return ConflictResolver.resolveMerge(local, remote);
    }
    var merged = Object.assign({}, remote);
    Object.keys(local).forEach(function (key) {
      if (local[key] !== null && local[key] !== undefined && local[key] !== '') {
        merged[key] = local[key];
      }
    });
    return merged;
  }

  /* ------------------------------------------------------------------ */
  /* Notifica o usuário sobre um conflito via toast                      */
  /* ------------------------------------------------------------------ */
  function notifyConflict(tipo, dado) {
    _totalConflicts++;

    var nome = (dado && dado.local && (dado.local.nome || dado.local.descricao || dado.local.id))
            || (dado && dado.remote && (dado.remote.nome || dado.remote.descricao || dado.remote.id))
            || '?';

    var msg = '⚠️ Conflito em ' + tipo + ': "' + nome + '" resolvido por ' + _strategy + '.';
    console.warn('[ConflictDetector]', msg);

    _showToast(msg, 'warn');

    /* Emite evento para atualizar contador no status bar */
    try {
      var ev = new CustomEvent('conflictDetected', {
        detail : { tipo: tipo, dado: dado, estrategia: _strategy, total: _totalConflicts },
        bubbles: true
      });
      window.dispatchEvent(ev);
    } catch (e) { /* silencia */ }
  }

  /* ------------------------------------------------------------------ */
  /* Resolve um conflito aplicando a estratégia configurada              */
  /* ------------------------------------------------------------------ */
  function resolveConflict(local, remote, estrategia) {
    var strat = estrategia || _strategy;

    if (typeof ConflictResolver !== 'undefined') {
      switch (strat) {
        case 'last-write-wins': return ConflictResolver.resolveLastWriteWins(local, remote);
        case 'merge':           return ConflictResolver.resolveMerge(local, remote);
        case 'remote-wins':     return remote;
        default:                return local; /* 'local-wins' */
      }
    }

    /* Fallback sem ConflictResolver */
    switch (strat) {
      case 'last-write-wins': return compareTimestamps(local, remote) >= 0 ? local : remote;
      case 'merge':           return mergeData(local, remote);
      case 'remote-wins':     return remote;
      default:                return local;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Define a estratégia padrão de resolução                             */
  /* ------------------------------------------------------------------ */
  function setStrategy(estrategia) {
    var valid = ['last-write-wins', 'merge', 'local-wins', 'remote-wins'];
    if (valid.indexOf(estrategia) >= 0) {
      _strategy = estrategia;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Extrai timestamp de um registro                                     */
  /* ------------------------------------------------------------------ */
  function _getTimestamp(record) {
    if (!record) return 0;
    var ts = record.data_sincronizacao
          || record.dataCadastro
          || record.dataISO
          || record.timestamp
          || null;
    return ts ? new Date(ts).getTime() : 0;
  }

  /* ------------------------------------------------------------------ */
  /* Exibe um toast de notificação na UI                                 */
  /* ------------------------------------------------------------------ */
  function _showToast(msg, type) {
    var toastEl = document.getElementById('syncToast');

    if (!toastEl) {
      /* Cria o elemento toast dinamicamente se não existir */
      toastEl = document.createElement('div');
      toastEl.id = 'syncToast';
      toastEl.style.cssText = [
        'position:fixed',
        'bottom:20px',
        'right:20px',
        'max-width:340px',
        'padding:10px 16px',
        'border-radius:10px',
        'font-size:13px',
        'font-weight:600',
        'z-index:9999',
        'transition:opacity .3s',
        'pointer-events:none',
        'opacity:0'
      ].join(';');
      document.body.appendChild(toastEl);
    }

    var bg = type === 'warn'
      ? 'rgba(255,200,80,.95)'
      : 'rgba(90,255,170,.95)';
    var color = '#0b0f19';

    toastEl.style.background = bg;
    toastEl.style.color      = color;
    toastEl.textContent      = msg;
    toastEl.style.opacity    = '1';

    if (_toastTimeout) clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(function () {
      toastEl.style.opacity = '0';
    }, 4000);
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    compareTimestamps : compareTimestamps,
    mergeData         : mergeData,
    notifyConflict    : notifyConflict,
    resolveConflict   : resolveConflict,
    setStrategy       : setStrategy,
    getTotalConflicts : function () { return _totalConflicts; }
  };

}());
