import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import PilihMedia from './PilihMedia'
import './editor.css'

/**
 * Editor teks kaya untuk isi artikel dan keterangan layanan.
 *
 * Hasilnya HTML, dan HTML itu TETAP DIBERSIHKAN ULANG DI SERVER. Pembatasan
 * di editor hanyalah kenyamanan — siapa pun dapat mengirim HTML apa pun ke
 * API tanpa melewati layar ini, jadi editor tidak boleh dianggap sebagai
 * penjaga.
 */
export default function Editor({ nilai, saatUbah, tinggiMin = 320 }) {
  const [pilihGambar, setPilihGambar] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },   // H1 milik judul halaman
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        // Tautan keluar tidak boleh memberi halaman tujuan kendali atas
        // jendela pembukanya.
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
    ],
    content: nilai || '',
    onUpdate: ({ editor: ed }) => saatUbah(ed.getHTML()),
  })

  // Isi dari server yang datang setelah editor dibuat harus dimasukkan
  // sekali; tanpa ini formulir sunting tampil kosong sesaat lalu tetap kosong.
  useEffect(() => {
    if (editor && nilai !== undefined && nilai !== editor.getHTML()) {
      editor.commands.setContent(nilai || '', false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, nilai === undefined])

  if (!editor) return <div className="rangka" style={{ height: tinggiMin }} />

  const tombol = (aktif, aksi, label, judul) => (
    <button
      type="button"
      title={judul || label}
      aria-pressed={aktif}
      className={`editor__tombol${aktif ? ' editor__tombol--aktif' : ''}`}
      onClick={aksi}
    >
      {label}
    </button>
  )

  const pasangTautan = () => {
    const lama = editor.getAttributes('link').href || ''
    const url = window.prompt('Alamat tautan (kosongkan untuk menghapus):', lama)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    // Hanya skema yang aman. javascript: di dalam href adalah cara paling tua
    // menjalankan skrip lewat atribut yang tampak tidak berbahaya.
    if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(url)) {
      window.alert('Alamat harus diawali http://, https://, /, mailto:, atau tel:')
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="editor">
      <div className="editor__bilah" role="toolbar" aria-label="Format teks">
        {tombol(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', 'Tebal')}
        {tombol(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', 'Miring')}
        {tombol(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), 'S', 'Coret')}

        <span className="editor__pisah" />

        {tombol(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', 'Judul bagian')}
        {tombol(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', 'Sub judul')}

        <span className="editor__pisah" />

        {tombol(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '•—', 'Daftar poin')}
        {tombol(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1—', 'Daftar bernomor')}
        {tombol(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '❝', 'Kutipan')}

        <span className="editor__pisah" />

        {tombol(editor.isActive('link'), pasangTautan, '🔗', 'Tautan')}
        {tombol(false, () => setPilihGambar(true), '🖼', 'Sisipkan gambar')}

        <span className="editor__pisah" />

        {tombol(false, () => editor.chain().focus().undo().run(), '↶', 'Batalkan')}
        {tombol(false, () => editor.chain().focus().redo().run(), '↷', 'Ulangi')}
      </div>

      <EditorContent editor={editor} className="editor__isi" style={{ minHeight: tinggiMin }} />

      <PilihMedia
        buka={pilihGambar}
        saatTutup={() => setPilihGambar(false)}
        saatPilih={(media) => {
          editor.chain().focus()
            .setImage({ src: media.url, alt: media.alt || '' })
            .run()
          setPilihGambar(false)
        }}
      />
    </div>
  )
}
