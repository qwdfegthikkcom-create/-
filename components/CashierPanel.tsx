'use client'

import { useMemo, useState, ReactNode } from 'react'
import { Order, OrderStatus, formatIQD, todayKey } from '../lib/store'
import { TABLE_COUNT } from '../lib/menu'
import Invoice from './Invoice'

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'طلب جديد',
  preparing: 'قيد التحضير',
  ready: 'جاهز للدفع',
  paid: 'مكتمل',
}

export default function CashierPanel({
  orders,
  onUpdateStatus,
  onClose,
}: {
  orders: Order[]
  onUpdateStatus: (id: string, status: OrderStatus) => void
  onClose: () => void
}) {
  const [printOrder, setPrintOrder] = useState<Order | null>(null)

  const active = orders.filter((o) => o.status !== 'paid')
  const newOrders = active.filter((o) => o.status === 'new')
  const preparing = active.filter((o) => o.status === 'preparing')
  const ready = active.filter((o) => o.status === 'ready')

  const today = todayKey(Date.now())
  const paidToday = orders.filter((o) => o.status === 'paid' && o.paidAt && todayKey(o.paidAt) === today)

  const report = useMemo(() => {
    const total = paidToday.reduce((s, o) => s + o.total, 0)
    const counts: Record<string, number> = {}
    paidToday.forEach((o) => o.lines.forEach((l) => { counts[l.name] = (counts[l.name] || 0) + l.qty }))
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { total, count: paidToday.length, top }
  }, [paidToday])

  const tableStatus = useMemo(() => {
    const map: Record<number, OrderStatus | 'empty'> = {}
    for (let t = 1; t <= TABLE_COUNT; t++) map[t] = 'empty'
    active
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((o) => { map[o.table] = o.status })
    return map
  }, [active])

  const tableColor: Record<string, string> = {
    empty: 'bg-sand-100 text-ink-800/40',
    new: 'bg-rust-500 text-sand-50 animate-pop',
    preparing: 'bg-dune-400 text-sand-50',
    ready: 'bg-green-500 text-sand-50',
  }

  function OrderCard({ o, actions }: { o: Order; actions: ReactNode }) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-dune-300/20 shadow-sm animate-fade-up">
        <div className="flex items-center justify-between">
          <span className="font-bold text-ink-900">طلب #{o.id} — طاولة {o.table}</span>
          <span className="text-xs text-ink-800/50">
            {new Date(o.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <ul className="mt-2 text-sm space-y-1">
          {o.lines.map((l) => (
            <li key={l.itemId} className="flex justify-between text-ink-800/80">
              <span>{l.qty}× {l.name}{l.note ? ` (${l.note})` : ''}</span>
              <span>{formatIQD(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        {o.note && <p className="text-xs text-ink-800/60 mt-1">📝 {o.note}</p>}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-dune-300/20">
          <span className="font-bold text-rust-600">{formatIQD(o.total)}</span>
          <div className="flex gap-2">{actions}</div>
        </div>
      </div>
    )
  }

  const btn = 'px-3 py-1.5 rounded-lg text-sm font-bold transition active:scale-95'

  return (
    <div className="min-h-screen bg-sand-50 desert-texture">
      <header className="sticky top-0 z-30 bg-ink-900 text-sand-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧾</span>
          <h1 className="font-bold text-lg">كاشير — كافي صيف</h1>
        </div>
        <button onClick={onClose} className="text-sm bg-sand-50/10 px-3 py-1.5 rounded-lg hover:bg-sand-50/20">
          ◄ رجوع للمنيو
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 border border-dune-300/20 text-center">
            <p className="text-xs text-ink-800/50">طلبات اليوم</p>
            <p className="font-bold text-xl text-rust-600">{report.count}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-dune-300/20 text-center">
            <p className="text-xs text-ink-800/50">مبيعات اليوم</p>
            <p className="font-bold text-xl text-rust-600">{formatIQD(report.total)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-dune-300/20 text-center">
            <p className="text-xs text-ink-800/50">طلبات نشطة</p>
            <p className="font-bold text-xl text-rust-600">{active.length}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-dune-300/20 text-center">
            <p className="text-xs text-ink-800/50">الأكثر مبيعاً</p>
            <p className="font-bold text-sm text-ink-900 truncate">{report.top[0]?.[0] || '—'}</p>
          </div>
        </div>

        <section>
          <h2 className="font-bold text-ink-900 mb-3">🪑 حالة الطاولات</h2>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((t) => (
              <div key={t} className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm ${tableColor[tableStatus[t]]}`}>
                {t}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-800/60">
            <span>⬜ فارغة</span>
            <span>🟥 طلب جديد</span>
            <span>🟧 تحضير</span>
            <span>🟩 جاهز للدفع</span>
          </div>
        </section>

        {newOrders.length > 0 && (
          <section>
            <h2 className="font-bold text-ink-900 mb-3">🔔 طلبات جديدة</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {newOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  o={o}
                  actions={
                    <>
                      <button className={`${btn} bg-green-500 text-white`} onClick={() => onUpdateStatus(o.id, 'preparing')}>✅ قبول</button>
                      <button className={`${btn} bg-sand-100 text-ink-800`} onClick={() => setPrintOrder(o)}>🖨️</button>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {preparing.length > 0 && (
          <section>
            <h2 className="font-bold text-ink-900 mb-3">⏳ قيد التحضير</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {preparing.map((o) => (
                <OrderCard
                  key={o.id}
                  o={o}
                  actions={
                    <button className={`${btn} bg-dune-500 text-white`} onClick={() => onUpdateStatus(o.id, 'ready')}>🟢 جاهز</button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {ready.length > 0 && (
          <section>
            <h2 className="font-bold text-ink-900 mb-3">💵 بانتظار الدفع</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {ready.map((o) => (
                <OrderCard
                  key={o.id}
                  o={o}
                  actions={
                    <>
                      <button className={`${btn} bg-sand-100 text-ink-800`} onClick={() => setPrintOrder(o)}>🖨️ فاتورة</button>
                      <button className={`${btn} bg-rust-600 text-white`} onClick={() => onUpdateStatus(o.id, 'paid')}>💵 تم الدفع</button>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {active.length === 0 && (
          <p className="text-center text-ink-800/40 py-10">لا توجد طلبات نشطة حالياً</p>
        )}

        {report.top.length > 0 && (
          <section>
            <h2 className="font-bold text-ink-900 mb-3">📊 تقرير مبيعات اليوم</h2>
            <div className="bg-white rounded-xl p-4 border border-dune-300/20">
              <ul className="space-y-1 text-sm">
                {report.top.map(([name, qty]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="text-ink-800/60">{qty} مرة</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

      {printOrder && (
        <div className="fixed inset-0 z-50 bg-ink-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-h-[90vh] overflow-y-auto">
            <Invoice order={printOrder} />
            <div className="p-4 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl bg-rust-600 text-white font-bold">🖨️ طباعة</button>
              <button onClick={() => setPrintOrder(null)} className="flex-1 py-2.5 rounded-xl bg-sand-100 text-ink-800 font-bold">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
