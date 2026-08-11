import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full p-6 text-center">
        <h1 className="text-2xl font-semibold mb-4">مرحبا بك في Malaab</h1>
        <p className="text-slate-600 mb-6">تطبيق لحجز الملاعب وتنظيم الفرق. ابدء باستعراض الملاعب.</p>
        <Link href="/venues" className="inline-block bg-green-500 text-white px-4 py-2 rounded">استعراض الملاعب</Link>
      </div>
    </main>
  )
}
