import { Navigate, Route, Routes } from 'react-router-dom'
import { PerusahaanPenyedia, usePerusahaan } from '../../context/PerusahaanAuthContext'
import { Memuat } from '../../components/ui/Dasar'
import Kerangka from './Kerangka'
import Masuk from './Masuk'
import Dashboard from './Dashboard'
import Unggah from './Unggah'
import DaftarBatch from './DaftarBatch'
import DetailBatch from './DetailBatch'
import Hasil from './Hasil'

function Isi() {
  const { profil, siap } = usePerusahaan()

  if (!siap) return <div style={{ padding: 48 }}><Memuat tinggi={200} /></div>

  // Belum masuk: hanya halaman masuk. Tidak ada pendaftaran mandiri — akun
  // portal dibuatkan petugas klinik di SIMRS.
  if (!profil) {
    return (
      <Routes>
        <Route path="masuk" element={<Masuk />} />
        <Route path="*" element={<Navigate to="/perusahaan/masuk" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Kerangka />}>
        <Route index element={<Dashboard />} />
        <Route path="unggah" element={<Unggah />} />
        <Route path="batch" element={<DaftarBatch />} />
        <Route path="batch/:no" element={<DetailBatch />} />
        <Route path="hasil" element={<Hasil />} />
        <Route path="*" element={<Navigate to="/perusahaan" replace />} />
      </Route>
    </Routes>
  )
}

/* Penyedia sesi dipasang di sini, bukan di App: halaman publik tidak perlu
   ikut memeriksa sesi perusahaan tiap pemuatan. */
export default function Perusahaan() {
  return <PerusahaanPenyedia><Isi /></PerusahaanPenyedia>
}
