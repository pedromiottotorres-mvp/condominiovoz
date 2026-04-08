import type { Metadata } from 'next'
import './globals.css'

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
      <body className="h-full bg-[#f8fafc] antialiased">{children}</body>
    </html>
  )
}
