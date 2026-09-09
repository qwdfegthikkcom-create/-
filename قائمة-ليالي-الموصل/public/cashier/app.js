const state = {
  token: null,
  orders: [],
  knownIds: new Set(),
  restaurantName: 'ليالي الموصل',
  pollTimer: null,
  activeTableOrders: []
};

function money(n) { return n.toLocaleString('en-US') + ' د.ع'; }

function toast(msg) {
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
  } catch (e) {}
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'x-auth': state.token, ...(opts.headers || {}) }
  });
  if (res.status === 401) { logout(); throw new Error('unauthorized'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error');
  return data;
}

function logout() {
  state.token = null;
  sessionStorage.removeItem('layali_cashier_token');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  if (state.pollTimer) clearInterval(state.pollTimer);
}

async function login(password) {
  const res = await fetch('/api/cashier/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  state.token = data.token;
  sessionStorage.setItem('layali_cashier_token', state.token);
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'منذ ' + diff + ' ثانية';
  if (diff < 3600) return 'منذ ' + Math.floor(diff / 60) + ' دقيقة';
  return 'منذ ' + Math.floor(diff / 3600) + ' ساعة';
}

function orderCard(order) {
  const div = document.createElement('div');
  const statusClass = order.status === 'new' ? 'status-new' : order.status === 'ready' ? 'status-ready' : '';
  div.className = 'order-card fade-in ' + statusClass;
  const itemsHtml = order.items.map((it) =>
    `<div><span>${it.qty}x ${it.name}${it.note ? ' <small style="color:#8b1a1a">(' + it.note + ')</small>' : ''}</span><span>${money(it.qty * it.price)}</span></div>`
  ).join('');

  let actions = '';
  if (order.status === 'new') {
    actions = `<button class="btn btn-success" data-act="accepted">✅ قبول</button>
               <button class="btn btn-danger" data-act="rejected">❌ رفض</button>`;
  } else if (order.status === 'accepted') {
    actions = `<button class="btn btn-success" data-act="ready">🟢 جاهز</button>`;
  } else if (order.status === 'ready') {
    actions = `<button class="btn" data-act="invoice">🧾 الفاتورة</button>`;
  }

  div.innerHTML = `
    <div class="order-top"><span>طلب #${String(order.orderNumber).padStart(3, '0')}</span><span>طاولة ${order.table}</span></div>
    <div class="order-time">⏰ ${timeAgo(order.createdAt)}</div>
    <div class="order-items">${itemsHtml}</div>
    ${order.note ? `<div class="order-note">📝 ${order.note}</div>` : ''}
    <div class="order-total">💰 المجموع: ${money(order.total)}</div>
    <div class="order-actions">${actions}</div>
  `;

  div.querySelectorAll('[data-act]').forEach((btn) => {
    btn.onclick = async () => {
      const act = btn.dataset.act;
      if (act === 'invoice') { openInvoiceForOrders([order]); return; }
      try {
        await api('/api/cashier/orders/' + order.id, { method: 'PATCH', body: JSON.stringify({ status: act }) });
        toast(act === 'accepted' ? 'تم قبول الطلب' : act === 'rejected' ? 'تم رفض الطلب' : 'الطلب جاهز الآن');
        loadOrders();
      } catch (e) { toast('خطأ، حاول مرة ثانية'); }
    };
  });
  return div;
}

async function loadOrders() {
  try {
    const orders = await api('/api/cashier/orders');
    const newOnes = orders.filter((o) => o.status === 'new' && !state.knownIds.has(o.id));
    if (state.knownIds.size > 0 && newOnes.length > 0) beep();
    orders.forEach((o) => state.knownIds.add(o.id));
    state.orders = orders;
    renderOrders();
    loadTables();
  } catch (e) {}
}

function renderOrders() {
  const listNew = document.getElementById('listNew');
  const listPrep = document.getElementById('listPreparing');
  const listReady = document.getElementById('listReady');
  listNew.innerHTML = ''; listPrep.innerHTML = ''; listReady.innerHTML = '';

  const news = state.orders.filter((o) => o.status === 'new');
  const preps = state.orders.filter((o) => o.status === 'accepted');
  const readies = state.orders.filter((o) => o.status === 'ready');

  if (news.length === 0) listNew.innerHTML = '<div class="empty-msg">لا توجد طلبات جديدة</div>';
  else news.forEach((o) => listNew.appendChild(orderCard(o)));

  if (preps.length === 0) listPrep.innerHTML = '<div class="empty-msg">لا يوجد طلبات قيد التحضير</div>';
  else preps.forEach((o) => listPrep.appendChild(orderCard(o)));

  if (readies.length === 0) listReady.innerHTML = '<div class="empty-msg">لا يوجد طلبات جاهزة</div>';
  else readies.forEach((o) => listReady.appendChild(orderCard(o)));
}

async function loadTables() {
  try {
    const tables = await api('/api/cashier/tables');
    const grid = document.getElementById('tableGrid');
    grid.innerHTML = '';
    tables.forEach((t) => {
      const cell = document.createElement('div');
      cell.className = 'table-cell ' + t.status;
      cell.textContent = t.table;
      cell.onclick = () => {
        if (t.orders.length === 0) return;
        openInvoiceForOrders(t.orders, t.table);
      };
      grid.appendChild(cell);
    });
  } catch (e) {}
}

function openInvoiceForOrders(orders, tableNum) {
  state.activeTableOrders = orders;
  const table = tableNum || orders[0].table;
  let rows = '';
  let total = 0;
  orders.forEach((o) => {
    o.items.forEach((it) => {
      rows += `<tr><td>${it.name}${it.note ? ' - ' + it.note : ''}</td><td>${it.qty}</td><td>${money(it.price)}</td><td>${money(it.qty * it.price)}</td></tr>`;
      total += it.qty * it.price;
    });
  });
  const content = document.getElementById('invoiceContent');
  content.innerHTML = `
    <h2>🏮 ليالي الموصل</h2>
    <div class="sub">فاتورة طاولة رقم ${table} — ${new Date().toLocaleString('ar-IQ')}</div>
    <table>
      <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="invoice-total"><span>المجموع الكلي</span><span>${money(total)}</span></div>
    <div class="invoice-foot">الدفع كاش فقط — شكراً لزيارتكم 🌙</div>
  `;
  document.getElementById('invoiceModal').classList.remove('hidden');
}

function closeInvoice() {
  document.getElementById('invoiceModal').classList.add('hidden');
  state.activeTableOrders = [];
}

async function markPaid() {
  try {
    for (const o of state.activeTableOrders) {
      await api('/api/cashier/orders/' + o.id, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) });
    }
    toast('تم تسجيل الدفع ✅');
    closeInvoice();
    loadOrders();
  } catch (e) { toast('خطأ، حاول مرة ثانية'); }
}

function bindEvents() {
  document.getElementById('btnLogin').onclick = doLogin;
  document.getElementById('loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('btnLogout').onclick = logout;
  document.getElementById('btnCloseInvoice').onclick = closeInvoice;
  document.getElementById('btnPrintInvoice').onclick = () => window.print();
  document.getElementById('btnMarkPaid').onclick = markPaid;
}

async function doLogin() {
  const pass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginErr');
  try {
    await login(pass);
    startApp();
  } catch (e) {
    err.textContent = 'كلمة السر غير صحيحة';
  }
}

function startApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  loadOrders();
  loadTables();
  refreshSummary();
  state.pollTimer = setInterval(() => { loadOrders(); refreshSummary(); }, 4000);
}

async function refreshSummary() {
  try {
    const sum = await api('/api/cashier/summary');
    document.getElementById('sumOrders').textContent = sum.totalOrders;
    document.getElementById('sumRevenue').textContent = money(sum.totalRevenue);
  } catch (e) {}
}

(function init() {
  bindEvents();
  const saved = sessionStorage.getItem('layali_cashier_token');
  if (saved) { state.token = saved; startApp(); }
})();
