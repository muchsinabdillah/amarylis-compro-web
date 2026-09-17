import { useId } from 'react'

/**
 * Isian formulir.
 *
 * Label selalu tertaut ke isiannya lewat id yang dibuat sendiri, dan pesan
 * galat tertaut lewat aria-describedby. Label yang hanya berupa teks di
 * sebelah kotak isian tidak terbaca pembaca layar sebagai label, dan tidak
 * ikut terfokus saat diklik.
 */
function Bungkus({ label, id, galat, bantuan, wajib, children }) {
  return (
    <div className="tumpuk" style={{ gap: 'var(--s-2)' }}>
      {label && (
        <label htmlFor={id} style={{ fontWeight: 600, fontSize: 'var(--t-sm)' }}>
          {label}
          {wajib && <span style={{ color: 'var(--bahaya)' }} aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {bantuan && !galat && (
        <small id={`${id}-bantuan`} style={{ color: 'var(--teks-samar)' }}>{bantuan}</small>
      )}
      {galat && (
        <small id={`${id}-galat`} style={{ color: 'var(--bahaya)', fontWeight: 600 }}>
          {galat}
        </small>
      )}
    </div>
  )
}

const GAYA = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  border: '1px solid var(--garis-tegas)',
  borderRadius: 'var(--r-md)',
  background: 'var(--putih)',
  fontSize: 'var(--t-sm)',
  lineHeight: 1.5,
}

const gayaGalat = (galat) => (galat ? { ...GAYA, borderColor: 'var(--bahaya)' } : GAYA)

export function Teks({ label, galat, bantuan, wajib, ...sisa }) {
  const id = useId()
  return (
    <Bungkus label={label} id={id} galat={galat} bantuan={bantuan} wajib={wajib}>
      <input
        id={id}
        style={gayaGalat(galat)}
        aria-invalid={galat ? 'true' : undefined}
        aria-describedby={galat ? `${id}-galat` : (bantuan ? `${id}-bantuan` : undefined)}
        {...sisa}
      />
    </Bungkus>
  )
}

export function AreaTeks({ label, galat, bantuan, wajib, baris = 4, ...sisa }) {
  const id = useId()
  return (
    <Bungkus label={label} id={id} galat={galat} bantuan={bantuan} wajib={wajib}>
      <textarea
        id={id}
        rows={baris}
        style={{ ...gayaGalat(galat), resize: 'vertical' }}
        aria-invalid={galat ? 'true' : undefined}
        aria-describedby={galat ? `${id}-galat` : (bantuan ? `${id}-bantuan` : undefined)}
        {...sisa}
      />
    </Bungkus>
  )
}

export function Pilihan({ label, galat, bantuan, wajib, opsi = [], kosong, ...sisa }) {
  const id = useId()
  return (
    <Bungkus label={label} id={id} galat={galat} bantuan={bantuan} wajib={wajib}>
      <select
        id={id}
        style={gayaGalat(galat)}
        aria-invalid={galat ? 'true' : undefined}
        aria-describedby={galat ? `${id}-galat` : (bantuan ? `${id}-bantuan` : undefined)}
        {...sisa}
      >
        {kosong && <option value="">{kosong}</option>}
        {opsi.map((o) => (
          <option key={o.nilai ?? o.value} value={o.nilai ?? o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Bungkus>
  )
}

export function Centang({ label, keterangan, ...sisa }) {
  const id = useId()
  return (
    <div className="baris" style={{ alignItems: 'flex-start', gap: 'var(--s-3)' }}>
      <input id={id} type="checkbox" style={{ marginTop: 4, width: 18, height: 18 }} {...sisa} />
      <label htmlFor={id} style={{ fontSize: 'var(--t-sm)', cursor: 'pointer' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {keterangan && (
          <div style={{ color: 'var(--teks-samar)', fontWeight: 400 }}>{keterangan}</div>
        )}
      </label>
    </div>
  )
}
