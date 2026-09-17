import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import { SitePenyedia } from './context/SiteContext'
import { AuthPenyedia } from './context/AuthContext'

import Navbar from './components/publik/Navbar'
import Footer from './components/publik/Footer'
import TombolWhatsapp from './components/publik/TombolWhatsapp'
import GulirKeAtas from './components/publik/GulirKeAtas'
import { Memuat } from './components/ui/Dasar'

import Beranda from './pages/publik/Beranda'
import DaftarKonten from './pages/publik/DaftarKonten'
import DetailKonten from './pages/publik/DetailKonten'
import HalamanStatis from './pages/publik/HalamanStatis'
import Dokter from './pages/publik/Dokter'
import Fasilitas from './pages/publik/Fasilitas'
import Kontak from './pages/publik/Kontak'
import Cari from './pages/publik/Cari'
import TidakDitemukan from './pages/publik/TidakDitemukan'

/*
 * CMS dimuat terpisah.
 *
 * Pengunjung situs tidak perlu ikut mengunduh editor teks kaya dan seluruh
 * layar pengelolaan hanya untuk membaca satu artikel — dan bagian itulah yang
 * paling berat.
 */
const Admin = lazy(() => import('./pages/admin/Admin'))

/* Portal pasien (reservasi) juga dimuat terpisah — pengunjung yang cuma
 * membaca halaman publik tak perlu ikut mengunduhnya. */
const Pasien = lazy(() => import('./pages/pasien/Pasien'))

/** Kerangka halaman publik: navbar, isi, footer, tombol mengambang. */
function TataLetakPublik() {
  return (
    <>
      <a className="lewati" href="#isi">Lewati ke isi halaman</a>
      <Navbar />
      <main id="isi">
        <Outlet />
      </main>
      <Footer />
      <TombolWhatsapp />
    </>
  )
}

export default function App() {
  return (
    <SitePenyedia>
      <AuthPenyedia>
        <GulirKeAtas />

        <Routes>
          <Route element={<TataLetakPublik />}>
            <Route index element={<Beranda />} />

            <Route
              path="tentang-kami"
              element={
                <HalamanStatis
                  slug="tentang-kami"
                  judulCadangan="Tentang Kami"
                  keterangan="Profil, visi, dan komitmen pelayanan kami."
                />
              }
            />

            {/* ----------------------------------------------- katalog */}
            <Route
              path="layanan"
              element={
                <DaftarKonten
                  modul="services"
                  judul="Layanan"
                  keterangan="Pemeriksaan dan tindakan yang tersedia di klinik."
                  tipeKategori="service"
                />
              }
            />
            <Route
              path="layanan/:slug"
              element={<DetailKonten modul="services" indukJudul="Layanan" indukKe="/layanan" />}
            />

            <Route
              path="mcu"
              element={
                <DaftarKonten
                  modul="mcu"
                  judul="Medical Check Up"
                  keterangan="Paket pemeriksaan kesehatan berkala untuk pribadi maupun perusahaan."
                  tipeKategori="mcu"
                />
              }
            />
            <Route
              path="mcu/:slug"
              element={<DetailKonten modul="mcu" indukJudul="Medical Check Up" indukKe="/mcu" />}
            />

            <Route
              path="homecare"
              element={
                <DaftarKonten
                  modul="homecare"
                  judul="Homecare"
                  keterangan="Layanan kesehatan yang datang ke rumah Anda."
                  tipeKategori="homecare"
                />
              }
            />
            <Route
              path="homecare/:slug"
              element={<DetailKonten modul="homecare" indukJudul="Homecare" indukKe="/homecare" />}
            />

            {/* --------------------------------------------- informasi */}
            <Route
              path="artikel"
              element={
                <DaftarKonten
                  modul="articles"
                  judul="Artikel Kesehatan"
                  keterangan="Bacaan ringkas seputar kesehatan dari tim klinik."
                  tipeKategori="article"
                />
              }
            />
            <Route
              path="artikel/:slug"
              element={<DetailKonten modul="articles" indukJudul="Artikel Kesehatan" indukKe="/artikel" />}
            />

            <Route
              path="berita"
              element={
                <DaftarKonten
                  modul="news"
                  judul="Berita & Kegiatan"
                  keterangan="Kabar terbaru dan kegiatan klinik."
                  tipeKategori="news"
                />
              }
            />
            <Route
              path="berita/:slug"
              element={<DetailKonten modul="news" indukJudul="Berita & Kegiatan" indukKe="/berita" />}
            />

            <Route
              path="video"
              element={
                <DaftarKonten
                  modul="videos"
                  judul="Video"
                  keterangan="Edukasi dan dokumentasi kegiatan dalam bentuk video."
                  tipeKategori="video"
                />
              }
            />
            <Route
              path="video/:slug"
              element={<DetailKonten modul="videos" indukJudul="Video" indukKe="/video" />}
            />

            <Route path="dokter" element={<Dokter />} />
            <Route path="fasilitas" element={<Fasilitas />} />
            <Route path="kontak" element={<Kontak />} />
            <Route path="cari" element={<Cari />} />

            {/* Menu "Informasi" hanya pembuka submenu, bukan halaman. */}
            <Route path="informasi" element={<Navigate to="/artikel" replace />} />

            <Route path="*" element={<TidakDitemukan />} />
          </Route>

          {/* ----------------------------------------------- Portal pasien */}
          <Route
            path="/pasien/*"
            element={
              <Suspense fallback={<div style={{ padding: 40 }}><Memuat tinggi={200} /></div>}>
                <Pasien />
              </Suspense>
            }
          />

          {/* -------------------------------------------------------- CMS */}
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div style={{ padding: 40 }}><Memuat tinggi={200} /></div>}>
                <Admin />
              </Suspense>
            }
          />
        </Routes>
      </AuthPenyedia>
    </SitePenyedia>
  )
}
