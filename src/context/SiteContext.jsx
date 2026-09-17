import { createContext, useContext } from 'react'
import { publik } from '../lib/api'
import useMuat from '../lib/useMuat'

/**
 * Pengaturan situs — nama klinik, kontak, peta, WhatsApp, dan SEO bawaan.
 *
 * Dimuat sekali di akar lalu dibagikan ke seluruh halaman. Navbar, footer,
 * tombol mengambang, dan halaman kontak semuanya membutuhkannya; memanggil
 * ulang di masing-masing berarti empat permintaan yang isinya sama pada setiap
 * kunjungan.
 */
const Konteks = createContext(null)

/** Nilai sementara sebelum pengaturan termuat, supaya kerangka halaman tidak kosong. */
const AWAL = {
  klinik: { nama: 'Klinik Pratama Andini', alamat: '', kota: '', telepon: '', email: '', jam: '' },
  whatsapp: { aktif: false, nomor: null, salam: '', alasan: null },
  peta: { embed: null, lat: '', lng: '', buka: '' },
  sosial: {},
  merek: { logo: '', favicon: '' },
  beranda: { hero_judul: '', hero_subjudul: '', hero_image: '' },
  seo: { title: '', description: '', og_image: '' },
}

export function SitePenyedia({ children }) {
  const { data, memuat, galat } = useMuat((o) => publik.pengaturan(o), [])

  const nilai = {
    ...(data || AWAL),
    memuat,
    galat,
    /* Rakit tautan WhatsApp di satu tempat.
       Bila nomornya belum diisi, nilainya null dan pemanggil menampilkan
       tombol Telepon — bukan tombol WhatsApp yang mengarah ke mana-mana. */
    tautanWa(pesan) {
      const wa = (data || AWAL).whatsapp
      if (!wa.aktif || !wa.nomor) return null
      const teks = pesan || wa.salam || ''
      return `https://wa.me/${wa.nomor}?text=${encodeURIComponent(teks)}`
    },
  }

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}

export function useSitus() {
  const k = useContext(Konteks)
  if (!k) throw new Error('useSitus harus dipakai di dalam <SitePenyedia>')
  return k
}
