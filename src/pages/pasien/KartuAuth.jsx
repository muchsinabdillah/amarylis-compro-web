import { Link } from 'react-router-dom'
import { useSitus } from '../../context/SiteContext'

/** Bingkai terpusat untuk halaman masuk & daftar pasien (responsif). */
export default function KartuAuth({ judul, sub, children, bawah }) {
  const { klinik } = useSitus()
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--s-5)',
      background: 'linear-gradient(160deg, var(--hijau-50), var(--putih) 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--s-5)' }}>
          <Link to="/" aria-label="Beranda" style={{
            display: 'inline-grid', placeItems: 'center', width: 52, height: 52,
            background: 'var(--hijau-700)', color: '#fff', borderRadius: 'var(--r-lg)',
            fontSize: '1.9rem', fontWeight: 700, lineHeight: 1,
          }}>+</Link>
          <h1 style={{ fontSize: 'var(--t-xl)', marginTop: 'var(--s-3)' }}>{judul}</h1>
          <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 4 }}>
            {sub || (klinik?.nama ? `Portal pasien ${klinik.nama}` : 'Portal pasien')}
          </p>
        </div>
        <div style={{
          background: 'var(--putih)', border: '1px solid var(--garis)',
          borderRadius: 'var(--r-lg)', padding: 'var(--s-5)', boxShadow: 'var(--bayang-2)',
        }}>
          {children}
        </div>
        {bawah && (
          <p style={{ textAlign: 'center', marginTop: 'var(--s-4)', fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)' }}>
            {bawah}
          </p>
        )}
      </div>
    </div>
  )
}
