# ELS Inventory System

Sistem manajemen inventaris berbasis web yang dikembangkan menggunakan **Google Apps Script**, **HTML/JS**, dan **Tailwind CSS**. Sistem ini digunakan untuk melacak masuk/keluarnya stok barang berbasis Serial Number (SN) dan melakukan sinkronisasi dengan data *Accurate*.

## 🌟 Fitur Utama

- **Dashboard**: Ringkasan data inventaris dan aktivitas terkini.
- **Buat SN (Nota)**: Pembuatan nota untuk serial number keluar.
- **SN Masuk**: Pendaftaran barang dan serial number baru yang masuk ke gudang.
- **Stock / Pricelist**: Pemantauan stok dan harga barang. Termasuk fitur import Excel untuk sinkronisasi penuh (menggantikan / menimpa data SN).
- **Request Cabang**: Manajemen permintaan stok dari cabang lain.
- **Riwayat SN**: Melacak riwayat serial number yang pernah keluar (dalam pengembangan).
- **Stock Opname**: 
  - Scan barcode untuk verifikasi ketersediaan stok fisik (ditandai dengan warna hijau jika *ADA*).
  - Cetak (Print) laporan Stock Opname dalam format kertas A4 (lengkap dengan indikator kolom kosong untuk SN yang belum di-scan, atau centang bila *ADA*).
  - Sinkronisasi data via Excel.

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
   - Buat beberapa *sheet* / *tab* sesuai dengan kebutuhan aplikasi (misal: `master_barang`, `opname`, dll).

2. **Buka Apps Script**:
   - Dari dalam Google Sheets tersebut, klik menu **Extensions (Ekstensi)** > **Apps Script**.

3. **Salin Kode File**:
   - Buat file `Code.gs` dan salin seluruh isi dari backend Anda.
   - Buat file HTML baru bernama `Index.html` dan salin seluruh struktur antarmukanya.

4. **Deploy sebagai Web App**:
   - Klik tombol **Deploy (Terapkan)** di kanan atas > **New deployment (Penerapan baru)**.
   - Pilih jenis roda gigi (Select type) > **Web app (Aplikasi web)**.
   - Isi deskripsi (opsional).
   - *Execute as*: **Me (Saya)**.
   - *Who has access*: **Anyone (Siapa saja)** atau batasi sesuai organisasi Anda.
   - Klik **Deploy** dan berikan otorisasi (*Review Permissions*) ke akun Google Anda.

5. **Selesai!**
   - Anda akan mendapatkan **URL Web App**. Buka URL tersebut di browser untuk mulai menggunakan ELS Inventory System.
