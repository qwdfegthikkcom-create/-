const express = require('express');
const path = require('path');
const os = require('os');
const db = require('./db');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Helpers ----------
function publicConfig() {
  const cfg = db.getConfig();
  return { restaurantName: cfg.restaurantName, tableCount: cfg.tableCount };
}

function requireAuth(role) {
  return (req, res, next) => {
    const cfg = db.getConfig();
    const key = role === 'admin' ? cfg.adminPassword : cfg.cashierPassword;
    const provided = req.get('x-auth');
    if (!provided || provided !== key) {
      return res.status(401).json({ error: 'غير مصرح' });
    }
    next();
  };
}

function computeOrderTotal(orderItems, catalog) {
  let total = 0;
  const resolved = orderItems.map((oi) => {
    const item = catalog.find((c) => c.id === oi.itemId);
    if (!item) return null;
    const qty = Math.max(1, parseInt(oi.qty, 10) || 1);
    const lineTotal = item.price * qty;
    total += lineTotal;
    return {
      itemId: item.id,
      name: item.name,
      price: item.price,
      qty,
      note: (oi.note || '').toString().slice(0, 200)
    };
  }).filter(Boolean);
  return { resolved, total };
}

// ---------- Public config ----------
app.get('/api/config', (req, res) => res.json(publicConfig()));

// ---------- Menu (public, only available items) ----------
app.get('/api/items', (req, res) => {
  const items = db.getItems().filter((i) => i.available);
  res.json(items);
});

// ---------- Orders (customer creates, tracks by id) ----------
app.post('/api/orders', (req, res) => {
  const { table, items, note } = req.body || {};
  const tableNum = parseInt(table, 10);
  const cfg = db.getConfig();
  if (!tableNum || tableNum < 1 || tableNum > cfg.tableCount) {
    return res.status(400).json({ error: 'رقم الطاولة غير صحيح' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'السلة فارغة' });
  }
  const catalog = db.getItems();
  const { resolved, total } = computeOrderTotal(items, catalog);
  if (resolved.length === 0) {
    return res.status(400).json({ error: 'الأصناف غير متوفرة' });
  }

  const orders = db.getOrders();
  const orderNumber = cfg.nextOrderNumber || 1;
  const order = {
    id: 'o' + Date.now() + Math.floor(Math.random() * 1000),
    orderNumber,
    table: tableNum,
    items: resolved,
    note: (note || '').toString().slice(0, 300),
    total,
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  orders.push(order);
  db.saveOrders(orders);
  cfg.nextOrderNumber = orderNumber + 1;
  db.saveConfig(cfg);
  res.json(order);
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.getOrders().find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'غير موجود' });
  res.json(order);
});

// ---------- Cashier ----------
app.post('/api/cashier/login', (req, res) => {
  const cfg = db.getConfig();
  if ((req.body || {}).password === cfg.cashierPassword) {
    return res.json({ ok: true, token: cfg.cashierPassword });
  }
  res.status(401).json({ error: 'كلمة السر غير صحيحة' });
});

app.get('/api/cashier/orders', requireAuth('cashier'), (req, res) => {
  const { status } = req.query;
  let orders = db.getOrders();
  if (status) orders = orders.filter((o) => o.status === status);
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

app.get('/api/cashier/tables', requireAuth('cashier'), (req, res) => {
  const cfg = db.getConfig();
  const orders = db.getOrders();
  const tables = [];
  for (let n = 1; n <= cfg.tableCount; n++) {
    const openOrders = orders
      .filter((o) => o.table === n && ['new', 'accepted', 'ready'].includes(o.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let status = 'empty';
    if (openOrders.some((o) => o.status === 'new')) status = 'new';
    else if (openOrders.some((o) => o.status === 'ready')) status = 'ready';
    else if (openOrders.some((o) => o.status === 'accepted')) status = 'preparing';
    tables.push({ table: n, status, orders: openOrders });
  }
  res.json(tables);
});

app.get('/api/cashier/summary', requireAuth('cashier'), (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const paidToday = db.getOrders().filter((o) => o.status === 'paid' && o.createdAt.slice(0, 10) === today);
  res.json({
    totalOrders: paidToday.length,
    totalRevenue: paidToday.reduce((s, o) => s + o.total, 0)
  });
});

app.patch('/api/cashier/orders/:id', requireAuth('cashier'), (req, res) => {
  const { status } = req.body || {};
  const allowed = ['accepted', 'rejected', 'ready', 'paid'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صحيحة' });
  const orders = db.getOrders();
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'غير موجود' });
  order.status = status;
  order.updatedAt = new Date().toISOString();
  db.saveOrders(orders);
  res.json(order);
});

// ---------- Admin ----------
app.post('/api/admin/login', (req, res) => {
  const cfg = db.getConfig();
  if ((req.body || {}).password === cfg.adminPassword) {
    return res.json({ ok: true, token: cfg.adminPassword });
  }
  res.status(401).json({ error: 'كلمة السر غير صحيحة' });
});

app.get('/api/admin/items', requireAuth('admin'), (req, res) => {
  res.json(db.getItems());
});

app.post('/api/admin/items', requireAuth('admin'), (req, res) => {
  const items = db.getItems();
  const body = req.body || {};
  if (!body.name || !body.category || !body.price) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }
  const item = {
    id: 'it' + Date.now() + Math.floor(Math.random() * 1000),
    category: body.category,
    name: body.name,
    description: body.description || '',
    price: parseInt(body.price, 10) || 0,
    image: body.image || 'kebab.svg',
    available: body.available !== false
  };
  items.push(item);
  db.saveItems(items);
  res.json(item);
});

app.put('/api/admin/items/:id', requireAuth('admin'), (req, res) => {
  const items = db.getItems();
  const item = items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'غير موجود' });
  const body = req.body || {};
  ['name', 'description', 'image', 'category'].forEach((f) => {
    if (body[f] !== undefined) item[f] = body[f];
  });
  if (body.price !== undefined) item.price = parseInt(body.price, 10) || item.price;
  if (body.available !== undefined) item.available = !!body.available;
  db.saveItems(items);
  res.json(item);
});

app.delete('/api/admin/items/:id', requireAuth('admin'), (req, res) => {
  let items = db.getItems();
  const before = items.length;
  items = items.filter((i) => i.id !== req.params.id);
  db.saveItems(items);
  res.json({ ok: true, deleted: before - items.length });
});

app.get('/api/admin/reports', requireAuth('admin'), (req, res) => {
  const { date } = req.query;
  const orders = db.getOrders().filter((o) => o.status === 'paid');
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const dayOrders = orders.filter((o) => o.createdAt.slice(0, 10) === targetDate);

  const totalRevenue = dayOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = dayOrders.length;

  const byItem = {};
  const byCategory = {};
  const byHour = {};
  const catalog = db.getItems();
  const catMap = Object.fromEntries(catalog.map((c) => [c.id, c.category]));

  dayOrders.forEach((o) => {
    const hour = new Date(o.createdAt).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
    o.items.forEach((it) => {
      byItem[it.name] = byItem[it.name] || { qty: 0, revenue: 0 };
      byItem[it.name].qty += it.qty;
      byItem[it.name].revenue += it.qty * it.price;
      const cat = catMap[it.itemId] || 'أخرى';
      byCategory[cat] = (byCategory[cat] || 0) + it.qty * it.price;
    });
  });

  const topItems = Object.entries(byItem)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty);

  let peakHour = null;
  let peakCount = 0;
  Object.entries(byHour).forEach(([h, c]) => {
    if (c > peakCount) { peakCount = c; peakHour = h; }
  });

  res.json({
    date: targetDate,
    totalOrders,
    totalRevenue,
    topItems,
    byCategory,
    peakHour: peakHour !== null ? `${peakHour}:00` : null
  });
});

app.get('/api/admin/config', requireAuth('admin'), (req, res) => {
  const cfg = db.getConfig();
  res.json({ restaurantName: cfg.restaurantName, tableCount: cfg.tableCount, serverAddress: cfg.serverAddress || '' });
});

app.put('/api/admin/config', requireAuth('admin'), (req, res) => {
  const cfg = db.getConfig();
  const body = req.body || {};
  if (body.restaurantName) cfg.restaurantName = body.restaurantName;
  if (body.tableCount) cfg.tableCount = parseInt(body.tableCount, 10) || cfg.tableCount;
  if (body.serverAddress !== undefined) cfg.serverAddress = body.serverAddress;
  db.saveConfig(cfg);
  res.json({ restaurantName: cfg.restaurantName, tableCount: cfg.tableCount, serverAddress: cfg.serverAddress || '' });
});

// ---------- Root ----------
app.get('/', (req, res) => res.redirect('/menu/'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const nets = os.networkInterfaces();
  const lanIps = [];
  Object.values(nets).forEach((ifaces) => {
    (ifaces || []).forEach((net) => {
      if (net.family === 'IPv4' && !net.internal) lanIps.push(net.address);
    });
  });
  console.log('');
  console.log('  ليالي الموصل - النظام يعمل الآن');
  console.log('  =================================');
  console.log('  على هذا الجهاز:');
  console.log('   منيو الزبون : http://localhost:' + PORT + '/menu/');
  console.log('   الكاشير    : http://localhost:' + PORT + '/cashier/');
  console.log('   لوحة التحكم: http://localhost:' + PORT + '/admin/');
  if (lanIps.length) {
    console.log('');
    console.log('  للأجهزة الأخرى على نفس شبكة الواي فاي استخدم:');
    lanIps.forEach((ip) => console.log('   http://' + ip + ':' + PORT + '/menu/'));
    console.log('');
    console.log('  ضع هذا العنوان (' + lanIps[0] + ':' + PORT + ') في تبويب "إعدادات" داخل لوحة التحكم');
    console.log('  حتى تعمل رموز QR بشكل صحيح لكل الزبائن.');
  }
  console.log('');
});
