import { useState } from 'react'
import { admin } from '../../lib/api'
import useSeo from '../../lib/seo'
import { Teks } from '../../components/ui/Isian'
import { Info, Tombol } from '../../components/ui/Dasar'
import { useAuth } from '../../context/AuthContext'

export default function GantiSandi() {
  const { pengguna } = useAuth()
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)
  const [sukses, setSukses] = useState(false)

  useSeo({ judul: 'Ganti Kata Sandi — CMS' })

  const simpan = async (e) => {
    e.preventDefault()
    setGalat(null)
    setSukses(false)

    // Dicocokkan di sini supaya salah ketik tidak perlu menempuh perjalanan
    // ke server untuk ketahuan.
    if (baru !== ulang) {
      setGalat('Kata sandi baru dan ulangannya tidak sama.')
      return
    }

    setKirim(true)
    try {
      await admin.gantiSandi({ sandi_lama: lama, sandi_baru: baru })
      setSukses(true)
      setLama(''); setBaru(''); setUlang('')
    } catch (err) {
      setGalat(err.perKolom?.sandi_lama || err.perKolom?.password || err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <>
      <div className="cms-kepala">
        <div>
          <h1>Ganti Kata Sandi</h1>
          <p>Akun {pengguna?.email}</p>
        </div>
      </div>

      <div className="cms-panel" style={{ maxWidth: 480 }}>
        <form onSubmit={simpan} className="tumpuk">
          {galat && <div className="galat-kotak" role="alert">{galat}</div>}
          {sukses && <Info corak="sukses">Kata sandi berhasil diganti.</Info>}

          <Teks
            label="Kata sandi saat ini"
            type="password"
            autoComplete="current-password"
            wajib
            required
            value={lama}
            onChange={(e) => setLama(e.target.value)}
          />

          <Teks
            label="Kata sandi baru"
            type="password"
            autoComplete="new-password"
            wajib
            required
            value={baru}
            onChange={(e) => setBaru(e.target.value)}
            bantuan="Minimal 12 karakter. Rangkaian beberapa kata lebih aman dan lebih mudah diingat daripada campuran simbol."
          />

          <Teks
            label="Ulangi kata sandi baru"
            type="password"
            autoComplete="new-password"
            wajib
            required
            value={ulang}
            onChange={(e) => setUlang(e.target.value)}
          />

          <div className="baris baris--kanan">
            <Tombol type="submit" memuat={kirim}>Ganti kata sandi</Tombol>
          </div>
        </form>
      </div>
    </>
  )
}
