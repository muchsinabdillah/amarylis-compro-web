import { useEffect, useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import Editor from '../../components/admin/Editor'
import IsianGambar from '../../components/admin/IsianGambar'
import { AreaTeks, Pilihan, Teks } from '../../components/ui/Isian'
import { Galat, Info, Memuat, StatusKonten, Tombol } from '../../components/ui/Dasar'
import { sejak } from '../../lib/format'

/**
 * Halaman statis (Tentang Kami, dan sejenisnya).
 *
 * Slug tidak dapat diubah dari sini: menu utama situs memanggilnya dengan
 * nama tetap, dan slug yang berganti akan membuat menu menunjuk halaman yang
 * tidak ada — kegagalan yang hanya terlihat oleh pengunjung.
 */
export default function Halaman() {
  const daftar = useMuat((o) => admin.halaman(o), [])
  const [pilihId, setPilihId] = useState(null)

  useSeo({ judul: 'Halaman Statis — CMS' })

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Halaman Statis</h1>
          <p>Halaman yang isinya tetap, seperti Tentang Kami.</p>
        </div>
      </div>

      <div className="cms-panel">
        {daftar.memuat ? <Memuat tinggi={44} jumlah={2} />
          : daftar.galat ? <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />
            : (
              <div className="geser-x">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Alamat</th>
                      <th>Status</th>
                      <th>Disunting</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {(daftar.data || []).map((h) => (
                      <tr key={h.id}>
                        <td><strong>{h.judul}</strong></td>
                        <td><code>/{h.slug}</code></td>
                        <td><StatusKonten status={h.status} /></td>
                        <td>{sejak(h.updated_at)}</td>
                        <td>
                          <div className="tabel__aksi">
                            {h.status === 'published' && (
                              <a
                                className="btn btn--polos btn--kecil"
                                href={`/${h.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Lihat
                              </a>
                            )}
                            <Tombol corak="garis" ukuran="kecil" onClick={() => setPilihId(h.id)}>
                              Sunting
                            </Tombol>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>

      {pilihId && (
        <FormHalaman
          id={pilihId}
          saatTutup={() => setPilihId(null)}
          saatSimpan={() => { setPilihId(null); daftar.muatUlang() }}
        />
      )}
    </>
  )
}

function FormHalaman({ id, saatTutup, saatSimpan }) {
  const ada = useMuat((o) => admin.halamanAmbil(id, o), [id])
  const [f, setF] = useState({})
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)
  const [seksiTeks, setSeksiTeks] = useState('')
  const [galatSeksi, setGalatSeksi] = useState(null)

  useEffect(() => {
    if (!ada.data) return
    setF(ada.data)
    setSeksiTeks(ada.data.seksi ? JSON.stringify(ada.data.seksi, null, 2) : '')
  }, [ada.data])

  useEffect(() => {
    const saatEsc = (e) => { if (e.key === 'Escape') saatTutup() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', saatEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', saatEsc)
    }
  }, [saatTutup])

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const setEv = (k) => (e) => set(k)(e.target.value)

  const simpan = async (e) => {
    e.preventDefault()
    setGalat(null)
    setGalatSeksi(null)

    let seksi
    if (seksiTeks.trim()) {
      try {
        seksi = JSON.parse(seksiTeks)
      } catch {
        // JSON yang salah ketik tidak dikirim ke server: pesan "gagal
        // menyimpan" yang datang kemudian jauh lebih sulit ditelusuri
        // daripada penolakan di sini.
        setGalatSeksi('Format JSON belum benar. Periksa tanda kurung, koma, dan tanda kutipnya.')
        return
      }
    }

    setKirim(true)
    try {
      await admin.halamanSimpan(id, {
        judul: f.judul,
        konten: f.konten || '',
        status: f.status,
        hero_image: f.hero_image || '',
        og_image: f.og_image || '',
        seo_title: f.seo_title || '',
        seo_description: f.seo_description || '',
        ...(seksiTeks.trim() ? { seksi } : {}),
      })
      saatSimpan()
    } catch (err) {
      setGalat(err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sunting halaman"
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(8, 34, 28, 0.5)',
        display: 'grid', placeItems: 'center', padding: 'var(--s-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) saatTutup() }}
    >
      <form
        onSubmit={simpan}
        style={{
          background: 'var(--putih)', borderRadius: 'var(--r-lg)',
          width: '100%', maxWidth: 860, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--bayang-3)', overflow: 'hidden',
        }}
      >
        <div
          className="baris baris--antara"
          style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--garis)' }}
        >
          <h2 style={{ fontSize: 'var(--t-lg)' }}>Sunting halaman</h2>
          <button type="button" className="btn btn--polos btn--kecil" onClick={saatTutup}>Tutup</button>
        </div>

        <div className="tumpuk" style={{ padding: 'var(--s-5)', overflowY: 'auto' }}>
          {ada.memuat ? <Memuat tinggi={200} /> : (
            <>
              {galat && <div className="galat-kotak" role="alert">{galat}</div>}

              <Teks label="Judul" value={f.judul || ''} onChange={setEv('judul')} required />

              <Pilihan
                label="Status"
                value={f.status || 'draft'}
                onChange={setEv('status')}
                opsi={[
                  { nilai: 'draft', label: 'Draf — belum tampil di situs' },
                  { nilai: 'published', label: 'Tayang' },
                  { nilai: 'archived', label: 'Arsip' },
                ]}
              />

              <IsianGambar label="Gambar utama" nilai={f.hero_image || ''} saatUbah={set('hero_image')} />

              <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
                <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>Isi halaman</span>
                <Editor nilai={f.konten || ''} saatUbah={set('konten')} />
              </div>

              <AreaTeks
                label="Blok tambahan (JSON)"
                baris={8}
                value={seksiTeks}
                onChange={(e) => setSeksiTeks(e.target.value)}
                galat={galatSeksi}
                bantuan={'Opsional. Contoh: {"visi": "…", "misi": ["…", "…"]}. Kosongkan bila tidak dipakai.'}
                style={{ fontFamily: 'ui-monospace, monospace', fontSize: 'var(--t-xs)' }}
              />

              <Teks label="Judul SEO" value={f.seo_title || ''} onChange={setEv('seo_title')} />
              <AreaTeks
                label="Deskripsi SEO"
                baris={2}
                value={f.seo_description || ''}
                onChange={setEv('seo_description')}
              />
              <IsianGambar
                label="Gambar berbagi (OG image)"
                nilai={f.og_image || ''}
                saatUbah={set('og_image')}
              />

              <Info corak="info">
                Alamat halaman (<code>/{f.slug}</code>) tidak dapat diubah karena menu utama situs
                menunjuk ke sana.
              </Info>
            </>
          )}
        </div>

        <div
          className="baris baris--kanan"
          style={{ padding: 'var(--s-4) var(--s-5)', borderTop: '1px solid var(--garis)' }}
        >
          <button type="button" className="btn btn--garis" onClick={saatTutup}>Batal</button>
          <Tombol type="submit" memuat={kirim}>Simpan</Tombol>
        </div>
      </form>
    </div>
  )
}
