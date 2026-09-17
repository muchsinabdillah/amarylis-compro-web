import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Alamat API tidak ditanam di dalam kode.
 *
 * Saat pengembangan, permintaan ke /api dan /media diteruskan ke backend
 * sehingga peramban melihat semuanya berasal dari satu asal — CORS tidak ikut
 * campur, dan perilakunya sama dengan di production yang memang satu domain.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    /*
     * Port dipatok, bukan dibiarkan bergeser.
     *
     * Tanpa strictPort, Vite diam-diam pindah ke port berikutnya bila 5173
     * sedang dipakai — dan di mesin yang menjalankan beberapa proyek, port
     * berikutnya itu bisa jadi sudah dimiliki proyek lain pada tumpukan IPv6
     * sementara Vite memakai IPv4-nya. Hasilnya satu alamat menampilkan dua
     * situs yang berbeda tergantung cara `localhost` diterjemahkan, dan
     * kekeliruan itu sangat sulit dikenali. Lebih baik gagal terang-terangan.
     */
    port: 5190,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/media': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/sitemap.xml': { target: 'http://127.0.0.1:8080', changeOrigin: true },
      '/robots.txt': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Halaman publik tidak perlu ikut memuat kode CMS.
        manualChunks: {
          editor: ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-link', '@tiptap/extension-image'],
        },
      },
    },
  },
})
