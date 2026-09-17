# Frontend Website Klinik Pratama Andini

Situs publik dan CMS-nya dalam satu aplikasi React. React 18, Vite, tanpa
kerangka UI — gaya ditulis sendiri di atas token desain.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
```

Backend harus jalan lebih dulu di `http://127.0.0.1:8080`. Vite meneruskan
`/api`, `/media`, `/sitemap.xml`, dan `/robots.txt` ke sana, sehingga peramban
melihat semuanya berasal dari satu asal — CORS tidak ikut campur, dan
perilakunya sama dengan di production yang memang satu domain.

```bash
npm run build      # keluar ke dist/
npm run preview
```

## Susunan berkas

```
src/
  main.jsx            akar + penangkap galat render
  App.jsx             seluruh rute; CMS dimuat terpisah (lazy)
  styles/
    tokens.css        SATU-SATUNYA tempat warna, jarak, dan ukuran huruf
    global.css        dasar, tata letak, tombol, kartu, prosa
  lib/
    api.js            satu pintu ke backend + daftar titik akhir
    useMuat.js        memuat data dengan tiga keadaan yang selalu lengkap
    format.js         rupiah, tanggal, dan potongan teks ala Indonesia
    seo.js            judul & meta per halaman
  context/
    SiteContext.jsx   pengaturan situs, dimuat sekali di akar
    AuthContext.jsx   sesi pengelola CMS
  components/
    publik/           Navbar, Footer, KartuKonten, BagikanSosial, dll.
    admin/            Kerangka CMS, Editor, PilihMedia, Konfirmasi
    ui/               Tombol, Lencana, keadaan muat/galat, isian formulir
  pages/
    publik/           Beranda, DaftarKonten, DetailKonten, Dokter, Kontak, …
    admin/            Dasbor, DaftarKonten, FormKonten, Pengaturan, …
```

**`DaftarKonten` dan `DetailKonten` melayani enam modul sekaligus** (artikel,
berita, video, layanan, MCU, homecare). Menulis enam pasang halaman yang
isinya sama berarti setiap perbaikan harus diingat enam kali — dan yang
terlupa satu menjadi bug yang hanya muncul di satu menu.

## Keputusan yang perlu diketahui sebelum mengubah

**Warna tidak pernah ditulis langsung di komponen.** Seluruhnya lewat token
pada `styles/tokens.css`. Warna yang ditulis di satu komponen adalah warna
yang tidak ikut berubah saat identitas visualnya disesuaikan, dan yang
tertinggal itu selalu baru ketahuan setelah tayang.

**Tombol WhatsApp menghilang sendiri bila nomornya belum diisi.** Backend
mengembalikan `whatsapp: null`, dan situs menampilkan tombol Telepon sebagai
gantinya. Tombol WhatsApp yang mengarah ke nomor tak terdaftar tidak pernah
terlihat oleh klinik — hanya oleh calon pasien yang lalu pergi.

**Saringan dan nomor halaman disimpan di URL, bukan di state.** Hasil
penyaringan dengan begitu dapat dibagikan dan di-bookmark, dan tombol
"kembali" peramban mengembalikan pengunjung ke tempat yang sama.

**HTML dari CMS dipasang dengan `dangerouslySetInnerHTML`.** Itu aman karena
isinya sudah dibersihkan **di server** dengan daftar putih tag dan atribut
sebelum tersimpan. Jangan memindahkan pembersihan itu ke peramban: yang
tersimpan kotor akan ikut terkirim ke mana pun isi itu dipakai kelak.

**Wewenang di sisi peramban hanya menyembunyikan menu.** `useAuth().boleh()`
menentukan apa yang tampil, bukan apa yang boleh dilakukan — penjaga yang
sesungguhnya ada di server, dan yang di sini dapat dilewati siapa pun yang
membuka alat pengembang.

**Judul dan meta diganti per halaman lewat `useSeo`.** Situs ini satu halaman,
jadi tag di `index.html` tidak berganti sendiri. Tanpa hook itu setiap halaman
akan dibagikan ke WhatsApp dengan judul dan gambar yang sama. Perayap yang
tidak menjalankan JavaScript tetap melihat isi `index.html`; bila peringkat
pencarian kelak jadi penting, jawabannya prerender di sisi server — bukan
menambah tag lagi di sini.

## Terpasang dan teruji

Diuji 8 September 2026 dengan Chrome melalui Playwright, terhadap backend dan
basis data `webcompro` yang terpisah:

- Sembilan halaman publik dimuat tanpa satu pun galat konsol; judul tab dan
  `h1` benar di semuanya.
- Alur CMS penuh: masuk → buat artikel di editor → tayang → muncul di daftar
  CMS → muncul di situs publik → halaman detailnya terbuka.
- Delapan layar CMS lain (dokter, sinkronisasi, kategori, media, pengaturan,
  pengguna, halaman, fasilitas) terbuka tanpa galat.
- `npm run build` bersih. Berkas untuk pengunjung 80 kB (24 kB gzip); editor
  teks kaya 473 kB dipisah ke potongan sendiri dan hanya diunduh saat CMS
  dibuka.

Data uji sudah dihapus kembali.
