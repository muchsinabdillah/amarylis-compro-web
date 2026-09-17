import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PasienPenyedia, usePasien } from '../../context/PasienAuthContext'
import { Memuat } from '../../components/ui/Dasar'
import Kerangka from './Kerangka'
import Masuk from './Masuk'
import Daftar from './Daftar'
import Dashboard from './Dashboard'
import ReservasiBaru from './ReservasiBaru'
import Paket from './Paket'
import Pesanan from './Pesanan'
import VerifikasiRM from './VerifikasiRM'

function Isi() {
  const { profil, siap } = usePasien()
  const [lewatiVerif, setLewatiVerif] = useState(() => {
    try { return sessionStorage.getItem('pasien.verif.lewati') === '1' } catch { return false }
  })

  if (!siap) return <div style={{ padding: 48 }}><Memuat tinggi={200} /></div>

  // Belum masuk: hanya halaman masuk & daftar. Tujuan (mis. deep-link reservasi
  // dari halaman dokter) disimpan agar bisa dilanjutkan setelah login.
  if (!profil) {
    return (
      <Routes>
        <Route path="masuk" element={<Masuk />} />
        <Route path="daftar" element={<Daftar />} />
        <Route path="*" element={<SimpanLaluMasuk />} />
      </Routes>
    )
  }

  // Gerbang saat awal masuk: verifikasi rekam medik bila No. RM belum tertaut.
  if (!profil.no_mr && !lewatiVerif) {
    return <VerifikasiRM onSelesai={() => setLewatiVerif(true)} />
  }

  // Sudah masuk: portal berkerangka.
  return (
    <Routes>
      <Route element={<Kerangka />}>
        <Route index element={<Dashboard />} />
        <Route path="reservasi/baru" element={<ReservasiBaru />} />
        <Route path="paket" element={<Paket />} />
        <Route path="pesanan" element={<Pesanan />} />
        <Route path="*" element={<Navigate to="/pasien" replace />} />
      </Route>
    </Routes>
  )
}

/** Simpan tujuan (deep-link) lalu arahkan ke halaman masuk. */
function SimpanLaluMasuk() {
  const loc = useLocation()
  useEffect(() => {
    try {
      if (loc.pathname !== '/pasien') sessionStorage.setItem('pasien.next', loc.pathname + loc.search)
    } catch { /* abaikan */ }
  }, [loc])
  return <Navigate to="/pasien/masuk" replace />
}

export default function Pasien() {
  return (
    <PasienPenyedia>
      <Isi />
    </PasienPenyedia>
  )
}
