const CAT_NAMES = {
  grills: 'المشاوي', appetizers: 'المقبلات', mains: 'أطباق رئيسية',
  rice: 'الأرز', drinks: 'المشروبات', desserts: 'الحلويات'
};
const PRESET_IMAGES = ['kebab.svg', 'tikka.svg', 'fish.svg', 'rice.svg', 'soup.svg', 'salad.svg', 'dolma.svg', 'juice.svg', 'tea.svg', 'baklava.svg', 'kunafa.svg'];

const state = { token: null, items: [], editingId: null, selectedImage: PRESET_IMAGES[0], config: {} };

function money(n) { return n.toLocaleString('en-US') + ' د.ع'; }
function imgSrc(image) {
  if (!image) return '../assets/images/kebab.svg';
  if (image.startsWith('data:') || image.startsWith('http')) return image;
  return '../assets/images/' + image;
}

function toast(msg) {
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 2200);
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
  sessionStorage.removeItem('layali_admin_token');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

async function login(password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  state.token = data.token;
  sessionStorage.setItem('layali_admin_token', state.token);
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab));
  if (tab === 'reports') loadReports();
  if (tab === 'qr') loadQr();
  if (tab === 'settings') loadSettings();
}

// ---------- Items ----------
async function loadItems() {
  state.items = await api('/api/admin/items');
  renderItems();
}

function renderItems() {
  const box = document.getElementById('itemsTable');
  box.innerHTML = '';
  Object.keys(CAT_NAMES).forEach((cat) => {
    const items = state.items.filter((i) => i.category === cat);
    if (items.length === 0) return;
    const h = document.createElement('div');
    h.className = 'cat-heading';
    h.textContent = CAT_NAMES[cat];
    box.appendChild(h);
    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'item-row fade-in' + (item.available ? '' : ' unavailable');
      row.innerHTML = `
        <img src="${imgSrc(item.image)}" alt="">
        <div class="info"><div class="name">${item.name}</div><div class="meta">${item.description || ''}</div></div>
        <div class="price">${money(item.price)}</div>
        <span class="avail-dot"></span>
      `;
      row.onclick = () => openItemModal(item);
      box.appendChild(row);
    });
  });
  if (state.items.length === 0) box.innerHTML = '<p style="text-align:center;color:#8a7a5c;">لا توجد أصناف بعد</p>';
}

function buildImagePicker() {
  const picker = document.getElementById('imagePicker');
  picker.innerHTML = '';
  PRESET_IMAGES.forEach((img) => {
    const el = document.createElement('img');
    el.src = '../assets/images/' + img;
    el.className = img === state.selectedImage ? 'selected' : '';
    el.onclick = () => { state.selectedImage = img; buildImagePicker(); };
    picker.appendChild(el);
  });
}

function openItemModal(item) {
  state.editingId = item ? item.id : null;
  document.getElementById('itemModalTitle').textContent = item ? 'تعديل صنف' : 'إضافة صنف';
  document.getElementById('fName').value = item ? item.name : '';
  document.getElementById('fCategory').value = item ? item.category : 'grills';
  document.getElementById('fDesc').value = item ? (item.description || '') : '';
  document.getElementById('fPrice').value = item ? item.price : '';
  document.getElementById('fAvailable').checked = item ? item.available : true;
  document.getElementById('fUpload').value = '';
  state.selectedImage = item ? item.image : PRESET_IMAGES[0];
  buildImagePicker();
  document.getElementById('btnDeleteItem').classList.toggle('hidden', !item);
  document.getElementById('itemModal').classList.remove('hidden');
}

function closeItemModal() {
  document.getElementById('itemModal').classList.add('hidden');
  state.editingId = null;
}

async function saveItem() {
  const body = {
    name: document.getElementById('fName').value.trim(),
    category: document.getElementById('fCategory').value,
    description: document.getElementById('fDesc').value.trim(),
    price: parseInt(document.getElementById('fPrice').value, 10) || 0,
    image: state.selectedImage,
    available: document.getElementById('fAvailable').checked
  };
  if (!body.name || !body.price) { toast('الرجاء إدخال الاسم والسعر'); return; }
  try {
    if (state.editingId) await api('/api/admin/items/' + state.editingId, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/api/admin/items', { method: 'POST', body: JSON.stringify(body) });
    toast('تم الحفظ ✅');
    closeItemModal();
    loadItems();
  } catch (e) { toast('خطأ أثناء الحفظ'); }
}

async function deleteItem() {
  if (!state.editingId) return;
  if (!confirm('هل تريد حذف هذا الصنف؟')) return;
  try {
    await api('/api/admin/items/' + state.editingId, { method: 'DELETE' });
    toast('تم الحذف');
    closeItemModal();
    loadItems();
  } catch (e) { toast('تعذر الحذف'); }
}

function handleUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.selectedImage = reader.result;
    toast('تم رفع الصورة، احفظ الصنف لتطبيقها');
  };
  reader.readAsDataURL(file);
}

// ---------- Reports ----------
async function loadReports() {
  const dateInput = document.getElementById('reportDate');
  if (!dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
  const rep = await api('/api/admin/reports?date=' + dateInput.value);
  document.getElementById('repOrders').textContent = rep.totalOrders;
  document.getElementById('repRevenue').textContent = money(rep.totalRevenue);
  document.getElementById('repPeak').textContent = rep.peakHour || '-';

  const topList = document.getElementById('topItemsList');
  topList.innerHTML = '';
  if (rep.topItems.length === 0) topList.innerHTML = '<p style="color:#8a7a5c;">لا توجد مبيعات في هذا اليوم</p>';
  rep.topItems.slice(0, 10).forEach((it) => {
    const row = document.createElement('div');
    row.className = 'top-item-row';
    row.innerHTML = `<span>${it.name}</span><span>${it.qty} × — ${money(it.revenue)}</span>`;
    topList.appendChild(row);
  });

  const catBox = document.getElementById('catBars');
  catBox.innerHTML = '';
  const entries = Object.entries(rep.byCategory).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;
  entries.forEach(([cat, val]) => {
    const row = document.createElement('div');
    row.className = 'cat-bar-row';
    row.innerHTML = `
      <div class="cat-bar-label"><span>${CAT_NAMES[cat] || cat}</span><span>${money(val)}</span></div>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${Math.round((val / max) * 100)}%"></div></div>
    `;
    catBox.appendChild(row);
  });
  if (entries.length === 0) catBox.innerHTML = '<p style="color:#8a7a5c;">لا توجد بيانات</p>';
}

// ---------- QR ----------
function loadQr() {
  const grid = document.getElementById('qrGrid');
  grid.innerHTML = '';
  const base = state.config.serverAddress ? 'http://' + state.config.serverAddress : location.origin;
  for (let n = 1; n <= (state.config.tableCount || 20); n++) {
    const card = document.createElement('div');
    card.className = 'qr-card';
    const qrHolder = document.createElement('div');
    card.appendChild(qrHolder);
    const label = document.createElement('div');
    label.className = 'qr-table-num';
    label.textContent = 'طاولة رقم ' + n;
    card.appendChild(label);
    grid.appendChild(card);
    new QRCode(qrHolder, {
      text: base + '/menu/?table=' + n,
      width: 120, height: 120,
      colorDark: '#1b2a4a', colorLight: '#ffffff'
    });
  }
}

// ---------- Settings ----------
async function loadSettings() {
  const cfg = await api('/api/admin/config');
  state.config = cfg;
  document.getElementById('setName').value = cfg.restaurantName;
  document.getElementById('setTables').value = cfg.tableCount;
  document.getElementById('setAddress').value = cfg.serverAddress || '';
}

async function saveSettings() {
  try {
    const cfg = await api('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify({
        restaurantName: document.getElementById('setName').value.trim(),
        tableCount: parseInt(document.getElementById('setTables').value, 10),
        serverAddress: document.getElementById('setAddress').value.trim()
      })
    });
    state.config = cfg;
    toast('تم حفظ الإعدادات ✅');
  } catch (e) { toast('تعذر الحفظ'); }
}

function bindEvents() {
  document.getElementById('btnLogin').onclick = doLogin;
  document.getElementById('loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('btnLogout').onclick = logout;
  document.querySelectorAll('.tab-btn').forEach((b) => { b.onclick = () => switchTab(b.dataset.tab); });
  document.getElementById('btnAddItem').onclick = () => openItemModal(null);
  document.getElementById('btnCancelItem').onclick = closeItemModal;
  document.getElementById('btnSaveItem').onclick = saveItem;
  document.getElementById('btnDeleteItem').onclick = deleteItem;
  document.getElementById('fUpload').addEventListener('change', (e) => handleUpload(e.target.files[0]));
  document.getElementById('reportDate').addEventListener('change', loadReports);
  document.getElementById('btnPrintAllQr').onclick = () => window.print();
  document.getElementById('btnSaveSettings').onclick = saveSettings;
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

async function startApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  state.config = await api('/api/admin/config');
  await loadItems();
}

(function init() {
  bindEvents();
  const saved = sessionStorage.getItem('layali_admin_token');
  if (saved) { state.token = saved; startApp(); }
})();
