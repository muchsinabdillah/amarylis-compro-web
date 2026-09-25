import { useEffect, useState } from 'react'
import { pasien } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { Lencana, Memuat, Galat, Kosong } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'

/*
 * Hasil MCU milik pasien sendiri.
 *
 * Dua hal yang menentukan bentuk halaman ini:
 *
 * 1. Hasil yang belum ditandatangani dokter TIDAK ditampilkan sebagai hasil.
 *    Ia ditandai "sedang diperiksa", dan kesimpulannya memang tidak dikirim
 *    server. Angka kelayakan kerja yang masih bisa berubah tidak boleh dibaca
 *    seseorang sebagai vonis tentang pekerjaannya.
 *
 * 2. Yang ditampilkan rekomendasi UNTUK PASIEN. Catatan yang ditulis dokter
 *    untuk perusahaan tidak ikut dikirim ke sini — itu tulisan untuk pembaca
 *    lain, dan memindahkannya mengubah artinya.
 */

const KELAYAKAN = {
  FIT:               { label: 'Layak bekerja',                 corak: 'sukses' },
  FIT_RESTRICTION:   { label: 'Layak dengan catatan',          corak: 'awas' },
  TEMPORARILY_UNFIT: { label: 'Belum layak untuk sementara',   corak: 'awas' },
  UNFIT:             { label: 'Tidak layak',                   corak: 'bahaya' },
  PENDING:           { label: 'Menunggu pemeriksaan',          corak: 'abu' },
}

const STATUS = {
  DRAFT:          'Baru dibuat',
  IN_PROGRESS:    'Sedang diperiksa',
  WAITING_RESULT: 'Menunggu hasil laboratorium',
  DOCTOR_REVIEW:  'Menunggu pembacaan dokter',
  COMPLETED:      'Selesai',
  CANCELLED:      'Dibatalkan',
}

const tgl = (t) => {
  if (!t) return '—'
  try {
    return new Date(String(t).slice(0, 10) + 'T00:00:00')
      .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return String(t) }
}

/** Satu angka vital dengan satuannya. Kosong ditulis "—", bukan disembunyikan:
 *  pembaca perlu tahu bedanya "tidak diperiksa" dan "hasilnya nol". */
function Angka({ label, nilai, satuan }) {
  return (
    <div style={{ minWidth: 92 }}>
      <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>
        {nilai == null || nilai === '' ? '—' : nilai}
        {nilai != null && nilai !== '' && satuan
          ? <span style={{ fontWeight: 400, fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}> {satuan}</span>
          : null}
      </div>
    </div>
  )
}

function Detail({ noMcu, saatTutup }) {
  const [d, setD] = useState(null)
  const [galat, setGalat] = useState(null)

  useEffect(() => {
    let batal = false
    setD(null); setGalat(null)
    pasien.mcuHasilDetail(noMcu)
      .then((r) => { if (!batal) setD(r) })
      .catch((e) => { if (!batal) setGalat(e) })
    return () => { batal = true }
  }, [noMcu])

  if (galat) return <Galat galat={galat} />
  if (!d) return <Memuat tinggi={120} />

  const b = d.berkas || {}
  const k = d.kesimpulan
  const v = d.vital

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-4)' }}>
      <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800 }}>{b.no_mcu}</div>
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)' }}>
            {tgl(b.tgl_mcu)} · {b.nama_paket || 'Pemeriksaan kesehatan'}
            {b.nama_perusahaan ? ` · ${b.nama_perusahaan}` : ''}
          </div>
        </div>
        <button type="button" onClick={saatTutup} className="tbl tbl--garis tbl--kecil">Tutup</button>
      </div>

      {!b.hasil_siap && (
        <div style={{ padding: 'var(--s-3)', borderRadius: 10, background: 'var(--awas-lembut, #fff7e6)',
                      fontSize: 'var(--t-sm)' }}>
          {d.catatan || 'Hasil belum tersedia.'}
        </div>
      )}

      {v && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Tanda vital</div>
          <div className="baris" style={{ gap: 'var(--s-4)', flexWrap: 'wrap' }}>
            <Angka label="Tekanan darah" nilai={v.sistol && v.diastol ? `${v.sistol}/${v.diastol}` : null} satuan="mmHg" />
            <Angka label="Nadi"   nilai={v.nadi} satuan="/mnt" />
            <Angka label="Suhu"   nilai={v.suhu} satuan="°C" />
            <Angka label="SpO₂"   nilai={v.spo2} satuan="%" />
            <Angka label="Berat"  nilai={v.bb} satuan="kg" />
            <Angka label="Tinggi" nilai={v.tb} satuan="cm" />
            <Angka label="IMT"    nilai={v.bmi} satuan={v.golongan_bmi || ''} />
          </div>
        </div>
      )}

      {k && (
        <div>
          <div className="baris" style={{ alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 700 }}>Kesimpulan dokter</span>
            {k.status_kelayakan && (
              <Lencana corak={(KELAYAKAN[k.status_kelayakan] || {}).corak || 'abu'}>
                {(KELAYAKAN[k.status_kelayakan] || {}).label || k.status_kelayakan}
              </Lencana>
            )}
          </div>
          {k.kesimpulan_klinis && <p style={{ fontSize: 'var(--t-sm)' }}>{k.kesimpulan_klinis}</p>}
          {k.rekomendasi && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--t-sm)' }}>Saran untuk Anda</div>
              <p style={{ fontSize: 'var(--t-sm)' }}>
                {typeof k.rekomendasi === 'string' ? k.rekomendasi : JSON.stringify(k.rekomendasi)}
              </p>
            </div>
          )}
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)', marginTop: 8 }}>
            Ditandatangani {k.dokter || 'dokter pemeriksa'}
            {k.berlaku_sampai ? ` · berlaku sampai ${tgl(k.berlaku_sampai)}` : ''}
          </div>
        </div>
      )}

      {d.penunjang && (d.penunjang.lab?.length > 0 || d.penunjang.rad?.length > 0) && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Pemeriksaan penunjang</div>
          {(d.penunjang.lab || []).length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="tabel" style={{ fontSize: 'var(--t-sm)' }}>
                <thead><tr><th>Pemeriksaan</th><th>Hasil</th><th>Rujukan</th></tr></thead>
                <tbody>
                  {d.penunjang.lab.map((x, i) => (
                    <tr key={i}>
                      <td>{x.NamaParameter || x.NamaTes}</td>
                      <td>{x.Hasil == null || x.Hasil === '' ? 'menunggu' : `${x.Hasil} ${x.Satuan || ''}`}</td>
                      <td style={{ color: 'var(--teks-lembut)' }}>{x.Rujukan || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}>
        Hasil ini bukan pengganti konsultasi. Bila ada yang ingin ditanyakan, hubungi klinik.
      </p>
    </div>
  )
}

export default function HasilMcu() {
  const daftar = useMuat((o) => pasien.mcuHasil(o), [])
  const tren = useMuat((o) => pasien.mcuTren(o), [])
  const [buka, setBuka] = useState(null)
  useSeo({ judul: 'Hasil MCU Saya' })

  const list = daftar.data || []
  const riwayat = (tren.data || []).filter((x) => x.Sistol || x.Bmi)

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-5)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--t-xl)' }}>Hasil MCU Saya</h1>
        <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 2 }}>
          Hasil pemeriksaan kesehatan Anda beserta riwayatnya.
        </p>
      </div>

      {/* Riwayat angka — hanya muncul bila memang ada lebih dari satu titik,
          karena satu titik bukan riwayat. */}
      {riwayat.length > 1 && (
        <div className="kartu" style={{ padding: 'var(--s-4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Perkembangan</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabel" style={{ fontSize: 'var(--t-sm)' }}>
              <thead><tr><th>Tanggal</th><th>Tekanan darah</th><th>IMT</th><th>Berat</th><th>Kelayakan</th></tr></thead>
              <tbody>
                {riwayat.map((x) => (
                  <tr key={x.NoMCU}>
                    <td>{tgl(x.TglMCU)}</td>
                    <td>{x.Sistol && x.Diastol ? `${x.Sistol}/${x.Diastol}` : '—'}</td>
                    <td>{x.Bmi ?? '—'}{x.GolonganBmi ? ` (${x.GolonganBmi})` : ''}</td>
                    <td>{x.Bb ? `${x.Bb} kg` : '—'}</td>
                    <td>{x.StatusKelayakan ? ((KELAYAKAN[x.StatusKelayakan] || {}).label || x.StatusKelayakan) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {daftar.memuat && <Memuat tinggi={80} jumlah={2} />}
      {daftar.galat && <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />}
      {!daftar.memuat && !daftar.galat && list.length === 0 && (
        <Kosong judul="Belum ada hasil MCU"
          pesan="Hasil pemeriksaan akan muncul di sini setelah dokter menandatanganinya." />
      )}

      {list.map((x) => (
        <div key={x.no_mcu} className="kartu" style={{ padding: 'var(--s-4)' }}>
          {buka === x.no_mcu
            ? <Detail noMcu={x.no_mcu} saatTutup={() => setBuka(null)} />
            : (
              <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{tgl(x.tgl_mcu)}</div>
                  <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)' }}>
                    {x.nama_paket || 'Pemeriksaan kesehatan'} · {x.no_mcu}
                    {x.nama_perusahaan ? ` · ${x.nama_perusahaan}` : ''}
                  </div>
                </div>
                <div className="baris" style={{ alignItems: 'center', gap: 8 }}>
                  {x.hasil_siap && x.kelayakan
                    ? <Lencana corak={(KELAYAKAN[x.kelayakan] || {}).corak || 'abu'}>
                        {(KELAYAKAN[x.kelayakan] || {}).label || x.kelayakan}
                      </Lencana>
                    : <Lencana corak="abu">{STATUS[x.status] || 'Sedang diproses'}</Lencana>}
                  <button type="button" className="tbl tbl--garis tbl--kecil"
                    onClick={() => setBuka(x.no_mcu)}>Lihat</button>
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  )
}
