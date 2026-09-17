import { useState } from 'react'

/**
 * Tombol berbagi.
 *
 * Memakai Web Share API bila peramban mendukungnya — di ponsel itu membuka
 * daftar aplikasi yang benar-benar terpasang, jauh lebih berguna daripada
 * empat ikon tetap. Peramban desktop yang tidak mendukungnya mendapat tautan
 * satu per satu.
 *
 * Tidak ada skrip pihak ketiga: tombol berbagi bawaan platform hampir selalu
 * membawa pelacak, dan halaman klinik tidak seharusnya melaporkan siapa
 * membaca apa kepada siapa pun.
 */
export default function BagikanSosial({ judul, url, ringkas }) {
  const [disalin, setDisalin] = useState(false)
  const alamat = url || (typeof window !== 'undefined' ? window.location.href : '')
  const teks = `${judul}${ringkas ? ` — ${ringkas}` : ''}`

  const bawaan = typeof navigator !== 'undefined' && !!navigator.share

  const bagikanBawaan = async () => {
    try {
      await navigator.share({ title: judul, text: teks, url: alamat })
    } catch {
      // Pengunjung membatalkan; bukan kegagalan yang perlu dilaporkan.
    }
  }

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(alamat)
      setDisalin(true)
      setTimeout(() => setDisalin(false), 2200)
    } catch {
      // Peramban tanpa izin papan klik: pengunjung masih bisa menyalin dari
      // bilah alamat, jadi tidak perlu pesan galat yang mengganggu.
    }
  }

  const tautan = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${teks}\n${alamat}`)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(alamat)}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(alamat)}` },
    { label: 'Telegram', href: `https://t.me/share/url?url=${encodeURIComponent(alamat)}&text=${encodeURIComponent(teks)}` },
  ]

  return (
    <div className="baris tanpa-cetak" style={{ gap: 'var(--s-2)' }}>
      <span style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--teks-lembut)' }}>
        Bagikan:
      </span>

      {bawaan ? (
        <button type="button" className="btn btn--garis btn--kecil" onClick={bagikanBawaan}>
          Bagikan…
        </button>
      ) : (
        tautan.map((t) => (
          <a
            key={t.label}
            className="btn btn--garis btn--kecil"
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.label}
          </a>
        ))
      )}

      <button type="button" className="btn btn--polos btn--kecil" onClick={salin}>
        {disalin ? '✓ Tautan disalin' : 'Salin tautan'}
      </button>
    </div>
  )
}
