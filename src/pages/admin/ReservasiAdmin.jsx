import { useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { Tombol, Lencana, Memuat, Galat, Kosong, Info } from '../../components/ui/Dasar'
import { Teks } from '../../components/ui/Isian'

const STATUS = {
  MENUNGGU:     { label: 'Menunggu', corak: 'awas' },
  DIVERIFIKASI: { label: 'Booking dikonfirmasi', corak: 'sukses' },
  DITOLAK:      { label: 'Ditolak', corak: 'bahaya' },
  CHECKIN:      { label: 'Sudah check-in', corak: 'sukses' },
  SELESAI:      { label: 'Selesai', corak: 'sukses' },
  BATAL:        { label: 'Dibatalkan pasien', corak: 'abu' },
}
const FILTER = [
  { nilai: '', label: 'Semua' },
  { nilai: 'MENUNGGU', label: 'Menunggu' },
  { nilai: 'DIVERIFIKASI', label: 'Terkonfirmasi' },
  { nilai: 'CHECKIN', label: 'Check-in' },
  { nilai: 'DITOLAK', label: 'Ditolak' },
  { nilai: 'BATAL', label: 'Batal' },
]

const PENJAMIN = { '1': 'Pribadi/Umum', '2': 'Asuransi', '3': 'BPJS', '5': 'Jaminan Perusahaan' }
const tgl = (t) => { try { return new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) } catch { return t } }
const tglLahir = (t) => { try { return t ? new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' } catch { return t } }

export default function ReservasiAdmin() {
  const [status, setStatus] = useState('')
  const [sibuk, setSibuk] = useState(0)
  const [ci, setCi] = useState(null)     // reservasi yang sedang di-check-in
  const [ciReg, setCiReg] = useState('')
  const [ciMr, setCiMr] = useState('')
  const list = useMuat((o) => admin.reservasi({ status }, o), [status])
  const baris = list.data || []

  const bukaCheckin = (r) => { setCi(r); setCiReg(''); setCiMr(r.pasien_no_mr || r.no_rm_lama || '') }
  const submitCheckin = async () => {
    setSibuk(ci.id)
    try {
      await admin.reservasiStatus(ci.id, { status: 'CHECKIN', no_registrasi: ciReg, no_mr: ciMr })
      setCi(null); list.muatUlang()
    } catch (e) {
      window.alert(e.message || 'Gagal check-in.')
    } finally { setSibuk(0) }
  }

  const ubah = async (id, baru, perluCatatan) => {
    let catatan = ''
    if (perluCatatan) {
      catatan = window.prompt('Catatan untuk pasien (mis. alasan penolakan / arahan):') || ''
      if (baru === 'DITOLAK' && catatan.trim() === '') { window.alert('Alasan penolakan wajib diisi.'); return }
    }
    setSibuk(id)
    try {
      await admin.reservasiStatus(id, { status: baru, catatan_admin: catatan })
      list.muatUlang()
    } catch (e) {
      window.alert(e.message || 'Gagal memperbarui status.')
    } finally {
      setSibuk(0)
    }
  }

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-4)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--t-xl)' }}>Reservasi Pasien</h1>
        <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 2 }}>
          Konfirmasi booking dari portal pasien. Registrasi SIMRS dibuat saat check-in di hari kunjungan.
        </p>
      </div>

      <div className="baris geser-x" style={{ gap: 'var(--s-2)', flexWrap: 'wrap' }}>
        {FILTER.map((f) => (
          <button
            key={f.nilai}
            type="button"
            onClick={() => setStatus(f.nilai)}
            className={`btn btn--kecil ${status === f.nilai ? '' : 'btn--garis'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.memuat && <Memuat tinggi={90} jumlah={3} />}
      {list.galat && <Galat galat={list.galat} saatUlang={list.muatUlang} />}
      {!list.memuat && !list.galat && baris.length === 0 && (
        <Kosong judul="Belum ada reservasi" pesan="Reservasi dari portal pasien akan muncul di sini." />
      )}

      <div className="tumpuk" style={{ gap: 'var(--s-3)' }}>
        {baris.map((r) => {
          const st = STATUS[r.status] || { label: r.status, corak: 'abu' }
          return (
            <div key={r.id} className="cms-panel" style={{ padding: 'var(--s-4)' }}>
              <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>
                    {r.poli}{r.nama_dokter ? ` · ${r.nama_dokter}` : ''}
                  </div>
                  <div style={{ fontSize: 'var(--t-sm)', marginTop: 2 }}>
                    {tgl(r.tanggal)}{r.jam ? ` · ${r.jam}` : ''}
                  </div>
                </div>
                <Lencana corak={st.corak}>{st.label}</Lencana>
              </div>

              <div style={{
                marginTop: 'var(--s-3)', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--garis)',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--s-2)',
                fontSize: 'var(--t-sm)',
              }}>
                <div><span style={{ color: 'var(--teks-samar)' }}>Pasien:</span> <strong>{r.nama_pasien}</strong> {r.sudah_pernah ? <em style={{ color: 'var(--teks-lembut)' }}>(pasien lama)</em> : <em style={{ color: 'var(--hijau-700)' }}>(pasien baru)</em>}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>HP:</span> {r.no_hp}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>NIK:</span> {r.nik || '—'}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>Tempat/Tgl lahir:</span> {(r.tempat_lahir ? r.tempat_lahir + ', ' : '') + tglLahir(r.tgl_lahir)}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>JK:</span> {r.jenis_kelamin === 'L' ? 'Laki-laki' : r.jenis_kelamin === 'P' ? 'Perempuan' : '—'}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>Agama / Status:</span> {(r.agama || '—') + ' / ' + (r.status_nikah || '—')}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>Penjamin:</span> <strong>{PENJAMIN[r.jenis_penjamin] || '—'}</strong>{r.nama_penjamin ? ` · ${r.nama_penjamin}` : ''}{r.no_kartu ? ` · ${r.no_kartu}` : ''}</div>
                {r.no_rm_lama && <div><span style={{ color: 'var(--teks-samar)' }}>No. RM lama:</span> {r.no_rm_lama}</div>}
                {r.pasien_no_mr && <div><span style={{ color: 'var(--teks-samar)' }}>No. RM tertaut:</span> {r.pasien_no_mr}</div>}
              </div>

              {r.alamat && <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)' }}><span style={{ color: 'var(--teks-samar)' }}>Alamat:</span> {r.alamat}</div>}
              {r.keluhan && <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)' }}><span style={{ color: 'var(--teks-samar)' }}>Keluhan:</span> {r.keluhan}</div>}
              {r.catatan_admin && <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)', color: 'var(--teks-lembut)' }}>Catatan: {r.catatan_admin}</div>}
              {r.no_registrasi && (
                <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)', color: 'var(--hijau-700)' }}>
                  ✔ Terdaftar SIMRS — No. Registrasi <strong>{r.no_registrasi}</strong>{r.no_mr ? ` · No. RM ${r.no_mr}` : ''}
                </div>
              )}

              {['MENUNGGU', 'DIVERIFIKASI'].includes(r.status) && (
                <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-3)', flexWrap: 'wrap' }}>
                  {r.status === 'MENUNGGU' && (
                    <Tombol ukuran="kecil" onClick={() => ubah(r.id, 'DIVERIFIKASI', false)} disabled={sibuk === r.id}>
                      Konfirmasi booking
                    </Tombol>
                  )}
                  {r.status === 'DIVERIFIKASI' && (
                    <Tombol ukuran="kecil" onClick={() => bukaCheckin(r)} disabled={sibuk === r.id}>
                      Check-in pasien
                    </Tombol>
                  )}
                  <Tombol ukuran="kecil" corak="bahaya" onClick={() => ubah(r.id, 'DITOLAK', true)} disabled={sibuk === r.id}>
                    Tolak
                  </Tombol>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal check-in: catat No. Registrasi & No. RM dari SIMRS saat pasien datang. */}
      {ci && (
        <div onClick={() => setCi(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 'var(--s-4)' }}>
          <div onClick={(e) => e.stopPropagation()} className="cms-panel" style={{ width: '100%', maxWidth: 470, padding: 'var(--s-5)' }}>
            <h2 style={{ fontSize: 'var(--t-lg)' }}>Check-in pasien</h2>
            <p style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', marginTop: 2 }}>
              {ci.nama_pasien} · {ci.poli}{ci.nama_dokter ? ` · ${ci.nama_dokter}` : ''} · {tgl(ci.tanggal)}
              {' '}· {PENJAMIN[ci.jenis_penjamin] || '—'} · {ci.sudah_pernah ? 'pasien lama' : 'pasien baru'}
            </p>
            <div className="tumpuk" style={{ gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
              <Info corak="info">
                Buat registrasi pasien ini di <b>SIMRS → Pendaftaran</b> (data pasien ada di kartu ini),
                lalu tempel No. Registrasi &amp; No. RM-nya di sini agar tercatat & terlihat oleh pasien.
              </Info>
              <Teks label="No. Registrasi (dari SIMRS)" value={ciReg} onChange={(e) => setCiReg(e.target.value)} />
              <Teks label="No. Rekam Medik" value={ciMr} onChange={(e) => setCiMr(e.target.value)}
                bantuan="Untuk pasien baru, isi No. RM yang baru dibuat di SIMRS." />
              <div className="baris" style={{ justifyContent: 'flex-end', gap: 'var(--s-2)' }}>
                <Tombol corak="garis" onClick={() => setCi(null)} disabled={sibuk === ci.id}>Batal</Tombol>
                <Tombol onClick={submitCheckin} memuat={sibuk === ci.id}>Konfirmasi check-in</Tombol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
