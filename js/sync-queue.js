/* sync-queue.js — Fila de sincronização persistente */
'use strict';

/**
 * SyncQueue — abstração de alto nível sobre a fila IndexedDB do OfflineSync.
 *
 * Responsabilidades:
 *  - addToQueue  : enfileira uma operação (delega ao OfflineSync)
 *  - processQueue: processa a fila (delega ao OfflineSync)
 *  - getQueueStatus: retorna estado atual da fila (count, última sync)
 *  - clearQueue  : marca todos os itens como sincronizados
 */
var SyncQueue = (function () {

  var _lastProcessedAt = null;

  /* ------------------------------------------------------------------ */
  /* Adiciona uma operação à fila                                        */
  /* ------------------------------------------------------------------ */
  function addToQueue(operacao) {
    if (!operacao || !operacao.tipo || !operacao.tabela || !operacao.dados) {
      return Promise.reject(new Error('[SyncQueue] Operação inválida: campos obrigatórios: tipo, tabela, dados'));
    }

    if (typeof OfflineSync === 'undefined') {
      return Promise.reject(new Error('[SyncQueue] OfflineSync não disponível.'));
    }

    return OfflineSync.enqueue(operacao.tipo, operacao.tabela, operacao.dados)
      .then(function (item) {
        console.log('[SyncQueue] Operação enfileirada:', operacao.tipo, operacao.tabela);
        _notifyQueueChange();
        return item;
      });
  }

  /* ------------------------------------------------------------------ */
  /* Processa a fila enviando ao Supabase                                */
  /* ------------------------------------------------------------------ */
  function processQueue() {
    if (typeof OfflineSync === 'undefined') {
      return Promise.resolve();
    }

    return OfflineSync.processQueue()
      .then(function () {
        _lastProcessedAt = new Date();
        _notifyQueueChange();
        console.log('[SyncQueue] Fila processada em:', _lastProcessedAt.toISOString());
      })
      .catch(function (err) {
        console.warn('[SyncQueue] Erro ao processar fila:', err.message || err);
        throw err;
      });
  }

  /* ------------------------------------------------------------------ */
  /* Retorna status da fila                                              */
  /* ------------------------------------------------------------------ */
  function getQueueStatus() {
    if (typeof OfflineSync === 'undefined') {
      return Promise.resolve({ pendingCount: 0, lastProcessedAt: _lastProcessedAt });
    }

    return OfflineSync.getPendingCount()
      .then(function (count) {
        return {
          pendingCount    : count,
          lastProcessedAt : _lastProcessedAt
        };
      });
  }

  /* ------------------------------------------------------------------ */
  /* Limpa a fila (marca todos como sincronizados no IndexedDB)          */
  /* A implementação real depende do OfflineSync — aqui processa a fila  */
  /* ------------------------------------------------------------------ */
  function clearQueue() {
    return processQueue();
  }

  /* ------------------------------------------------------------------ */
  /* Notifica o DOM sobre a mudança no estado da fila                    */
  /* ------------------------------------------------------------------ */
  function _notifyQueueChange() {
    getQueueStatus().then(function (status) {
      try {
        var ev = new CustomEvent('syncQueueChanged', { detail: status, bubbles: true });
        window.dispatchEvent(ev);
      } catch (e) {
        var ev2 = document.createEvent('CustomEvent');
        ev2.initCustomEvent('syncQueueChanged', true, true, status);
        window.dispatchEvent(ev2);
      }
    }).catch(function () { /* silencia */ });
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    addToQueue      : addToQueue,
    processQueue    : processQueue,
    getQueueStatus  : getQueueStatus,
    clearQueue      : clearQueue
  };

}());
