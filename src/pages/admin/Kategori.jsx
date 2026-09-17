import { useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import Konfirmasi from '../../components/admin/Konfirmasi'
import { Centang, Pilihan, Teks } from '../../components/ui/Isian'
import { Galat, Lencana, Memuat, Tombol } from '../../components/ui/Dasar'

const TIPE = [
  { nilai: 'article', label: 'Artikel' },
  { nilai: 'news', label: 'Berita' },
  { nilai: 'video', label: 'Video' },
  { nilai: 'service', label: 'Layanan' },
  { nilai: 'mcu', label: 'Paket MCU' },
  { nilai: 'homecare', label: 'Homecare' },
]

const LABEL_TIPE = Object.fromEntries(TIPE.map((t) => [t.nilai, t.label]))

export default function Kategori() {
  const daftar = useMuat((o) => admin.kategori({}, o), [])
  const [sunting, setSunting] = useState(null)
  const [akanHapus, setAkanHapus] = useState(null)
  const [galatHapus, setGalatHapus] = useState(null)

  useSeo({ judul: 'Kategori — CMS' })

  const perTipe = TIPE
    .map((t) => ({ ...t, baris: (daftar.data || []).filter((k) => k.tipe === t.nilai) }))
    .filter((t) => t.baris.length > 0)

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Kategori</h1>
          <p>Pengelompokan untuk artikel, berita, video, dan katalog layanan.</p>
        </div>
        <Tombol onClick={() => setSunting({ tipe: 'article', is_active: true })}>
          + Tambah kategori
        </Tombol>
      </div>

      {galatHapus && (
        <div className="galat-kotak" role="alert" style={{ marginBottom: 'var(--s-4)' }}>
          {galatHapus}
        </div>
      )}

      {daftar.memuat ? <Memuat tinggi={120} jumlah={2} />
        : daftar.galat ? <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />
          : perTipe.length ? perTipe.map((t) => (
            <div key={t.nilai} className="cms-panel">
              <h2 className="cms-panel__judul">{t.label}</h2>
              <div className="geser-x">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Slug</th>
                      <th className="angka">Dipakai</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {t.baris.map((k) => (
                      <tr key={k.id}>
                        <td><strong>{k.nama}</strong></td>
                        <td><code>{k.slug}</code></td>
                        <td className="angka">{k.dipakai}</td>
                        <td>
                          {k.is_active
                            ? <Lencana corak="sukses">Aktif</Lencana>
                            : <Lencana corak="abu">Nonaktif</Lencana>}
                        </td>
                        <td>
                          <div className="tabel__aksi">
                            <Tombol corak="garis" ukuran="kecil" onClick={() => setSunting(k)}>
                              Sunting
                            </Tombol>
                            <Tombol
                              corak="polos"
                              ukuran="kecil"
                              onClick={() => { setGalatHapus(null); setAkanHapus(k) }}
                            >
                              Hapus
                            </Tombol>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )) : (
            <div className="cms-panel">
              <p style={{ color: 'var(--teks-samar)', fontSize: 'var(--t-sm)' }}>
                Belum ada kategori.
              </p>
            </div>
          )}

      {sunting && (
        <FormKategori
          awal={sunting}
          saatTutup={() => setSunting(null)}
          saatSimpan={() => { setSunting(null); daftar.muatUlang() }}
        />
      )}

      <Konfirmasi
        buka={!!akanHapus}
        judul="Hapus kategori ini?"
        pesan={akanHapus
          ? `"${akanHapus.nama}" (${LABEL_TIPE[akanHapus.tipe]}) akan dihapus. ` +
            (akanHapus.dipakai > 0
              ? `Kategori ini masih dipakai ${akanHapus.dipakai} konten, jadi penghapusannya akan ditolak — nonaktifkan saja.`
              : 'Kategori ini belum dipakai konten mana pun.')
          : ''}
        labelYa="Hapus"
        saatBatal={() => setAkanHapus(null)}
        saatYa={async () => {
          try {
            await admin.kategoriHapus(akanHapus.id)
            setAkanHapus(null)
            daftar.muatUlang()
          } catch (e) {
            setGalatHapus(e.perKolom?.kategori || e.message)
            setAkanHapus(null)
          }
        }}
      />
    </>
  )
}

function FormKategori({ awal, saatTutup, saatSimpan }) {
  const baru = !awal.id
  const [f, setF] = useState(awal)
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)

  const simpan = async (e) => {
    e.preventDefault()
    setKirim(true)
    setGalat(null)
    try {
      const isi = {
        nama: f.nama,
        keterangan: f.keterangan || '',
        urutan: Number(f.urutan) || 0,
        is_active: !!f.is_active,
        ...(baru ? { tipe: f.tipe } : {}),
      }
      if (baru) await admin.kategoriBuat(isi)
      else await admin.kategoriUbah(awal.id, isi)
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
      aria-label={baru ? 'Tambah kategori' : 'Sunting kategori'}
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(8, 34, 28, 0.5)',
        display: 'grid', placeItems: 'center', padding: 'var(--s-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) saatTutup() }}
    >
      <form
        onSubmit={simpan}
        className="tumpuk"
        style={{
          background: 'var(--putih)', borderRadius: 'var(--r-lg)',
          width: '100%', maxWidth: 480, padding: 'var(--s-5)',
          boxShadow: 'var(--bayang-3)',
        }}
      >
        <h2 style={{ fontSize: 'var(--t-lg)' }}>{baru ? 'Tambah kategori' : 'Sunting kategori'}</h2>

        {galat && <div className="galat-kotak" role="alert">{galat}</div>}

        <Pilihan
          label="Untuk jenis konten"
          value={f.tipe || 'article'}
          onChange={(e) => setF((s) => ({ ...s, tipe: e.target.value }))}
          opsi={TIPE}
          disabled={!baru}
          bantuan={baru ? undefined : 'Jenis tidak dapat diubah setelah kategori dibuat.'}
        />

        <Teks
          label="Nama"
          wajib
          required
          value={f.nama || ''}
          onChange={(e) => setF((s) => ({ ...s, nama: e.target.value }))}
        />

        <Teks
          label="Keterangan"
          value={f.keterangan || ''}
          onChange={(e) => setF((s) => ({ ...s, keterangan: e.target.value }))}
        />

        <Teks
          label="Urutan"
          type="number"
          value={f.urutan ?? 0}
          onChange={(e) => setF((s) => ({ ...s, urutan: e.target.value }))}
        />

        <Centang
          label="Aktif"
          keterangan="Kategori nonaktif tidak muncul sebagai saringan di situs."
          checked={!!f.is_active}
          onChange={(e) => setF((s) => ({ ...s, is_active: e.target.checked }))}
        />

        <div className="baris baris--kanan">
          <button type="button" className="btn btn--garis" onClick={saatTutup}>Batal</button>
          <Tombol type="submit" memuat={kirim}>Simpan</Tombol>
        </div>
      </form>
    </div>
  )
}
