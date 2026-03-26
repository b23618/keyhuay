import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Keyhuay - ระบบคีย์หวย 4 ตัว',
  description: 'ระบบคีย์หวย 4 ตัว วิเคราะห์เลขที่ออกบ่อยสุด',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
