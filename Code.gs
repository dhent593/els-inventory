const SPREADSHEET_ID = '10LOgWOmahCcfV6zeRu94-zxCR7ROUDCiHyX3H8EuvzA';

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('ELS Inventory System')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function getSheetByName(sheetName) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
}

// Fungsi untuk memverifikasi Login
function prosesLoginServer(username, password) {
  try {
    var sheet = getSheetByName("users");
    var data = sheet.getDataRange().getValues();
    
    // Looping data user (lewati baris pertama/header)
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][1] === password) {
        return {
          success: true, 
          role: data[i][2], 
          cabang: data[i][3],
          nama: data[i][0] // Menggunakan username sebagai nama sementara
        };
      }
    }
    return {success: false, message: "Username atau password salah!"};
  } catch (error) {
    return {success: false, message: "Error sistem: " + error.message};
  }
}

// ==========================================
// FUNGSI MANAJEMEN USER (CRUD)
// ==========================================

// Mendapatkan daftar semua user
function getUsersServer() {
  try {
    var sheet = getSheetByName("users");
    var data = sheet.getDataRange().getValues();
    var users = [];
    
    // Looping dari baris kedua (lewati header)
    for (var i = 1; i < data.length; i++) {
      users.push({
        username: data[i][0],
        password: data[i][1], // idealnya tidak dikirim plain text, tapi untuk kebutuhan edit diperlukan
        role: data[i][2],
        cabang: data[i][3]
      });
    }
    return {success: true, data: users};
  } catch (error) {
    return {success: false, message: "Gagal mengambil data user: " + error.message};
  }
}

// Menyimpan (Tambah baru atau Edit) user
function saveUserServer(userData, isNew, originalUsername) {
  try {
    var sheet = getSheetByName("users");
    var data = sheet.getDataRange().getValues();
    
    if (isNew) {
      // Cek apakah username sudah ada
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === userData.username) {
          return {success: false, message: "Username sudah digunakan!"};
        }
      }
      // Tambah baris baru
      sheet.appendRow([userData.username, userData.password, userData.role, userData.cabang]);
      return {success: true, message: "User berhasil ditambahkan!"};
    } else {
      // Proses Edit
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === originalUsername) {
          // Update baris ini (index + 1 karena getRange 1-indexed)
          sheet.getRange(i + 1, 1, 1, 4).setValues([[userData.username, userData.password, userData.role, userData.cabang]]);
          return {success: true, message: "User berhasil diperbarui!"};
        }
      }
      return {success: false, message: "User tidak ditemukan untuk diupdate!"};
    }
  } catch (error) {
    return {success: false, message: "Gagal menyimpan user: " + error.message};
  }
}

// Menghapus user
function deleteUserServer(username) {
  try {
    var sheet = getSheetByName("users");
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        sheet.deleteRow(i + 1);
        return {success: true, message: "User berhasil dihapus!"};
      }
    }
    return {success: false, message: "User tidak ditemukan!"};
  } catch (error) {
    return {success: false, message: "Gagal menghapus user: " + error.message};
  }
}

// ==========================================
// FUNGSI DASHBOARD STATISTIK
// ==========================================
function getDashboardStatsServer() {
  try {
    // Hitung Total Cabang (Unik)
    var userSheet = getSheetByName("users");
    var userData = userSheet.getDataRange().getValues();
    var uniqueCabang = [];
    
    // Looping dari baris kedua (lewati header)
    for (var i = 1; i < userData.length; i++) {
      var cabang = userData[i][3].toString().trim().toLowerCase();
      // Jangan hitung jika kosong atau belum ada di list uniqueCabang
      if (cabang && uniqueCabang.indexOf(cabang) === -1) {
        uniqueCabang.push(cabang);
      }
    }
    
    // Hitung jumlah barang SN MASUK hari ini dan rekap frekuensi Part
    var snSheet = getSheetByName("sn_masuk");
    var snData = snSheet.getDataRange().getValues();
    var snMasukHariIni = 0;
    
    // Untuk Top 15
    var partFreq = {}; // key: kode_barang, value: {nama, count}
    
    // Dapatkan tanggal hari ini (tanpa jam)
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var j = 1; j < snData.length; j++) {
      var rowDate = snData[j][0];
      var kodePart = snData[j][2];
      var namaPart = snData[j][3];
      
      // Rekap Frekuensi Part
      if (kodePart) {
        if (!partFreq[kodePart]) {
          partFreq[kodePart] = {nama: namaPart, count: 0};
        }
        partFreq[kodePart].count++;
      }
      
      if (rowDate instanceof Date) {
        var d = new Date(rowDate);
        d.setHours(0, 0, 0, 0);
        
        // Jika tanggalnya sama dengan hari ini
        if (d.getTime() === today.getTime()) {
          var snString = snData[j][4]; // Kolom Serial Number (indeks 4)
          if (snString) {
             var sns = snString.toString().split(/[\n,]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
             snMasukHariIni += sns.length;
          }
        }
      }
    }
    
    // Ambil Master Barang untuk mendapatkan stok saat ini
    var mbSheet = getSheetByName("master_barang");
    var mbData = mbSheet.getDataRange().getValues();
    var stockMap = {};
    for (var k = 1; k < mbData.length; k++) {
      var kBarang = mbData[k][0];
      var stok = parseInt(mbData[k][3]) || 0;
      if (kBarang) {
        stockMap[kBarang] = stok;
      }
    }
    
    // Gabungkan freq dan stok, lalu urutkan
    var topPartsArray = [];
    for (var key in partFreq) {
      topPartsArray.push({
        kode: key,
        nama: partFreq[key].nama,
        frekuensi: partFreq[key].count,
        stok: stockMap[key] || 0
      });
    }
    
    // Urutkan berdasarkan frekuensi (descending)
    topPartsArray.sort(function(a, b) {
      return b.frekuensi - a.frekuensi;
    });
    
    // Ambil hanya 15 teratas
    var top15 = topPartsArray.slice(0, 15);
    
    // Ambil data Request Cabang yang aktif (belum selesai)
    var reqSheet = getSheetByName("request_cabang");
    var reqData = reqSheet ? reqSheet.getDataRange().getValues() : [];
    var activeRequests = [];
    var processedReqIds = {};
    
    for (var r = 1; r < reqData.length; r++) {
      var reqId = reqData[r][0];
      var tglReq = reqData[r][1];
      var cabangReq = reqData[r][2];
      var statusReq = reqData[r][7] ? reqData[r][7].toString().trim().toLowerCase() : 'menunggu';
      
      // Ambil yang masih menunggu atau alokasi (belum selesai penuh atau ditolak penuh)
      if (statusReq !== 'selesai' && statusReq !== 'ditolak' && reqId) {
        if (!processedReqIds[reqId]) {
          var dateStr = tglReq instanceof Date ? Utilities.formatDate(tglReq, Session.getScriptTimeZone(), "dd/MM/yyyy") : tglReq.toString();
          activeRequests.push({
            id_request: reqId,
            tanggal: dateStr,
            cabang: cabangReq,
            status: reqData[r][7] || 'Menunggu'
          });
          processedReqIds[reqId] = true;
        }
      }
    }
    
    return {
      success: true,
      data: {
        totalCabang: uniqueCabang.length,
        snMasukHariIni: snMasukHariIni,
        topParts: top15,
        activeRequests: activeRequests
      }
    };
  } catch (error) {
    return {success: false, message: "Gagal mengambil statistik: " + error.message};
  }
}

// ==========================================
// FUNGSI BUAT SN MASUK
// ==========================================

// Mengambil list barang untuk dropdown
function getMasterBarangServer() {
  try {
    var sheet = getSheetByName("master_barang");
    var data = sheet.getDataRange().getValues();
    var listBarang = [];
    
    // Asumsi: Kolom A = Kode Barang, Kolom B = Nama Barang
    // Sesuaikan indeks jika berbeda. Disini kita pakai indeks 0 dan 1.
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== "" && data[i][1] !== "") {
        listBarang.push({
          kode: data[i][0].toString().trim(),
          nama: data[i][1].toString().trim(),
          serial_number: data[i][2].toString().trim(),
          stok: parseInt(data[i][3]) || 0,
          harga_modal: parseFloat(data[i][4]) || 0,
          harga_jual: parseFloat(data[i][5]) || 0
        });
      }
    }
    return {success: true, data: listBarang};
  } catch (error) {
    return {success: false, message: "Gagal memuat Master Barang: " + error.message};
  }
}

// Mengambil nomor urut terakhir berdasarkan prefix (misal: ADP-AC-260817)
function getLastSequenceServer(prefix) {
  try {
    var sheet = getSheetByName("sn_masuk");
    var data = sheet.getDataRange().getValues();
    var maxSeq = 0;
    
    // Asumsi: SN ada di kolom E (indeks 4)
    for (var i = 1; i < data.length; i++) {
      var snString = data[i][4];
      if (snString) {
        // Karena 1 cell bisa berisi banyak SN dipisah koma/newline
        var snArray = snString.toString().split(/[\n,]+/);
        for (var j = 0; j < snArray.length; j++) {
          var sn = snArray[j].trim();
          if (sn.indexOf(prefix) === 0) {
            // Ekstrak 3 digit terakhir
            var seqStr = sn.substring(prefix.length);
            if (!isNaN(seqStr)) {
              var seq = parseInt(seqStr, 10);
              if (seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        }
      }
    }
    return {success: true, lastSequence: maxSeq};
  } catch (error) {
    return {success: false, message: "Gagal mencari nomor urut: " + error.message, lastSequence: 0};
  }
}

// Menyimpan data SN Masuk ke sheet sn_masuk
function saveSNMasukServer(items) {
  try {
    var sheet = getSheetByName("sn_masuk");
    var mbSheet = getSheetByName("master_barang");
    var mbData = mbSheet.getDataRange().getValues();
    
    // items adalah array dari object yang akan ditambahkan ke baris baru
    // Kolom: tanggal, no_nota, kode_barang, nama_barang, serial_number, catatan, alokasi_part
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      
      // Simpan ke sn_masuk
      sheet.appendRow([
        item.tanggal,
        item.no_nota,
        item.kode_barang,
        item.nama_barang,
        item.serial_number,
        item.catatan,
        item.alokasi_part
      ]);
      
      // Update data di master_barang
      var snsToAdd = item.serial_number ? item.serial_number.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; }) : [];
      if (snsToAdd.length > 0) {
        for (var j = 1; j < mbData.length; j++) {
          if (mbData[j][0] == item.kode_barang) {
            var existingSNStr = mbData[j][2] ? mbData[j][2].toString() : "";
            var existingSNs = existingSNStr.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
            
            // Gabungkan SN lama dan SN baru
            var newSNs = existingSNs.concat(snsToAdd);
            var newSNStr = newSNs.join(",\n");
            var newStok = newSNs.length;
            
            // Kolom C (indeks 3) = Serial Number, Kolom D (indeks 4) = Stok
            mbSheet.getRange(j + 1, 3).setValue(newSNStr);
            mbSheet.getRange(j + 1, 4).setValue(newStok);
            
            // Update in-memory data untuk antisipasi duplicate kode_barang di items yang sama
            mbData[j][2] = newSNStr;
            mbData[j][3] = newStok;
            break;
          }
        }
      }
    }
    
    return {success: true, message: "Data SN berhasil disimpan dan stok Master Barang terupdate!"};
  } catch (error) {
    return {success: false, message: "Gagal menyimpan data SN: " + error.message};
  }
}

// Mendapatkan daftar cabang unik dari sheet users
function getCabangsServer() {
  try {
    var sheet = getSheetByName("users");
    var data = sheet.getDataRange().getValues();
    var cabangs = {};
    var uniqueCabangs = [];
    
    // Looping dari baris kedua (lewati header)
    for (var i = 1; i < data.length; i++) {
      var cabang = data[i][3];
      if (cabang && cabang !== "") {
        cabang = cabang.toString().trim().toUpperCase();
        if (!cabangs[cabang]) {
          cabangs[cabang] = true;
          uniqueCabangs.push(cabang);
        }
      }
    }
    return {success: true, data: uniqueCabangs};
  } catch (error) {
    return {success: false, message: "Error memuat cabang: " + error.message};
  }
}

// Mendapatkan data SN Masuk dari sheet
function getSNMasukServer() {
  try {
    var sheet = getSheetByName("sn_masuk");
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Jika baris kosong, lewati
      if (!row[0] && !row[1]) continue;
      
      var tgl = row[0];
      if (tgl instanceof Date) {
        var d = tgl.getDate();
        var m = tgl.toLocaleString('id-ID', { month: 'short' });
        var y = tgl.getFullYear();
        tgl = d + " " + m + " " + y;
      } else if (tgl) {
        // Fallback jika berupa text string (meski sebaiknya date object di sheets)
        tgl = tgl.toString().substring(0, 15); 
      }
      
      var snString = row[4] ? String(row[4]) : "";
      var snCount = snString ? snString.split(',').length : 0;
      
      result.push({
        tanggal: tgl,
        no_nota: row[1],
        kode_barang: row[2],
        nama_barang: row[3],
        serial_number: snString,
        catatan: row[5],
        alokasi_part: row[6],
        jml_sn: snCount
      });
    }
    
    return {success: true, data: result.reverse()}; // Data terbaru di atas
  } catch (error) {
    return {success: false, message: "Error memuat data SN Masuk: " + error.message};
  }
}

// Menghapus nota beserta seluruh baris datanya dari sn_masuk dan menarik kembali stok dari master_barang
function deleteNotaMasukServer(noNota) {
  try {
    var sheet = getSheetByName("sn_masuk");
    var data = sheet.getDataRange().getValues();
    
    // 1. Kumpulkan data SN yang akan ditarik dari master_barang
    var snsToRemoveMap = {};
    var deletedCount = 0;
    var rowsToDelete = [];
    
    // Looping dari bawah ke atas
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === noNota) { // Kolom ke-2 (index 1) adalah no_nota
        var kodeBarang = data[i][2]; // Kolom ke-3 (index 2) adalah kode_barang
        var snString = data[i][4]; // Kolom ke-5 (index 4) adalah serial_number
        
        if (kodeBarang && snString) {
          var snList = snString.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
          if (!snsToRemoveMap[kodeBarang]) {
            snsToRemoveMap[kodeBarang] = [];
          }
          snsToRemoveMap[kodeBarang] = snsToRemoveMap[kodeBarang].concat(snList);
        }
        
        rowsToDelete.push(i + 1); // Simpan nomor baris untuk dihapus nanti
        deletedCount++;
      }
    }
    
    if (deletedCount === 0) {
      return {success: false, message: `Nota ${noNota} tidak ditemukan.`};
    }
    
    // 2. Update master_barang dengan menarik/menghapus SN yang terkait
    var mbSheet = getSheetByName("master_barang");
    var mbData = mbSheet.getDataRange().getValues();
    
    for (var j = 1; j < mbData.length; j++) {
      var kBarang = mbData[j][0];
      if (snsToRemoveMap[kBarang] && snsToRemoveMap[kBarang].length > 0) {
        var removeList = snsToRemoveMap[kBarang];
        var existingSNStr = mbData[j][2] ? mbData[j][2].toString() : "";
        var existingSNs = existingSNStr.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
        
        // Buang SN yang ada di removeList
        var newSNs = existingSNs.filter(function(sn) {
          return removeList.indexOf(sn) === -1;
        });
        
        var newSNStr = newSNs.join(",\n");
        var newStok = newSNs.length;
        
        // Tulis ulang ke sheet master_barang (Kolom C = SN, Kolom D = Stok)
        mbSheet.getRange(j + 1, 3).setValue(newSNStr);
        mbSheet.getRange(j + 1, 4).setValue(newStok);
      }
    }
    
    // 3. Hapus baris dari sn_masuk (aman karena urutan array rowsToDelete dari indeks terbesar)
    for (var k = 0; k < rowsToDelete.length; k++) {
      sheet.deleteRow(rowsToDelete[k]);
    }
    
    return {success: true, message: `Berhasil menghapus nota ${noNota} dan menarik kembali SN dari Master Barang!`};
  } catch (error) {
    return {success: false, message: "Error menghapus nota: " + error.message};
  }
}

// Mengubah catatan pada data SN Masuk
function updateCatatanMasukServer(noNota, newCatatan) {
  try {
    var sheet = getSheetByName("sn_masuk");
    var data = sheet.getDataRange().getValues();
    
    var updatedCount = 0;
    // Mulai dari 1 untuk melewati header
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === noNota) { // Kolom ke-2 (index 1) adalah no_nota
        sheet.getRange(i + 1, 6).setValue(newCatatan); // Kolom F (Catatan) adalah kolom ke-6
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      return {success: true, message: "Catatan berhasil diperbarui"};
    } else {
      return {success: false, message: "Nota tidak ditemukan."};
    }
  } catch (error) {
    return {success: false, message: "Error memperbarui catatan: " + error.message};
  }
}

// ==========================================
// FUNGSI STOCK OPNAME
// ==========================================

function getOpnameDataServer() {
  try {
    var sheet = getSheetByName("opname");
    var data = sheet.getDataRange().getValues();
    var listOpname = [];
    
    // Kolom: A=0 (kode), B=1 (nama), C=2 (sn), D=3 (tanggal)
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== "") {
        listOpname.push({
          kode: data[i][0].toString().trim(),
          nama: data[i][1].toString().trim(),
          serial_number: data[i][2].toString().trim(),
          tanggal: data[i][3] instanceof Date ? Utilities.formatDate(data[i][3], Session.getScriptTimeZone(), "dd-MM-yyyy") : data[i][3].toString(),
          status: (data[i][4] && data[i][4] !== "") ? data[i][4].toString().trim() : "Belum Scan"
        });
      }
    }
    return {success: true, data: listOpname};
  } catch (error) {
    return {success: false, message: "Gagal memuat data Opname: " + error.message};
  }
}

// Mengganti seluruh data opname dengan data baru hasil import
function importOpnameDataServer(dataArray) {
  try {
    var sheet = getSheetByName("opname");
    var lastRow = sheet.getLastRow();
    
    // Hapus data lama (mulai dari baris ke-2 ke bawah)
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    
    if (!dataArray || dataArray.length === 0) {
      return {success: true, message: "Berhasil mengosongkan data opname (tidak ada data baru)."};
    }
    
    // Siapkan array 2D untuk ditulis ke sheet sekaligus (agar cepat)
    var rows = dataArray.map(function(item) {
      return [item.kode, item.nama, item.sn, item.tanggal];
    });
    
    // Tulis ke sheet: mulai dari baris ke-2, kolom ke-1, sebanyak row, selebar 4 kolom
    sheet.getRange(2, 1, rows.length, 4).setValues(rows);
    
    return {success: true, message: "Berhasil mengimport " + rows.length + " baris data stok opname!"};
  } catch (error) {
    return {success: false, message: "Gagal import data: " + error.message};
  }
}

// ==========================================
// FUNGSI IMPORT STOK SERI
// ==========================================

function importStokSeriServer(parsedData) {
  try {
    if (!parsedData || parsedData.length === 0) {
      return {success: false, message: "Data kosong."};
    }
    
    var mbSheet = getSheetByName("master_barang");
    var mbData = mbSheet.getDataRange().getValues();
    
    // Group parsedData by kodeBarang untuk efisiensi
    var importMap = {};
    for (var i = 0; i < parsedData.length; i++) {
      var kode = parsedData[i].kodeBarang;
      var sn = parsedData[i].sn;
      if (!importMap[kode]) {
        importMap[kode] = [];
      }
      importMap[kode].push(sn);
    }
    
    var updatedRows = 0;
    var totalSNsSynced = 0;
    
    // Loop master_barang untuk update
    for (var j = 1; j < mbData.length; j++) {
      var kBarang = mbData[j][0];
      
      if (kBarang) {
        var existingSNStr = mbData[j][2] ? mbData[j][2].toString() : "";
        var existingStok = existingSNStr ? existingSNStr.split(/[\n,]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; }).length : 0;
        
        var newSNsList = importMap[kBarang] || [];
        
        // Buang duplikat dari file Excel
        var uniqueNewSNs = [];
        for (var k = 0; k < newSNsList.length; k++) {
          var snBaru = newSNsList[k].toString().trim();
          if (snBaru !== "" && uniqueNewSNs.indexOf(snBaru) === -1) {
            uniqueNewSNs.push(snBaru);
          }
        }
        
        var newSNStr = uniqueNewSNs.join(",\n");
        var newStok = uniqueNewSNs.length;
        
        // Bandingkan apakah ada perubahan (ganti total isi sel)
        if (existingSNStr !== newSNStr || existingStok !== newStok) {
          mbSheet.getRange(j + 1, 3).setValue(newSNStr);
          mbSheet.getRange(j + 1, 4).setValue(newStok);
          
          updatedRows++;
          totalSNsSynced += newStok;
        }
      }
    }
    
    return {
      success: true, 
      message: `Berhasil tersinkronisasi. ${updatedRows} barang diupdate menjadi total ${totalSNsSynced} SN (SN yang tidak ada di file telah dihapus).`
    };
    
  } catch (error) {
    return {success: false, message: "Gagal memproses import stok: " + error.message};
  }
}

// ==========================================
// FUNGSI SIMPAN STATUS OPNAME
// ==========================================

function simpanOpnameServer(opnameData) {
  try {
    var sheet = getSheetByName("opname");
    var data = sheet.getDataRange().getValues();
    
    // Buat map SN -> Status untuk pencarian cepat
    var statusMap = {};
    for (var i = 0; i < opnameData.length; i++) {
      var sn = opnameData[i].serial_number.toString().trim().toLowerCase();
      statusMap[sn] = opnameData[i].status;
    }
    
    // Siapkan array 2D untuk update kolom status (kolom E / indeks 5 -> 1-based, array getRange(row, 5))
    var statusValues = [];
    
    // Mulai dari 1 untuk melewati header
    for (var j = 1; j < data.length; j++) {
      var snSheet = data[j][2].toString().trim().toLowerCase(); // Kolom C (index 2)
      if (statusMap[snSheet]) {
        statusValues.push([statusMap[snSheet]]);
      } else {
        statusValues.push([data[j][4] || ""]); // biarkan apa adanya jika tak ketemu
      }
    }
    
    if (statusValues.length > 0) {
      sheet.getRange(2, 5, statusValues.length, 1).setValues(statusValues);
    }
    
    return {success: true, message: "Status opname berhasil disimpan ke database!"};
  } catch (error) {
    return {success: false, message: "Gagal menyimpan status: " + error.message};
  }
}
// ==========================================
// FUNGSI CABANG / REQUEST PART
// ==========================================

function getDashboardCabangStatsServer(cabang) {
  try {
    var sheet = getSheetByName("request_cabang");
    var data = sheet.getDataRange().getValues();
    var stats = {
      totalBulanIni: 0,
      dalamProses: 0,
      selesai: 0
    };
    
    var today = new Date();
    var currentMonth = today.getMonth();
    var currentYear = today.getFullYear();
    
    // Looping dari baris kedua (lewati header)
    for (var i = 1; i < data.length; i++) {
      var rowCabang = data[i][2]; // Kolom C (indeks 2)
      
      // Jika filter cabang cocok atau PUSAT melihat semua
      if (!cabang || cabang === 'admin_pusat' || (rowCabang && rowCabang.toString().trim().toLowerCase() === cabang.trim().toLowerCase())) {
        var rowDate = data[i][1]; // Kolom B (indeks 1)
        var status = data[i][7] ? data[i][7].toString().trim().toLowerCase() : ""; // Kolom H (indeks 7)
        
        // Cek bulan ini
        if (rowDate instanceof Date) {
          if (rowDate.getMonth() === currentMonth && rowDate.getFullYear() === currentYear) {
            stats.totalBulanIni++;
          }
        } else if (rowDate) {
          // Asumsi selalu dihitung jika valid tapi format bukan object date
          stats.totalBulanIni++; 
        }
        
        if (status === "menunggu" || status.includes("alokasi") || status.includes("proses")) {
          stats.dalamProses++;
        } else if (status === "selesai") {
          stats.selesai++;
        }
      }
    }
    
    return {success: true, data: stats};
  } catch (error) {
    return {success: false, message: "Error stats cabang: " + error.message};
  }
}

function generateRequestIdServer(cabangName) {
  try {
    var date = new Date();
    var d = ("0" + date.getDate()).slice(-2);
    var m = ("0" + (date.getMonth() + 1)).slice(-2);
    var y = date.getFullYear().toString().substring(2,4);
    var dateStr = y + m + d;
    
    var singkatan = "CAB";
    if (cabangName) {
      singkatan = cabangName.replace(/[^A-Za-z]/g, '').toUpperCase();
      if(singkatan.length > 3) singkatan = singkatan.substring(0, 3);
    }
    
    var prefix = "REQ-" + singkatan + "-" + dateStr + "-";
    
    var sheet = getSheetByName("request_cabang");
    var data = sheet.getDataRange().getValues();
    var maxUrut = 0;
    
    for (var i = 1; i < data.length; i++) {
      var idStr = data[i][0]; // Kolom A
      if (idStr && idStr.toString().indexOf(prefix) === 0) {
        var seqStr = idStr.toString().substring(prefix.length);
        if (!isNaN(seqStr)) {
          var seq = parseInt(seqStr, 10);
          if (seq > maxUrut) {
            maxUrut = seq;
          }
        }
      }
    }
    
    var nextUrut = ("000" + (maxUrut + 1)).slice(-3);
    return {success: true, newId: prefix + nextUrut};
  } catch (error) {
    return {success: false, message: "Error generate ID: " + error.message, newId: "REQ-ERR-" + Date.now()};
  }
}

function saveRequestCabangServer(requestData) {
  try {
    var sheet = getSheetByName("request_cabang");
    
    for (var i = 0; i < requestData.length; i++) {
      var item = requestData[i];
      sheet.appendRow([
        item.id_request,
        item.tanggal,
        item.cabang,
        item.kode_barang,
        item.nama_barang,
        item.custom_request,
        item.jumlah_barang,
        item.status_request,
        item.catatan
      ]);
    }
    
    return {success: true, message: "Request berhasil dikirim!"};
  } catch (error) {
    return {success: false, message: "Gagal menyimpan request: " + error.message};
  }
}

function getRequestCabangServer(cabang) {
  try {
    var sheet = getSheetByName("request_cabang");
    var data = sheet.getDataRange().getValues();
    var results = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue;
      
      var rowCabang = row[2]; // Kolom C
      
      if (!cabang || cabang === 'admin_pusat' || (rowCabang && rowCabang.toString().trim().toLowerCase() === cabang.trim().toLowerCase())) {
        
        var tgl = row[1];
        if (tgl instanceof Date) {
          tgl = Utilities.formatDate(tgl, Session.getScriptTimeZone(), "dd MMM yyyy HH:mm");
        } else if (tgl) {
          tgl = tgl.toString();
        }
        
        results.push({
          rowId: i + 1, // Nomor baris di sheet request_cabang (untuk kemudahan update)
          id_request: row[0],
          tanggal: tgl,
          cabang: row[2],
          kode_barang: row[3],
          nama_barang: row[4],
          custom_request: row[5],
          jumlah_barang: row[6],
          status_request: row[7],
          catatan: row[8]
        });
      }
    }
    
    return {success: true, data: results.reverse()};
  } catch(error) {
    return {success: false, message: "Error load data request: " + error.message};
  }
}

// ==========================================
// FUNGSI RETUR
// ==========================================

function getReturDataServer() {
  try {
    var sheet = getSheetByName("retur");
    if (!sheet) {
        return {success: false, message: "Sheet 'retur' tidak ditemukan."};
    }
    var data = sheet.getDataRange().getValues();
    var listRetur = [];
    
    // Looping dari baris kedua (lewati header)
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] !== "") {
        listRetur.push({
          kode_barang: data[i][0].toString().trim(),
          nama_barang: data[i][1].toString().trim(),
          serial_number: data[i][2].toString().trim(),
          vendor: data[i][3].toString().trim(),
          bl: data[i][4].toString().trim(),
          tanggal_bl: data[i][5] instanceof Date ? Utilities.formatDate(data[i][5], Session.getScriptTimeZone(), "dd-MM-yyyy") : data[i][5].toString().trim(),
          harga_lama: data[i][6].toString().trim(),
          keterangan: data[i][7].toString().trim(),
          keterangan_tambahan: data[i][8] ? data[i][8].toString().trim() : "",
          status_diambil: data[i][9] ? data[i][9].toString().trim() : ""
        });
      }
    }
    return {success: true, data: listRetur.reverse()};
  } catch (error) {
    return {success: false, message: "Gagal memuat data Retur: " + error.message};
  }
}

function addReturPartServer(item) {
  try {
    var sheet = getSheetByName("retur");
    if (!sheet) {
        return {success: false, message: "Sheet 'retur' tidak ditemukan."};
    }
    
    // Asumsi kolom: A=kode_barang, B=nama_barang, C=serial_number, D=vendor, E=bl, F=tanggal_bl, G=harga_lama, H=keterangan, I=keterangan_tambahan
    sheet.appendRow([
      item.kode_barang || "",
      item.nama_barang || "",
      item.serial_number || "",
      item.vendor || "", // vendor
      item.bl || "", // bl
      item.tanggal_bl || "", // tanggal_bl
      item.harga_lama || "", // harga_lama
      "", // keterangan
      "", // keterangan_tambahan
      ""  // status_diambil
    ]);
    
    return {success: true, message: "Part berhasil ditambahkan ke daftar retur."};
  } catch (error) {
    return {success: false, message: "Gagal menyimpan data retur: " + error.message};
  }
}

function toggleReturStatusServer(sn, newStatus) {
  try {
    var sheet = getSheetByName("retur");
    if (!sheet) {
        return {success: false, message: "Sheet 'retur' tidak ditemukan."};
    }
    
    var data = sheet.getDataRange().getValues();
    var targetSN = sn.toString().trim().toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      var snCurrent = data[i][2] ? data[i][2].toString().trim().toLowerCase() : "";
      
      if (snCurrent === targetSN) {
        var rowIndex = i + 1;
        // Kolom J = kolom ke-10
        sheet.getRange(rowIndex, 10).setValue(newStatus);
        return {success: true, message: "Status retur berhasil diperbarui."};
      }
    }
    
    return {success: false, message: "Data retur dengan SN tersebut tidak ditemukan."};
  } catch (error) {
    return {success: false, message: "Gagal memperbarui status retur: " + error.message};
  }
}

function editReturServer(payload) {
  try {
    var sheet = getSheetByName("retur");
    if (!sheet) {
        return {success: false, message: "Sheet 'retur' tidak ditemukan."};
    }
    
    var data = sheet.getDataRange().getValues();
    var snToEdit = payload.serial_number.toString().trim().toLowerCase();
    
    // Looping dari baris kedua (lewati header)
    for (var i = 1; i < data.length; i++) {
      var snCurrent = data[i][2] ? data[i][2].toString().trim().toLowerCase() : "";
      
      if (snCurrent === snToEdit) {
        var rowIndex = i + 1; // getRange 1-indexed
        // Kolom di retur: 
        // 1=A(kode_barang), 2=B(nama_barang), 3=C(serial_number)
        // 4=D(vendor), 5=E(bl), 6=F(tanggal_bl), 7=G(harga_lama), 8=H(keterangan), 9=I(keterangan_tambahan)
        sheet.getRange(rowIndex, 4).setValue(payload.vendor);
        sheet.getRange(rowIndex, 5).setValue(payload.bl);
        sheet.getRange(rowIndex, 6).setValue(payload.tanggal_bl);
        sheet.getRange(rowIndex, 7).setValue(payload.harga_lama);
        sheet.getRange(rowIndex, 8).setValue(payload.keterangan);
        sheet.getRange(rowIndex, 9).setValue(payload.keterangan_tambahan);
        
        return {success: true, message: "Data retur berhasil diperbarui!"};
      }
    }
    
    return {success: false, message: "Data retur dengan SN tersebut tidak ditemukan."};
  } catch (error) {
    return {success: false, message: "Gagal memperbarui data retur: " + error.message};
  }
}

function deleteReturServer(sn) {
  try {
    var sheet = getSheetByName("retur");
    if (!sheet) {
        return {success: false, message: "Sheet 'retur' tidak ditemukan."};
    }
    
    var data = sheet.getDataRange().getValues();
    var snToDelete = sn.toString().trim().toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      var snCurrent = data[i][2] ? data[i][2].toString().trim().toLowerCase() : "";
      
      if (snCurrent === snToDelete) {
        sheet.deleteRow(i + 1);
        return {success: true, message: "Data retur berhasil dihapus!"};
      }
    }
    
    return {success: false, message: "Data retur dengan SN tersebut tidak ditemukan."};
  } catch (error) {
    return {success: false, message: "Gagal menghapus data retur: " + error.message};
  }
}

function archiveReturServer(sn) {
  try {
    var sheetRetur = getSheetByName("retur");
    var sheetArsip = getSheetByName("arsip_retur");
    
    if (!sheetRetur || !sheetArsip) {
        return {success: false, message: "Sheet 'retur' atau 'arsip_retur' tidak ditemukan."};
    }
    
    var data = sheetRetur.getDataRange().getValues();
    var targetSN = sn.toString().trim().toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      var snCurrent = data[i][2] ? data[i][2].toString().trim().toLowerCase() : "";
      
      if (snCurrent === targetSN) {
        // Pindahkan data ke arsip_retur
        sheetArsip.appendRow(data[i]);
        
        // Hapus dari retur
        sheetRetur.deleteRow(i + 1);
        return {success: true, message: "Part berhasil diarsipkan!"};
      }
    }
    
    return {success: false, message: "Data retur dengan SN tersebut tidak ditemukan."};
  } catch (error) {
    return {success: false, message: "Gagal mengarsipkan data retur: " + error.message};
  }
}

function archiveCompletedReturServer() {
  try {
    var sheetRetur = getSheetByName("retur");
    var sheetArsip = getSheetByName("arsip_retur");
    
    if (!sheetRetur || !sheetArsip) {
        return {success: false, message: "Sheet 'retur' atau 'arsip_retur' tidak ditemukan."};
    }
    
    var data = sheetRetur.getDataRange().getValues();
    var count = 0;
    
    // Looping dari bawah ke atas agar penghapusan baris tidak merusak indeks loop
    for (var i = data.length - 1; i >= 1; i--) {
      var status = data[i][9] ? data[i][9].toString().trim() : "";
      
      if (status === 'Y') {
        sheetArsip.appendRow(data[i]);
        sheetRetur.deleteRow(i + 1);
        count++;
      }
    }
    
    if (count > 0) {
      return {success: true, message: count + " part berhasil diarsipkan."};
    } else {
      return {success: false, message: "Tidak ada part dengan status 'Sudah Diambil' untuk diarsipkan."};
    }
    
  } catch (error) {
    return {success: false, message: "Gagal mengarsipkan data retur massal: " + error.message};
  }
}


function checkSNInMasterServer(sn) {
  try {
    if (!sn) return {success: false, found: false};
    sn = sn.toString().trim().toLowerCase();
    
    var foundData = null;
    
    // 1. Cek di master_sn terlebih dahulu (prioritas karena ada data update)
    var sheetSN = getSheetByName("master_sn");
    if (sheetSN) {
      var dataSN = sheetSN.getDataRange().getValues();
      for (var i = 1; i < dataSN.length; i++) {
        var snString = dataSN[i][0] ? dataSN[i][0].toString().trim().toLowerCase() : "";
        
        if (snString === sn) {
          foundData = {
            kode_barang: dataSN[i][1],
            nama_barang: dataSN[i][2],
            nomor_bl: dataSN[i][3],
            nama_pemasok: dataSN[i][4],
            tanggal_bl: dataSN[i][5] instanceof Date ? Utilities.formatDate(dataSN[i][5], Session.getScriptTimeZone(), "yyyy-MM-dd") : dataSN[i][5],
            harga_lama: dataSN[i][7]
          };
          break;
        }
      }
    }
    
    // 2. Jika tidak ditemukan di master_sn, cari di master_barang
    if (!foundData) {
      var sheetMB = getSheetByName("master_barang");
      if (sheetMB) {
        var dataMB = sheetMB.getDataRange().getValues();
        for (var j = 1; j < dataMB.length; j++) {
          var snMB = dataMB[j][2] ? dataMB[j][2].toString() : "";
          if (snMB) {
            var snArray = snMB.toLowerCase().split(/[\n,]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
            if (snArray.indexOf(sn) !== -1) {
              foundData = {
                kode_barang: dataMB[j][0],
                nama_barang: dataMB[j][1],
                nomor_bl: dataMB[j][6] || "",
                nama_pemasok: dataMB[j][7] || "",
                tanggal_bl: dataMB[j][8] instanceof Date ? Utilities.formatDate(dataMB[j][8], Session.getScriptTimeZone(), "yyyy-MM-dd") : (dataMB[j][8] || ""),
                harga_lama: dataMB[j][4] || "" // Kolom Harga Modal
              };
              break;
            }
          }
        }
      }
    }
    
    if (foundData) {
      return {
        success: true,
        found: true,
        data: foundData
      };
    } else {
      return {success: true, found: false};
    }
    
  } catch (error) {
    return {success: false, message: error.message};
  }
}

function updatePembelianDariExcelServer(payload) {
  try {
    if (!payload || payload.length === 0) {
      return {success: false, message: "Payload kosong."};
    }
    
    var sheet = getSheetByName("master_sn");
    if (!sheet) return {success: false, message: "Sheet 'master_sn' tidak ditemukan."};
    
    var dataRange = sheet.getDataRange();
    var data = dataRange.getValues();
    
    // Create dictionary for fast checking of existing SN in master_sn
    var existingSnRowMap = {};
    for (var r = 1; r < data.length; r++) {
      var snString = data[r][0] ? data[r][0].toString().trim().toLowerCase() : "";
      if (snString) {
        existingSnRowMap[snString] = r; // Store row index
      }
    }
    
    var updateCount = 0;
    var newRows = [];
    var modifiedExisting = false;
    
    for (var i = 0; i < payload.length; i++) {
      var item = payload[i];
      var sn = item.serial_number ? item.serial_number.toString().trim().toLowerCase() : "";
      
      if (!sn) continue;
      
      if (existingSnRowMap.hasOwnProperty(sn)) {
        // Update existing row
        var rowIndex = existingSnRowMap[sn];
        // Kolom D(3)=nomor_bl, E(4)=nama_pemasok, F(5)=tanggal_bl
        data[rowIndex][3] = item.nomor_bl || "";
        data[rowIndex][4] = item.nama_pemasok || "";
        data[rowIndex][5] = item.tanggal_bl || "";
        modifiedExisting = true;
        updateCount++;
      } else {
        // Append new row
        // A(0)=SN, B(1)=Kode, C(2)=Nama, D(3)=BL, E(4)=Vendor, F(5)=Tgl, G(6)=Status
        newRows.push([
          item.serial_number,
          item.kode_barang || "",
          item.nama_barang || "",
          item.nomor_bl || "",
          item.nama_pemasok || "",
          item.tanggal_bl || "",
          "Tersedia"
        ]);
        updateCount++;
      }
    }
    
    if (updateCount > 0) {
      // Write back modified existing data if any
      if (modifiedExisting && data.length > 0) {
        dataRange.setValues(data);
      }
      
      // Append new rows efficiently using getRange
      if (newRows.length > 0) {
        sheet.getRange(data.length + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
      }
      
      return {success: true, message: updateCount + " Serial Number berhasil diproses di database SN."};
    } else {
      return {success: false, message: "Tidak ada data yang valid untuk diproses."};
    }
    
  } catch (error) {
    return {success: false, message: "Error update database SN: " + error.message};
  }
}

function updateHargaDariExcelServer(payload) {
  try {
    if (!payload || payload.length === 0) {
      return {success: false, message: "Payload kosong."};
    }
    
    var sheetSN = getSheetByName("master_sn");
    var sheetBarang = getSheetByName("master_barang");
    if (!sheetSN) return {success: false, message: "Sheet 'master_sn' tidak ditemukan."};
    if (!sheetBarang) return {success: false, message: "Sheet 'master_barang' tidak ditemukan."};
    
    var dataRangeSN = sheetSN.getDataRange();
    var dataSN = dataRangeSN.getValues();
    
    var dataRangeBarang = sheetBarang.getDataRange();
    var dataBarang = dataRangeBarang.getValues();
    
    // Create dictionary for faster lookup: key = nomor_bl + "|" + kode_barang
    var payloadMap = {};
    var latestHargaBarang = {};
    for (var i = 0; i < payload.length; i++) {
      var item = payload[i];
      if (item.nomor_bl && item.kode_barang) {
        var key = item.nomor_bl.toString().trim().toLowerCase() + "|" + item.kode_barang.toString().trim().toLowerCase();
        payloadMap[key] = item.harga_lama;
        latestHargaBarang[item.kode_barang.toString().trim().toLowerCase()] = item.harga_lama;
      }
    }
    
    var updateCountSN = 0;
    
    // Looping data di master_sn
    // Kolom D(3) = nomor_bl, B(1) = kode_barang, H(7) = harga_lama
    for (var r = 1; r < dataSN.length; r++) {
      var noBL = dataSN[r][3] ? dataSN[r][3].toString().trim().toLowerCase() : "";
      var kodeBarang = dataSN[r][1] ? dataSN[r][1].toString().trim().toLowerCase() : "";
      
      if (noBL && kodeBarang) {
        var key = noBL + "|" + kodeBarang;
        if (payloadMap.hasOwnProperty(key)) {
          dataSN[r][7] = payloadMap[key]; // Update kolom H (harga_lama)
          updateCountSN++;
        }
      }
    }
    
    var updateCountBarang = 0;
    // Update master_barang
    for (var b = 1; b < dataBarang.length; b++) {
      var kBarang = dataBarang[b][0] ? dataBarang[b][0].toString().trim().toLowerCase() : "";
      if (kBarang && latestHargaBarang.hasOwnProperty(kBarang)) {
        dataBarang[b][4] = latestHargaBarang[kBarang]; // Update kolom E (Harga Modal)
        updateCountBarang++;
      }
    }
    
    if (updateCountSN > 0 || updateCountBarang > 0) {
      if (updateCountSN > 0) dataRangeSN.setValues(dataSN);
      if (updateCountBarang > 0) dataRangeBarang.setValues(dataBarang);
      return {success: true, message: updateCountSN + " baris histori SN dan " + updateCountBarang + " baris master barang berhasil diupdate harganya."};
    } else {
      return {success: false, message: "Tidak ada data (Kombinasi BL dan Kode Barang) yang cocok di master_sn maupun master_barang."};
    }
    
  } catch (error) {
    return {success: false, message: "Error update harga: " + error.message};
  }
}

function updateHargaJualDariExcelServer(payload) {
  try {
    if (!payload || payload.length === 0) {
      return {success: false, message: "Payload kosong."};
    }
    
    var sheetBarang = getSheetByName("master_barang");
    if (!sheetBarang) return {success: false, message: "Sheet 'master_barang' tidak ditemukan."};
    
    var dataRangeBarang = sheetBarang.getDataRange();
    var dataBarang = dataRangeBarang.getValues();
    
    var payloadMap = {};
    for (var i = 0; i < payload.length; i++) {
      var item = payload[i];
      if (item.kode_barang) {
        payloadMap[item.kode_barang.toString().trim().toLowerCase()] = item.harga_jual;
      }
    }
    
    var updateCountBarang = 0;
    
    // Update master_barang
    // Kolom F (indeks 5) adalah Harga Jual
    for (var b = 1; b < dataBarang.length; b++) {
      var kBarang = dataBarang[b][0] ? dataBarang[b][0].toString().trim().toLowerCase() : "";
      if (kBarang && payloadMap.hasOwnProperty(kBarang)) {
        dataBarang[b][5] = payloadMap[kBarang]; // Update kolom F (Harga Jual)
        updateCountBarang++;
      }
    }
    
    if (updateCountBarang > 0) {
      dataRangeBarang.setValues(dataBarang);
      return {success: true, message: updateCountBarang + " baris master barang berhasil diupdate harga jualnya."};
    } else {
      return {success: false, message: "Tidak ada data (Kode Barang) yang cocok di master_barang."};
    }
    
  } catch (error) {
    return {success: false, message: "Error update harga jual: " + error.message};
  }
}

function updateReturKeteranganServer(sn, field, value) {
  try {
    var sheet = getSheetByName("retur");
    if (!sheet) return {success: false, message: "Sheet 'retur' tidak ditemukan."};
    
    var dataRange = sheet.getDataRange();
    var data = dataRange.getValues();
    
    for (var i = 1; i < data.length; i++) {
      var currentSn = data[i][2] ? data[i][2].toString().trim() : "";
      if (currentSn === sn) {
        if (field === 'keterangan') {
          data[i][7] = value;
        } else if (field === 'keterangan_tambahan') {
          data[i][8] = value;
        }
        
        // Update hanya satu baris untuk efisiensi
        sheet.getRange(i + 1, 1, 1, data[i].length).setValues([data[i]]);
        return {success: true, message: "Berhasil update keterangan"};
      }
    }
    
    return {success: false, message: "SN tidak ditemukan di daftar retur"};
  } catch(error) {
    return {success: false, message: error.message};
  }
}

function prosesAlokasiServer(payloadArray) {
  try {
    var reqSheet = getSheetByName("request_cabang");
    var mbSheet = getSheetByName("master_barang");
    
    if (!reqSheet || !mbSheet) return {success: false, message: "Sheet tidak ditemukan."};
    
    var mbData = mbSheet.getDataRange().getValues();
    var updateMBCount = 0;
    
    // 1. Potong Stok & SN di master_barang
    for (var p = 0; p < payloadArray.length; p++) {
      var pData = payloadArray[p];
      if (pData.qty_alokasi > 0 && pData.kode_barang && pData.kode_barang !== '-') {
        // Cari di master_barang
        for (var j = 1; j < mbData.length; j++) {
          if (mbData[j][0] && mbData[j][0].toString().trim().toLowerCase() === pData.kode_barang.toString().trim().toLowerCase()) {
            
            // Kolom C (2) = SN, Kolom D (3) = Stok
            var existingSNStr = mbData[j][2] ? mbData[j][2].toString() : "";
            var existingSNs = existingSNStr.split(/[\n,]+/).map(function(s){return s.trim()}).filter(function(s){return s!==""});
            var currentStok = existingSNs.length > 0 ? existingSNs.length : (parseInt(mbData[j][3]) || 0);
            
            var snToDeduct = pData.sn_alokasi ? pData.sn_alokasi.split(/[\n,]+/).map(function(s){return s.trim()}).filter(function(s){return s!==""}) : [];
            
            // Kurangi SN jika ada input SN
            if (snToDeduct.length > 0) {
              for (var s = 0; s < snToDeduct.length; s++) {
                var idx = existingSNs.indexOf(snToDeduct[s]);
                if (idx !== -1) {
                  existingSNs.splice(idx, 1);
                }
              }
              mbData[j][2] = existingSNs.join(",\n");
              mbData[j][3] = existingSNs.length;
            } else {
              // Jika tidak ada SN, kurangi angkanya saja
              mbData[j][3] = Math.max(0, currentStok - pData.qty_alokasi);
            }
            
            updateMBCount++;
            break; // Lanjut ke payload berikutnya
          }
        }
      }
    }
    
    // Terapkan perubahan ke master_barang jika ada update
    if (updateMBCount > 0) {
       mbSheet.getDataRange().setValues(mbData);
    }
    
    // 2. Update Status & Catatan di request_cabang
    for (var r = 0; r < payloadArray.length; r++) {
      var item = payloadArray[r];
      // Kolom 8 (H) adalah status_request
      reqSheet.getRange(item.rowId, 8).setValue(item.status_baru);
      
      // Update catatan (Kolom 9 / I) dengan info alokasi
      if (item.qty_alokasi > 0) {
        var currentCatatan = reqSheet.getRange(item.rowId, 9).getValue() || "";
        var tambahan = "[Alokasi: " + item.qty_alokasi + "pcs]";
        if (item.sn_alokasi) tambahan += " SN: " + item.sn_alokasi.replace(/\n/g, ", ");
        
        reqSheet.getRange(item.rowId, 9).setValue(currentCatatan ? (currentCatatan + " | " + tambahan) : tambahan);
      } else if (item.status_baru === 'Ditolak') {
        var cCatatan = reqSheet.getRange(item.rowId, 9).getValue() || "";
        reqSheet.getRange(item.rowId, 9).setValue(cCatatan ? (cCatatan + " | [DITOLAK PUSAT]") : "[DITOLAK PUSAT]");
      }
    }
    
    // 3. Simpan pergerakan SN ke sheet riwayat_sn
    var riwayatSheet = getSheetByName("riwayat_sn");
    if (riwayatSheet) {
      var tglSekarang = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy HH:mm");
      for (var r = 0; r < payloadArray.length; r++) {
        var item = payloadArray[r];
        if (item.qty_alokasi > 0 && item.sn_alokasi) {
          // Ambil nama cabang dari kolom C (3) dan nama barang dari kolom E (5)
          var cabangTujuan = reqSheet.getRange(item.rowId, 3).getValue();
          var namaBarang = reqSheet.getRange(item.rowId, 5).getValue() || item.kode_barang;
          
          var snArray = item.sn_alokasi.split(/[\n,]+/).map(function(s){return s.trim()}).filter(function(s){return s!==""});
          for (var s = 0; s < snArray.length; s++) {
             riwayatSheet.appendRow([
               snArray[s],
               cabangTujuan,
               namaBarang,
               tglSekarang,
               "Alokasi dari: " + item.id_request
             ]);
          }
        }
      }
    }
    
    return {success: true, message: "Alokasi berhasil disimpan dan stok telah dipotong."};
  } catch (error) {
    return {success: false, message: "Error proses alokasi: " + error.message};
  }
}

function getRiwayatSNServer() {
  try {
    var sheet = getSheetByName("riwayat_sn");
    if (!sheet) return {success: false, message: "Sheet 'riwayat_sn' tidak ditemukan."};
    
    var data = sheet.getDataRange().getValues();
    var results = [];
    
    // Asumsi baris 1 adalah header: serial_number, cabang_tujuan, nama_barang, tanggal_alokasi, keterangan
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] || data[i][2]) { // Cek jika SN atau Barang ada isinya
        results.push({
          sn: data[i][0].toString(),
          cabang: data[i][1].toString(),
          barang: data[i][2].toString(),
          tanggal: data[i][3].toString(),
          keterangan: data[i][4].toString()
        });
      }
    }
    
    // Balik urutan agar data terbaru (paling bawah di sheet) muncul di paling atas (index 0)
    results.reverse();
    
    return {success: true, data: results};
  } catch (error) {
    return {success: false, message: "Gagal mengambil data riwayat: " + error.message};
  }
}

function deleteRequestCabangServer(id) {
  try {
    var sheet = getSheetByName("request_cabang");
    if (!sheet) return {success: false, message: "Sheet 'request_cabang' tidak ditemukan."};
    
    var data = sheet.getDataRange().getValues();
    var rowsToDelete = [];
    
    // Cari semua baris dengan ID request tersebut
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Hapus dari bawah ke atas agar index baris tidak bergeser
    for (var j = rowsToDelete.length - 1; j >= 0; j--) {
      sheet.deleteRow(rowsToDelete[j]);
    }
    
    if (rowsToDelete.length > 0) {
      return {success: true, message: "Request berhasil dihapus."};
    } else {
      return {success: false, message: "Request ID tidak ditemukan."};
    }
  } catch(error) {
    return {success: false, message: "Gagal menghapus request: " + error.message};
  }
}
