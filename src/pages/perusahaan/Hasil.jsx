import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { perusahaan } from '../../lib/api'
import { Memuat } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'
import { CSS_MCU, tanggal, waktu } from './mcuKit'

/**
 * Hasil pemeriksaan karyawan.
 *
 * Yang ditampilkan hanya yang sudah SELESAI dari sisi klinik: hasil lab yang
 * sudah divalidasi analis, bacaan radiologi yang sudah final, dan kesimpulan
 * yang sudah ditandatangani dokter. Angka yang belum melewati itu bukan hasil,
 * dan menampilkannya lebih buruk daripada menunggu — karena itu di layar ini
 * yang belum siap tertulis "Belum selesai", bukan tampil setengah.
 */

const KELAYAKAN = {
  LAYAK:                 { teks: 'Layak',                   corak: 'sukses' },
  LAYAK_DENGAN_CATATAN:  { teks: 'Layak dengan catatan',    corak: 'tunggu' },
  TIDAK_LAYAK:           { teks: 'Tidak layak',             corak: 'batal' },
  LAYAK_TERBATAS:        { teks: 'Layak terbatas',          corak: 'tunggu' },
}

function LencanaKelayakan({ nilai }) {
  if (!nilai) return <span className="mcu-samar">—</span>
  const k = KELAYAKAN[nilai] || { teks: String(nilai).replace(/_/g, ' '), corak: 'jalan' }
  return <span className={'mcu-lencana ' + k.corak}>{k.teks}</span>
}

/** Daftar dari JSONB bisa datang sebagai larik, teks JSON, atau teks biasa. */
function daftarDari(v) {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') {
    const s = v.trim()
    if (s === '' || s === '[]') return []
    if (s.startsWith('[')) {
      try {
        const a = JSON.parse(s)
        return Array.isArray(a) ? a.map(String) : [s]
      } catch { return [s] }
    }
    return [s]
  }
  return [String(v)]
}

export default function Hasil() {
  const [rows, setRows] = useState(null)
  const [galat, setGalat] = useState(null)
  const [cari, setCari] = useState('')
  const [buka, setBuka] = useState(null)      // id peserta yang dibuka
  const [detail, setDetail] = useState({})    // id -> hasil lengkap | 'muat' | 'galat'

  useSeo({ judul: 'Hasil MCU' })

  useEffect(() => {
    const ac = new AbortController()
    perusahaan.mcuHasil({ signal: ac.signal })
      .then((h) => setRows(h.data || []))
      .catch((e) => { if (e.name !== 'AbortError') { setGalat(e.message); setRows([]) } })
    return () => ac.abort()
  }, [])

  const tersaring = useMemo(() => {
    const t = cari.trim().toLowerCase()
    if (!t || !rows) return rows || []
    return rows.filter((r) => String(r.nama).toLowerCase().includes(t)
      || String(r.no_batch).toLowerCase().includes(t))
  }, [rows, cari])

  const bukaBaris = async (r) => {
    if (buka === r.id) { setBuka(null); return }
    setBuka(r.id)
    if (detail[r.id] && detail[r.id] !== 'galat') return
    setDetail((s) => ({ ...s, [r.id]: 'muat' }))
    try {
      const h = await perusahaan.mcuHasilDetail(r.id)
      setDetail((s) => ({ ...s, [r.id]: h.data }))
    } catch (e) {
      setDetail((s) => ({ ...s, [r.id]: { galat: e.message } }))
    }
  }

  return (
    <>
      <style>{CSS_MCU + CSS}</style>

      <div className="mcu-kepala">
        <h1>Hasil MCU</h1>
        <p>
          Hasil karyawan yang diperiksa lewat unggahan perusahaan Anda. Yang masih dikerjakan
          klinik ditandai "belum selesai" — angkanya baru muncul setelah divalidasi.
        </p>
      </div>

      {galat && <div className="mcu-galat" role="alert" style={{ marginBottom: 'var(--s-3)' }}>{galat}</div>}

      {rows === null ? <Memuat tinggi={200} />
        : rows.length === 0 ? (
          <div className="mcu-kartu mcu-kosong">
            Belum ada peserta yang selesai didaftarkan.
            {' '}<Link to="/perusahaan/batch">Lihat unggahan Anda</Link>.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 'var(--s-3)' }}>
              <input className="hasil-cari" value={cari} onChange={(e) => setCari(e.target.value)}
                placeholder="Cari nama karyawan atau nomor unggahan…" aria-label="Cari" />
            </div>

            <div className="mcu-tabel-bungkus">
              <table className="mcu-tabel">
                <thead>
                  <tr>
                    <th>Nama</th><th>Tanggal MCU</th><th>Lab</th><th>Radiologi</th>
                    <th>Kesimpulan</th><th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {tersaring.map((r) => {
                    const d = detail[r.id]
                    const terbuka = buka === r.id
                    return (
                      <Fragment key={r.id}>
                        <tr onClick={() => bukaBaris(r)} className="hasil-baris">
                          <td style={{ fontWeight: 600 }}>
                            {r.nama}
                            <div className="mcu-samar mcu-mono" style={{ fontSize: 'var(--t-xs)' }}>{r.no_batch}</div>
                          </td>
                          <td>{tanggal(r.tgl_mcu)}</td>
                          <td>{r.lab_total ? `${r.lab_selesai} / ${r.lab_total}` : '—'}</td>
                          <td>{r.rad_total ? `${r.rad_selesai} / ${r.rad_total}` : '—'}</td>
                          <td>
                            {r.kesimpulan_siap
                              ? <LencanaKelayakan nilai={r.status_kelayakan} />
                              : <span className="mcu-lencana tunggu">Belum selesai</span>}
                          </td>
                          <td className="mcu-samar" aria-hidden="true">{terbuka ? '▾' : '▸'}</td>
                        </tr>

                        {terbuka && (
                          <tr>
                            <td colSpan={6} className="hasil-isi">
                              {d === 'muat' || d === undefined ? <Memuat tinggi={90} />
                                : d.galat ? <div className="mcu-galat">{d.galat}</div>
                                  : <IsiHasil d={d} />}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
    </>
  )
}

function IsiHasil({ d }) {
  const k = d.kesimpulan
  const rekomendasi = daftarDari(k?.rekomendasi_perusahaan)
  const pembatasan = daftarDari(k?.pembatasan)

  return (
    <div className="hasil-panel">
      <div>
        <h3>Kesimpulan pemeriksaan</h3>
        {!k ? (
          <p className="mcu-samar" style={{ fontSize: 'var(--t-sm)' }}>
            Dokter belum menandatangani kesimpulan. Hasil akan muncul di sini setelah selesai.
          </p>
        ) : (
          <div className="hasil-kesimpulan">
            <div className="hasil-pasang">
              <span>Kelayakan kerja</span><LencanaKelayakan nilai={k.status_kelayakan} />
            </div>
            {k.kesimpulan_klinis && (
              <div className="hasil-pasang"><span>Kesimpulan</span><div>{k.kesimpulan_klinis}</div></div>
            )}
            {pembatasan.length > 0 && (
              <div className="hasil-pasang">
                <span>Pembatasan</span>
                <ul>{pembatasan.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            {k.catatan_pembatasan && (
              <div className="hasil-pasang"><span>Catatan</span><div>{k.catatan_pembatasan}</div></div>
            )}
            {rekomendasi.length > 0 && (
              <div className="hasil-pasang">
                <span>Rekomendasi</span>
                <ul>{rekomendasi.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            {k.berlaku_sampai && (
              <div className="hasil-pasang"><span>Berlaku sampai</span><div>{tanggal(k.berlaku_sampai)}</div></div>
            )}
            <div className="hasil-pasang">
              <span>Ditandatangani</span>
              <div>{k.dokter || '—'} · {waktu(k.ditandatangani)}</div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3>Laboratorium</h3>
        {d.lab.length === 0 ? (
          <p className="mcu-samar" style={{ fontSize: 'var(--t-sm)' }}>Belum ada hasil yang divalidasi.</p>
        ) : (
          <table className="mcu-tabel hasil-lab">
            <thead>
              <tr><th>Pemeriksaan</th><th>Hasil</th><th>Satuan</th><th>Rujukan</th></tr>
            </thead>
            <tbody>
              {d.lab.map((h, i) => (
                <tr key={i}>
                  <td>{h.NamaParameter || h.nama_test}</td>
                  <td className={'hasil-nilai' + (h.flag && h.flag !== 'N' ? ' tandai' : '')}>
                    {h.hasil}{h.flag && h.flag !== 'N' ? ` ${h.flag}` : ''}
                  </td>
                  <td className="mcu-samar">{h.satuan || '—'}</td>
                  <td className="mcu-samar">{h.nilai_rujukan || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h3>Radiologi</h3>
        {d.radiologi.length === 0 ? (
          <p className="mcu-samar" style={{ fontSize: 'var(--t-sm)' }}>Tidak ada pemeriksaan radiologi, atau bacaannya belum final.</p>
        ) : d.radiologi.map((h, i) => (
          <div key={i} className="hasil-rad">
            <div style={{ fontWeight: 700 }}>{h.NamaPemeriksaan} {h.Modalitas ? `(${h.Modalitas})` : ''}</div>
            {h.Temuan && <div><b>Temuan:</b> {h.Temuan}</div>}
            {h.Kesan && <div><b>Kesan:</b> {h.Kesan}</div>}
            {h.Saran && <div><b>Saran:</b> {h.Saran}</div>}
            <div className="mcu-samar" style={{ fontSize: 'var(--t-xs)', marginTop: 4 }}>
              {h.NamaDokterRad || '—'} · {waktu(h.TglBaca)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const CSS = `
.hasil-cari {
  width:100%; max-width:380px; border:1px solid var(--garis); border-radius:var(--r-md);
  padding:9px 12px; font:inherit; font-size:var(--t-sm); background:var(--putih); color:var(--teks);
}
.hasil-baris { cursor:pointer; }
.hasil-isi { background:var(--hijau-50); padding:var(--s-4) !important; }
.hasil-panel { display:grid; gap:var(--s-4); }
.hasil-panel h3 { font-size:var(--t-sm); margin:0 0 var(--s-2); text-transform:uppercase; letter-spacing:.04em; color:var(--teks-lembut); }
.hasil-kesimpulan { display:grid; gap:8px; font-size:var(--t-sm); }
.hasil-pasang { display:grid; grid-template-columns:150px 1fr; gap:var(--s-3); align-items:start; }
.hasil-pasang > span { color:var(--teks-lembut); font-size:var(--t-xs); text-transform:uppercase; letter-spacing:.04em; padding-top:2px; }
.hasil-pasang ul { margin:0; padding-left:18px; }
.hasil-lab { min-width:0; background:var(--putih); border:1px solid var(--garis); border-radius:var(--r-md); }
.hasil-nilai { font-weight:700; font-variant-numeric:tabular-nums; }
.hasil-nilai.tandai { color:#b91c1c; }
.hasil-rad {
  background:var(--putih); border:1px solid var(--garis); border-radius:var(--r-md);
  padding:var(--s-3); font-size:var(--t-sm); margin-bottom:var(--s-2);
}
@media (max-width:640px) { .hasil-pasang { grid-template-columns:1fr; gap:2px; } }
`
