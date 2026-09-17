import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Memuat } from '../../components/ui/Dasar'
import Kerangka from '../../components/admin/Kerangka'

import Masuk from './Masuk'
import Dasbor from './Dasbor'
import DaftarKonten from './DaftarKonten'
import FormKonten from './FormKonten'
import DokterAdmin from './DokterAdmin'
import Sinkron from './Sinkron'
import Halaman from './Halaman'
import FasilitasAdmin from './FasilitasAdmin'
import ReservasiAdmin from './ReservasiAdmin'
import PesananAdmin from './PesananAdmin'
import Kategori from './Kategori'
import Media from './Media'
import Pengaturan from './Pengaturan'
import Pengguna from './Pengguna'
import GantiSandi from './GantiSandi'

/**
 * Akar CMS.
 *
 * Rute dijaga di satu tempat, bukan di masing-masing halaman: penjaga yang
 * ditulis ulang di setiap layar cepat atau lambat terlewat pada layar
 * berikutnya, dan yang terlewat itu tidak menampilkan gejala apa pun sampai
 * seseorang menemukannya.
 *
 * Penjaga di sini hanya mengatur APA YANG TAMPIL. Wewenang sebenarnya
 * ditegakkan server pada setiap permintaan.
 */
export default function Admin() {
  const { pengguna, siap } = useAuth()

  if (!siap) {
    return <div style={{ padding: 40, maxWidth: 420, margin: '0 auto' }}><Memuat tinggi={120} /></div>
  }

  if (!pengguna) {
    return (
      <Routes>
        <Route path="masuk" element={<Masuk />} />
        <Route path="*" element={<Navigate to="/admin/masuk" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="masuk" element={<Navigate to="/admin" replace />} />

      <Route element={<Kerangka />}>
        <Route index element={<Dasbor />} />

        <Route path="konten/:modul" element={<DaftarKonten />} />
        <Route path="konten/:modul/baru" element={<FormKonten />} />
        <Route path="konten/:modul/:id" element={<FormKonten />} />

        <Route path="dokter" element={<DokterAdmin />} />
        <Route path="sinkron" element={<Sinkron />} />
        <Route path="halaman" element={<Halaman />} />
        <Route path="fasilitas" element={<FasilitasAdmin />} />
        <Route path="reservasi" element={<ReservasiAdmin />} />
        <Route path="pesanan" element={<PesananAdmin />} />
        <Route path="kategori" element={<Kategori />} />
        <Route path="media" element={<Media />} />
        <Route path="pengaturan" element={<Pengaturan />} />
        <Route path="pengguna" element={<Pengguna />} />
        <Route path="sandi" element={<GantiSandi />} />

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
