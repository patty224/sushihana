import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: 24, textAlign: 'center' }}>
      <h1>Sushi Hana</h1>
      <p>ระบบสั่งอาหาร</p>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        <Link href="/generate-qr">สร้าง QR Code โต๊ะ</Link>
        <Link href="/kitchen">หน้าครัว</Link>
      </nav>
    </main>
  )
}
