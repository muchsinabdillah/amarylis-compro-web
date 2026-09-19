import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import { usePasien } from '../../context/PasienAuthContext'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import ModalAuth from '../../components/publik/ModalAuth'
import { Galat, Gambar, KartuRangka, Kosong, Lencana, Tombol } from '../../components/ui/Dasar'
import './dokter.css'

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

/** Kelompokkan jadwal per hari, urut sesuai urutan hari. */
function kelompokJadwal(jadwal) {
  const peta = new Map()
  ;(jadwal || []).forEach((j) => {
    if (!peta.has(j.hari)) peta.set(j.hari, [])
    peta.get(j.hari).push(j)
  })
  return HARI.filter((h) => peta.has(h)).map((h) => [h, peta.get(h)])
}

/**
 * Halaman dokter dan jadwal praktik.
 *
 * Alur temu janji dimulai di sini: lihat dokter → detail → Reservasi. Bila
 * belum masuk, modal masuk/daftar muncul DI TEMPAT lalu langsung melanjutkan
 * ke formulir reservasi dokter yang tadi dipilih — pengunjung tidak dilempar
 * ke halaman lain dan tidak perlu mengulang kliknya.
 */
export default function Dokter() {
  const { data, memuat, galat, muatUlang } = useMuat((o) => publik.dokter(o), [])
  const [spesialis, setSpesialis] = useState('')
  const [detail, setDetail] = useState(null)      // dokter yang dibuka detailnya
  const [tunda, setTunda] = useState(null)        // dokter yang menunggu login
  const { profil } = usePasien()
  const navigasi = useNavigate()

  useSeo({
    judul: 'Dokter & Jadwal Praktik',
    deskripsi: 'Daftar dokter dan jadwal praktik di Klinik Pratama Andini.',
  })

  const daftarSpesialis = useMemo(() => {
    const set = new Set((data || []).map((d) => d.spesialis).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  const tampil = useMemo(
    () => (data || []).filter((d) => !spesialis || d.spesialis === spesialis),
    [data, spesialis])

  const keReservasi = (dokter) => navigasi(`/pasien/reservasi/baru?dokter=${dokter.id}`)

  /** Sudah masuk → langsung ke formulir. Belum → modal masuk, lalu lanjut. */
  const mulaiReservasi = (dokter) => {
    setDetail(null)
    if (profil) keReservasi(dokter)
    else setTunda(dokter)
  }

  return (
    <>
      <KepalaHalaman
        judul="Dokter & Jadwal Praktik"
        keterangan="Pilih dokter, lihat detail dan jadwalnya, lalu buat reservasi. Jadwal dapat berubah sewaktu-waktu."
        remah={[{ label: 'Dokter' }]}
      />

      <section className="seksi">
        <div className="wadah">
          {daftarSpesialis.length > 1 && (
            <div className="baris" style={{ marginBottom: 'var(--s-5)', gap: 'var(--s-2)' }}>
              <button type="button" className={`btn btn--kecil ${spesialis ? 'btn--garis' : ''}`}
                onClick={() => setSpesialis('')}>Semua</button>
              {daftarSpesialis.map((s) => (
                <button key={s} type="button" className={`btn btn--kecil ${spesialis === s ? '' : 'btn--garis'}`}
                  onClick={() => setSpesialis(s)}>{s}</button>
              ))}
            </div>
          )}

          {memuat ? <KartuRangka jumlah={6} />
            : galat ? <Galat galat={galat} saatUlang={muatUlang} />
              : tampil.length ? (
                <div className="kisi kisi--3">
                  {tampil.map((d) => (
                    <KartuDokter
                      key={d.id}
                      dokter={d}
                      saatDetail={() => setDetail(d)}
                      saatReservasi={() => mulaiReservasi(d)}
                    />
                  ))}
                </div>
              ) : (
                <Kosong
                  judul="Belum ada dokter yang ditampilkan"
                  pesan="Daftar dokter sudah tersinkron dari SIMRS, tetapi belum ada yang ditandai tayang di CMS."
                />
              )}
        </div>
      </section>

      <ModalDetailDokter
        dokter={detail}
        saatTutup={() => setDetail(null)}
        saatReservasi={() => detail && mulaiReservasi(detail)}
      />

      <ModalAuth
        terbuka={!!tunda}
        saatTutup={() => setTunda(null)}
        judul="Masuk untuk reservasi"
        keterangan={tunda ? `Anda akan membuat reservasi dengan ${tunda.nama}.` : undefined}
        saatSukses={() => { const d = tunda; setTunda(null); if (d) keReservasi(d) }}
      />
    </>
  )
}

/* ------------------------------------------------------------ kartu ringkas */
function KartuDokter({ dokter, saatDetail, saatReservasi }) {
  const perHari = useMemo(() => kelompokJadwal(dokter.jadwal), [dokter.jadwal])
  const hariPraktik = perHari.map(([h]) => h)

  return (
    <article className="kartu dokter kartu--tautan">
      <button type="button" onClick={saatDetail}
        style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer', display: 'block', width: '100%' }}
        aria-label={`Lihat detail ${dokter.nama}`}>
        <Gambar src={dokter.foto} alt={dokter.nama} rasio="gambar-rasio--potret" keterangan="Foto dokter" />
      </button>

      <div className="kartu__isi">
        <h2 className="kartu__judul" style={{ fontSize: 'var(--t-lg)' }}>{dokter.nama}</h2>

        <div className="baris" style={{ gap: 'var(--s-2)' }}>
          {dokter.spesialis && <Lencana>{dokter.spesialis}</Lencana>}
          {dokter.gelar && <span className="meta">{dokter.gelar}</span>}
        </div>

        {hariPraktik.length > 0 ? (
          <p className="meta" style={{ marginTop: 'var(--s-2)' }}>
            Praktik: {hariPraktik.join(', ')}
          </p>
        ) : (
          <p className="meta" style={{ marginTop: 'var(--s-2)' }}>Jadwal belum tersedia.</p>
        )}

        <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-4)', flexWrap: 'nowrap' }}>
          <Tombol corak="garis" ukuran="kecil" onClick={saatDetail} style={{ flex: 1 }}>Lihat detail</Tombol>
          <Tombol ukuran="kecil" onClick={saatReservasi} style={{ flex: 1 }}>Reservasi</Tombol>
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------ modal detail */
function ModalDetailDokter({ dokter, saatTutup, saatReservasi }) {
  useEffect(() => {
    if (!dokter) return undefined
    const esc = (e) => { if (e.key === 'Escape') saatTutup() }
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [dokter, saatTutup])

  const perHari = useMemo(() => kelompokJadwal(dokter?.jadwal), [dokter])
  if (!dokter) return null

  return (
    <div onClick={saatTutup} role="dialog" aria-modal="true" aria-label={`Detail ${dokter.nama}`}
      style={{ position: 'fixed', inset: 0, background: 'rgba(16,18,15,0.55)', zIndex: 85,
        display: 'grid', placeItems: 'center', padding: 'var(--s-4)', overflowY: 'auto' }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--putih)', borderRadius: 'var(--r-lg)', width: '100%', maxWidth: 620,
          boxShadow: 'var(--bayang-3)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ overflowY: 'auto', padding: 'var(--s-5)' }}>
          <div className="baris" style={{ gap: 'var(--s-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 120, flexShrink: 0 }}>
              <Gambar src={dokter.foto} alt={dokter.nama} rasio="gambar-rasio--potret" keterangan="Foto" />
            </div>
            <div style={{ flex: '1 1 240px', minWidth: 0 }}>
              <h2 style={{ fontSize: 'var(--t-xl)' }}>{dokter.nama}</h2>
              <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-2)' }}>
                {dokter.spesialis && <Lencana>{dokter.spesialis}</Lencana>}
                {dokter.gelar && <span className="meta">{dokter.gelar}</span>}
              </div>
              {dokter.bio && (
                <div className="dokter__bio" style={{ marginTop: 'var(--s-3)' }}
                  dangerouslySetInnerHTML={{ __html: dokter.bio }} />
              )}
            </div>
          </div>

          {perHari.length > 0 && (
            <div className="dokter__jadwal" style={{ marginTop: 'var(--s-5)' }}>
              <h3>Jadwal praktik</h3>
              <dl>
                {perHari.map(([hari, sesi]) => (
                  <div key={hari} className="dokter__hari">
                    <dt>{hari}</dt>
                    <dd>
                      {sesi.map((s, i) => (
                        <div key={i}>
                          {s.jam_mulai && s.jam_selesai ? `${s.jam_mulai}–${s.jam_selesai}` : 'Jam menyesuaikan'}
                          {s.unit && <span className="dokter__unit"> · {s.unit}</span>}
                        </div>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {dokter.pendidikan && (
            <div style={{ marginTop: 'var(--s-5)' }}>
              <h3 style={{ fontSize: 'var(--t-base)' }}>Pendidikan</h3>
              <div className="dokter__bio" dangerouslySetInnerHTML={{ __html: dokter.pendidikan }} />
            </div>
          )}
          {dokter.pengalaman && (
            <div style={{ marginTop: 'var(--s-4)' }}>
              <h3 style={{ fontSize: 'var(--t-base)' }}>Pengalaman</h3>
              <div className="dokter__bio" dangerouslySetInnerHTML={{ __html: dokter.pengalaman }} />
            </div>
          )}
        </div>

        <div className="baris" style={{ gap: 'var(--s-2)', padding: 'var(--s-4) var(--s-5)',
          borderTop: '1px solid var(--garis)', justifyContent: 'flex-end', background: 'var(--hijau-50)' }}>
          <Tombol corak="garis" onClick={saatTutup}>Tutup</Tombol>
          <Tombol onClick={saatReservasi}>Reservasi dengan dokter ini</Tombol>
        </div>
      </div>
    </div>
  )
}
