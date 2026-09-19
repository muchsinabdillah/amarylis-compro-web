import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { perusahaan } from '../../lib/api'
import { usePerusahaan } from '../../context/PerusahaanAuthContext'
import { Memuat, Tombol } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'
import { Angka, CSS_MCU, Lencana, LENCANA_BATCH, tanggal } from './mcuKit'

/**
 * Dasbor analisa perusahaan.
 *
 * Angkanya AGREGAT, tanpa satu pun nama orang — dasbor dibuka di layar yang
 * bisa terlihat orang lain, dan pertanyaan yang memang dijawab dasbor
 * ("berapa yang sudah selesai", "berapa yang tidak layak kerja") terjawab
 * cukup oleh angka gabungan. Nama baru muncul di halaman Hasil, yang dibuka
 * dengan sengaja.
 */

const WARNA_KELAYAKAN = {
  LAYAK: '#15803d',
  LAYAK_DENGAN_CATATAN: '#b45309',
  LAYAK_TERBATAS: '#b45309',
  TIDAK_LAYAK: '#b91c1c',
}
const rapi = (s) => String(s).replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())

export default function Dashboard() {
  const { profil } = usePerusahaan()
  const [r, setR] = useState(null)
  const [batch, setBatch] = useState(null)
  const [galat, setGalat] = useState(null)

  useSeo({ judul: 'Dashboard MCU' })

  useEffect(() => {
    const ac = new AbortController()
    Promise.all([
      perusahaan.mcuRingkas({ signal: ac.signal }),
      perusahaan.mcuBatch({ signal: ac.signal }),
    ])
      .then(([a, b]) => { setR(a.data); setBatch((b.data || []).slice(0, 5)) })
      .catch((e) => { if (e.name !== 'AbortError') { setGalat(e.message); setR(false) } })
    return () => ac.abort()
  }, [])

  const totalKelayakan = r && r.kelayakan
    ? Object.values(r.kelayakan).reduce((a, b) => a + b, 0) : 0

  return (
    <>
      <style>{CSS_MCU + CSS}</style>

      <div className="mcu-kepala db-kepala">
        <div>
          <h1>{profil?.nama_perusahaan || 'Dashboard'}</h1>
          <p>Ringkasan medical check-up karyawan yang diselenggarakan lewat portal ini.</p>
        </div>
        <Tombol ke="/perusahaan/unggah">Unggah peserta</Tombol>
      </div>

      {galat && <div className="mcu-galat" role="alert">{galat}</div>}

      {r === null ? <Memuat tinggi={220} /> : r === false ? null : (
        <>
          <div className="mcu-angka-baris">
            <Angka label="Unggahan" nilai={r.batch} />
            <Angka label="Total peserta" nilai={r.peserta} />
            <Angka label="Sudah terdaftar" nilai={r.terdaftar} corak="sukses" />
            <Angka label="MCU selesai" nilai={r.mcu_selesai} corak="sukses" />
          </div>

          {(r.batch_menunggu > 0 || r.menunggu > 0 || r.gagal > 0) && (
            <div className="mcu-angka-baris" style={{ marginTop: 'var(--s-3)' }}>
              {r.batch_menunggu > 0 && <Angka label="Unggahan menunggu verifikasi" nilai={r.batch_menunggu} corak="tunggu" />}
              {r.menunggu > 0 && <Angka label="Peserta menunggu klinik" nilai={r.menunggu} corak="tunggu" />}
              {r.gagal > 0 && <Angka label="Peserta perlu perbaikan" nilai={r.gagal} corak="batal" />}
            </div>
          )}

          <div className="db-dua">
            <section className="mcu-kartu">
              <h2>Kelayakan kerja</h2>
              {totalKelayakan === 0 ? (
                <p className="mcu-samar" style={{ fontSize: 'var(--t-sm)', margin: 0 }}>
                  Belum ada kesimpulan yang ditandatangani dokter. Angkanya muncul
                  setelah pemeriksaan selesai dibaca.
                </p>
              ) : (
                <>
                  <div className="db-bar" role="img"
                    aria-label={Object.entries(r.kelayakan).map(([k, v]) => `${rapi(k)}: ${v}`).join(', ')}>
                    {Object.entries(r.kelayakan).map(([k, v]) => (
                      <div key={k} style={{
                        width: `${(v / totalKelayakan) * 100}%`,
                        background: WARNA_KELAYAKAN[k] || '#64748b',
                      }} title={`${rapi(k)}: ${v}`} />
                    ))}
                  </div>
                  <ul className="db-kunci">
                    {Object.entries(r.kelayakan).map(([k, v]) => (
                      <li key={k}>
                        <span className="db-titik" style={{ background: WARNA_KELAYAKAN[k] || '#64748b' }} />
                        {rapi(k)}
                        <b>{v}</b>
                        <span className="mcu-samar">
                          {Math.round((v / totalKelayakan) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mcu-samar db-catatan">
                    Dari {totalKelayakan} pemeriksaan yang kesimpulannya sudah final.
                  </p>
                </>
              )}
            </section>

            <section className="mcu-kartu">
              <h2>Kemajuan pendaftaran</h2>
              <div className="db-pasang"><span>Peserta diunggah</span><b>{r.peserta}</b></div>
              <div className="db-pasang"><span>Berhasil didaftarkan</span><b>{r.terdaftar}</b></div>
              <div className="db-pasang"><span>Karyawan yang baru pertama berobat di klinik</span><b>{r.pasien_baru}</b></div>
              <div className="db-pasang"><span>Pemeriksaan selesai</span><b>{r.mcu_selesai}</b></div>
              <p className="mcu-samar db-catatan">
                Karyawan yang baru pertama kali datang otomatis dibuatkan nomor rekam
                medik oleh klinik saat unggahan diverifikasi.
              </p>
            </section>
          </div>

          <section style={{ marginTop: 'var(--s-4)' }}>
            <div className="db-judul-baris">
              <h2>Unggahan terakhir</h2>
              <Link to="/perusahaan/batch" style={{ fontSize: 'var(--t-sm)' }}>Lihat semua →</Link>
            </div>

            {!batch || batch.length === 0 ? (
              <div className="mcu-kartu mcu-kosong">
                Belum ada unggahan. <Link to="/perusahaan/unggah">Kirim daftar peserta</Link> untuk memulai.
              </div>
            ) : (
              <div className="mcu-tabel-bungkus">
                <table className="mcu-tabel">
                  <thead>
                    <tr><th>No. Unggahan</th><th>Tanggal MCU</th><th style={{ textAlign: 'right' }}>Peserta</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {batch.map((b) => (
                      <tr key={b.no_batch}>
                        <td>
                          <Link to={`/perusahaan/batch/${encodeURIComponent(b.no_batch)}`} className="mcu-mono">
                            {b.no_batch}
                          </Link>
                        </td>
                        <td>{tanggal(b.tgl_mcu)}</td>
                        <td style={{ textAlign: 'right' }}>{b.jumlah_peserta}</td>
                        <td><Lencana peta={LENCANA_BATCH} nilai={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  )
}

const CSS = `
.db-kepala { display:flex; justify-content:space-between; gap:var(--s-3); flex-wrap:wrap; align-items:flex-start; }
.db-dua { display:grid; grid-template-columns:1fr 1fr; gap:var(--s-3); margin-top:var(--s-4); }
.db-dua h2, .db-judul-baris h2 { font-size:var(--t-sm); margin:0 0 var(--s-3); text-transform:uppercase; letter-spacing:.04em; color:var(--teks-lembut); }
.db-judul-baris { display:flex; justify-content:space-between; align-items:baseline; gap:var(--s-3); margin-bottom:var(--s-3); }
.db-judul-baris h2 { margin:0; }
.db-bar { display:flex; height:12px; border-radius:999px; overflow:hidden; background:var(--hijau-50); }
.db-bar > div { min-width:2px; }
.db-kunci { list-style:none; margin:var(--s-3) 0 0; padding:0; display:grid; gap:6px; font-size:var(--t-sm); }
.db-kunci li { display:flex; align-items:center; gap:8px; }
.db-kunci li b { margin-left:auto; font-variant-numeric:tabular-nums; }
.db-kunci li span.mcu-samar { width:42px; text-align:right; font-variant-numeric:tabular-nums; }
.db-titik { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.db-pasang { display:flex; justify-content:space-between; gap:var(--s-3); font-size:var(--t-sm); padding:6px 0; border-bottom:1px solid var(--garis); }
.db-pasang:last-of-type { border-bottom:0; }
.db-pasang b { font-variant-numeric:tabular-nums; }
.db-catatan { font-size:var(--t-xs); margin:var(--s-3) 0 0; }
@media (max-width:820px) { .db-dua { grid-template-columns:1fr; } }
`
