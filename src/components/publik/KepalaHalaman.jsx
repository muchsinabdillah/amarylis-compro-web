import { Link } from 'react-router-dom'

/**
 * Kepala halaman dalam: judul, keterangan singkat, dan remah jejak.
 *
 * Remah jejaknya nyata, bukan hiasan — pengunjung yang mendarat dari hasil
 * pencarian langsung di halaman detail perlu tahu ia sedang berada di bagian
 * apa dan bagaimana naik satu tingkat.
 */
export default function KepalaHalaman({ judul, keterangan, remah = [], anak }) {
  return (
    <section
      style={{
        background: 'var(--hijau-50)',
        borderBottom: '1px solid var(--hijau-100)',
        paddingBlock: 'var(--s-7)',
      }}
    >
      <div className="wadah">
        {remah.length > 0 && (
          <nav aria-label="Remah jejak" style={{ marginBottom: 'var(--s-3)' }}>
            <ol
              style={{
                listStyle: 'none', margin: 0, padding: 0,
                display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)',
                fontSize: 'var(--t-xs)', color: 'var(--teks-lembut)',
              }}
            >
              <li><Link to="/">Beranda</Link></li>
              {remah.map((r, i) => (
                <li key={r.label} style={{ display: 'flex', gap: 'var(--s-2)' }}>
                  <span aria-hidden="true">/</span>
                  {r.ke && i < remah.length - 1
                    ? <Link to={r.ke}>{r.label}</Link>
                    : <span aria-current="page">{r.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <h1>{judul}</h1>
        {keterangan && (
          <p style={{ marginTop: 'var(--s-3)', color: 'var(--teks-lembut)', maxWidth: 'var(--lebar-baca)', fontSize: 'var(--t-lg)' }}>
            {keterangan}
          </p>
        )}
        {anak}
      </div>
    </section>
  )
}
