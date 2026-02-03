import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlanetCanvas 3D - Draw on Earth, Share with the World',
  description: 'A collaborative 3D Earth drawing platform. Draw on any location and share your artwork with the world in real-time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-space-900 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
