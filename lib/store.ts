export type CartLine = {
  itemId: string
  name: string
  price: number
  qty: number
  note?: string
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'paid'

export type Order = {
  id: string
  table: number
  lines: CartLine[]
  note?: string
  total: number
  status: OrderStatus
  createdAt: number
  paidAt?: number
}

const ORDERS_KEY = 'cafesayf_orders_v1'

export function loadOrders(): Order[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY)
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

export function saveOrders(orders: Order[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
  } catch {
    // تخزين ممتلئ أو غير متاح؛ نتجاهل بصمت لأن الحالة تبقى بالذاكرة خلال الجلسة
  }
}

export function nextOrderNumber(orders: Order[]): string {
  const n = orders.length + 1
  return String(n).padStart(3, '0')
}

export function formatIQD(n: number): string {
  return n.toLocaleString('en-US') + ' د.ع'
}

export function todayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
