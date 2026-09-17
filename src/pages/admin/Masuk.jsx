import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSitus } from '../../context/SiteContext'
import { Teks } from '../../components/ui/Isian'
import { Tombol } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'

export default function Masuk() {
  const { masuk } = useAuth()
  const { klinik } = useSitus()
  const navigasi = useNavigate()

  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [galat, setGalat] = useState(null)
  const [kirim, setKirim] = useState(false)

  useSeo({ judul: 'Masuk Pengelola' })

  const kirimForm = async (e) => {
    e.preventDefault()
    setGalat(null)
    setKirim(true)
    try {
      await masuk(email, sandi)
      navigasi('/admin', { replace: true })
    } catch (err) {
      /*
       * Pesan dari server dipakai apa adanya.
       *
       * Server sengaja tidak membedakan "email tidak terdaftar" dari "sandi
       * salah"; menambahkan tebakan yang lebih ramah di sini justru
       * mengembalikan kebocoran yang sudah ditutup di sana.
       */
      setGalat(err.status === 429
        ? 'Terlalu banyak percobaan. Tunggu satu menit, lalu coba lagi.'
        : err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--s-5)',
      background: 'linear-gradient(160deg, var(--hijau-50), var(--putih) 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>
          <div
            aria-hidden="true"
            style={{
              width: 52, height: 52, margin: '0 auto var(--s-3)',
              display: 'grid', placeItems: 'center',
              background: 'var(--hijau-700)', color: '#fff',
              borderRadius: 'var(--r-lg)', fontSize: '1.9rem', fontWeight: 700, lineHeight: 1,
            }}
          >
            +
          </div>
          <h1 style={{ fontSize: 'var(--t-xl)' }}>Masuk Pengelola</h1>
          <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 4 }}>
            CMS website {klinik.nama}
          </p>
        </div>

        <form
          onSubmit={kirimForm}
          className="tumpuk"
          style={{
            background: 'var(--putih)',
            border: '1px solid var(--garis)',
            borderRadius: 'var(--r-lg)',
            padding: 'var(--s-5)',
            boxShadow: 'var(--bayang-2)',
          }}
        >
          {galat && <div className="galat-kotak" role="alert">{galat}</div>}

          <Teks
            label="Email"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Teks
            label="Kata sandi"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
          />

          <Tombol type="submit" penuh memuat={kirim}>Masuk</Tombol>
        </form>

        <p style={{
          textAlign: 'center', marginTop: 'var(--s-4)',
          fontSize: 'var(--t-xs)', color: 'var(--teks-samar)',
        }}>
          Lupa kata sandi? Hubungi Super Admin untuk menyetel ulang.
        </p>
      </div>
    </div>
  )
}
