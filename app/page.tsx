'use client'

import { useEffect, useState } from 'react'
import EntryScreen from '../components/EntryScreen'
import MenuView from '../components/MenuView'
import CashierPanel from '../components/CashierPanel'
import { CartLine, Order, OrderStatus, loadOrders, saveOrders, nextOrderNumber } from '../lib/store'

type View = 'entry' | 'menu' | 'cashier'

export default function Home() {
  const [view, setView] = useState<View>('entry')
  const [table, setTable] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setOrders(loadOrders())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveOrders(orders)
  }, [orders, loaded])

  function handleSendOrder(lines: CartLine[], note: string): string {
    const id = nextOrderNumber(orders)
    const total = lines.reduce((s, l) => s + l.qty * l.price, 0)
    const order: Order = {
      id,
      table: table || 0,
      lines,
      note: note.trim() || undefined,
      total,
      status: 'new',
      createdAt: Date.now(),
    }
    setOrders((prev) => [...prev, order])
    return id
  }

  function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, paidAt: status === 'paid' ? Date.now() : o.paidAt } : o))
    )
  }

  if (view === 'cashier') {
    return <CashierPanel orders={orders} onUpdateStatus={updateStatus} onClose={() => setView(table ? 'menu' : 'entry')} />
  }

  if (view === 'menu' && table) {
    return <MenuView table={table} onSendOrder={handleSendOrder} onOpenCashier={() => setView('cashier')} />
  }

  return (
    <EntryScreen
      onStart={(t) => {
        setTable(t)
        setView('menu')
      }}
    />
  )
}
