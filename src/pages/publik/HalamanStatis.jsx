import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import { Galat, Gambar, Kosong, Memuat } from '../../components/ui/Dasar'

/**
 * Halaman statis dari CMS (Tentang Kami dan sejenisnya).
 *
 * Blok bebas pada kolom `seksi` ditampilkan bila ada. Bentuknya sengaja
 * longgar supaya klinik dapat menambah blok visi/misi/nilai tanpa menuntut
 * perubahan kode setiap kali.
 */
export default function HalamanStatis({ slug, judulCadangan, keterangan }) {
  const { data, memuat, galat, muatUlang } = useMuat((o) => publik.halaman(slug, o), [slug])

  useSeo({
    judul: data?.seo_title || data?.judul || judulCadangan,
    deskripsi: data?.seo_description || keterangan,
    gambar: data?.og_image || data?.hero_image,
  })

  if (memuat) {
    return <div className="wadah seksi"><Memuat tinggi={280} /></div>
  }

  // Halaman yang belum ditayangkan menjawab 404. Itu keadaan yang wajar di
  // awal pemasangan, jadi pesannya menjelaskan langkah berikutnya alih-alih
  // menampilkan galat.
  if (galat?.status === 404) {
    return (
      <>
        <KepalaHalaman judul={judulCadangan} remah={[{ label: judulCadangan }]} />
        <div className="wadah seksi">
          <Kosong
            judul="Halaman ini belum ditayangkan"
            pesan="Isi dan status halaman dapat diatur lewat CMS → Halaman."
          />
        </div>
      </>
    )
  }

  if (galat) {
    return <div className="wadah seksi"><Galat galat={galat} saatUlang={muatUlang} /></div>
  }

  const seksi = data?.seksi || null

  return (
    <>
      <KepalaHalaman
        judul={data.judul || judulCadangan}
        keterangan={keterangan}
        remah={[{ label: data.judul || judulCadangan }]}
      />

      {data.hero_image && (
        <div className="wadah" style={{ marginTop: 'calc(var(--s-6) * -1)', position: 'relative', zIndex: 1 }}>
          <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--bayang-3)' }}>
            <Gambar src={data.hero_image} alt="" />
          </div>
        </div>
      )}

      <section className="seksi">
        <div className="wadah">
          {data.konten
            ? <div className="prosa" dangerouslySetInnerHTML={{ __html: data.konten }} />
            : <p style={{ color: 'var(--teks-samar)' }}>Isi halaman belum ditambahkan.</p>}

          {seksi && <BlokSeksi seksi={seksi} />}
        </div>
      </section>
    </>
  )
}

/**
 * Blok bebas.
 *
 * Nilai berupa teks ditampilkan sebagai paragraf; larik menjadi daftar kartu.
 * Bentuk yang belum dikenali diabaikan diam-diam daripada merusak halaman —
 * isi CMS tidak boleh bisa membuat halaman gagal tampil.
 */
function BlokSeksi({ seksi }) {
  const entri = Object.entries(seksi).filter(([, v]) => v !== null && v !== '')
  if (entri.length === 0) return null

  const judulkan = (k) => k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div style={{ marginTop: 'var(--s-8)', display: 'grid', gap: 'var(--s-6)' }}>
      {entri.map(([kunci, nilai]) => (
        <div key={kunci}>
          <h2>{judulkan(kunci)}</h2>

          {typeof nilai === 'string' && (
            <div
              className="prosa"
              style={{ marginTop: 'var(--s-3)' }}
              dangerouslySetInnerHTML={{ __html: nilai }}
            />
          )}

          {Array.isArray(nilai) && (
            <div className="kisi kisi--3" style={{ marginTop: 'var(--s-4)' }}>
              {nilai.map((v, i) => (
                <div key={i} className="kartu">
                  <div className="kartu__isi">
                    {typeof v === 'string' ? (
                      <p style={{ margin: 0 }}>{v}</p>
                    ) : (
                      <>
                        {v?.judul && (
                          <h3 className="kartu__judul" style={{ fontSize: 'var(--t-base)' }}>{v.judul}</h3>
                        )}
                        {v?.isi && <p className="kartu__ringkas" style={{ margin: 0 }}>{v.isi}</p>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
