import { useState } from 'react'
import { pasien } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { Tombol, Lencana, Memuat, Galat, Kosong } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'

const STATUS = {
  MENUNGGU:    { label: 'Menunggu konfirmasi', corak: 'awas' },
  DIKONFIRMASI:{ label: 'Dikonfirmasi',        corak: 'sukses' },
  SELESAI:     { label: 'Selesai',             corak: 'sukses' },
  BATAL:       { label: 'Dibatalkan',          corak: 'abu' },
}
const JENIS = { mcu: 'MCU', homecare: 'Homecare', lainnya: 'Layanan' }
const rupiah = (n) => (n == null || n === '' ? '—' : 'Rp ' + Number(n).toLocaleString('id-ID'))
const tgl = (t) => { try { return new Date(t + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return t } }

export default function Pesanan() {
  const daftar = useMuat((o) => pasien.pesanan(o), [])
  const [sibuk, setSibuk] = useState(null)
  useSeo({ judul: 'Pesanan Saya' })

  const batal = async (id) => {
    if (!window.confirm('Batalkan pesanan paket ini?')) return
    setSibuk(id)
    try { await pasien.pesananBatal(id); daftar.muatUlang() }
    catch (e) { window.alert(e.message || 'Gagal membatalkan.') }
    finally { setSibuk(null) }
  }

  const list = daftar.data || []

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-5)' }}>
      <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--t-xl)' }}>Pesanan Saya</h1>
          <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 2 }}>Riwayat pesanan paket MCU & layanan.</p>
        </div>
        <Tombol ke="/pasien/paket" corak="garis" ukuran="kecil">+ Pesan Paket</Tombol>
      </div>

      {daftar.memuat && <Memuat tinggi={80} jumlah={2} />}
      {daftar.galat && <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />}
      {!daftar.memuat && !daftar.galat && list.length === 0 && (
        <Kosong judul="Belum ada pesanan" pesan="Anda belum memesan paket apa pun."
          aksi={<Tombol ke="/pasien/paket">Lihat Paket</Tombol>} />
      )}

      <div className="tumpuk" style={{ gap: 'var(--s-3)' }}>
        {list.map((o) => {
          const st = STATUS[o.status] || { label: o.status, corak: 'abu' }
          const bisaBatal = ['MENUNGGU', 'DIKONFIRMASI'].includes(o.status)
          return (
            <div key={o.id} style={{
              background: 'var(--putih)', border: '1px solid var(--garis)', borderRadius: 'var(--r-lg)',
              padding: 'var(--s-4)', boxShadow: 'var(--bayang-1)',
            }}>
              <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{o.nama_paket} <span style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)', fontWeight: 400 }}>· {JENIS[o.jenis] || 'Layanan'}</span></div>
                  <div style={{ fontSize: 'var(--t-sm)', marginTop: 4 }}>
                    {rupiah(o.harga)} · {o.jml_kunjungan || 1}× kunjungan{o.tanggal ? ` · rencana ${tgl(o.tanggal)}` : ''}
                  </div>
                </div>
                <Lencana corak={st.corak}>{st.label}</Lencana>
              </div>
              {o.no_order_simrs && (
                <div style={{ fontSize: 'var(--t-sm)', marginTop: 'var(--s-2)' }}>
                  No. Paket SIMRS: <strong>{o.no_order_simrs}</strong>
                </div>
              )}
              {o.catatan_admin && (
                <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', marginTop: 'var(--s-2)' }}>Catatan klinik: {o.catatan_admin}</div>
              )}
              {bisaBatal && (
                <div className="baris" style={{ marginTop: 'var(--s-3)' }}>
                  <Tombol corak="garis" ukuran="kecil" onClick={() => batal(o.id)} disabled={sibuk === o.id}>
                    {sibuk === o.id ? 'Membatalkan…' : 'Batalkan'}
                  </Tombol>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
