import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { perusahaan } from '../../lib/api'
import { bacaBerkasPeserta, rapikanTanggal } from '../../lib/bacaTabel'
import { Tombol } from '../../components/ui/Dasar'
import { Teks, Pilihan, AreaTeks } from '../../components/ui/Isian'
import useSeo from '../../lib/seo'
import { CSS_MCU } from './mcuKit'

/**
 * Unggah daftar peserta MCU.
 *
 * Berkas dibaca di peramban lalu DITAMPILKAN untuk diperiksa sebelum dikirim.
 * Daftar ini berujung pada rekam medik dan tagihan; membiarkannya masuk tanpa
 * terlihat berarti kekeliruan baru ketahuan setelah pasien datang.
 */

const kosong = () => ({ baris: null, nama: '', nik: '', tgl_lahir: '', alamat: '', jenis_kelamin: '' })

/** Cacat yang membuat satu baris tidak bisa diproses klinik nanti. */
function periksa(p) {
  const c = []
  if (!String(p.nama || '').trim()) c.push('nama kosong')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.tgl_lahir || ''))) c.push('tanggal lahir belum benar')
  if (!['L', 'P'].includes(p.jenis_kelamin)) c.push('jenis kelamin belum diisi')
  const nik = String(p.nik || '').replace(/\D+/g, '')
  if (nik !== '' && nik.length !== 16) c.push('NIK bukan 16 digit')
  return c
}

export default function Unggah() {
  const navigasi = useNavigate()
  const berkasRef = useRef(null)

  const [paket, setPaket] = useState([])
  const [idPaket, setIdPaket] = useState('')
  const [tglMcu, setTglMcu] = useState('')
  const [catatan, setCatatan] = useState('')
  const [peserta, setPeserta] = useState([])
  const [namaBerkas, setNamaBerkas] = useState('')
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [kirim, setKirim] = useState(false)

  useSeo({ judul: 'Unggah Peserta MCU' })

  useEffect(() => {
    const ac = new AbortController()
    perusahaan.mcuPaket({ signal: ac.signal })
      .then((h) => setPaket(h.data || []))
      .catch((e) => { if (e.name !== 'AbortError') setGalat(e.message) })
    return () => ac.abort()
  }, [])

  const cacat = useMemo(() => peserta.map(periksa), [peserta])
  const jmlCacat = cacat.filter((c) => c.length > 0).length

  const minimalHariIni = new Date().toISOString().slice(0, 10)

  const pilihBerkas = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setGalat(null); setPesan(null)
    try {
      const h = await bacaBerkasPeserta(f)
      setPeserta(h.peserta)
      setNamaBerkas(f.name)
      setPesan(`${h.peserta.length} baris terbaca dari ${f.name}`
        + (h.lewat ? ` — ${h.lewat} baris tanpa nama dilewati.` : '.'))
    } catch (err) {
      setPeserta([])
      setNamaBerkas('')
      setGalat(err.message)
    } finally {
      e.target.value = ''       // berkas yang sama bisa dipilih lagi setelah diperbaiki
    }
  }

  const ubah = (i, k, v) => setPeserta((s) => s.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  const hapus = (i) => setPeserta((s) => s.filter((_, j) => j !== i))
  const tambah = () => setPeserta((s) => [...s, { ...kosong(), baris: s.length + 1 }])

  const simpan = async (e) => {
    e.preventDefault()
    setGalat(null); setPesan(null)

    if (!tglMcu) return setGalat('Tanggal MCU wajib diisi.')
    if (!idPaket) return setGalat('Paket MCU wajib dipilih.')
    if (peserta.length === 0) return setGalat('Belum ada peserta. Unggah berkas atau tambah baris.')
    if (jmlCacat > 0) {
      return setGalat(`${jmlCacat} baris masih perlu diperbaiki (ditandai merah di bawah). `
        + 'Perbaiki dulu supaya klinik tidak perlu mengembalikan berkasnya.')
    }

    setKirim(true)
    try {
      const h = await perusahaan.mcuUnggah({
        tgl_mcu: tglMcu, id_paket: Number(idPaket), catatan,
        peserta: peserta.map((p, i) => ({ ...p, baris: p.baris ?? i + 1 })),
      })
      navigasi(`/perusahaan/batch/${encodeURIComponent(h.data.no_batch)}`, { replace: true })
    } catch (err) {
      setGalat(err.status === 422
        ? Object.values(err.perKolom || {})[0] || err.message
        : err.message)
      setKirim(false)
    }
  }

  return (
    <>
      <style>{CSS_MCU + CSS}</style>

      <div className="mcu-kepala">
        <h1>Unggah Peserta MCU</h1>
        <p>
          Unggah daftar karyawan yang akan diperiksa. Klinik memverifikasinya lebih dulu —
          rekam medik dan pendaftaran dibuat setelah verifikasi itu, bukan saat unggahan diterima.
        </p>
      </div>

      <form onSubmit={simpan} className="tumpuk" style={{ gap: 'var(--s-4)' }}>
        {galat && <div className="mcu-galat" role="alert">{galat}</div>}
        {pesan && !galat && <div className="mcu-info">{pesan}</div>}

        <div className="mcu-kartu">
          <div className="unggah-grid">
            <Teks label="Tanggal MCU" type="date" required min={minimalHariIni}
              value={tglMcu} onChange={(e) => setTglMcu(e.target.value)}
              bantuan="Hari pelaksanaan pemeriksaan di klinik." />
            <Pilihan label="Paket MCU" required value={idPaket}
              onChange={(e) => setIdPaket(e.target.value)}
              kosong="— pilih paket —"
              opsi={paket.map((p) => ({ nilai: String(p.simrs_id), label: p.nama }))} />
          </div>
          <div style={{ marginTop: 'var(--s-3)' }}>
            <AreaTeks label="Catatan untuk klinik" baris={2} value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Mis. peserta datang bergelombang mulai pukul 08.00" />
          </div>
        </div>

        <div className="mcu-kartu">
          <div className="unggah-berkas">
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--t-sm)' }}>Daftar peserta</div>
              <div className="mcu-samar" style={{ fontSize: 'var(--t-xs)', marginTop: 2 }}>
                Berkas Excel (.xlsx) atau CSV dengan kolom:
                {' '}<b>Nama</b>, <b>NIK</b>, <b>Tgl Lahir</b>, <b>Alamat</b>, <b>Jenis Kelamin</b>.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
              <input ref={berkasRef} type="file" accept=".xlsx,.csv,.txt" onChange={pilihBerkas} hidden />
              <Tombol type="button" corak="garis" onClick={() => berkasRef.current?.click()}>
                {peserta.length ? 'Ganti berkas' : 'Pilih berkas'}
              </Tombol>
              <Tombol type="button" corak="garis" onClick={tambah}>Tambah baris</Tombol>
            </div>
          </div>

          {namaBerkas && (
            <div className="mcu-samar" style={{ fontSize: 'var(--t-xs)', marginTop: 8 }}>
              Sumber: {namaBerkas}
            </div>
          )}

          {peserta.length > 0 && (
            <>
              {jmlCacat > 0 && (
                <div className="mcu-hati" style={{ marginTop: 'var(--s-3)' }}>
                  {jmlCacat} baris perlu diperbaiki sebelum bisa dikirim. Perbaiki langsung di tabel di bawah.
                </div>
              )}

              <div className="mcu-tabel-bungkus" style={{ marginTop: 'var(--s-3)' }}>
                <table className="mcu-tabel unggah-tabel">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Nama</th><th>NIK</th><th>Tgl Lahir</th><th>L/P</th><th>Alamat</th>
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {peserta.map((p, i) => {
                      const c = cacat[i]
                      return (
                        <tr key={i} className={c.length ? 'cacat' : ''}>
                          <td className="mcu-samar">{p.baris ?? i + 1}</td>
                          <td><input value={p.nama} onChange={(e) => ubah(i, 'nama', e.target.value)}
                            aria-label={`Nama baris ${i + 1}`} /></td>
                          <td><input value={p.nik} inputMode="numeric" maxLength={16}
                            onChange={(e) => ubah(i, 'nik', e.target.value.replace(/\D+/g, ''))}
                            aria-label={`NIK baris ${i + 1}`} /></td>
                          <td><input type="date" value={p.tgl_lahir}
                            onChange={(e) => ubah(i, 'tgl_lahir', rapikanTanggal(e.target.value))}
                            aria-label={`Tanggal lahir baris ${i + 1}`} /></td>
                          <td>
                            <select value={p.jenis_kelamin} onChange={(e) => ubah(i, 'jenis_kelamin', e.target.value)}
                              aria-label={`Jenis kelamin baris ${i + 1}`}>
                              <option value="">—</option><option value="L">L</option><option value="P">P</option>
                            </select>
                          </td>
                          <td><input value={p.alamat} onChange={(e) => ubah(i, 'alamat', e.target.value)}
                            aria-label={`Alamat baris ${i + 1}`} /></td>
                          <td>
                            <button type="button" className="unggah-hapus" onClick={() => hapus(i)}
                              aria-label={`Hapus baris ${i + 1}`}>×</button>
                          </td>
                          {c.length > 0 && (
                            <td className="unggah-cacat" colSpan={7}>{c.join(', ')}</td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="unggah-kaki">
          <div className="mcu-samar" style={{ fontSize: 'var(--t-sm)' }}>
            {peserta.length} peserta siap dikirim
            {jmlCacat > 0 && <> · <span style={{ color: '#b91c1c' }}>{jmlCacat} perlu diperbaiki</span></>}
          </div>
          <Tombol type="submit" memuat={kirim} disabled={peserta.length === 0}>
            {kirim ? 'Mengirim…' : 'Kirim ke klinik'}
          </Tombol>
        </div>
      </form>
    </>
  )
}

const CSS = `
.unggah-grid { display:grid; grid-template-columns:1fr 1fr; gap:var(--s-3); }
.unggah-berkas { display:flex; justify-content:space-between; gap:var(--s-3); flex-wrap:wrap; align-items:flex-start; }
.unggah-tabel input, .unggah-tabel select {
  width:100%; min-width:80px; border:1px solid var(--garis); border-radius:var(--r-sm);
  padding:5px 7px; font:inherit; font-size:var(--t-sm); background:var(--putih); color:var(--teks);
}
.unggah-tabel input:focus, .unggah-tabel select:focus { outline:2px solid var(--hijau-700); outline-offset:-1px; }
.unggah-tabel td { padding:5px 7px; }
.unggah-tabel tr.cacat td { background:#fff6f6; }
.unggah-tabel tr.cacat input, .unggah-tabel tr.cacat select { border-color:#fca5a5; }
.unggah-cacat { font-size:var(--t-xs); color:#b91c1c; padding-top:0 !important; border-bottom:1px solid var(--garis); }
.unggah-hapus {
  border:0; background:transparent; color:var(--teks-samar); cursor:pointer;
  font-size:19px; line-height:1; width:26px; height:26px; border-radius:var(--r-sm);
}
.unggah-hapus:hover { background:#fee2e2; color:#b91c1c; }
.unggah-kaki { display:flex; justify-content:space-between; align-items:center; gap:var(--s-3); flex-wrap:wrap; }
@media (max-width:640px) { .unggah-grid { grid-template-columns:1fr; } }
`
