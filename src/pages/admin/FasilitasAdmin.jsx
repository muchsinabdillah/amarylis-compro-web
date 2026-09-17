import { useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import Editor from '../../components/admin/Editor'
import IsianGambar from '../../components/admin/IsianGambar'
import Konfirmasi from '../../components/admin/Konfirmasi'
import { Centang, Teks } from '../../components/ui/Isian'
import { Galat, Lencana, Memuat, Tombol } from '../../components/ui/Dasar'

export default function FasilitasAdmin() {
  const daftar = useMuat((o) => admin.fasilitas(o), [])
  const [sunting, setSunting] = useState(null)   // objek, atau {} untuk baru
  const [akanHapus, setAkanHapus] = useState(null)
  const [sibukUrut, setSibukUrut] = useState(false)

  useSeo({ judul: 'Fasilitas — CMS' })

  /**
   * Naik/turun satu langkah.
   *
   * Seret-lepas terlihat lebih modern, tetapi sulit dipakai dengan papan
   * ketik dan di layar sentuh kecil. Dua tombol panah bekerja di mana saja.
   */
  const geser = async (indeks, arah) => {
    const baris = [...(daftar.data || [])]
    const tujuan = indeks + arah
    if (tujuan < 0 || tujuan >= baris.length) return

    ;[baris[indeks], baris[tujuan]] = [baris[tujuan], baris[indeks]]
    setSibukUrut(true)
    try {
      await admin.fasilitasUrutan(baris.map((b) => b.id))
      daftar.muatUlang()
    } finally {
      setSibukUrut(false)
    }
  }

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Fasilitas</h1>
          <p>Ruang dan sarana yang ditampilkan di halaman Fasilitas.</p>
        </div>
        <Tombol onClick={() => setSunting({})}>+ Tambah fasilitas</Tombol>
      </div>

      <div className="cms-panel">
        {daftar.memuat ? <Memuat tinggi={44} jumlah={4} />
          : daftar.galat ? <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />
            : daftar.data?.length ? (
              <div className="geser-x">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Urutan</th>
                      <th>Nama</th>
                      <th>Gambar</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {daftar.data.map((f, i) => (
                      <tr key={f.id}>
                        <td>
                          <div className="baris" style={{ gap: 4 }}>
                            <button
                              type="button"
                              className="btn btn--polos btn--kecil"
                              aria-label={`Naikkan ${f.nama}`}
                              disabled={i === 0 || sibukUrut}
                              onClick={() => geser(i, -1)}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btn--polos btn--kecil"
                              aria-label={`Turunkan ${f.nama}`}
                              disabled={i === daftar.data.length - 1 || sibukUrut}
                              onClick={() => geser(i, 1)}
                            >
                              ↓
                            </button>
                          </div>
                        </td>
                        <td><strong>{f.nama}</strong></td>
                        <td>
                          {f.image
                            ? <img src={f.image} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                            : <span style={{ color: 'var(--teks-samar)' }}>—</span>}
                        </td>
                        <td>
                          {f.is_active
                            ? <Lencana corak="sukses">Aktif</Lencana>
                            : <Lencana corak="abu">Nonaktif</Lencana>}
                        </td>
                        <td>
                          <div className="tabel__aksi">
                            <Tombol corak="garis" ukuran="kecil" onClick={() => setSunting(f)}>
                              Sunting
                            </Tombol>
                            <Tombol corak="polos" ukuran="kecil" onClick={() => setAkanHapus(f)}>
                              Hapus
                            </Tombol>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--teks-samar)', fontSize: 'var(--t-sm)' }}>
                Belum ada fasilitas. Tambahkan yang pertama lewat tombol di atas.
              </p>
            )}
      </div>

      {sunting && (
        <FormFasilitas
          awal={sunting}
          saatTutup={() => setSunting(null)}
          saatSimpan={() => { setSunting(null); daftar.muatUlang() }}
        />
      )}

      <Konfirmasi
        buka={!!akanHapus}
        judul="Hapus fasilitas ini?"
        pesan={akanHapus ? `"${akanHapus.nama}" akan dihapus permanen.` : ''}
        labelYa="Hapus permanen"
        saatBatal={() => setAkanHapus(null)}
        saatYa={async () => {
          await admin.fasilitasHapus(akanHapus.id)
          setAkanHapus(null)
          daftar.muatUlang()
        }}
      />
    </>
  )
}

function FormFasilitas({ awal, saatTutup, saatSimpan }) {
  const baru = !awal.id
  const [f, setF] = useState({ is_active: true, ...awal })
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))

  const simpan = async (e) => {
    e.preventDefault()
    setKirim(true)
    setGalat(null)
    try {
      const isi = {
        nama: f.nama,
        deskripsi: f.deskripsi || '',
        image: f.image || '',
        is_active: !!f.is_active,
      }
      if (baru) await admin.fasilitasBuat(isi)
      else await admin.fasilitasUbah(awal.id, isi)
      saatSimpan()
    } catch (err) {
      setGalat(err.perKolom?.nama || err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={baru ? 'Tambah fasilitas' : 'Sunting fasilitas'}
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
          width: '100%', maxWidth: 640, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--bayang-3)', overflow: 'hidden',
        }}
      >
        <div
          className="baris baris--antara"
          style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--garis)' }}
        >
          <h2 style={{ fontSize: 'var(--t-lg)' }}>{baru ? 'Tambah fasilitas' : 'Sunting fasilitas'}</h2>
          <button type="button" className="btn btn--polos btn--kecil" onClick={saatTutup}>Tutup</button>
        </div>

        <div className="tumpuk" style={{ padding: 'var(--s-5)', overflowY: 'auto' }}>
          {galat && <div className="galat-kotak" role="alert">{galat}</div>}

          <Teks
            label="Nama fasilitas"
            wajib
            required
            value={f.nama || ''}
            onChange={(e) => set('nama')(e.target.value)}
          />

          <IsianGambar label="Foto" nilai={f.image || ''} saatUbah={set('image')} />

          <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>Keterangan</span>
            <Editor nilai={f.deskripsi || ''} saatUbah={set('deskripsi')} tinggiMin={140} />
          </div>

          <Centang
            label="Tampilkan di situs"
            checked={!!f.is_active}
            onChange={(e) => set('is_active')(e.target.checked)}
          />
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
