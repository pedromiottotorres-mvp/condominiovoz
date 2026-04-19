import type { Metadata } from 'next'
import './globals.css'
import ToastContainer from '@/components/Toast'
import InstallBanner from '@/components/InstallBanner'

export const metadata: Metadata = {
  title: 'CondomínioVoz',
  description: 'A voz dos moradores, a decisão do síndico',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a5f" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icons/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').then((reg) => console.log('SW registrado:', reg.scope)).catch((err) => console.log('SW erro:', err)); }`,
          }}
        />
      </head>
      <body className="h-full bg-[#f8fafc] antialiased">
        {children}
        <InstallBanner />
        <ToastContainer />
      </body>
    </html>
  )
}
