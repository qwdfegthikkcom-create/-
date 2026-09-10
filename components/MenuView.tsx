'use client'

import { useMemo, useState } from 'react'
import { categories, menuItems, MenuItem } from '../lib/menu'
import { CartLine, formatIQD } from '../lib/store'
import ItemImage from './ItemImage'
import Reveal from './Reveal'

export default function MenuView({
  table,
  onSendOrder,
  onOpenCashier,
}: {
  table: number
  onSendOrder: (lines: CartLine[], note: string) => string
  onOpenCashier: () => void
}) {
  const [activeCat, setActiveCat] = useState(categories[0].id)
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [confirmedOrder, setConfirmedOrder] = useState<string | null>(null)
  const [bump, setBump] = useState(false)

  const items = useMemo(
    () => menuItems.filter((i) => i.category === activeCat),
    [activeCat]
  )

  const cartLines = Object.values(cart).filter((l) => l.qty > 0)
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0)
  const cartTotal = cartLines.reduce((s, l) => s + l.qty * l.price, 0)

  function setQty(item: MenuItem, qty: number) {
    setCart((prev) => ({
      ...prev,
      [item.id]: {
        itemId: item.id,
        name: item.name,
        price: item.price,
        qty: Math.max(0, qty),
        note: notes[item.id]?.trim() || undefined,
      },
    }))
    setBump(true)
    setTimeout(() => setBump(false), 350)
  }

  function addOne(item: MenuItem) {
    const current = cart[item.id]?.qty || 0
    setQty(item, current + 1)
  }

  function adjustCartLine(itemId: string, delta: number) {
    setCart((prev) => {
      const line = prev[itemId]
      if (!line) return prev
      return {
        ...prev,
        [itemId]: { ...line, qty: Math.max(0, line.qty + delta) },
      }
    })
  }

  function send() {
    if (cartLines.length === 0) return
    const id = onSendOrder(cartLines, orderNote)
    setConfirmedOrder(id)
    setCart({})
    setNotes({})
    setOrderNote('')
    setCartOpen(false)
  }

  if (confirmedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-sand-50">
        <Reveal className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center text-4xl mb-5 animate-pop">
            ✅
          </div>
          <h2 className="font-display text-3xl text-ink-900 mb-2">تم إرسال طلبك بنجاح!</h2>
          <p className="text-ink-800/70">رقم الطلب #{confirmedOrder} · طاولة {table}</p>
          <p className="text-ink-800/70 mt-1">⏳ يتم تحضير طلبك الآن</p>
          <p className="text-rust-600 font-bold mt-1">💵 الدفع كاش عند الكاشير</p>
          <button
            onClick={() => setConfirmedOrder(null)}
            className="mt-8 w-full py-3 rounded-xl bg-gradient-to-l from-rust-600 to-dune-500 text-sand-50 font-bold shadow-lg shadow-rust-600/30 hover:brightness-110 active:scale-[0.98] transition"
          >
            طلب جديد
          </button>
        </Reveal>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50 desert-texture pb-28">
      {/* زر الكاشير بالزاوية */}
      <button
        onClick={onOpenCashier}
        aria-label="الكاشير"
        className="fixed top-3 left-3 z-40 w-11 h-11 rounded-full bg-ink-900/85 text-sand-50 flex items-center justify-center shadow-lg backdrop-blur hover:scale-105 active:scale-95 transition"
        title="الكاشير"
      >
        🧾
      </button>

      <header className="sticky top-0 z-30 bg-sand-50/90 backdrop-blur border-b border-dune-300/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="font-display text-2xl text-rust-600 leading-none">كافي صيف</h1>
            <p className="text-xs text-ink-800/60 mt-0.5">📍 طاولة رقم {table}</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeCat === c.id
                  ? 'bg-rust-600 text-sand-50 shadow-md shadow-rust-600/30'
                  : 'bg-sand-100 text-ink-800 hover:bg-sand-200'
              }`}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const qty = cart[item.id]?.qty || 0
          return (
            <Reveal key={item.id} delayMs={idx * 70}>
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-dune-300/20 hover:shadow-lg transition-shadow duration-300">
                <ItemImage
                  src={item.image}
                  alt={item.name}
                  category={item.category}
                  className="w-full aspect-[4/3] object-cover"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-ink-900">{item.name}</h3>
                    <span className="text-rust-600 font-bold whitespace-nowrap">{formatIQD(item.price)}</span>
                  </div>
                  <p className="text-sm text-ink-800/60 mt-1 leading-relaxed">{item.description}</p>

                  <input
                    placeholder="📝 ملاحظات (مثلاً: بدون بصل)"
                    value={notes[item.id] || ''}
                    onChange={(e) => {
                      setNotes((n) => ({ ...n, [item.id]: e.target.value }))
                      if (qty > 0) {
                        setCart((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], note: e.target.value.trim() || undefined },
                        }))
                      }
                    }}
                    className="mt-3 w-full text-sm px-3 py-2 rounded-lg border border-dune-300/40 focus:outline-none focus:ring-2 focus:ring-dune-400/50 bg-sand-50"
                  />

                  <div className="mt-3 flex items-center justify-between">
                    {qty === 0 ? (
                      <button
                        onClick={() => addOne(item)}
                        className="w-full py-2.5 rounded-xl bg-sand-100 hover:bg-dune-500 hover:text-sand-50 text-ink-900 font-bold transition-colors"
                      >
                        🛒 أضف للسلة
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-sand-100 rounded-xl px-2 py-1.5">
                        <button
                          onClick={() => setQty(item, qty - 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow text-rust-600 font-bold"
                        >
                          −
                        </button>
                        <span className="font-bold">{qty}</span>
                        <button
                          onClick={() => setQty(item, qty + 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow text-rust-600 font-bold"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          )
        })}
      </section>

      {/* شريط السلة العائم */}
      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className={`fixed bottom-5 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-40 bg-gradient-to-l from-rust-600 to-dune-500 text-sand-50 rounded-2xl px-5 py-4 shadow-2xl shadow-rust-600/40 flex items-center justify-between ${
            bump ? 'animate-pop' : ''
          }`}
        >
          <span className="font-bold">🛒 السلة ({cartCount})</span>
          <span className="font-bold">{formatIQD(cartTotal)}</span>
        </button>
      )}

      {/* درج السلة */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative bg-sand-50 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-rust-600">🛒 طلبك — طاولة {table}</h2>
              <button onClick={() => setCartOpen(false)} className="text-ink-800/50 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              {cartLines.map((line) => (
                <div key={line.itemId} className="bg-white rounded-xl p-3 border border-dune-300/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{line.name} ×{line.qty}</span>
                    <span className="text-rust-600 font-bold">{formatIQD(line.price * line.qty)}</span>
                  </div>
                  {line.note && <p className="text-xs text-ink-800/60 mt-1">📝 {line.note}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => adjustCartLine(line.itemId, -1)}
                      className="w-7 h-7 rounded-lg bg-sand-100 text-rust-600 font-bold"
                    >
                      −
                    </button>
                    <span className="text-sm w-5 text-center">{line.qty}</span>
                    <button
                      onClick={() => adjustCartLine(line.itemId, 1)}
                      className="w-7 h-7 rounded-lg bg-sand-100 text-rust-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-dune-300/30 flex items-center justify-between font-bold text-lg">
              <span>المجموع</span>
              <span className="text-rust-600">{formatIQD(cartTotal)}</span>
            </div>

            <textarea
              placeholder="📝 ملاحظات عامة على الطلب..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="mt-4 w-full text-sm px-3 py-2 rounded-lg border border-dune-300/40 bg-white focus:outline-none focus:ring-2 focus:ring-dune-400/50"
              rows={2}
            />

            <button
              onClick={send}
              className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-l from-rust-600 to-dune-500 text-sand-50 font-bold text-lg shadow-lg shadow-rust-600/30 hover:brightness-110 active:scale-[0.98] transition"
            >
              📤 إرسال الطلب
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
