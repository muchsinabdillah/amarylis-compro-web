import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Komponen kecil yang dipakai di mana-mana.
 *
 * Dikumpulkan dalam satu berkas dengan sengaja: masing-masing hanya beberapa
 * baris, dan memecahnya menjadi belasan berkas membuat orang harus membuka
 * belasan berkas untuk memahami satu layar.
 */

/* ------------------------------------------------------------ tombol */
export function Tombol({
  sebagai, ke, corak = 'utama', ukuran, penuh, memuat, anak, children, ...sisa
}) {
  const kelas = [
    'btn',
    corak === 'garis' && 'btn--garis',
    corak === 'halus' && 'btn--halus',
    corak === 'polos' && 'btn--polos',
    corak === 'bahaya' && 'btn--bahaya',
    corak === 'wa' && 'btn--wa',
    ukuran === 'besar' && 'btn--besar',
    ukuran === 'kecil' && 'btn--kecil',
    penuh && 'btn--penuh',
    sisa.className,
  ].filter(Boolean).join(' ')

  const isi = memuat ? <><Putar /> Menyimpan…</> : (children ?? anak)

  if (ke) return <Link to={ke} {...sisa} className={kelas}>{isi}</Link>
  if (sebagai === 'a') return <a {...sisa} className={kelas}>{isi}</a>

  return (
    <button type="button" {...sisa} className={kelas} disabled={sisa.disabled || memuat}>
      {isi}
    </button>
  )
}

function Putar() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14, height: 14, borderRadius: '50%',
        border: '2px solid currentColor', borderTopColor: 'transparent',
        display: 'inline-block', animation: 'berputar 0.7s linear infinite',
      }}
    />
  )
}

/* ----------------------------------------------------------- lencana */
export function Lencana({ corak, children }) {
  return <span className={`lencana${corak ? ` lencana--${corak}` : ''}`}>{children}</span>
}

const CORAK_STATUS = { published: 'sukses', draft: 'awas', archived: 'abu' }
const LABEL_STATUS = { published: 'Tayang', draft: 'Draf', archived: 'Arsip' }

export function StatusKonten({ status }) {
  return <Lencana corak={CORAK_STATUS[status] || 'abu'}>{LABEL_STATUS[status] || status}</Lencana>
}

/* ------------------------------------------------------- keadaan muat */
export function Memuat({ tinggi = 180, jumlah = 1 }) {
  return (
    <div className="tumpuk" role="status" aria-live="polite">
      <span className="hanya-pembaca-layar">Sedang memuat…</span>
      {Array.from({ length: jumlah }).map((_, i) => (
        <div key={i} className="rangka" style={{ height: tinggi }} />
      ))}
    </div>
  )
}

export function KartuRangka({ jumlah = 3 }) {
  return (
    <div className="kisi kisi--3" role="status" aria-live="polite">
      <span className="hanya-pembaca-layar">Sedang memuat…</span>
      {Array.from({ length: jumlah }).map((_, i) => (
        <div key={i} className="kartu">
          <div className="rangka" style={{ height: 170 }} />
          <div className="kartu__isi">
            <div className="rangka" style={{ height: 18, width: '80%' }} />
            <div className="rangka" style={{ height: 14, width: '100%' }} />
            <div className="rangka" style={{ height: 14, width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------- galat */
/**
 * Pesan galat menyebut apa yang gagal dan menawarkan langkah berikutnya.
 *
 * "Terjadi kesalahan" saja membuat orang menekan tombol yang sama berulang
 * kali; menyebut penyebabnya membuat mereka tahu harus menunggu atau
 * menghubungi klinik lewat telepon.
 */
export function Galat({ galat, saatUlang }) {
  const status = galat?.status
  const pesan = status === 0
    ? 'Sambungan ke server terputus. Periksa jaringan Anda, lalu coba lagi.'
    : (galat?.message || 'Terjadi kesalahan yang tidak terduga.')

  return (
    <div className="galat-kotak" role="alert">
      <strong>Gagal memuat data.</strong>
      <div style={{ marginTop: 6 }}>{pesan}</div>
      {saatUlang && (
        <div style={{ marginTop: 12 }}>
          <Tombol corak="garis" ukuran="kecil" onClick={saatUlang}>Coba lagi</Tombol>
        </div>
      )}
    </div>
  )
}

export function Kosong({ judul = 'Belum ada isinya', pesan, aksi }) {
  return (
    <div className="kosong">
      <h3>{judul}</h3>
      {pesan && <p>{pesan}</p>}
      {aksi}
    </div>
  )
}

/* ---------------------------------------------------------- pemberitahuan */
export function Info({ corak = 'info', judul, children }) {
  const warna = {
    info:   { bg: 'var(--info-bg)',   fg: 'var(--info)' },
    awas:   { bg: 'var(--awas-bg)',   fg: 'var(--awas)' },
    sukses: { bg: 'var(--sukses-bg)', fg: 'var(--sukses)' },
    bahaya: { bg: 'var(--bahaya-bg)', fg: 'var(--bahaya)' },
  }[corak]

  return (
    <div
      role={corak === 'bahaya' ? 'alert' : 'status'}
      style={{
        background: warna.bg, color: warna.fg,
        border: '1px solid currentColor', borderRadius: 'var(--r-md)',
        padding: 'var(--s-4)', fontSize: 'var(--t-sm)',
      }}
    >
      {judul && <strong style={{ display: 'block', marginBottom: 4 }}>{judul}</strong>}
      {children}
    </div>
  )
}

/* -------------------------------------------------------------- gambar */
/**
 * Gambar dengan penampung kosong yang jelas.
 *
 * Sebelum foto diunggah, yang tampil adalah pola bergaris bertuliskan
 * keterangan — bukan ikon gambar rusak yang terbaca sebagai situs bermasalah.
 */
export function Gambar({ src, alt, rasio = '', keterangan = 'Foto belum tersedia' }) {
  // Status: muat (sedang dimuat) → siap | gagal; kosong bila tak ada src.
  // Selama memuat tampil kilau; bila gagal (mis. sumber lambat/mati) jatuh ke
  // penampung bermotif — bukan ikon gambar rusak yang terbaca seperti error.
  const [status, setStatus] = useState(src ? 'muat' : 'kosong')
  useEffect(() => { setStatus(src ? 'muat' : 'kosong') }, [src])
  const kosong = status === 'kosong' || status === 'gagal'

  return (
    <div className={`gambar-rasio ${rasio}`}>
      {src && !kosong && (
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          onLoad={() => setStatus('siap')}
          onError={() => setStatus('gagal')}
          className={status === 'siap' ? 'gambar--tampil' : 'gambar--muat'}
        />
      )}
      {status === 'muat' && <div className="gambar-kilau" aria-hidden="true" />}
      {kosong && <div className="gambar-kosong">{keterangan}</div>}
    </div>
  )
}
