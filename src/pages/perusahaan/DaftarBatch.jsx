import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { perusahaan } from '../../lib/api'
import { Memuat, Tombol } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'
import { CSS_MCU, Lencana, LENCANA_BATCH, tanggal, waktu } from './mcuKit'

/** Riwayat unggahan perusahaan, terbaru di atas. */
export default function DaftarBatch() {
  const [rows, setRows] = useState(null)
  const [galat, setGalat] = useState(null)

  useSeo({ judul: 'Daftar Unggahan MCU' })

  useEffect(() => {
    const ac = new AbortController()
    perusahaan.mcuBatch({ signal: ac.signal })
      .then((h) => setRows(h.data || []))
      .catch((e) => { if (e.name !== 'AbortError') { setGalat(e.message); setRows([]) } })
    return () => ac.abort()
  }, [])

  return (
    <>
      <style>{CSS_MCU}</style>

      <div className="mcu-kepala" style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        <div>
          <h1>Unggahan MCU</h1>
          <p>Riwayat daftar peserta yang pernah dikirim ke klinik.</p>
        </div>
        <Tombol ke="/perusahaan/unggah">Unggah baru</Tombol>
      </div>

      {galat && <div className="mcu-galat" role="alert" style={{ marginBottom: 'var(--s-3)' }}>{galat}</div>}

      {rows === null ? <Memuat tinggi={180} />
        : rows.length === 0 ? (
          <div className="mcu-kartu mcu-kosong">
            Belum ada unggahan. <Link to="/perusahaan/unggah">Unggah daftar peserta</Link> untuk memulai.
          </div>
        ) : (
          <div className="mcu-tabel-bungkus">
            <table className="mcu-tabel">
              <thead>
                <tr>
                  <th>No. Unggahan</th><th>Tanggal MCU</th><th>Paket</th>
                  <th style={{ textAlign: 'right' }}>Peserta</th>
                  <th>Status</th><th>Dikirim</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.no_batch}>
                    <td>
                      <Link to={`/perusahaan/batch/${encodeURIComponent(b.no_batch)}`} className="mcu-mono">
                        {b.no_batch}
                      </Link>
                    </td>
                    <td>{tanggal(b.tgl_mcu)}</td>
                    <td>{b.nama_paket || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {Number(b.jml_selesai) > 0
                        ? <span><b>{b.jml_selesai}</b> / {b.jumlah_peserta}</span>
                        : b.jumlah_peserta}
                    </td>
                    <td>
                      <Lencana peta={LENCANA_BATCH} nilai={b.status} />
                      {Number(b.jml_gagal) > 0 && (
                        <div style={{ fontSize: 'var(--t-xs)', color: '#b91c1c', marginTop: 3 }}>
                          {b.jml_gagal} perlu perbaikan
                        </div>
                      )}
                    </td>
                    <td className="mcu-samar" style={{ fontSize: 'var(--t-xs)' }}>{waktu(b.diunggah_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </>
  )
}
