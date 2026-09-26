#!/usr/bin/env bash
#
# Bangun & kirim website compro.
#
#   ./deploy.sh dev     -> api-compro-klinik.amarylis.co.id -> cabang main
#                          -> /var/www/compro-klinik  (compro-klinik.amarylis.co.id)
#   ./deploy.sh prod    -> api-compro.amarylis.co.id        -> cabang production
#                          -> /var/www/klinikpratamaandini (klinikpratamaandini.com)
#
# Server tidak punya Node, jadi build dikerjakan di sini dan hasilnya didorong
# ke repo build; server cukup `git pull`.
#
# Tiga hal yang dijaga skrip ini:
#   1. Bundel diperiksa SEBELUM dikirim: harus menunjuk API yang benar, dan
#      tidak boleh memuat alamat API lingkungan sebelah. DEV dan PRODUCTION
#      memakai basis data yang berbeda; bundel yang salah membuat pengunjung
#      situs resmi membaca data uji.
#   2. Cabang repo build dipastikan benar sebelum commit.
#   3. Yang gagal periksa tidak pernah di-commit.

set -euo pipefail

TARGET="${1:-}"
# Skrip ini tinggal DI DALAM repo frontend supaya ikut terversi;
# COMPRO-WEB/ sendiri bukan repo git, frontend dan backend terpisah.
FE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$TARGET" in
  dev)
    API="https://api-compro-klinik.amarylis.co.id"
    LAWAN="api-compro.amarylis.co.id"
    CABANG="main"
    PATH_SERVER="/var/www/compro-klinik"
    SITUS="compro-klinik.amarylis.co.id" ;;
  prod)
    API="https://api-compro.amarylis.co.id"
    LAWAN="api-compro-klinik.amarylis.co.id"
    CABANG="production"
    PATH_SERVER="/var/www/klinikpratamaandini"
    SITUS="klinikpratamaandini.com" ;;
  *)
    echo "pakai: ./deploy.sh dev|prod" >&2; exit 2 ;;
esac

echo "=== BANGUN COMPRO: $TARGET ==="
echo "  API    : $API"
echo "  cabang : $CABANG"
echo "  tujuan : $PATH_SERVER"
echo

# Cabang repo build dipindah LEBIH DULU, baru dibangun ke dalamnya.
# Kebalikannya tidak bisa: berkas hasil build membuat `git checkout` ke cabang
# lain gagal karena isinya berbeda, dan skrip berhenti setelah terlanjur
# membangun -- persis yang terjadi pada percobaan pertama skrip ini.
cd "$FE/dist"
git fetch -q origin
if git show-ref --verify --quiet "refs/heads/$CABANG"; then
  git checkout -qf "$CABANG"
elif git show-ref --verify --quiet "refs/remotes/origin/$CABANG"; then
  git checkout -qf -b "$CABANG" "origin/$CABANG"
else
  git checkout -qf -b "$CABANG"
fi
git pull -q --ff-only origin "$CABANG" 2>/dev/null || true
echo "  repo build pada cabang: $(git rev-parse --abbrev-ref HEAD)"
echo

cd "$FE"
VITE_API_URL="$API" npx vite build

echo
echo "=== PERIKSA BUNDEL ==="
cd "$FE/dist"
# grep keluar 1 bila tidak menemukan apa pun; di sini NOL adalah jawaban yang
# sah, jadi pipefail dimatikan sejenak agar set -e tidak ikut menghentikan.
hitung() { ( set +o pipefail; grep -rho "$1" assets/*.js index.html 2>/dev/null | wc -l | tr -d ' ' ); }
N_BENAR=$(hitung "${API#https://}")
N_LAWAN=$(hitung "$LAWAN")

printf '  menunjuk %-34s : %s\n' "${API#https://}" "$N_BENAR"
printf '  menunjuk %-34s : %s\n' "$LAWAN" "$N_LAWAN"

if [ "$N_BENAR" -eq 0 ]; then
  echo "  GAGAL: bundel tidak menunjuk API $TARGET. Tidak dikirim." >&2; exit 1
fi
if [ "$N_LAWAN" -ne 0 ]; then
  echo "  GAGAL: bundel memuat alamat API lingkungan sebelah. Tidak dikirim." >&2; exit 1
fi
echo "  lolos."

echo
echo "=== KIRIM KE REPO BUILD ($CABANG) ==="

git add -A
if git diff --cached --quiet; then
  echo "  tidak ada perubahan — bundel sama dengan yang sudah terkirim."
else
  git commit -q -m "build $TARGET: $(date '+%Y-%m-%d %H:%M')"
  git push -q origin "$CABANG"
  echo "  terkirim: $(git rev-parse --short HEAD) -> origin/$CABANG"
fi

echo
echo "=== JALANKAN DI SERVER ==="
echo "  cd $PATH_SERVER && git fetch origin && git reset --hard origin/$CABANG"
echo
echo "  periksa: curl -s https://$SITUS/ | grep -o 'assets/index-[A-Za-z0-9_-]*\\.js'"
if [ "$TARGET" = "dev" ]; then
  echo
  echo "  Catatan: index.html situs DEV disajikan no-cache; purge Cloudflare"
  echo "  tidak diperlukan (diperiksa 2026-09-26)."
else
  echo
  echo "  Catatan: klinikpratamaandini.com TIDAK diproksi Cloudflare — tidak ada"
  echo "  cache di depannya, perubahan langsung terlihat."
fi
