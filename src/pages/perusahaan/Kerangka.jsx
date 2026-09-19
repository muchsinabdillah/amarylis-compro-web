import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { usePerusahaan } from '../../context/PerusahaanAuthContext'
import { useSitus } from '../../context/SiteContext'

/* Ikon garis sederhana (stroke currentColor) — tanpa pustaka ikon. */
const Ikon = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  unggah:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  peserta:   'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  hasil:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
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
  { ke: '/perusahaan',         label: 'Dashboard',      ikon: 'dashboard', end: true },
  { ke: '/perusahaan/unggah',  label: 'Unggah Peserta', ikon: 'unggah' },
  { ke: '/perusahaan/batch',   label: 'Daftar Batch',   ikon: 'peserta' },
  { ke: '/perusahaan/hasil',   label: 'Hasil MCU',      ikon: 'hasil' },
]

export default function Kerangka() {
  const { profil, keluar } = usePerusahaan()
  const { klinik } = useSitus()
  const navigasi = useNavigate()
  const [drawer, setDrawer] = useState(false)

  const tutup = () => setDrawer(false)
  const logout = () => { keluar(); navigasi('/perusahaan/masuk', { replace: true }) }

  const isi = (
    <>
      <Link to="/" className="pm-merek" onClick={tutup}>
        <span className="pm-merek__logo" aria-hidden="true">+</span>
        <span className="pm-merek__nama">{klinik?.nama || 'Portal MCU'}</span>
      </Link>

      <nav className="pm-nav">
        {NAV.map((n) => (
          <NavLink key={n.ke} to={n.ke} end={n.end} onClick={tutup}
            className={({ isActive }) => 'pm-navlink' + (isActive ? ' aktif' : '')}>
            <SVG d={Ikon[n.ikon]} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pm-sidebar__kaki">
        <div className="pm-akun">
          <div className="pm-akun__avatar" aria-hidden="true">
            {(profil?.nama_perusahaan || 'P').trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="pm-akun__nama">{profil?.nama_perusahaan || 'Perusahaan'}</div>
            <div className="pm-akun__sub">{profil?.email || ''}</div>
          </div>
        </div>
        <button type="button" className="pm-navlink pm-keluar" onClick={logout}>
          <SVG d={Ikon.keluar} /><span>Keluar</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="pm-shell">
      <style>{CSS}</style>

      <aside className={'pm-sidebar' + (drawer ? ' buka' : '')}>{isi}</aside>
      {drawer && <div className="pm-backdrop" onClick={tutup} aria-hidden="true" />}

      <div className="pm-kolom">
        <header className="pm-topbar">
          <button type="button" className="pm-hamburger" onClick={() => setDrawer(true)} aria-label="Buka menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="pm-topbar__judul">{profil?.nama_perusahaan || 'Portal MCU'}</span>
        </header>

        <main className="pm-main"><Outlet /></main>
      </div>
    </div>
  )
}

const CSS = `
.pm-shell { display:flex; min-height:100vh; background:var(--hijau-50); }
.pm-sidebar {
  width:250px; flex-shrink:0; background:var(--putih); border-right:1px solid var(--garis);
  display:flex; flex-direction:column; gap:var(--s-2);
  position:sticky; top:0; height:100vh; padding:var(--s-4) var(--s-3);
}
.pm-merek { display:flex; align-items:center; gap:var(--s-2); padding:var(--s-2); text-decoration:none; color:var(--teks); }
.pm-merek__logo { width:34px; height:34px; flex-shrink:0; display:grid; place-items:center;
  background:var(--hijau-700); color:#fff; border-radius:var(--r-md); font-weight:800; font-size:20px; }
.pm-merek__nama { font-weight:800; font-size:var(--t-sm); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pm-nav { display:flex; flex-direction:column; gap:2px; margin-top:var(--s-3); }
.pm-navlink {
  display:flex; align-items:center; gap:var(--s-3); padding:10px var(--s-3);
  border-radius:var(--r-md); color:var(--teks-lembut); text-decoration:none;
  font-size:var(--t-sm); font-weight:600; border:0; background:transparent; cursor:pointer;
  width:100%; text-align:left; transition:background var(--gerak), color var(--gerak);
}
.pm-navlink:hover { background:var(--hijau-50); color:var(--hijau-800); }
.pm-navlink.aktif { background:var(--hijau-100); color:var(--hijau-800); }
.pm-navlink.aktif svg { color:var(--hijau-700); }
.pm-sidebar__kaki { margin-top:auto; display:flex; flex-direction:column; gap:var(--s-2);
  border-top:1px solid var(--garis); padding-top:var(--s-3); }
.pm-akun { display:flex; align-items:center; gap:var(--s-2); padding:0 var(--s-2); }
.pm-akun__avatar { width:36px; height:36px; flex-shrink:0; border-radius:50%; display:grid; place-items:center;
  background:var(--hijau-700); color:#fff; font-weight:700; }
.pm-akun__nama { font-size:var(--t-sm); font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pm-akun__sub { font-size:var(--t-xs); color:var(--teks-samar); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pm-keluar { color:var(--bahaya); }
.pm-keluar:hover { background:var(--bahaya-bg); color:var(--bahaya); }

.pm-kolom { flex:1; min-width:0; display:flex; flex-direction:column; }
.pm-topbar { display:none; }
.pm-main { flex:1; width:100%; max-width:1060px; margin:0 auto; padding:var(--s-5) var(--s-4); }
.pm-backdrop { position:fixed; inset:0; background:rgba(16,18,15,0.45); z-index:39; }

@media (max-width:899px) {
  .pm-sidebar {
    position:fixed; top:0; left:0; z-index:40; height:100vh; width:270px;
    transform:translateX(-100%); transition:transform var(--gerak); box-shadow:var(--bayang-3);
  }
  .pm-sidebar.buka { transform:translateX(0); }
  .pm-topbar {
    display:flex; align-items:center; gap:var(--s-3); position:sticky; top:0; z-index:20;
    background:var(--putih); border-bottom:1px solid var(--garis); padding:var(--s-3) var(--s-4);
  }
  .pm-hamburger { border:0; background:transparent; color:var(--teks); display:grid; place-items:center;
    width:38px; height:38px; margin-left:-8px; border-radius:var(--r-md); cursor:pointer; }
  .pm-hamburger:hover { background:var(--hijau-50); }
  .pm-topbar__judul { font-weight:800; font-size:var(--t-sm); }
  .pm-main { padding:var(--s-4); }
}
`
