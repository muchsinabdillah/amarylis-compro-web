import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { perusahaan, pasangPenanganTakSahPerusahaan, tokenPerusahaan } from '../lib/api'

/**
 * Sesi PERUSAHAAN (portal MCU) — terpisah dari sesi pasien dan admin CMS.
 *
 * Satu akun perusahaan memegang data seluruh karyawan yang diikutkan MCU, jadi
 * sesinya sengaja dibuat pendek (2 jam, ditentukan server) dan diperiksa ulang
 * ke server tiap pemuatan halaman. Penyedia ini hanya dipasang di rute
 * /perusahaan, bukan di seluruh aplikasi: halaman publik tidak perlu ikut
 * menembak /api/perusahaan/saya.
 */
const Konteks = createContext(null)

export function PerusahaanPenyedia({ children }) {
  const [profil, setProfil] = useState(null)
  const [siap, setSiap] = useState(false)

  const keluar = useCallback(() => { tokenPerusahaan.hapus(); setProfil(null) }, [])

  useEffect(() => {
    pasangPenanganTakSahPerusahaan(() => { tokenPerusahaan.hapus(); setProfil(null) })
  }, [])

  useEffect(() => {
    if (!tokenPerusahaan.ambil()) { setSiap(true); return undefined }
    const ac = new AbortController()
    perusahaan.saya({ signal: ac.signal })
      .then((h) => { setProfil(h.data); setSiap(true) })
      .catch((e) => {
        if (e.name === 'AbortError' || ac.signal.aborted) return
        if (e.status === 401 || e.status === 403) tokenPerusahaan.hapus()
        setSiap(true)
      })
    return () => ac.abort()
  }, [])

  const masuk = useCallback(async (email, kataSandi) => {
    const h = await perusahaan.masuk({ email, kata_sandi: kataSandi })
    tokenPerusahaan.simpan(h.data.token)
    setProfil(h.data.profil)
    return h.data.profil
  }, [])

  const nilai = useMemo(() => ({ profil, siap, masuk, keluar }), [profil, siap, masuk, keluar])

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}

export function usePerusahaan() {
  const k = useContext(Konteks)
  if (!k) throw new Error('usePerusahaan harus dipakai di dalam <PerusahaanPenyedia>')
  return k
}
