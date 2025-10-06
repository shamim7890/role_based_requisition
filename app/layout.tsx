// @/app/layout.tsx
import { type Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'IMS Portal - Inventory Management System',
  description: 'Chemical and Admin Item Requisition Management System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900`}>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-6">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  )
}