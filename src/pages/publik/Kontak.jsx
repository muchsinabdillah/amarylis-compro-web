import { useSitus } from '../../context/SiteContext'
import useSeo from '../../lib/seo'
import KepalaHalaman from '../../components/publik/KepalaHalaman'
import { Info, Tombol } from '../../components/ui/Dasar'
import { tautanTelepon } from '../../lib/format'

/**
 * Halaman kontak.
 *
 * Tidak ada formulir "kirim pesan". Formulir seperti itu menciptakan kotak
 * masuk yang harus dijaga seseorang, dan pesan yang tidak terbalas lebih
 * merugikan daripada tidak ada formulir sama sekali. Yang ditawarkan adalah
 * saluran yang memang dijawab klinik: telepon dan WhatsApp.
 */
export default function Kontak() {
  const { klinik, peta, sosial, whatsapp, tautanWa } = useSitus()

  useSeo({
    judul: 'Kontak & Lokasi',
    deskripsi: [klinik.nama, klinik.alamat, klinik.kota].filter(Boolean).join(', '),
  })

  const tel = tautanTelepon(klinik.telepon)
  const wa = tautanWa(`Hallo ${klinik.nama}, saya ingin bertanya.`)

  const baris = [
    { label: 'Alamat', nilai: [klinik.alamat, klinik.kota, klinik.kodepos].filter(Boolean).join(', ') },
    { label: 'Telepon', nilai: klinik.telepon, href: tel },
    { label: 'Email', nilai: klinik.email, href: klinik.email ? `mailto:${klinik.email}` : null },
    { label: 'Jam layanan', nilai: klinik.jam },
  ].filter((b) => b.nilai)

  return (
    <>
      <KepalaHalaman
        judul="Kontak & Lokasi"
        keterangan="Hubungi kami untuk pertanyaan, janji temu, atau informasi layanan."
        remah={[{ label: 'Kontak' }]}
      />

      <section className="seksi">
        <div className="wadah" style={{ display: 'grid', gap: 'var(--s-7)' }}>
          <div className="kisi kisi--2">
            <div className="tumpuk">
              <h2>{klinik.nama}</h2>

              <dl style={{ margin: 0, display: 'grid', gap: 'var(--s-4)' }}>
                {baris.map((b) => (
                  <div key={b.label}>
                    <dt style={{
                      fontSize: 'var(--t-xs)', textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--teks-samar)',
                      fontWeight: 700, marginBottom: 2,
                    }}>
                      {b.label}
                    </dt>
                    <dd style={{ margin: 0, fontSize: 'var(--t-lg)' }}>
                      {b.href ? <a href={b.href}>{b.nilai}</a> : b.nilai}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="baris" style={{ gap: 'var(--s-3)', marginTop: 'var(--s-3)' }}>
                {wa && (
                  <Tombol sebagai="a" corak="wa" href={wa} target="_blank" rel="noopener noreferrer">
                    Chat WhatsApp
                  </Tombol>
                )}
                {tel && <Tombol sebagai="a" corak={wa ? 'garis' : 'utama'} href={tel}>Telepon</Tombol>}
                {peta.buka && (
                  <Tombol sebagai="a" corak="garis" href={peta.buka} target="_blank" rel="noopener noreferrer">
                    Buka di Google Maps
                  </Tombol>
                )}
              </div>

              {/* Alasan tombol WhatsApp tidak muncul dikatakan terang-terangan
                  supaya pengelola tahu apa yang harus dilengkapi. */}
              {!whatsapp.aktif && whatsapp.alasan && (
                <Info corak="awas" judul="Tombol WhatsApp belum aktif">
                  {whatsapp.alasan}
                </Info>
              )}

              {Object.keys(sosial || {}).length > 0 && (
                <div>
                  <h3 style={{ fontSize: 'var(--t-base)', marginBottom: 'var(--s-2)' }}>Media sosial</h3>
                  <div className="baris" style={{ gap: 'var(--s-2)' }}>
                    {Object.entries(sosial).map(([nama, url]) => (
                      <a
                        key={nama}
                        className="btn btn--garis btn--kecil"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {nama.charAt(0).toUpperCase() + nama.slice(1)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {peta.embed ? (
                <iframe
                  title={`Peta lokasi ${klinik.nama}`}
                  src={peta.embed}
                  style={{
                    width: '100%', minHeight: 380, border: 0,
                    borderRadius: 'var(--r-lg)', boxShadow: 'var(--bayang-2)',
                  }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="kosong" style={{ minHeight: 380, display: 'grid', placeContent: 'center' }}>
                  <h3>Peta belum diatur</h3>
                  <p>Isi URL Google Maps Embed pada CMS → Pengaturan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
