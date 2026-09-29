'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const toInt = (v) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN)

export default function GenerateQRPage() {
  const [table, setTable] = useState('')
  const [adult, setAdult] = useState('')
  const [child, setChild] = useState('0')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [existing, setExisting] = useState(null) // session เก่าที่ยังเปิดค้าง
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmNow, setConfirmNow] = useState(0)

  const [result, setResult] = useState(null) // { url, table, adult, child }
  const [copied, setCopied] = useState(false)

  const handleTableChange = (e) => {
    setTable(e.target.value)
    setExisting(null)
    setNotice('')
    setError('')
  }

  const handleOpenTable = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setResult(null)
    setExisting(null)
    setCopied(false)

    const t = toInt(table)
    const a = toInt(adult)
    const c = toInt(child.trim() === '' ? '0' : child)

    if (!Number.isInteger(t) || t < 1) return setError('กรุณากรอกเลขโต๊ะให้ถูกต้อง')
    if (!Number.isInteger(a) || !Number.isInteger(c)) {
      return setError('กรุณากรอกจำนวนผู้ใหญ่และเด็กเป็นตัวเลข')
    }
    if (a + c < 1) return setError('ต้องมีลูกค้าอย่างน้อย 1 คน')

    setLoading(true)
    try {
      // 1) เช็คว่าโต๊ะนี้มี session เปิดค้างอยู่หรือไม่
      const { data: open, error: checkErr } = await supabase
        .from('sessions')
        .select('id, adult_count, child_count, created_at')
        .eq('table_number', t)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)

      if (checkErr) throw checkErr

      if (open && open.length > 0) {
        setExisting({ ...open[0], table_number: t })
        return
      }

      // 2) ไม่มี -> สร้าง session ใหม่
      const { error: insertErr } = await supabase.from('sessions').insert({
        table_number: t,
        adult_count: a,
        child_count: c,
        status: 'open',
      })
      if (insertErr) throw insertErr

      const url = `${window.location.origin}/order/${t}`
      setResult({ url, table: t, adult: a, child: c })
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const openConfirm = () => {
    setConfirmNow(Date.now())
    setShowConfirm(true)
  }

  const handleConfirmClose = async () => {
    if (!existing) return
    setLoading(true)
    setError('')
    try {
      // อัปเดตเฉพาะแถวนี้ และต้องยังเป็น 'open' อยู่ตอน update
      const { data, error: updErr } = await supabase
        .from('sessions')
        .update({ status: 'closed' })
        .eq('id', existing.id)
        .eq('status', 'open')
        .select('id')

      if (updErr) throw updErr

      setShowConfirm(false)
      setExisting(null)
      if (data && data.length > 0) {
        setNotice('ปิดโต๊ะเดิมเรียบร้อยแล้ว กดปุ่ม "เปิดโต๊ะ" อีกครั้งเพื่อเปิดใหม่')
      } else {
        setNotice('โต๊ะนี้ถูกปิดไปแล้วก่อนหน้านี้ กดปุ่ม "เปิดโต๊ะ" อีกครั้งเพื่อเปิดใหม่')
      }
    } catch (err) {
      setShowConfirm(false)
      setError(`ปิดโต๊ะไม่สำเร็จ: ${err.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('คัดลอกไม่สำเร็จ กรุณาคัดลอกลิงก์ด้วยตัวเอง')
    }
  }

  const minutesOpen = existing
    ? Math.max(0, Math.floor((confirmNow - new Date(existing.created_at).getTime()) / 60000))
    : 0

  return (
    <main style={s.main}>
      <h1 style={s.h1}>เปิดโต๊ะ · Sushi Hana</h1>

      <form onSubmit={handleOpenTable} style={s.form}>
        <label style={s.label}>
          เลขโต๊ะ
          <input
            style={s.input}
            type="number"
            inputMode="numeric"
            min="1"
            value={table}
            onChange={handleTableChange}
            required
          />
        </label>
        <label style={s.label}>
          จำนวนผู้ใหญ่
          <input
            style={s.input}
            type="number"
            inputMode="numeric"
            min="0"
            value={adult}
            onChange={(e) => setAdult(e.target.value)}
            required
          />
        </label>
        <label style={s.label}>
          จำนวนเด็ก
          <input
            style={s.input}
            type="number"
            inputMode="numeric"
            min="0"
            value={child}
            onChange={(e) => setChild(e.target.value)}
          />
        </label>
        <button type="submit" style={s.primaryBtn} disabled={loading}>
          {loading && !showConfirm ? 'กำลังดำเนินการ...' : 'เปิดโต๊ะ'}
        </button>
      </form>

      {error && <div style={s.error}>{error}</div>}
      {notice && <div style={s.notice}>{notice}</div>}

      {existing && (
        <div style={s.warnBox}>
          <div style={s.warnText}>
            ⚠️ โต๊ะนี้มีลูกค้าอยู่ระหว่างทานอาหาร กรุณาปิดออเดอร์เดิมก่อน
          </div>
          <button type="button" style={s.dangerBtn} onClick={openConfirm} disabled={loading}>
            ปิดออเดอร์เดิม
          </button>
        </div>
      )}

      {result && (
        <div style={s.resultBox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(result.url)}`}
            alt={`QR Code โต๊ะ ${result.table}`}
            width={300}
            height={300}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <div style={s.summary}>
            โต๊ะ {result.table} · ผู้ใหญ่ {result.adult} · เด็ก {result.child}
          </div>
          <div style={s.urlRow}>
            <span style={s.url}>{result.url}</span>
            <button type="button" style={s.copyBtn} onClick={handleCopy}>
              {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
            </button>
          </div>
        </div>
      )}

      {showConfirm && existing && (
        <div style={s.overlay} role="dialog" aria-modal="true">
          <div style={s.dialog}>
            <div style={s.dialogHead}>ยืนยันปิดโต๊ะเดิม</div>
            <div style={s.dialogBody}>
              <div>โต๊ะ {existing.table_number}</div>
              <div>
                ผู้ใหญ่ {existing.adult_count} · เด็ก {existing.child_count}
              </div>
              <div>เปิดมาแล้ว {minutesOpen} นาที</div>
            </div>
            <div style={s.dialogActions}>
              <button
                type="button"
                style={s.cancelBtn}
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                style={s.dangerBtn}
                onClick={handleConfirmClose}
                disabled={loading}
              >
                {loading ? 'กำลังปิด...' : 'ยืนยันปิดโต๊ะเดิม'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

const s = {
  main: { maxWidth: 480, margin: '0 auto', padding: 20, fontSize: 20 },
  h1: { fontSize: 28, textAlign: 'center', margin: '8px 0 20px' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 22, fontWeight: 600 },
  input: {
    fontSize: 28,
    padding: '10px 12px',
    border: '2px solid #999',
    borderRadius: 8,
    width: '100%',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    fontSize: 26,
    fontWeight: 700,
    minHeight: 64,
    background: '#1a7f37',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
  },
  error: {
    marginTop: 16,
    padding: 14,
    background: '#ffe3e3',
    border: '2px solid #c92a2a',
    color: '#c92a2a',
    borderRadius: 8,
    fontSize: 20,
  },
  notice: {
    marginTop: 16,
    padding: 14,
    background: '#e6fcf5',
    border: '2px solid #1a7f37',
    color: '#0b5d27',
    borderRadius: 8,
    fontSize: 20,
  },
  warnBox: {
    marginTop: 20,
    padding: 16,
    background: '#fff4e5',
    border: '4px solid #e8590c',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  warnText: { fontSize: 24, fontWeight: 700, color: '#a53d00', lineHeight: 1.4 },
  dangerBtn: {
    fontSize: 22,
    fontWeight: 700,
    minHeight: 56,
    padding: '0 16px',
    background: '#d9480f',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    flex: 1,
  },
  cancelBtn: {
    fontSize: 22,
    fontWeight: 700,
    minHeight: 56,
    padding: '0 16px',
    background: '#e9ecef',
    color: '#333',
    border: '2px solid #adb5bd',
    borderRadius: 10,
    cursor: 'pointer',
    flex: 1,
  },
  resultBox: {
    marginTop: 24,
    padding: 16,
    border: '2px solid #1a7f37',
    borderRadius: 12,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  summary: { fontSize: 26, fontWeight: 700 },
  urlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  url: { fontSize: 18, wordBreak: 'break-all' },
  copyBtn: {
    fontSize: 16,
    padding: '6px 12px',
    background: '#e9ecef',
    border: '1px solid #adb5bd',
    borderRadius: 6,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 1000,
  },
  dialog: {
    background: '#fff',
    width: '100%',
    maxWidth: 440,
    borderRadius: 12,
    overflow: 'hidden',
    border: '4px solid #c92a2a',
  },
  dialogHead: {
    background: '#c92a2a',
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
    padding: '14px 16px',
  },
  dialogBody: {
    padding: 16,
    fontSize: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  dialogActions: { display: 'flex', gap: 12, padding: 16 },
}
