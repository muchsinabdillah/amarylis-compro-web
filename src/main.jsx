import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

/**
 * Penangkap galat terakhir.
 *
 * Tanpa ini, satu kekeliruan render membuat seluruh halaman menjadi putih —
 * dan pengunjung tidak punya cara apa pun untuk keluar dari keadaan itu selain
 * menutup tabnya. Yang ditampilkan tetap menyebutkan cara menghubungi klinik,
 * karena itulah yang sebenarnya dibutuhkan orang saat situsnya bermasalah.
 */
class PenangkapGalat extends React.Component {
  constructor(props) {
    super(props)
    this.state = { galat: null }
  }

  static getDerivedStateFromError(galat) {
    return { galat }
  }

  componentDidCatch(galat, info) {
    // Dicetak ke konsol saja: mengirimkannya ke layanan luar berarti isi
    // halaman klinik ikut menyeberang ke pihak ketiga.
    console.error('Galat render:', galat, info)
  }

  render() {
    if (!this.state.galat) return this.props.children

    return (
      <div style={{ maxWidth: 560, margin: '15vh auto', padding: '0 1rem', textAlign: 'center' }}>
        <h1>Halaman gagal ditampilkan</h1>
        <p style={{ color: '#59605D', marginTop: 12 }}>
          Terjadi kesalahan saat memuat halaman ini. Muat ulang halaman, atau
          hubungi klinik langsung bila Anda membutuhkan bantuan segera.
        </p>
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          style={{
            marginTop: 20, padding: '0.7rem 1.25rem', border: 0,
            borderRadius: 10, background: '#17654F', color: '#fff',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Kembali ke Beranda
        </button>
      </div>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PenangkapGalat>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PenangkapGalat>
  </React.StrictMode>,
)
