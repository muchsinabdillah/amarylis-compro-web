import { useState } from 'react'
import { pasien } from '../../lib/api'
import { usePasien } from '../../context/PasienAuthContext'
import KartuAuth from './KartuAuth'
import { Teks } from '../../components/ui/Isian'
import { Tombol, Info } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'

/**
 * Gerbang saat pertama masuk: verifikasi rekam medik.
 *
 * Pasien memasukkan NIK + tanggal lahir; bila cocok di SIMRS, No. RM + NIK +
 * tanggal lahir tersimpan ke akun (pasien_akun) lewat /api/pasien/cari-rm.
 * Pasien baru boleh melewati — datanya dibuat saat reservasi pertama.
 */
export default function VerifikasiRM({ onSelesai }) {
  const { profil, setProfil } = usePasien()
  const [nik, setNik] = useState(profil?.nik || '')
  const [tgl, setTgl] = useState((profil?.tgl_lahir || '').slice(0, 10))
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)
  const [hasil, setHasil] = useState(null)
  useSeo({ judul: 'Verifikasi Rekam Medik' })
  const hariIni = new Date().toISOString().slice(0, 10)

  const lewati = () => {
    try { sessionStorage.setItem('pasien.verif.lewati', '1') } catch { /* abaikan */ }
    onSelesai()
  }

  const verif = async (e) => {
    e.preventDefault()
    if (!nik.trim() || !tgl) { setGalat('Isi NIK dan tanggal lahir.'); return }
    setGalat(null); setSibuk(true)
    try {
      const { data } = await pasien.cariRm({ nik: nik.trim(), tgl_lahir: tgl })
      if (data?.ditemukan) {
        // Sinkron ke sesi lokal; server sudah menyimpan ke pasien_akun.
        setProfil((p) => ({
          ...(p || {}), no_mr: data.no_mr, nik: nik.trim(), tgl_lahir: tgl,
          nama: (p && p.nama) || data.nama, jenis_kelamin: (p && p.jenis_kelamin) || data.jenis_kelamin,
        }))
        setHasil(data)
        setTimeout(onSelesai, 1100)
      } else {
        setHasil({ ditemukan: false })
      }
    } catch (err) {
      setGalat(err.message || 'Gagal memverifikasi. Coba lagi.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <KartuAuth judul="Verifikasi Rekam Medik" sub="Tautkan data Anda dengan rekam medik klinik">
      {hasil?.ditemukan ? (
        <Info corak="sukses" judul="Terverifikasi ✓">
          No. Rekam Medik Anda: <b>{hasil.no_mr}</b>
          {hasil.nama ? ` · ${hasil.nama}` : ''}. Mengalihkan ke dashboard…
        </Info>
      ) : (
        <form onSubmit={verif} className="tumpuk" style={{ gap: 'var(--s-4)' }}>
          <Info corak="info">
            Masukkan <b>NIK</b> dan <b>tanggal lahir</b> sesuai data di klinik. Jika Anda belum pernah berobat, silakan lewati.
          </Info>
          {galat && <div className="galat-kotak" role="alert">{galat}</div>}
          {hasil && !hasil.ditemukan && (
            <Info corak="awas" judul="Data tidak ditemukan">
              NIK / tanggal lahir tidak cocok dengan rekam medik klinik. Periksa kembali, atau lewati untuk mendaftar sebagai pasien baru saat reservasi.
            </Info>
          )}
          <Teks label="NIK" wajib inputMode="numeric" value={nik} onChange={(e) => setNik(e.target.value)} />
          <Teks label="Tanggal lahir" type="date" wajib max={hariIni} value={tgl} onChange={(e) => setTgl(e.target.value)} />
          <Tombol type="submit" penuh disabled={sibuk}>{sibuk ? 'Memverifikasi…' : 'Verifikasi'}</Tombol>
          <button type="button" className="btn btn--polos btn--kecil" onClick={lewati} style={{ alignSelf: 'center' }}>
            Lewati dulu — saya pasien baru
          </button>
        </form>
      )}
    </KartuAuth>
  )
}
