import Image from 'next/image'

export default function VenueCard({ venue }: { venue: any }) {
  const img = venue.images && venue.images.length > 0 ? venue.images[0] : '/stadium-sample.jpg'
  const status = venue.is_available ? 'متاح الآن' : 'محجوز بالكامل'
  const statusColor = venue.is_available ? 'text-green-600' : 'text-red-500'

  return (
    <article className="flex gap-4 items-center border rounded p-3">
      <div className="w-28 h-20 bg-slate-200 rounded overflow-hidden relative flex-shrink-0">
        {/* Using native img for simplicity; replace with Image component if hosted images available */}
        <img src={img} alt={venue.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{venue.name}</h3>
        <p className="text-sm text-slate-500">{venue.region}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className={`${statusColor} text-sm`}>{status}</span>
          <button className="mr-auto bg-slate-100 px-3 py-1 rounded text-sm">اختر هذا الملعب</button>
        </div>
      </div>
    </article>
  )
}
