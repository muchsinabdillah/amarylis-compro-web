import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePasien } from '../../context/PasienAuthContext'
import { Teks } from '../../components/ui/Isian'
import { Tombol } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'
import KartuAuth from './KartuAuth'

/** Tujuan setelah masuk: deep-link yang disimpan (mis. reservasi dokter), atau dashboard. */
export function tujuanSetelahMasuk() {
  try {
    const n = sessionStorage.getItem('pasien.next')
    if (n && n.startsWith('/pasien')) { sessionStorage.removeItem('pasien.next'); return n }
  } catch { /* abaikan */ }
  return '/pasien'
}

export default function Masuk() {
  const { masuk } = usePasien()
  const navigasi = useNavigate()
  const [noHp, setNoHp] = useState('')
  const [sandi, setSandi] = useState('')
  const [galat, setGalat] = useState(null)
  const [kirim, setKirim] = useState(false)

  useSeo({ judul: 'Masuk Pasien' })

  const kirimForm = async (e) => {
    e.preventDefault()
    setGalat(null)
    setKirim(true)
    try {
      await masuk(noHp, sandi)
      navigasi(tujuanSetelahMasuk(), { replace: true })
    } catch (err) {
      setGalat(err.status === 429
        ? 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.'
        : err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <KartuAuth judul="Masuk" bawah={<>Belum punya akun? <Link to="/pasien/daftar">Daftar di sini</Link></>}>
      <form onSubmit={kirimForm} className="tumpuk">
        {galat && <div className="galat-kotak" role="alert">{galat}</div>}
        <Teks
          label="Nomor HP" type="tel" inputMode="numeric" autoComplete="username"
          placeholder="08xxxxxxxxxx" required value={noHp} onChange={(e) => setNoHp(e.target.value)}
        />
        <Teks
          label="Kata sandi" type="password" autoComplete="current-password"
          required value={sandi} onChange={(e) => setSandi(e.target.value)}
        />
        <Tombol type="submit" penuh memuat={kirim}>{kirim ? 'Masuk…' : 'Masuk'}</Tombol>
      </form>
    </KartuAuth>
  )
}
