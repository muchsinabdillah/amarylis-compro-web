import { useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import Konfirmasi from '../../components/admin/Konfirmasi'
import { Centang, Teks } from '../../components/ui/Isian'
import { Galat, Info, Lencana, Memuat, Tombol } from '../../components/ui/Dasar'
import { sejak, tanggalJam } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'

export default function Pengguna() {
  const { pengguna: saya } = useAuth()
  const daftar = useMuat((o) => admin.pengguna(o), [])
  const peran = useMuat((o) => admin.peran(o), [])

  const [buat, setBuat] = useState(false)
  const [sunting, setSunting] = useState(null)
  const [sandiUntuk, setSandiUntuk] = useState(null)
  const [akanHapus, setAkanHapus] = useState(null)
  const [galatAksi, setGalatAksi] = useState(null)

  useSeo({ judul: 'Pengguna — CMS' })

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Pengguna &amp; Peran</h1>
          <p>Akun yang dapat masuk ke CMS dan wewenang masing-masing.</p>
        </div>
        <Tombol onClick={() => setBuat(true)}>+ Tambah pengguna</Tombol>
      </div>

      {galatAksi && (
        <div className="galat-kotak" role="alert" style={{ marginBottom: 'var(--s-4)' }}>
          {galatAksi}
        </div>
      )}

      <div className="cms-panel">
        {daftar.memuat ? <Memuat tinggi={44} jumlah={3} />
          : daftar.galat ? <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />
            : (
              <div className="geser-x">
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Peran</th>
                      <th>Status</th>
                      <th>Terakhir masuk</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {(daftar.data || []).map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.nama}</strong>
                          {u.id === saya?.sub && (
                            <span className="lencana lencana--info" style={{ marginLeft: 8 }}>Anda</span>
                          )}
                        </td>
                        <td>{u.email}</td>
                        <td>{u.peran}</td>
                        <td>
                          {u.is_active
                            ? <Lencana corak="sukses">Aktif</Lencana>
                            : <Lencana corak="abu">Nonaktif</Lencana>}
                        </td>
                        <td>{u.last_login ? sejak(u.last_login) : 'Belum pernah'}</td>
                        <td>
                          <div className="tabel__aksi">
                            <Tombol corak="garis" ukuran="kecil" onClick={() => setSunting(u)}>
                              Sunting
                            </Tombol>
                            <Tombol corak="polos" ukuran="kecil" onClick={() => setSandiUntuk(u)}>
                              Setel sandi
                            </Tombol>
                            {/* Akun sendiri tidak dapat dihapus dari sini —
                                server pun menolaknya. */}
                            {u.id !== saya?.sub && (
                              <Tombol
                                corak="polos"
                                ukuran="kecil"
                                onClick={() => { setGalatAksi(null); setAkanHapus(u) }}
                              >
                                Hapus
                              </Tombol>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
      </div>

      <div className="cms-panel">
        <h2 className="cms-panel__judul">Peran dan wewenangnya</h2>
        {peran.memuat ? <Memuat tinggi={60} jumlah={2} /> : (
          <div className="tumpuk">
            {(peran.data?.peran || []).map((r) => (
              <div key={r.id}>
                <strong>{r.nama}</strong>{' '}
                <code style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>{r.kode}</code>
                <div style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)' }}>{r.keterangan}</div>
                <div className="baris" style={{ gap: 4, marginTop: 6 }}>
                  {r.izin.map((i) => <Lencana key={i} corak="abu">{i}</Lencana>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {buat && (
        <FormPengguna
          peran={peran.data?.peran || []}
          saatTutup={() => setBuat(false)}
          saatSimpan={() => { setBuat(false); daftar.muatUlang() }}
        />
      )}

      {sunting && (
        <FormPengguna
          awal={sunting}
          peran={peran.data?.peran || []}
          diriSendiri={sunting.id === saya?.sub}
          saatTutup={() => setSunting(null)}
          saatSimpan={() => { setSunting(null); daftar.muatUlang() }}
        />
      )}

      {sandiUntuk && (
        <FormSandi
          pengguna={sandiUntuk}
          saatTutup={() => setSandiUntuk(null)}
          saatSimpan={() => setSandiUntuk(null)}
        />
      )}

      <Konfirmasi
        buka={!!akanHapus}
        judul="Hapus akun ini?"
        pesan={akanHapus
          ? `${akanHapus.nama} (${akanHapus.email}) tidak akan bisa masuk lagi. Konten yang pernah dibuatnya tetap ada.`
          : ''}
        labelYa="Hapus akun"
        saatBatal={() => setAkanHapus(null)}
        saatYa={async () => {
          try {
            await admin.penggunaHapus(akanHapus.id)
            setAkanHapus(null)
            daftar.muatUlang()
          } catch (e) {
            setGalatAksi(e.perKolom?.pengguna || e.message)
            setAkanHapus(null)
          }
        }}
      />
    </>
  )
}

function FormPengguna({ awal, peran, diriSendiri, saatTutup, saatSimpan }) {
  const baru = !awal
  const [f, setF] = useState(awal || { is_active: true, kode_peran: [] })
  const [sandi, setSandi] = useState('')
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)

  const togglePeran = (kode) => {
    setF((s) => {
      const ada = (s.kode_peran || []).includes(kode)
      return {
        ...s,
        kode_peran: ada
          ? s.kode_peran.filter((k) => k !== kode)
          : [...(s.kode_peran || []), kode],
      }
    })
  }

  const simpan = async (e) => {
    e.preventDefault()
    setKirim(true)
    setGalat(null)
    try {
      if (baru) {
        await admin.penggunaBuat({
          nama: f.nama, email: f.email, password: sandi, peran: f.kode_peran,
        })
      } else {
        const isi = { nama: f.nama }
        // Peran dan status akun sendiri sengaja tidak dikirim: server
        // menolaknya, dan mengirimkannya hanya menghasilkan galat yang
        // membingungkan.
        if (!diriSendiri) {
          isi.is_active = !!f.is_active
          isi.peran = f.kode_peran
        }
        await admin.penggunaUbah(awal.id, isi)
      }
      saatSimpan()
    } catch (err) {
      setGalat(err.perKolom?.email || err.perKolom?.password
        || err.perKolom?.peran || err.perKolom?.pengguna || err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={baru ? 'Tambah pengguna' : 'Sunting pengguna'}
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
          width: '100%', maxWidth: 520, padding: 'var(--s-5)',
          maxHeight: '88vh', overflowY: 'auto',
          boxShadow: 'var(--bayang-3)',
        }}
      >
        <h2 style={{ fontSize: 'var(--t-lg)' }}>{baru ? 'Tambah pengguna' : 'Sunting pengguna'}</h2>

        {galat && <div className="galat-kotak" role="alert">{galat}</div>}

        <Teks
          label="Nama lengkap"
          wajib
          required
          value={f.nama || ''}
          onChange={(e) => setF((s) => ({ ...s, nama: e.target.value }))}
        />

        <Teks
          label="Email"
          type="email"
          wajib
          required={baru}
          value={f.email || ''}
          onChange={(e) => setF((s) => ({ ...s, email: e.target.value }))}
          disabled={!baru}
          bantuan={baru ? 'Dipakai untuk masuk.' : 'Email tidak dapat diubah.'}
        />

        {baru && (
          <Teks
            label="Kata sandi"
            type="password"
            wajib
            required
            autoComplete="new-password"
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
            bantuan="Minimal 12 karakter. Rangkaian beberapa kata lebih aman dan lebih mudah diingat."
          />
        )}

        <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>Peran</span>
          {diriSendiri ? (
            <Info corak="info">
              Anda tidak dapat mengubah peran atau menonaktifkan akun Anda sendiri. Minta Super
              Admin lain melakukannya.
            </Info>
          ) : peran.map((r) => (
            <Centang
              key={r.kode}
              label={r.nama}
              keterangan={r.keterangan}
              checked={(f.kode_peran || []).includes(r.kode)}
              onChange={() => togglePeran(r.kode)}
            />
          ))}
        </div>

        {!baru && !diriSendiri && (
          <Centang
            label="Akun aktif"
            keterangan="Akun nonaktif tidak dapat masuk."
            checked={!!f.is_active}
            onChange={(e) => setF((s) => ({ ...s, is_active: e.target.checked }))}
          />
        )}

        {!baru && awal.created_at && (
          <small style={{ color: 'var(--teks-samar)' }}>
            Dibuat {tanggalJam(awal.created_at)}
          </small>
        )}

        <div className="baris baris--kanan">
          <button type="button" className="btn btn--garis" onClick={saatTutup}>Batal</button>
          <Tombol type="submit" memuat={kirim}>Simpan</Tombol>
        </div>
      </form>
    </div>
  )
}

function FormSandi({ pengguna, saatTutup, saatSimpan }) {
  const [sandi, setSandi] = useState('')
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)
  const [sukses, setSukses] = useState(false)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Setel ulang kata sandi"
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
          setGalat(null)
          try {
            await admin.penggunaSandi(pengguna.id, sandi)
            setSukses(true)
          } catch (err) {
            setGalat(err.perKolom?.password || err.message)
          } finally {
            setKirim(false)
          }
        }}
      >
        <h2 style={{ fontSize: 'var(--t-lg)' }}>Setel ulang kata sandi</h2>
        <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)' }}>
          Untuk akun <strong>{pengguna.nama}</strong> ({pengguna.email}).
        </p>

        {galat && <div className="galat-kotak" role="alert">{galat}</div>}

        {sukses ? (
          <>
            <Info corak="sukses">
              Kata sandi berhasil disetel. Sampaikan kepada yang bersangkutan lewat saluran yang
              aman, dan minta ia menggantinya setelah masuk.
            </Info>
            <div className="baris baris--kanan">
              <Tombol onClick={saatSimpan}>Selesai</Tombol>
            </div>
          </>
        ) : (
          <>
            <Teks
              label="Kata sandi baru"
              type="password"
              wajib
              required
              autoComplete="new-password"
              value={sandi}
              onChange={(e) => setSandi(e.target.value)}
              bantuan="Minimal 12 karakter."
            />
            <div className="baris baris--kanan">
              <button type="button" className="btn btn--garis" onClick={saatTutup}>Batal</button>
              <Tombol type="submit" memuat={kirim}>Setel sandi</Tombol>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
