import './globals.css'
import { ReactNode } from 'react'
import { Aref_Ruqaa, Tajawal } from 'next/font/google'

const display = Aref_Ruqaa({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-display',
})

const body = Tajawal({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-body',
})

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

export const metadata = {
  title: 'كافي صيف',
  description: 'منيو وكاشير مطعم كافي صيف — يعمل بدون إنترنت',
  manifest: `${basePath}/manifest.json`,
  themeColor: '#B5502C',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body className="bg-sand-50 text-ink-900 font-body antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('${basePath}/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
