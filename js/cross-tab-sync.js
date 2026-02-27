/* cross-tab-sync.js — Sincronização entre abas do mesmo navegador via Storage Events */
'use strict';

/**
 * CrossTabSync — escuta Storage Events para manter múltiplas abas sincronizadas.
 *
 * Comportamento:
 *  - Quando uma aba grava no localStorage, o navegador dispara um 'storage' event
 *    em TODAS as outras abas abertas no mesmo domínio
 *  - CrossTabSync escuta esses eventos e emite CustomEvents para que os módulos
 *    da UI se re-renderizem automaticamente
 *
 * Chaves monitoradas:
 *  crm_clientes, crm_produtos_pdv, crm_vendas_pdv, crm_caixa
 */
var CrossTabSync = (function () {

  var KEY_EVENT_MAP = {
    'crm_clientes':     'clientesUpdated',
    'crm_produtos_pdv': 'produtosUpdated',
    'crm_vendas_pdv':   'vendasUpdated',
    'crm_caixa':        'caixaUpdated'
  };

  var _callbacks    = [];
  var _initialized  = false;

  /* ------------------------------------------------------------------ */
  /* Inicializa a escuta de Storage Events                               */
  /* ------------------------------------------------------------------ */
  function watchStorageChanges() {
    if (_initialized) return;
    _initialized = true;

    window.addEventListener('storage', function (e) {
      onStorageChange(e);
    });

    console.log('[CrossTabSync] Monitorando Storage Events para:', Object.keys(KEY_EVENT_MAP).join(', '));
  }

  /* ------------------------------------------------------------------ */
  /* Envia uma mudança para outras abas gravando no localStorage         */
  /* Obs.: Storage Events só disparam em OUTRAS abas, não na aba atual. */
  /* ------------------------------------------------------------------ */
  function broadcastUpdate(tipo, dados) {
    if (!KEY_EVENT_MAP[tipo]) return;
    try {
      localStorage.setItem(tipo, JSON.stringify(dados));
    } catch (err) {
      console.warn('[CrossTabSync] Erro ao gravar no localStorage:', err.message || err);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Callback invocado quando um Storage Event é recebido               */
  /* ------------------------------------------------------------------ */
  function onStorageChange(e) {
    if (!e || !e.key || !e.newValue) return;

    var eventName = KEY_EVENT_MAP[e.key];
    if (!eventName) return;

    var newData;
    try {
      newData = JSON.parse(e.newValue);
    } catch (err) {
      return;
    }

    /* Notifica callbacks registrados */
    _callbacks.forEach(function (cb) {
      try { cb(e.key, newData); } catch (err) { /* silencia */ }
    });

    /* Emite CustomEvent para atualizar a UI automaticamente */
    _emitEvent(eventName, newData);

    console.log('[CrossTabSync] Storage Event recebido:', e.key, '(' + (Array.isArray(newData) ? newData.length : 1) + ' registros)');
  }

  /* ------------------------------------------------------------------ */
  /* Registra um callback extra para mudanças de storage                */
  /* ------------------------------------------------------------------ */
  function addChangeListener(callback) {
    if (typeof callback === 'function') {
      _callbacks.push(callback);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Emite CustomEvent para que módulos React/VanillaJS se atualizem    */
  /* ------------------------------------------------------------------ */
  function _emitEvent(eventName, data) {
    try {
      var ev = new CustomEvent(eventName, { detail: data, bubbles: true });
      window.dispatchEvent(ev);
    } catch (e) {
      var ev2 = document.createEvent('CustomEvent');
      ev2.initCustomEvent(eventName, true, true, data);
      window.dispatchEvent(ev2);
    }
  }

  /* ------------------------------------------------------------------ */
  /* API pública                                                          */
  /* ------------------------------------------------------------------ */
  return {
    watchStorageChanges : watchStorageChanges,
    broadcastUpdate     : broadcastUpdate,
    onStorageChange     : onStorageChange,
    addChangeListener   : addChangeListener
  };

}());
