export const metadata = {
  title: 'Sushi Hana',
  description: 'ระบบสั่งอาหารร้าน Sushi Hana',
}

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ fontFamily: 'sans-serif', margin: 0 }}>{children}</body>
    </html>
  )
}
