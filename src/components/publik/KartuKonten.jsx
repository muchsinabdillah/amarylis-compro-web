import { Link, useLocation } from 'react-router-dom'
import { Gambar, Lencana } from '../ui/Dasar'
import { publik } from '../../lib/api'
import { hargaTampil, tanggal } from '../../lib/format'

/** Jalur publik tiap modul, dipetakan di satu tempat. */
export const JALUR_MODUL = {
  articles: 'artikel',
  news: 'berita',
  videos: 'video',
  services: 'layanan',
  mcu: 'mcu',
  homecare: 'homecare',
}

export const LABEL_MODUL = {
  articles: 'Artikel',
  news: 'Berita',
  videos: 'Video',
  services: 'Layanan',
  mcu: 'Paket MCU',
  homecare: 'Homecare',
}

/**
 * Satu kartu untuk seluruh jenis konten.
 *
 * Kartu yang ditulis terpisah per modul terlihat sama pada hari pertama lalu
 * perlahan berbeda — tinggi gambarnya, letak harganya, cara tanggalnya
 * ditulis — dan yang ketinggalan tidak pernah ada yang melaporkan.
 */
export default function KartuKonten({ modul, item, tombolWa = true }) {
  const lokasi = useLocation()
  const jalur = `/${JALUR_MODUL[modul]}/${item.slug}`
  const katalog = ['services', 'mcu', 'homecare'].includes(modul)

  const catatLead = () => publik.lead({
    tipe: modul, id: item.id, judul: item.judul, halaman: lokasi.pathname,
  })

  return (
    <article className="kartu kartu--tautan">
      <Link to={jalur} aria-label={item.judul} style={{ display: 'block' }}>
        <Gambar
          src={item.thumbnail}
          alt={item.judul}
          keterangan={LABEL_MODUL[modul] || 'Konten'}
        />
      </Link>

      <div className="kartu__isi">
        <div className="baris" style={{ gap: 'var(--s-2)' }}>
          {item.kategori && <Lencana>{item.kategori}</Lencana>}
          {item.unggulan && <Lencana corak="awas">Unggulan</Lencana>}
          {modul === 'videos' && item.durasi && <Lencana corak="abu">{item.durasi}</Lencana>}
        </div>

        <h3 className="kartu__judul">
          <Link to={jalur} style={{ color: 'inherit' }}>{item.judul}</Link>
        </h3>

        {item.ringkas && <p className="kartu__ringkas">{item.ringkas}</p>}

        {/* Katalog menampilkan harga; artikel dan berita menampilkan tanggal. */}
        {katalog ? (
          <div style={{ fontWeight: 800, color: 'var(--hijau-700)', fontSize: 'var(--t-lg)' }}>
            {hargaTampil(item.harga, item.jenis_harga)}
          </div>
        ) : (
          <div className="meta">
            {item.terbit && <span>{tanggal(item.terbit)}</span>}
            {item.reading_minutes ? <span>· {item.reading_minutes} menit baca</span> : null}
            {modul === 'news' && item.lokasi ? <span>· {item.lokasi}</span> : null}
          </div>
        )}

        <div className="kartu__kaki">
          <Link to={jalur} className="btn btn--halus btn--kecil">
            {katalog ? 'Lihat detail' : 'Baca selengkapnya'}
          </Link>

          {/* Tombol WhatsApp hanya muncul bila nomornya memang sudah diisi:
              backend mengembalikan null bila belum. */}
          {tombolWa && katalog && item.whatsapp && (
            <a
              className="btn btn--wa btn--kecil"
              href={item.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={catatLead}
            >
              Tanya via WA
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
