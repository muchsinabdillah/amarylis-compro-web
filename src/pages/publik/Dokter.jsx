import { useMemo, useState } from 'react'
import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import { Galat, Gambar, KartuRangka, Kosong, Lencana, Tombol } from '../../components/ui/Dasar'
import './dokter.css'

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

/**
 * Halaman dokter dan jadwal praktik.
 *
 * Jadwal ditampilkan apa adanya dari SIMRS. Tidak ada jam yang dikarang dan
 * tidak ada baris yang "dirapikan" — jadwal praktik adalah janji kepada pasien
 * yang datang, dan yang keliru di sini berujung pada orang yang menunggu
 * dokter yang tidak ada.
 */
export default function Dokter() {
  const { data, memuat, galat, muatUlang } = useMuat((o) => publik.dokter(o), [])
  const [spesialis, setSpesialis] = useState('')

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

  return (
    <>
      <KepalaHalaman
        judul="Dokter & Jadwal Praktik"
        keterangan="Jadwal dapat berubah sewaktu-waktu. Untuk memastikan, hubungi klinik sebelum datang."
        remah={[{ label: 'Dokter' }]}
      />

      <section className="seksi">
        <div className="wadah">
          {daftarSpesialis.length > 1 && (
            <div className="baris" style={{ marginBottom: 'var(--s-5)', gap: 'var(--s-2)' }}>
              <button
                type="button"
                className={`btn btn--kecil ${spesialis ? 'btn--garis' : ''}`}
                onClick={() => setSpesialis('')}
              >
                Semua
              </button>
              {daftarSpesialis.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn--kecil ${spesialis === s ? '' : 'btn--garis'}`}
                  onClick={() => setSpesialis(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {memuat ? <KartuRangka jumlah={6} />
            : galat ? <Galat galat={galat} saatUlang={muatUlang} />
              : tampil.length ? (
                <div className="kisi kisi--3">
                  {tampil.map((d) => <KartuDokter key={d.id} dokter={d} />)}
                </div>
              ) : (
                <Kosong
                  judul="Belum ada dokter yang ditampilkan"
                  pesan="Daftar dokter sudah tersinkron dari SIMRS, tetapi belum ada yang ditandai tayang di CMS."
                />
              )}
        </div>
      </section>
    </>
  )
}

function KartuDokter({ dokter }) {
  // Jadwal dikelompokkan per hari agar terbaca sebagai jadwal, bukan sebagai
  // daftar panjang yang harus diurai sendiri oleh pembacanya.
  const perHari = useMemo(() => {
    const peta = new Map()
    ;(dokter.jadwal || []).forEach((j) => {
      if (!peta.has(j.hari)) peta.set(j.hari, [])
      peta.get(j.hari).push(j)
    })
    return HARI.filter((h) => peta.has(h)).map((h) => [h, peta.get(h)])
  }, [dokter.jadwal])

  return (
    <article className="kartu dokter">
      <Gambar src={dokter.foto} alt={dokter.nama} rasio="gambar-rasio--potret" keterangan="Foto dokter" />

      <div className="kartu__isi">
        <h2 className="kartu__judul" style={{ fontSize: 'var(--t-lg)' }}>{dokter.nama}</h2>

        <div className="baris" style={{ gap: 'var(--s-2)' }}>
          {dokter.spesialis && <Lencana>{dokter.spesialis}</Lencana>}
          {dokter.gelar && <span className="meta">{dokter.gelar}</span>}
        </div>

        {dokter.bio && (
          <div
            className="dokter__bio"
            dangerouslySetInnerHTML={{ __html: dokter.bio }}
          />
        )}

        {perHari.length > 0 ? (
          <div className="dokter__jadwal">
            <h3>Jadwal praktik</h3>
            <dl>
              {perHari.map(([hari, sesi]) => (
                <div key={hari} className="dokter__hari">
                  <dt>{hari}</dt>
                  <dd>
                    {sesi.map((s, i) => (
                      <div key={i}>
                        {s.jam_mulai && s.jam_selesai
                          ? `${s.jam_mulai}–${s.jam_selesai}`
                          : 'Jam menyesuaikan'}
                        {s.unit && <span className="dokter__unit"> · {s.unit}</span>}
                      </div>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="meta">Jadwal praktik belum tersedia. Silakan hubungi klinik.</p>
        )}

        <div style={{ marginTop: 'var(--s-4)' }}>
          <Tombol ke={`/pasien/reservasi/baru?dokter=${dokter.id}`} penuh>
            Reservasi dengan dokter ini
          </Tombol>
        </div>
      </div>
    </article>
  )
}
