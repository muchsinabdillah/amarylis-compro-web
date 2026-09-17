import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Setiap perpindahan halaman dimulai dari atas.
 *
 * Tanpa ini, membuka artikel dari tengah daftar mendaratkan pembaca di tengah
 * artikel — dan itu terbaca seperti halaman yang gagal termuat.
 */
export default function GulirKeAtas() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [pathname, search])

  return null
}
