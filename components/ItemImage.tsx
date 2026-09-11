'use client'

import { useState } from 'react'

const FALLBACK_ICONS: Record<string, string> = {
  grills: '🔥',
  appetizers: '🥗',
  desserts: '🍰',
  drinks: '🥤',
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

export default function ItemImage({
  src,
  alt,
  category,
  className,
}: {
  src: string
  alt: string
  category: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br from-sand-200 via-dune-500/30 to-rust-500/30`}
      >
        <span className="text-4xl drop-shadow-sm">{FALLBACK_ICONS[category] || '🍽️'}</span>
      </div>
    )
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`${BASE_PATH}${src}`}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
