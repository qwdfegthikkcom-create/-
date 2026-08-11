import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Malaab',
  description: 'تطبيق الملاعب وتنظيم الفرق'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-white text-slate-900">{children}</body>
    </html>
  )
}
