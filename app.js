(function () {
  "use strict";

  var clients = [];
  var filtered = [];
  var renderLimit = 150;
  var PAGE_SIZE = 150;
  var selectedVend = null; // null = "ver todos"

  var homeView = document.getElementById("homeView");
  var consultaView = document.getElementById("consultaView");
  var vendGrid = document.getElementById("vendGrid");
  var updateStatusEl = document.getElementById("updateStatus");
  var vendAllBtn = document.getElementById("vendAllBtn");
  var backBtn = document.getElementById("backBtn");
  var trocarVendBtn = document.getElementById("trocarVendBtn");
  var vendChip = document.getElementById("vendChip");

  var searchInput = document.getElementById("searchInput");
  var cidadeFilter = document.getElementById("cidadeFilter");
  var clearBtn = document.getElementById("clearFilters");
  var listEl = document.getElementById("clientList");
  var emptyEl = document.getElementById("emptyState");
  var countEl = document.getElementById("resultCount");
  var dbInfoEl = document.getElementById("dbInfo");
  var totalFooterEl = document.getElementById("totalFooter");

  function normalize(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatDate(iso) {
    var parts = iso.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  fetch("clientes.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      // Formato novo: { atualizadoEm, clientes }. Aceita também o antigo (lista simples).
      if (Array.isArray(data)) {
        clients = data;
      } else {
        clients = data.clientes || [];
        showUpdateStatus(data.atualizadoEm);
      }
      clients.forEach(function (c) {
        c._search = normalize(c.cod + " " + c.razao + " " + c.fantasia);
        c._itemCount = c.itens.length;
        c._lastDate = c.itens.reduce(function (max, it) {
          return it.data > max ? it.data : max;
        }, c.itens[0] ? c.itens[0].data : "");
      });
      populateFilters();
      populateVendGrid();
      dbInfoEl.textContent = clients.length.toLocaleString("pt-BR") + " clientes com itens em comodato";
      totalFooterEl.textContent = "Base local · " + clients.length.toLocaleString("pt-BR") + " clientes · funciona offline";
    })
    .catch(function (err) {
      dbInfoEl.textContent = "Não foi possível carregar a base de dados.";
      vendGrid.innerHTML = "<p class=\"home-loading\">Não foi possível carregar a base de dados.</p>";
      console.error(err);
    });

  function showUpdateStatus(iso) {
    // iso = "2026-10-07T21:23" (já em horário de Brasília)
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || "");
    if (!m) return;
    updateStatusEl.textContent =
      "Última atualização: " + m[3] + "/" + m[2] + "/" + m[1] + " às " + m[4] + ":" + m[5];
    updateStatusEl.hidden = false;
  }

  function populateFilters() {
    var cidades = Array.from(new Set(clients.map(function (c) { return c.cidade; }))).sort();

    cidades.forEach(function (cidade) {
      var opt = document.createElement("option");
      opt.value = cidade;
      opt.textContent = cidade;
      cidadeFilter.appendChild(opt);
    });
  }

  function populateVendGrid() {
    var counts = {};
    clients.forEach(function (c) {
      counts[c.vend] = (counts[c.vend] || 0) + 1;
    });
    var vends = Object.keys(counts).map(Number).sort(function (a, b) { return a - b; });

    vendGrid.innerHTML = "";
    vends.forEach(function (v) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vend-card";
      btn.innerHTML =
        '<span class="vend-card-code">' + v + "</span>" +
        '<span class="vend-card-count">' + counts[v].toLocaleString("pt-BR") + (counts[v] === 1 ? " cliente" : " clientes") + "</span>";
      btn.addEventListener("click", function () {
        goToConsulta(v);
      });
      vendGrid.appendChild(btn);
    });
  }

  function goToConsulta(vend) {
    selectedVend = vend;
    if (vend === null) {
      vendChip.textContent = "Todos os vendedores";
    } else {
      vendChip.textContent = "Vendedor " + vend;
    }
    searchInput.value = "";
    cidadeFilter.value = "";
    homeView.hidden = true;
    consultaView.hidden = false;
    applyFilters();
  }

  function goHome() {
    homeView.hidden = false;
    consultaView.hidden = true;
  }

  vendAllBtn.addEventListener("click", function () { goToConsulta(null); });
  backBtn.addEventListener("click", goHome);
  trocarVendBtn.addEventListener("click", goHome);

  function applyFilters() {
    var q = normalize(searchInput.value.trim());
    var cidade = cidadeFilter.value;

    filtered = clients.filter(function (c) {
      if (selectedVend !== null && c.vend !== selectedVend) return false;
      if (cidade && c.cidade !== cidade) return false;
      if (q && c._search.indexOf(q) === -1) return false;
      return true;
    });

    filtered.sort(function (a, b) {
      return b._lastDate < a._lastDate ? -1 : b._lastDate > a._lastDate ? 1 : 0;
    });

    renderLimit = PAGE_SIZE;
    render();
  }

  function render() {
    listEl.innerHTML = "";

    dbInfoEl.textContent = filtered.length.toLocaleString("pt-BR") +
      (filtered.length === 1 ? " cliente com itens" : " clientes com itens") + " em comodato";

    if (filtered.length === 0) {
      var temBusca = searchInput.value.trim().length > 0;
      var msg = temBusca
        ? "Esse cliente não possui comodatos."
        : "Nenhum cliente encontrado com esses filtros. Tente outro código, nome ou limpe os filtros.";
      emptyEl.innerHTML =
        '<span class="empty-icon">!</span>' +
        '<span class="empty-divider"></span>' +
        '<span class="empty-text">' + escapeHtml(msg) + "</span>";
      emptyEl.hidden = false;
      countEl.textContent = "";
      return;
    }
    emptyEl.hidden = true;

    var showing = filtered.slice(0, renderLimit);
    countEl.textContent = filtered.length.toLocaleString("pt-BR") + " cliente" + (filtered.length === 1 ? "" : "s") +
      (filtered.length > showing.length ? " · mostrando " + showing.length : "");

    var frag = document.createDocumentFragment();
    showing.forEach(function (c) {
      frag.appendChild(buildClientCard(c));
    });

    if (filtered.length > showing.length) {
      var li = document.createElement("li");
      li.style.listStyle = "none";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ghost-btn";
      btn.style.width = "100%";
      btn.style.padding = "12px";
      btn.style.border = "1.5px dashed var(--border)";
      btn.style.borderRadius = "10px";
      btn.textContent = "Carregar mais (" + (filtered.length - showing.length) + " restantes)";
      btn.addEventListener("click", function () {
        renderLimit += PAGE_SIZE;
        render();
      });
      li.appendChild(btn);
      frag.appendChild(li);
    }

    listEl.appendChild(frag);
  }

  function buildClientCard(c) {
    var li = document.createElement("li");

    var details = document.createElement("details");
    details.className = "client-card";

    var summary = document.createElement("summary");
    summary.className = "client-summary";

    var main = document.createElement("div");
    main.className = "client-main";

    var fantasia = document.createElement("div");
    fantasia.className = "client-fantasia";
    fantasia.textContent = c.fantasia || c.razao;
    main.appendChild(fantasia);

    if (c.fantasia && c.razao && c.fantasia !== c.razao) {
      var razao = document.createElement("div");
      razao.className = "client-razao";
      razao.textContent = c.razao;
      main.appendChild(razao);
    }

    var meta = document.createElement("div");
    meta.className = "client-meta";
    meta.innerHTML = escapeHtml(c.cod) +
      '<span class="dot">·</span>' + escapeHtml(c.cidade) +
      '<span class="dot">·</span>Vend ' + c.vend;
    main.appendChild(meta);

    summary.appendChild(main);

    var side = document.createElement("div");
    side.className = "client-side";
    var badge = document.createElement("span");
    badge.className = "item-badge";
    badge.innerHTML = c._itemCount + '<small>' + (c._itemCount === 1 ? "item" : "itens") + "</small>";
    side.appendChild(badge);
    side.appendChild(chevronSvg());
    summary.appendChild(side);

    details.appendChild(summary);
    details.appendChild(buildItemsPanel(c));

    li.appendChild(details);
    return li;
  }

  function buildItemsPanel(c) {
    var panel = document.createElement("div");
    panel.className = "items-panel";

    var itemsByDate = c.itens.slice().sort(function (a, b) {
      return b.data < a.data ? -1 : b.data > a.data ? 1 : 0;
    });

    var totalQtd = itemsByDate.reduce(function (sum, it) { return sum + it.qtd; }, 0);
    var resumo = summarizeItems(c.itens);
    var temRepetido = resumo.some(function (g) { return g.registros > 1; });

    var historicoList = buildHistoricoList(itemsByDate);

    if (temRepetido) {
      var tabs = document.createElement("div");
      tabs.className = "tabs";
      var btnHistorico = document.createElement("button");
      btnHistorico.type = "button";
      btnHistorico.className = "tab-btn active";
      btnHistorico.textContent = "Histórico";
      var btnResumo = document.createElement("button");
      btnResumo.type = "button";
      btnResumo.className = "tab-btn";
      btnResumo.textContent = "Resumo";
      tabs.appendChild(btnHistorico);
      tabs.appendChild(btnResumo);
      panel.appendChild(tabs);

      var resumoList = buildResumoList(resumo);
      resumoList.style.display = "none";
      panel.appendChild(historicoList);
      panel.appendChild(resumoList);

      btnHistorico.addEventListener("click", function () {
        btnHistorico.classList.add("active");
        btnResumo.classList.remove("active");
        historicoList.style.display = "";
        resumoList.style.display = "none";
      });
      btnResumo.addEventListener("click", function () {
        btnResumo.classList.add("active");
        btnHistorico.classList.remove("active");
        resumoList.style.display = "";
        historicoList.style.display = "none";
      });
    } else {
      panel.appendChild(historicoList);
    }

    var totalEl = document.createElement("div");
    totalEl.className = "items-total";
    totalEl.textContent = "Total em comodato: " + totalQtd + " unid.";
    panel.appendChild(totalEl);

    return panel;
  }

  // Agrupa por produto e soma as quantidades de datas diferentes.
  function summarizeItems(itens) {
    var map = {};
    var order = [];
    itens.forEach(function (it) {
      var key = it.prodCod;
      if (!map[key]) {
        map[key] = {
          prodCod: it.prodCod,
          prod: it.prod,
          qtd: 0,
          registros: 0,
          primeiraData: it.data,
          ultimaData: it.data,
          patrimonio: it.patrimonio,
          cev: it.cev
        };
        order.push(key);
      }
      var g = map[key];
      g.qtd += it.qtd;
      g.registros += 1;
      if (it.data > g.ultimaData) g.ultimaData = it.data;
      if (it.data < g.primeiraData) g.primeiraData = it.data;
    });
    return order
      .map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.qtd - a.qtd; });
  }

  function buildResumoList(resumo) {
    var list = document.createElement("div");
    list.className = "items-list";

    resumo.forEach(function (g) {
      var sub = g.registros > 1
        ? "Cód. " + g.prodCod + " · " + g.registros + " lançamentos · última " + formatDate(g.ultimaData)
        : "Cód. " + g.prodCod + " · " + formatDate(g.ultimaData);
      var extra = (g.registros === 1 && g.patrimonio)
        ? ("Nº Patrimônio: " + g.patrimonio + " · CEV: " + g.cev)
        : null;
      list.appendChild(buildItemRow(g.prod, sub, g.qtd + " unid.", extra));
    });

    return list;
  }

  function buildHistoricoList(itemsByDate) {
    var list = document.createElement("div");
    list.className = "items-list";

    itemsByDate.forEach(function (it) {
      var sub = formatDate(it.data) + " · Cód. " + it.prodCod;
      var extra = it.patrimonio
        ? ("Nº Patrimônio: " + it.patrimonio + " · CEV: " + it.cev)
        : null;
      list.appendChild(buildItemRow(it.prod, sub, it.qtd + " unid.", extra));
    });

    return list;
  }

  function buildItemRow(prodTxt, subTxt, qtdTxt, extraTxt) {
    var row = document.createElement("div");
    row.className = "item-row";

    var prod = document.createElement("div");
    prod.className = "item-prod";
    prod.textContent = prodTxt;
    row.appendChild(prod);

    if (extraTxt) {
      var patr = document.createElement("div");
      patr.className = "item-patrimonio";
      patr.textContent = extraTxt;
      row.appendChild(patr);
    }

    var sub = document.createElement("div");
    sub.className = "item-sub";
    sub.textContent = subTxt;
    row.appendChild(sub);

    var qtd = document.createElement("div");
    qtd.className = "item-qtd";
    qtd.textContent = qtdTxt;
    row.appendChild(qtd);

    return row;
  }

  function chevronSvg() {
    var span = document.createElement("span");
    span.className = "chevron";
    span.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 20 20" fill="none">' +
      '<path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>";
    return span;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  var debounceTimer;
  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 120);
  });
  cidadeFilter.addEventListener("change", applyFilters);
  clearBtn.addEventListener("click", function () {
    searchInput.value = "";
    cidadeFilter.value = "";
    applyFilters();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();
