import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import VenueCard from '../../components/VenueCard'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

export default function VenuesPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVenues()
  }, [])

  async function fetchVenues() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('venues').select('*').limit(100)
      if (error) {
        console.error(error)
      } else {
        setVenues(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = venues.filter(v => v.name?.includes(query) || v.region?.includes(query))

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4">
          <div className="flex items-center gap-3">
            <input dir="rtl" placeholder="ابحث عن ملعب أو منطقة" value={query} onChange={e => setQuery(e.target.value)} className="flex-1 border rounded px-3 py-2" />
          </div>
          <div className="mt-3 overflow-auto flex gap-2">
            {['الكل', 'سباعية', 'خماسية', 'الأقرب إليك', 'المتاحة الآن'].map(chip => (
              <button key={chip} className="whitespace-nowrap px-3 py-1.5 border rounded-full text-sm">{chip}</button>
            ))}
          </div>
        </header>

        <section>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-500">لم يتم العثور على ملاعب. جرّب تعديل البحث.</div>
              )}
              {filtered.map(venue => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Floating + button */}
      <button aria-label="انشاء ماتش" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#00E676] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl">+</button>
    </div>
  )
}
