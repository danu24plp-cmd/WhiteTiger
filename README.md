# 🐯 WHITE TIGER DASHBOARD - SISTEM BERANGKAS & DATABASE SQL ONLINE

Dashboard Enterprise untuk Manajemen Aset, Keuangan ROC, Penggajian Tambang, serta **Berangkas Bahan & Persenjataan** dengan sinkronisasi database SQL multi-user secara online.

---

## ❓ Mengapa Sebelumnya Data Tidak Tersinkron di GitHub?

Ketika Anda meng-upload ke **GitHub Pages**, GitHub hanya menyajikan file tampilan statis (HTML, CSS, JS). 
Sebelumnya, sistem menyimpan data di `localStorage` (penyimpanan internal browser). Akibatnya:
- Ketika **Pengguna A** menambahkan data di HP/laptopnya, data tersebut hanya tersimpan di memori HP Pengguna A.
- **Pengguna B** tidak bisa melihatnya karena tidak ada server / database SQL perantara di internet yang menghubungkan mereka.

---

## 🚀 Dua Cara Agar Data Tersinkronisasi Antar Pengguna Secara Online

Kami telah menyediakan **2 solusi terbaik**:

---

### Solusi 1: Menggunakan Database SQL Supabase (PostgreSQL Cloud) — *Sangat Direkomendasikan untuk GitHub Pages!*

Solusi ini membuat dashboard di **GitHub Pages** Anda langsung terhubung ke database **SQL (PostgreSQL)** di cloud secara gratis dan memiliki fitur **Realtime Sync**. Begitu Pengguna A klik *Deposit*, detik itu juga data di layar Pengguna B langsung bertambah tanpa perlu refresh!

#### Langkah Setup (Hanya 3 Menit):
1. **Daftar Akun Supabase (Gratis)**:
   - Kunjungi [https://supabase.com](https://supabase.com) dan klik **Start your project** (bisa login menggunakan akun GitHub Anda).
2. **Buat Proyek Baru**:
   - Klik **New project**, beri nama (misal: `white-tiger`), tentukan password database, dan pilih Region terdekat (misal: `Singapore`).
3. **Jalankan Skrip SQL**:
   - Di dashboard Supabase, buka menu **SQL Editor** (ikon terminal di sidebar kiri).
   - Klik **New query**, lalu salin seluruh isi file [`schema.sql`](schema.sql) dan tempel ke editor tersebut.
   - Klik tombol **Run** (Ctrl+Enter). Semua tabel (`materials`, `weapons`, `inventory_logs`, `members`, `setoran`, `brangkas`, `rates`) akan langsung terbentuk otomatis!
4. **Salin API Keys ke Dashboard**:
   - Buka menu **Project Settings** (ikon gerigi) > **API**.
   - Salin **Project URL** dan **anon public key**.
   - Buka file `supabase-config.js` di project ini, lalu masukkan:
     ```javascript
     const SUPABASE_CONFIG = {
       url: "https://xyzcompany.supabase.co",   // ← Ganti dengan Project URL Anda
       anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI..." // ← Ganti dengan anon public key Anda
     };
     ```
5. **Push ke GitHub**:
   - Commit & push file yang telah diperbarui ke repository GitHub Anda.
   - Buka link GitHub Pages Anda. Sekarang **seluruh pengguna di seluruh dunia membaca dan menulis ke database SQL yang sama secara realtime!**

---

### Solusi 2: 1-Klik Online via Cloudflare Tunnel (Tanpa Setup Akun Cloud)

Jika Anda ingin menjalankan database dari komputer ini dan langsung membagikan link ke teman/anggota lain:

1. Buka folder dashboard di komputer.
2. Klik kanan file **`start-online.ps1`** > pilih **Run with PowerShell** (atau jalankan `.\start-online.ps1` di terminal).
3. Script akan otomatis:
   - Menjalankan backend server database lokal (`server.ps1`).
   - Menghubungkan ke Cloudflare Quick Tunnel untuk membuat tautan online HTTPS publik yang aman (contoh: `https://xxxx.trycloudflare.com`).
4. **Salin link tersebut dan bagikan ke WhatsApp / Discord!** Siapapun yang membuka link tersebut akan mengakses database terpusat yang sama.

---

## 📦 Fitur Berangkas Bahan & Senjata

Akses menu **"Berangkas Bahan & Senjata"** di sidebar dashboard:

1. **Rekapitulasi 4 KPI**:
   - **Total Nilai Bahan**: Akumulasi nilai stok bahan tambang dalam mata uang USD.
   - **Total Nilai Senjata**: Akumulasi nilai persenjataan.
   - **Grand Total Aset**: Total gabungan seluruh aset di berangkas.
   - **Status Sinkronisasi Multi-User**: Menampilkan status koneksi database SQL realtime.

2. **Berangkas Bahan Tambang & Material**:
   - Mencatat stok: Batu Mentah, Emas Murni, Tembaga, Besi Batangan, Bluni Kantor, Bubuk Mesiu, dsb.
   - Tombol **Ambil**: Melakukan withdraw dengan validasi stok agar tidak bisa minus.
   - Tombol **Tambah**: Melakukan deposit penambahan stok.
   - Tombol **Hapus**: Menghapus item dari daftar berangkas.

3. **Berangkas Persenjataan**:
   - Mencatat persenjataan: Combat Pistol, AP Pistol, SMG Gusenberg, Heavy Rifle, Pump Shotgun, dsb.
   - Menampilkan kategori (Handgun, SMG, Assault Rifle, Shotgun) dan kondisi barang (Baik/Baru).
   - Deposit & Withdraw persenjataan.

4. **Riwayat Log Mutasi**:
   - Setiap transaksi deposit maupun withdraw otomatis dicatat lengkap dengan tanggal, jam, jenis barang, jumlah, dan nama petugas.

---

## 🗄️ Struktur Database SQL (`schema.sql`)

| Nama Tabel | Deskripsi |
|---|---|
| `materials` | Data stok bahan, satuan, harga per unit, dan total nilai. |
| `weapons` | Data stok senjata, kategori, kondisi, harga, dan total nilai. |
| `inventory_logs` | Riwayat transaksi mutasi masuk (deposit) dan keluar (withdraw). |
| `members` | Struktur organisasi dan anggota White Tiger (36 anggota). |
| `setoran` | Rekapitulasi setoran tambang & kalkulasi gaji uang bersih + uang ROC. |
| `brangkas` | Mutasi kas uang ROC organisasi. |
| `rates` | Kurs resmi konversi gaji. |

---

*White Tiger Dashboard - Enterprise Multi-User SQL Edition*
