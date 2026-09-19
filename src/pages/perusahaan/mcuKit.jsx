/**
 * Potongan tampilan yang dipakai bersama seluruh halaman portal MCU.
 *
 * Status batch dan status peserta muncul di empat layar; menuliskan warnanya
 * di tiap layar membuat "SELESAI" cepat berbeda arti dari satu halaman ke
 * halaman lain.
 */

export const LENCANA_BATCH = {
  DIUNGGAH: { teks: 'Menunggu verifikasi', corak: 'tunggu' },
  DIPROSES: { teks: 'Sebagian diproses',  corak: 'jalan' },
  SELESAI:  { teks: 'Selesai',            corak: 'sukses' },
  BATAL:    { teks: 'Dibatalkan',         corak: 'batal' },
}

export const LENCANA_PESERTA = {
  MENUNGGU:    { teks: 'Menunggu',        corak: 'tunggu' },
  DIVERIFIKASI:{ teks: 'Terverifikasi',   corak: 'jalan' },
  SELESAI:     { teks: 'Terdaftar',       corak: 'sukses' },
  GAGAL:       { teks: 'Perlu perbaikan', corak: 'batal' },
  DILEWATI:    { teks: 'Dilewati',        corak: 'diam' },
}

export const LENCANA_COCOK = {
  LAMA:      { teks: 'Pasien lama',      corak: 'jalan' },
  BARU:      { teks: 'Pasien baru',      corak: 'sukses' },
  DIPERIKSA: { teks: 'Dipastikan klinik', corak: 'tunggu' },
  BELUM:     { teks: '—',                corak: 'diam' },
}

export function Lencana({ peta, nilai, kosong = '—' }) {
  const l = peta[nilai]
  if (!l) return <span className="mcu-lencana diam">{nilai || kosong}</span>
  return <span className={'mcu-lencana ' + l.corak}>{l.teks}</span>
}

export const tanggal = (t) => {
  if (!t) return '—'
  const d = new Date(String(t).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(t)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const waktu = (t) => {
  if (!t) return '—'
  const d = new Date(String(t).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return String(t)
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Kartu angka ringkas untuk kepala halaman. */
export function Angka({ label, nilai, corak = '' }) {
  return (
    <div className={'mcu-angka ' + corak}>
      <div className="mcu-angka__n">{nilai}</div>
      <div className="mcu-angka__l">{label}</div>
    </div>
  )
}

export const CSS_MCU = `
.mcu-lencana {
  display:inline-block; padding:2px 9px; border-radius:999px;
  font-size:var(--t-xs); font-weight:700; white-space:nowrap; line-height:1.6;
}
.mcu-lencana.sukses { background:#dcf3e4; color:#15803d; }
.mcu-lencana.jalan  { background:#dbeafe; color:#1d4ed8; }
.mcu-lencana.tunggu { background:#fef3c7; color:#b45309; }
.mcu-lencana.batal  { background:#fee2e2; color:#b91c1c; }
.mcu-lencana.diam   { background:var(--hijau-50); color:var(--teks-samar); }

.mcu-kartu {
  background:var(--putih); border:1px solid var(--garis);
  border-radius:var(--r-lg); padding:var(--s-4);
}
.mcu-kepala { margin-bottom:var(--s-4); }
.mcu-kepala h1 { font-size:var(--t-lg); margin:0; }
.mcu-kepala p { color:var(--teks-lembut); font-size:var(--t-sm); margin:4px 0 0; }

.mcu-angka-baris { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:var(--s-3); }
.mcu-angka {
  background:var(--putih); border:1px solid var(--garis);
  border-radius:var(--r-lg); padding:var(--s-3) var(--s-4);
}
.mcu-angka__n { font-size:1.6rem; font-weight:800; line-height:1.1; }
.mcu-angka__l { font-size:var(--t-xs); color:var(--teks-lembut); margin-top:2px; }
.mcu-angka.sukses .mcu-angka__n { color:#15803d; }
.mcu-angka.tunggu .mcu-angka__n { color:#b45309; }
.mcu-angka.batal  .mcu-angka__n { color:#b91c1c; }

.mcu-tabel-bungkus { overflow-x:auto; border:1px solid var(--garis); border-radius:var(--r-lg); background:var(--putih); }
.mcu-tabel { width:100%; border-collapse:collapse; font-size:var(--t-sm); min-width:640px; }
.mcu-tabel th {
  text-align:left; padding:10px 12px; background:var(--hijau-50);
  font-size:var(--t-xs); text-transform:uppercase; letter-spacing:.04em;
  color:var(--teks-lembut); border-bottom:1px solid var(--garis); white-space:nowrap;
}
.mcu-tabel td { padding:10px 12px; border-bottom:1px solid var(--garis); vertical-align:top; }
.mcu-tabel tr:last-child td { border-bottom:0; }
.mcu-tabel tbody tr:hover { background:var(--hijau-50); }
.mcu-mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:0.92em; }
.mcu-samar { color:var(--teks-samar); }

.mcu-galat {
  background:#fee2e2; border:1px solid #fca5a5; color:#991b1b;
  border-radius:var(--r-md); padding:10px 12px; font-size:var(--t-sm);
}
.mcu-info {
  background:#eef4ff; border:1px solid #c7d8fb; color:#1e40af;
  border-radius:var(--r-md); padding:10px 12px; font-size:var(--t-sm);
}
.mcu-hati {
  background:#fffbeb; border:1px solid #fde68a; color:#92400e;
  border-radius:var(--r-md); padding:10px 12px; font-size:var(--t-sm);
}
.mcu-baris { display:flex; gap:var(--s-3); flex-wrap:wrap; align-items:flex-end; }
.mcu-kosong { text-align:center; color:var(--teks-lembut); padding:var(--s-5); font-size:var(--t-sm); }
`
