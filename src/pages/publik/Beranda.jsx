import { Link } from 'react-router-dom'
import { useSitus } from '../../context/SiteContext'
import { publik } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import { tautanTelepon } from '../../lib/format'
import KartuKonten from '../../components/publik/KartuKonten'
import { Gambar, KartuRangka, Tombol } from '../../components/ui/Dasar'
import Reveal from '../../components/ui/Reveal'
import './beranda.css'

/**
 * Beranda.
 *
 * Susunannya mengikuti tiga pertanyaan yang dibawa pengunjung situs klinik:
 * apa yang bisa dilayani, siapa dokternya, dan bagaimana menghubunginya.
 * Selebihnya — artikel, berita, video — menyusul setelah ketiganya terjawab.
 */
export default function Beranda() {
  const { klinik, beranda, seo, tautanWa } = useSitus()

  useSeo({
    judul: null,
    deskripsi: seo.description
      || `${klinik.nama} melayani pemeriksaan umum, medical check up, dan layanan homecare.`,
    gambar: seo.og_image,
  })

  const layanan = useMuat((o) => publik.daftar('services', { per_halaman: 6 }, o), [])
  const paket   = useMuat((o) => publik.paket(undefined, o), [])   // paket sinkron SIMRS (tanpa entri ulang)
  const dokter  = useMuat((o) => publik.dokter(o), [])
  const artikel = useMuat((o) => publik.daftar('articles', { per_halaman: 3 }, o), [])

  const wa = tautanWa(`Hallo ${klinik.nama}, saya ingin membuat janji temu.`)
  const tel = tautanTelepon(klinik.telepon)

  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <section className="hero">
        <div className="wadah hero__kisi">
          <div className="hero__teks masuk-atas">
            <span className="eyebrow">
              {[klinik.kota, 'Klinik Pratama'].filter(Boolean).join(' · ')}
            </span>

            <h1>
              {beranda.hero_judul
                || 'Pelayanan kesehatan yang dekat, cepat, dan bisa diandalkan'}
            </h1>

            <p className="hero__sub">
              {beranda.hero_subjudul
                || `${klinik.nama} melayani pemeriksaan umum, medical check up, laboratorium, dan kunjungan homecare.`}
            </p>

            <div className="baris" style={{ gap: 'var(--s-3)', marginTop: 'var(--s-5)' }}>
              {wa
                ? <Tombol sebagai="a" corak="wa" ukuran="besar" href={wa} target="_blank" rel="noopener noreferrer">
                    Buat Janji via WhatsApp
                  </Tombol>
                : tel
                  ? <Tombol sebagai="a" ukuran="besar" href={tel}>Telepon {klinik.telepon}</Tombol>
                  : null}
              <Tombol ke="/layanan" corak="garis" ukuran="besar">Lihat Layanan</Tombol>
            </div>

            {klinik.jam && (
              <div className="hero__jam">
                <strong>Jam layanan</strong>
                <span>{klinik.jam}</span>
              </div>
            )}
          </div>

          <div className="hero__gambar masuk-atas" style={{ animationDelay: '0.15s' }}>
            <Gambar
              src={beranda.hero_image}
              alt=""
              keterangan="Foto klinik belum diunggah"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------- aksi cepat (di bawah banner) */}
      <section className="wadah aksi-cepat">
        <AksiCepat
          ke="/mcu"
          judul="Medical Check Up"
          teks="Paket pemeriksaan kesehatan berkala"
          ikon="M9 12l2 2 4-4M7.5 4.5h9A2.5 2.5 0 0 1 19 7v11a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V7a2.5 2.5 0 0 1 2.5-2.5zM9 3h6v3H9z"
        />
        <AksiCepat
          ke="/homecare"
          judul="Homecare"
          teks="Perawatan kesehatan di rumah Anda"
          ikon="M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"
        />
        <AksiCepat
          ke="/pasien"
          judul="Temu Janji"
          teks="Reservasi poliklinik online, tanpa antre"
          ikon="M8 2v3M16 2v3M4 8h16M6 4h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 14l2 2 4-4"
          utama
        />
      </section>

      {/* ------------------------------------------------------- layanan */}
      <section className="seksi">
        <div className="wadah">
          <div className="baris baris--antara judul-seksi" style={{ maxWidth: 'none' }}>
            <div>
              <span className="eyebrow">Layanan</span>
              <h2>Yang bisa kami bantu</h2>
            </div>
            <Link to="/layanan" className="btn btn--garis btn--kecil">Semua layanan</Link>
          </div>

          {layanan.memuat ? <KartuRangka jumlah={3} />
            : layanan.data?.length ? (
              <Reveal className="kisi kisi--3">
                {layanan.data.map((s) => <KartuKonten key={s.id} modul="services" item={s} />)}
              </Reveal>
            ) : (
              <div className="kosong">
                <h3>Daftar layanan belum diisi</h3>
                <p>Pengelola klinik dapat menambahkannya lewat menu Layanan di CMS.</p>
              </div>
            )}
        </div>
      </section>

      {/* ----------------------------------------------------------- Paket & MCU */}
      <section className="seksi seksi--lembut">
        <div className="wadah">
          <div className="baris baris--antara judul-seksi" style={{ maxWidth: 'none' }}>
            <div>
              <span className="eyebrow">Paket & Medical Check Up</span>
              <h2>Paket pemeriksaan & layanan</h2>
            </div>
            <Link to="/pasien/paket" className="btn btn--garis btn--kecil">Pesan paket</Link>
          </div>

          {paket.memuat ? <KartuRangka jumlah={3} />
            : paket.data?.length ? (
              <Reveal className="kisi kisi--3">
                {paket.data.slice(0, 6).map((p) => <KartuPaket key={p.id} p={p} wa={wa} />)}
              </Reveal>
            ) : (
              <div className="kosong">
                <h3>Paket belum tersedia</h3>
                <p>Paket dari SIMRS belum tersinkron. Buka CMS → Sinkron untuk menariknya.</p>
              </div>
            )}
        </div>
      </section>

      {/* -------------------------------------------------------- dokter */}
      <section className="seksi">
        <div className="wadah">
          <div className="baris baris--antara judul-seksi" style={{ maxWidth: 'none' }}>
            <div>
              <span className="eyebrow">Tim Medis</span>
              <h2>Dokter kami</h2>
            </div>
            <Link to="/dokter" className="btn btn--garis btn--kecil">Jadwal lengkap</Link>
          </div>

          {dokter.memuat ? <KartuRangka jumlah={4} />
            : dokter.data?.length ? (
              <Reveal className="kisi kisi--4">
                {dokter.data.slice(0, 4).map((d) => (
                  <article key={d.id} className="kartu kartu--tautan">
                    <Gambar src={d.foto} alt={d.nama} rasio="gambar-rasio--potret" keterangan="Foto dokter" />
                    <div className="kartu__isi">
                      <h3 className="kartu__judul" style={{ fontSize: 'var(--t-base)' }}>{d.nama}</h3>
                      {d.spesialis && <span className="lencana">{d.spesialis}</span>}
                    </div>
                  </article>
                ))}
              </Reveal>
            ) : (
              <div className="kosong">
                <h3>Belum ada dokter yang ditayangkan</h3>
                <p>
                  Data dokter sudah ditarik dari SIMRS, tetapi belum ada yang ditandai
                  tayang. Buka CMS → Dokter untuk memilihnya.
                </p>
              </div>
            )}
        </div>
      </section>

      {/* ------------------------------------------------------- artikel */}
      {artikel.data?.length > 0 && (
        <section className="seksi seksi--lembut">
          <div className="wadah">
            <div className="baris baris--antara judul-seksi" style={{ maxWidth: 'none' }}>
              <div>
                <span className="eyebrow">Informasi</span>
                <h2>Artikel kesehatan</h2>
              </div>
              <Link to="/artikel" className="btn btn--garis btn--kecil">Semua artikel</Link>
            </div>
            <Reveal className="kisi kisi--3">
              {artikel.data.map((a) => <KartuKonten key={a.id} modul="articles" item={a} />)}
            </Reveal>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- ajakan */}
      <section className="ajakan">
        <div className="wadah ajakan__isi">
          <div>
            <h2 style={{ color: 'var(--putih)' }}>Butuh bantuan menentukan layanan?</h2>
            <p style={{ color: 'var(--hijau-100)', marginTop: 'var(--s-3)' }}>
              Hubungi kami, dan tim klinik akan membantu memilih pemeriksaan yang sesuai.
            </p>
          </div>
          <div className="baris" style={{ gap: 'var(--s-3)' }}>
            {wa && (
              <Tombol sebagai="a" corak="wa" ukuran="besar" href={wa} target="_blank" rel="noopener noreferrer">
                Chat WhatsApp
              </Tombol>
            )}
            {tel && <Tombol sebagai="a" corak="halus" ukuran="besar" href={tel}>Telepon</Tombol>}
            <Tombol ke="/kontak" corak="garis" ukuran="besar" className="ajakan__garis">
              Lihat lokasi
            </Tombol>
          </div>
        </div>
      </section>
    </>
  )
}

/* Tombol aksi cepat di bawah banner. */
function AksiCepat({ ke, judul, teks, ikon, utama }) {
  return (
    <Link to={ke} className={`aksi-kartu${utama ? ' aksi-kartu--utama' : ''}`}>
      <span className="aksi-kartu__ikon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ikon} />
        </svg>
      </span>
      <span className="aksi-kartu__teks">
        <span className="aksi-kartu__judul">{judul}</span>
        <span className="aksi-kartu__sub">{teks}</span>
      </span>
      <span className="aksi-kartu__panah" aria-hidden="true">→</span>
    </Link>
  )
}

/* Kartu paket dari data SINKRON SIMRS (service_packages) — bukan entri ulang CMS. */
const JENIS_PAKET = { mcu: 'MCU', homecare: 'Homecare', lainnya: 'Layanan' }
function KartuPaket({ p, wa }) {
  const harga = p.harga_simrs == null || p.harga_simrs === ''
    ? 'Hubungi klinik' : 'Rp ' + Number(p.harga_simrs).toLocaleString('id-ID')
  return (
    <article className="kartu" style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
      <div className="baris baris--antara" style={{ alignItems: 'flex-start', gap: 'var(--s-2)' }}>
        <h3 style={{ fontSize: 'var(--t-base)' }}>{p.nama}</h3>
        <span className="lencana">{JENIS_PAKET[p.jenis] || 'Layanan'}</span>
      </div>
      <div className="baris" style={{ gap: 'var(--s-5)', marginTop: 'auto', paddingTop: 'var(--s-2)' }}>
        <div>
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>Harga</div>
          <strong style={{ color: 'var(--hijau-700)' }}>{harga}</strong>
        </div>
        <div>
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>Kunjungan</div>
          <strong>{(p.jml_kunjungan || 1)}×</strong>
        </div>
      </div>
      <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-2)', flexWrap: 'wrap' }}>
        <Link to="/pasien/paket" className="btn btn--kecil">Pesan</Link>
        {(p.whatsapp || wa) && (
          <a className="btn btn--wa btn--kecil" href={p.whatsapp || wa} target="_blank" rel="noopener noreferrer">
            Tanya WhatsApp
          </a>
        )}
      </div>
    </article>
  )
}
