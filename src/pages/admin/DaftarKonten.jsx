import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import { LABEL_MODUL, JALUR_MODUL } from '../../components/publik/KartuKonten'
import Paginasi from '../../components/publik/Paginasi'
import { Galat, Kosong, Memuat, StatusKonten, Tombol } from '../../components/ui/Dasar'
import { angka, sejak } from '../../lib/format'
import Konfirmasi from '../../components/admin/Konfirmasi'

/** Daftar konten CMS untuk keenam modul. */
export default function DaftarKonten() {
  const { modul } = useParams()
  const [param, setParam] = useSearchParams()
  const [akanHapus, setAkanHapus] = useState(null)

  const halaman = Math.max(1, Number(param.get('halaman')) || 1)
  const status  = param.get('status') || ''
  const cari    = param.get('cari') || ''

  const daftar = useMuat(
    (o) => admin.konten.daftar(modul, { halaman, status, cari }, o),
    [modul, halaman, status, cari])

  useSeo({ judul: `${LABEL_MODUL[modul] || modul} — CMS` })

  const ubah = (patch) => {
    const baru = new URLSearchParams(param)
    Object.entries(patch).forEach(([k, v]) => (v ? baru.set(k, v) : baru.delete(k)))
    if (!('halaman' in patch)) baru.delete('halaman')
    setParam(baru)
  }

  const hapus = async () => {
    await admin.konten.hapus(modul, akanHapus.id)
    setAkanHapus(null)
    daftar.muatUlang()
  }

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>{LABEL_MODUL[modul] || modul}</h1>
          <p>{daftar.meta?.total ? `${angka(daftar.meta.total)} entri` : 'Belum ada entri'}</p>
        </div>
        <Tombol ke={`/admin/konten/${modul}/baru`}>+ Tambah</Tombol>
      </div>

      <div className="cms-panel">
        {/* --------------------------------------------------- saringan */}
        <div className="baris baris--antara" style={{ marginBottom: 'var(--s-4)' }}>
          <div className="baris" style={{ gap: 'var(--s-2)' }}>
            {[
              { nilai: '', label: 'Semua' },
              { nilai: 'published', label: 'Tayang' },
              { nilai: 'draft', label: 'Draf' },
              { nilai: 'archived', label: 'Arsip' },
            ].map((s) => (
              <button
                key={s.nilai}
                type="button"
                className={`btn btn--kecil ${status === s.nilai ? '' : 'btn--garis'}`}
                onClick={() => ubah({ status: s.nilai })}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form
            role="search"
            className="baris"
            style={{ gap: 'var(--s-2)' }}
            onSubmit={(e) => {
              e.preventDefault()
              ubah({ cari: String(new FormData(e.currentTarget).get('cari') || '') })
            }}
          >
            <input
              name="cari"
              type="search"
              defaultValue={cari}
              placeholder="Cari judul…"
              aria-label="Cari judul"
              style={{
                padding: '0.45rem 0.7rem',
                border: '1px solid var(--garis-tegas)',
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--t-sm)',
              }}
            />
            <button type="submit" className="btn btn--garis btn--kecil">Cari</button>
          </form>
        </div>

        {/* ------------------------------------------------------ tabel */}
        {daftar.memuat ? <Memuat tinggi={44} jumlah={5} />
          : daftar.galat ? <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />
            : daftar.data?.length ? (
              <>
                <div className="geser-x">
                  <table className="tabel">
                    <thead>
                      <tr>
                        <th>Judul</th>
                        <th>Kategori</th>
                        <th>Status</th>
                        <th className="angka">Dilihat</th>
                        <th>Disunting</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {daftar.data.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <Link to={`/admin/konten/${modul}/${r.id}`}>
                              <strong>{r.judul}</strong>
                            </Link>
                            {r.is_featured && (
                              <span className="lencana lencana--awas" style={{ marginLeft: 8 }}>Unggulan</span>
                            )}
                          </td>
                          <td>{r.kategori || '—'}</td>
                          <td><StatusKonten status={r.status} /></td>
                          <td className="angka">{angka(r.view_count)}</td>
                          <td>{sejak(r.updated_at)}</td>
                          <td>
                            <div className="tabel__aksi">
                              {/* Pratinjau hanya berguna untuk yang sudah tayang;
                                  tautan ke draf akan menjawab 404 dan terbaca
                                  sebagai kerusakan. */}
                              {r.status === 'published' && (
                                <a
                                  className="btn btn--polos btn--kecil"
                                  href={`/${JALUR_MODUL[modul]}/${r.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Lihat
                                </a>
                              )}
                              <Tombol ke={`/admin/konten/${modul}/${r.id}`} corak="garis" ukuran="kecil">
                                Sunting
                              </Tombol>
                              <Tombol corak="polos" ukuran="kecil" onClick={() => setAkanHapus(r)}>
                                Hapus
                              </Tombol>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Paginasi
                  halaman={halaman}
                  jumlahHalaman={daftar.meta?.jml_halaman || 0}
                  saatPindah={(n) => ubah({ halaman: n })}
                />
              </>
            ) : (
              <Kosong
                judul={cari || status ? 'Tidak ada yang cocok' : 'Belum ada entri'}
                pesan={cari || status
                  ? 'Ubah saringan atau kata pencariannya.'
                  : `Mulai dengan menambahkan ${(LABEL_MODUL[modul] || modul).toLowerCase()} pertama.`}
                aksi={<Tombol ke={`/admin/konten/${modul}/baru`}>+ Tambah</Tombol>}
              />
            )}
      </div>

      <Konfirmasi
        buka={!!akanHapus}
        judul="Hapus entri ini?"
        pesan={akanHapus
          ? `"${akanHapus.judul}" akan dihapus permanen dan tidak dapat dikembalikan.`
          : ''}
        labelYa="Hapus permanen"
        saatBatal={() => setAkanHapus(null)}
        saatYa={hapus}
      />
    </>
  )
}
