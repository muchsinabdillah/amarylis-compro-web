import { Link } from 'react-router-dom'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import { Galat, Info, Lencana, Memuat, StatusKonten } from '../../components/ui/Dasar'
import { LABEL_MODUL } from '../../components/publik/KartuKonten'
import { sejak } from '../../lib/format'

/**
 * Dasbor CMS.
 *
 * Yang ditampilkan lebih dulu bukan angka yang bagus, melainkan hal yang
 * MENUNTUT TINDAKAN: pengaturan yang masih kosong dan sinkronisasi yang gagal.
 * Dasbor yang hanya memamerkan jumlah artikel membuat kekurangan itu tidak
 * pernah terlihat sampai ada yang mengeluh dari luar.
 */
export default function Dasbor() {
  const { data, memuat, galat, muatUlang } = useMuat((o) => admin.dasbor(o), [])

  useSeo({ judul: 'Dasbor CMS' })

  if (memuat) return <Memuat tinggi={110} jumlah={3} />
  if (galat) return <Galat galat={galat} saatUlang={muatUlang} />
  if (!data) return null

  const gagalSinkron = (data.sinkron_terakhir || []).filter((s) => s.status === 'gagal')

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Dasbor</h1>
          <p>Ringkasan isi situs dan hal yang masih perlu dilengkapi.</p>
        </div>
      </div>

      {/* ------------------------------------------------ perlu tindakan */}
      {(data.perlu_dilengkapi?.length > 0 || gagalSinkron.length > 0 || data.dokter?.tayang === 0) && (
        <div className="tumpuk" style={{ marginBottom: 'var(--s-5)' }}>
          {gagalSinkron.length > 0 && (
            <Info corak="bahaya" judul="Sinkronisasi gagal">
              Modul {gagalSinkron.map((s) => s.modul).join(', ')} gagal pada percobaan terakhir.{' '}
              <Link to="/admin/sinkron">Lihat riwayat sinkronisasi</Link>.
            </Info>
          )}

          {Number(data.dokter?.tayang) === 0 && Number(data.dokter?.total) > 0 && (
            <Info corak="awas" judul="Belum ada dokter yang tayang">
              {data.dokter.total} dokter sudah tersinkron dari SIMRS, tetapi belum ada yang
              ditandai tayang, sehingga halaman Dokter di situs masih kosong.{' '}
              <Link to="/admin/dokter">Pilih dokter yang ditampilkan</Link>.
            </Info>
          )}

          {data.perlu_dilengkapi?.length > 0 && (
            <Info corak="awas" judul="Pengaturan yang masih kosong">
              {data.perlu_dilengkapi.map((p) => p.label).join(', ')}.{' '}
              <Link to="/admin/pengaturan">Lengkapi sekarang</Link>.
            </Info>
          )}

          {Number(data.dokter?.hilang) > 0 && (
            <Info corak="info" judul="Dokter yang hilang dari SIMRS">
              {data.dokter.hilang} profil dokter tidak lagi ditemukan di SIMRS. Datanya tetap
              disimpan dan hanya ditandai — periksa apakah masih perlu ditayangkan.
            </Info>
          )}
        </div>
      )}

      {/* -------------------------------------------------------- angka */}
      <div className="angka-kisi">
        {Object.entries(data.konten || {}).map(([modul, k]) => (
          <Link key={modul} to={`/admin/konten/${modul}`} className="angka-kartu" style={{ color: 'inherit' }}>
            <div className="angka-kartu__label">{LABEL_MODUL[modul] || modul}</div>
            <div className="angka-kartu__nilai">{k.terbit}</div>
            <div className="angka-kartu__kaki">
              tayang · {k.draf} draf{k.arsip ? ` · ${k.arsip} arsip` : ''}
            </div>
          </Link>
        ))}

        <Link to="/admin/dokter" className="angka-kartu" style={{ color: 'inherit' }}>
          <div className="angka-kartu__label">Dokter</div>
          <div className="angka-kartu__nilai">{data.dokter?.tayang ?? 0}</div>
          <div className="angka-kartu__kaki">tayang dari {data.dokter?.total ?? 0} tersinkron</div>
        </Link>
      </div>

      {/* ------------------------------------------------------ terbaru */}
      <div className="cms-panel" style={{ marginTop: 'var(--s-5)' }}>
        <h2 className="cms-panel__judul">Terakhir disunting</h2>

        {['articles', 'news', 'videos'].some((m) => data.terbaru?.[m]?.length) ? (
          <div className="geser-x">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Jenis</th>
                  <th>Judul</th>
                  <th>Status</th>
                  <th>Disunting</th>
                </tr>
              </thead>
              <tbody>
                {['articles', 'news', 'videos'].flatMap((modul) =>
                  (data.terbaru?.[modul] || []).map((r) => (
                    <tr key={`${modul}-${r.id}`}>
                      <td><Lencana corak="abu">{LABEL_MODUL[modul]}</Lencana></td>
                      <td><Link to={`/admin/konten/${modul}/${r.id}`}>{r.judul}</Link></td>
                      <td><StatusKonten status={r.status} /></td>
                      <td>{sejak(r.updated_at)}</td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--teks-samar)', fontSize: 'var(--t-sm)' }}>
            Belum ada artikel, berita, atau video yang dibuat.
          </p>
        )}
      </div>

      {/* ------------------------------------------------------ sinkron */}
      <div className="cms-panel">
        <h2 className="cms-panel__judul">Sinkronisasi terakhir</h2>

        {data.sinkron_terakhir?.length ? (
          <div className="geser-x">
            <table className="tabel">
              <thead>
                <tr>
                  <th>Modul</th>
                  <th>Status</th>
                  <th className="angka">Baru</th>
                  <th className="angka">Diperbarui</th>
                  <th className="angka">Dilewati</th>
                  <th className="angka">Hilang</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {data.sinkron_terakhir.map((s) => (
                  <tr key={s.modul}>
                    <td>{s.modul}</td>
                    <td>
                      <Lencana corak={s.status === 'selesai' ? 'sukses' : 'bahaya'}>
                        {s.status === 'selesai' ? 'Berhasil' : 'Gagal'}
                      </Lencana>
                    </td>
                    <td className="angka">{s.baru}</td>
                    <td className="angka">{s.diperbarui}</td>
                    <td className="angka">{s.dilewati}</td>
                    <td className="angka">{s.hilang}</td>
                    <td>{sejak(s.selesai_at || s.mulai_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--teks-samar)', fontSize: 'var(--t-sm)' }}>
            Belum pernah disinkronkan. <Link to="/admin/sinkron">Jalankan sekarang</Link>.
          </p>
        )}
      </div>
    </>
  )
}
