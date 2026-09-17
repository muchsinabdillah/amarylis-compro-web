import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import { LABEL_MODUL } from '../../components/publik/KartuKonten'
import Editor from '../../components/admin/Editor'
import IsianGambar from '../../components/admin/IsianGambar'
import { AreaTeks, Centang, Pilihan, Teks } from '../../components/ui/Isian'
import { Galat, Info, Memuat, Tombol } from '../../components/ui/Dasar'

/**
 * Formulir tambah/sunting untuk keenam modul konten.
 *
 * Isian yang ditampilkan ditentukan modulnya, bukan satu formulir raksasa
 * dengan setengah isian tersembunyi. Kolom yang tidak relevan tidak dikirim
 * sama sekali, dan backend memang hanya menerima kolom yang ada di daftar
 * putihnya.
 */

/** Tipe kategori untuk tiap modul. */
const TIPE_KATEGORI = {
  articles: 'article', news: 'news', videos: 'video',
  services: 'service', mcu: 'mcu', homecare: 'homecare',
}

const KATALOG = ['services', 'mcu', 'homecare']

const escHtml = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

/** Buat slug dari teks: huruf kecil, non-alfanumerik jadi tanda hubung. */
const buatSlug = (s) => (s || '').toString().toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')   // buang aksen
  .replace(/[^a-z0-9\s-]/g, '')
  .trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

/** Rangkai deskripsi awal dari detail paket SIMRS (keterangan + jumlah kunjungan + isi). */
function bangunDeskripsi(d) {
  const bagian = []
  if (d.keterangan) bagian.push(`<p>${escHtml(d.keterangan)}</p>`)
  bagian.push(`<p><strong>Jumlah kunjungan:</strong> ${d.jml_kunjungan || 1}×</p>`)
  if (Array.isArray(d.items) && d.items.length) {
    bagian.push('<p><strong>Isi paket:</strong></p><ul>' + d.items.map((it) => {
      const q = Number(it.qty)
      return `<li>${escHtml(it.nama)}${q > 1 ? ` (${q}×)` : ''}</li>`
    }).join('') + '</ul>')
  }
  return bagian.join('')
}

export default function FormKonten() {
  const { modul, id } = useParams()
  const navigasi = useNavigate()
  const baru = !id

  const [f, setF] = useState({ status: 'draft' })
  const [galatKolom, setGalatKolom] = useState({})
  const [galatKirim, setGalatKirim] = useState(null)
  const [kirim, setKirim] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)

  const ada = useMuat(
    (o) => (baru ? Promise.resolve({ data: null }) : admin.konten.ambil(modul, id, o)),
    [modul, id])

  const kategori = useMuat(
    (o) => admin.kategori({ tipe: TIPE_KATEGORI[modul] }, o), [modul])

  // Paket sinkron SIMRS untuk isi-otomatis (hanya modul katalog).
  const jenisPaket = modul === 'mcu' ? 'mcu' : modul === 'homecare' ? 'homecare' : 'lainnya'
  const paketSimrs = useMuat(
    (o) => (KATALOG.includes(modul) ? admin.paketSimrs(jenisPaket, o) : Promise.resolve({ data: [] })),
    [modul])
  const [imporSibuk, setImporSibuk] = useState(false)
  const [imporPesan, setImporPesan] = useState(null)
  const [detailPaket, setDetailPaket] = useState(null)   // detail (isi) paket dari SIMRS

  const impor = async (simrsId) => {
    if (!simrsId) return
    setImporSibuk(true); setImporPesan(null)
    try {
      const { data: d } = await admin.paketSimrsDetail(simrsId)
      setDetailPaket(d)
      const isi = bangunDeskripsi(d)
      setF((v) => ({
        ...v,
        nama: d.nama || v.nama,
        harga: d.harga != null && d.harga !== '' ? Number(d.harga) : v.harga,
        jenis_harga: d.harga != null && d.harga !== '' ? 'fixed' : 'contact_us',
        paket_id: d.simrs_id,
        // Slug ikut terisi dari nama paket (bila konten baru & belum disunting).
        slug: (baru && !slugManual) ? buatSlug(d.nama || '') : v.slug,
        ringkas: (v.ringkas && v.ringkas.trim())
          ? v.ringkas
          : `${d.jml_kunjungan || 1}× kunjungan${d.items?.length ? ` · ${d.items.length} pemeriksaan` : ''}`,
        // Jangan timpa isi yang sudah ditulis redaksi.
        [kolomJudul === 'judul' ? 'konten' : 'deskripsi']:
          (v.deskripsi && v.deskripsi.trim()) ? v.deskripsi : isi,
      }))
      setTersimpan(false)
      setImporPesan(`Terisi dari SIMRS: ${d.nama} · ${d.jml_kunjungan || 1}× kunjungan · ${d.items?.length || 0} isi paket.`)
    } catch (e) {
      setImporPesan(e.message || 'Gagal mengambil paket dari SIMRS.')
    } finally {
      setImporSibuk(false)
    }
  }

  useEffect(() => {
    if (ada.data) setF(ada.data)
  }, [ada.data])

  useSeo({ judul: `${baru ? 'Tambah' : 'Sunting'} ${LABEL_MODUL[modul] || modul} — CMS` })

  const set = (kunci) => (nilai) => {
    setF((v) => ({ ...v, [kunci]: nilai }))
    setTersimpan(false)
  }
  const setEv = (kunci) => (e) => set(kunci)(e.target.value)
  const setCentang = (kunci) => (e) => set(kunci)(e.target.checked)

  const kolomJudul = ['articles', 'news', 'videos'].includes(modul) ? 'judul' : 'nama'

  // Slug terisi otomatis dari judul selama pengguna belum menyuntingnya sendiri.
  // Hanya untuk konten BARU (mengubah slug konten lama memutus tautan lama).
  const [slugManual, setSlugManual] = useState(false)
  const ubahJudul = (e) => {
    const v = e.target.value
    setF((prev) => {
      const next = { ...prev, [kolomJudul]: v }
      if (baru && !slugManual) next.slug = buatSlug(v)
      return next
    })
    setTersimpan(false)
  }
  const ubahSlug = (e) => { setSlugManual(true); set('slug')(buatSlug(e.target.value)) }

  const simpan = async (e) => {
    e.preventDefault()
    setGalatKirim(null)
    setGalatKolom({})
    setKirim(true)

    try {
      const isi = { ...f }
      delete isi.id
      delete isi.slug        // slug hanya diubah lewat isian slug bila diisi
      if (f.slug && f.slug !== ada.data?.slug) isi.slug = f.slug

      if (baru) {
        const h = await admin.konten.buat(modul, isi)
        navigasi(`/admin/konten/${modul}/${h.data.id}`, { replace: true })
      } else {
        await admin.konten.ubah(modul, id, isi)
        setTersimpan(true)
        ada.muatUlang()
      }
    } catch (err) {
      setGalatKolom(err.perKolom || {})
      setGalatKirim(Object.keys(err.perKolom || {}).length ? null : err.message)
    } finally {
      setKirim(false)
    }
  }

  if (!baru && ada.memuat) return <Memuat tinggi={80} jumlah={4} />
  if (!baru && ada.galat) return <Galat galat={ada.galat} saatUlang={ada.muatUlang} />

  const opsiKategori = (kategori.data || []).map((k) => ({ nilai: k.id, label: k.nama }))

  return (
    <form onSubmit={simpan}>
      <div className="cms-kepala">
        <div>
          <h1>{baru ? `Tambah ${LABEL_MODUL[modul]}` : f[kolomJudul] || 'Sunting'}</h1>
          <p>{baru ? 'Isian bertanda * wajib diisi.' : `Slug: /${f.slug || ''}`}</p>
        </div>
        <div className="baris" style={{ gap: 'var(--s-2)' }}>
          <Tombol corak="garis" onClick={() => navigasi(`/admin/konten/${modul}`)}>
            Kembali
          </Tombol>
          <Tombol type="submit" memuat={kirim}>
            {baru ? 'Simpan' : 'Simpan perubahan'}
          </Tombol>
        </div>
      </div>

      {tersimpan && (
        <div style={{ marginBottom: 'var(--s-4)' }}>
          <Info corak="sukses">Perubahan tersimpan.</Info>
        </div>
      )}
      {galatKirim && (
        <div className="galat-kotak" role="alert" style={{ marginBottom: 'var(--s-4)' }}>
          {galatKirim}
        </div>
      )}

      <div className="form-kisi">
        {/* ------------------------------------------------------- utama */}
        <div className="tumpuk">
          {KATALOG.includes(modul) && (
            <div className="cms-panel">
              <h2 className="cms-panel__judul">Impor dari paket SIMRS</h2>
              <p style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', margin: '-4px 0 var(--s-3)' }}>
                Pilih paket hasil sinkron — nama, harga, jumlah kunjungan, dan isinya terisi otomatis. Tinggal sunting bila perlu.
              </p>
              {(paketSimrs.data || []).length ? (
                <Pilihan
                  label="Paket SIMRS"
                  kosong={imporSibuk ? 'Mengambil…' : '— Pilih paket untuk mengisi otomatis —'}
                  value={f.paket_id || ''}
                  onChange={(e) => impor(Number(e.target.value))}
                  opsi={(paketSimrs.data || []).map((p) => ({
                    nilai: p.simrs_id,
                    label: `${p.nama} · ${p.jml_kunjungan || 1}× · ${p.harga_simrs ? 'Rp ' + Number(p.harga_simrs).toLocaleString('id-ID') : 'tanpa harga'}`,
                  }))}
                />
              ) : (
                <Info corak="awas">Belum ada paket sinkron. Buka menu <b>Sinkronisasi</b> untuk menariknya dari SIMRS.</Info>
              )}
              {imporPesan && <div style={{ marginTop: 'var(--s-2)' }}><Info corak="sukses">{imporPesan}</Info></div>}

              {/* Pratinjau detail paket (isi) — juga otomatis masuk ke Keterangan lengkap. */}
              {detailPaket && (detailPaket.items || []).length > 0 && (
                <div style={{ marginTop: 'var(--s-3)', border: '1px solid var(--garis)', borderRadius: 'var(--r-md)', padding: 'var(--s-3)', background: 'var(--hijau-50)' }}>
                  <div style={{ fontSize: 'var(--t-xs)', fontWeight: 700, color: 'var(--hijau-800)', marginBottom: 6 }}>
                    Detail paket — {detailPaket.jml_kunjungan || 1}× kunjungan
                    {detailPaket.harga ? ` · Rp ${Number(detailPaket.harga).toLocaleString('id-ID')}` : ''}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1em', fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)' }}>
                    {detailPaket.items.map((it, i) => (
                      <li key={i}>{it.nama}{Number(it.qty) > 1 ? ` (${Number(it.qty)}×)` : ''}</li>
                    ))}
                  </ul>
                  <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)', marginTop: 6 }}>
                    Detail ini otomatis dimasukkan ke <b>Keterangan lengkap</b> dan tampil di website.
                  </div>
                </div>
              )}

              {f.paket_id && !detailPaket && (
                <div style={{ marginTop: 'var(--s-2)', fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>
                  Tertaut ke paket SIMRS #{f.paket_id}
                </div>
              )}
            </div>
          )}

          <div className="cms-panel">
            <div className="tumpuk">
              <Teks
                label={kolomJudul === 'judul' ? 'Judul' : 'Nama'}
                wajib
                required
                value={f[kolomJudul] || ''}
                onChange={ubahJudul}
                galat={galatKolom[kolomJudul]}
                maxLength={220}
              />

              <AreaTeks
                label="Ringkasan"
                baris={2}
                value={(kolomJudul === 'judul' ? f.excerpt : f.ringkas) || ''}
                onChange={setEv(kolomJudul === 'judul' ? 'excerpt' : 'ringkas')}
                bantuan="Tampil pada kartu daftar dan hasil pencarian. Bila dikosongkan, diambil otomatis dari isi."
                maxLength={400}
              />

              {modul === 'videos' && (
                <>
                  <Pilihan
                    label="Sumber video"
                    value={f.video_type || 'youtube'}
                    onChange={setEv('video_type')}
                    opsi={[
                      { nilai: 'youtube', label: 'YouTube' },
                      { nilai: 'vimeo', label: 'Vimeo' },
                    ]}
                  />
                  <Teks
                    label="URL video"
                    value={f.video_url || ''}
                    onChange={setEv('video_url')}
                    bantuan="Alamat halaman videonya, mis. https://www.youtube.com/watch?v=..."
                    galat={galatKolom.video_url}
                  />
                  <Teks
                    label="URL sematan (embed)"
                    value={f.embed_url || ''}
                    onChange={setEv('embed_url')}
                    bantuan="Alamat embed, mis. https://www.youtube.com/embed/xxxx — inilah yang diputar di halaman."
                    galat={galatKolom.embed_url}
                  />
                  <Teks
                    label="Durasi"
                    value={f.durasi || ''}
                    onChange={setEv('durasi')}
                    bantuan='Contoh: "5 menit"'
                  />
                </>
              )}
            </div>
          </div>

          <div className="cms-panel">
            <h2 className="cms-panel__judul">
              {KATALOG.includes(modul) ? 'Keterangan lengkap' : 'Isi'}
            </h2>
            <Editor
              nilai={(kolomJudul === 'judul' ? f.konten : f.deskripsi) || ''}
              saatUbah={set(kolomJudul === 'judul' ? 'konten' : 'deskripsi')}
            />
          </div>

          {modul === 'mcu' && (
            <div className="cms-panel">
              <h2 className="cms-panel__judul">Persiapan pemeriksaan</h2>
              <Editor nilai={f.persiapan || ''} saatUbah={set('persiapan')} tinggiMin={180} />
            </div>
          )}

          <div className="cms-panel">
            <h2 className="cms-panel__judul">SEO &amp; berbagi</h2>
            <div className="tumpuk">
              <Teks
                label="Judul SEO"
                value={f.seo_title || ''}
                onChange={setEv('seo_title')}
                bantuan="Kosongkan untuk memakai judul di atas. Ideal 50–60 karakter."
                maxLength={200}
              />
              <AreaTeks
                label="Deskripsi SEO"
                baris={2}
                value={f.seo_description || ''}
                onChange={setEv('seo_description')}
                bantuan="Tampil di hasil pencarian Google. Ideal 120–160 karakter."
                maxLength={400}
              />
              <IsianGambar
                label="Gambar berbagi (OG image)"
                nilai={f.og_image || ''}
                saatUbah={set('og_image')}
                bantuan="Tampil saat tautan dibagikan ke WhatsApp atau media sosial. Ukuran ideal 1200×630."
              />
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------- samping */}
        <div className="tumpuk">
          <div className="cms-panel">
            <h2 className="cms-panel__judul">Penayangan</h2>
            <div className="tumpuk">
              <Pilihan
                label="Status"
                value={f.status || 'draft'}
                onChange={setEv('status')}
                opsi={[
                  { nilai: 'draft', label: 'Draf — belum tampil di situs' },
                  { nilai: 'published', label: 'Tayang' },
                  { nilai: 'archived', label: 'Arsip — disembunyikan' },
                ]}
              />

              {['articles', 'news', 'videos'].includes(modul) && (
                <Teks
                  label="Tanggal terbit"
                  type="datetime-local"
                  value={(f.published_at || '').replace(' ', 'T').slice(0, 16)}
                  onChange={setEv('published_at')}
                  bantuan="Kosongkan untuk memakai waktu saat pertama ditayangkan. Tanggal di masa depan berarti terjadwal."
                />
              )}

              <Centang
                label="Tampilkan sebagai unggulan"
                keterangan="Ditandai khusus dan diutamakan di halaman depan."
                checked={!!f.is_featured}
                onChange={setCentang('is_featured')}
              />

              <Teks
                label="Slug URL"
                value={f.slug || ''}
                onChange={ubahSlug}
                bantuan={baru
                  ? 'Terisi otomatis dari judul; boleh disunting.'
                  : 'Mengubah slug memutus tautan lama yang sudah tersebar.'}
                galat={galatKolom.slug}
              />
            </div>
          </div>

          <div className="cms-panel">
            <h2 className="cms-panel__judul">Kategori &amp; gambar</h2>
            <div className="tumpuk">
              <Pilihan
                label="Kategori"
                kosong="— Tanpa kategori —"
                value={f.category_id || ''}
                onChange={(e) => set('category_id')(e.target.value ? Number(e.target.value) : '')}
                opsi={opsiKategori}
              />

              <IsianGambar
                label={KATALOG.includes(modul) && modul !== 'mcu' ? 'Gambar' : 'Thumbnail'}
                nilai={(modul === 'services' || modul === 'homecare' ? f.image : f.thumbnail) || ''}
                saatUbah={set(modul === 'services' || modul === 'homecare' ? 'image' : 'thumbnail')}
              />
            </div>
          </div>

          {KATALOG.includes(modul) && (
            <div className="cms-panel">
              <h2 className="cms-panel__judul">Harga &amp; pemesanan</h2>
              <div className="tumpuk">
                <Teks
                  label="Harga"
                  type="number"
                  min="0"
                  step="any"
                  value={f.harga ?? ''}
                  onChange={setEv('harga')}
                  bantuan="Kosongkan bila harga belum ditentukan — situs akan menulis “Hubungi kami”."
                  galat={galatKolom.harga}
                />
                <Pilihan
                  label="Cara menampilkan harga"
                  value={f.jenis_harga || 'contact_us'}
                  onChange={setEv('jenis_harga')}
                  opsi={[
                    { nilai: 'fixed', label: 'Harga tetap' },
                    { nilai: 'starting_from', label: 'Mulai dari' },
                    { nilai: 'contact_us', label: 'Hubungi kami' },
                  ]}
                />
                <Teks
                  label="Durasi"
                  value={f.durasi || ''}
                  onChange={setEv('durasi')}
                  bantuan='Contoh: "±90 menit"'
                />
                {modul === 'homecare' && (
                  <Teks
                    label="Area layanan"
                    value={f.area_layanan || ''}
                    onChange={setEv('area_layanan')}
                    bantuan="Kosongkan bila belum ditetapkan. Jangan menuliskan area yang belum dipastikan."
                  />
                )}
                <AreaTeks
                  label="Pesan WhatsApp khusus"
                  baris={3}
                  value={f.whatsapp_message || ''}
                  onChange={setEv('whatsapp_message')}
                  bantuan="Kosongkan untuk memakai salam bawaan dari Pengaturan."
                />
                <Teks
                  label="Urutan tampil"
                  type="number"
                  value={f.urutan ?? 0}
                  onChange={(e) => set('urutan')(Number(e.target.value))}
                  bantuan="Makin kecil makin atas."
                />
              </div>
            </div>
          )}

          {modul === 'news' && (
            <div className="cms-panel">
              <h2 className="cms-panel__judul">Kegiatan</h2>
              <div className="tumpuk">
                <Teks
                  label="Tanggal kegiatan"
                  type="date"
                  value={(f.event_date || '').slice(0, 10)}
                  onChange={setEv('event_date')}
                />
                <Teks label="Lokasi" value={f.lokasi || ''} onChange={setEv('lokasi')} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tombol simpan diulang di bawah: pada formulir sepanjang ini, tombol
          yang hanya ada di puncak menuntut orang menggulir kembali ke atas. */}
      <div className="baris baris--kanan" style={{ marginTop: 'var(--s-5)' }}>
        <Tombol type="submit" memuat={kirim}>
          {baru ? 'Simpan' : 'Simpan perubahan'}
        </Tombol>
      </div>
    </form>
  )
}
