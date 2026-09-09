const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  getItems: () => readJSON(ITEMS_FILE, []),
  saveItems: (items) => writeJSON(ITEMS_FILE, items),
  getOrders: () => readJSON(ORDERS_FILE, []),
  saveOrders: (orders) => writeJSON(ORDERS_FILE, orders),
  getConfig: () => readJSON(CONFIG_FILE, {}),
  saveConfig: (config) => writeJSON(CONFIG_FILE, config)
};
