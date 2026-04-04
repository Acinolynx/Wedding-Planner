import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "RSVP — Wedding Invitation",
  description: "Konfirmasi kehadiran Anda di pernikahan kami",
}

export default function RSVPLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
