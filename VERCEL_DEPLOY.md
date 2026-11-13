# Deploy Full-Vercel (Next.js + Postgres)

Backend Laravel sudah **diganti** jadi Next.js Route Handlers di dalam repo `frontend/`.
Artinya satu aplikasi Next.js melayani halaman sekaligus API (`/api/*`), jadi cukup
**satu domain** dan **satu** deployment.

```
devagitisari.my.id/*     →  Next.js (1 project Vercel)
                             ├── /             halaman publik
                             ├── /admin        dashboard (login + CRUD)
                             └── /api/*        API (1 serverless function)
                                    │
                                    ├── → Postgres   (Neon via Vercel Marketplace)
                                    ├── → Cloudinary (file gambar & PDF)
                                    └── → Gmail SMTP (email)
```

> **"Backend" di sini bukan service terpisah.** Dia cuma Route Handler di app yang
> sama — makanya tidak ada hosting kedua yang perlu disewa.

---

## Yang sudah disiapkan

| File | Isi |
|---|---|
| `prisma/schema.prisma` | Schema database (mengikuti tabel Laravel, kolomnya snake_case) |
| `prisma/migrations/0_init/migration.sql` | SQL untuk membuat tabel |
| `prisma/seed.ts` | Membuat user admin |
| `src/app/api/[...path]/route.ts` | Satu route handler untuk **semua** endpoint API |
| `src/lib/api/**` | Router, auth, validasi, Cloudinary, mail, rate limit |
| `scripts/import-backup.ts` | Import data dari backup JSON |
| `scripts/smoke-test.ts` | Smoke test router tanpa database |
| `../backend/database/export-backup.php` | Export database lokal (SQLite) jadi backup JSON |

Semua endpoint Laravel lama sudah dipertahankan 1:1 (path, method, bentuk response),
jadi **frontend tidak perlu diubah sama sekali**.

---

## Langkah 1 — Database Postgres (gratis)

### Cara tercepat: dari dashboard Vercel

1. **[Vercel Marketplace → Storage](https://vercel.com/marketplace?category=storage) → Neon → Install**
   (pilihan Postgres lain: Prisma Postgres, Supabase, AWS Aurora Postgres)
2. Pilih plan **Free**, region **Asia Pacific (Singapore)** → **Create**
3. Hubungkan ke project kamu → Vercel **otomatis** menambah env var `DATABASE_URL`
   (sudah termasuk ke Production + Preview)

Atau dari CLI (kalau project-nya sudah di-`vercel link` — jalankan dari folder
`frontend/` ya, bukan root repo):

```bash
vercel install neon --name portfolio-db --billing-plan free_v3 -e production -e preview
```

> ⚠️ Plan ID Neon **bukan** `free`, tapi `free_v3`. Daftar lengkapnya:
> `free_v3` (Free), `launch_v3` (Launch), `scale_v3` (Scale).
> Kalau salah, CLI-nya ngeprint: `Billing plan not found: free. Available plans: ...`
>
> CLI lama (54.x) pakai flag `-p`/`--plan` bukan `--billing-plan`:
> `vercel install neon --name portfolio-db -p free_v3 -e production -e preview`
>
> ⚠️ `vercel install` menjalankan `vercel env pull` → **menimpa `.env.local`**.
> Backup dulu: `copy .env.local .env.local.backup`

> Bonus: database bisa dibuka & diedit langsung dari dashboard Vercel —
> **Storage → resource kamu → Database** (Query editor + Data editor + Schema viewer) ✅

### Connection string

Neon punya 2 endpoint — **harus pakai yang pooled** (Vercel nggak dukung IPv6):

```
✅ postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
❌ postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/neondb   ← IPv6, bakal gagal
```

> URL pooled dari Neon (yang di-inject Vercel) **sudah langsung bisa dipakai
> Prisma** — sudah diuji dengan 20 query paralel ✅. Parameter
> `&pgbouncer=true&connection_limit=5` bersifat opsional; kalau ditambahkan,
> pastikan tetap jalan (Prisma bisa gagal init kalau Url-nya tidak cocok).

Kalau pakai **Supabase**, pakai **Session pooler** (port 5432):

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require
```

> ⚠️ Username Supabase formatnya `postgres.PROJECT_REF` (ada titiknya).

### Neon atau Supabase?

| | Neon (via Vercel) | Supabase |
|---|---|---|
| Setup | Sekali klik di dashboard Vercel ✅ | Bikin akun terpisah, copy URL manual |
| Auto-suspend | ✅ resume sendiri, ~300ms | ❌ project **di-pause setelah 1 minggu** idle → harus klik Restore |
| Billing | unifying di akun Vercel ✅ | Tagihan terpisah di akun Supabase |
| Free tier | 1 GB storage, 100 CU-hours/bulan | 500 MB storage |

**Rekomendasi: Neon** — karena project kamu jarang dibuka, dan Supabase yang pause
1 minggu itu bikin situs mati kalau kamu lupa restore.

### Tips biar free tier nggak habis

Di Neon console → set **autoscaling max = 0.25 CU**. Dengan begitu 100 CU-hours/bulan
= **400 jam compute** — jauh melebihi kebutuhan portofolio. Kalau habis, compute
di-suspend sampai bulan berikutnya (data **tidak** hilang).

## Langkah 2 — Import repo ke Vercel

1. Push perubahan ini ke repo `frontend` (`portofolio-frontend`):

   ```bash
   cd frontend
   git add -A
   git commit -m "feat: migrate Laravel API to Next.js route handlers"
   git push
   ```

2. Vercel → **Add New → Project** → import repo `portofolio-frontend`
3. Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `prisma generate && prisma migrate deploy && next build`
     (kalau `prisma migrate deploy` gagal karena build paralel, pakai
     `prisma generate && next build` lalu jalankan migrasi sekali manual)
   - **Install Command**: `npm install` (default sudah cukup)

---

## Langkah 3 — Environment variables

Di Vercel → project → **Settings → Environment Variables** (apply ke Production
*dan* Preview), tambahkan:

| Key | Value |
|---|---|
| `DATABASE_URL` | pooled connection string (lihat langkah 1) |
| `NEXT_PUBLIC_BACKEND_API_URL` | `https://devagitisari.my.id/api` |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USERNAME` | email Gmail kamu |
| `SMTP_PASSWORD` | app password Gmail |
| `MAIL_FROM_ADDRESS` | email pengirim |
| `MAIL_FROM_NAME` | `Deva Gitisari` |
| `ADMIN_EMAIL` | email untuk login admin |
| `ADMIN_PASSWORD` | password login admin |
| `ADMIN_NAME` | `Deva Gitisari` |
| `UPSTASH_REDIS_REST_URL` | *(opsional)* untuk rate limit global |
| `UPSTASH_REDIS_REST_TOKEN` | *(opsional)* |

> Total biaya bulanan: **Vercel Hobby $0 + Neon Free $0 + Cloudinary free tier $0**
> = **$0**. Vercel Hobby resmi untuk penggunaan personal/non-komersial — kalau
> nanti portofolionya dipakai untuk bisnis, upgrade ke Pro ($20/anggota/bulan).

> ⚠️ `NEXT_PUBLIC_*` di-inline saat **build**. Kalau nilainya diubah, harus redeploy.

> ⚠️ **Rotate secret yang sudah pernah bocor**: `.env.production` di repo `backend/`
> pernah memuat password MySQL, app password Gmail, dan secret Cloudinary.
> Buat ulang secret-nya sebelum deploy (Gmail: Security → App Passwords).

---

## Langkah 4 — Deploy & buat tabel

Tekan **Deploy**. Build akan menjalankan `prisma migrate deploy` yang membuat tabel.

Kalau migrasi tidak jalan di build (concurrent build), jalankan manual sekali:

```bash
# dari laptop, dengan DATABASE_URL yang sama
cd frontend
npx prisma migrate deploy
```

---

## Langkah 5 — Seed user admin

```bash
cd frontend
$env:DATABASE_URL="postgresql://..."       # PowerShell
npx prisma db seed
```

Output: `✓ Admin user admin@devagitisari.my.id created.`
(user ini yang dipakai untuk login di `/admin-login`)

Kalau user sudah ada dan mau reset password, jalankan seed lagi dengan
`ADMIN_PASSWORD` yang baru.

---

## Langkah 6 — Migrasi data dari database lama

### a) Dari database lokal (SQLite)

```bash
# 1. export SQLite lokal jadi JSON
php backend/database/export-backup.php

# 2. import ke Postgres
cd frontend
npm run import:backup -- ../backend/database/backup-local.json
```

### b) Dari hosting lama (MySQL)

1. Login ke phpMyAdmin hosting lama → **Export** database `devn8924_portofolio_db` → SQL
2. Upload ke Neon/Supabase (Neon: Console → SQL Editor / `psql`; Supabase: SQL Editor)
3. Sesuaikan tipe kolom yang bentrok:

   ```sql
   ALTER TABLE projects ALTER COLUMN key_features TYPE jsonb USING key_features::jsonb;
   ALTER TABLE projects ALTER COLUMN tools TYPE jsonb USING tools::jsonb;
   ALTER TABLE projects ALTER COLUMN start_date TYPE date USING start_date::date;
   ALTER TABLE projects ALTER COLUMN end_date TYPE date USING end_date::date;
   ALTER TABLE experiences ALTER COLUMN start_date TYPE date USING start_date::date;
   ALTER TABLE experiences ALTER COLUMN end_date TYPE date USING end_date::date;
   ALTER TABLE certificates ALTER COLUMN date TYPE date USING date::date;
   ALTER TABLE certificates ALTER COLUMN expires_date TYPE date USING expires_date::date;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;
   ```

4. Import sisa data lewat `npm run import:backup -- backup.json` (export JSON dari
   admin panel Laravel: **Admin → Backup → Export**), atau salin langsung dengan SQL.

> Data `users` (akun admin) tidak ikut dalam backup JSON — buat manual lewat seed.

---

## Langkah 7 — Domain & DNS (`.my.id`)

`.my.id` **nggak ada bedanya** sama domain lain — yangimportant cuma kamu bisa
mengubah DNS-nya di registrar tempat kamu beli domain itu.

Di panel DNS registrar, tambahkan:

| Type | Host | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `CNAME` | `api` | `cname.vercel-dns.com` *(opsional)* |

Lalu di Vercel → project → **Settings → Domains** → tambahkan `devagitisari.my.id`
dan `www.devagitisari.my.id`. Vercel otomatis terbitkan **sertifikat SSL gratis**
(Let's Encrypt) dan memperbaruinya sendiri ✅

Kalau registrar kamu cuma bisa menerima **A record** (tidak mendukung CNAME),
pakai `A` untuk `www` juga → `76.76.21.21`.

> Kalau ternyata **DNS sama sekali nggak bisa diubah** di registrar `.my.id` itu,
> situs tetap bisa hidup di subdomain gratis dari Vercel:
> `nama-project.vercel.app` — dan domain `.my.id` bisa dipasang belakangan.

> API **nggak wajib** punya subdomain sendiri — default-nya API dan web berada di
> origin yang sama (`/api/...`), jadi CORS nggak perlu diatur dan lebih aman.
> Kalau mau tetap pakai `api.devagitisari.my.id`, arahkan CNAME-nya ke Vercel juga
> lalu set `NEXT_PUBLIC_BACKEND_API_URL=https://api.devagitisari.my.id/api`
> **dan** tambahkan origin itu ke CORS (kalau masih memakai backend Laravel).

---

## Langkah 8 — Checklist verifikasi

```bash
# dari laptop
curl https://devagitisari.my.id/api/settings
curl https://devagitisari.my.id/api/projects
curl https://devagitisari.my.id/api/skills
curl https://devagitisari.my.id/api/certificates
```

Lalu cek manual:

- [ ] Halaman home load, project & skill tampil
- [ ] `/admin-login` bisa login
- [ ] Upload thumbnail project (Cloudinary) → gambar tampil
- [ ] Upload sertifikat → thumbnail PDF tampil
- [ ] Form kontak → email masuk
- [ ] Reply inbox → email terkirim ke pengirim
- [ ] GitHub contribution graph (iframe) tampil
- [ ] Analytics visitor naik setelah refresh

---

## Catatan penting (plan Hobby)

- **1 project** Vercel Hobby sudah cukup (repo `frontend`).
- Batas **12 serverless function**: aplikasi ini pakai ±4 (1 route API + 3 ISR page) ✅
- `maxDuration` function API = 60 detik.
- **Batas body request = 4.5 MB** (batas Vercel, bukan kode kita). Semua upload
  divalidasi dulu: project image & sertifikat **2 MB** (sama seperti aturan
  Laravel), resume / foto profil / OG image **4 MB**. File yang lebih besar akan
  ditolak dengan pesan 422 yang jelas — bukan error 413 dari Vercel.
- Rate limit (`/login`, `/contact`, `/analytics`) pakai in-memory per instance.
  Pakai **Upstash Redis** (gratis) kalau butuh limit global.
- Neon auto-suspend setelah ±5 menit idle → request pertama berikutnya butuh ~1 detik
  extra (wajar).

---

## Rollback ke backend Laravel

Repo `backend/` **tidak dihapus** dan masih jalan normal:

```bash
cd backend
php artisan serve          # API lokal
```

Cukup arahkan `NEXT_PUBLIC_BACKEND_API_URL` ke URL backend Laravel kalau perlu
fallback. Keduanya memakai **format data yang sama**, jadi konten tidak hilang
saat pindah-pindah.

---

## Perintah harian

```bash
npm run dev            # dev server
npm run build          # build produksi
npm run db:migrate     # jalankan migrasi
npm run db:seed        # buat/reset user admin
npm run db:studio      # GUI database
npm run import:backup -- <file.json>   # import backup
npm run verify:import  # cek data hasil import
```

## Troubleshooting

| Gejala | Penyebab & Solusi |
|---|---|
| `Can't reach database server` | Pakai **pooler**, bukan direct connection (IPv6). Format: `postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require` |
| `permission denied for schema public` saat migrate | Jalankan sekali di SQL Editor Supabase: `GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;` lalu ulangi migrate |
| `prepared statement "s0" already exists` | Connection string-nya lewat pooler mode transaction → tambahkan `&pgbouncer=true` |
| `PrismaClientInitializationError: DATABASE_URL not found` | Env var `DATABASE_URL` belum diset di Vercel (atau belum di-deploy ulang setelah diset) |
| Upload file error 413 / "must not be greater than" | File melebihi batas 4.5 MB Vercel → kompres PDF atau pakai URL Cloudinary langsung |
| GitHub contribution graph kosong | Rate limit GitHub API (60 req/jam tanpa token) → opsional: set `GITHUB_TOKEN` |
| Halaman `/projects/[slug]` kosong setelah deploy | `NEXT_PUBLIC_BACKEND_API_URL` berubah setelah build → harus redeploy (variabel di-inline saat build) |

---

## Test lokal tanpa install Postgres

Repo ini sudah menyediakan Postgres embedded (PGlite) yang jalan lewat protokol
Postgres asli, jadi Prisma bisa connect persis seperti ke Neon/Supabase.

```bash
# terminal 1 — jalankan database lokal + migrasi + seed
npm run db:local -- --migrate

# terminal 2 — jalankan test
$env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable&pgbouncer=true"
$env:ADMIN_EMAIL="admin@example.com"
$env:ADMIN_PASSWORD="password123"
npm run test:e2e
```

> `?pgbouncer=true` wajib dipakai: Prisma menonaktifkan prepared statements supaya
> kompatibel dengan connection pooler mode transaction (Neon pooled, PGlite).

Test yang tersedia:

- `npm run test:smoke` — cek router (404/405/422/401) tanpa database
- `npm run test:e2e` — 40+ cek end-to-end (login, CRUD, inquiry, backup, analytics)
