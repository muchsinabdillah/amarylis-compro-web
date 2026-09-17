import { useEffect, useRef, useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { Galat, Kosong, Memuat, Tombol } from '../ui/Dasar'

/**
 * Pemilih gambar dari pustaka media, sekaligus tempat mengunggah.
 *
 * Digabung dengan sengaja: memisahkan "unggah" dan "pilih" memaksa orang
 * berpindah layar di tengah menulis artikel, dan setiap perpindahan seperti
 * itu adalah kesempatan kehilangan draf.
 */
export default function PilihMedia({ buka, saatPilih, saatTutup }) {
  const [sibuk, setSibuk] = useState(false)
  const [galatUnggah, setGalatUnggah] = useState(null)
  const berkasRef = useRef(null)

  const { data, meta, memuat, galat, muatUlang } = useMuat(
    (o) => (buka ? admin.media({ per_halaman: 48 }, o) : Promise.resolve({ data: [] })),
    [buka])

  useEffect(() => {
    if (!buka) return undefined
    const saatEsc = (e) => { if (e.key === 'Escape') saatTutup() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', saatEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', saatEsc)
    }
  }, [buka, saatTutup])

  if (!buka) return null

  const unggah = async (e) => {
    const berkas = e.target.files?.[0]
    if (!berkas) return

    setSibuk(true)
    setGalatUnggah(null)
    try {
      const fd = new FormData()
      fd.append('file', berkas)
      const h = await admin.mediaUnggah(fd)
      muatUlang()
      // Gambar yang baru diunggah langsung dipakai: itu memang alasan orang
      // menekan tombol unggah dari dalam editor.
      saatPilih(h.data)
    } catch (err) {
      setGalatUnggah(err.perKolom?.file || err.message)
    } finally {
      setSibuk(false)
      if (berkasRef.current) berkasRef.current.value = ''
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pilih gambar"
      style={{
        position: 'fixed', inset: 0, zIndex: 130,
        background: 'rgba(8, 34, 28, 0.5)',
        display: 'grid', placeItems: 'center', padding: 'var(--s-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) saatTutup() }}
    >
      <div
        style={{
          background: 'var(--putih)', borderRadius: 'var(--r-lg)',
          width: '100%', maxWidth: 880, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--bayang-3)', overflow: 'hidden',
        }}
      >
        <div
          className="baris baris--antara"
          style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--garis)' }}
        >
          <h2 style={{ fontSize: 'var(--t-lg)' }}>Pustaka Media</h2>
          <div className="baris" style={{ gap: 'var(--s-2)' }}>
            <input
              ref={berkasRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={unggah}
              style={{ display: 'none' }}
              id="pilih-media-unggah"
            />
            <Tombol
              ukuran="kecil"
              memuat={sibuk}
              onClick={() => berkasRef.current?.click()}
            >
              + Unggah gambar
            </Tombol>
            <button type="button" className="btn btn--polos btn--kecil" onClick={saatTutup}>
              Tutup
            </button>
          </div>
        </div>

        <div style={{ padding: 'var(--s-5)', overflowY: 'auto' }}>
          {galatUnggah && (
            <div className="galat-kotak" role="alert" style={{ marginBottom: 'var(--s-4)' }}>
              {galatUnggah}
            </div>
          )}

          {memuat ? <Memuat tinggi={120} jumlah={2} />
            : galat ? <Galat galat={galat} saatUlang={muatUlang} />
              : data?.length ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 'var(--s-3)',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  }}
                >
                  {data.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => saatPilih(m)}
                      title={`${m.nama} · ${m.lebar}×${m.tinggi}`}
                      style={{
                        border: '1px solid var(--garis)', borderRadius: 'var(--r-md)',
                        background: 'var(--putih)', padding: 0, cursor: 'pointer',
                        overflow: 'hidden', textAlign: 'left',
                      }}
                    >
                      <img
                        src={m.url}
                        alt={m.alt || m.nama}
                        loading="lazy"
                        style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}
                      />
                      <div style={{
                        padding: '0.4rem 0.5rem', fontSize: 'var(--t-xs)',
                        color: 'var(--teks-lembut)', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {m.nama}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Kosong
                  judul="Pustaka masih kosong"
                  pesan="Unggah gambar pertama lewat tombol di atas. Format JPG, PNG, atau WEBP."
                />
              )}

          {meta?.total > (data?.length || 0) && (
            <p style={{ marginTop: 'var(--s-4)', fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>
              Menampilkan {data.length} dari {meta.total} berkas terbaru. Kelola selengkapnya di
              menu Pustaka Media.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
