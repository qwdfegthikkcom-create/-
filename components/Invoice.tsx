'use client'

import { Order, formatIQD } from '../lib/store'

export default function Invoice({ order }: { order: Order }) {
  const dt = new Date(order.createdAt)
  return (
    <div id="invoice-print" className="p-6 max-w-sm mx-auto bg-white text-ink-900" dir="rtl">
      <div className="text-center mb-4">
        <h2 className="font-display text-3xl text-rust-600">كافي صيف</h2>
        <p className="text-xs text-ink-800/60">فاتورة مبيعات</p>
      </div>
      <div className="text-sm flex justify-between border-b border-dashed border-ink-900/30 pb-2 mb-2">
        <span>طلب #{order.id}</span>
        <span>طاولة {order.table}</span>
      </div>
      <div className="text-xs text-ink-800/60 mb-3">
        {dt.toLocaleDateString('ar-IQ')} — {dt.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-900/20">
            <th className="text-right py-1">الصنف</th>
            <th className="text-center py-1">عدد</th>
            <th className="text-left py-1">السعر</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((l) => (
            <tr key={l.itemId} className="border-b border-dashed border-ink-900/10">
              <td className="py-1">
                {l.name}
                {l.note && <div className="text-[10px] text-ink-800/50">📝 {l.note}</div>}
              </td>
              <td className="text-center py-1">{l.qty}</td>
              <td className="text-left py-1">{formatIQD(l.price * l.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {order.note && <p className="text-xs mt-2 text-ink-800/70">📝 ملاحظة: {order.note}</p>}
      <div className="flex justify-between font-bold text-lg mt-4 pt-3 border-t-2 border-ink-900">
        <span>المجموع</span>
        <span>{formatIQD(order.total)}</span>
      </div>
      <p className="text-center text-xs text-ink-800/50 mt-6">شكراً لزيارتكم — كافي صيف 🏜️</p>
    </div>
  )
}
