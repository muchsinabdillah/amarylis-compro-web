import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { pasien, pasangPenanganTakSahPasien, tokenPasien } from '../lib/api'

/**
 * Sesi PASIEN (portal reservasi) — terpisah dari sesi admin CMS.
 *
 * Token disimpan di slot sendiri (compro.pasien.token) dan diperiksa ulang ke
 * server tiap pemuatan halaman, sama seperti sesi admin. Dengan slot terpisah,
 * pasien dan admin bisa masuk di peramban yang sama tanpa saling mengeluarkan.
 */
const Konteks = createContext(null)

export function PasienPenyedia({ children }) {
  const [profil, setProfil] = useState(null)
  const [siap, setSiap] = useState(false)

  const keluar = useCallback(() => { tokenPasien.hapus(); setProfil(null) }, [])

  useEffect(() => {
    pasangPenanganTakSahPasien(() => { tokenPasien.hapus(); setProfil(null) })
  }, [])

  useEffect(() => {
    if (!tokenPasien.ambil()) { setSiap(true); return undefined }
    const ac = new AbortController()
    pasien.saya({ signal: ac.signal })
      .then((h) => { setProfil(h.data); setSiap(true) })
      .catch((e) => {
        if (e.name === 'AbortError' || ac.signal.aborted) return
        if (e.status === 401 || e.status === 403) tokenPasien.hapus()
        setSiap(true)
      })
    return () => ac.abort()
  }, [])

  const masuk = useCallback(async (noHp, password) => {
    const h = await pasien.masuk({ no_hp: noHp, password })
    tokenPasien.simpan(h.data.token)
    setProfil(h.data.pasien)
    return h.data.pasien
  }, [])

  const daftar = useCallback(async (isi) => {
    const h = await pasien.daftar(isi)
    tokenPasien.simpan(h.data.token)
    setProfil(h.data.pasien)
    return h.data.pasien
  }, [])

  const nilai = useMemo(
    () => ({ profil, siap, masuk, daftar, keluar, setProfil }),
    [profil, siap, masuk, daftar, keluar])

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>
}

export function usePasien() {
  const k = useContext(Konteks)
  if (!k) throw new Error('usePasien harus dipakai di dalam <PasienPenyedia>')
  return k
}
