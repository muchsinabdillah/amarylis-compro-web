import useSeo from '../../lib/seo'
import { Tombol } from '../../components/ui/Dasar'

export default function TidakDitemukan() {
  useSeo({ judul: 'Halaman tidak ditemukan' })

  return (
    <section className="seksi">
      <div className="wadah" style={{ textAlign: 'center', maxWidth: 560 }}>
        <div style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--hijau-100)', lineHeight: 1 }}>
          404
        </div>
        <h1 style={{ marginTop: 'var(--s-4)' }}>Halaman tidak ditemukan</h1>
        <p style={{ color: 'var(--teks-lembut)', marginTop: 'var(--s-3)' }}>
          Alamat yang Anda buka mungkin salah ketik, atau halamannya sudah dipindahkan.
        </p>
        <div className="baris" style={{ justifyContent: 'center', marginTop: 'var(--s-5)' }}>
          <Tombol ke="/">Kembali ke Beranda</Tombol>
          <Tombol ke="/kontak" corak="garis">Hubungi Klinik</Tombol>
        </div>
      </div>
    </section>
  )
}
