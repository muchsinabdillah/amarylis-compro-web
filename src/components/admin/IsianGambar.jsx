import { useState } from 'react'
import PilihMedia from './PilihMedia'
import { Tombol } from '../ui/Dasar'

/**
 * Isian untuk satu gambar (thumbnail, hero, foto dokter).
 *
 * Menyimpan URL, bukan berkas. Gambar yang sama dengan begitu dapat dipakai
 * beberapa tempat tanpa diunggah berulang, dan menggantinya di pustaka
 * mengganti semuanya sekaligus.
 */
export default function IsianGambar({ label, nilai, saatUbah, bantuan }) {
  const [buka, setBuka] = useState(false)

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
      <span style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>{label}</span>

      {nilai ? (
        <div className="baris" style={{ alignItems: 'flex-start', gap: 'var(--s-3)' }}>
          <img
            src={nilai}
            alt=""
            style={{
              width: 140, aspectRatio: '4 / 3', objectFit: 'cover',
              borderRadius: 'var(--r-md)', border: '1px solid var(--garis)',
            }}
          />
          <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
            <Tombol corak="garis" ukuran="kecil" onClick={() => setBuka(true)}>Ganti</Tombol>
            <Tombol corak="polos" ukuran="kecil" onClick={() => saatUbah('')}>Hapus</Tombol>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setBuka(true)}
          style={{
            width: '100%', padding: 'var(--s-5)',
            border: '1px dashed var(--garis-tegas)', borderRadius: 'var(--r-md)',
            background: 'var(--latar-lembut)', color: 'var(--teks-lembut)',
            fontSize: 'var(--t-sm)', cursor: 'pointer',
          }}
        >
          + Pilih atau unggah gambar
        </button>
      )}

      {bantuan && <small style={{ color: 'var(--teks-samar)' }}>{bantuan}</small>}

      <PilihMedia
        buka={buka}
        saatTutup={() => setBuka(false)}
        saatPilih={(m) => { saatUbah(m.url); setBuka(false) }}
      />
    </div>
  )
}
