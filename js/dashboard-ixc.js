(function () {
  "use strict";

  const utils = window.JM && window.JM.utils || {};
  const esc = utils.esc || ((value) => String(value == null ? "" : value));
  const money = utils.money || ((value) => "R$ " + Number(value || 0).toFixed(2));
  const dateTime = utils.dateTime || ((value) => value || "");
  const statusClass = utils.statusClass || (() => "info");
  const utilIsFinalStatus = utils.isFinalStatus || ((status) => /finalizado|cancelado|encerrado/i.test(String(status || "")));
  const mapsRouteUrl = utils.mapsRouteUrl || (() => "");

  const DOC_BASE = "https://wiki-erp.ixcsoft.com.br/documentacao/dashboards/";
  const DASHBOARDS = [
    { key: "busca", label: "Barra de Pesquisa da Dashboard", short: "Pesquisa", icon: "BP", area: "operacao", doc: DOC_BASE + "barra-de-pesquisa-da-dashboard.html" },
    { key: "principal", label: "Dashboard Principal", short: "Principal", icon: "DP", area: "geral", doc: DOC_BASE + "dashboard-principal.html" },
    { key: "acessos", label: "Dashboard Acessos (Logins)", short: "Acessos", icon: "AC", area: "admin", doc: DOC_BASE + "dashboard-acessos-(logins)" },
    { key: "atendimentos", label: "Dashboard Atendimentos", short: "Atendimentos", icon: "AT", area: "operacao", doc: DOC_BASE + "dashboard-atendimentos" },
    { key: "cobrancas", label: "Dashboard Cobranças", short: "Cobranças", icon: "CB", area: "financeiro", doc: DOC_BASE + "dashboard-cobrancas.html", sensitive: true },
    { key: "contas_pagar", label: "Dashboard Contas a Pagar", short: "Contas a Pagar", icon: "CP", area: "financeiro", doc: "https://wiki-erp.ixcsoft.com.br/dashboards/dashboard-contas-a-pagar", sensitive: true },
    { key: "contas_receber", label: "Dashboard Contas a Receber", short: "Contas a Receber", icon: "CR", area: "financeiro", doc: DOC_BASE + "dashboard-contas-a-receber.html", sensitive: true },
    { key: "crm", label: "Dashboard CRM", short: "CRM", icon: "CM", area: "comercial", doc: DOC_BASE + "dashboard-crm.html" },
    { key: "crm_corporativo", label: "Dashboard CRM Corporativo", short: "CRM Corporativo", icon: "PJ", area: "comercial", doc: "https://wiki-erp.ixcsoft.com.br/dashboards/dashboard-crm-corporativo" },
    { key: "crm_pessoa_fisica", label: "Dashboard CRM Pessoa Física", short: "CRM Pessoa Física", icon: "PF", area: "comercial", doc: DOC_BASE + "dashboard-crm-pessoa-fisica.html" },
    { key: "contratos", label: "Dashboard de Contratos", short: "Contratos", icon: "CT", area: "comercial", doc: "https://wiki-erp.ixcsoft.com.br/dashboards/dashboard-de-contratos" },
    { key: "colaborador", label: "Dashboard do Colaborador", short: "Colaborador", icon: "CO", area: "operacao", doc: DOC_BASE + "dashboard-do-colaborador.html" },
    { key: "faturas", label: "Dashboard Faturas", short: "Faturas", icon: "FT", area: "financeiro", doc: DOC_BASE + "dashboard-faturas.html", sensitive: true },
    { key: "financeiro", label: "Dashboard Financeiro", short: "Financeiro", icon: "FN", area: "financeiro", doc: DOC_BASE + "dashboard-financeiro", sensitive: true },
    { key: "monitoramento_fibra", label: "Dashboard Monitoramento Fibra", short: "Monitoramento Fibra", icon: "MF", area: "monitoramento", doc: DOC_BASE + "dashboard-monitoramento-fibra.html" },
    { key: "negociacoes", label: "Dashboard Negociações", short: "Negociações", icon: "NG", area: "comercial", doc: DOC_BASE + "dashboard-negociacoes.html" },
    { key: "ordem_servico", label: "Dashboard Ordem de Serviço", short: "Ordem de Serviço", icon: "OS", area: "operacao", doc: DOC_BASE + "dashboard-ordem-de-servico" },
    { key: "servidor", label: "Dashboard Servidor", short: "Servidor", icon: "SV", area: "admin", doc: "https://wiki-erp.ixcsoft.com.br/dashboards/dashboard-servidor" },
    { key: "ixc_soft", label: "Dashboards do IXC Soft", short: "Catálogo IXC", icon: "IX", area: "geral", doc: DOC_BASE + "dashboards-do-ixc-soft" }
  ];

  const APP_MODULES = [
    { key: "dashboard", label: "Dashboards IXC/JM", group: "Dashboards" },
    { key: "operacao", label: "Central Operacional", group: "Operação" },
    { key: "chamados", label: "Chamados", group: "Operação" },
    { key: "finalizados", label: "Finalizados", group: "Operação" },
    { key: "mapa", label: "Mapa / Tracker", group: "Operação" },
    { key: "clientes", label: "Clientes / Seguradoras", group: "Comercial" },
    { key: "integracoes", label: "Integrações", group: "Comercial" },
    { key: "financeiro", label: "Financeiro", group: "Financeiro" },
    { key: "pagamentos", label: "Pagamentos", group: "Financeiro" },
    { key: "frota", label: "Frota", group: "Administração" },
    { key: "equipe", label: "Equipe", group: "Administração" }
  ];

  function all() {
    return DASHBOARDS.slice();
  }

  function modules() {
    return APP_MODULES.slice();
  }

  function get(key) {
    return DASHBOARDS.find((item) => item.key === key) || DASHBOARDS.find((item) => item.key === "principal");
  }

  function visibleRows(rows) {
    return Object.values(rows || {}).filter((row) => row && !row.deletedAt);
  }

  function normalized(value) {
    return String(value == null ? "" : value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function toDate(value) {
    if (!value) return null;
    if (value && typeof value.toDate === "function") return value.toDate();
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function daysBetween(date, ref) {
    const d = toDate(date);
    if (!d) return null;
    return Math.floor((ref.getTime() - d.getTime()) / 86400000);
  }

  function dateKey(value) {
    const d = toDate(value);
    if (!d) return "";
    return d.toISOString().slice(0, 10);
  }

  function monthKey(value) {
    const d = toDate(value);
    if (!d) return "Sem data";
    return String(d.getFullYear()) + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function monthLabel(key) {
    if (!/^\d{4}-\d{2}$/.test(String(key))) return key || "Sem data";
    const [year, month] = key.split("-");
    return month + "/" + year.slice(2);
  }

  function statusMeansReceived(value) {
    return /recebido|pago|baixado|liquidado/.test(normalized(value));
  }

  function statusMeansOpen(value) {
    return /receber|pagar|pendente|faturar|aberto|parcial/.test(normalized(value));
  }

  function isFinalStatus(status) {
    return utilIsFinalStatus(status);
  }

  function callDate(call) {
    return call.createdAt || call.updatedAt || call.closedAt || call.slaLimit || "";
  }

  function txDate(tx) {
    return tx.date || tx.dueDate || tx.createdAt || tx.updatedAt || "";
  }

  function applyPeriod(rows, getter, period) {
    if (!period || period === "all") return rows;
    const now = new Date();
    if (period === "month") {
      return rows.filter((row) => {
        const d = toDate(getter(row));
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
    const days = Number(period);
    if (!days) return rows;
    return rows.filter((row) => {
      const diff = daysBetween(getter(row), now);
      return diff != null && diff >= 0 && diff <= days;
    });
  }

  function filterText(rows, getter, text) {
    const term = normalized(text);
    if (!term) return rows;
    return rows.filter((row) => normalized(getter(row)).includes(term));
  }

  function collect(ctx) {
    const state = ctx.state || {};
    const filters = ctx.filters || {};
    const callsAll = visibleRows(state.calls);
    const transactionsAll = visibleRows(state.transactions);
    const data = {
      vehicles: visibleRows(state.vehicles),
      users: visibleRows(state.users),
      customers: visibleRows(state.customers),
      integrationInbox: visibleRows(state.integrationInbox),
      expenses: visibleRows(state.expenses),
      maintenance: visibleRows(state.maintenance),
      trackerProviders: visibleRows(state.trackerProviders),
      callsAll,
      transactionsAll,
      calls: applyPeriod(callsAll, callDate, filters.period),
      transactions: applyPeriod(transactionsAll, txDate, filters.period)
    };
    data.calls = filterText(data.calls, callSearchText, filters.text);
    data.transactions = filterText(data.transactions, txSearchText, filters.text);
    data.customers = filterText(data.customers, customerSearchText, filters.text);
    return data;
  }

  function callSearchText(call) {
    return [
      call.id, call.protocolo, call.cliente, call.customerName, call.insurance, call.insuranceProtocol,
      call.customerPlate, call.customerVehicle, call.serviceType, call.tipo, call.status, call.billingStatus,
      call.originLabel, call.destLabel, call.driverName
    ].join(" ");
  }

  function txSearchText(tx) {
    return [
      tx.id, tx.description, tx.category, tx.status, tx.type, tx.protocol, tx.invoiceNumber,
      tx.billingParty, tx.customerName, tx.insurance, tx.customerPlate, tx.callId, tx.vehicleId, tx.driverName
    ].join(" ");
  }

  function customerSearchText(customer) {
    return [
      customer.id, customer.name, customer.nome, customer.document, customer.cpfCnpj, customer.phone,
      customer.email, customer.type, customer.portal, customer.billingEmail, customer.billingRules
    ].join(" ");
  }

  function sum(rows, getter) {
    return rows.reduce((total, row) => total + Number(getter(row) || 0), 0);
  }

  function countBy(rows, getter) {
    const out = {};
    rows.forEach((row) => {
      const key = String(getter(row) || "Sem informação").trim() || "Sem informação";
      out[key] = (out[key] || 0) + 1;
    });
    return out;
  }

  function sumBy(rows, groupGetter, valueGetter) {
    const out = {};
    rows.forEach((row) => {
      const key = String(groupGetter(row) || "Sem informação").trim() || "Sem informação";
      out[key] = (out[key] || 0) + Number(valueGetter(row) || 0);
    });
    return out;
  }

  function entries(obj, limit) {
    return Object.entries(obj || {})
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
      .slice(0, limit || 8);
  }

  function metrics(items) {
    return `<div class="dashboard-metrics">${items.map((item) => `
      <div class="metric-tile">
        <span>${esc(item.label)}</span>
        <strong>${esc(item.value)}</strong>
        ${item.note ? `<small>${esc(item.note)}</small>` : ""}
      </div>`).join("")}</div>`;
  }

  function docsButton(def) {
    if (!def || !def.doc) return "";
    return `<a class="btn mini" href="${esc(def.doc)}" target="_blank" rel="noopener noreferrer">Documentação</a>`;
  }

  function header(def, subtitle) {
    return `<div class="ixc-dashboard-head">
      <div>
        <span class="eyebrow">Dashboards IXC/JM</span>
        <h2>${esc(def.label)}</h2>
        <p class="muted small">${esc(subtitle || "Painel analítico com cards, gráficos, filtros e acesso rápido aos registros relacionados.")}</p>
      </div>
      <div class="dashboard-head-actions">${docsButton(def)}</div>
    </div>`;
  }

  function actionButton(kind, id, label) {
    if (!id) return "";
    const safeKind = String(kind || "").replace(/[^a-z_]/g, "");
    const safeId = encodeURIComponent(String(id));
    return `<button class="btn mini" type="button" onclick="JM.app.openDashboardRecord('${safeKind}', decodeURIComponent('${safeId}'))">${esc(label || "Abrir")}</button>`;
  }

  function dashButton(key, label) {
    const safeKey = String(key || "").replace(/[^a-z0-9_]/g, "");
    return `<button class="btn mini" type="button" onclick="JM.app.selectDashboard('${safeKey}')">${esc(label || "Abrir dashboard")}</button>`;
  }

  function barChart(title, rows, options) {
    options = options || {};
    const list = Array.isArray(rows) ? rows : entries(rows, options.limit || 8);
    const max = Math.max(1, ...list.map((row) => Math.abs(Number(row.value || 0))));
    const formatter = options.money ? money : (value) => String(value);
    return `<section class="dashboard-card">
      <h3>${esc(title)}</h3>
      ${list.length ? `<div class="bar-list">${list.map((row) => {
        const pct = Math.max(3, Math.round((Math.abs(Number(row.value || 0)) / max) * 100));
        return `<button class="bar-row" type="button">
          <span>${esc(row.label)}</span>
          <i><b style="width:${pct}%"></b></i>
          <strong>${esc(formatter(row.value))}</strong>
        </button>`;
      }).join("")}</div>` : emptyLine("Sem dados para o filtro atual.")}
    </section>`;
  }

  function tablePanel(title, columns, rows, emptyText) {
    return `<section class="dashboard-card dashboard-table-card">
      <h3>${esc(title)}</h3>
      ${rows.length ? `<div class="table-wrap dashboard-table-wrap"><table><thead><tr>${columns.map((col) => `<th>${esc(col)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>` : emptyLine(emptyText || "Sem registros.")}
    </section>`;
  }

  function emptyLine(text) {
    return `<p class="muted small dashboard-empty">${esc(text)}</p>`;
  }

  function statusBadge(text) {
    return `<span class="badge ${statusClass(text)}">${esc(text || "Sem status")}</span>`;
  }

  function callProtocol(call) {
    return call.protocolo || call.insuranceProtocol || call.id || "-";
  }

  function callValue(call) {
    return Number(call.valor || call.price || call.amount || 0);
  }

  function vehiclePoint(vehicle) {
    return vehicle.location || vehicle.mobileLocation || vehicle.driverPhoneLocation || null;
  }

  function routeLink(call, state) {
    const vehicle = state && state.vehicles && state.vehicles[call.vehicleId] || {};
    return call.routeExternalUrl || call.routeUrl || mapsRouteUrl(call, vehicle);
  }

  function callLinks(call, ctx) {
    const url = routeLink(call, ctx.state || {});
    return `<div class="call-quick-links">${actionButton("calls", call.id, "Abrir")}${url ? `<a class="btn mini" target="_blank" rel="noopener noreferrer" href="${esc(url)}">Rota</a>` : ""}</div>`;
  }

  function recentCallsTable(title, calls, ctx) {
    const rows = calls.slice(0, 8).map((call) => `<tr>
      <td><b>${esc(callProtocol(call))}</b><br><span class="muted small">${esc(call.cliente || call.customerName || "")}</span></td>
      <td>${statusBadge(call.status || call.statusKey)}</td>
      <td>${esc(call.insurance || call.serviceType || call.tipo || "-")}</td>
      <td>${esc(dateTime(callDate(call)))}</td>
      <td>${callLinks(call, ctx)}</td>
    </tr>`);
    return tablePanel(title, ["Chamado", "Status", "Origem/serviço", "Data", "Acesso"], rows, "Sem chamados neste filtro.");
  }

  function render(ctx) {
    const def = get(ctx.key || "principal");
    const data = collect(ctx);
    const renderers = {
      busca: renderSearch,
      principal: renderPrincipal,
      acessos: renderAcessos,
      atendimentos: renderAtendimentos,
      cobrancas: renderCobrancas,
      contas_pagar: renderContasPagar,
      contas_receber: renderContasReceber,
      crm: renderCrm,
      crm_corporativo: (c, d, defn) => renderCrmSegment(c, d, defn, "corporativo"),
      crm_pessoa_fisica: (c, d, defn) => renderCrmSegment(c, d, defn, "pf"),
      contratos: renderContratos,
      colaborador: renderColaborador,
      faturas: renderFaturas,
      financeiro: renderFinanceiro,
      monitoramento_fibra: renderMonitoramentoFibra,
      negociacoes: renderNegociacoes,
      ordem_servico: renderOrdemServico,
      servidor: renderServidor,
      ixc_soft: renderCatalog
    };
    const body = (renderers[def.key] || renderPrincipal)(ctx, data, def);
    return header(def, dashboardSubtitle(def.key)) + body;
  }

  function dashboardSubtitle(key) {
    const texts = {
      busca: "Busca preditiva em clientes, chamados, veículos, equipe e financeiro, com filtros equivalentes aos atalhos da documentação.",
      principal: "Resumo executivo da operação, financeiro, contratos/clientes, prospecções, frota e cobranças.",
      financeiro: "Fluxo dos últimos e próximos 30 dias, saldos operacionais e leitura de contas a pagar/receber.",
      monitoramento_fibra: "Estrutura preparada para sinais TX/RX e temperatura; na JM também aponta saúde do rastreamento da frota."
    };
    return texts[key] || "";
  }

  function renderSearch(ctx, data) {
    const term = normalized(ctx.filters && ctx.filters.text || "");
    const all = []
      .concat(data.callsAll.map((item) => ({ type: "Chamado", key: "calls", id: item.id, title: callProtocol(item), text: callSearchText(item), note: item.cliente || item.insurance || item.status || "" })))
      .concat(visibleRows(ctx.state.customers).map((item) => ({ type: "Cliente", key: "customers", id: item.id, title: item.name || item.nome || item.id, text: customerSearchText(item), note: item.type || item.phone || item.email || "" })))
      .concat(visibleRows(ctx.state.vehicles).map((item) => ({ type: "Veículo", key: "vehicles", id: item.id, title: item.placa || item.id, text: [item.placa, item.apelido, item.tipo, item.status, item.trackerId].join(" "), note: item.status || item.tipo || "" })))
      .concat(visibleRows(ctx.state.users).map((item) => ({ type: "Usuário", key: "users", id: item.id || item.uid, title: item.nome || item.email, text: [item.nome, item.email, item.role].join(" "), note: item.role || "" })))
      .concat(visibleRows(ctx.state.transactions).map((item) => ({ type: "Financeiro", key: "transactions", id: item.id, title: item.description || item.invoiceNumber || item.id, text: txSearchText(item), note: [item.status, money(item.amount || 0)].join(" | ") })));
    const result = term ? all.filter((item) => normalized(item.text).includes(term)).slice(0, 40) : all.slice(0, 12);
    const byType = countBy(result, (item) => item.type);
    const rows = result.map((item) => `<tr>
      <td><span class="badge info">${esc(item.type)}</span></td>
      <td><b>${esc(item.title)}</b><br><span class="muted small">${esc(item.note)}</span></td>
      <td>${actionButton(item.key, item.id, "Abrir")}</td>
    </tr>`);
    return metrics([
      { label: "Resultados", value: result.length, note: term ? "Filtro aplicado" : "Últimos registros" },
      { label: "Chamados", value: byType.Chamado || 0 },
      { label: "Clientes", value: byType.Cliente || 0 },
      { label: "Veículos", value: byType["Veículo"] || 0 }
    ]) + `<div class="dashboard-grid">${barChart("Resultados por tipo", byType)}${tablePanel("Acesso rápido", ["Tipo", "Registro", "Ação"], rows, "Digite na barra superior para pesquisar.")}</div>`;
  }

  function renderPrincipal(ctx, data) {
    const active = data.calls.filter((call) => !isFinalStatus(call.status || call.statusKey));
    const finalized = data.calls.filter((call) => isFinalStatus(call.status || call.statusKey));
    const toBill = finalized.filter((call) => /a_faturar|aguardando|aberto|receber/i.test(String(call.billingStatus || "aberto")));
    const receivables = data.transactions.filter((tx) => tx.type === "entrada" && statusMeansOpen(tx.status));
    const payables = data.transactions.filter((tx) => tx.type === "saida" && statusMeansOpen(tx.status));
    const online = data.vehicles.filter((vehicle) => vehiclePoint(vehicle)).length;
    return metrics([
      { label: "Chamados ativos", value: active.length },
      { label: "Finalizados", value: finalized.length },
      { label: "Receita aberta", value: ctx.canSeeFinance ? money(sum(receivables, (tx) => tx.balanceAmount != null ? tx.balanceAmount : tx.amount)) : "Restrito" },
      { label: "A pagar", value: ctx.canSeeFinance ? money(sum(payables, (tx) => tx.amount)) : "Restrito" },
      { label: "Frota online", value: online + "/" + data.vehicles.length },
      { label: "A faturar/provas", value: toBill.length }
    ]) + `<div class="dashboard-grid dashboard-grid-main">
      <section class="dashboard-card dashboard-map-card"><h3>Mapa operacional</h3><div id="dashboardMap" class="map dashboard-map"></div></section>
      ${barChart("Atendimentos por status", countBy(data.calls, (call) => call.status || call.statusKey))}
      ${ctx.canSeeFinance ? barChart("Financeiro por mês", sumBy(data.transactions, (tx) => monthLabel(monthKey(txDate(tx))), (tx) => tx.type === "entrada" ? Number(tx.amount || 0) : -Number(tx.amount || 0)), { money: true }) : emptyFinanceCard()}
      ${recentCallsTable("Chamados recentes", data.calls.slice().sort((a, b) => String(callDate(b)).localeCompare(String(callDate(a)))), ctx)}
    </div>`;
  }

  function renderAcessos(ctx, data) {
    const now = new Date();
    const activeUsers = data.users.filter((user) => user.active !== false);
    const recent = activeUsers.filter((user) => {
      const diff = daysBetween(user.lastLoginAt || user.updatedAt || user.createdAt, now);
      return diff != null && diff <= 7;
    });
    const rows = activeUsers.slice(0, 12).map((user) => `<tr>
      <td><b>${esc(user.nome || user.email || user.id)}</b><br><span class="muted small">${esc(user.email || "")}</span></td>
      <td>${esc(user.role || "sem perfil")}</td>
      <td>${esc(user.active === false ? "Inativo" : "Ativo")}</td>
      <td>${esc(dateTime(user.lastLoginAt || user.updatedAt || user.createdAt || ""))}</td>
      <td>${actionButton("users", user.id || user.uid, "Abrir")}</td>
    </tr>`);
    return metrics([
      { label: "Usuários ativos", value: activeUsers.length },
      { label: "Sem acesso recente", value: Math.max(0, activeUsers.length - recent.length) },
      { label: "Perfis", value: Object.keys(countBy(activeUsers, (user) => user.role)).length },
      { label: "Autenticação", value: "E-mail/senha" }
    ]) + `<div class="dashboard-grid">${barChart("Acessos por perfil", countBy(activeUsers, (user) => user.role || "Sem perfil"))}${barChart("Status dos acessos", countBy(data.users, (user) => user.active === false ? "Inativo" : "Ativo"))}${tablePanel("Usuários e logins", ["Usuário", "Perfil", "Status", "Último registro", "Ação"], rows)}</div>`;
  }

  function renderAtendimentos(ctx, data) {
    const inbox = data.integrationInbox.filter((item) => !item.handledAt && !item.deletedAt);
    return metrics([
      { label: "Atendimentos", value: data.calls.length },
      { label: "Caixa de entrada", value: inbox.length },
      { label: "Alta/urgente", value: data.calls.filter((call) => /alta|urgente/i.test(String(call.priority || ""))).length },
      { label: "Departamentos", value: Object.keys(countBy(data.calls, (call) => call.insurance || call.source || "Operação")).length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Atendimentos por status", countBy(data.calls, (call) => call.status || call.statusKey))}
      ${barChart("Atendimentos por prioridade", countBy(data.calls, (call) => call.priority || "Normal"))}
      ${barChart("Atendimentos por assunto", countBy(data.calls, (call) => call.serviceType || call.tipo || "Guincho"))}
      ${barChart("Atendimentos por departamento", countBy(data.calls, (call) => call.insurance || call.source || "Operação"))}
      ${recentCallsTable("Fila de atendimento", data.calls, ctx)}
    </div>`;
  }

  function renderCobrancas(ctx, data) {
    if (!ctx.canSeeFinance) return emptyFinanceCard();
    const receivables = data.transactions.filter((tx) => tx.type === "entrada");
    const today = new Date().toISOString().slice(0, 10);
    const finalizedToday = receivables.filter((tx) => statusMeansReceived(tx.status) && dateKey(tx.date || tx.updatedAt) === today);
    const open = receivables.filter((tx) => statusMeansOpen(tx.status));
    return metrics([
      { label: "Títulos em cobrança", value: open.length },
      { label: "Valor em aberto", value: money(sum(open, (tx) => tx.balanceAmount != null ? tx.balanceAmount : tx.amount)) },
      { label: "Finalizadas hoje", value: finalizedToday.length },
      { label: "Glosas", value: money(sum(receivables.filter((tx) => /glos/i.test(String(tx.status || ""))), (tx) => tx.amount)) }
    ]) + `<div class="dashboard-grid">
      ${barChart("Cobranças últimos 30 dias", sumBy(applyPeriod(receivables, txDate, "30"), (tx) => tx.status || "Sem status", (tx) => tx.amount), { money: true })}
      ${barChart("Títulos em cobrança por etapa", sumBy(open, (tx) => tx.status || "Em aberto", (tx) => tx.balanceAmount != null ? tx.balanceAmount : tx.amount), { money: true })}
      ${tablePanel("Cobranças críticas", ["Cliente", "Status", "Valor", "Vencimento", "Ação"], open.slice(0, 10).map((tx) => `<tr><td>${esc(tx.billingParty || tx.customerName || tx.description || "-")}</td><td>${statusBadge(tx.status)}</td><td><b>${money(tx.balanceAmount != null ? tx.balanceAmount : tx.amount)}</b></td><td>${esc(tx.dueDate || tx.date || "")}</td><td>${actionButton("transactions", tx.id, "Abrir")}</td></tr>`))}
    </div>`;
  }

  function renderContasPagar(ctx, data) {
    if (!ctx.canSeeFinance) return emptyFinanceCard();
    const rows = data.transactions.filter((tx) => tx.type === "saida");
    const today = new Date().toISOString().slice(0, 10);
    const overdue = rows.filter((tx) => !statusMeansReceived(tx.status) && tx.dueDate && tx.dueDate < today);
    return metrics([
      { label: "A pagar", value: money(sum(rows.filter((tx) => !statusMeansReceived(tx.status)), (tx) => tx.amount)) },
      { label: "Vencidas", value: money(sum(overdue, (tx) => tx.amount)) },
      { label: "Pagas", value: money(sum(rows.filter((tx) => statusMeansReceived(tx.status)), (tx) => tx.amount)) },
      { label: "Registros", value: rows.length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Pagamentos por período", sumBy(rows.filter((tx) => statusMeansReceived(tx.status)), (tx) => monthLabel(monthKey(tx.date || tx.dueDate)), (tx) => tx.amount), { money: true })}
      ${barChart("Contas a pagar próximas", sumBy(rows.filter((tx) => !statusMeansReceived(tx.status)), (tx) => monthLabel(monthKey(tx.dueDate || tx.date)), (tx) => tx.amount), { money: true })}
      ${barChart("Contas vencidas por status", sumBy(overdue, (tx) => tx.status || "A pagar", (tx) => tx.amount), { money: true })}
      ${financeRowsTable("Lançamentos a pagar", rows)}
    </div>`;
  }

  function renderContasReceber(ctx, data) {
    if (!ctx.canSeeFinance) return emptyFinanceCard();
    const rows = data.transactions.filter((tx) => tx.type === "entrada");
    const today = new Date().toISOString().slice(0, 10);
    const open = rows.filter((tx) => !statusMeansReceived(tx.status));
    const overdue = open.filter((tx) => tx.dueDate && tx.dueDate < today);
    return metrics([
      { label: "A receber", value: money(sum(open, (tx) => tx.balanceAmount != null ? tx.balanceAmount : tx.amount)) },
      { label: "Inadimplência", value: money(sum(overdue, (tx) => tx.balanceAmount != null ? tx.balanceAmount : tx.amount)) },
      { label: "Recebidos", value: money(sum(rows.filter((tx) => statusMeansReceived(tx.status)), (tx) => tx.paidAmount || tx.amount)) },
      { label: "Registros", value: rows.length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Contas a receber por mês", sumBy(rows, (tx) => monthLabel(monthKey(tx.dueDate || tx.date)), (tx) => tx.balanceAmount != null ? tx.balanceAmount : tx.amount), { money: true })}
      ${barChart("Inadimplência por status", sumBy(overdue, (tx) => tx.status || "Em aberto", (tx) => tx.balanceAmount != null ? tx.balanceAmount : tx.amount), { money: true })}
      ${barChart("Recebimentos por período", sumBy(rows.filter((tx) => statusMeansReceived(tx.status)), (tx) => monthLabel(monthKey(tx.date || tx.updatedAt)), (tx) => tx.paidAmount || tx.amount), { money: true })}
      ${financeRowsTable("Lançamentos a receber", rows)}
    </div>`;
  }

  function financeRowsTable(title, rows) {
    const sorted = rows.slice().sort((a, b) => String(txDate(b)).localeCompare(String(txDate(a))));
    return tablePanel(title, ["Data", "Descrição", "Status", "Valor", "Ação"], sorted.slice(0, 10).map((tx) => `<tr>
      <td>${esc(tx.dueDate || tx.date || dateTime(tx.createdAt))}</td>
      <td><b>${esc(tx.description || tx.billingParty || "-")}</b><br><span class="muted small">${esc(tx.category || tx.invoiceNumber || "")}</span></td>
      <td>${statusBadge(tx.status)}</td>
      <td><b>${money(tx.balanceAmount != null ? tx.balanceAmount : tx.amount)}</b></td>
      <td>${actionButton("transactions", tx.id, "Abrir")}</td>
    </tr>`));
  }

  function renderCrm(ctx, data) {
    const prospects = data.integrationInbox.filter((item) => !item.handledAt);
    const converted = data.calls.filter((call) => isFinalStatus(call.status || call.statusKey));
    return metrics([
      { label: "Prospects/fila", value: prospects.length },
      { label: "Clientes", value: data.customers.length },
      { label: "Convertidos", value: converted.length },
      { label: "Canais", value: Object.keys(countBy(data.calls, (call) => call.source || call.insurance || "Direto")).length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Funil de prospecções", countBy(data.integrationInbox, (item) => item.status || (item.handledAt ? "Convertido" : "Novo")))}
      ${barChart("Prospects por canal", countBy(data.integrationInbox.concat(data.calls), (item) => item.source || item.sourceType || item.insurance || "Direto"))}
      ${barChart("Vencemos por responsável", countBy(converted, (call) => call.driverName || call.updatedByName || call.driverId || "Equipe"))}
      ${recentCallsTable("Oportunidades e atendimentos", data.calls, ctx)}
    </div>`;
  }

  function renderCrmSegment(ctx, data, def, segment) {
    const isCorporate = segment === "corporativo";
    const customers = data.customers.filter((customer) => {
      const text = normalized([customer.type, customer.document, customer.cpfCnpj, customer.name].join(" "));
      return isCorporate ? /seguradora|assistencia|empresa|p[a-z ]*tio|cnpj|juridica/.test(text) || String(customer.document || customer.cpfCnpj || "").replace(/\D/g, "").length > 11 : !/seguradora|assistencia|empresa|cnpj|juridica/.test(text);
    });
    const calls = data.calls.filter((call) => isCorporate ? !!call.insurance || /seguradora|assistencia|empresa/i.test(String(call.source || "")) : !call.insurance && /particular|direto|cliente/i.test(String(call.source || "particular")));
    return metrics([
      { label: isCorporate ? "Contas PJ" : "Pessoas físicas", value: customers.length },
      { label: "Prospects", value: calls.filter((call) => !isFinalStatus(call.status || call.statusKey)).length },
      { label: "Convertidos", value: calls.filter((call) => isFinalStatus(call.status || call.statusKey)).length },
      { label: "Canais", value: Object.keys(countBy(calls, (call) => call.source || call.insurance || "Direto")).length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Prospects por status", countBy(calls, (call) => call.status || call.statusKey))}
      ${barChart("Vencemos por responsável", countBy(calls.filter((call) => isFinalStatus(call.status || call.statusKey)), (call) => call.driverName || call.driverId || "Equipe"))}
      ${barChart("Prospects por canal", countBy(calls, (call) => call.source || call.insurance || "Direto"))}
      ${tablePanel("Carteira " + (isCorporate ? "corporativa" : "pessoa física"), ["Cliente", "Tipo", "Contato", "Ação"], customers.slice(0, 10).map((customer) => `<tr><td><b>${esc(customer.name || customer.nome || "-")}</b></td><td>${esc(customer.type || "-")}</td><td>${esc(customer.phone || customer.email || "-")}</td><td>${actionButton("customers", customer.id, "Abrir")}</td></tr>`))}
    </div>`;
  }

  function renderContratos(ctx, data) {
    const customers = data.customers;
    const callsByCustomer = countBy(data.calls, (call) => call.customerId || call.insurance || call.cliente || "Avulso");
    const activeContracts = customers.filter((customer) => customer.active !== false);
    const recurring = customers.filter((customer) => customer.billingRules || customer.paymentTerm || customer.portal || /seguradora|assistencia|empresa/i.test(String(customer.type || "")));
    return metrics([
      { label: "Contratos ativos", value: activeContracts.length },
      { label: "Carteiras recorrentes", value: recurring.length },
      { label: "Com portal/regras", value: customers.filter((customer) => customer.portal || customer.billingRules).length },
      { label: "Sem movimentação", value: customers.filter((customer) => !(callsByCustomer[customer.id] || callsByCustomer[customer.name])).length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Status dos contratos", countBy(customers, (customer) => customer.active === false ? "Inativo" : "Ativo"))}
      ${barChart("Tipos de contrato/carteira", countBy(customers, (customer) => customer.type || "Particular"))}
      ${barChart("Gera financeiro automático", countBy(customers, (customer) => customer.paymentTerm || customer.billingRules ? "Sim" : "Não"))}
      ${tablePanel("Clientes com contrato/regras", ["Cliente", "Tipo", "Prazo", "Portal", "Ação"], recurring.slice(0, 10).map((customer) => `<tr><td><b>${esc(customer.name || customer.nome || "-")}</b></td><td>${esc(customer.type || "-")}</td><td>${esc(customer.paymentTerm || "-")}</td><td>${customer.portal ? `<a target="_blank" rel="noopener noreferrer" href="${esc(customer.portal)}">Abrir</a>` : "-"}</td><td>${actionButton("customers", customer.id, "Abrir")}</td></tr>`))}
    </div>`;
  }

  function renderColaborador(ctx, data) {
    const myId = ctx.state && ctx.state.user && ctx.state.user.uid;
    const profile = ctx.state && ctx.state.profile || {};
    const scoped = ctx.canOwnCompany ? data.calls : data.calls.filter((call) => call.driverId === myId || call.driverName === profile.nome);
    return metrics([
      { label: "O.S. vinculadas", value: scoped.length },
      { label: "Abertas/agendadas", value: scoped.filter((call) => !isFinalStatus(call.status || call.statusKey)).length },
      { label: "Finalizadas", value: scoped.filter((call) => isFinalStatus(call.status || call.statusKey)).length },
      { label: "Prioridade alta", value: scoped.filter((call) => /alta|urgente/i.test(String(call.priority || ""))).length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Ordens por prioridade", countBy(scoped, (call) => call.priority || "Normal"))}
      ${barChart("Ordens por status", countBy(scoped, (call) => call.status || call.statusKey))}
      ${barChart("Finalizadas por mês", countBy(scoped.filter((call) => isFinalStatus(call.status || call.statusKey)), (call) => monthLabel(monthKey(call.closedAt || call.updatedAt || callDate(call)))))}
      ${recentCallsTable("Minha carteira operacional", scoped, ctx)}
    </div>`;
  }

  function renderFaturas(ctx, data) {
    if (!ctx.canSeeFinance) return emptyFinanceCard();
    const invoices = data.transactions.filter((tx) => tx.invoiceNumber || tx.module === "payments" || tx.billingParty);
    const finalized = data.calls.filter((call) => isFinalStatus(call.status || call.statusKey));
    const missingInvoice = finalized.filter((call) => callValue(call) > 0 && !call.financeCreated && !call.receivableTransactionId);
    const noFinancial = invoices.filter((tx) => !tx.callId && !tx.customerId && !tx.billingParty);
    return metrics([
      { label: "Faturas/títulos", value: invoices.length },
      { label: "Chamados sem financeiro", value: missingInvoice.length },
      { label: "Faturas sem vínculo", value: noFinancial.length },
      { label: "Canceladas/glosadas", value: invoices.filter((tx) => /cancel|glos/i.test(String(tx.status || ""))).length }
    ]) + `<div class="dashboard-grid">
      ${barChart("Faturas por status", sumBy(invoices, (tx) => tx.status || "Sem status", (tx) => tx.amount), { money: true })}
      ${barChart("Faturas por mês", sumBy(invoices, (tx) => monthLabel(monthKey(tx.dueDate || tx.date)), (tx) => tx.amount), { money: true })}
      ${recentCallsTable("Chamados finalizados sem fatura", missingInvoice, ctx)}
      ${financeRowsTable("Documentos financeiros", invoices)}
    </div>`;
  }

  function renderFinanceiro(ctx, data) {
    if (!ctx.canSeeFinance) return emptyFinanceCard();
    const rows = data.transactions;
    const received = rows.filter((tx) => tx.type === "entrada" && statusMeansReceived(tx.status));
    const paid = rows.filter((tx) => tx.type === "saida" && statusMeansReceived(tx.status));
    const future = rows.filter((tx) => !statusMeansReceived(tx.status));
    return metrics([
      { label: "Recebidos", value: money(sum(received, (tx) => tx.paidAmount || tx.amount)) },
      { label: "Pagos", value: money(sum(paid, (tx) => tx.amount)) },
      { label: "Saldo operacional", value: money(sum(received, (tx) => tx.paidAmount || tx.amount) - sum(paid, (tx) => tx.amount)) },
      { label: "Projetado", value: money(sum(future, (tx) => tx.type === "entrada" ? (tx.balanceAmount != null ? tx.balanceAmount : tx.amount) : -Number(tx.amount || 0))) }
    ]) + `<div class="dashboard-grid">
      ${barChart("Financeiro últimos/próximos períodos", sumBy(rows, (tx) => monthLabel(monthKey(txDate(tx))), (tx) => tx.type === "entrada" ? Number(tx.amount || 0) : -Number(tx.amount || 0)), { money: true })}
      ${barChart("Saldo por categoria", sumBy(rows, (tx) => tx.category || "Sem categoria", (tx) => tx.type === "entrada" ? Number(tx.amount || 0) : -Number(tx.amount || 0)), { money: true })}
      ${barChart("Status financeiro", sumBy(rows, (tx) => tx.status || "Sem status", (tx) => tx.amount), { money: true })}
      ${financeRowsTable("Movimentações", rows)}
    </div>`;
  }

  function renderMonitoramentoFibra(ctx, data) {
    const vehicles = data.vehicles;
    const online = vehicles.filter((vehicle) => vehiclePoint(vehicle));
    const withoutSignal = vehicles.filter((vehicle) => !vehiclePoint(vehicle));
    const withFiberSignal = vehicles.filter((vehicle) => vehicle.signalTx || vehicle.signalRx || vehicle.temperature || vehicle.vlan || vehicle.transmitter);
    return metrics([
      { label: "Ativos monitorados", value: vehicles.length },
      { label: "Com sinal/GPS", value: online.length },
      { label: "Sem sinal", value: withoutSignal.length },
      { label: "Dados TX/RX", value: withFiberSignal.length, note: withFiberSignal.length ? "Integração detectada" : "Aguardando OLT/ONU" }
    ]) + `<div class="dashboard-grid">
      ${barChart("Comparativo de sinal TX", countBy(withFiberSignal, (v) => v.signalTx || "Sem TX"))}
      ${barChart("Comparativo de sinal RX", countBy(withFiberSignal, (v) => v.signalRx || "Sem RX"))}
      ${barChart("Monitoramento por transmissor", countBy(vehicles, (v) => v.transmitter || v.trackerProviderId || "RAFA/GPS"))}
      ${tablePanel("Saúde do monitoramento", ["Ativo", "Status", "Última posição", "Ação"], vehicles.map((vehicle) => `<tr><td><b>${esc(vehicle.placa || vehicle.id)}</b><br><span class="muted small">${esc(vehicle.apelido || vehicle.tipo || "")}</span></td><td>${esc(vehiclePoint(vehicle) ? "Com sinal" : "Sem sinal")}</td><td>${esc(dateTime(vehicle.lastTrackerAt || vehicle.lastPhoneGpsAt || vehicle.updatedAt || ""))}</td><td>${actionButton("vehicles", vehicle.id, "Abrir")}</td></tr>`))}
    </div>`;
  }

  function renderNegociacoes(ctx, data) {
    const negotiations = data.integrationInbox.concat(data.calls);
    const finalized = data.calls.filter((call) => isFinalStatus(call.status || call.statusKey));
    return metrics([
      { label: "Negociações", value: negotiations.length },
      { label: "Iniciadas", value: data.calls.filter((call) => !isFinalStatus(call.status || call.statusKey)).length },
      { label: "Finalizadas", value: finalized.length },
      { label: "Valor finalizado", value: ctx.canSeeFinance ? money(sum(finalized, callValue)) : "Restrito" }
    ]) + `<div class="dashboard-grid">
      ${barChart("Finalizadas por plano/serviço", countBy(finalized, (call) => call.serviceType || call.tipo || "Guincho"))}
      ${barChart("Finalizadas por responsável", sumBy(finalized, (call) => call.driverName || call.driverId || "Equipe", callValue), { money: ctx.canSeeFinance })}
      ${barChart("Iniciadas por canal", countBy(data.calls.filter((call) => !isFinalStatus(call.status || call.statusKey)), (call) => call.source || call.insurance || "Direto"))}
      ${barChart("Negociações por status", countBy(negotiations, (item) => item.status || item.statusKey || (item.handledAt ? "Tratado" : "Novo")))}
      ${recentCallsTable("Negociações recentes", data.calls, ctx)}
    </div>`;
  }

  function renderOrdemServico(ctx, data) {
    const rows = data.calls;
    return metrics([
      { label: "Ordens de serviço", value: rows.length },
      { label: "Abertas", value: rows.filter((call) => !isFinalStatus(call.status || call.statusKey)).length },
      { label: "Agendadas", value: rows.filter((call) => call.slaLimit || /agend/i.test(String(call.status || ""))).length },
      { label: "Sem técnico", value: rows.filter((call) => !call.driverId).length }
    ]) + `<div class="dashboard-grid">
      ${barChart("O.S. por prioridade", countBy(rows, (call) => call.priority || "Normal"))}
      ${barChart("O.S. por status", countBy(rows, (call) => call.status || call.statusKey))}
      ${barChart("O.S. por tipo", countBy(rows, (call) => call.serviceType || call.tipo || "Cliente"))}
      ${barChart("Agendadas por técnico", countBy(rows.filter((call) => call.slaLimit), (call) => call.driverName || call.driverId || "Sem técnico"))}
      ${barChart("Status por assunto", countBy(rows, (call) => (call.serviceType || call.tipo || "Serviço") + " / " + (call.status || call.statusKey || "Status")))}
      ${recentCallsTable("Ordens de serviço", rows, ctx)}
    </div>`;
  }

  function renderServidor(ctx, data) {
    const perf = typeof performance !== "undefined" ? performance : {};
    const nav = typeof navigator !== "undefined" ? navigator : {};
    const loc = typeof location !== "undefined" ? location : { origin: "local", protocol: "" };
    const memory = perf.memory ? Math.round(perf.memory.usedJSHeapSize / 1048576) + " MB" : "N/D";
    const sw = nav.serviceWorker ? "Disponível" : "Indisponível";
    const online = nav.onLine === false ? "Offline" : "Online";
    const cache = "jm-v26-ixc-dashboards-permissoes";
    return metrics([
      { label: "Conectividade", value: online },
      { label: "Service Worker", value: sw },
      { label: "Memória JS", value: memory },
      { label: "Cache ativo", value: cache }
    ]) + `<div class="dashboard-grid">
      ${barChart("Uso operacional por coleção", { Chamados: data.callsAll.length, Veículos: data.vehicles.length, Usuários: data.users.length, Clientes: visibleRows(data.customers).length, Financeiro: data.transactionsAll.length })}
      ${barChart("Status da frota/servidor", countBy(data.vehicles, (vehicle) => vehiclePoint(vehicle) ? "Com rastreamento" : "Sem rastreamento"))}
      ${tablePanel("Auditoria técnica do frontend", ["Item", "Resultado"], [
        `<tr><td>Origem</td><td>${esc(loc.origin)}</td></tr>`,
        `<tr><td>Modo</td><td>${esc(loc.protocol === "https:" ? "Seguro HTTPS" : "Local/HTTP")}</td></tr>`,
        `<tr><td>Atualização</td><td>${esc(new Date().toLocaleString("pt-BR"))}</td></tr>`,
        `<tr><td>Versão</td><td>${esc(cache)}</td></tr>`
      ])}
    </div>`;
  }

  function renderCatalog(ctx, data, def) {
    const rows = DASHBOARDS.map((item) => `<tr>
      <td><span class="badge info">${esc(item.icon)}</span></td>
      <td><b>${esc(item.label)}</b><br><span class="muted small">${esc(item.area)}</span></td>
      <td>${dashButton(item.key, "Abrir")}</td>
      <td>${docsButton(item)}</td>
    </tr>`);
    return metrics([
      { label: "Dashboards", value: DASHBOARDS.length },
      { label: "Áreas", value: Object.keys(countBy(DASHBOARDS, (item) => item.area)).length },
      { label: "Cards vivos", value: data.callsAll.length + data.transactionsAll.length + data.vehicles.length },
      { label: "Permissões", value: "Por usuário" }
    ]) + `<div class="dashboard-grid">
      ${barChart("Categorias", countBy(DASHBOARDS, (item) => item.area))}
      ${tablePanel("Catálogo de módulos e submódulos", ["Ícone", "Dashboard", "Módulo", "Documento"], rows)}
    </div>`;
  }

  function emptyFinanceCard() {
    return `<section class="dashboard-card dashboard-full">
      <h3>Informação financeira restrita</h3>
      <p class="muted">Este usuário não possui permissão financeira suficiente para visualizar valores, contas a pagar, contas a receber, cobranças ou faturas.</p>
    </section>`;
  }

  window.JM = window.JM || {};
  window.JM.ixcDashboards = {
    all,
    modules,
    get,
    render,
    defaultKey: "principal"
  };
}());
