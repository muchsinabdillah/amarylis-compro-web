import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { usePasien } from '../../context/PasienAuthContext'
import './navbawah.css'

/**
 * Bilah navigasi bawah untuk layar sempit.
 *
 * Di ponsel, tujuan yang paling sering dituju tidak boleh bersembunyi di balik
 * tombol hamburger. Empat yang dipilih adalah empat pertanyaan pengunjung
 * klinik: di mana beranda, paket apa yang ada, siapa dokternya, dan di mana
 * riwayat saya.
 *
 * "Paket Layanan" membuka lembar kecil alih-alih langsung melompat, karena ia
 * mencakup dua hal yang sama pentingnya — MCU dan Homecare — dan memilih salah
 * satunya sebagai tujuan diam-diam mengubur yang lain.
 *
 * Hanya tampil di bawah 1080px, batas yang sama dengan hamburger; di atas itu
 * menu lengkap sudah ada di kepala halaman.
 */

const IKON = {
  beranda:  'M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10',
  paket:    'M9 12l2 2 4-4M7.5 4.5h9A2.5 2.5 0 0 1 19 7v11a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V7a2.5 2.5 0 0 1 2.5-2.5zM9 3h6v3H9z',
  dokter:   'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  profil:   'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1',
}

function Ikon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const PAKET = [
  { ke: '/mcu',      judul: 'Medical Check Up', teks: 'Paket pemeriksaan kesehatan berkala' },
  { ke: '/homecare', judul: 'Homecare',         teks: 'Perawatan kesehatan di rumah Anda' },
  { ke: '/layanan',  judul: 'Semua Layanan',    teks: 'Daftar lengkap layanan klinik' },
]

export default function NavBawah() {
  const { profil } = usePasien()
  const lokasi = useLocation()
  const [bukaPaket, setBukaPaket] = useState(false)
  const lembarRef = useRef(null)

  // Lembar ditutup setiap kali pindah halaman; membiarkannya terbuka di atas
  // halaman baru membuat orang mengira halamannya belum berganti.
  useEffect(() => { setBukaPaket(false) }, [lokasi.pathname])

  useEffect(() => {
    if (!bukaPaket) return
    const esc = (e) => e.key === 'Escape' && setBukaPaket(false)
    const luar = (e) => { if (lembarRef.current && !lembarRef.current.contains(e.target)) setBukaPaket(false) }
    window.addEventListener('keydown', esc)
    document.addEventListener('mousedown', luar)
    return () => { window.removeEventListener('keydown', esc); document.removeEventListener('mousedown', luar) }
  }, [bukaPaket])

  // Tidak ikut muncul di CMS maupun di dalam portal pasien, yang punya
  // navigasinya sendiri.
  if (lokasi.pathname.startsWith('/admin')) return null

  const paketAktif = PAKET.some((p) => lokasi.pathname.startsWith(p.ke))

  return (
    <>
      {bukaPaket && <div className="navbawah__tirai" aria-hidden="true" />}

      <nav className="navbawah" aria-label="Navigasi utama ponsel">
        {bukaPaket && (
          <div className="navbawah__lembar" ref={lembarRef} role="menu">
            <div className="navbawah__lembar-judul">Paket &amp; Layanan</div>
            {PAKET.map((p) => (
              <NavLink key={p.ke} to={p.ke} role="menuitem" className="navbawah__lembar-item"
                onClick={() => setBukaPaket(false)}>
                <span className="navbawah__lembar-nama">{p.judul}</span>
                <span className="navbawah__lembar-teks">{p.teks}</span>
              </NavLink>
            ))}
          </div>
        )}

        <div className="navbawah__baris">
          <NavLink to="/" end className={({ isActive }) => `navbawah__item ${isActive ? 'aktif' : ''}`}>
            <Ikon d={IKON.beranda} /><span>Home</span>
          </NavLink>

          {/* Dua keadaan yang berbeda dan tidak boleh disamakan: `aktif` berarti
              halaman yang sedang dibuka, `terbuka` hanya berarti lembarnya
              sedang tampil. Menandai keduanya sama membuat dua tab menyala
              sekaligus, dan pembacanya kehilangan petunjuk sedang di mana. */}
          <button type="button"
            className={`navbawah__item ${paketAktif ? 'aktif' : ''} ${bukaPaket ? 'terbuka' : ''}`}
            aria-haspopup="menu" aria-expanded={bukaPaket}
            onClick={() => setBukaPaket((v) => !v)}>
            <Ikon d={IKON.paket} /><span>Paket</span>
          </button>

          <NavLink to="/dokter" className={({ isActive }) => `navbawah__item ${isActive ? 'aktif' : ''}`}>
            <Ikon d={IKON.dokter} /><span>Dokter</span>
          </NavLink>

          <NavLink to="/pasien" className={({ isActive }) => `navbawah__item ${isActive ? 'aktif' : ''}`}>
            <Ikon d={IKON.profil} /><span>{profil ? 'Akun' : 'Profil'}</span>
          </NavLink>
        </div>
      </nav>
    </>
  )
}
