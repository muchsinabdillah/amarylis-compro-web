import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import { Galat, Gambar, KartuRangka, Kosong } from '../../components/ui/Dasar'

export default function Fasilitas() {
  const { data, memuat, galat, muatUlang } = useMuat((o) => publik.fasilitas(o), [])

  useSeo({
    judul: 'Fasilitas',
    deskripsi: 'Fasilitas yang tersedia di Klinik Pratama Andini.',
  })

  return (
    <>
      <KepalaHalaman
        judul="Fasilitas"
        keterangan="Ruang dan sarana yang tersedia untuk menunjang pelayanan."
        remah={[{ label: 'Fasilitas' }]}
      />

      <section className="seksi">
        <div className="wadah">
          {memuat ? <KartuRangka jumlah={6} />
            : galat ? <Galat galat={galat} saatUlang={muatUlang} />
              : data?.length ? (
                <div className="kisi kisi--3">
                  {data.map((f, i) => (
                    <article key={i} className="kartu">
                      <Gambar src={f.image} alt={f.nama} keterangan="Foto fasilitas" />
                      <div className="kartu__isi">
                        <h2 className="kartu__judul" style={{ fontSize: 'var(--t-lg)' }}>{f.nama}</h2>
                        {f.deskripsi && (
                          <div className="kartu__ringkas" dangerouslySetInnerHTML={{ __html: f.deskripsi }} />
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Kosong
                  judul="Daftar fasilitas belum diisi"
                  pesan="Pengelola klinik dapat menambahkannya lewat menu Fasilitas di CMS."
                />
              )}
        </div>
      </section>
    </>
  )
}
