import { useEffect, useRef, useState } from 'react'

/**
 * Membungkus isi agar "muncul" (fade + naik) saat masuk ke layar.
 *
 * Memakai IntersectionObserver — hemat, sekali picu lalu berhenti mengamati.
 * Bila API tak tersedia atau pengguna meminta kurangi gerak, isi langsung
 * tampil (kelas .reveal sudah menangani prefers-reduced-motion).
 */
export default function Reveal({ children, jeda = 0, sebagai: Tag = 'div', className = '', ...sisa }) {
  const ref = useRef(null)
  const [tampil, setTampil] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setTampil(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTampil(true); io.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const kelas = ['reveal', jeda ? `reveal--${jeda}` : '', tampil ? 'tampil' : '', className]
    .filter(Boolean).join(' ')
  return <Tag ref={ref} className={kelas} {...sisa}>{children}</Tag>
}
