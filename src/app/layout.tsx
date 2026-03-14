import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'EstateMap – Real Estate Map Search',
  description: 'Search homes for sale on an interactive map. Browse by city, price, beds, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
