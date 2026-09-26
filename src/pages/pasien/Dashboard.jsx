import { useMemo, useState } from 'react'
import { pasien } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { usePasien } from '../../context/PasienAuthContext'
import { Tombol, Lencana, Memuat, Galat } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'

const STATUS = {
  MENUNGGU:     { label: 'Menunggu verifikasi', corak: 'awas' },
  DIVERIFIKASI: { label: 'Terkonfirmasi',       corak: 'sukses' },
  DITOLAK:      { label: 'Ditolak',             corak: 'bahaya' },
  CHECKIN:      { label: 'Sudah check-in',      corak: 'sukses' },
  SELESAI:      { label: 'Selesai',             corak: 'sukses' },
  BATAL:        { label: 'Dibatalkan',          corak: 'abu' },
}
const AKTIF = ['MENUNGGU', 'DIVERIFIKASI', 'CHECKIN']

function tglPanjang(t) {
  try { return new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return t }
}
function tglPendek(t) {
  try { return new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return t }
}

export default function Dashboard() {
  const { profil } = usePasien()
  const reservasi = useMuat((o) => pasien.reservasi(o), [])
  const pesanan = useMuat((o) => pasien.pesanan(o), [])
  // Riwayat angka MCU. Gagal memuatnya TIDAK ditampilkan sebagai galat:
  // akun yang belum tertaut rekam medik memang tidak punya apa pun di sini,
  // dan itu keadaan normal, bukan kerusakan.
  const tren = useMuat((o) => pasien.mcuTren(o).catch(() => []), [])
  const [sibukId, setSibukId] = useState(null)
  useSeo({ judul: 'Dashboard Pasien' })
  const hariIni = new Date().toISOString().slice(0, 10)

  const batalkan = async (id) => {
    if (!window.confirm('Batalkan reservasi ini? Bila sudah jadi booking, antrean di klinik ikut dibatalkan.')) return
    setSibukId('batal' + id)
    try { await pasien.reservasiBatal(id); reservasi.muatUlang() }
    catch (e) { window.alert(e.message || 'Gagal membatalkan.') }
    finally { setSibukId(null) }
  }
  const checkin = async (id) => {
    setSibukId('ci' + id)
    try {
      const r = await pasien.reservasiCheckin(id)
      reservasi.muatUlang()
      window.alert(r?.data?.pesan || 'Check-in berhasil.')
    } catch (e) { window.alert(e.message || 'Gagal check-in.') }
    finally { setSibukId(null) }
  }

  const daftar = reservasi.data || []
  const aktif = useMemo(() => daftar.filter((r) => AKTIF.includes(r.status)), [daftar])
  const riwayat = useMemo(() => daftar.filter((r) => !AKTIF.includes(r.status)), [daftar])
  const stat = useMemo(() => ({
    akanDatang: daftar.filter((r) => ['DIVERIFIKASI', 'CHECKIN'].includes(r.status)).length,
    menunggu:   daftar.filter((r) => r.status === 'MENUNGGU').length,
    selesai:    daftar.filter((r) => r.status === 'SELESAI').length,
    total:      daftar.length,
  }), [daftar])

  const memuat = reservasi.memuat
  const props = { hariIni, sibukId, checkin, batalkan }

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-5)' }}>
      {/* Sambutan */}
      <section style={{
        background: 'linear-gradient(135deg, var(--hijau-800), var(--hijau-600))',
        color: '#fff', borderRadius: 'var(--r-lg)', padding: 'var(--s-5)',
        boxShadow: 'var(--bayang-2)',
      }}>
        <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'var(--t-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8 }}>
              Selamat datang
            </div>
            <h1 style={{ fontSize: 'var(--t-2xl)', lineHeight: 1.15, margin: '2px 0 0' }}>{profil?.nama || 'Pasien'}</h1>
            <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-3)', flexWrap: 'wrap' }}>
              <span style={chipHero}>
                No. RM: <b style={{ marginLeft: 4 }}>{profil?.no_mr || 'Belum tertaut'}</b>
              </span>
              {profil?.no_hp && <span style={chipHero}>{profil.no_hp}</span>}
            </div>
          </div>
          <Tombol ke="/pasien/reservasi/baru" corak="halus"
            style={{ background: '#fff', color: 'var(--hijau-800)', borderColor: '#fff', whiteSpace: 'nowrap' }}>
            + Buat Reservasi
          </Tombol>
        </div>
      </section>

      {/* Ringkasan */}
      <div style={{ display: 'grid', gap: 'var(--s-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        <Statistik label="Akan datang" nilai={stat.akanDatang} corak="var(--hijau-700)" />
        <Statistik label="Menunggu verifikasi" nilai={stat.menunggu} corak="var(--awas)" />
        <Statistik label="Selesai" nilai={stat.selesai} corak="var(--info)" />
        <Statistik label="Total kunjungan" nilai={stat.total} corak="var(--teks)" />
      </div>

      {memuat && <Memuat tinggi={90} jumlah={2} />}
      {reservasi.galat && <Galat galat={reservasi.galat} saatUlang={reservasi.muatUlang} />}

      {/* Kunjungan aktif */}
      {!memuat && !reservasi.galat && (
        <Bagian judul="Kunjungan aktif" jumlah={aktif.length}
          aksi={<Tombol ke="/pasien/reservasi/baru" corak="garis" ukuran="kecil">+ Reservasi</Tombol>}>
          {aktif.length === 0 ? (
            <KosongLembut pesan="Belum ada reservasi aktif. Buat reservasi poliklinik untuk memulai." />
          ) : (
            <div className="tumpuk" style={{ gap: 'var(--s-3)' }}>
              {aktif.map((r) => <KartuReservasi key={r.id} r={r} {...props} />)}
            </div>
          )}
        </Bagian>
      )}

      {/* Kesehatan dari MCU — ringkasan hasil terakhir beserta arah perubahannya.
          Sengaja di ATAS transaksi paket: yang dicari orang saat membuka
          dasbornya adalah kondisinya, bukan tagihannya. */}
      {!memuat && (tren.data || []).length > 0 && <RingkasKesehatan tren={tren.data} />}

      {/* Transaksi MCU & paket */}
      {!memuat && !reservasi.galat && (
        <Bagian judul="Transaksi MCU & Paket" jumlah={(pesanan.data || []).length}
          aksi={<Tombol ke="/pasien/paket" corak="garis" ukuran="kecil">+ Pesan Paket</Tombol>}>
          {(pesanan.data || []).length === 0 ? (
            <div style={{
              border: '1px dashed var(--garis-tegas)', borderRadius: 'var(--r-lg)',
              padding: 'var(--s-5)', textAlign: 'center', background: 'var(--putih)',
            }}>
              <div style={{ fontSize: 'var(--t-base)', fontWeight: 700 }}>Belum ada transaksi paket</div>
              <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', margin: '6px auto 0', maxWidth: 420 }}>
                Pesan paket Medical Check-Up atau layanan Homecare — bayar di klinik saat kunjungan.
              </p>
              <div className="baris" style={{ gap: 'var(--s-2)', justifyContent: 'center', marginTop: 'var(--s-4)', flexWrap: 'wrap' }}>
                <Tombol ke="/pasien/paket" corak="garis" ukuran="kecil">Lihat Paket & MCU</Tombol>
              </div>
            </div>
          ) : (
            <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
              {(pesanan.data || []).slice(0, 4).map((o) => <BarisPesanan key={o.id} o={o} />)}
              {(pesanan.data || []).length > 4 && (
                <div><Tombol ke="/pasien/pesanan" corak="polos" ukuran="kecil">Lihat semua pesanan →</Tombol></div>
              )}
            </div>
          )}
        </Bagian>
      )}

      {/* Riwayat */}
      {!memuat && !reservasi.galat && riwayat.length > 0 && (
        <Bagian judul="Riwayat" jumlah={riwayat.length}>
          <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
            {riwayat.map((r) => <BarisRiwayat key={r.id} r={r} />)}
          </div>
        </Bagian>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- bagian */
const KELAYAKAN_LABEL = {
  FIT: 'Layak bekerja', FIT_RESTRICTION: 'Layak dengan catatan',
  TEMPORARILY_UNFIT: 'Belum layak sementara', UNFIT: 'Tidak layak',
  PENDING: 'Menunggu pemeriksaan',
}

/** Arah perubahan satu angka: turun/naik/sama. Tanpa warna "baik/buruk" —
 *  naiknya tekanan darah buruk, naiknya berat belum tentu, dan menyimpulkan
 *  itu di dasbor bukan tugas perangkat lunak. */
function Arah({ sekarang, sebelum, satuan }) {
  const a = Number(sekarang), b = Number(sebelum)
  if (!isFinite(a)) return <span style={{ color: 'var(--teks-lembut)' }}>—</span>
  const selisih = isFinite(b) ? a - b : null
  const tanda = selisih == null || Math.abs(selisih) < 0.05 ? '' : (selisih > 0 ? '▲' : '▼')
  return (
    <span>
      <b>{sekarang}</b>{satuan ? <span style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}> {satuan}</span> : null}
      {tanda && (
        <span style={{ marginLeft: 6, fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}>
          {tanda} {Math.abs(selisih).toFixed(Math.abs(selisih) < 10 ? 1 : 0)} dari sebelumnya
        </span>
      )}
    </span>
  )
}

/**
 * Ringkasan kesehatan dari MCU terakhir.
 *
 * Kelayakan kerja hanya muncul bila server mengirimkannya — dan server hanya
 * mengirimkannya setelah dokter menandatangani. Draf tidak pernah sampai ke
 * sini, jadi tidak ada yang perlu disaring ulang di layar.
 */
function RingkasKesehatan({ tren }) {
  const [kini, lalu] = tren
  const tgl = (t) => {
    try {
      return new Date(String(t).slice(0, 10) + 'T00:00:00')
        .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch { return String(t) }
  }

  return (
    <Bagian judul="Kesehatan dari MCU"
      aksi={<Tombol ke="/pasien/hasil-mcu" corak="garis" ukuran="kecil">Lihat hasil</Tombol>}>
      <div style={{
        border: '1px solid var(--garis)', borderRadius: 'var(--r-lg)',
        padding: 'var(--s-4)', background: 'var(--putih)',
      }}>
        <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)' }}>
            Pemeriksaan terakhir · {tgl(kini.TglMCU)}
          </div>
          {kini.StatusKelayakan
            ? <Lencana corak={kini.StatusKelayakan === 'FIT' ? 'sukses'
                : kini.StatusKelayakan === 'UNFIT' ? 'bahaya' : 'awas'}>
                {KELAYAKAN_LABEL[kini.StatusKelayakan] || kini.StatusKelayakan}
              </Lencana>
            : <Lencana corak="abu">Menunggu tanda tangan dokter</Lencana>}
        </div>

        <div className="baris" style={{ gap: 'var(--s-5)', flexWrap: 'wrap', marginTop: 'var(--s-3)' }}>
          <div>
            <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}>Tekanan darah</div>
            {kini.Sistol && kini.Diastol
              ? <div><b>{kini.Sistol}/{kini.Diastol}</b><span style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}> mmHg</span></div>
              : <div style={{ color: 'var(--teks-lembut)' }}>—</div>}
          </div>
          <div>
            <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}>Indeks massa tubuh</div>
            <div><Arah sekarang={kini.Bmi} sebelum={lalu?.Bmi} satuan={kini.GolonganBmi || ''} /></div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)' }}>Berat badan</div>
            <div><Arah sekarang={kini.Bb} sebelum={lalu?.Bb} satuan="kg" /></div>
          </div>
        </div>

        {tren.length > 1 && (
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)', marginTop: 'var(--s-3)' }}>
            {tren.length} pemeriksaan tercatat — perkembangan lengkapnya ada di halaman Hasil MCU.
          </div>
        )}
      </div>
    </Bagian>
  )
}

function Bagian({ judul, jumlah, aksi, children }) {
  return (
    <section className="tumpuk" style={{ gap: 'var(--s-3)' }}>
      <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-2)' }}>
        <h2 style={{ fontSize: 'var(--t-lg)', display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
          {judul}
          {jumlah > 0 && (
            <span style={{
              fontSize: 'var(--t-xs)', fontWeight: 700, color: 'var(--hijau-700)',
              background: 'var(--hijau-100)', borderRadius: 'var(--r-bulat)', padding: '1px 8px',
            }}>{jumlah}</span>
          )}
        </h2>
        {aksi}
      </div>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------- statistik */
function Statistik({ label, nilai, corak }) {
  return (
    <div style={{
      background: 'var(--putih)', border: '1px solid var(--garis)', borderRadius: 'var(--r-lg)',
      padding: 'var(--s-4)', boxShadow: 'var(--bayang-1)',
    }}>
      <div style={{ fontSize: 'var(--t-2xl)', fontWeight: 800, lineHeight: 1, color: corak }}>{nilai}</div>
      <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6 }}>
        {label}
      </div>
    </div>
  )
}

function KosongLembut({ pesan }) {
  return (
    <div style={{
      border: '1px dashed var(--garis-tegas)', borderRadius: 'var(--r-lg)',
      padding: 'var(--s-5)', textAlign: 'center', color: 'var(--teks-lembut)',
      fontSize: 'var(--t-sm)', background: 'var(--putih)',
    }}>{pesan}</div>
  )
}

/* --------------------------------------------------------- kartu aktif */
function KartuReservasi({ r, hariIni, sibukId, checkin, batalkan }) {
  const st = STATUS[r.status] || { label: r.status, corak: 'abu' }
  const bisaBatal = ['MENUNGGU', 'DIVERIFIKASI'].includes(r.status)
  const bisaCheckin = r.status === 'DIVERIFIKASI' && r.tanggal === hariIni

  return (
    <div style={{
      background: 'var(--putih)', border: '1px solid var(--garis)',
      borderRadius: 'var(--r-lg)', padding: 'var(--s-4)', boxShadow: 'var(--bayang-1)',
    }}>
      <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{r.poli}</div>
          {r.nama_dokter && <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)' }}>{r.nama_dokter}</div>}
          <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>
            {tglPanjang(r.tanggal)}{r.jam ? ` · ${r.jam}` : ''}
          </div>
        </div>
        <Lencana corak={st.corak}>{st.label}</Lencana>
      </div>

      {r.keluhan && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', marginTop: 'var(--s-2)' }}>
          Keluhan: {r.keluhan}
        </div>
      )}

      {(r.no_antrian || r.no_trs_booking || r.no_registrasi) && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--s-3)',
          marginTop: 'var(--s-3)', padding: 'var(--s-3)', background: 'var(--hijau-50)', borderRadius: 'var(--r-md)',
        }}>
          {r.no_antrian && (
            <div>
              <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>No. Antrean</div>
              <div style={{ fontSize: 'var(--t-xl)', fontWeight: 800, color: 'var(--hijau-700)', lineHeight: 1.1 }}>{r.no_antrian}</div>
            </div>
          )}
          {r.no_trs_booking && (
            <div>
              <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>No. Booking</div>
              <div style={{ fontSize: 'var(--t-sm)', fontWeight: 700, marginTop: 4 }}>{r.no_trs_booking}</div>
            </div>
          )}
          {r.no_registrasi && (
            <div>
              <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>No. Registrasi</div>
              <div style={{ fontSize: 'var(--t-sm)', fontWeight: 700, marginTop: 4 }}>{r.no_registrasi}</div>
            </div>
          )}
        </div>
      )}

      {r.catatan_admin && (
        <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', marginTop: 'var(--s-2)' }}>
          Catatan klinik: {r.catatan_admin}
        </div>
      )}

      {bisaCheckin && (
        <div className="galat-kotak" role="status" style={{ background: 'var(--sukses-bg)', color: 'var(--sukses)', borderColor: 'currentColor', marginTop: 'var(--s-3)' }}>
          Hari ini jadwal kunjungan Anda — silakan <b>check-in</b> setibanya di klinik.
        </div>
      )}

      {(bisaCheckin || bisaBatal) && (
        <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-3)', flexWrap: 'wrap' }}>
          {bisaCheckin && (
            <Tombol ukuran="kecil" onClick={() => checkin(r.id)} disabled={sibukId === 'ci' + r.id}>
              {sibukId === 'ci' + r.id ? 'Check-in…' : 'Check-in sekarang'}
            </Tombol>
          )}
          {bisaBatal && (
            <Tombol corak="garis" ukuran="kecil" onClick={() => batalkan(r.id)} disabled={sibukId === 'batal' + r.id}>
              {sibukId === 'batal' + r.id ? 'Membatalkan…' : 'Batalkan'}
            </Tombol>
          )}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------- baris riwayat */
function BarisRiwayat({ r }) {
  const st = STATUS[r.status] || { label: r.status, corak: 'abu' }
  return (
    <div className="baris" style={{
      justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap',
      background: 'var(--putih)', border: '1px solid var(--garis)', borderRadius: 'var(--r-md)',
      padding: 'var(--s-3) var(--s-4)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>
          {r.poli}{r.nama_dokter ? ` · ${r.nama_dokter}` : ''}
        </div>
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)', marginTop: 2 }}>
          {tglPendek(r.tanggal)}{r.no_registrasi ? ` · Reg ${r.no_registrasi}` : ''}
        </div>
      </div>
      <Lencana corak={st.corak}>{st.label}</Lencana>
    </div>
  )
}

/* ---------------------------------------------------------- baris pesanan */
const STATUS_ORDER = {
  MENUNGGU:     { label: 'Menunggu', corak: 'awas' },
  DIKONFIRMASI: { label: 'Dikonfirmasi', corak: 'sukses' },
  SELESAI:      { label: 'Selesai', corak: 'sukses' },
  BATAL:        { label: 'Batal', corak: 'abu' },
}
function BarisPesanan({ o }) {
  const st = STATUS_ORDER[o.status] || { label: o.status, corak: 'abu' }
  const rp = o.harga == null ? '—' : 'Rp ' + Number(o.harga).toLocaleString('id-ID')
  return (
    <div className="baris" style={{
      justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap',
      background: 'var(--putih)', border: '1px solid var(--garis)', borderRadius: 'var(--r-md)',
      padding: 'var(--s-3) var(--s-4)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>{o.nama_paket}</div>
        <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)', marginTop: 2 }}>
          {rp} · {o.jml_kunjungan || 1}× kunjungan{o.no_order_simrs ? ` · ${o.no_order_simrs}` : ''}
        </div>
      </div>
      <Lencana corak={st.corak}>{st.label}</Lencana>
    </div>
  )
}

const chipHero = {
  fontSize: 'var(--t-xs)', background: 'rgba(255,255,255,0.16)', color: '#fff',
  borderRadius: 'var(--r-bulat)', padding: '3px 10px', whiteSpace: 'nowrap',
}
