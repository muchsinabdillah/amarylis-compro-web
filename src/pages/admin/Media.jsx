import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import Paginasi from '../../components/publik/Paginasi'
import Konfirmasi from '../../components/admin/Konfirmasi'
import { Galat, Kosong, Memuat, Tombol } from '../../components/ui/Dasar'
import { tanggalJam } from '../../lib/format'

/**
 * Pustaka media.
 *
 * Gambar diperkecil dan ditulis ulang di server, jadi ukuran yang tampil di
 * sini adalah ukuran yang benar-benar diunduh pengunjung — bukan ukuran
 * berkas aslinya.
 */
export default function Media() {
  const [param, setParam] = useSearchParams()
  const halaman = Math.max(1, Number(param.get('halaman')) || 1)

  const daftar = useMuat((o) => admin.media({ halaman }, o), [halaman])

  const [sibuk, setSibuk] = useState(false)
  const [galatUnggah, setGalatUnggah] = useState(null)
  const [akanHapus, setAkanHapus] = useState(null)
  const [altSunting, setAltSunting] = useState(null)
  const berkasRef = useRef(null)

  useSeo({ judul: 'Pustaka Media — CMS' })

  const unggah = async (e) => {
    const berkas = Array.from(e.target.files || [])
    if (!berkas.length) return

    setSibuk(true)
    setGalatUnggah(null)
    const gagal = []

    // Diunggah satu per satu, bukan sekaligus: satu berkas yang ditolak tidak
    // boleh membatalkan yang lain, dan pesannya harus menyebut berkas mana.
    for (const b of berkas) {
      try {
        const fd = new FormData()
        fd.append('file', b)
        // eslint-disable-next-line no-await-in-loop
        await admin.mediaUnggah(fd)
      } catch (err) {
        gagal.push(`${b.name}: ${err.perKolom?.file || err.message}`)
      }
    }

    if (gagal.length) setGalatUnggah(gagal.join(' · '))
    setSibuk(false)
    if (berkasRef.current) berkasRef.current.value = ''
    daftar.muatUlang()
  }

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Pustaka Media</h1>
          <p>
            {daftar.meta?.total ?? 0} berkas. Format JPG, PNG, dan WEBP; gambar besar otomatis
            diperkecil ke sisi terpanjang 1600 piksel.
          </p>
        </div>
        <div>
          <input
            ref={berkasRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={unggah}
            style={{ display: 'none' }}
          />
          <Tombol memuat={sibuk} onClick={() => berkasRef.current?.click()}>
            + Unggah gambar
          </Tombol>
        </div>
      </div>

      {galatUnggah && (
        <div className="galat-kotak" role="alert" style={{ marginBottom: 'var(--s-4)' }}>
          {galatUnggah}
        </div>
      )}

      <div className="cms-panel">
        {daftar.memuat ? <Memuat tinggi={160} jumlah={2} />
          : daftar.galat ? <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />
            : daftar.data?.length ? (
              <>
                <div
                  style={{
                    display: 'grid',
                    gap: 'var(--s-4)',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                  }}
                >
                  {daftar.data.map((m) => (
                    <figure
                      key={m.id}
                      style={{
                        margin: 0, border: '1px solid var(--garis)',
                        borderRadius: 'var(--r-md)', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      <a href={m.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={m.url}
                          alt={m.alt || m.nama}
                          loading="lazy"
                          style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}
                        />
                      </a>

                      <figcaption
                        style={{
                          padding: 'var(--s-3)', fontSize: 'var(--t-xs)',
                          display: 'flex', flexDirection: 'column', gap: 4, flex: 1,
                        }}
                      >
                        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.nama}
                        </strong>
                        <span style={{ color: 'var(--teks-samar)' }}>
                          {m.lebar}×{m.tinggi} · {Math.round(m.ukuran / 1024)} KB
                        </span>
                        <span style={{ color: 'var(--teks-samar)' }}>
                          {m.pengunggah || '—'} · {tanggalJam(m.created_at)}
                        </span>

                        {/* Teks alternatif ditampilkan terang-terangan supaya
                            yang kosong terlihat: gambar tanpa alt tidak dapat
                            dipahami pembaca layar. */}
                        <span style={{ color: m.alt ? 'var(--teks-lembut)' : 'var(--awas)' }}>
                          {m.alt ? `Alt: ${m.alt}` : 'Alt belum diisi'}
                        </span>

                        <div className="baris" style={{ marginTop: 'auto', paddingTop: 'var(--s-2)', gap: 4 }}>
                          <Tombol corak="garis" ukuran="kecil" onClick={() => setAltSunting(m)}>
                            Teks alt
                          </Tombol>
                          <Tombol
                            corak="polos"
                            ukuran="kecil"
                            onClick={() => navigator.clipboard?.writeText(m.url)}
                          >
                            Salin URL
                          </Tombol>
                          <Tombol corak="polos" ukuran="kecil" onClick={() => setAkanHapus(m)}>
                            Hapus
                          </Tombol>
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>

                <Paginasi
                  halaman={halaman}
                  jumlahHalaman={daftar.meta?.jml_halaman || 0}
                  saatPindah={(n) => setParam({ halaman: n })}
                />
              </>
            ) : (
              <Kosong
                judul="Pustaka masih kosong"
                pesan="Unggah gambar pertama lewat tombol di atas."
              />
            )}
      </div>

      {altSunting && (
        <FormAlt
          media={altSunting}
          saatTutup={() => setAltSunting(null)}
          saatSimpan={() => { setAltSunting(null); daftar.muatUlang() }}
        />
      )}

      <Konfirmasi
        buka={!!akanHapus}
        judul="Hapus gambar ini?"
        pesan={akanHapus
          ? `"${akanHapus.nama}" akan dihapus permanen. Halaman yang masih memakainya akan menampilkan gambar rusak — periksa dulu sebelum melanjutkan.`
          : ''}
        labelYa="Hapus permanen"
        saatBatal={() => setAkanHapus(null)}
        saatYa={async () => {
          await admin.mediaHapus(akanHapus.id)
          setAkanHapus(null)
          daftar.muatUlang()
        }}
      />
    </>
  )
}

function FormAlt({ media, saatTutup, saatSimpan }) {
  const [alt, setAlt] = useState(media.alt || '')
  const [kirim, setKirim] = useState(false)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Teks alternatif gambar"
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(8, 34, 28, 0.5)',
        display: 'grid', placeItems: 'center', padding: 'var(--s-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) saatTutup() }}
    >
      <form
        className="tumpuk"
        style={{
          background: 'var(--putih)', borderRadius: 'var(--r-lg)',
          width: '100%', maxWidth: 460, padding: 'var(--s-5)',
          boxShadow: 'var(--bayang-3)',
        }}
        onSubmit={async (e) => {
          e.preventDefault()
          setKirim(true)
          try {
            await admin.mediaUbah(media.id, { alt })
            saatSimpan()
          } finally {
            setKirim(false)
          }
        }}
      >
        <h2 style={{ fontSize: 'var(--t-lg)' }}>Teks alternatif</h2>

        <img
          src={media.url}
          alt=""
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--r-md)' }}
        />

        <label htmlFor="alt-media" style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>
          Uraikan isi gambar
        </label>
        <input
          id="alt-media"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          maxLength={255}
          placeholder="Contoh: Ruang tunggu klinik dengan kursi berjajar"
          style={{
            padding: '0.6rem 0.8rem', border: '1px solid var(--garis-tegas)',
            borderRadius: 'var(--r-md)', fontSize: 'var(--t-sm)',
          }}
        />
        <small style={{ color: 'var(--teks-samar)' }}>
          Dibacakan pembaca layar dan tampil bila gambar gagal dimuat. Gambar hiasan boleh
          dikosongkan.
        </small>

        <div className="baris baris--kanan">
          <button type="button" className="btn btn--garis" onClick={saatTutup}>Batal</button>
          <Tombol type="submit" memuat={kirim}>Simpan</Tombol>
        </div>
      </form>
    </div>
  )
}
