import { useEffect, useRef, useState } from 'react'
import { Tombol } from '../ui/Dasar'

/**
 * Kotak konfirmasi untuk tindakan yang tidak dapat dibatalkan.
 *
 * `window.confirm` diblokir sebagian peramban dan tidak dapat menyebutkan
 * konsekuensinya dengan jelas. Yang di sini menyebut nama entrinya, sehingga
 * orang tahu persis apa yang akan hilang — bukan sekadar "Anda yakin?".
 */
export default function Konfirmasi({
  buka, judul, pesan, labelYa = 'Ya, lanjutkan', corakYa = 'bahaya',
  saatYa, saatBatal,
}) {
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState(null)
  const tombolBatal = useRef(null)

  // Fokus pindah ke tombol Batal, bukan ke tombol merah: Enter yang refleks
  // ditekan tidak boleh langsung menghapus sesuatu.
  useEffect(() => {
    if (buka) {
      setGalat(null)
      tombolBatal.current?.focus()
    }
  }, [buka])

  useEffect(() => {
    if (!buka) return undefined
    const saatEsc = (e) => { if (e.key === 'Escape') saatBatal?.() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', saatEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', saatEsc)
    }
  }, [buka, saatBatal])

  if (!buka) return null

  const jalankan = async () => {
    setSibuk(true)
    setGalat(null)
    try {
      await saatYa()
    } catch (e) {
      setGalat(e.message || 'Tindakan gagal dijalankan.')
    } finally {
      setSibuk(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="konfirmasi-judul"
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(8, 34, 28, 0.5)',
        display: 'grid', placeItems: 'center', padding: 'var(--s-4)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !sibuk) saatBatal?.() }}
    >
      <div
        style={{
          background: 'var(--putih)', borderRadius: 'var(--r-lg)',
          padding: 'var(--s-5)', maxWidth: 440, width: '100%',
          boxShadow: 'var(--bayang-3)',
        }}
      >
        <h2 id="konfirmasi-judul" style={{ fontSize: 'var(--t-lg)' }}>{judul}</h2>
        {pesan && (
          <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 'var(--s-3)' }}>
            {pesan}
          </p>
        )}

        {galat && (
          <div className="galat-kotak" role="alert" style={{ marginTop: 'var(--s-4)' }}>{galat}</div>
        )}

        <div className="baris baris--kanan" style={{ marginTop: 'var(--s-5)' }}>
          <button
            ref={tombolBatal}
            type="button"
            className="btn btn--garis"
            onClick={saatBatal}
            disabled={sibuk}
          >
            Batal
          </button>
          <Tombol corak={corakYa} onClick={jalankan} memuat={sibuk}>{labelYa}</Tombol>
        </div>
      </div>
    </div>
  )
}
