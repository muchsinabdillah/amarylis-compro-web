import { useCallback, useEffect, useState } from 'react'
import { perusahaan } from '../../lib/api'
import { Memuat } from '../../components/ui/Dasar'

/**
 * Analisa kesehatan karyawan — grafik yang sama dengan Dashboard MCU
 * Perusahaan di SIMRS klinik.
 *
 * Semua angka GABUNGAN, tanpa nama, dan dihitung terhadap jumlah karyawan
 * yang diperiksa ("12% karyawan hipertensi" bisa ditindaklanjuti). Hanya
 * peserta yang masuk lewat unggahan perusahaan ini yang dihitung — SIMRS
 * yang menegakkan cakupannya, bukan halaman ini.
 *
 * Kelompok abu-abu ("belum diukur", "belum diperiksa") sengaja ikut tampil:
 * menyembunyikannya membuat karyawan tampak lebih sehat daripada yang
 * sebenarnya diketahui. Grafik digambar sendiri (SVG/CSS) supaya portal tidak
 * membawa pustaka grafik hanya untuk satu halaman.
 */

// warna menurut ARTI: hijau baik, kuning waspada, merah perlu tindakan, abu-abu data belum ada
const W = { baik: '#16a34a', waspada: '#f59e0b', buruk: '#dc2626', berat: '#991b1b', netral: '#3b82f6', kosong: '#94a3b8' }
const warna = (label) => {
  const s = String(label || '').toLowerCase()
  if (/belum|tidak diketahui|tanpa/.test(s)) return W.kosong
  if (/^normal|^fit$|fit to work$|tidak merokok|^baik|^layak$/.test(s)) return W.baik
  if (/grade 2|obes|unfit|very high|^tinggi|tidak layak/.test(s)) return W.berat
  if (/hipertensi|abnormal|tidak normal|^merokok|risk|high|overweight/.test(s)) return W.buruk
  if (/pra|border|restriction|catatan|note|underweight|ex.?smoker|pending|terbatas/.test(s)) return W.waspada
  return W.netral
}
const persen = (n, total) => (total ? Math.round((Number(n) / total) * 1000) / 10 : 0)
const hariIni = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export default function AnalisaKesehatan() {
  const [f, setF] = useState({ dari: hariIni().slice(0, 4) + '-01-01', sampai: hariIni() })
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)

  const muat = useCallback((saring, signal) => {
    setD(null); setGalat(null)
    perusahaan.mcuDashboard(saring, { signal })
      .then((r) => setD(r.data || {}))
      .catch((e) => { if (e.name !== 'AbortError') { setGalat(e.message); setD(false) } })
  }, [])

  useEffect(() => {
    const ac = new AbortController()
    muat(f, ac.signal)
    return () => ac.abort()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const total = Number(d?.total) || 0
  const lbl = d?.kelayakanLabel || {}
  const seri = (rows, kunci, nama = (x) => x[kunci]) => (rows || []).map((x) => ({ nama: nama(x) || '—', n: Number(x.n) || 0 }))

  return (
    <section className="ak" aria-labelledby="ak-judul">
      <style>{CSS}</style>
      <div className="ak-kepala">
        <div>
          <h2 id="ak-judul">Analisa kesehatan karyawan</h2>
          <p className="mcu-samar">Angka gabungan dari hasil MCU — tanpa nama. Persentase dihitung terhadap jumlah karyawan yang diperiksa.</p>
        </div>
        <form className="mcu-baris" onSubmit={(e) => { e.preventDefault(); muat(f) }}>
          <label className="ak-isian">Dari
            <input type="date" value={f.dari} max={f.sampai} onChange={(e) => setF({ ...f, dari: e.target.value })} /></label>
          <label className="ak-isian">Sampai
            <input type="date" value={f.sampai} min={f.dari} onChange={(e) => setF({ ...f, sampai: e.target.value })} /></label>
          <button type="submit" className="ak-tombol">Tampilkan</button>
        </form>
      </div>

      {galat && <div className="mcu-galat" role="alert">{galat}</div>}
      {d === null ? <Memuat tinggi={240} /> : d === false ? null : total === 0 ? (
        <div className="mcu-kartu mcu-kosong">Belum ada hasil MCU karyawan pada periode ini.</div>
      ) : (
        <>
          <div className="mcu-angka-baris ak-angka">
            <div className="mcu-angka"><div className="mcu-angka__n">{total}</div><div className="mcu-angka__l">Karyawan diperiksa</div></div>
            <div className="mcu-angka"><div className="mcu-angka__n">{d.kelamin?.pria ?? 0}</div><div className="mcu-angka__l">Laki-laki</div></div>
            <div className="mcu-angka"><div className="mcu-angka__n">{d.kelamin?.wanita ?? 0}</div><div className="mcu-angka__l">Perempuan</div></div>
          </div>

          <div className="ak-grid">
            <Donat judul="Kelayakan kerja" total={total} data={seri(d.kelayakan, 'kode', (x) => lbl[x.kode] || x.kode || 'Belum disimpulkan')} />
            <Donat judul="Indeks massa tubuh" total={total} data={seri(d.bmi, 'golongan')} />
            <Donat judul="Tekanan darah" total={total} data={seri(d.tekananDarah, 'golongan')} />
            <Donat judul="Kelompok usia" total={total} data={seri(d.usia, 'kelompok')} />
            <Donat judul="Kebiasaan merokok" total={total} data={seri(d.rokok, 'status')} />
            <Donat judul="EKG" total={total} data={seri(d.ekg, 'status')} />
          </div>

          <div className="ak-dua">
            <Batang judul="10 temuan terbanyak" total={total} kosong="Belum ada temuan tercatat."
              rows={(d.temuan || []).map((x) => ({ nama: `${x.KodeIcd} · ${x.Nama || ''}`, n: Number(x.Jumlah) || 0, warna: 'var(--hijau-600, #15803d)' }))} />
            <Batang judul="Temuan radiologi (thorax)" total={total} kosong="Belum ada temuan pada ekspertise yang sudah final."
              rows={(d.thorax || []).map((x) => ({ nama: x.nama, n: Number(x.n) || 0, warna: warna(x.nama) }))} />
          </div>

          <div className="ak-dua">
            <section className="mcu-kartu ak-kartu">
              <h3>Pemeriksaan khusus</h3>
              {!(d.khusus || []).length ? <p className="mcu-samar ak-kecil">Belum ada pemeriksaan khusus tercatat.</p> : (
                <div className="mcu-tabel-bungkus ak-tabel"><table className="mcu-tabel">
                  <thead><tr><th>Pemeriksaan</th><th className="ak-kanan">Normal</th><th className="ak-kanan">Tidak normal</th></tr></thead>
                  <tbody>{d.khusus.map((x) => (
                    <tr key={x.nama}><td>{x.nama}</td>
                      <td className="ak-kanan" style={{ color: W.baik, fontWeight: 700 }}>{x.normal}</td>
                      <td className="ak-kanan" style={{ color: Number(x.abnormal) ? W.buruk : undefined, fontWeight: 700 }}>{x.abnormal}</td></tr>
                  ))}</tbody>
                </table></div>
              )}
              {(d.khususDerajat || []).length > 0 && (
                <div className="mcu-tabel-bungkus ak-tabel"><table className="mcu-tabel">
                  <thead><tr><th>Pemeriksaan</th><th>Interpretasi</th><th className="ak-kanan">Karyawan</th><th className="ak-kanan">%</th></tr></thead>
                  <tbody>{d.khususDerajat.map((x, i) => (
                    <tr key={i}><td>{x.pemeriksaan}</td><td style={{ color: warna(x.interpretasi) }}>{x.interpretasi}</td>
                      <td className="ak-kanan"><b>{x.n}</b></td><td className="ak-kanan mcu-samar">{x.persen}%</td></tr>
                  ))}</tbody>
                </table></div>
              )}
            </section>

            <section className="mcu-kartu ak-kartu">
              <h3>Laboratorium</h3>
              {!(d.lab || []).length ? <p className="mcu-samar ak-kecil">Belum ada hasil laboratorium yang sudah divalidasi dokter.</p> : (
                <div className="mcu-tabel-bungkus ak-tabel"><table className="mcu-tabel">
                  <thead><tr><th>Kelompok</th><th className="ak-kanan">Normal</th><th className="ak-kanan">Borderline</th>
                    <th className="ak-kanan">Tinggi</th><th className="ak-kanan">Sgt. tinggi</th><th className="ak-kanan">Rendah</th></tr></thead>
                  <tbody>{d.lab.map((x) => (
                    <tr key={x.kelompok}><td>{x.kelompok}</td>
                      {[[x.normal, W.baik], [x.borderline, W.waspada], [x.tinggi, W.buruk], [x.sangatTinggi, W.berat], [x.rendah, W.netral]].map(([v, c], i) => (
                        <td key={i} className="ak-kanan" style={{ color: Number(v) ? c : undefined, fontWeight: 700 }}>{v}</td>))}
                    </tr>
                  ))}</tbody>
                </table></div>
              )}
              <p className="mcu-samar ak-kecil">Jumlah hasil pemeriksaan, hanya yang sudah divalidasi dokter laboratorium.</p>
            </section>
          </div>

          <p className="mcu-samar ak-kecil">
            Periode {d.periode?.dari} s/d {d.periode?.sampai}. Kelompok abu-abu (“belum diukur”, “belum diperiksa”) memang ditampilkan agar
            lubang data terlihat. Rincian per karyawan tersedia di halaman Hasil.
          </p>
        </>
      )}
    </section>
  )
}

/* Donat SVG + daftar angkanya — tanpa daftar, donat hanya bisa dibaca kira-kira. */
function Donat({ judul, data, total }) {
  const isi = data.filter((x) => x.n > 0)
  const jumlah = isi.reduce((a, x) => a + x.n, 0)
  const R = 42, K = 2 * Math.PI * R
  let jalan = 0
  return (
    <section className="mcu-kartu ak-kartu">
      <h3>{judul}</h3>
      {!isi.length ? <p className="mcu-samar ak-kecil">Belum ada data.</p> : (
        <div className="ak-donat">
          <svg viewBox="0 0 120 120" width="96" height="96" role="img"
            aria-label={`${judul}: ` + isi.map((x) => `${x.nama} ${x.n}`).join(', ')}>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--hijau-50)" strokeWidth="15" />
            {isi.map((x, i) => {
              const p = x.n / jumlah
              const el = (
                <circle key={i} cx="60" cy="60" r={R} fill="none" stroke={warna(x.nama)} strokeWidth="15"
                  strokeDasharray={`${Math.max(p * K - 1.5, 0.5)} ${K}`} strokeDashoffset={-jalan * K} transform="rotate(-90 60 60)">
                  <title>{`${x.nama}: ${x.n} karyawan`}</title>
                </circle>
              )
              jalan += p
              return el
            })}
            <text x="60" y="58" textAnchor="middle" className="ak-donat__n">{jumlah}</text>
            <text x="60" y="73" textAnchor="middle" className="ak-donat__l">karyawan</text>
          </svg>
          <ul className="ak-kunci">
            {isi.map((x) => (
              <li key={x.nama}>
                <span className="ak-titik" style={{ background: warna(x.nama) }} />
                <span className="ak-kunci__nama">{x.nama}</span>
                <b>{x.n}</b>
                <span className="mcu-samar ak-kunci__p">{persen(x.n, total)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Batang({ judul, rows, total, kosong }) {
  const maks = Math.max(1, ...rows.map((r) => r.n))
  return (
    <section className="mcu-kartu ak-kartu">
      <h3>{judul}</h3>
      {!rows.length ? <p className="mcu-samar ak-kecil">{kosong}</p> : (
        <ul className="ak-batang">
          {rows.map((r) => (
            <li key={r.nama}>
              <span className="ak-batang__nama" title={r.nama}>{r.nama}</span>
              <span className="ak-batang__jalur"><span style={{ width: `${(r.n / maks) * 100}%`, background: r.warna }} /></span>
              <b>{r.n}</b>
              <span className="mcu-samar ak-kunci__p">{persen(r.n, total)}%</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const CSS = `
.ak { margin-top:var(--s-5); }
.ak-kepala { display:flex; justify-content:space-between; align-items:flex-end; gap:var(--s-3); flex-wrap:wrap; margin-bottom:var(--s-3); }
.ak-kepala h2 { font-size:var(--t-md, 1.1rem); margin:0; }
.ak-kepala p { font-size:var(--t-sm); margin:4px 0 0; max-width:62ch; }
.ak-isian { display:grid; gap:3px; font-size:var(--t-xs); color:var(--teks-lembut); font-weight:600; }
.ak-isian input { font:inherit; font-size:var(--t-sm); padding:7px 9px; border:1px solid var(--garis); border-radius:var(--r-md); background:var(--putih); color:inherit; }
.ak-tombol { font:inherit; font-size:var(--t-sm); font-weight:700; padding:8px 14px; border-radius:var(--r-md); border:0; background:var(--hijau-600, #15803d); color:#fff; cursor:pointer; }
.ak-tombol:focus-visible, .ak-isian input:focus-visible { outline:2px solid var(--hijau-600, #15803d); outline-offset:2px; }
.ak-angka { margin-bottom:var(--s-3); }
.ak-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:var(--s-3); }
.ak-dua { display:grid; grid-template-columns:1fr 1fr; gap:var(--s-3); margin-top:var(--s-3); }
.ak-kartu h3 { font-size:var(--t-xs); text-transform:uppercase; letter-spacing:.04em; color:var(--teks-lembut); margin:0 0 var(--s-3); }
.ak-kecil { font-size:var(--t-xs); margin:var(--s-2, 8px) 0 0; }
.ak-donat { display:flex; gap:var(--s-2, 8px); align-items:center; }
.ak-donat svg { flex-shrink:0; }
.ak-donat__n { font-size:22px; font-weight:800; fill:currentColor; }
.ak-donat__l { font-size:10px; fill:var(--teks-lembut); }
.ak-kunci { list-style:none; margin:0; padding:0; display:grid; gap:5px; font-size:var(--t-sm); flex:1; min-width:0; }
.ak-kunci li { display:flex; align-items:center; gap:7px; }
.ak-kunci__nama { flex:1; min-width:0; overflow-wrap:break-word; }
.ak-kunci li b { font-variant-numeric:tabular-nums; }
.ak-kunci__p { width:40px; text-align:right; font-variant-numeric:tabular-nums; flex-shrink:0; }
.ak-titik { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
.ak-batang { list-style:none; margin:0; padding:0; display:grid; gap:7px; font-size:var(--t-sm); }
.ak-batang li { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(60px,1fr) auto 44px; gap:8px; align-items:center; }
.ak-batang__nama { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ak-batang__jalur { height:10px; background:var(--hijau-50); border-radius:999px; overflow:hidden; }
.ak-batang__jalur span { display:block; height:100%; border-radius:999px; min-width:3px; }
.ak-batang li b { font-variant-numeric:tabular-nums; }
.ak-tabel { margin-top:var(--s-2, 8px); }
.ak-tabel .mcu-tabel { min-width:0; }
.ak-kanan { text-align:right !important; font-variant-numeric:tabular-nums; }
@media (max-width:820px) { .ak-dua { grid-template-columns:1fr; } }
@media (max-width:420px) { .ak-donat { flex-direction:column; align-items:stretch; } .ak-donat svg { align-self:center; } }
`
