import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { usePasien } from '../../context/PasienAuthContext'
import { useSitus } from '../../context/SiteContext'

/* Ikon garis sederhana (stroke currentColor) — tanpa pustaka ikon. */
const Ikon = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  reservasi: 'M7 2v2M17 2v2M3 8h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  paket:     'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  pesanan:   'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 7h6m-6 4h4',
  keluar:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}
function SVG({ d }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

const NAV = [
  { ke: '/pasien',               label: 'Dashboard',    ikon: 'dashboard', end: true },
  { ke: '/pasien/reservasi/baru', label: 'Buat Reservasi', ikon: 'reservasi' },
  { ke: '/pasien/paket',          label: 'Paket & MCU',  ikon: 'paket' },
  { ke: '/pasien/pesanan',        label: 'Pesanan Saya', ikon: 'pesanan' },
  { ke: '/pasien/hasil-mcu',      label: 'Hasil MCU',    ikon: 'hasil' },
]

export default function Kerangka() {
  const { profil, keluar } = usePasien()
  const { klinik } = useSitus()
  const navigasi = useNavigate()
  const [drawer, setDrawer] = useState(false)

  const tutup = () => setDrawer(false)
  const logout = () => { keluar(); navigasi('/pasien/masuk', { replace: true }) }

  const isi = (
    <>
      <Link to="/" className="pp-merek" onClick={tutup}>
        <span className="pp-merek__logo" aria-hidden="true">+</span>
        <span className="pp-merek__nama">{klinik?.nama || 'Portal Pasien'}</span>
      </Link>

      <nav className="pp-nav">
        {NAV.map((n) => (
          <NavLink key={n.ke} to={n.ke} end={n.end} onClick={tutup}
            className={({ isActive }) => 'pp-navlink' + (isActive ? ' aktif' : '')}>
            <SVG d={Ikon[n.ikon]} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pp-sidebar__kaki">
        <div className="pp-akun">
          <div className="pp-akun__avatar" aria-hidden="true">
            {(profil?.nama || 'P').trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="pp-akun__nama">{profil?.nama || 'Pasien'}</div>
            <div className="pp-akun__mr">{profil?.no_mr ? 'RM ' + profil.no_mr : (profil?.no_hp || '')}</div>
          </div>
        </div>
        <button type="button" className="pp-navlink pp-keluar" onClick={logout}>
          <SVG d={Ikon.keluar} /><span>Keluar</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="pp-shell">
      <style>{CSS}</style>

      {/* Sidebar desktop + drawer mobile */}
      <aside className={'pp-sidebar' + (drawer ? ' buka' : '')}>{isi}</aside>
      {drawer && <div className="pp-backdrop" onClick={tutup} aria-hidden="true" />}

      <div className="pp-kolom">
        {/* Bar atas — hanya tampil di mobile */}
        <header className="pp-topbar">
          <button type="button" className="pp-hamburger" onClick={() => setDrawer(true)} aria-label="Buka menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="pp-topbar__judul">{klinik?.nama || 'Portal Pasien'}</span>
        </header>

        <main className="pp-main"><Outlet /></main>
      </div>
    </div>
  )
}

const CSS = `
.pp-shell { display:flex; min-height:100vh; background:var(--hijau-50); }
.pp-sidebar {
  width:250px; flex-shrink:0; background:var(--putih); border-right:1px solid var(--garis);
  display:flex; flex-direction:column; gap:var(--s-2);
  position:sticky; top:0; height:100vh; padding:var(--s-4) var(--s-3);
}
.pp-merek { display:flex; align-items:center; gap:var(--s-2); padding:var(--s-2); text-decoration:none; color:var(--teks); }
.pp-merek__logo { width:34px; height:34px; flex-shrink:0; display:grid; place-items:center;
  background:var(--hijau-700); color:#fff; border-radius:var(--r-md); font-weight:800; font-size:20px; }
.pp-merek__nama { font-weight:800; font-size:var(--t-sm); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pp-nav { display:flex; flex-direction:column; gap:2px; margin-top:var(--s-3); }
.pp-navlink {
  display:flex; align-items:center; gap:var(--s-3); padding:10px var(--s-3);
  border-radius:var(--r-md); color:var(--teks-lembut); text-decoration:none;
  font-size:var(--t-sm); font-weight:600; border:0; background:transparent; cursor:pointer;
  width:100%; text-align:left; transition:background var(--gerak), color var(--gerak);
}
.pp-navlink:hover { background:var(--hijau-50); color:var(--hijau-800); }
.pp-navlink.aktif { background:var(--hijau-100); color:var(--hijau-800); }
.pp-navlink.aktif svg { color:var(--hijau-700); }
.pp-sidebar__kaki { margin-top:auto; display:flex; flex-direction:column; gap:var(--s-2);
  border-top:1px solid var(--garis); padding-top:var(--s-3); }
.pp-akun { display:flex; align-items:center; gap:var(--s-2); padding:0 var(--s-2); }
.pp-akun__avatar { width:36px; height:36px; flex-shrink:0; border-radius:50%; display:grid; place-items:center;
  background:var(--hijau-700); color:#fff; font-weight:700; }
.pp-akun__nama { font-size:var(--t-sm); font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pp-akun__mr { font-size:var(--t-xs); color:var(--teks-samar); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pp-keluar { color:var(--bahaya); }
.pp-keluar:hover { background:var(--bahaya-bg); color:var(--bahaya); }

.pp-kolom { flex:1; min-width:0; display:flex; flex-direction:column; }
.pp-topbar { display:none; }
.pp-main { flex:1; width:100%; max-width:1000px; margin:0 auto; padding:var(--s-5) var(--s-4); }
.pp-backdrop { position:fixed; inset:0; background:rgba(16,18,15,0.45); z-index:39; }

@media (max-width:899px) {
  .pp-sidebar {
    position:fixed; top:0; left:0; z-index:40; height:100vh; width:270px;
    transform:translateX(-100%); transition:transform var(--gerak); box-shadow:var(--bayang-3);
  }
  .pp-sidebar.buka { transform:translateX(0); }
  .pp-topbar {
    display:flex; align-items:center; gap:var(--s-3); position:sticky; top:0; z-index:20;
    background:var(--putih); border-bottom:1px solid var(--garis); padding:var(--s-3) var(--s-4);
  }
  .pp-hamburger { border:0; background:transparent; color:var(--teks); display:grid; place-items:center;
    width:38px; height:38px; margin-left:-8px; border-radius:var(--r-md); cursor:pointer; }
  .pp-hamburger:hover { background:var(--hijau-50); }
  .pp-topbar__judul { font-weight:800; font-size:var(--t-sm); }
  .pp-main { padding:var(--s-4); }
}
`
