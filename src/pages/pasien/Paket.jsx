import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { publik, pasien } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { Tombol, Lencana, Memuat, Galat, Kosong, Info } from '../../components/ui/Dasar'
import { Teks, AreaTeks } from '../../components/ui/Isian'
import useSeo from '../../lib/seo'

const JENIS = { mcu: { label: 'MCU', corak: 'sukses' }, homecare: { label: 'Homecare', corak: 'info' }, lainnya: { label: 'Layanan', corak: 'abu' } }
const rupiah = (n) => (n == null || n === '' ? null : 'Rp ' + Number(n).toLocaleString('id-ID'))

export default function Paket() {
  const daftar = useMuat((o) => publik.paket(undefined, o), [])
  const navigasi = useNavigate()
  useSeo({ judul: 'Paket & MCU' })

  const [pilih, setPilih] = useState(null)          // paket yang sedang dipesan
  const [tanggal, setTanggal] = useState('')
  const [catatan, setCatatan] = useState('')
  const [kirim, setKirim] = useState(false)
  const [galat, setGalat] = useState(null)
  const hariIni = new Date().toISOString().slice(0, 10)

  const bukaPesan = (p) => { setPilih(p); setTanggal(''); setCatatan(''); setGalat(null) }

  const pesan = async () => {
    setKirim(true); setGalat(null)
    try {
      await pasien.pesananBuat({ package_id: pilih.id, tanggal: tanggal || undefined, catatan: catatan || undefined })
      setPilih(null)
      navigasi('/pasien/pesanan', { replace: true })
    } catch (e) { setGalat(e.message || 'Gagal memesan.'); setKirim(false) }
  }

  const list = daftar.data || []

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-5)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--t-xl)' }}>Paket & Medical Check-Up</h1>
        <p style={{ color: 'var(--teks-lembut)', fontSize: 'var(--t-sm)', marginTop: 2 }}>
          Pilih paket, pesan sekarang, dan bayar di klinik saat kunjungan. Paket dengan lebih dari satu kunjungan berlaku sesuai kuotanya.
        </p>
      </div>

      {daftar.memuat && <Memuat tinggi={110} jumlah={3} />}
      {daftar.galat && <Galat galat={daftar.galat} saatUlang={daftar.muatUlang} />}
      {!daftar.memuat && !daftar.galat && list.length === 0 && (
        <Kosong judul="Belum ada paket" pesan="Paket layanan belum tersedia. Silakan cek kembali nanti." />
      )}

      <div style={{ display: 'grid', gap: 'var(--s-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {list.map((p) => {
          const j = JENIS[p.jenis] || JENIS.lainnya
          return (
            <div key={p.id} style={{
              background: 'var(--putih)', border: '1px solid var(--garis)', borderRadius: 'var(--r-lg)',
              padding: 'var(--s-4)', boxShadow: 'var(--bayang-1)', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)',
            }}>
              <div className="baris" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--s-2)' }}>
                <div style={{ fontWeight: 700 }}>{p.nama}</div>
                <Lencana corak={j.corak}>{j.label}</Lencana>
              </div>
              <div className="baris" style={{ gap: 'var(--s-4)', flexWrap: 'wrap', marginTop: 'auto', paddingTop: 'var(--s-2)' }}>
                <div>
                  <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>Harga</div>
                  <div style={{ fontWeight: 800, color: 'var(--hijau-700)' }}>{rupiah(p.harga_simrs) || 'Hubungi klinik'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>Kunjungan</div>
                  <div style={{ fontWeight: 700 }}>{p.jml_kunjungan || 1}×</div>
                </div>
              </div>
              <div className="baris" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-2)', flexWrap: 'wrap' }}>
                <Tombol ukuran="kecil" onClick={() => bukaPesan(p)}>Pesan</Tombol>
                {p.whatsapp && <Tombol sebagai="a" href={p.whatsapp} target="_blank" rel="noopener" corak="garis" ukuran="kecil">Tanya via WhatsApp</Tombol>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal pemesanan */}
      {pilih && (
        <div onClick={() => !kirim && setPilih(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(16,18,15,0.5)', zIndex: 50,
          display: 'grid', placeItems: 'center', padding: 'var(--s-4)',
        }}>
          <div onClick={(e) => e.stopPropagation()} className="tumpuk" style={{
            background: 'var(--putih)', borderRadius: 'var(--r-lg)', padding: 'var(--s-5)',
            width: '100%', maxWidth: 440, gap: 'var(--s-4)', boxShadow: 'var(--bayang-3)',
          }}>
            <div>
              <h2 style={{ fontSize: 'var(--t-lg)' }}>Pesan Paket</h2>
              <p style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)', marginTop: 4 }}>
                {pilih.nama} · {rupiah(pilih.harga_simrs) || 'Hubungi klinik'} · {pilih.jml_kunjungan || 1}× kunjungan
              </p>
            </div>
            {galat && <div className="galat-kotak" role="alert">{galat}</div>}
            <Teks label="Rencana tanggal kunjungan (opsional)" type="date" min={hariIni} value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            <AreaTeks label="Catatan (opsional)" baris={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="mis. preferensi jam" />
            <Info corak="info">Pembayaran dilakukan di klinik. Petugas akan mengonfirmasi pesanan Anda.</Info>
            <div className="baris" style={{ justifyContent: 'flex-end', gap: 'var(--s-2)' }}>
              <Tombol corak="garis" onClick={() => setPilih(null)} disabled={kirim}>Batal</Tombol>
              <Tombol onClick={pesan} memuat={kirim}>Konfirmasi Pesanan</Tombol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
