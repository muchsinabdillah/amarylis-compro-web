import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import KartuKonten from '../../components/publik/KartuKonten'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import Paginasi from '../../components/publik/Paginasi'
import { Galat, KartuRangka, Kosong } from '../../components/ui/Dasar'

/**
 * Satu halaman daftar untuk enam modul.
 *
 * Kategori, pencarian, dan nomor halaman disimpan di URL — bukan di state
 * komponen. Dengan begitu hasil saringan dapat dibagikan, di-bookmark, dan
 * tombol "kembali" peramban mengembalikan pengunjung ke tempat yang sama.
 */
export default function DaftarKonten({ modul, judul, keterangan, tipeKategori }) {
  const [param, setParam] = useSearchParams()

  const halaman  = Math.max(1, Number(param.get('halaman')) || 1)
  const kategori = param.get('kategori') || ''
  const cari     = param.get('cari') || ''

  const daftar = useMuat(
    (o) => publik.daftar(modul, { halaman, kategori, cari }, o),
    [modul, halaman, kategori, cari])

  const kategoriData = useMuat(
    (o) => (tipeKategori ? publik.kategori(tipeKategori, o) : Promise.resolve({ data: [] })),
    [tipeKategori])

  const ubahParam = useCallback((patch) => {
    const baru = new URLSearchParams(param)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) baru.delete(k)
      else baru.set(k, v)
    })
    // Setiap penyaringan mengembalikan ke halaman satu; tanpa ini pengunjung
    // bisa mendarat di halaman 5 yang kosong dan mengira tidak ada isinya.
    if (!('halaman' in patch)) baru.delete('halaman')
    setParam(baru)
  }, [param, setParam])

  useSeo({ judul, deskripsi: keterangan })

  const jumlahHalaman = daftar.meta?.jml_halaman || 0
  const total = daftar.meta?.total ?? 0

  const kategoriAktif = useMemo(
    () => kategoriData.data?.find((k) => k.slug === kategori),
    [kategoriData.data, kategori])

  return (
    <>
      <KepalaHalaman
        judul={judul}
        keterangan={keterangan}
        remah={[{ label: judul }]}
      />

      <section className="seksi">
        <div className="wadah">
          {/* -------------------------------------------------- saringan */}
          <div className="baris baris--antara" style={{ marginBottom: 'var(--s-5)' }}>
            {kategoriData.data?.length > 0 && (
              <div className="baris" style={{ gap: 'var(--s-2)' }}>
                <button
                  type="button"
                  className={`btn btn--kecil ${kategori ? 'btn--garis' : ''}`}
                  onClick={() => ubahParam({ kategori: '' })}
                >
                  Semua
                </button>
                {kategoriData.data.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className={`btn btn--kecil ${kategori === k.slug ? '' : 'btn--garis'}`}
                    onClick={() => ubahParam({ kategori: k.slug })}
                  >
                    {k.nama}
                  </button>
                ))}
              </div>
            )}

            <form
              role="search"
              className="baris"
              style={{ gap: 'var(--s-2)' }}
              onSubmit={(e) => {
                e.preventDefault()
                ubahParam({ cari: new FormData(e.currentTarget).get('cari') })
              }}
            >
              <input
                name="cari"
                type="search"
                defaultValue={cari}
                placeholder={`Cari di ${judul.toLowerCase()}…`}
                aria-label={`Cari di ${judul}`}
                style={{
                  padding: '0.5rem 0.8rem',
                  border: '1px solid var(--garis-tegas)',
                  borderRadius: 'var(--r-md)',
                  fontSize: 'var(--t-sm)',
                  minWidth: 220,
                }}
              />
              <button type="submit" className="btn btn--garis btn--kecil">Cari</button>
            </form>
          </div>

          {/* Keterangan hasil selalu ditampilkan saat ada saringan aktif,
              supaya daftar yang pendek terbaca sebagai hasil penyaringan —
              bukan sebagai halaman yang isinya hilang. */}
          {(cari || kategori) && !daftar.memuat && (
            <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)' }}>
              {total} hasil
              {kategoriAktif && <> pada kategori <strong>{kategoriAktif.nama}</strong></>}
              {cari && <> untuk pencarian <strong>“{cari}”</strong></>}
              {' · '}
              <button
                type="button"
                className="btn btn--polos btn--kecil"
                onClick={() => ubahParam({ cari: '', kategori: '' })}
              >
                Hapus saringan
              </button>
            </p>
          )}

          {/* ----------------------------------------------------- daftar */}
          {daftar.memuat ? <KartuRangka jumlah={6} />
            : daftar.galat ? <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />
              : daftar.data?.length ? (
                <>
                  <div className="kisi kisi--3">
                    {daftar.data.map((item) => (
                      <KartuKonten key={item.id} modul={modul} item={item} />
                    ))}
                  </div>
                  <Paginasi
                    halaman={halaman}
                    jumlahHalaman={jumlahHalaman}
                    saatPindah={(n) => ubahParam({ halaman: n })}
                  />
                </>
              ) : (
                <Kosong
                  judul={cari || kategori ? 'Tidak ada yang cocok' : 'Belum ada isinya'}
                  pesan={cari || kategori
                    ? 'Coba kata lain, atau hapus saringannya.'
                    : 'Isi halaman ini belum ditambahkan oleh pengelola klinik.'}
                />
              )}
        </div>
      </section>
    </>
  )
}
