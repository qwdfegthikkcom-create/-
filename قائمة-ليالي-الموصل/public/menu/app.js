const CATS = [
  { id: 'grills', name: 'المشاوي', icon: '../assets/images/kebab.svg' },
  { id: 'appetizers', name: 'المقبلات', icon: '../assets/images/salad.svg' },
  { id: 'mains', name: 'أطباق رئيسية', icon: '../assets/images/fish.svg' },
  { id: 'rice', name: 'الأرز', icon: '../assets/images/rice.svg' },
  { id: 'drinks', name: 'المشروبات', icon: '../assets/images/juice.svg' },
  { id: 'desserts', name: 'الحلويات', icon: '../assets/images/baklava.svg' }
];

const state = {
  table: null,
  items: [],
  cart: {}, // itemId -> {item, qty, note}
  currentCat: null,
  config: { restaurantName: 'ليالي الموصل', tableCount: 20 },
  lastOrder: null,
  pollTimer: null
};

function money(n) {
  return n.toLocaleString('en-US') + ' د.ع';
}

function imgSrc(image) {
  if (!image) return '../assets/images/kebab.svg';
  if (image.startsWith('data:') || image.startsWith('http')) return image;
  return '../assets/images/' + image;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

function toast(msg) {
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function cartCount() {
  return Object.values(state.cart).reduce((s, l) => s + l.qty, 0);
}
function cartTotal() {
  return Object.values(state.cart).reduce((s, l) => s + l.qty * l.item.price, 0);
}

function saveCart() {
  if (!state.table) return;
  localStorage.setItem('layali_cart_' + state.table, JSON.stringify(
    Object.fromEntries(Object.entries(state.cart).map(([k, v]) => [k, { qty: v.qty, note: v.note }]))
  ));
}
function loadCart() {
  if (!state.table) return;
  try {
    const raw = JSON.parse(localStorage.getItem('layali_cart_' + state.table) || '{}');
    Object.entries(raw).forEach(([itemId, v]) => {
      const item = state.items.find((i) => i.id === itemId);
      if (item) state.cart[itemId] = { item, qty: v.qty, note: v.note || '' };
    });
  } catch (e) {}
}

function updateCartFab() {
  const fab = document.getElementById('cartFab');
  const count = cartCount();
  if (count === 0) { fab.classList.add('hidden'); return; }
  fab.classList.remove('hidden');
  const badge = document.getElementById('cartFabCount');
  badge.textContent = count;
  badge.classList.remove('badge-bounce');
  void badge.offsetWidth;
  badge.classList.add('badge-bounce');
  document.getElementById('cartFabTotal').textContent = money(cartTotal());
}

// ---------- init ----------
async function init() {
  const cfgRes = await fetch('/api/config');
  state.config = await cfgRes.json();
  document.getElementById('welcomeName').textContent = state.config.restaurantName;

  const itemsRes = await fetch('/api/items');
  state.items = await itemsRes.json();

  const params = new URLSearchParams(location.search);
  const t = parseInt(params.get('table'), 10);
  if (t && t >= 1 && t <= state.config.tableCount) {
    setTable(t);
  } else {
    const saved = parseInt(localStorage.getItem('layali_table'), 10);
    if (saved && saved >= 1 && saved <= state.config.tableCount) setTable(saved);
  }

  renderCategories();
  bindEvents();
}

function setTable(n) {
  state.table = n;
  localStorage.setItem('layali_table', n);
  document.getElementById('tableBadgeWrap').innerHTML =
    `<span class="table-pill">📍 طاولة رقم ${n}</span>`;
  document.getElementById('tablePillCats').innerHTML = `📍 طاولة ${n}`;
  state.cart = {};
  loadCart();
  updateCartFab();
}

function buildTableGrid() {
  const grid = document.getElementById('tableGrid');
  grid.innerHTML = '';
  for (let i = 1; i <= state.config.tableCount; i++) {
    const b = document.createElement('button');
    b.textContent = i;
    b.onclick = () => { setTable(i); showScreen('screen-categories'); };
    grid.appendChild(b);
  }
}

function renderCategories() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = '';
  CATS.forEach((cat) => {
    const has = state.items.some((i) => i.category === cat.id);
    if (!has) return;
    const div = document.createElement('div');
    div.className = 'cat-card fade-in';
    div.innerHTML = `<img src="${cat.icon}" alt="${cat.name}"><div class="cat-name">${cat.name}</div>`;
    div.onclick = () => openCategory(cat);
    grid.appendChild(div);
  });
}

function openCategory(cat) {
  state.currentCat = cat;
  document.getElementById('catTitle').textContent = cat.name;
  renderItems(cat.id);
  showScreen('screen-items');
}

function renderItems(catId) {
  const list = document.getElementById('itemsList');
  list.innerHTML = '';
  const items = state.items.filter((i) => i.category === catId);
  items.forEach((item) => {
    const line = state.cart[item.id];
    const qty = line ? line.qty : 0;
    const card = document.createElement('div');
    card.className = 'item-card fade-in' + (item.available ? '' : ' unavailable');
    card.innerHTML = `
      <img src="${imgSrc(item.image)}" alt="${item.name}">
      <div class="item-info">
        <h3>${item.name}</h3>
        <div class="item-desc">${item.description || ''}</div>
        <div class="item-price">💰 ${money(item.price)}</div>
        <div class="qty-row">
          <button class="qty-btn" data-act="dec">−</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn" data-act="inc">+</button>
        </div>
        <textarea class="item-note" placeholder="📝 ملاحظات (مثلاً: بدون بصل)">${line ? line.note : ''}</textarea>
        <button class="btn add-btn">🛒 أضف للسلة</button>
      </div>`;
    const qtyVal = card.querySelector('.qty-val');
    const noteEl = card.querySelector('.item-note');
    let localQty = qty || 1;
    qtyVal.textContent = localQty;
    card.querySelector('[data-act="dec"]').onclick = () => {
      localQty = Math.max(1, localQty - 1);
      qtyVal.textContent = localQty;
    };
    card.querySelector('[data-act="inc"]').onclick = () => {
      localQty = localQty + 1;
      qtyVal.textContent = localQty;
    };
    card.querySelector('.add-btn').onclick = () => {
      state.cart[item.id] = { item, qty: localQty, note: noteEl.value.trim() };
      saveCart();
      updateCartFab();
      toast(`تمت إضافة ${item.name} ✅`);
      card.classList.remove('pop-in');
      void card.offsetWidth;
      card.classList.add('pop-in');
    };
    list.appendChild(card);
  });
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const lines = Object.values(state.cart);
  if (lines.length === 0) {
    body.innerHTML = '<div class="empty-cart">🛒 سلتك فارغة، رجاءً اختر من المنيو</div>';
  } else {
    body.innerHTML = '';
    lines.forEach((line) => {
      const div = document.createElement('div');
      div.className = 'cart-line fade-in';
      div.innerHTML = `
        <div class="cart-line-top"><span>${line.item.name}</span><span>x${line.qty}</span></div>
        ${line.note ? `<div class="cart-line-note">📝 ${line.note}</div>` : ''}
        <div class="cart-line-bottom">
          <div class="cart-line-actions">
            <button class="qty-btn" data-act="dec">−</button>
            <span class="qty-val">${line.qty}</span>
            <button class="qty-btn" data-act="inc">+</button>
            <button class="remove-btn">🗑️ حذف</button>
          </div>
          <span class="cart-line-price">${money(line.qty * line.item.price)}</span>
        </div>`;
      div.querySelector('[data-act="dec"]').onclick = () => {
        line.qty = Math.max(1, line.qty - 1);
        saveCart(); renderCart(); updateCartFab();
      };
      div.querySelector('[data-act="inc"]').onclick = () => {
        line.qty += 1;
        saveCart(); renderCart(); updateCartFab();
      };
      div.querySelector('.remove-btn').onclick = () => {
        delete state.cart[line.item.id];
        saveCart(); renderCart(); updateCartFab();
      };
      body.appendChild(div);
    });
  }
  document.getElementById('cartTotal').textContent = money(cartTotal());
}

async function sendOrder() {
  const lines = Object.values(state.cart);
  if (lines.length === 0) return;
  const btn = document.getElementById('btnSendOrder');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> جارِ الإرسال...';
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: state.table,
        items: lines.map((l) => ({ itemId: l.item.id, qty: l.qty, note: l.note })),
        note: document.getElementById('generalNote').value.trim()
      })
    });
    const order = await res.json();
    if (!res.ok) throw new Error(order.error || 'خطأ');
    state.lastOrder = order;
    state.cart = {};
    saveCart();
    updateCartFab();
    document.getElementById('confOrderNum').textContent = '#' + String(order.orderNumber).padStart(3, '0');
    document.getElementById('confTable').textContent = order.table;
    document.getElementById('statusLine').textContent = '⏳ بانتظار تأكيد المطعم';
    showScreen('screen-confirm');
    pollOrderStatus(order.id);
  } catch (e) {
    toast('تعذّر إرسال الطلب، حاول مرة ثانية');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📤 إرسال الطلب';
  }
}

function pollOrderStatus(orderId) {
  if (state.pollTimer) clearInterval(state.pollTimer);
  const labels = {
    new: '⏳ بانتظار تأكيد المطعم',
    accepted: '👨‍🍳 جارِ تحضير طلبك',
    rejected: '❌ تم رفض الطلب، الرجاء مراجعة الكاشير',
    ready: '🔔 طلبك جاهز!',
    paid: '✅ تم الدفع، شكراً لزيارتكم'
  };
  const check = async () => {
    try {
      const res = await fetch('/api/orders/' + orderId);
      if (!res.ok) return;
      const order = await res.json();
      document.getElementById('statusLine').textContent = labels[order.status] || order.status;
      if (order.status === 'paid') clearInterval(state.pollTimer);
    } catch (e) {}
  };
  check();
  state.pollTimer = setInterval(check, 4000);
}

function bindEvents() {
  document.getElementById('btnOpenMenu').onclick = () => {
    if (!state.table) { buildTableGrid(); showScreen('screen-table'); }
    else showScreen('screen-categories');
  };
  document.getElementById('btnBackToCats').onclick = () => showScreen('screen-categories');
  document.getElementById('cartFab').onclick = () => { renderCart(); showScreen('screen-cart'); };
  document.getElementById('btnBackFromCart').onclick = () => showScreen('screen-categories');
  document.getElementById('btnSendOrder').onclick = sendOrder;
  document.getElementById('btnNewOrder').onclick = () => showScreen('screen-categories');
}

init();
