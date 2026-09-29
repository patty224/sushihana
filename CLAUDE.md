# Sushi Hana — ระบบสั่งอาหาร

Stack: Next.js (App Router, JavaScript ไม่ใช่ TypeScript) · Supabase · deploy บน Vercel

## Next.js (เวอร์ชันล่าสุด)
`params` ของ Dynamic Route เป็น **Promise** ต้อง unwrap ก่อนใช้

Client Component — ใช้ `use()` จาก react:
```js
'use client'
import { use } from 'react'

export default function Page({ params }) {
  const { id } = use(params)
  // ...
}
```
Server Component — ใช้ `await`:
```js
export default async function Page({ params }) {
  const { id } = await params
}
```
(`searchParams` ก็เป็น Promise เช่นกัน)

## Environment variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

ตั้งใน `.env.local` (ห้าม commit) และใน Vercel → Project Settings → Environment Variables

## ตารางฐานข้อมูลที่มีอยู่แล้ว (ไม่ต้องสร้างใหม่)
- sessions (id, table_number, adult_count, child_count, status, created_at)
- menu_categories (id, name, sort_order)
- menu_items (id, category_id, name)
- orders (id, session_id, table_number, items jsonb, status, created_at)

## หน้าในโปรเจกต์
- `/` หน้าแรก
- `/generate-qr` สร้าง QR โต๊ะ
- `/kitchen` หน้าครัว

Supabase client: `import { supabase } from '@/lib/supabaseClient'` หรือ `../lib/supabaseClient`
