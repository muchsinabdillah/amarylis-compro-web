import { Link } from 'react-router-dom'
import { useSitus } from '../../context/SiteContext'
import { tautanTelepon } from '../../lib/format'
import './footer.css'

const KOLOM = [
  {
    judul: 'Layanan',
    tautan: [
      { ke: '/layanan', label: 'Semua Layanan' },
      { ke: '/mcu', label: 'Medical Check Up' },
      { ke: '/homecare', label: 'Homecare' },
      { ke: '/dokter', label: 'Jadwal Dokter' },
    ],
  },
  {
    judul: 'Informasi',
    tautan: [
      { ke: '/artikel', label: 'Artikel Kesehatan' },
      { ke: '/berita', label: 'Berita & Kegiatan' },
      { ke: '/video', label: 'Video' },
      { ke: '/fasilitas', label: 'Fasilitas' },
    ],
  },
  {
    judul: 'Klinik',
    tautan: [
      { ke: '/tentang-kami', label: 'Tentang Kami' },
      { ke: '/kontak', label: 'Kontak & Lokasi' },
    ],
  },
]

const IKON_SOSIAL = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

export default function Footer() {
  const { klinik, sosial, merek } = useSitus()
  const tel = tautanTelepon(klinik.telepon)
  const tahun = new Date().getFullYear()

  return (
    <footer className="kaki">
      <div className="wadah kaki__atas">
        <div className="kaki__merek">
          <div className="baris" style={{ gap: 'var(--s-3)' }}>
            {merek.logo
              ? <img src={merek.logo} alt="" style={{ height: 44 }} />
              : <span className="kaki__lambang" aria-hidden="true">+</span>}
            <strong style={{ fontSize: 'var(--t-lg)' }}>{klinik.nama}</strong>
          </div>

          <address className="kaki__alamat">
            {klinik.alamat && <div>{klinik.alamat}</div>}
            {(klinik.kota || klinik.kodepos) && (
              <div>{[klinik.kota, klinik.kodepos].filter(Boolean).join(' ')}</div>
            )}
            {tel && <div><a href={tel}>{klinik.telepon}</a></div>}
            {klinik.email && <div><a href={`mailto:${klinik.email}`}>{klinik.email}</a></div>}
          </address>

          {klinik.jam && (
            <div className="kaki__jam">
              <span className="lencana">Jam layanan</span>
              <span>{klinik.jam}</span>
            </div>
          )}
        </div>

        {KOLOM.map((k) => (
          <nav key={k.judul} className="kaki__kolom" aria-label={k.judul}>
            <h3>{k.judul}</h3>
            <ul>
              {k.tautan.map((t) => (
                <li key={t.ke}><Link to={t.ke}>{t.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {Object.keys(sosial || {}).length > 0 && (
        <div className="wadah kaki__sosial">
          {Object.entries(sosial).map(([nama, url]) => (
            <a key={nama} href={url} target="_blank" rel="noopener noreferrer" className="kaki__sosial-tautan">
              {IKON_SOSIAL[nama] || nama}
            </a>
          ))}
        </div>
      )}

      <div className="kaki__bawah">
        <div className="wadah baris baris--antara">
          <small>© {tahun} {klinik.nama}. Seluruh hak cipta dilindungi.</small>
          {/* Pintu CMS tidak dipromosikan, tetapi juga tidak disembunyikan:
              pengelola harus bisa menemukannya tanpa mengingat URL. */}
          <small><Link to="/admin" className="kaki__admin">Masuk Pengelola</Link></small>
        </div>
      </div>
    </footer>
  )
}
