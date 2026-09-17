import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { admin, pasangPenanganTakSah, token } from '../lib/api'

/**
 * Sesi pengelola CMS.
 *
 * Token disimpan di localStorage dan diperiksa ulang ke server pada setiap
 * pemuatan halaman. Mempercayai isi token tanpa memeriksanya berarti CMS
 * tetap terlihat terbuka setelah peran dicabut atau akun dinonaktifkan —
 * layarnya tampil, lalu setiap tindakan gagal satu per satu tanpa alasan
 * yang jelas.
 */
const Konteks = createContext(null)

export function AuthPenyedia({ children }) {
  const [pengguna, setPengguna] = useState(null)
  const [siap, setSiap] = useState(false)

  const keluar = useCallback(() => {
    token.hapus()
    setPengguna(null)
  }, [])

  // Token yang ditolak di mana pun langsung mengakhiri sesi, tidak menunggu
  // pengguna menekan sesuatu lagi.
  useEffect(() => {
    pasangPenanganTakSah(() => {
      token.hapus()
      setPengguna(null)
    })
  }, [])

  useEffect(() => {
    if (!token.ambil()) {
      setSiap(true)
      return undefined
    }

    const ac = new AbortController()

    admin.saya({ signal: ac.signal })
      .then((h) => {
        setPengguna(h.data)
        setSiap(true)
      })
      .catch((e) => {
        /*
         * Token HANYA dibuang bila server benar-benar menolaknya.
         *
         * Permintaan yang dibatalkan (React StrictMode menjalankan efek dua
         * kali saat pengembangan) dan gangguan jaringan sesaat bukan alasan
         * mengeluarkan orang dari sesinya — dan keluar sendiri tanpa sebab
         * adalah kegagalan yang paling sulit ditelusuri pemakainya.
         */
        if (e.name === 'AbortError' || ac.signal.aborted) return

        if (e.status === 401 || e.status === 403) {
          token.hapus()
        }
        setSiap(true)
      })

    return () => ac.abort()
  }, [])

  const masuk = useCallback(async (email, password) => {
    const h = await admin.masuk({ email, password })
    token.simpan(h.data.token)
    setPengguna({
      sub: h.data.pengguna.id,
      nama: h.data.pengguna.nama,
      email: h.data.pengguna.email,
      peran: h.data.pengguna.peran,
      izin: h.data.pengguna.izin,
    })
    return h.data.pengguna
  }, [])

  const nilai = useMemo(() => ({
    pengguna,
    siap,
    masuk,
    keluar,
    /**
     * Wewenang di sisi peramban hanya untuk MENYEMBUNYIKAN menu yang tidak
     * dapat dipakai. Penjaga yang sesungguhnya ada di server; yang di sini
     * dapat dilewati siapa pun yang membuka alat pengembang.
     */
    boleh: (kode) => {
      const izin = pengguna?.izin || []
      return izin.includes('*') || izin.includes(kode)
    },
  }), [pengguna, siap, masuk, keluar])

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}

export function useAuth() {
  const k = useContext(Konteks)
  if (!k) throw new Error('useAuth harus dipakai di dalam <AuthPenyedia>')
  return k
}
