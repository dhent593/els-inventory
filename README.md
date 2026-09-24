# ELS Inventory System

Sistem manajemen inventaris berbasis web yang dikembangkan menggunakan **Google Apps Script**, **HTML/JS**, dan **Tailwind CSS**. Sistem ini digunakan untuk melacak masuk/keluarnya stok barang berbasis Serial Number (SN) dan melakukan sinkronisasi dengan data stok fisik. Aplikasi ini mendukung arsitektur *Role-Based Access Control* (RBAC) dengan pemisahan peran antara **Admin Pusat** dan **Cabang**.

## 🌟 Fitur Utama

- **Dashboard**: Ringkasan data inventaris dan aktivitas terkini yang disesuaikan berdasarkan Role (Admin Pusat melihat semua statistik, Cabang melihat statistik cabangnya sendiri).
- **Manajemen User**: Tambah, ubah, dan hapus data user (Admin/Cabang).
- **Buat SN (Nota)**: Pembuatan nota untuk serial number keluar.
- **SN Masuk**: Pendaftaran barang dan serial number baru yang masuk ke gudang.
- **Stock / Pricelist**: Pemantauan stok dan harga barang. Termasuk fitur import Excel untuk sinkronisasi penuh.
- **Request Cabang**: Modul interaktif untuk mengelola permintaan alokasi stok dari Cabang ke Admin Pusat. Mendukung sistem *cart*, pengiriman *request* massal, alokasi penuh/sebagian, hingga penolakan.
- **Riwayat SN**: Melacak riwayat distribusi serial number yang pernah dialokasikan ke cabang.
- **Stock Opname**: Scan barcode untuk verifikasi ketersediaan stok fisik (ditandai dengan warna hijau jika ADA), serta cetak laporan Stock Opname dalam format kertas A4.
- **Retur Part**: Manajemen pengembalian komponen bermasalah dari Cabang ke Pusat lengkap dengan fitur arsip.

## 🛠️ Stack Teknologi

- **Backend / Database**: Google Apps Script (`Code.gs`) & Google Sheets.
- **Frontend**: HTML5 & Vanilla JavaScript (`Index.html`).
- **Styling UI**: Tailwind CSS (via CDN).
- **Ikonografi**: FontAwesome 6.
- **Lainnya**: SheetJS (untuk membaca Excel di browser) & SweetAlert2 (untuk notifikasi/popup).

## 🚀 Panduan Instalasi (Deployment)

Karena aplikasi ini dibangun di atas ekosistem Google Workspace, instalasinya dilakukan langsung di Google Drive Anda:

1. **Siapkan Database**:
   - Buat file **Google Sheets** baru di Google Drive Anda.
   - Buat *sheet* (tab di bagian bawah) dengan nama-nama berikut untuk struktur datanya:
     
     **a. Sheet `users`** (Digunakan untuk akses login)
     - Kolom A: `Username` | Kolom B: `Password` | Kolom C: `Role` (ADMIN_PUSAT / CABANG) | Kolom D: `Cabang` | Kolom E: `Status`
     
     **b. Sheet `master_barang`** (Pusat data stok dan harga)
     - Kolom A: `Kode Barang` | Kolom B: `Nama Barang` | Kolom C: `Serial Number` | Kolom D: `Stok` | Kolom E: `Harga Modal` | Kolom F: `Harga Jual`
     
     **c. Sheet `sn_masuk`** (Pencatatan riwayat barang masuk)
     - Kolom A: `Tanggal` | Kolom B: `No Nota` | Kolom C: `Kode Barang` | Kolom D: `Nama Barang` | Kolom E: `Serial Number` | Kolom F: `Catatan` | Kolom G: `Alokasi Part`
     
     **d. Sheet `opname`** (Pencatatan proses Stock Opname)
     - Kolom A: `Kode Barang` | Kolom B: `Nama Barang` | Kolom C: `Serial Number` | Kolom D: `Tanggal Masuk` | Kolom E: `Status` (misal: Belum Scan, ADA)

     **e. Sheet `request_cabang`** (Daftar permintaan alokasi dari cabang)
     - Kolom A: `ID Request` | Kolom B: `Tanggal` | Kolom C: `Cabang` | Kolom D: `Row ID` | Kolom E: `Kode Barang` | Kolom F: `Nama Barang` | Kolom G: `Request (Qty)` | Kolom H: `Status` | Kolom I: `Alokasi (Qty)` | Kolom J: `Keterangan`

     **f. Sheet `riwayat_sn`** (Riwayat penyebaran SN ke tiap cabang)
     - Kolom A: `Tanggal` | Kolom B: `SN` | Kolom C: `Nama Barang` | Kolom D: `Cabang Tujuan` | Kolom E: `ID Request` | Kolom F: `Keterangan`

     **g. Sheet `retur` & `arsip_retur`** (Riwayat pengembalian barang dari cabang)
     
     **h. Sheet `master_sn`** (Database master nomor seri)

2. **Buka Apps Script**:
   - Dari dalam Google Sheets tersebut, klik menu **Extensions (Ekstensi)** > **Apps Script**.

3. **Salin Kode File**:
   - Buat file `Code.gs` dan salin seluruh isi dari logika server.
   - Buat file HTML baru bernama `Index.html` dan salin seluruh struktur antarmukanya (berupa arsitektur *Single Page Application*).

4. **Deploy sebagai Web App**:
   - Klik tombol **Deploy (Terapkan)** di kanan atas > **New deployment (Penerapan baru)**.
   - Pilih jenis roda gigi (Select type) > **Web app (Aplikasi web)**.
   - Isi deskripsi (opsional).
   - *Execute as*: **Me (Saya)**.
   - *Who has access*: **Anyone (Siapa saja)** atau batasi sesuai organisasi Anda.
   - Klik **Deploy** dan berikan otorisasi (*Review Permissions*) ke akun Google Anda.

5. **Selesai!**
   - Anda akan mendapatkan **URL Web App**. Buka URL tersebut di browser untuk mulai menggunakan ELS Inventory System.
