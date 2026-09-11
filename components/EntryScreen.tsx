'use client'

import { useState } from 'react'
import { TABLE_COUNT } from '../lib/menu'
import Reveal from './Reveal'

export default function EntryScreen({
  onStart,
}: {
  onStart: (table: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <main className="min-h-screen desert-texture bg-gradient-to-b from-sand-100 via-sand-50 to-sand-100 flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* زخارف رملية عائمة */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full bg-dune-500/10 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute bottom-0 -left-10 w-72 h-72 rounded-full bg-rust-500/10 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />

      <Reveal className="text-center relative">
        <div className="mx-auto mb-3 w-16 h-[2px] bg-gradient-to-r from-transparent via-dune-500 to-transparent" />
        <h1 className="font-display text-6xl sm:text-7xl text-rust-600 drop-shadow-sm leading-tight">
          كافي صيف
        </h1>
        <p className="font-body text-ink-800/70 mt-2 tracking-wide text-sm sm:text-base">
          نكهة الصحراء الدافئة… بحرفة موصلية أصيلة
        </p>
        <div className="mx-auto mt-3 w-16 h-[2px] bg-gradient-to-r from-transparent via-dune-500 to-transparent" />
      </Reveal>

      <Reveal delayMs={150} className="w-full max-w-md mt-10">
        <div className="bg-white/70 backdrop-blur border border-dune-300/40 rounded-3xl p-6 shadow-xl shadow-rust-900/5">
          <p className="text-center font-bold text-ink-900 mb-4">اختر رقم طاولتك</p>
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((t) => (
              <button
                key={t}
                onClick={() => setSelected(t)}
                className={`aspect-square rounded-xl font-bold text-lg transition-all duration-200 ${
                  selected === t
                    ? 'bg-rust-600 text-sand-50 scale-105 shadow-lg shadow-rust-600/30'
                    : 'bg-sand-100 text-ink-800 hover:bg-sand-200 active:scale-95'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            disabled={!selected}
            onClick={() => selected && onStart(selected)}
            className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-l from-rust-600 to-dune-500 text-sand-50 font-bold text-lg shadow-lg shadow-rust-600/30 disabled:opacity-40 disabled:shadow-none transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[0.98]"
          >
            {selected ? `فتح المنيو — طاولة ${selected}` : 'اختر طاولة للمتابعة'}
          </button>
        </div>
      </Reveal>

      <Reveal delayMs={280} className="mt-6 text-xs text-ink-800/50">
        يعمل بدون إنترنت 📴 · الدفع كاش عند الكاشير 💵
      </Reveal>
    </main>
  )
}
