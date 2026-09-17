import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Memuat data dari API dengan tiga keadaan yang selalu lengkap:
 * sedang memuat, gagal, dan berhasil.
 *
 * Ditulis sekali di sini karena keadaan "gagal" adalah yang paling sering
 * terlupa bila setiap halaman mengurus fetch-nya sendiri — dan halaman yang
 * lupa menanganinya berhenti pada pemuat yang berputar selamanya.
 *
 * Permintaan dibatalkan saat komponennya dilepas, sehingga jawaban yang
 * datang terlambat tidak lagi mencoba mengubah keadaan komponen yang sudah
 * tidak ada.
 */
export default function useMuat(pemanggil, deps = [], { langsung = true } = {}) {
  const [data, setData] = useState(null)
  const [meta, setMeta] = useState(null)
  const [memuat, setMemuat] = useState(langsung)
  const [galat, setGalat] = useState(null)

  const acuan = useRef(pemanggil)
  acuan.current = pemanggil

  const jalankan = useCallback((signal) => {
    setMemuat(true)
    setGalat(null)

    return Promise.resolve(acuan.current({ signal }))
      .then((h) => {
        if (signal?.aborted) return
        setData(h?.data ?? null)
        setMeta(h?.meta ?? null)
      })
      .catch((e) => {
        if (e.name === 'AbortError' || signal?.aborted) return
        setGalat(e)
      })
      .finally(() => {
        if (!signal?.aborted) setMemuat(false)
      })
  }, [])

  useEffect(() => {
    if (!langsung) return undefined
    const ac = new AbortController()
    jalankan(ac.signal)
    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  /** Muat ulang manual, mis. setelah menyimpan. */
  const muatUlang = useCallback(() => jalankan(), [jalankan])

  return { data, meta, memuat, galat, muatUlang, setData }
}
