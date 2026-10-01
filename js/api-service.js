/**
 * White Tiger Dashboard - Central API & Data Sync Service
 * Menghubungkan dashboard dengan backend server lokal / cloud via REST API,
 * dengan fallback otomatis ke LocalStorage jika berjalan offline.
 */

const ApiService = {
  isServerAvailable: false,
  pollTimer: null,
  cachedData: null,

  async init() {
    // Cek apakah server REST API aktif
    try {
      const res = await fetch('/api/data', { method: 'GET', cache: 'no-cache' });
      if (res.ok) {
        this.isServerAvailable = true;
        this.cachedData = await res.json();
        console.log('✅ Terhubung ke Server Database Pusat (Multi-User Aktif)');
        this.startAutoSync();
      } else {
        throw new Error('Server returned not OK');
      }
    } catch (e) {
      this.isServerAvailable = false;
      console.warn('⚠️ Server tidak terdeteksi, beralih ke LocalStorage fallback.');
      this.initLocalStorageFallback();
    }
    return this;
  },

  // ===== LOCAL STORAGE FALLBACK SEEDING =====
  initLocalStorageFallback() {
    if (!localStorage.getItem('wt_inventory_materials_v2')) {
      const defaultMaterials = [
        { id: 'mat-1', nama: 'Batu Mentah', unit: 'paket (100 pcs)', qty: 180, hargaPerUnit: 75.0, totalNilai: 13500.0, keterangan: 'Bahan tambang utama' },
        { id: 'mat-2', nama: 'Emas Murni', unit: 'pcs', qty: 350, hargaPerUnit: 1.3, totalNilai: 455.0, keterangan: 'Hasil olahan tambang' },
        { id: 'mat-3', nama: 'Tembaga', unit: 'pcs', qty: 420, hargaPerUnit: 1.5, totalNilai: 630.0, keterangan: 'Logam konduktor' },
        { id: 'mat-4', nama: 'Besi Batangan', unit: 'pcs', qty: 290, hargaPerUnit: 1.0, totalNilai: 290.0, keterangan: 'Material konstruksi & senjata' },
        { id: 'mat-5', nama: 'Bluni Kantor', unit: 'pcs', qty: 500, hargaPerUnit: 1.5, totalNilai: 750.0, keterangan: 'Mata uang ROC khusus kantor' },
        { id: 'mat-6', nama: 'Bubuk Mesiu', unit: 'kg', qty: 85, hargaPerUnit: 4.5, totalNilai: 382.5, keterangan: 'Bahan amunisi & peledak' }
      ];
      localStorage.setItem('wt_inventory_materials_v2', JSON.stringify(defaultMaterials));
    }

    if (!localStorage.getItem('wt_inventory_weapons_v2')) {
      const defaultWeapons = [
        { id: 'wpn-1', nama: 'Combat Pistol', kategori: 'Handgun', qty: 12, hargaPerUnit: 1500.0, totalNilai: 18000.0, kondisi: 'Baik (100%)' },
        { id: 'wpn-2', nama: 'AP Pistol', kategori: 'Handgun', qty: 8, hargaPerUnit: 2200.0, totalNilai: 17600.0, kondisi: 'Baik (100%)' },
        { id: 'wpn-3', nama: 'SMG Gusenberg', kategori: 'Submachine Gun', qty: 6, hargaPerUnit: 4500.0, totalNilai: 27000.0, kondisi: 'Sangat Baik' },
        { id: 'wpn-4', nama: 'Heavy Rifle', kategori: 'Assault Rifle', qty: 5, hargaPerUnit: 8500.0, totalNilai: 42500.0, kondisi: 'Baru' },
        { id: 'wpn-5', nama: 'Pump Shotgun MK II', kategori: 'Shotgun', qty: 4, hargaPerUnit: 3200.0, totalNilai: 12800.0, kondisi: 'Baik (95%)' }
      ];
      localStorage.setItem('wt_inventory_weapons_v2', JSON.stringify(defaultWeapons));
    }

    if (!localStorage.getItem('wt_inventory_logs_v2')) {
      const defaultLogs = [
        { id: 'log-inv-1', waktu: '01/10/2026 10:15', jenis: 'SENJATA', nama: 'Heavy Rifle', aksi: 'DEPOSIT', jumlah: 2, unit: 'unit', petugas: 'Rafli (Presiden)' },
        { id: 'log-inv-2', waktu: '01/10/2026 09:30', jenis: 'BAHAN', nama: 'Batu Mentah', aksi: 'DEPOSIT', jumlah: 50, unit: 'paket (100 pcs)', petugas: 'Jack' },
        { id: 'log-inv-3', waktu: '30/09/2026 16:45', jenis: 'SENJATA', nama: 'Combat Pistol', aksi: 'WITHDRAW', jumlah: 1, unit: 'unit', petugas: 'Croz' },
        { id: 'log-inv-4', waktu: '30/09/2026 14:20', jenis: 'BAHAN', nama: 'Emas Murni', aksi: 'DEPOSIT', jumlah: 100, unit: 'pcs', petugas: 'Zenn' }
      ];
      localStorage.setItem('wt_inventory_logs_v2', JSON.stringify(defaultLogs));
    }
  },

  // ===== AUTO-SYNC POLLING (Setiap 3 detik jika online) =====
  startAutoSync() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      if (!this.isServerAvailable) return;
      try {
        const res = await fetch('/api/data', { cache: 'no-cache' });
        if (res.ok) {
          const freshData = await res.json();
          // Cek apakah data berubah
          if (JSON.stringify(freshData) !== JSON.stringify(this.cachedData)) {
            this.cachedData = freshData;
            window.dispatchEvent(new CustomEvent('wt:data-synced', { detail: freshData }));
            window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
            window.dispatchEvent(new CustomEvent('wt:setoran-changed'));
            window.dispatchEvent(new CustomEvent('wt:brangkas-changed'));
            window.dispatchEvent(new CustomEvent('wt:members-changed'));
          }
        }
      } catch (e) {
        // network hiccup
      }
    }, 3000);
  },

  // ===== GETTERS =====
  async getMaterials() {
    if (this.isServerAvailable) {
      if (!this.cachedData) await this.refreshData();
      return this.cachedData?.materials || [];
    }
    try {
      const data = localStorage.getItem('wt_inventory_materials_v2');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async getWeapons() {
    if (this.isServerAvailable) {
      if (!this.cachedData) await this.refreshData();
      return this.cachedData?.weapons || [];
    }
    try {
      const data = localStorage.getItem('wt_inventory_weapons_v2');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async getInventoryLogs() {
    if (this.isServerAvailable) {
      if (!this.cachedData) await this.refreshData();
      return this.cachedData?.inventoryLogs || [];
    }
    try {
      const data = localStorage.getItem('wt_inventory_logs_v2');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  async refreshData() {
    if (!this.isServerAvailable) return null;
    try {
      const res = await fetch('/api/data', { cache: 'no-cache' });
      if (res.ok) {
        this.cachedData = await res.json();
        return this.cachedData;
      }
    } catch (e) {}
    return null;
  },

  // ===== MUTATIONS =====
  async depositItem(jenis, itemData, petugas = 'Admin') {
    const waktu = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const logItem = {
      id: 'log-inv-' + Date.now(),
      waktu,
      jenis,
      nama: itemData.nama,
      aksi: 'DEPOSIT',
      jumlah: parseFloat(itemData.qty) || 0,
      unit: itemData.unit || (jenis === 'SENJATA' ? 'unit' : 'pcs'),
      petugas
    };

    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/inventory/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jenis, item: itemData, log: logItem })
        });
        if (res.ok) {
          this.cachedData = await res.json();
          window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
          return true;
        }
      } catch (e) {
        console.error('API deposit error:', e);
      }
    }

    // Local fallback
    if (jenis === 'BAHAN') {
      const list = await this.getMaterials();
      const idx = list.findIndex(m => m.nama.toLowerCase() === itemData.nama.toLowerCase());
      const qty = parseFloat(itemData.qty) || 0;
      const harga = parseFloat(itemData.hargaPerUnit) || 0;

      if (idx >= 0) {
        list[idx].qty += qty;
        list[idx].totalNilai = list[idx].qty * (list[idx].hargaPerUnit || harga);
      } else {
        list.push({
          id: 'mat-' + Date.now(),
          nama: itemData.nama,
          unit: itemData.unit || 'pcs',
          qty,
          hargaPerUnit: harga,
          totalNilai: qty * harga,
          keterangan: itemData.keterangan || '-'
        });
      }
      localStorage.setItem('wt_inventory_materials_v2', JSON.stringify(list));
    } else {
      const list = await this.getWeapons();
      const idx = list.findIndex(w => w.nama.toLowerCase() === itemData.nama.toLowerCase());
      const qty = parseFloat(itemData.qty) || 0;
      const harga = parseFloat(itemData.hargaPerUnit) || 0;

      if (idx >= 0) {
        list[idx].qty += qty;
        list[idx].totalNilai = list[idx].qty * (list[idx].hargaPerUnit || harga);
      } else {
        list.push({
          id: 'wpn-' + Date.now(),
          nama: itemData.nama,
          kategori: itemData.kategori || 'Handgun',
          qty,
          hargaPerUnit: harga,
          totalNilai: qty * harga,
          kondisi: itemData.kondisi || 'Baik'
        });
      }
      localStorage.setItem('wt_inventory_weapons_v2', JSON.stringify(list));
    }

    // Add log
    const logs = await this.getInventoryLogs();
    logs.unshift(logItem);
    if (logs.length > 100) logs.pop();
    localStorage.setItem('wt_inventory_logs_v2', JSON.stringify(logs));

    window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
    return true;
  },

  async withdrawItem(jenis, id, jumlah, petugas = 'Admin') {
    const qtyWithdraw = parseFloat(jumlah) || 0;
    if (qtyWithdraw <= 0) throw new Error('Jumlah pengambilan harus lebih dari 0.');

    let namaBarang = '';
    let unitBarang = 'pcs';

    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/inventory/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jenis, id, jumlah: qtyWithdraw, petugas })
        });
        if (res.ok) {
          this.cachedData = await res.json();
          window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
          return true;
        } else {
          const err = await res.json();
          throw new Error(err.message || 'Gagal melakukan withdraw di server.');
        }
      } catch (e) {
        if (this.isServerAvailable) throw e;
      }
    }

    // Local fallback
    if (jenis === 'BAHAN') {
      const list = await this.getMaterials();
      const item = list.find(m => m.id === id);
      if (!item) throw new Error('Bahan tidak ditemukan.');
      if (item.qty < qtyWithdraw) throw new Error(`Stok tidak mencukupi! Tersisa ${item.qty} ${item.unit}.`);

      item.qty -= qtyWithdraw;
      item.totalNilai = item.qty * item.hargaPerUnit;
      namaBarang = item.nama;
      unitBarang = item.unit;
      localStorage.setItem('wt_inventory_materials_v2', JSON.stringify(list));
    } else {
      const list = await this.getWeapons();
      const item = list.find(w => w.id === id);
      if (!item) throw new Error('Senjata tidak ditemukan.');
      if (item.qty < qtyWithdraw) throw new Error(`Stok tidak mencukupi! Tersisa ${item.qty} unit.`);

      item.qty -= qtyWithdraw;
      item.totalNilai = item.qty * item.hargaPerUnit;
      namaBarang = item.nama;
      unitBarang = 'unit';
      localStorage.setItem('wt_inventory_weapons_v2', JSON.stringify(list));
    }

    const waktu = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const logItem = {
      id: 'log-inv-' + Date.now(),
      waktu,
      jenis,
      nama: namaBarang,
      aksi: 'WITHDRAW',
      jumlah: qtyWithdraw,
      unit: unitBarang,
      petugas
    };

    const logs = await this.getInventoryLogs();
    logs.unshift(logItem);
    if (logs.length > 100) logs.pop();
    localStorage.setItem('wt_inventory_logs_v2', JSON.stringify(logs));

    window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
    return true;
  },

  async deleteItem(jenis, id) {
    if (this.isServerAvailable) {
      try {
        const res = await fetch('/api/inventory/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jenis, id })
        });
        if (res.ok) {
          this.cachedData = await res.json();
          window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
          return true;
        }
      } catch (e) {}
    }

    if (jenis === 'BAHAN') {
      const list = (await this.getMaterials()).filter(m => m.id !== id);
      localStorage.setItem('wt_inventory_materials_v2', JSON.stringify(list));
    } else {
      const list = (await this.getWeapons()).filter(w => w.id !== id);
      localStorage.setItem('wt_inventory_weapons_v2', JSON.stringify(list));
    }

    window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
    return true;
  }
};
