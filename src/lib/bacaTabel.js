/**
 * Baca berkas daftar peserta (.xlsx / .csv) menjadi larik baris — di peramban,
 * tanpa pustaka pihak ketiga.
 *
 * Kenapa ditulis sendiri dan bukan memakai SheetJS: berkas ini datang dari
 * pihak luar (staf HRD perusahaan klien), dan salinan SheetJS yang ada di npm
 * berhenti di 0.18.5 dengan dua kerentanan tingkat tinggi yang belum ditambal
 * di sana — salah satunya prototype pollution, yang pada halaman ini berarti
 * satu berkas berbahaya bisa menyentuh token sesi. Yang dibutuhkan portal ini
 * hanya membaca satu lembar berisi tabel datar, dan peramban modern sudah
 * punya semua bahannya: DecompressionStream untuk membuka zip-nya dan
 * DOMParser untuk XML-nya.
 *
 * Yang didukung: .xlsx satu lembar (deflate atau tanpa kompresi) dan .csv
 * (koma, titik koma, atau tab). Selebihnya ditolak dengan pesan yang jelas,
 * bukan dibaca setengah-setengah.
 */

/* ------------------------------------------------------------------ zip */

/** Ambil satu berkas dari arsip zip berdasarkan namanya. */
async function dariZip(buf, nama) {
  const dv = new DataView(buf)
  const u8 = new Uint8Array(buf)

  // Direktori pusat zip dibaca dari belakang: hanya di sana nama berkas dan
  // posisinya tercatat lengkap.
  let eocd = -1
  for (let i = u8.length - 22; i >= 0 && i > u8.length - 66000; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('Berkas .xlsx tidak utuh (penanda akhir arsip tidak ditemukan).')

  const jumlah = dv.getUint16(eocd + 10, true)
  let p = dv.getUint32(eocd + 16, true)
  const dec = new TextDecoder()

  for (let i = 0; i < jumlah; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break
    const metode  = dv.getUint16(p + 10, true)
    const nUkuran = dv.getUint32(p + 20, true)
    const nNama   = dv.getUint16(p + 28, true)
    const nEkstra = dv.getUint16(p + 30, true)
    const nKoment = dv.getUint16(p + 32, true)
    const offset  = dv.getUint32(p + 42, true)
    const namaIni = dec.decode(u8.subarray(p + 46, p + 46 + nNama))

    if (namaIni === nama) {
      // Header lokal punya panjang nama/ekstra sendiri — panjangnya bisa
      // berbeda dari yang di direktori pusat, jadi dibaca ulang di sini.
      const lNama   = dv.getUint16(offset + 26, true)
      const lEkstra = dv.getUint16(offset + 28, true)
      const mulai   = offset + 30 + lNama + lEkstra
      const mentah  = u8.subarray(mulai, mulai + nUkuran)

      if (metode === 0) return dec.decode(mentah)
      if (metode !== 8) throw new Error('Kompresi .xlsx tidak dikenali. Simpan ulang berkas dari Excel.')

      const aliran = new Blob([mentah]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      return await new Response(aliran).text()
    }
    p += 46 + nNama + nEkstra + nKoment
  }
  return null
}

/* ----------------------------------------------------------------- xlsx */

/** "BC12" -> 54 (indeks kolom, mulai 0). */
function indeksKolom(ref) {
  const h = /^([A-Z]+)/.exec(ref)
  if (!h) return 0
  let n = 0
  for (const c of h[1]) n = n * 26 + (c.charCodeAt(0) - 64)
  return n - 1
}

/**
 * Tanggal Excel adalah angka hari sejak 1899-12-30. Dikembalikan sebagai
 * teks YYYY-MM-DD supaya sisa aplikasi tidak perlu tahu asal-usulnya.
 */
function tanggalExcel(n) {
  const ms = Math.round((n - 25569) * 86400000)
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return String(n)
  return d.toISOString().slice(0, 10)
}

async function bacaXlsx(file) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Peramban ini belum bisa membuka .xlsx. Simpan berkas sebagai CSV lalu unggah lagi.')
  }
  const buf = await file.arrayBuffer()

  const wbXml = await dariZip(buf, 'xl/workbook.xml')
  if (wbXml === null) throw new Error('Ini bukan berkas Excel (.xlsx) yang sah.')

  // Lembar pertama saja: daftar peserta selalu satu tabel.
  let sheet = await dariZip(buf, 'xl/worksheets/sheet1.xml')
  if (sheet === null) throw new Error('Lembar kerja tidak ditemukan di dalam berkas.')

  const ssXml = await dariZip(buf, 'xl/sharedStrings.xml')
  const dp = new DOMParser()

  const teksBersama = []
  if (ssXml) {
    const d = dp.parseFromString(ssXml, 'application/xml')
    for (const si of d.getElementsByTagName('si')) {
      // Satu sel bisa terpecah menjadi beberapa <t> bila sebagian hurufnya
      // diberi format berbeda — semuanya digabung kembali.
      let s = ''
      for (const t of si.getElementsByTagName('t')) s += t.textContent
      teksBersama.push(s)
    }
  }

  const d = dp.parseFromString(sheet, 'application/xml')
  if (d.getElementsByTagName('parsererror').length) {
    throw new Error('Isi berkas Excel tidak terbaca. Simpan ulang dari Excel lalu coba lagi.')
  }

  const baris = []
  for (const row of d.getElementsByTagName('row')) {
    const isi = []
    for (const c of row.getElementsByTagName('c')) {
      const kol = indeksKolom(c.getAttribute('r') || '')
      const tipe = c.getAttribute('t')
      let v = ''

      if (tipe === 'inlineStr') {
        for (const t of c.getElementsByTagName('t')) v += t.textContent
      } else {
        const vEl = c.getElementsByTagName('v')[0]
        const raw = vEl ? vEl.textContent : ''
        if (tipe === 's') v = teksBersama[Number(raw)] ?? ''
        else if (tipe === 'b') v = raw === '1' ? 'TRUE' : 'FALSE'
        else v = raw
      }

      /*
       * Sel bergaya tanggal disimpan sebagai angka hari. Tiga syarat sekaligus
       * supaya angka biasa tidak ikut berubah menjadi tanggal: bukan sel teks,
       * gayanya bukan 0 (0 = "General", yang tidak pernah dipakai Excel untuk
       * tanggal), dan angkanya 5 digit bulat di rentang 1954–2064. NIK 16 digit
       * jauh di luar rentang itu.
       */
      const gaya = c.getAttribute('s')
      if (!tipe && v !== '' && gaya && gaya !== '0' && /^\d{5}$/.test(v)) {
        const n = Number(v)
        if (n > 20000 && n < 60000) v = tanggalExcel(n)
      }

      isi[kol] = String(v).trim()
    }
    baris.push(isi)
  }
  return baris
}

/* ------------------------------------------------------------------ csv */

function bacaCsv(teks) {
  // BOM dari Excel ikut terbaca sebagai huruf pertama judul kolom bila tidak
  // dibuang di sini.
  if (teks.charCodeAt(0) === 0xfeff) teks = teks.slice(1)

  const barisPertama = teks.split(/\r?\n/, 1)[0] || ''
  const pemisah = [';', '\t', ','].find((s) => barisPertama.includes(s)) || ','

  const baris = []
  let sel = ''
  let isi = []
  let dalamKutip = false

  for (let i = 0; i < teks.length; i++) {
    const c = teks[i]
    if (dalamKutip) {
      if (c === '"') {
        if (teks[i + 1] === '"') { sel += '"'; i++ } else dalamKutip = false
      } else sel += c
      continue
    }
    if (c === '"') { dalamKutip = true; continue }
    if (c === pemisah) { isi.push(sel.trim()); sel = ''; continue }
    if (c === '\n') { isi.push(sel.trim()); baris.push(isi); isi = []; sel = ''; continue }
    if (c === '\r') continue
    sel += c
  }
  if (sel !== '' || isi.length) { isi.push(sel.trim()); baris.push(isi) }

  return baris
}

/* --------------------------------------------------------------- pemetaan */

/** Judul kolom yang dikenali, ditulis longgar supaya ejaan sehari-hari lolos. */
const SINONIM = {
  nama:          ['nama', 'nama lengkap', 'nama karyawan', 'nama peserta', 'name'],
  nik:           ['nik', 'no ktp', 'nomor ktp', 'no. ktp', 'ktp', 'nomor induk kependudukan'],
  tgl_lahir:     ['tgl lahir', 'tanggal lahir', 'tgl. lahir', 'tanggallahir', 'tgllahir', 'dob', 'birth date'],
  alamat:        ['alamat', 'alamat lengkap', 'address'],
  jenis_kelamin: ['jenis kelamin', 'jk', 'gender', 'l/p', 'kelamin', 'sex'],
}

const rapikan = (s) => String(s || '').toLowerCase().replace(/[^a-z/ ]+/g, ' ').replace(/\s+/g, ' ').trim()

/** Samakan berbagai penulisan tanggal menjadi YYYY-MM-DD. */
export function rapikanTanggal(v) {
  const s = String(v || '').trim()
  if (s === '') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s)   // 31/12/1990
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`

  const m2 = /^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/.exec(s)       // 1990.12.31
  if (m2) return `${m2[1]}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`

  return s   // dibiarkan apa adanya; validasi di layar yang menandainya
}

/**
 * Baca berkas menjadi daftar peserta.
 *
 * @returns {Promise<{peserta: Array, kolom: Object, judul: string[], lewat: number}>}
 */
export async function bacaBerkasPeserta(file) {
  const nama = (file.name || '').toLowerCase()

  let baris
  if (nama.endsWith('.xlsx')) baris = await bacaXlsx(file)
  else if (nama.endsWith('.csv') || nama.endsWith('.txt')) baris = bacaCsv(await file.text())
  else if (nama.endsWith('.xls')) {
    throw new Error('Format .xls lama belum didukung. Buka di Excel lalu "Save As" .xlsx atau CSV.')
  } else {
    throw new Error('Format berkas tidak dikenali. Gunakan .xlsx atau .csv.')
  }

  baris = baris.filter((b) => b && b.some((s) => String(s || '').trim() !== ''))
  if (baris.length === 0) throw new Error('Berkasnya kosong.')

  // Baris judul dicari, bukan diasumsikan di baris pertama: berkas dari HRD
  // sering diawali judul laporan atau logo.
  let iJudul = -1
  let kolom = {}
  for (let i = 0; i < Math.min(baris.length, 10); i++) {
    const uji = {}
    baris[i].forEach((sel, k) => {
      const r = rapikan(sel)
      for (const [kunci, daftar] of Object.entries(SINONIM)) {
        if (uji[kunci] === undefined && daftar.includes(r)) uji[kunci] = k
      }
    })
    if (uji.nama !== undefined) { iJudul = i; kolom = uji; break }
  }

  if (iJudul < 0) {
    throw new Error('Kolom "Nama" tidak ditemukan. Pastikan berkas punya baris judul '
      + 'dengan kolom: Nama, NIK, Tgl Lahir, Alamat, Jenis Kelamin.')
  }

  const judul = baris[iJudul].map((s) => String(s || ''))
  const peserta = []
  let lewat = 0

  for (let i = iJudul + 1; i < baris.length; i++) {
    const b = baris[i]
    const ambil = (k) => (kolom[k] === undefined ? '' : String(b[kolom[k]] ?? '').trim())

    const namaOrang = ambil('nama')
    if (namaOrang === '') { lewat++; continue }

    const jk = rapikan(ambil('jenis_kelamin'))
    peserta.push({
      baris: i + 1,
      nama: namaOrang,
      nik: ambil('nik').replace(/\D+/g, ''),
      tgl_lahir: rapikanTanggal(ambil('tgl_lahir')),
      alamat: ambil('alamat'),
      jenis_kelamin: ['l', 'laki laki', 'laki', 'pria', 'm', 'male'].includes(jk) ? 'L'
        : ['p', 'perempuan', 'wanita', 'f', 'female'].includes(jk) ? 'P' : '',
    })
  }

  if (peserta.length === 0) throw new Error('Tidak ada baris peserta yang berisi nama.')

  return { peserta, kolom, judul, lewat }
}
