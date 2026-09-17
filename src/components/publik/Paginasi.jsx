/**
 * Navigasi halaman.
 *
 * Menampilkan nomor di sekitar halaman aktif, bukan seluruhnya: daftar yang
 * memuat empat puluh nomor lebih sulit dipakai daripada tiga tombol.
 */
export default function Paginasi({ halaman, jumlahHalaman, saatPindah }) {
  if (!jumlahHalaman || jumlahHalaman <= 1) return null

  const nomor = []
  const mulai = Math.max(1, halaman - 2)
  const akhir = Math.min(jumlahHalaman, halaman + 2)
  for (let i = mulai; i <= akhir; i += 1) nomor.push(i)

  const gaya = (aktif) => ({
    minWidth: 40, height: 40, padding: '0 0.6rem',
    display: 'inline-grid', placeItems: 'center',
    border: `1px solid ${aktif ? 'var(--hijau-700)' : 'var(--garis)'}`,
    background: aktif ? 'var(--hijau-700)' : 'var(--putih)',
    color: aktif ? '#fff' : 'var(--teks)',
    borderRadius: 'var(--r-md)',
    fontWeight: 600, fontSize: 'var(--t-sm)',
    cursor: aktif ? 'default' : 'pointer',
  })

  return (
    <nav className="baris" style={{ justifyContent: 'center', marginTop: 'var(--s-6)' }} aria-label="Navigasi halaman">
      <button type="button" style={gaya(false)} onClick={() => saatPindah(halaman - 1)} disabled={halaman <= 1}>
        ‹ <span className="hanya-pembaca-layar">Halaman sebelumnya</span>
      </button>

      {mulai > 1 && (
        <>
          <button type="button" style={gaya(false)} onClick={() => saatPindah(1)}>1</button>
          {mulai > 2 && <span style={{ color: 'var(--teks-samar)' }}>…</span>}
        </>
      )}

      {nomor.map((n) => (
        <button
          key={n}
          type="button"
          style={gaya(n === halaman)}
          onClick={() => n !== halaman && saatPindah(n)}
          aria-current={n === halaman ? 'page' : undefined}
        >
          {n}
        </button>
      ))}

      {akhir < jumlahHalaman && (
        <>
          {akhir < jumlahHalaman - 1 && <span style={{ color: 'var(--teks-samar)' }}>…</span>}
          <button type="button" style={gaya(false)} onClick={() => saatPindah(jumlahHalaman)}>
            {jumlahHalaman}
          </button>
        </>
      )}

      <button type="button" style={gaya(false)} onClick={() => saatPindah(halaman + 1)} disabled={halaman >= jumlahHalaman}>
        › <span className="hanya-pembaca-layar">Halaman berikutnya</span>
      </button>
    </nav>
  )
}
