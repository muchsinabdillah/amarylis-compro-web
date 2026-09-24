import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSitus } from '../../context/SiteContext'
import { publik } from '../../lib/api'
import { tautanTelepon } from '../../lib/format'

/**
 * Tombol mengambang untuk menghubungi klinik.
 *
 * Bila nomor WhatsApp belum diisi di CMS, yang muncul adalah tombol Telepon —
 * bukan tombol WhatsApp yang mengarah ke nomor tak terdaftar. Tombol yang
 * gagal seperti itu tidak pernah terlihat oleh klinik, hanya oleh calon pasien
 * yang lalu pergi.
 *
 * Tidak muncul sama sekali di halaman CMS.
 */
export default function TombolWhatsapp() {
  const { klinik, whatsapp, tautanWa } = useSitus()
  const [tampil, setTampil] = useState(false)
  const lokasi = useLocation()

  // Ditampilkan setelah pengunjung menggulir sedikit: di layar pertama ia
  // menutupi isi yang justru sedang dibaca.
  useEffect(() => {
    const saatGulir = () => setTampil(window.scrollY > 320)
    saatGulir()
    window.addEventListener('scroll', saatGulir, { passive: true })
    return () => window.removeEventListener('scroll', saatGulir)
  }, [])

  if (lokasi.pathname.startsWith('/admin')) return null

  const wa = tautanWa(`Hallo ${klinik.nama}, saya ingin bertanya mengenai layanan klinik.`)
  const tel = tautanTelepon(klinik.telepon)
  if (!wa && !tel) return null

  const gaya = {
    position: 'fixed',
    right: 'var(--s-4)',
    /*
     * Di layar sempit ada bilah navigasi bawah setinggi 56px; tanpa
     * pengangkatan ini tombolnya duduk persis di atas tombol Profil dan
     * keduanya saling merebut sentuhan. Di layar lebar bilah itu tidak ada,
     * jadi jaraknya kembali seperti semula.
     */
    bottom: 'calc(var(--s-4) + var(--tinggi-navbawah, 0px) + env(safe-area-inset-bottom, 0px))',
    zIndex: 90,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--s-2)',
    padding: '0.85rem 1.15rem',
    borderRadius: 'var(--r-bulat)',
    background: wa ? '#1FA855' : 'var(--hijau-700)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 'var(--t-sm)',
    boxShadow: 'var(--bayang-3)',
    transform: tampil ? 'translateY(0)' : 'translateY(140%)',
    opacity: tampil ? 1 : 0,
    transition: 'transform var(--gerak), opacity var(--gerak)',
    pointerEvents: tampil ? 'auto' : 'none',
  }

  const catat = () => publik.lead({
    tipe: 'mengambang',
    judul: wa ? 'Tombol WhatsApp mengambang' : 'Tombol telepon mengambang',
    halaman: lokasi.pathname,
  })

  return (
    <a
      className="tanpa-cetak"
      href={wa || tel}
      target={wa ? '_blank' : undefined}
      rel={wa ? 'noopener noreferrer' : undefined}
      style={gaya}
      onClick={catat}
      aria-label={wa ? 'Hubungi klinik lewat WhatsApp' : 'Telepon klinik'}
      title={!wa && whatsapp.alasan ? whatsapp.alasan : undefined}
    >
      <span aria-hidden="true" style={{ fontSize: '1.1em' }}>{wa ? '💬' : '📞'}</span>
      <span>{wa ? 'Chat WhatsApp' : 'Telepon Klinik'}</span>
    </a>
  )
}
