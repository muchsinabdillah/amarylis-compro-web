/**
 * Satu pintu ke backend.
 *
 * Seluruh komponen memanggil lewat berkas ini — bukan `fetch` sendiri-sendiri.
 * Dengan begitu penanganan token, bentuk galat, dan pembatalan permintaan
 * ditulis sekali; komponen yang memanggil fetch langsung akan melewatkan
 * salah satunya, dan yang terlewat biasanya penanganan galatnya.
 */

const DASAR = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const KUNCI_TOKEN = 'compro.token'
const KUNCI_TOKEN_PASIEN = 'compro.pasien.token'
const KUNCI_TOKEN_PERUSAHAAN = 'compro.perusahaan.token'

/* Penyimpanan token generik agar admin, pasien, & perusahaan tak berbagi satu
   slot: ketiganya bisa masuk berbarengan di peramban yang sama tanpa saling
   mengeluarkan. Token dipilih per-jalur di panggil(). */
function bikinToken(kunci) {
  return {
    ambil: () => { try { return localStorage.getItem(kunci) } catch { return null } },
    simpan: (v) => { try { localStorage.setItem(kunci, v) } catch { /* diabaikan */ } },
    hapus: () => { try { localStorage.removeItem(kunci) } catch { /* diabaikan */ } },
  }
}

/* -------------------------------------------------------------- token */
export const token = bikinToken(KUNCI_TOKEN)          // admin CMS
export const tokenPasien = bikinToken(KUNCI_TOKEN_PASIEN) // portal pasien
export const tokenPerusahaan = bikinToken(KUNCI_TOKEN_PERUSAHAAN) // portal MCU perusahaan

/* -------------------------------------------------------------- galat */
export class GalatApi extends Error {
  constructor(pesan, status, rincian = {}) {
    super(pesan)
    this.name = 'GalatApi'
    this.status = status
    this.rincian = rincian
  }

  /** Galat validasi per kolom, untuk ditempelkan di bawah isian formulir. */
  get perKolom() {
    return this.status === 422 ? this.rincian : {}
  }
}

/* Dipasang AuthContext supaya token kedaluwarsa langsung mengeluarkan
   pengguna, di mana pun permintaannya terjadi. Terpisah per area agar 401 di
   satu area tidak mengeluarkan yang lain. */
let saatTakSah = null
let saatTakSahPasien = null
let saatTakSahPerusahaan = null
export function pasangPenanganTakSah(fn) { saatTakSah = fn }
export function pasangPenanganTakSahPasien(fn) { saatTakSahPasien = fn }
export function pasangPenanganTakSahPerusahaan(fn) { saatTakSahPerusahaan = fn }

/* Satu jalur = satu area sesi. Dipakai dua kali di panggil(): memilih token
   yang dikirim, dan memilih siapa yang dikeluarkan saat 401. Keduanya harus
   memakai jawaban yang sama, jadi penentuannya ditulis sekali di sini. */
function areaJalur(jalur) {
  if (jalur.startsWith('/api/pasien')) return 'pasien'
  if (jalur.startsWith('/api/perusahaan')) return 'perusahaan'
  return 'admin'
}

/* ------------------------------------------------------------ inti */
async function panggil(metode, jalur, { body, params, signal, formData } = {}) {
  let url = DASAR + jalur
  if (params) {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v)
    })
    const s = q.toString()
    if (s) url += (url.includes('?') ? '&' : '?') + s
  }

  const opsi = { method: metode, headers: {}, signal }

  const area = areaJalur(jalur)
  const slot = area === 'pasien' ? tokenPasien : area === 'perusahaan' ? tokenPerusahaan : token
  const t = slot.ambil()
  if (t) opsi.headers.Authorization = `Bearer ${t}`

  if (formData) {
    // Content-Type sengaja TIDAK diisi: peramban harus menuliskannya sendiri
    // lengkap dengan boundary multipart.
    opsi.body = formData
  } else if (body !== undefined) {
    opsi.headers['Content-Type'] = 'application/json'
    opsi.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(url, opsi)
  } catch (e) {
    if (e.name === 'AbortError') throw e
    throw new GalatApi(
      'Tidak dapat menghubungi server. Periksa sambungan internet Anda.', 0)
  }

  if (res.status === 204) return null

  let json = null
  try {
    json = await res.json()
  } catch {
    if (res.ok) return null
    throw new GalatApi('Jawaban server tidak dikenali.', res.status)
  }

  if (!res.ok) {
    if (res.status === 401) {
      const keluar = area === 'pasien' ? saatTakSahPasien
        : area === 'perusahaan' ? saatTakSahPerusahaan : saatTakSah
      if (keluar) keluar()
    }
    throw new GalatApi(
      json?.pesan || 'Terjadi kesalahan.', res.status, json?.galat || {})
  }

  return { data: json?.data ?? null, meta: json?.meta ?? null }
}

const api = {
  get:   (jalur, opsi) => panggil('GET', jalur, opsi),
  post:  (jalur, body, opsi) => panggil('POST', jalur, { ...opsi, body }),
  put:   (jalur, body, opsi) => panggil('PUT', jalur, { ...opsi, body }),
  del:   (jalur, opsi) => panggil('DELETE', jalur, opsi),
  unggah: (jalur, formData, opsi) => panggil('POST', jalur, { ...opsi, formData }),
}

export default api

/* =====================================================================
   Titik akhir publik
   ===================================================================== */
export const publik = {
  pengaturan: (o) => api.get('/api/publik/pengaturan', o),
  dokter:     (o) => api.get('/api/publik/dokter', o),
  jadwalReservasi: (o) => api.get('/api/publik/jadwal-reservasi', o), // dokter aktif SIMRS (untuk form reservasi)
  paket:      (jenis, o) => api.get('/api/publik/paket', { ...o, params: jenis ? { jenis } : undefined }), // paket sinkron SIMRS
  fasilitas:  (o) => api.get('/api/publik/fasilitas', o),
  halaman:    (slug, o) => api.get(`/api/publik/halaman/${slug}`, o),
  kategori:   (tipe, o) => api.get(`/api/publik/kategori/${tipe}`, o),
  daftar:     (modul, params, o) => api.get(`/api/publik/konten/${modul}`, { ...o, params }),
  detail:     (modul, slug, o) => api.get(`/api/publik/konten/${modul}/${slug}`, o),
  cari:       (q, o) => api.get('/api/publik/cari', { ...o, params: { q } }),

  /**
   * Jejak klik tombol WhatsApp.
   *
   * Kegagalannya sengaja ditelan: pengunjung sedang dalam perjalanan menuju
   * WhatsApp, dan mencatat statistik tidak boleh menghalanginya.
   */
  lead: (isi) => api.post('/api/publik/lead', isi).catch(() => {}),
}

/* =====================================================================
   Titik akhir CMS
   ===================================================================== */
export const admin = {
  masuk:      (isi) => api.post('/api/admin/masuk', isi),
  saya:       (o) => api.get('/api/admin/saya', o),
  gantiSandi: (isi) => api.post('/api/admin/ganti-sandi', isi),
  dasbor:     (o) => api.get('/api/admin/dasbor', o),

  konten: {
    daftar: (modul, params, o) => api.get(`/api/admin/konten/${modul}`, { ...o, params }),
    ambil:  (modul, id, o) => api.get(`/api/admin/konten/${modul}/${id}`, o),
    buat:   (modul, isi) => api.post(`/api/admin/konten/${modul}`, isi),
    ubah:   (modul, id, isi) => api.put(`/api/admin/konten/${modul}/${id}`, isi),
    hapus:  (modul, id) => api.del(`/api/admin/konten/${modul}/${id}`),
  },

  pengaturan:       (o) => api.get('/api/admin/pengaturan', o),
  simpanPengaturan: (settings) => api.put('/api/admin/pengaturan', { settings }),

  dokter:       (o) => api.get('/api/admin/dokter', o),
  simpanDokter: (id, isi) => api.put(`/api/admin/dokter/${id}`, isi),
  sinkron:      (modul) => api.post('/api/admin/sinkron', { modul }),
  riwayatSinkron: (o) => api.get('/api/admin/sinkron', o),

  // Paket sinkron SIMRS — untuk isi-otomatis form paket MCU/homecare
  paketSimrs:       (jenis, o) => api.get('/api/admin/paket-simrs', { ...o, params: jenis ? { jenis } : undefined }),
  paketSimrsDetail: (id, o) => api.get(`/api/admin/paket-simrs/${id}`, o),

  halaman:       (o) => api.get('/api/admin/halaman', o),
  halamanAmbil:  (id, o) => api.get(`/api/admin/halaman/${id}`, o),
  halamanSimpan: (id, isi) => api.put(`/api/admin/halaman/${id}`, isi),

  fasilitas:       (o) => api.get('/api/admin/fasilitas', o),
  fasilitasBuat:   (isi) => api.post('/api/admin/fasilitas', isi),
  fasilitasUbah:   (id, isi) => api.put(`/api/admin/fasilitas/${id}`, isi),
  fasilitasHapus:  (id) => api.del(`/api/admin/fasilitas/${id}`),
  fasilitasUrutan: (urutan) => api.put('/api/admin/fasilitas/urutan', { urutan }),

  kategori:      (params, o) => api.get('/api/admin/kategori', { ...o, params }),
  kategoriBuat:  (isi) => api.post('/api/admin/kategori', isi),
  kategoriUbah:  (id, isi) => api.put(`/api/admin/kategori/${id}`, isi),
  kategoriHapus: (id) => api.del(`/api/admin/kategori/${id}`),

  media:       (params, o) => api.get('/api/admin/media', { ...o, params }),
  mediaUnggah: (formData) => api.unggah('/api/admin/media', formData),
  mediaUbah:   (id, isi) => api.put(`/api/admin/media/${id}`, isi),
  mediaHapus:  (id) => api.del(`/api/admin/media/${id}`),

  pengguna:      (o) => api.get('/api/admin/pengguna', o),
  peran:         (o) => api.get('/api/admin/peran', o),
  penggunaBuat:  (isi) => api.post('/api/admin/pengguna', isi),
  penggunaUbah:  (id, isi) => api.put(`/api/admin/pengguna/${id}`, isi),
  penggunaSandi: (id, password) => api.put(`/api/admin/pengguna/${id}/sandi`, { password }),
  penggunaHapus: (id) => api.del(`/api/admin/pengguna/${id}`),

  // Reservasi pasien (verifikasi di CMS)
  reservasi:       (params, o) => api.get('/api/admin/reservasi', { ...o, params }),
  reservasiStatus: (id, isi) => api.put(`/api/admin/reservasi/${id}`, isi),

  // Pesanan paket (jual ke SIMRS di CMS)
  pesanan:       (params, o) => api.get('/api/admin/pesanan', { ...o, params }),
  pesananStatus: (id, isi) => api.put(`/api/admin/pesanan/${id}`, isi),
}

/* =====================================================================
   Portal pasien (reservasi) — token terpisah (compro.pasien.token)
   ===================================================================== */
export const pasien = {
  daftar:     (isi) => api.post('/api/pasien/daftar', isi),
  masuk:      (isi) => api.post('/api/pasien/masuk', isi),
  saya:       (o) => api.get('/api/pasien/saya', o),
  gantiSandi: (isi) => api.post('/api/pasien/ganti-sandi', isi),

  // Verifikasi pasien lama: cocokkan NIK+tgl lahir ke SIMRS → No. RM (tersinkron ke akun).
  cariRm:          (isi) => api.post('/api/pasien/cari-rm', isi),

  reservasi:       (o) => api.get('/api/pasien/reservasi', o),
  reservasiBuat:   (isi) => api.post('/api/pasien/reservasi', isi),
  reservasiBatal:  (id) => api.post(`/api/pasien/reservasi/${id}/batal`),
  reservasiCheckin: (id) => api.post(`/api/pasien/reservasi/${id}/checkin`),

  // Pesanan paket (MCU & layanan)
  pesanan:       (o) => api.get('/api/pasien/pesanan', o),
  pesananBuat:   (isi) => api.post('/api/pasien/pesanan', isi),
  pesananBatal:  (id) => api.post(`/api/pasien/pesanan/${id}/batal`),

  // Hasil MCU milik sendiri. No. RM tidak pernah dikirim dari sini —
  // backend mengambilnya dari sesi, supaya nomor orang lain tidak bisa
  // disisipkan hanya dengan mengubah permintaan di peramban.
  mcuHasil:       (o) => api.get('/api/pasien/mcu/hasil', o),
  mcuHasilDetail: (noMcu, o) => api.get(`/api/pasien/mcu/hasil/${encodeURIComponent(noMcu)}`, o),
  mcuTren:        (o) => api.get('/api/pasien/mcu/tren', o),
}

/* =====================================================================
   Portal MCU perusahaan — token terpisah (compro.perusahaan.token)

   Kredensialnya dikelola petugas di SIMRS, bukan di sini; website hanya
   meneruskan email+sandi lalu memegang sesinya sendiri.
   ===================================================================== */
export const perusahaan = {
  masuk: (isi) => api.post('/api/perusahaan/masuk', isi),
  saya:  (o) => api.get('/api/perusahaan/saya', o),

  // Unggahan peserta MCU
  mcuPaket:  (o) => api.get('/api/perusahaan/mcu/paket', o),
  mcuBatch:  (o) => api.get('/api/perusahaan/mcu/batch', o),
  mcuUnggah: (isi) => api.post('/api/perusahaan/mcu/batch', isi),
  mcuDetail: (no, o) => api.get(`/api/perusahaan/mcu/batch/${encodeURIComponent(no)}`, o),
  mcuBatal:  (no, alasan) => api.post(`/api/perusahaan/mcu/batch/${encodeURIComponent(no)}/batal`, { alasan }),

  // Hasil & dasbor
  mcuRingkas:     (o) => api.get('/api/perusahaan/mcu/ringkas', o),
  mcuHasil:       (o) => api.get('/api/perusahaan/mcu/hasil', o),
  mcuHasilDetail: (id, o) => api.get(`/api/perusahaan/mcu/hasil/${id}`, o),
}
