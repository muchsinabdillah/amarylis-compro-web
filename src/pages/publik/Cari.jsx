import { useSearchParams } from 'react-router-dom'
import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import KartuKonten, { LABEL_MODUL } from '../../components/publik/KartuKonten'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import { Galat, KartuRangka, Kosong } from '../../components/ui/Dasar'

/**
 * Hasil pencarian, dikelompokkan per jenis.
 *
 * Mencampurnya menjadi satu daftar membuat orang yang mencari "MCU" menemukan
 * artikel yang kebetulan menyebut MCU di atas paket MCU-nya sendiri.
 */
export default function Cari() {
  const [param, setParam] = useSearchParams()
  const q = param.get('q') || ''

  const { data, memuat, galat, muatUlang } = useMuat(
    (o) => (q.length >= 2 ? publik.cari(q, o) : Promise.resolve({ data: {} })),
    [q])

  useSeo({ judul: q ? `Pencarian: ${q}` : 'Pencarian' })

  const kelompok = Object.entries(data || {})
  const total = kelompok.reduce((n, [, v]) => n + (v.total || 0), 0)

  return (
    <>
      <KepalaHalaman
        judul="Pencarian"
        keterangan={q ? `Hasil untuk "${q}"` : 'Ketik kata kunci untuk mencari di seluruh situs.'}
        remah={[{ label: 'Pencarian' }]}
        anak={
          <form
            role="search"
            className="baris"
            style={{ marginTop: 'var(--s-4)', gap: 'var(--s-2)' }}
            onSubmit={(e) => {
              e.preventDefault()
              const nilai = String(new FormData(e.currentTarget).get('q') || '').trim()
              if (nilai.length >= 2) setParam({ q: nilai })
            }}
          >
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari layanan, paket MCU, artikel…"
              aria-label="Kata pencarian"
              style={{
                flex: '1 1 320px',
                padding: '0.7rem 0.9rem',
                border: '1px solid var(--garis-tegas)',
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--t-base)',
              }}
            />
            <button type="submit" className="btn">Cari</button>
          </form>
        }
      />

      <section className="seksi">
        <div className="wadah" style={{ display: 'grid', gap: 'var(--s-7)' }}>
          {!q || q.length < 2 ? (
            <Kosong judul="Ketik minimal 2 huruf" pesan="Masukkan kata kunci pada kotak di atas." />
          ) : memuat ? <KartuRangka jumlah={3} />
            : galat ? <Galat galat={galat} saatUlang={muatUlang} />
              : total === 0 ? (
                <Kosong
                  judul={`Tidak ada hasil untuk "${q}"`}
                  pesan={'Coba kata yang lebih umum, misalnya "MCU", "laboratorium", atau "homecare".'}
                />
              ) : (
                kelompok.map(([modul, isi]) => (
                  <div key={modul}>
                    <div className="baris baris--antara" style={{ marginBottom: 'var(--s-4)' }}>
                      <h2>{LABEL_MODUL[modul] || modul}</h2>
                      <span className="meta">{isi.total} hasil</span>
                    </div>
                    <div className="kisi kisi--3">
                      {isi.baris.map((item) => (
                        <KartuKonten key={item.id} modul={modul} item={item} />
                      ))}
                    </div>
                  </div>
                ))
              )}
        </div>
      </section>
    </>
  )
}
