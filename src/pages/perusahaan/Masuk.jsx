import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePerusahaan } from '../../context/PerusahaanAuthContext'
import { useSitus } from '../../context/SiteContext'
import { Teks } from '../../components/ui/Isian'
import { Tombol } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'

/**
 * Masuk portal MCU perusahaan.
 *
 * Tidak ada tautan "daftar" di sini — akunnya dibuatkan petugas klinik di
 * SIMRS, bukan didaftarkan sendiri. Perusahaan yang belum punya akun diarahkan
 * menghubungi klinik.
 */
export default function Masuk() {
  const { masuk } = usePerusahaan()
  const { klinik } = useSitus()
  const navigasi = useNavigate()
  const [email, setEmail] = useState('')
  const [sandi, setSandi] = useState('')
  const [galat, setGalat] = useState(null)
  const [kirim, setKirim] = useState(false)

  useSeo({ judul: 'Masuk Perusahaan' })

  const kirimForm = async (e) => {
    e.preventDefault()
    setGalat(null)
    setKirim(true)
    try {
      await masuk(email, sandi)
      navigasi('/perusahaan', { replace: true })
    } catch (err) {
      setGalat(err.status === 429
        ? 'Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.'
        : err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <div className="pm-auth">
      <style>{CSS}</style>
      <div className="pm-auth__kolom">
        <div className="pm-auth__kepala">
          <Link to="/" aria-label="Beranda" className="pm-auth__logo">+</Link>
          <h1>Portal MCU Perusahaan</h1>
          <p>
            {klinik?.nama
              ? `Unggah peserta & pantau hasil pemeriksaan karyawan — ${klinik.nama}`
              : 'Unggah peserta & pantau hasil pemeriksaan karyawan'}
          </p>
        </div>

        <div className="pm-auth__kartu">
          <form onSubmit={kirimForm} className="tumpuk">
            {galat && <div className="galat-kotak" role="alert">{galat}</div>}
            <Teks
              label="Email perusahaan" type="email" autoComplete="username"
              placeholder="hrd@perusahaan.co.id" required
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <Teks
              label="Kata sandi" type="password" autoComplete="current-password"
              required value={sandi} onChange={(e) => setSandi(e.target.value)}
            />
            <Tombol type="submit" penuh memuat={kirim}>{kirim ? 'Masuk…' : 'Masuk'}</Tombol>
          </form>
        </div>

        <p className="pm-auth__kaki">
          Akun portal dibuatkan oleh klinik. Belum punya akses atau lupa kata sandi?
          {' '}<Link to="/kontak">Hubungi kami</Link>.
        </p>
      </div>
    </div>
  )
}

const CSS = `
.pm-auth {
  min-height:100vh; display:grid; place-items:center; padding:var(--s-5);
  background:linear-gradient(160deg, var(--hijau-50), var(--putih) 60%);
}
.pm-auth__kolom { width:100%; max-width:440px; }
.pm-auth__kepala { text-align:center; margin-bottom:var(--s-5); }
.pm-auth__kepala h1 { font-size:var(--t-xl); margin-top:var(--s-3); }
.pm-auth__kepala p { color:var(--teks-lembut); font-size:var(--t-sm); margin-top:4px; }
.pm-auth__logo {
  display:inline-grid; place-items:center; width:52px; height:52px;
  background:var(--hijau-700); color:#fff; border-radius:var(--r-lg);
  font-size:1.9rem; font-weight:700; line-height:1; text-decoration:none;
}
.pm-auth__kartu {
  background:var(--putih); border:1px solid var(--garis);
  border-radius:var(--r-lg); padding:var(--s-5); box-shadow:var(--bayang-2);
}
.pm-auth__kaki {
  text-align:center; margin-top:var(--s-4);
  font-size:var(--t-sm); color:var(--teks-lembut);
}
`
