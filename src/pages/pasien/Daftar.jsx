import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePasien } from '../../context/PasienAuthContext'
import { Teks, Pilihan, AreaTeks } from '../../components/ui/Isian'
import { Tombol } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'
import KartuAuth from './KartuAuth'
import { tujuanSetelahMasuk } from './Masuk'

export default function Daftar() {
  const { daftar } = usePasien()
  const navigasi = useNavigate()
  const [f, setF] = useState({
    no_hp: '', nama: '', password: '', tgl_lahir: '', jenis_kelamin: '', alamat: '', nik: '',
  })
  const [galat, setGalat] = useState(null)
  const [perKolom, setPerKolom] = useState({})
  const [kirim, setKirim] = useState(false)

  useSeo({ judul: 'Daftar Akun Pasien' })

  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const kirimForm = async (e) => {
    e.preventDefault()
    setGalat(null); setPerKolom({}); setKirim(true)
    try {
      await daftar(f)
      navigasi(tujuanSetelahMasuk(), { replace: true })
    } catch (err) {
      const pk = err.perKolom || {}
      setPerKolom(pk)
      setGalat(Object.keys(pk).length ? null : err.message)
    } finally {
      setKirim(false)
    }
  }

  return (
    <KartuAuth
      judul="Daftar Akun"
      sub="Buat akun untuk reservasi poliklinik"
      bawah={<>Sudah punya akun? <Link to="/pasien/masuk">Masuk</Link></>}
    >
      <form onSubmit={kirimForm} className="tumpuk">
        {galat && <div className="galat-kotak" role="alert">{galat}</div>}

        <Teks
          label="Nomor HP" type="tel" inputMode="numeric" placeholder="08xxxxxxxxxx"
          required value={f.no_hp} onChange={ubah('no_hp')} galat={perKolom.no_hp}
          bantuan="Dipakai untuk masuk ke akun Anda."
        />
        <Teks label="Nama lengkap" required value={f.nama} onChange={ubah('nama')} galat={perKolom.nama} />
        <Teks
          label="Kata sandi" type="password" autoComplete="new-password"
          required value={f.password} onChange={ubah('password')} galat={perKolom.password}
          bantuan="Minimal 8 karakter."
        />

        <div className="baris" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 150px' }}>
            <Teks label="Tanggal lahir" type="date" value={f.tgl_lahir} onChange={ubah('tgl_lahir')} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <Pilihan
              label="Jenis kelamin" kosong="—"
              opsi={[{ nilai: 'L', label: 'Laki-laki' }, { nilai: 'P', label: 'Perempuan' }]}
              value={f.jenis_kelamin} onChange={ubah('jenis_kelamin')}
            />
          </div>
        </div>

        <Teks label="NIK (opsional)" inputMode="numeric" value={f.nik} onChange={ubah('nik')} galat={perKolom.nik} />
        <AreaTeks label="Alamat (opsional)" baris={2} value={f.alamat} onChange={ubah('alamat')} />

        <Tombol type="submit" penuh memuat={kirim}>Daftar</Tombol>
      </form>
    </KartuAuth>
  )
}
