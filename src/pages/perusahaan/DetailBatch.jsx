import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { perusahaan } from '../../lib/api'
import { Memuat, Tombol } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'
import { Angka, CSS_MCU, Lencana, LENCANA_BATCH, LENCANA_COCOK, LENCANA_PESERTA, tanggal, waktu } from './mcuKit'

/** Isi satu unggahan: siapa saja pesertanya dan sudah sampai mana prosesnya. */
export default function DetailBatch() {
  const { no } = useParams()
  const navigasi = useNavigate()
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)
  const [batalkan, setBatalkan] = useState(false)

  useSeo({ judul: `Unggahan ${no}` })

  const muat = useCallback((signal) => {
    perusahaan.mcuDetail(no, { signal })
      .then((h) => setD(h.data))
      .catch((e) => { if (e.name !== 'AbortError') { setGalat(e.message); setD(false) } })
  }, [no])

  useEffect(() => {
    const ac = new AbortController()
    muat(ac.signal)
    return () => ac.abort()
  }, [muat])

  const batal = async () => {
    const alasan = window.prompt('Alasan pembatalan (dikirim ke klinik):', '')
    if (alasan === null) return
    setBatalkan(true)
    setGalat(null)
    try {
      await perusahaan.mcuBatal(no, alasan)
      muat()
    } catch (e) {
      setGalat(e.status === 422 ? Object.values(e.perKolom || {})[0] || e.message : e.message)
    } finally {
      setBatalkan(false)
    }
  }

  if (d === null) return <Memuat tinggi={220} />
  if (d === false) {
    return (
      <>
        <style>{CSS_MCU}</style>
        <div className="mcu-galat">{galat || 'Unggahan tidak ditemukan.'}</div>
        <p style={{ marginTop: 'var(--s-3)' }}><Link to="/perusahaan/batch">← Kembali ke daftar unggahan</Link></p>
      </>
    )
  }

  const b = d.batch || {}
  const peserta = d.peserta || []
  const jml = (f) => peserta.filter(f).length
  const bisaBatal = Number(b.batal) !== 1 && jml((p) => p.status === 'SELESAI') === 0

  return (
    <>
      <style>{CSS_MCU + CSS}</style>

      <p style={{ marginBottom: 'var(--s-3)', fontSize: 'var(--t-sm)' }}>
        <Link to="/perusahaan/batch">← Daftar unggahan</Link>
      </p>

      <div className="mcu-kepala db-kepala">
        <div>
          <h1 className="mcu-mono">{b.no_batch}</h1>
          <p>
            MCU {tanggal(b.tgl_mcu)} · {b.nama_paket || 'paket belum tercatat'} ·
            {' '}dikirim {waktu(b.diunggah_at)} oleh {b.diunggah_oleh}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Lencana peta={LENCANA_BATCH} nilai={b.status} />
          {bisaBatal && (
            <Tombol corak="garis" onClick={batal} memuat={batalkan}>Batalkan unggahan</Tombol>
          )}
        </div>
      </div>

      {galat && <div className="mcu-galat" role="alert" style={{ marginBottom: 'var(--s-3)' }}>{galat}</div>}

      {Number(b.batal) === 1 && (
        <div className="mcu-hati" style={{ marginBottom: 'var(--s-3)' }}>
          Unggahan ini dibatalkan{b.alasan_batal ? ` — ${b.alasan_batal}` : ''}.
        </div>
      )}

      {b.status === 'DIUNGGAH' && Number(b.batal) !== 1 && (
        <div className="mcu-info" style={{ marginBottom: 'var(--s-3)' }}>
          Daftar sudah diterima klinik dan menunggu verifikasi. Pendaftaran dan nomor rekam medik
          dibuat setelah petugas memeriksanya — Anda tidak perlu melakukan apa-apa lagi.
        </div>
      )}

      <div className="mcu-angka-baris" style={{ marginBottom: 'var(--s-4)' }}>
        <Angka label="Peserta" nilai={peserta.length} />
        <Angka label="Sudah terdaftar" nilai={jml((p) => p.status === 'SELESAI')} corak="sukses" />
        <Angka label="Menunggu klinik" nilai={jml((p) => p.status === 'MENUNGGU' || p.status === 'DIVERIFIKASI')} corak="tunggu" />
        <Angka label="Perlu perbaikan" nilai={jml((p) => p.status === 'GAGAL')} corak="batal" />
      </div>

      {jml((p) => p.status === 'GAGAL') > 0 && (
        <div className="mcu-hati" style={{ marginBottom: 'var(--s-3)' }}>
          Sebagian peserta belum bisa didaftarkan. Alasannya tertulis di kolom keterangan —
          hubungi klinik bila datanya perlu diperbaiki.
        </div>
      )}

      <div className="mcu-tabel-bungkus">
        <table className="mcu-tabel">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Nama</th><th>NIK</th><th>Tgl Lahir</th>
              <th>Rekam medik</th><th>No. Pendaftaran</th><th>Status</th><th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {peserta.map((p, i) => (
              <tr key={p.id}>
                <td className="mcu-samar">{p.baris ?? i + 1}</td>
                <td style={{ fontWeight: 600 }}>{p.nama}</td>
                <td className="mcu-mono">{p.nik || '—'}</td>
                <td>{p.tgl_lahir ? tanggal(p.tgl_lahir) : '—'}</td>
                <td><Lencana peta={LENCANA_COCOK} nilai={p.cocok} /></td>
                <td className="mcu-mono">{p.no_registrasi || '—'}</td>
                <td><Lencana peta={LENCANA_PESERTA} nilai={p.status} /></td>
                <td className="mcu-samar db-ket">{p.status === 'GAGAL' ? p.pesan : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jml((p) => p.status === 'SELESAI') > 0 && (
        <p style={{ marginTop: 'var(--s-4)', fontSize: 'var(--t-sm)' }}>
          <Link to="/perusahaan/hasil">Lihat hasil pemeriksaan →</Link>
        </p>
      )}
    </>
  )
}

const CSS = `
.db-kepala { display:flex; justify-content:space-between; gap:var(--s-3); flex-wrap:wrap; align-items:flex-start; }
.db-ket { font-size:var(--t-xs); max-width:280px; }
`
