import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSitus } from '../../context/SiteContext'
import { usePasien } from '../../context/PasienAuthContext'
import ModalAuth from './ModalAuth'
import { tautanTelepon } from '../../lib/format'
import './navbar.css'

const MENU = [
  { ke: '/', label: 'Beranda' },
  { ke: '/tentang-kami', label: 'Tentang Kami' },
  { ke: '/layanan', label: 'Layanan' },
  { ke: '/dokter', label: 'Dokter' },
  { ke: '/informasi', label: 'Informasi', anak: [
    { ke: '/artikel', label: 'Artikel Kesehatan' },
    { ke: '/berita', label: 'Berita & Kegiatan' },
    { ke: '/video', label: 'Video' },
    { ke: '/fasilitas', label: 'Fasilitas' },
  ] },
  { ke: '/kontak', label: 'Kontak' },
]

export default function Navbar() {
  const { klinik, merek, tautanWa } = useSitus()
  const { profil } = usePasien()
  const [bukaAuth, setBukaAuth] = useState(false)
  const [buka, setBuka] = useState(false)
  const [turun, setTurun] = useState(false)
  const [cari, setCari] = useState('')
  const [bukaCari, setBukaCari] = useState(false)
  const lokasi = useLocation()
  const navigasi = useNavigate()
  const kotakCari = useRef(null)

  // Menu ditutup setiap kali halaman berganti; menu yang tetap terbuka di
  // atas halaman baru terasa seperti tautannya tidak berfungsi.
  useEffect(() => { setBuka(false); setBukaCari(false) }, [lokasi.pathname])

  useEffect(() => {
    const saatGulir = () => setTurun(window.scrollY > 8)
    saatGulir()
    window.addEventListener('scroll', saatGulir, { passive: true })
    return () => window.removeEventListener('scroll', saatGulir)
  }, [])

  // Menu terbuka mengunci gulir halaman di belakangnya.
  useEffect(() => {
    document.body.style.overflow = buka ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [buka])

  useEffect(() => {
    if (bukaCari) kotakCari.current?.focus()
  }, [bukaCari])

  useEffect(() => {
    const saatEsc = (e) => {
      if (e.key === 'Escape') { setBuka(false); setBukaCari(false) }
    }
    window.addEventListener('keydown', saatEsc)
    return () => window.removeEventListener('keydown', saatEsc)
  }, [])

  const kirimCari = (e) => {
    e.preventDefault()
    const q = cari.trim()
    if (q.length >= 2) navigasi(`/cari?q=${encodeURIComponent(q)}`)
  }

  const wa = tautanWa(`${klinik.nama ? `Hallo ${klinik.nama}, ` : ''}saya ingin bertanya.`)
  const tel = tautanTelepon(klinik.telepon)

  return (
    <header className={`nav ${turun ? 'nav--turun' : ''}`}>
      <div className="wadah nav__baris">
        <Link to="/" className="nav__merek" aria-label={`Beranda ${klinik.nama}`}>
          {merek.logo
            ? <img src={merek.logo} alt="" className="nav__logo" />
            : <span className="nav__lambang" aria-hidden="true">+</span>}
          <span className="nav__nama">{klinik.nama}</span>
        </Link>

        <nav className="nav__menu" aria-label="Menu utama">
          {MENU.map((m) => (m.anak ? (
            <div key={m.label} className="nav__punya-anak">
              <button type="button" className="nav__tautan" aria-haspopup="true">
                {m.label}
                <span aria-hidden="true" className="nav__panah">▾</span>
              </button>
              <div className="nav__anak">
                {m.anak.map((a) => (
                  <NavLink key={a.ke} to={a.ke} className="nav__anak-tautan">{a.label}</NavLink>
                ))}
              </div>
            </div>
          ) : (
            <NavLink
              key={m.ke}
              to={m.ke}
              end={m.ke === '/'}
              className={({ isActive }) => `nav__tautan${isActive ? ' nav__tautan--aktif' : ''}`}
            >
              {m.label}
            </NavLink>
          )))}
        </nav>

        <div className="nav__aksi">
          <button
            type="button"
            className="nav__ikon"
            aria-label="Cari"
            aria-expanded={bukaCari}
            onClick={() => setBukaCari((v) => !v)}
          >
            🔍
          </button>

          {/* Sudah masuk → pintasan ke portal. Belum → modal masuk/daftar di tempat. */}
          {profil ? (
            <Link to="/pasien" className="btn nav__cta">Akun Saya</Link>
          ) : (
            <button type="button" className="btn nav__cta" onClick={() => setBukaAuth(true)}>
              Login Akun
            </button>
          )}

          {/* Tombol sekunder menyesuaikan apa yang benar-benar tersedia:
              WhatsApp bila nomornya sudah diisi, selain itu telepon. */}
          {wa ? (
            <a className="btn btn--wa nav__cta" href={wa} target="_blank" rel="noopener noreferrer">
              Chat WhatsApp
            </a>
          ) : tel ? (
            <a className="btn nav__cta" href={tel}>Telepon</a>
          ) : null}

          <button
            type="button"
            className="nav__hamburger"
            aria-label={buka ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
          >
            <span className={`nav__garis ${buka ? 'nav__garis--x' : ''}`} />
          </button>
        </div>
      </div>

      {bukaCari && (
        <div className="nav__cari">
          <form className="wadah" onSubmit={kirimCari} role="search">
            <input
              ref={kotakCari}
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari layanan, artikel, atau paket MCU…"
              aria-label="Kata pencarian"
            />
            <button type="submit" className="btn">Cari</button>
          </form>
        </div>
      )}

      {buka && (
        <div className="nav__laci" id="menu-ponsel">
          <nav aria-label="Menu utama ponsel">
            {MENU.map((m) => (m.anak ? (
              <div key={m.label} className="nav__laci-grup">
                <span className="nav__laci-judul">{m.label}</span>
                {m.anak.map((a) => (
                  <NavLink key={a.ke} to={a.ke} className="nav__laci-tautan">{a.label}</NavLink>
                ))}
              </div>
            ) : (
              <NavLink key={m.ke} to={m.ke} end={m.ke === '/'} className="nav__laci-tautan">
                {m.label}
              </NavLink>
            )))}
          </nav>
        </div>
      )}
      <ModalAuth
        terbuka={bukaAuth}
        saatTutup={() => setBukaAuth(false)}
        judul="Masuk / Daftar Akun Pasien"
        keterangan="Untuk reservasi poliklinik, paket MCU, dan riwayat kunjungan."
        saatSukses={() => { setBukaAuth(false); navigasi('/pasien') }}
      />
    </header>
  )
}
