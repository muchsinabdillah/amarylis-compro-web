import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { publik, pasien } from '../../lib/api'
import useMuat from '../../lib/useMuat'
import { usePasien } from '../../context/PasienAuthContext'
import { Pilihan, Teks, AreaTeks, Centang } from '../../components/ui/Isian'
import { Tombol, Memuat, Galat, Info } from '../../components/ui/Dasar'
import useSeo from '../../lib/seo'

/* Pilihan sesuai master SIMRS (create rekam medik). */
const PENJAMIN = [
  { nilai: '1', label: 'Pribadi / Umum' },
  { nilai: '3', label: 'BPJS Kesehatan' },
  { nilai: '2', label: 'Asuransi' },
  { nilai: '5', label: 'Jaminan Perusahaan' },
]
const AGAMA = ['Islam', 'Katholik', 'Kristen Protestan', 'Budha', 'Hindu', 'Konghucu']
const STATUS_NIKAH = ['BELUM MENIKAH', 'NIKAH', 'DUDA', 'JANDA', 'CERAI']
const JENIS_ID = ['KTP', 'SIM', 'KTA', 'KTM', 'PASPORT', 'KT PELAJAR', 'KIA']
const opsi = (arr) => arr.map((x) => ({ nilai: x, label: x }))

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const hariDari = (t) => { try { return HARI[new Date(t + 'T00:00:00').getDay()] } catch { return '' } }
const namaLengkap = (d) => `${d.gelar ? d.gelar + ' ' : ''}${d.nama}`.trim()
const LANGKAH = ['Jadwal', 'Penjamin', 'Data Pasien', 'Konfirmasi']

export default function ReservasiBaru() {
  const navigasi = useNavigate()
  const [sp] = useSearchParams()
  const { profil } = usePasien()
  const dokter = useMuat((o) => publik.jadwalReservasi(o), [])
  useSeo({ judul: 'Buat Reservasi' })

  const [langkah, setLangkah] = useState(1)
  const [galat, setGalat] = useState(null)
  const [kirim, setKirim] = useState(false)
  const [f, setF] = useState({
    poli: '', dokterId: sp.get('dokter') || '', tanggal: '', keluhan: '',
    jenis_penjamin: '1', nama_penjamin: '', no_kartu: '',
    sudah_pernah: false, no_rm_lama: '',
    nama: '', nik: '', jenis_kelamin: '', tempat_lahir: '', tgl_lahir: '', alamat: '',
    agama: '', status_nikah: '', jenis_id: 'KTP', kewarganegaraan: 'WNI',
  })
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const ubah = (k) => (e) => set(k, e.target.value)

  // Verifikasi pasien lama (NIK + tgl lahir → No. RM tersinkron dari SIMRS).
  const [verif, setVerif] = useState({ memuat: false, hasil: null, galat: '' })
  const resetVerif = () => { setVerif({ memuat: false, hasil: null, galat: '' }); set('no_rm_lama', '') }

  const verifikasiRm = async () => {
    const nik = f.nik.trim(), tgl = f.tgl_lahir
    if (!nik || !tgl) { setVerif({ memuat: false, hasil: null, galat: 'Isi NIK dan tanggal lahir terlebih dahulu.' }); return }
    setVerif({ memuat: true, hasil: null, galat: '' })
    try {
      const { data } = await pasien.cariRm({ nik, tgl_lahir: tgl })
      if (data?.ditemukan) set('no_rm_lama', data.no_mr)
      setVerif({ memuat: false, hasil: data || { ditemukan: false }, galat: '' })
    } catch (e) {
      setVerif({ memuat: false, hasil: null, galat: e.message || 'Gagal memverifikasi.' })
    }
  }

  const daftarDokter = dokter.data || []
  const hariIni = new Date().toISOString().slice(0, 10)

  // Pra-isi identitas dari profil pasien.
  useEffect(() => {
    if (!profil) return
    setF((s) => ({
      ...s,
      nama: s.nama || profil.nama || '',
      nik: s.nik || profil.nik || '',
      jenis_kelamin: s.jenis_kelamin || profil.jenis_kelamin || '',
      tgl_lahir: s.tgl_lahir || (profil.tgl_lahir || '').slice(0, 10),
      alamat: s.alamat || profil.alamat || '',
      tempat_lahir: s.tempat_lahir || profil.tempat_lahir || '',
      agama: s.agama || profil.agama || '',
      status_nikah: s.status_nikah || profil.status_nikah || '',
      jenis_id: s.jenis_id || profil.jenis_id || 'KTP',
      kewarganegaraan: s.kewarganegaraan || profil.kewarganegaraan || 'WNI',
    }))
  }, [profil])

  // Pra-pilih poli dari dokter yang diklik (bila jadwalnya satu poli).
  const dokterAwal = daftarDokter.find((d) => String(d.id) === String(f.dokterId))
  useEffect(() => {
    if (!f.poli && dokterAwal) {
      const unit = [...new Set((dokterAwal.jadwal || []).map((j) => j.unit).filter(Boolean))]
      if (unit.length === 1) set('poli', unit[0])
    }
  }, [dokterAwal]) // eslint-disable-line

  const poliList = useMemo(() => {
    const s = new Set()
    daftarDokter.forEach((d) => (d.jadwal || []).forEach((j) => j.unit && s.add(j.unit)))
    return [...s].sort((a, b) => a.localeCompare(b, 'id'))
  }, [daftarDokter])

  const dokterDiPoli = useMemo(
    () => daftarDokter.filter((d) => (d.jadwal || []).some((j) => j.unit === f.poli)),
    [daftarDokter, f.poli])

  const dokterTerpilih = daftarDokter.find((d) => String(d.id) === String(f.dokterId)) || null
  const jadwalPoli = dokterTerpilih ? (dokterTerpilih.jadwal || []).filter((j) => j.unit === f.poli) : []
  const hariTgl = f.tanggal ? hariDari(f.tanggal) : ''
  const jadwalCocok = jadwalPoli.find((j) => j.hari === hariTgl) || null
  const jamTampil = jadwalCocok ? `${jadwalCocok.jam_mulai}–${jadwalCocok.jam_selesai}` : ''
  const penjaminLabel = PENJAMIN.find((p) => p.nilai === f.jenis_penjamin)?.label || ''

  const validasi = (l) => {
    if (l === 1) {
      if (!f.poli) return 'Pilih poli terlebih dahulu.'
      if (!f.tanggal) return 'Pilih tanggal kunjungan.'
      if (f.tanggal < hariIni) return 'Tanggal tidak boleh di masa lalu.'
      if (dokterTerpilih && !jadwalCocok) return `Dokter tidak praktik pada hari ${hariTgl}. Pilih tanggal lain atau kosongkan dokter.`
    }
    if (l === 2) {
      if ((f.jenis_penjamin === '2' || f.jenis_penjamin === '5') && !f.nama_penjamin.trim())
        return 'Isi nama asuransi/perusahaan penjamin.'
    }
    if (l === 3 && f.sudah_pernah) {
      if (!(verif.hasil && verif.hasil.ditemukan && f.no_rm_lama))
        return 'Verifikasi NIK + tanggal lahir dulu untuk mengonfirmasi Anda sebagai pasien lama.'
    }
    if (l === 3 && !f.sudah_pernah) {
      for (const [k, nm] of [['nama', 'Nama'], ['nik', 'NIK'], ['jenis_kelamin', 'Jenis kelamin'],
        ['tempat_lahir', 'Tempat lahir'], ['tgl_lahir', 'Tanggal lahir'], ['alamat', 'Alamat'],
        ['agama', 'Agama'], ['status_nikah', 'Status pernikahan']]) {
        if (!String(f[k]).trim()) return `${nm} wajib diisi.`
      }
    }
    return null
  }

  const lanjut = () => {
    const g = validasi(langkah)
    if (g) { setGalat(g); return }
    setGalat(null); setLangkah((l) => Math.min(4, l + 1))
  }
  const mundur = () => { setGalat(null); setLangkah((l) => Math.max(1, l - 1)) }

  const kirimForm = async () => {
    for (let l = 1; l <= 3; l++) { const g = validasi(l); if (g) { setGalat(g); setLangkah(l); return } }
    setKirim(true); setGalat(null)
    try {
      await pasien.reservasiBuat({
        poli: f.poli,
        doctor_id: f.dokterId ? Number(f.dokterId) : undefined,
        tanggal: f.tanggal, jam: jamTampil || undefined, keluhan: f.keluhan || undefined,
        jenis_penjamin: f.jenis_penjamin, nama_penjamin: f.nama_penjamin || undefined, no_kartu: f.no_kartu || undefined,
        sudah_pernah: f.sudah_pernah, no_rm_lama: f.no_rm_lama || undefined,
        nama: f.nama || undefined, nik: f.nik || undefined, jenis_kelamin: f.jenis_kelamin || undefined,
        tempat_lahir: f.tempat_lahir || undefined, tgl_lahir: f.tgl_lahir || undefined, alamat: f.alamat || undefined,
        agama: f.agama || undefined, status_nikah: f.status_nikah || undefined,
        jenis_id: f.jenis_id || undefined, kewarganegaraan: f.kewarganegaraan || undefined,
      })
      navigasi('/pasien', { replace: true })
    } catch (err) {
      setGalat(err.message || 'Gagal mengirim reservasi.')
      setKirim(false)
    }
  }

  const gantiPoli = (e) => { set('poli', e.target.value); set('dokterId', '') }

  return (
    <div className="tumpuk" style={{ gap: 'var(--s-4)', maxWidth: 620 }}>
      <div>
        <Link to="/pasien" style={{ fontSize: 'var(--t-sm)' }}>← Kembali</Link>
        <h1 style={{ fontSize: 'var(--t-xl)', marginTop: 4 }}>Buat Reservasi</h1>
      </div>

      {/* Stepper */}
      <div className="baris" style={{ gap: 'var(--s-2)', flexWrap: 'wrap' }}>
        {LANGKAH.map((nm, i) => {
          const n = i + 1
          const aktif = n === langkah, lewat = n < langkah
          return (
            <div key={nm} className="baris" style={{ alignItems: 'center', gap: 'var(--s-2)', opacity: aktif || lewat ? 1 : 0.5 }}>
              <span style={{
                width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center',
                fontSize: 'var(--t-xs)', fontWeight: 700,
                background: aktif ? 'var(--hijau-700)' : lewat ? 'var(--hijau-100, #d1fae5)' : 'var(--garis)',
                color: aktif ? '#fff' : 'var(--teks)',
              }}>{lewat ? '✓' : n}</span>
              <span style={{ fontSize: 'var(--t-sm)', fontWeight: aktif ? 700 : 400 }}>{nm}</span>
              {n < LANGKAH.length && <span style={{ color: 'var(--teks-samar)' }}>›</span>}
            </div>
          )
        })}
      </div>

      {dokter.memuat && <Memuat tinggi={70} jumlah={2} />}
      {dokter.galat && <Galat galat={dokter.galat} saatUlang={dokter.muatUlang} />}

      {!dokter.memuat && !dokter.galat && (
        <div className="tumpuk" style={{
          background: 'var(--putih)', border: '1px solid var(--garis)',
          borderRadius: 'var(--r-lg)', padding: 'var(--s-5)', gap: 'var(--s-4)',
        }}>
          {galat && <div className="galat-kotak" role="alert">{galat}</div>}

          {/* LANGKAH 1 — Jadwal */}
          {langkah === 1 && (
            <>
              {poliList.length === 0 && (
                <Info corak="awas" judul="Jadwal belum tersedia">
                  Data poli/dokter belum tersinkron dari SIMRS. Coba lagi nanti atau hubungi klinik.
                </Info>
              )}
              <Pilihan label="Poli" wajib kosong="— Pilih poli —"
                opsi={poliList.map((p) => ({ nilai: p, label: p }))} value={f.poli} onChange={gantiPoli} />
              {f.poli && (
                <Pilihan label="Dokter" kosong="Tanpa dokter tertentu"
                  opsi={dokterDiPoli.map((d) => ({ nilai: String(d.id), label: `${namaLengkap(d)}${d.spesialis ? ' · ' + d.spesialis : ''}` }))}
                  value={f.dokterId} onChange={ubah('dokterId')}
                  bantuan={dokterDiPoli.length === 0 ? 'Belum ada dokter untuk poli ini.' : undefined} />
              )}
              {dokterTerpilih && jadwalPoli.length > 0 && (
                <div style={{ fontSize: 'var(--t-sm)', color: 'var(--teks-lembut)' }}>
                  Jadwal: {jadwalPoli.map((j) => `${j.hari} ${j.jam_mulai}–${j.jam_selesai}`).join(' · ')}
                </div>
              )}
              <Teks label="Tanggal kunjungan" type="date" wajib min={hariIni} value={f.tanggal} onChange={ubah('tanggal')} />
              {f.tanggal && dokterTerpilih && (
                jadwalCocok
                  ? <Info corak="sukses">Dokter praktik {hariTgl}, pukul {jamTampil}.</Info>
                  : <Info corak="awas">Dokter tidak praktik pada hari {hariTgl}.</Info>
              )}
              <AreaTeks label="Keluhan (opsional)" baris={2} value={f.keluhan} onChange={ubah('keluhan')} placeholder="mis. demam 3 hari" />
            </>
          )}

          {/* LANGKAH 2 — Penjamin */}
          {langkah === 2 && (
            <>
              <Pilihan label="Jenis penjamin" wajib opsi={PENJAMIN} value={f.jenis_penjamin} onChange={ubah('jenis_penjamin')} />
              {f.jenis_penjamin === '3' && (
                <Teks label="No. Kartu BPJS (opsional)" inputMode="numeric" value={f.no_kartu} onChange={ubah('no_kartu')}
                  bantuan="Boleh dikosongkan — dapat dicek dengan NIK saat check-in." />
              )}
              {(f.jenis_penjamin === '2' || f.jenis_penjamin === '5') && (
                <>
                  <Teks label={f.jenis_penjamin === '2' ? 'Nama asuransi' : 'Nama perusahaan'} wajib
                    value={f.nama_penjamin} onChange={ubah('nama_penjamin')} />
                  <Teks label="No. kartu / polis (opsional)" value={f.no_kartu} onChange={ubah('no_kartu')} />
                </>
              )}
              {f.jenis_penjamin === '1' && <Info corak="info">Pembayaran dilakukan di klinik saat kunjungan.</Info>}
            </>
          )}

          {/* LANGKAH 3 — Data pasien */}
          {langkah === 3 && (
            <>
              <Centang label="Saya sudah pernah berobat di klinik ini"
                keterangan="Verifikasi NIK + tanggal lahir untuk menautkan No. Rekam Medik Anda — tak perlu isi ulang data."
                checked={f.sudah_pernah} onChange={(e) => { set('sudah_pernah', e.target.checked); resetVerif() }} />

              {f.sudah_pernah ? (
                <>
                  <Info corak="info">
                    Masukkan <b>NIK</b> dan <b>tanggal lahir</b> persis seperti terdaftar di klinik, lalu tekan Verifikasi.
                  </Info>
                  <div className="baris" style={{ gap: 'var(--s-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <Teks label="NIK" wajib inputMode="numeric" value={f.nik}
                        onChange={(e) => { ubah('nik')(e); resetVerif() }} />
                    </div>
                    <div style={{ flex: '1 1 160px' }}>
                      <Teks label="Tanggal lahir" type="date" wajib max={hariIni} value={f.tgl_lahir}
                        onChange={(e) => { ubah('tgl_lahir')(e); resetVerif() }} />
                    </div>
                    <Tombol corak="garis" onClick={verifikasiRm} disabled={verif.memuat}>
                      {verif.memuat ? 'Memverifikasi…' : 'Verifikasi'}
                    </Tombol>
                  </div>
                  {verif.galat && <div className="galat-kotak" role="alert">{verif.galat}</div>}
                  {verif.hasil?.ditemukan && (
                    <Info corak="sukses" judul="Terverifikasi sebagai pasien lama">
                      No. Rekam Medik: <b>{verif.hasil.no_mr}</b>{verif.hasil.nama ? ` · ${verif.hasil.nama}` : ''}.
                      {!verif.hasil.lengkap && (
                        <div style={{ marginTop: 4 }}>
                          Catatan: rekam medik belum lengkap — lengkapi di counter agar bisa check-in mandiri.
                        </div>
                      )}
                    </Info>
                  )}
                  {verif.hasil && !verif.hasil.ditemukan && (
                    <Info corak="awas" judul="Data tidak ditemukan">
                      NIK / tanggal lahir tidak cocok dengan data klinik. Periksa kembali, atau hilangkan centang
                      “sudah pernah berobat” untuk mendaftar sebagai pasien baru.
                    </Info>
                  )}
                </>
              ) : (
                <>
                  <Info corak="info">Data ini dipakai membuat rekam medik saat kunjungan pertama.</Info>
                  <Teks label="Nama lengkap (sesuai KTP)" wajib value={f.nama} onChange={ubah('nama')} />
                  <div className="baris" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}><Teks label="NIK" wajib inputMode="numeric" value={f.nik} onChange={ubah('nik')} /></div>
                    <div style={{ flex: '1 1 120px' }}>
                      <Pilihan label="Jenis kelamin" wajib kosong="—"
                        opsi={[{ nilai: 'L', label: 'Laki-laki' }, { nilai: 'P', label: 'Perempuan' }]}
                        value={f.jenis_kelamin} onChange={ubah('jenis_kelamin')} />
                    </div>
                  </div>
                  <div className="baris" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 160px' }}><Teks label="Tempat lahir" wajib value={f.tempat_lahir} onChange={ubah('tempat_lahir')} /></div>
                    <div style={{ flex: '1 1 160px' }}><Teks label="Tanggal lahir" type="date" wajib max={hariIni} value={f.tgl_lahir} onChange={ubah('tgl_lahir')} /></div>
                  </div>
                  <AreaTeks label="Alamat" wajib baris={2} value={f.alamat} onChange={ubah('alamat')} />
                  <div className="baris" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 160px' }}><Pilihan label="Agama" wajib kosong="—" opsi={opsi(AGAMA)} value={f.agama} onChange={ubah('agama')} /></div>
                    <div style={{ flex: '1 1 160px' }}><Pilihan label="Status pernikahan" wajib kosong="—" opsi={opsi(STATUS_NIKAH)} value={f.status_nikah} onChange={ubah('status_nikah')} /></div>
                  </div>
                  <div className="baris" style={{ gap: 'var(--s-3)', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 140px' }}><Pilihan label="Jenis identitas" opsi={opsi(JENIS_ID)} value={f.jenis_id} onChange={ubah('jenis_id')} /></div>
                    <div style={{ flex: '1 1 140px' }}>
                      <Pilihan label="Kewarganegaraan" opsi={[{ nilai: 'WNI', label: 'WNI' }, { nilai: 'WNA', label: 'WNA' }]}
                        value={f.kewarganegaraan} onChange={ubah('kewarganegaraan')} />
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--t-xs)', color: 'var(--teks-samar)' }}>
                    Provinsi/kota & data lengkap lain dilengkapi petugas saat check-in.
                  </div>
                </>
              )}
            </>
          )}

          {/* LANGKAH 4 — Konfirmasi */}
          {langkah === 4 && (
            <div className="tumpuk" style={{ gap: 'var(--s-2)', fontSize: 'var(--t-sm)' }}>
              <Baris k="Poli" v={f.poli} />
              <Baris k="Dokter" v={dokterTerpilih ? namaLengkap(dokterTerpilih) : 'Tanpa dokter tertentu'} />
              <Baris k="Tanggal" v={`${f.tanggal}${jamTampil ? ' · ' + jamTampil : ''}`} />
              <Baris k="Penjamin" v={penjaminLabel + (f.nama_penjamin ? ` (${f.nama_penjamin})` : '')} />
              <Baris k="Pasien" v={f.sudah_pernah ? `${profil?.nama || f.nama} (pasien lama${f.no_rm_lama ? `, RM ${f.no_rm_lama}` : ''})` : `${f.nama} · NIK ${f.nik}`} />
              {f.keluhan && <Baris k="Keluhan" v={f.keluhan} />}
              <Info corak="info">Reservasi ini berupa <b>booking</b>. Registrasi & rekam medik dibuat saat Anda check-in di klinik pada hari kunjungan.</Info>
            </div>
          )}

          {/* Navigasi langkah */}
          <div className="baris" style={{ justifyContent: 'space-between', gap: 'var(--s-2)', marginTop: 'var(--s-2)' }}>
            {langkah > 1
              ? <Tombol corak="garis" onClick={mundur} disabled={kirim}>← Sebelumnya</Tombol>
              : <span />}
            {langkah < 4
              ? <Tombol onClick={lanjut} disabled={poliList.length === 0}>Lanjut →</Tombol>
              : <Tombol onClick={kirimForm} memuat={kirim}>Kirim Reservasi</Tombol>}
          </div>
        </div>
      )}
    </div>
  )
}

function Baris({ k, v }) {
  return (
    <div className="baris" style={{ gap: 'var(--s-3)' }}>
      <span style={{ color: 'var(--teks-samar)', minWidth: 90 }}>{k}</span>
      <strong style={{ flex: 1 }}>{v || '—'}</strong>
    </div>
  )
}
