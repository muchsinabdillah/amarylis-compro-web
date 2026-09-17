import { useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import { Galat, Info, Lencana, Memuat, Tombol } from '../../components/ui/Dasar'
import { tanggalJam } from '../../lib/format'

/**
 * Sinkronisasi data SIMRS.
 *
 * Layar ini menjelaskan APA yang akan terjadi sebelum tombolnya ditekan.
 * Tombol "Sinkronkan" tanpa keterangan membuat orang ragu menekannya — dan
 * yang lebih buruk, membuat sebagian menekannya berulang kali karena mengira
 * tidak terjadi apa-apa.
 */
export default function Sinkron() {
  const [jalan, setJalan] = useState(false)
  const [hasil, setHasil] = useState(null)
  const [galatJalan, setGalatJalan] = useState(null)

  const riwayat = useMuat((o) => admin.riwayatSinkron(o), [])

  useSeo({ judul: 'Sinkronisasi — CMS' })

  const jalankan = async (modul) => {
    setJalan(true)
    setHasil(null)
    setGalatJalan(null)
    try {
      const h = await admin.sinkron(modul)
      setHasil(h.data)
      riwayat.muatUlang()
    } catch (e) {
      setGalatJalan(e.message)
    } finally {
      setJalan(false)
    }
  }

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Sinkronisasi SIMRS</h1>
          <p>Menarik data dokter, jadwal praktik, dan paket dari SIMRS lewat API.</p>
        </div>
      </div>

      <div className="cms-panel">
        <h2 className="cms-panel__judul">Yang terjadi saat disinkronkan</h2>

        <ul style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', paddingLeft: '1.2em', display: 'grid', gap: 'var(--s-2)' }}>
          <li>
            <strong>Satu arah.</strong> Website hanya membaca. Tidak ada satu pun data SIMRS
            yang diubah — website bahkan tidak punya sambungan ke basis datanya.
          </li>
          <li>
            <strong>Yang baru masuk sebagai belum tayang.</strong> Master dokter memuat baris
            uji dan akun teknis; menayangkannya otomatis berarti keduanya muncul di halaman
            publik.
          </li>
          <li>
            <strong>Suntingan Anda dilewati.</strong> Kolom yang pernah diubah lewat CMS
            terkunci dan tidak ditimpa.
          </li>
          <li>
            <strong>Yang hilang di SIMRS ditandai, bukan dihapus.</strong> Foto, biografi, dan
            alamat halamannya tetap utuh.
          </li>
          <li>
            <strong>Jadwal ditulis ulang seluruhnya.</strong> Jadwal praktik selalu mengikuti
            SIMRS, tanpa pengecualian.
          </li>
        </ul>

        <div className="baris" style={{ marginTop: 'var(--s-5)', gap: 'var(--s-3)' }}>
          <Tombol onClick={() => jalankan('semua')} memuat={jalan}>
            Sinkronkan semua
          </Tombol>
          <Tombol corak="garis" onClick={() => jalankan('doctors')} disabled={jalan}>
            Dokter saja
          </Tombol>
          <Tombol corak="garis" onClick={() => jalankan('schedules')} disabled={jalan}>
            Jadwal saja
          </Tombol>
          <Tombol corak="garis" onClick={() => jalankan('packages')} disabled={jalan}>
            Paket saja
          </Tombol>
        </div>

        {galatJalan && (
          <div className="galat-kotak" role="alert" style={{ marginTop: 'var(--s-4)' }}>
            <strong>Sinkronisasi gagal.</strong>
            <div style={{ marginTop: 6 }}>{galatJalan}</div>
            <div style={{ marginTop: 6 }}>
              Periksa apakah SIMRS sedang berjalan dan kunci API pada berkas .env sudah benar.
              Isi situs yang sudah ada tidak terpengaruh.
            </div>
          </div>
        )}

        {hasil && (
          <div style={{ marginTop: 'var(--s-4)' }}>
            <Info corak="sukses" judul="Sinkronisasi selesai">
              <ul style={{ margin: '6px 0 0', paddingLeft: '1.2em' }}>
                {Object.entries(hasil).map(([modul, h]) => (
                  <li key={modul}>
                    <strong>{modul}</strong>:{' '}
                    {h.baris !== undefined
                      ? `${h.baris} baris jadwal ditulis ulang`
                      : `${h.baru} baru, ${h.diperbarui} diperbarui, ${h.dilewati} dilewati (terkunci), ${h.hilang} hilang di SIMRS`}
                  </li>
                ))}
              </ul>
            </Info>
          </div>
        )}
      </div>

      <div className="cms-panel">
        <h2 className="cms-panel__judul">Riwayat</h2>

        {riwayat.memuat ? <Memuat tinggi={44} jumlah={4} />
          : riwayat.galat ? <Galat galat={riwayat.galat} saatUlang={riwayat.muatUlang} />
            : riwayat.data?.length ? (
              <div className="geser-x">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Modul</th>
                      <th>Dipicu oleh</th>
                      <th>Status</th>
                      <th className="angka">Baru</th>
                      <th className="angka">Diperbarui</th>
                      <th className="angka">Dilewati</th>
                      <th className="angka">Hilang</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.data.map((r) => (
                      <tr key={r.id}>
                        <td>{tanggalJam(r.mulai_at)}</td>
                        <td>{r.modul}</td>
                        <td>{r.dipicu_oleh}</td>
                        <td>
                          <Lencana corak={r.status === 'selesai' ? 'sukses' : 'bahaya'}>
                            {r.status === 'selesai' ? 'Berhasil' : 'Gagal'}
                          </Lencana>
                        </td>
                        <td className="angka">{r.baru}</td>
                        <td className="angka">{r.diperbarui}</td>
                        <td className="angka">{r.dilewati}</td>
                        <td className="angka">{r.hilang}</td>
                        <td style={{ color: 'var(--bahaya)', fontSize: 'var(--t-xs)' }}>
                          {r.pesan || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--teks-samar)', fontSize: 'var(--t-sm)' }}>
                Belum pernah dijalankan.
              </p>
            )}
      </div>
    </>
  )
}
