import { Link, useParams } from 'react-router-dom'
import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import BagikanSosial from '../../components/publik/BagikanSosial'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import { JALUR_MODUL, LABEL_MODUL } from '../../components/publik/KartuKonten'
import { Galat, Gambar, Lencana, Memuat, Tombol } from '../../components/ui/Dasar'
import { hargaTampil, tanggal } from '../../lib/format'
import './detail.css'

/**
 * Halaman detail untuk enam modul.
 *
 * HTML dari CMS dipasang dengan dangerouslySetInnerHTML. Itu aman DI SINI
 * karena isinya sudah dibersihkan di server dengan daftar putih tag dan
 * atribut sebelum tersimpan — bukan karena dipercaya begitu saja. Membersihkan
 * di peramban saja tidak cukup: yang tersimpan kotor akan ikut terkirim ke mana
 * pun isi itu dipakai kelak, termasuk ke tempat yang tidak membersihkannya.
 */
export default function DetailKonten({ modul, indukJudul, indukKe }) {
  const { slug } = useParams()
  const { data, memuat, galat, muatUlang } = useMuat(
    (o) => publik.detail(modul, slug, o), [modul, slug])

  useSeo({
    judul: data?.seo?.title || data?.judul,
    deskripsi: data?.seo?.description || data?.ringkas,
    gambar: data?.seo?.og_image || data?.thumbnail,
    tipe: ['articles', 'news'].includes(modul) ? 'article' : 'website',
  })

  if (memuat) {
    return (
      <div className="wadah seksi">
        <Memuat tinggi={40} jumlah={1} />
        <div style={{ marginTop: 'var(--s-5)' }}><Memuat tinggi={320} /></div>
      </div>
    )
  }

  if (galat) {
    return (
      <div className="wadah seksi">
        {galat.status === 404 ? (
          <div className="kosong">
            <h3>Halaman tidak ditemukan</h3>
            <p>Isi yang Anda cari mungkin sudah dipindahkan atau tidak lagi ditayangkan.</p>
            <Tombol ke={indukKe}>Kembali ke {indukJudul}</Tombol>
          </div>
        ) : <Galat galat={galat} saatUlang={muatUlang} />}
      </div>
    )
  }

  if (!data) return null

  const katalog = ['services', 'mcu', 'homecare'].includes(modul)

  return (
    <>
      <KepalaHalaman
        judul={data.judul}
        remah={[{ label: indukJudul, ke: indukKe }, { label: data.judul }]}
        anak={
          <div className="baris" style={{ marginTop: 'var(--s-4)', gap: 'var(--s-3)' }}>
            {data.kategori && <Lencana>{data.kategori}</Lencana>}
            {data.terbit && <span className="meta">{tanggal(data.terbit)}</span>}
            {data.reading_minutes ? <span className="meta">{data.reading_minutes} menit baca</span> : null}
            {data.lokasi && <span className="meta">📍 {data.lokasi}</span>}
            {data.event_date && <span className="meta">🗓 {tanggal(data.event_date)}</span>}
          </div>
        }
      />

      <section className="seksi">
        <div className="wadah" style={{ display: 'grid', gap: 'var(--s-7)' }}>
          <div className="detail__kisi">
            <article>
              {data.thumbnail && (
                <div style={{ marginBottom: 'var(--s-6)' }}>
                  <Gambar src={data.thumbnail} alt={data.judul} />
                </div>
              )}

              {/* Video ditayangkan di tempat isinya, bukan di bawah teks. */}
              {modul === 'videos' && data.embed_url && (
                <div style={{ marginBottom: 'var(--s-6)' }}>
                  <iframe
                    src={data.embed_url}
                    title={data.judul}
                    style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 'var(--r-lg)' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}

              {data.konten
                ? <div className="prosa" dangerouslySetInnerHTML={{ __html: data.konten }} />
                : <p style={{ color: 'var(--teks-samar)' }}>Keterangan lengkap belum ditambahkan.</p>}

              {data.persiapan && (
                <div className="detail__persiapan">
                  <h2>Persiapan sebelum pemeriksaan</h2>
                  <div className="prosa" dangerouslySetInnerHTML={{ __html: data.persiapan }} />
                </div>
              )}

              {data.manfaat?.length > 0 && (
                <div style={{ marginTop: 'var(--s-7)' }}>
                  <h2>Yang termasuk dalam paket</h2>
                  <ul className="detail__manfaat">
                    {data.manfaat.map((m, i) => (
                      <li key={i}>
                        <strong>{m.teks}</strong>
                        {m.keterangan && <div>{m.keterangan}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.galeri?.length > 0 && (
                <div style={{ marginTop: 'var(--s-7)' }}>
                  <h2>Dokumentasi</h2>
                  <div className="kisi kisi--3" style={{ marginTop: 'var(--s-4)' }}>
                    {data.galeri.map((g, i) => (
                      <figure key={i} style={{ margin: 0 }}>
                        <Gambar src={g.image} alt={g.caption || ''} />
                        {g.caption && (
                          <figcaption className="meta" style={{ marginTop: 'var(--s-2)' }}>
                            {g.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 'var(--s-7)', paddingTop: 'var(--s-5)', borderTop: '1px solid var(--garis)' }}>
                <BagikanSosial judul={data.judul} ringkas={data.ringkas} />
              </div>
            </article>

            {/* ------------------------------------------------- samping */}
            {katalog && (
              <aside className="detail__samping">
                <div className="detail__kotak">
                  <span className="eyebrow">{LABEL_MODUL[modul]}</span>
                  <div className="detail__harga">{hargaTampil(data.harga, data.jenis_harga)}</div>

                  {data.durasi && (
                    <div className="detail__baris"><span>Durasi</span><strong>{data.durasi}</strong></div>
                  )}
                  {data.area_layanan && (
                    <div className="detail__baris"><span>Area layanan</span><strong>{data.area_layanan}</strong></div>
                  )}

                  {data.whatsapp ? (
                    <Tombol
                      sebagai="a"
                      corak="wa"
                      penuh
                      href={data.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => publik.lead({
                        tipe: modul, id: data.id, judul: data.judul,
                        halaman: window.location.pathname,
                      })}
                    >
                      Tanya &amp; Pesan via WhatsApp
                    </Tombol>
                  ) : (
                    <Tombol ke="/kontak" penuh>Hubungi Klinik</Tombol>
                  )}

                  <p className="detail__catatan">
                    Harga dapat berubah sewaktu-waktu. Konfirmasikan kembali saat mendaftar.
                  </p>
                </div>
              </aside>
            )}
          </div>

          {/* -------------------------------------------------- terkait */}
          {data.terkait?.length > 0 && (
            <div>
              <h2 style={{ marginBottom: 'var(--s-4)' }}>Lainnya dari {indukJudul}</h2>
              <div className="kisi kisi--3">
                {data.terkait.map((t) => (
                  <Link
                    key={t.slug}
                    to={`/${JALUR_MODUL[modul]}/${t.slug}`}
                    className="kartu kartu--tautan"
                    style={{ color: 'inherit' }}
                  >
                    <Gambar src={t.thumbnail} alt={t.judul} keterangan={LABEL_MODUL[modul]} />
                    <div className="kartu__isi">
                      {t.kategori && <Lencana>{t.kategori}</Lencana>}
                      <h3 className="kartu__judul" style={{ fontSize: 'var(--t-base)' }}>{t.judul}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
