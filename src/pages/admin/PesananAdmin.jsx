import { useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { Tombol, Lencana, Memuat, Galat, Kosong, Info } from '../../components/ui/Dasar'
import { Teks } from '../../components/ui/Isian'

const STATUS = {
  MENUNGGU:     { label: 'Menunggu', corak: 'awas' },
  DIKONFIRMASI: { label: 'Dikonfirmasi', corak: 'sukses' },
  SELESAI:      { label: 'Selesai', corak: 'sukses' },
  BATAL:        { label: 'Dibatalkan', corak: 'abu' },
}
const FILTER = [
  { nilai: '', label: 'Semua' },
  { nilai: 'MENUNGGU', label: 'Menunggu' },
  { nilai: 'DIKONFIRMASI', label: 'Dikonfirmasi' },
  { nilai: 'SELESAI', label: 'Selesai' },
  { nilai: 'BATAL', label: 'Batal' },
]
const JENIS = { mcu: 'MCU', homecare: 'Homecare', lainnya: 'Layanan' }
const rupiah = (n) => (n == null || n === '' ? '—' : 'Rp ' + Number(n).toLocaleString('id-ID'))
const tgl = (t) => { try { return t ? new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' } catch { return t } }

export default function PesananAdmin() {
  const [status, setStatus] = useState('')
  const [sibuk, setSibuk] = useState(0)
  const [jual, setJual] = useState(null)   // pesanan yang sedang dijual ke SIMRS
  const [noReg, setNoReg] = useState('')
  const list = useMuat((o) => admin.pesanan({ status }, o), [status])
  const baris = list.data || []

  const ubah = async (id, baru) => {
    setSibuk(id)
    try { await admin.pesananStatus(id, { status: baru }); list.muatUlang() }
    catch (e) { window.alert(e.message || 'Gagal memperbarui status.') }
    finally { setSibuk(0) }
  }

  const submitJual = async () => {
    if (!noReg.trim()) { window.alert('Isi No. Registrasi pasien.'); return }
    setSibuk(jual.id)
    try {
      const r = await admin.pesananStatus(jual.id, { status: 'DIKONFIRMASI', no_registrasi: noReg.trim() })
      setJual(null); list.muatUlang()
      window.alert(r?.data?.pesan || 'Paket terjual di SIMRS.')
    } catch (e) { window.alert(e.message || 'Gagal menjual paket.') }
    finally { setSibuk(0) }
  }

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-4)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--t-xl)' }}>Pesanan Paket</h1>
        <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 2 }}>
          Pesanan paket MCU & layanan dari portal pasien. Jual ke SIMRS saat pasien sudah punya No. Registrasi (jumlah kunjungan mengikuti master paket).
        </p>
      </div>

      <div className="baris geser-x" style={{ gap: 'var(--s-2)', flexWrap: 'wrap' }}>
        {FILTER.map((f) => (
          <button key={f.nilai} type="button" onClick={() => setStatus(f.nilai)}
            className={`btn btn--kecil ${status === f.nilai ? '' : 'btn--garis'}`}>{f.label}</button>
        ))}
      </div>

      {list.memuat && <Memuat tinggi={90} jumlah={3} />}
      {list.galat && <Galat galat={list.galat} saatUlang={list.muatUlang} />}
      {!list.memuat && !list.galat && baris.length === 0 && (
        <Kosong judul="Belum ada pesanan" pesan="Pesanan paket dari portal pasien akan muncul di sini." />
      )}

      <div className="tumpuk" style={{ gap: 'var(--s-3)' }}>
        {baris.map((o) => {
          const st = STATUS[o.status] || { label: o.status, corak: 'abu' }
          return (
            <div key={o.id} className="cms-panel" style={{ padding: 'var(--s-4)' }}>
              <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{o.nama_paket} <span style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)', fontWeight: 400 }}>· {JENIS[o.jenis] || 'Layanan'}</span></div>
                  <div style={{ fontSize: 'var(--t-sm)', marginTop: 2 }}>
                    {rupiah(o.harga)} · {o.jml_kunjungan || 1}× kunjungan{o.tanggal ? ` · rencana ${tgl(o.tanggal)}` : ''}
                  </div>
                </div>
                <Lencana corak={st.corak}>{st.label}</Lencana>
              </div>

              <div style={{
                marginTop: 'var(--s-3)', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--garis)',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--s-2)', fontSize: 'var(--t-sm)',
              }}>
                <div><span style={{ color: 'var(--teks-samar)' }}>Pasien:</span> <strong>{o.nama_pasien}</strong></div>
                <div><span style={{ color: 'var(--teks-samar)' }}>HP:</span> {o.no_hp || '—'}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>No. RM:</span> {o.no_mr || '—'}</div>
                <div><span style={{ color: 'var(--teks-samar)' }}>Kode paket:</span> {o.kode_paket || '—'}</div>
              </div>

              {o.catatan && <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)' }}><span style={{ color: 'var(--teks-samar)' }}>Catatan pasien:</span> {o.catatan}</div>}
              {o.catatan_admin && <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)', color: 'var(--teks-lembut)' }}>Catatan: {o.catatan_admin}</div>}
              {o.no_order_simrs && (
                <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)', color: 'var(--hijau-700)' }}>
                  ✔ Terjual di SIMRS — No. Paket <strong>{o.no_order_simrs}</strong>
                </div>
              )}

              {['MENUNGGU', 'DIKONFIRMASI'].includes(o.status) && (
                <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-3)', flexWrap: 'wrap' }}>
                  {!o.no_order_simrs && o.package_simrs_id && (
                    <Tombol ukuran="kecil" onClick={() => { setJual(o); setNoReg('') }} disabled={sibuk === o.id}>
                      Jual ke SIMRS
                    </Tombol>
                  )}
                  {o.status === 'MENUNGGU' && (
                    <Tombol ukuran="kecil" corak="garis" onClick={() => ubah(o.id, 'DIKONFIRMASI')} disabled={sibuk === o.id}>
                      Konfirmasi
                    </Tombol>
                  )}
                  <Tombol ukuran="kecil" corak="garis" onClick={() => ubah(o.id, 'SELESAI')} disabled={sibuk === o.id}>Selesai</Tombol>
                  <Tombol ukuran="kecil" corak="bahaya" onClick={() => ubah(o.id, 'BATAL')} disabled={sibuk === o.id}>Batalkan</Tombol>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal jual ke SIMRS */}
      {jual && (
        <div onClick={() => setJual(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 'var(--s-4)' }}>
          <div onClick={(e) => e.stopPropagation()} className="cms-panel" style={{ width: '100%', maxWidth: 470, padding: 'var(--s-5)' }}>
            <h2 style={{ fontSize: 'var(--t-lg)' }}>Jual paket ke SIMRS</h2>
            <p style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', marginTop: 2 }}>
              {jual.nama_pasien} · {jual.nama_paket} · {jual.jml_kunjungan || 1}× kunjungan
            </p>
            <div className="tumpuk" style={{ gap: 'var(--s-3)', marginTop: 'var(--s-4)' }}>
              <Info corak="info">
                Paket dijual PADA sebuah registrasi. Pastikan pasien sudah check-in / terdaftar di SIMRS, lalu tempel <b>No. Registrasi</b>-nya. Kuota kunjungan mengikuti master paket.
              </Info>
              <Teks label="No. Registrasi (dari SIMRS)" value={noReg} onChange={(e) => setNoReg(e.target.value)} />
              <div className="baris" style={{ justifyContent: 'flex-end', gap: 'var(--s-2)' }}>
                <Tombol corak="garis" onClick={() => setJual(null)} disabled={sibuk === jual.id}>Batal</Tombol>
                <Tombol onClick={submitJual} memuat={sibuk === jual.id}>Jual paket</Tombol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
