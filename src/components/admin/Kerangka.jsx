import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSitus } from '../../context/SiteContext'
import './kerangka.css'

/**
 * Kerangka CMS: sisi kiri untuk menu, atas untuk identitas dan tindakan.
 *
 * Menu disaring berdasarkan wewenang. Menampilkan menu yang selalu berakhir
 * dengan penolakan hanya membuat orang mengira sistemnya rusak.
 */
const MENU = [
  { grup: 'Ringkasan', item: [
    { ke: '/admin', label: 'Dasbor', ikon: '▤', ujung: true },
  ] },
  { grup: 'Konten', item: [
    { ke: '/admin/konten/articles', label: 'Artikel', ikon: '✎', izin: 'article.manage' },
    { ke: '/admin/konten/news',     label: 'Berita & Kegiatan', ikon: '◈', izin: 'news.manage' },
    { ke: '/admin/konten/videos',   label: 'Video', ikon: '▶', izin: 'video.manage' },
    { ke: '/admin/halaman',         label: 'Halaman Statis', ikon: '▢', izin: 'page.manage' },
  ] },
  { grup: 'Layanan', item: [
    { ke: '/admin/konten/services', label: 'Layanan', ikon: '✚', izin: 'service.manage' },
    { ke: '/admin/konten/mcu',      label: 'Paket MCU', ikon: '☑', izin: 'mcu.manage' },
    { ke: '/admin/konten/homecare', label: 'Homecare', ikon: '⌂', izin: 'homecare.manage' },
    { ke: '/admin/fasilitas',       label: 'Fasilitas', ikon: '◫', izin: 'facility.manage' },
  ] },
  { grup: 'Pasien', item: [
    { ke: '/admin/reservasi', label: 'Reservasi', ikon: '🗓', izin: 'reservation.manage' },
    { ke: '/admin/pesanan', label: 'Pesanan Paket', ikon: '📦', izin: 'reservation.manage' },
  ] },
  { grup: 'Data SIMRS', item: [
    { ke: '/admin/dokter',  label: 'Dokter', ikon: '⚕', izin: 'doctor.manage' },
    { ke: '/admin/sinkron', label: 'Sinkronisasi', ikon: '⟳', izin: 'doctor.manage' },
  ] },
  { grup: 'Pengelolaan', item: [
    { ke: '/admin/media',      label: 'Pustaka Media', ikon: '▣', izin: 'media.manage' },
    { ke: '/admin/kategori',   label: 'Kategori', ikon: '⌗', izin: 'category.manage' },
    { ke: '/admin/pengaturan', label: 'Pengaturan Situs', ikon: '⚙', izin: 'setting.view' },
    { ke: '/admin/pengguna',   label: 'Pengguna & Peran', ikon: '☺', izin: 'user.manage' },
  ] },
]

export default function Kerangka() {
  const { pengguna, keluar, boleh } = useAuth()
  const { klinik } = useSitus()
  const [buka, setBuka] = useState(false)
  const lokasi = useLocation()

  useEffect(() => { setBuka(false) }, [lokasi.pathname])

  const grupTampil = MENU
    .map((g) => ({ ...g, item: g.item.filter((i) => !i.izin || boleh(i.izin)) }))
    .filter((g) => g.item.length > 0)

  return (
    <div className="cms">
      <aside className={`cms__sisi ${buka ? 'cms__sisi--buka' : ''}`}>
        <div className="cms__merek">
          <span className="cms__lambang" aria-hidden="true">+</span>
          <div>
            <strong>CMS Website</strong>
            <small>{klinik.nama}</small>
          </div>
        </div>

        <nav className="cms__menu" aria-label="Menu pengelolaan">
          {grupTampil.map((g) => (
            <div key={g.grup} className="cms__grup">
              <span className="cms__grup-judul">{g.grup}</span>
              {g.item.map((i) => (
                <NavLink
                  key={i.ke}
                  to={i.ke}
                  end={i.ujung}
                  className={({ isActive }) => `cms__tautan${isActive ? ' cms__tautan--aktif' : ''}`}
                >
                  <span className="cms__ikon" aria-hidden="true">{i.ikon}</span>
                  {i.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="cms__kaki-sisi">
          <Link to="/" target="_blank" rel="noopener noreferrer" className="cms__tautan">
            <span className="cms__ikon" aria-hidden="true">↗</span>
            Lihat situs
          </Link>
        </div>
      </aside>

      {buka && <button type="button" className="cms__tirai" aria-label="Tutup menu" onClick={() => setBuka(false)} />}

      <div className="cms__utama">
        <header className="cms__atas">
          <button
            type="button"
            className="cms__hamburger"
            aria-label="Buka menu"
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
          >
            ☰
          </button>

          <div className="cms__atas-kanan">
            <div className="cms__pengguna">
              <strong>{pengguna.nama}</strong>
              <small>{(pengguna.peran || []).join(', ')}</small>
            </div>
            <Link to="/admin/sandi" className="btn btn--garis btn--kecil">Ganti sandi</Link>
            <button type="button" className="btn btn--polos btn--kecil" onClick={keluar}>Keluar</button>
          </div>
        </header>

        <main className="cms__isi">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
