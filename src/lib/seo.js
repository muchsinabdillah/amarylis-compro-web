import { useEffect } from 'react'

/**
 * Judul dan meta halaman.
 *
 * Situs ini satu halaman (SPA), jadi tag di index.html tidak berganti
 * sendiri saat pengunjung berpindah. Tanpa hook ini setiap halaman akan
 * dibagikan ke WhatsApp dengan judul dan gambar yang sama — dan itu justru
 * paling terasa pada halaman yang paling sering dibagikan.
 *
 * CATATAN: perayap yang tidak menjalankan JavaScript tetap melihat isi
 * index.html. Bila peringkat pencarian kelak jadi penting, jawabannya adalah
 * prerender di sisi server, bukan menambah tag lagi di sini.
 */
function setMeta(atribut, nama, isi) {
  if (!isi) return
  let el = document.head.querySelector(`meta[${atribut}="${nama}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(atribut, nama)
    document.head.appendChild(el)
  }
  el.setAttribute('content', isi)
}

export default function useSeo({ judul, deskripsi, gambar, tipe = 'website' } = {}) {
  useEffect(() => {
    const situs = import.meta.env.VITE_SITE_NAME || 'Klinik Pratama Andini'
    const judulPenuh = judul ? `${judul} — ${situs}` : situs

    document.title = judulPenuh

    setMeta('name', 'description', deskripsi)
    setMeta('property', 'og:title', judulPenuh)
    setMeta('property', 'og:description', deskripsi)
    setMeta('property', 'og:type', tipe)
    setMeta('property', 'og:url', window.location.href)
    setMeta('property', 'og:site_name', situs)
    setMeta('name', 'twitter:card', gambar ? 'summary_large_image' : 'summary')
    if (gambar) {
      const absolut = gambar.startsWith('http')
        ? gambar : window.location.origin + gambar
      setMeta('property', 'og:image', absolut)
      setMeta('name', 'twitter:image', absolut)
    }

    let kanonik = document.head.querySelector('link[rel="canonical"]')
    if (!kanonik) {
      kanonik = document.createElement('link')
      kanonik.rel = 'canonical'
      document.head.appendChild(kanonik)
    }
    kanonik.href = window.location.origin + window.location.pathname
  }, [judul, deskripsi, gambar, tipe])
}
