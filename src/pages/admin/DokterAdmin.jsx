import { useEffect, useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import Editor from '../../components/admin/Editor'
import IsianGambar from '../../components/admin/IsianGambar'
import { Centang, Teks } from '../../components/ui/Isian'
import { Galat, Info, Lencana, Memuat, Tombol } from '../../components/ui/Dasar'
import { sejak } from '../../lib/format'

/**
 * Profil dokter.
 *
 * Datanya berasal dari SIMRS, tetapi yang tayang di situs adalah keputusan
 * klinik. Dua hal yang harus terus terang di layar ini:
 *
 *   1. Kolom yang disunting di sini menjadi TERKUNCI dan tidak lagi ditimpa
 *      sinkronisasi. Bila itu tidak terlihat, orang akan mengira suntingannya
 *      hilang sendiri — atau sebaliknya, mengira nama di SIMRS ikut berubah.
 *   2. Baris yang hilang dari SIMRS tidak dihapus, hanya ditandai.
 */
export default function DokterAdmin() {
  const { data, memuat, galat, muatUlang } = useMuat((o) => admin.dokter(o), [])
  const [pilih, setPilih] = useState(null)

  useSeo({ judul: 'Dokter — CMS' })

  if (memuat) return <Memuat tinggi={60} jumlah={5} />
  if (galat) return <Galat galat={galat} saatUlang={muatUlang} />

  const tayang = (data || []).filter((d) => d.is_published).length

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Dokter</h1>
          <p>
            {tayang} dari {data?.length || 0} dokter ditampilkan di situs. Data dasar berasal
            dari SIMRS dan tidak dapat diubah dari sini kecuali dengan menguncinya.
          </p>
        </div>
        <Tombol ke="/admin/sinkron" corak="garis">Sinkronkan dari SIMRS</Tombol>
      </div>

      <div className="cms-panel">
        <div className="geser-x">
          <table className="tabel">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Spesialis</th>
                <th>Status SIMRS</th>
                <th>Tayang</th>
                <th>Kolom terkunci</th>
                <th>Disinkron</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data || []).map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.nama}</strong>
                    {d.gelar && (
                      <div style={{ color: 'var(--teks-samar)', fontSize: 'var(--t-xs)' }}>{d.gelar}</div>
                    )}
                  </td>
                  <td>{d.spesialis || '—'}</td>
                  <td>
                    {d.sync_status === 'hilang_di_simrs'
                      ? <Lencana corak="bahaya">Hilang di SIMRS</Lencana>
                      : d.aktif_simrs
                        ? <Lencana corak="sukses">Aktif</Lencana>
                        : <Lencana corak="abu">Nonaktif</Lencana>}
                  </td>
                  <td>
                    {d.is_published
                      ? <Lencana corak="sukses">Tayang</Lencana>
                      : <Lencana corak="awas">Belum</Lencana>}
                  </td>
                  <td>
                    {d.field_locks?.length
                      ? d.field_locks.map((k) => <Lencana key={k} corak="info">{k}</Lencana>)
                      : <span style={{ color: 'var(--teks-samar)' }}>—</span>}
                  </td>
                  <td>{sejak(d.synced_at)}</td>
                  <td>
                    <div className="tabel__aksi">
                      <Tombol corak="garis" ukuran="kecil" onClick={() => setPilih(d)}>
                        Sunting profil
                      </Tombol>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!data?.length && (
          <p style={{ color: 'var(--teks-samar)', fontSize: 'var(--t-sm)' }}>
            Belum ada data dokter. Jalankan sinkronisasi terlebih dahulu.
          </p>
        )}
      </div>

      {pilih && (
        <FormDokter
          dokter={pilih}
          saatTutup={() => setPilih(null)}
          saatSimpan={() => { setPilih(null); muatUlang() }}
        />
      )}
    </>
  )
}

function FormDokter({ dokter, saatTutup, saatSimpan }) {
  const [f, setF] = useState(dokter)
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)

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

  const berubahDariSimrs = ['nama', 'gelar', 'spesialis']
    .filter((k) => (f[k] || '') !== (dokter[k] || ''))

  const simpan = async (e) => {
    e.preventDefault()
    setKirim(true)
    setGalat(null)
    try {
      await admin.simpanDokter(dokter.id, {
        nama: f.nama,
        gelar: f.gelar,
        spesialis: f.spesialis,
        foto: f.foto || '',
        bio: f.bio || '',
        pendidikan: f.pendidikan || '',
        pengalaman: f.pengalaman || '',
        is_published: !!f.is_published,
        urutan: Number(f.urutan) || 0,
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
      aria-label={`Sunting profil ${dokter.nama}`}
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
          width: '100%', maxWidth: 720, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--bayang-3)', overflow: 'hidden',
        }}
      >
        <div
          className="baris baris--antara"
          style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--garis)' }}
        >
          <h2 style={{ fontSize: 'var(--t-lg)' }}>Profil dokter</h2>
          <button type="button" className="btn btn--polos btn--kecil" onClick={saatTutup}>Tutup</button>
        </div>

        <div className="tumpuk" style={{ padding: 'var(--s-5)', overflowY: 'auto' }}>
          {galat && <div className="galat-kotak" role="alert">{galat}</div>}

          {dokter.sync_status === 'hilang_di_simrs' && (
            <Info corak="awas" judul="Tidak ditemukan lagi di SIMRS">
              Dokter ini sudah tidak ada di master SIMRS. Datanya tetap disimpan agar foto dan
              biografi tidak hilang, tetapi sebaiknya jangan ditayangkan bila memang sudah tidak
              praktik.
            </Info>
          )}

          {berubahDariSimrs.length > 0 && (
            <Info corak="info" judul="Kolom ini akan dikunci">
              {berubahDariSimrs.join(', ')} berbeda dari data SIMRS. Setelah disimpan, kolom itu
              tidak akan ditimpa lagi oleh sinkronisasi berikutnya — perubahan di SIMRS tidak akan
              tercermin di situs sampai kuncinya dilepas.
            </Info>
          )}

          <Centang
            label="Tampilkan di situs"
            keterangan="Dokter yang tidak ditandai tidak muncul di halaman Dokter."
            checked={!!f.is_published}
            onChange={(e) => set('is_published')(e.target.checked)}
          />

          <Teks label="Nama tampil" value={f.nama || ''} onChange={setEv('nama')} />
          <Teks label="Gelar / jabatan" value={f.gelar || ''} onChange={setEv('gelar')} />
          <Teks label="Spesialisasi" value={f.spesialis || ''} onChange={setEv('spesialis')} />
          <Teks
            label="Urutan tampil"
            type="number"
            value={f.urutan ?? 0}
            onChange={(e) => set('urutan')(Number(e.target.value))}
          />

          <IsianGambar
            label="Foto"
            nilai={f.foto || ''}
            saatUbah={set('foto')}
            bantuan="Potret tegak, wajah terlihat jelas. Ukuran ideal 600×800."
          />

          <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>Biografi singkat</span>
            <Editor nilai={f.bio || ''} saatUbah={set('bio')} tinggiMin={140} />
          </div>

          <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>Pendidikan</span>
            <Editor nilai={f.pendidikan || ''} saatUbah={set('pendidikan')} tinggiMin={120} />
          </div>

          <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>Pengalaman</span>
            <Editor nilai={f.pengalaman || ''} saatUbah={set('pengalaman')} tinggiMin={120} />
          </div>

          <Info corak="info">
            Jadwal praktik tidak disunting di sini. Jadwal selalu mengikuti SIMRS supaya tidak
            pernah ada dua versi jam praktik yang berbeda.
          </Info>
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
