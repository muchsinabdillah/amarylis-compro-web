import { useEffect, useState } from 'react'
import { usePasien } from '../../context/PasienAuthContext'
import { Teks } from '../ui/Isian'
import { Tombol, Info } from '../ui/Dasar'

/**
 * Masuk / daftar akun pasien dalam MODAL.
 *
 * Dipakai dari halaman publik (mis. tombol "Reservasi" di kartu dokter) supaya
 * pengunjung tidak dilempar ke halaman lain lalu harus mengulang klik: setelah
 * berhasil, `saatSukses` melanjutkan tepat ke tindakan yang tadi diminta.
 */
export default function ModalAuth({ terbuka, saatTutup, saatSukses, judul, keterangan }) {
  const { masuk, daftar } = usePasien()
  const [tab, setTab] = useState('masuk')
  const [f, setF] = useState({ no_hp: '', password: '', nama: '' })
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)

  // Tutup dengan Esc, dan kunci gulir halaman di belakang modal.
  useEffect(() => {
    if (!terbuka) return undefined
    const esc = (e) => { if (e.key === 'Escape') saatTutup?.() }
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [terbuka, saatTutup])

  if (!terbuka) return null

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const kirim = async (e) => {
    e.preventDefault()
    setGalat(null); setSibuk(true)
    try {
      if (tab === 'masuk') await masuk(f.no_hp.trim(), f.password)
      else await daftar({ no_hp: f.no_hp.trim(), nama: f.nama.trim(), password: f.password })
      saatSukses?.()
    } catch (err) {
      setGalat(err.message || 'Gagal. Periksa kembali isian Anda.')
    } finally {
      setSibuk(false)
    }
  }

  const tabBtn = (nilai, label) => (
    <button
      type="button"
      onClick={() => { setTab(nilai); setGalat(null) }}
      style={{
        flex: 1, padding: '0.6rem', border: 0, cursor: 'pointer', fontWeight: 700,
        fontSize: 'var(--t-sm)', background: 'transparent',
        color: tab === nilai ? 'var(--hijau-800)' : 'var(--teks-lembut)',
        borderBottom: `2px solid ${tab === nilai ? 'var(--hijau-700)' : 'transparent'}`,
      }}
    >{label}</button>
  )

  return (
    <div
      onClick={saatTutup}
      role="dialog"
      aria-modal="true"
      aria-label={judul || 'Masuk akun pasien'}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(16,18,15,0.55)', zIndex: 90,
        display: 'grid', placeItems: 'center', padding: 'var(--s-4)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tumpuk"
        style={{
          background: 'var(--putih)', borderRadius: 'var(--r-lg)', padding: 'var(--s-5)',
          width: '100%', maxWidth: 420, gap: 'var(--s-4)', boxShadow: 'var(--bayang-3)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--t-lg)' }}>{judul || 'Masuk untuk melanjutkan'}</h2>
          {keterangan && (
            <p style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', marginTop: 4 }}>{keterangan}</p>
          )}
        </div>

        <div className="baris" style={{ gap: 0, borderBottom: '1px solid var(--garis)' }}>
          {tabBtn('masuk', 'Masuk')}
          {tabBtn('daftar', 'Daftar Akun')}
        </div>

        <form onSubmit={kirim} className="tumpuk" style={{ gap: 'var(--s-3)' }}>
          {galat && <div className="galat-kotak" role="alert">{galat}</div>}

          {tab === 'daftar' && (
            <Teks label="Nama lengkap" wajib value={f.nama} onChange={set('nama')} autoComplete="name" />
          )}
          <Teks
            label="Nomor HP" wajib inputMode="numeric" placeholder="08xxxxxxxxxx"
            value={f.no_hp} onChange={set('no_hp')} autoComplete="tel"
          />
          <Teks
            label="Kata sandi" type="password" wajib value={f.password} onChange={set('password')}
            autoComplete={tab === 'masuk' ? 'current-password' : 'new-password'}
            bantuan={tab === 'daftar' ? 'Minimal 8 karakter.' : undefined}
          />

          {tab === 'daftar' && (
            <Info corak="info">Setelah daftar, Anda akan diminta memverifikasi rekam medik (NIK & tanggal lahir).</Info>
          )}

          <Tombol type="submit" penuh disabled={sibuk}>
            {sibuk ? 'Memproses…' : (tab === 'masuk' ? 'Masuk' : 'Daftar & Lanjutkan')}
          </Tombol>
          <button type="button" className="btn btn--polos btn--kecil" onClick={saatTutup} style={{ alignSelf: 'center' }}>
            Batal
          </button>
        </form>
      </div>
    </div>
  )
}
