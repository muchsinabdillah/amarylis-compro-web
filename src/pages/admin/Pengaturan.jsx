import { useEffect, useState } from 'react'
import { admin } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import useSeo from '../../lib/seo'
import IsianGambar from '../../components/admin/IsianGambar'
import { AreaTeks, Teks } from '../../components/ui/Isian'
import { Galat, Info, Memuat, Tombol } from '../../components/ui/Dasar'
import { useAuth } from '../../context/AuthContext'

const JUDUL_GRUP = {
  umum: 'Umum',
  kontak: 'Kontak',
  peta: 'Lokasi & Peta',
  sosial: 'Media Sosial',
  merek: 'Logo & Merek',
  beranda: 'Beranda',
  seo: 'SEO Bawaan',
}

/**
 * Pengaturan situs.
 *
 * Nilai yang masih bertanda "[DATA BELUM TERSEDIA]" ditonjolkan, bukan
 * dibiarkan menyatu dengan yang lain — penanda itu memang sengaja dipasang
 * agar terlihat, dan sebagiannya (nomor WhatsApp) menentukan apakah tombol
 * utama situs muncul sama sekali.
 */
export default function Pengaturan() {
  const { boleh } = useAuth()
  const { data, memuat, galat, muatUlang } = useMuat((o) => admin.pengaturan(o), [])

  const [nilai, setNilai] = useState({})
  const [kirim, setKirim] = useState(false)
  const [tersimpan, setTersimpan] = useState(false)
  const [galatSimpan, setGalatSimpan] = useState(null)

  useSeo({ judul: 'Pengaturan Situs — CMS' })

  useEffect(() => {
    if (!data?.settings) return
    setNilai(Object.fromEntries(data.settings.map((s) => [s.key, s.value ?? ''])))
  }, [data])

  if (memuat) return <Memuat tinggi={120} jumlah={3} />
  if (galat) return <Galat galat={galat} saatUlang={muatUlang} />

  const bolehUbah = boleh('setting.update')

  const grup = {}
  ;(data.settings || []).forEach((s) => {
    (grup[s.grup] ||= []).push(s)
  })

  const belumDiisi = (data.settings || []).filter(
    (s) => !nilai[s.key] || String(nilai[s.key]).includes('BELUM TERSEDIA'))

  const simpan = async (e) => {
    e.preventDefault()
    setKirim(true)
    setTersimpan(false)
    setGalatSimpan(null)
    try {
      await admin.simpanPengaturan(nilai)
      setTersimpan(true)
      muatUlang()
    } catch (err) {
      setGalatSimpan(err.message)
    } finally {
      setKirim(false)
    }
  }

  const isian = (s) => {
    // `key` sengaja TIDAK ikut di dalam objek ini: React menolak key yang
    // disebar lewat spread, dan peringatannya mudah terlewat sampai daftar
    // isian mulai berperilaku aneh saat diurutkan ulang.
    const props = {
      label: s.label,
      value: nilai[s.key] ?? '',
      onChange: (e) => { setNilai((v) => ({ ...v, [s.key]: e.target.value })); setTersimpan(false) },
      bantuan: s.keterangan,
      disabled: !bolehUbah,
    }

    if (s.tipe === 'image') {
      return (
        <IsianGambar
          key={s.key}
          label={s.label}
          nilai={nilai[s.key] ?? ''}
          saatUbah={(v) => { setNilai((x) => ({ ...x, [s.key]: v })); setTersimpan(false) }}
          bantuan={s.keterangan}
        />
      )
    }
    if (s.tipe === 'textarea') return <AreaTeks key={s.key} {...props} baris={3} />
    if (s.tipe === 'url') return <Teks key={s.key} {...props} type="url" />
    if (s.tipe === 'tel') return <Teks key={s.key} {...props} type="tel" />
    return <Teks key={s.key} {...props} />
  }

  return (
    <form onSubmit={simpan}>
      <div className="cms-kepala">
        <div>
          <h1>Pengaturan Situs</h1>
          <p>Kontak, peta, media sosial, dan tampilan bawaan halaman.</p>
        </div>
        {bolehUbah && <Tombol type="submit" memuat={kirim}>Simpan perubahan</Tombol>}
      </div>

      {!bolehUbah && (
        <div style={{ marginBottom: 'var(--s-4)' }}>
          <Info corak="info">
            Peran Anda hanya dapat melihat pengaturan. Hubungi Super Admin untuk mengubahnya.
          </Info>
        </div>
      )}

      {tersimpan && (
        <div style={{ marginBottom: 'var(--s-4)' }}>
          <Info corak="sukses">Pengaturan tersimpan.</Info>
        </div>
      )}
      {galatSimpan && (
        <div className="galat-kotak" role="alert" style={{ marginBottom: 'var(--s-4)' }}>
          {galatSimpan}
        </div>
      )}

      {belumDiisi.length > 0 && (
        <div style={{ marginBottom: 'var(--s-5)' }}>
          <Info corak="awas" judul={`${belumDiisi.length} pengaturan masih kosong`}>
            {belumDiisi.map((s) => s.label).join(', ')}.
            {belumDiisi.some((s) => s.key === 'whatsapp_number') && (
              <div style={{ marginTop: 6 }}>
                Selama nomor WhatsApp belum diisi, situs menampilkan tombol Telepon sebagai
                gantinya — bukan tombol WhatsApp yang mengarah ke nomor tak terdaftar.
              </div>
            )}
          </Info>
        </div>
      )}

      {/* Profil klinik ditampilkan tetapi tidak dapat disunting: sumbernya
          SIMRS, dan menyalinnya ke sini akan menciptakan versi kedua yang
          cepat atau lambat berbeda dari nota dan surat klinik. */}
      <div className="cms-panel">
        <h2 className="cms-panel__judul">Profil klinik (dari SIMRS)</h2>
        <div className="geser-x">
          <table className="tabel">
            <tbody>
              {Object.entries(data.klinik || {}).map(([k, v]) => (
                <tr key={k}>
                  <th style={{ width: 180, textTransform: 'capitalize' }}>{k.replace('_', ' ')}</th>
                  <td>{v || <span style={{ color: 'var(--teks-samar)' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 'var(--s-3)', fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>
          Diambil dari Data RS pada SIMRS dan hanya dapat diubah di sana. Isian di bawah dapat
          menimpanya khusus untuk tampilan website.
        </p>
      </div>

      {Object.entries(grup).map(([namaGrup, isi]) => (
        <div key={namaGrup} className="cms-panel">
          <h2 className="cms-panel__judul">{JUDUL_GRUP[namaGrup] || namaGrup}</h2>
          <div className="tumpuk">{isi.map(isian)}</div>
        </div>
      ))}

      {bolehUbah && (
        <div className="baris baris--kanan" style={{ marginTop: 'var(--s-5)' }}>
          <Tombol type="submit" memuat={kirim}>Simpan perubahan</Tombol>
        </div>
      )}
    </form>
  )
}
