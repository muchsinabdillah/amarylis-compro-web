/**
 * Pemformatan tampilan.
 *
 * Semuanya dalam bahasa dan kebiasaan Indonesia: rupiah tanpa desimal,
 * tanggal dengan nama bulan, dan jam 24 jam.
 */

const RUPIAH = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Harga.
 *
 * Nilai kosong TIDAK dijadikan "Rp 0" — nol adalah harga, dan menampilkannya
 * untuk layanan yang harganya belum ditentukan adalah kekeliruan yang
 * merugikan klinik maupun pasien.
 */
export function rupiah(nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return null
  const n = Number(nilai)
  return Number.isFinite(n) ? RUPIAH.format(n) : null
}

export function hargaTampil(nilai, jenis) {
  const angka = rupiah(nilai)
  if (jenis === 'mulai_dari' && angka) return `Mulai ${angka}`
  if (jenis === 'hubungi' || !angka) return 'Hubungi kami'
  return angka
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/**
 * Ubah nilai waktu dari Postgres menjadi Date.
 *
 * Postgres mengirim "2026-09-08 13:05:08.123456+07". Dua hal di dalamnya
 * membuat `new Date()` menyerah dan mengembalikan Invalid Date:
 *
 *   - spasi di antara tanggal dan jam (butuh "T"), dan
 *   - zona waktu "+07" tanpa menit — ISO 8601 menuntut "+07:00".
 *
 * Keduanya diperbaiki di sini. Kegagalannya tidak menimbulkan galat apa pun;
 * yang terlihat hanyalah kolom tanggal yang kosong di seluruh layar, dan
 * itu mudah dikira "memang belum ada datanya".
 */
function keTanggal(nilai) {
  if (!nilai) return null

  let teks = String(nilai).trim().replace(' ', 'T')
  teks = teks.replace(/([+-]\d{2})$/, '$1:00')

  const d = new Date(teks)
  return Number.isNaN(d.getTime()) ? null : d
}

export function tanggal(nilai) {
  const d = keTanggal(nilai)
  return d ? `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}` : ''
}

export function tanggalJam(nilai) {
  const d = keTanggal(nilai)
  if (!d) return ''
  const jj = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${tanggal(nilai)}, ${jj}:${mm}`
}

/** "3 hari lalu" untuk daftar di CMS; tanggal penuh tetap dipakai di situs. */
export function sejak(nilai) {
  const d = keTanggal(nilai)
  if (!d) return ''
  const detik = Math.floor((Date.now() - d.getTime()) / 1000)
  if (detik < 60) return 'baru saja'
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`
  if (detik < 604800) return `${Math.floor(detik / 86400)} hari lalu`
  return tanggal(nilai)
}

export function angka(nilai) {
  const n = Number(nilai)
  return Number.isFinite(n) ? new Intl.NumberFormat('id-ID').format(n) : '0'
}

export function potong(teks, maks = 140) {
  const t = String(teks || '').trim()
  return t.length > maks ? `${t.slice(0, maks - 1).trimEnd()}…` : t
}

/** Nomor telepon jadi tautan tel: yang benar. */
export function tautanTelepon(nomor) {
  const bersih = String(nomor || '').replace(/[^\d+]/g, '')
  return bersih ? `tel:${bersih}` : null
}
