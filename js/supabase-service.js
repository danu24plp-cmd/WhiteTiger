/**
 * White Tiger Dashboard - SQL Database Service (Supabase PostgreSQL)
 * Mengelola komunikasi langsung dengan Database SQL di Cloud dan Realtime Multi-User Sync.
 */

const SqlService = {
  client: null,
  isConfigured: false,

  async init() {
    // Cek apakah konfigurasi Supabase SQL sudah diisi
    if (typeof SUPABASE_CONFIG !== 'undefined' && 
        SUPABASE_CONFIG.url && 
        SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_PROJECT_URL' &&
        SUPABASE_CONFIG.anonKey &&
        SUPABASE_CONFIG.anonKey !== 'YOUR_SUPABASE_ANON_KEY') {
      
      try {
        if (window.supabase) {
          this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
          this.isConfigured = true;
          console.log('✅ Terhubung ke Database SQL (PostgreSQL Supabase) - Multi-User Realtime Aktif!');
          this.listenRealtimeChanges();
          return this;
        }
      } catch (e) {
        console.error('Gagal menghubungkan ke Supabase SQL:', e);
      }
    }

    console.warn('ℹ️ Database SQL Supabase belum dikonfigurasi di supabase-config.js. Menggunakan penyimpanan data lokal sementara.');
    return this;
  },

  // ===== REALTIME BROADCAST DARI POSTGRESQL =====
  listenRealtimeChanges() {
    if (!this.client) return;

    this.client
      .channel('public-db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weapons' }, () => {
        window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_logs' }, () => {
        window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setoran' }, () => {
        window.dispatchEvent(new CustomEvent('wt:setoran-changed'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brangkas' }, () => {
        window.dispatchEvent(new CustomEvent('wt:brangkas-changed'));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        window.dispatchEvent(new CustomEvent('wt:members-changed'));
      })
      .subscribe();
  },

  // ===== BERANGKAS BAHAN (MATERIALS) =====
  async getMaterials() {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('materials')
        .select('*')
        .order('nama', { ascending: true });
      if (!error && data) {
        return data.map(d => ({
          id: d.id,
          nama: d.nama,
          unit: d.unit,
          qty: parseFloat(d.qty) || 0,
          hargaPerUnit: parseFloat(d.harga_per_unit) || 0,
          totalNilai: parseFloat(d.total_nilai) || 0,
          keterangan: d.keterangan
        }));
      }
    }
    return ApiService.getMaterials();
  },

  async depositMaterial(itemData, petugas = 'Admin') {
    if (this.isConfigured && this.client) {
      const { data: existing } = await this.client
        .from('materials')
        .select('*')
        .ilike('nama', itemData.nama.trim())
        .maybeSingle();

      const qty = parseFloat(itemData.qty) || 0;
      const harga = parseFloat(itemData.hargaPerUnit) || 0;
      let finalQty = qty;
      let matId = 'mat-' + Date.now();

      if (existing) {
        matId = existing.id;
        finalQty = (parseFloat(existing.qty) || 0) + qty;
        await this.client
          .from('materials')
          .update({
            qty: finalQty,
            harga_per_unit: harga || existing.harga_per_unit,
            total_nilai: finalQty * (harga || existing.harga_per_unit),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await this.client
          .from('materials')
          .insert({
            id: matId,
            nama: itemData.nama.trim(),
            unit: itemData.unit || 'pcs',
            qty: finalQty,
            harga_per_unit: harga,
            total_nilai: finalQty * harga,
            keterangan: itemData.keterangan || 'Material Tambang'
          });
      }

      // Catat log di SQL
      await this.addInventoryLog({
        jenis: 'BAHAN',
        nama: itemData.nama.trim(),
        aksi: 'DEPOSIT',
        jumlah: qty,
        unit: itemData.unit || 'pcs',
        petugas
      });

      window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      return true;
    }

    return ApiService.depositItem('BAHAN', itemData, petugas);
  },

  async withdrawMaterial(id, jumlah, petugas = 'Admin') {
    if (this.isConfigured && this.client) {
      const { data: item } = await this.client
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (!item) throw new Error('Bahan tidak ditemukan.');
      const currentQty = parseFloat(item.qty) || 0;
      const qtyWithdraw = parseFloat(jumlah) || 0;

      if (currentQty < qtyWithdraw) {
        throw new Error(`Stok tidak mencukupi! Tersisa ${currentQty} ${item.unit}.`);
      }

      const newQty = currentQty - qtyWithdraw;
      await this.client
        .from('materials')
        .update({
          qty: newQty,
          total_nilai: newQty * (parseFloat(item.harga_per_unit) || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      await this.addInventoryLog({
        jenis: 'BAHAN',
        nama: item.nama,
        aksi: 'WITHDRAW',
        jumlah: qtyWithdraw,
        unit: item.unit,
        petugas
      });

      window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      return true;
    }

    return ApiService.withdrawItem('BAHAN', id, jumlah, petugas);
  },

  async deleteMaterial(id) {
    if (this.isConfigured && this.client) {
      await this.client.from('materials').delete().eq('id', id);
      window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      return true;
    }
    return ApiService.deleteItem('BAHAN', id);
  },

  // ===== BERANGKAS SENJATA (WEAPONS) =====
  async getWeapons() {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('weapons')
        .select('*')
        .order('nama', { ascending: true });
      if (!error && data) {
        return data.map(d => ({
          id: d.id,
          nama: d.nama,
          kategori: d.kategori,
          qty: parseInt(d.qty) || 0,
          hargaPerUnit: parseFloat(d.harga_per_unit) || 0,
          totalNilai: parseFloat(d.total_nilai) || 0,
          kondisi: d.kondisi
        }));
      }
    }
    return ApiService.getWeapons();
  },

  async depositWeapon(itemData, petugas = 'Admin') {
    if (this.isConfigured && this.client) {
      const { data: existing } = await this.client
        .from('weapons')
        .select('*')
        .ilike('nama', itemData.nama.trim())
        .maybeSingle();

      const qty = parseInt(itemData.qty) || 0;
      const harga = parseFloat(itemData.hargaPerUnit) || 0;
      let finalQty = qty;
      let wpnId = 'wpn-' + Date.now();

      if (existing) {
        wpnId = existing.id;
        finalQty = (parseInt(existing.qty) || 0) + qty;
        await this.client
          .from('weapons')
          .update({
            qty: finalQty,
            harga_per_unit: harga || existing.harga_per_unit,
            total_nilai: finalQty * (harga || existing.harga_per_unit),
            kondisi: itemData.kondisi || existing.kondisi,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await this.client
          .from('weapons')
          .insert({
            id: wpnId,
            nama: itemData.nama.trim(),
            kategori: itemData.kategori || 'Handgun',
            qty: finalQty,
            harga_per_unit: harga,
            total_nilai: finalQty * harga,
            kondisi: itemData.kondisi || 'Baik (100%)'
          });
      }

      await this.addInventoryLog({
        jenis: 'SENJATA',
        nama: itemData.nama.trim(),
        aksi: 'DEPOSIT',
        jumlah: qty,
        unit: 'unit',
        petugas
      });

      window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      return true;
    }

    return ApiService.depositItem('SENJATA', itemData, petugas);
  },

  async withdrawWeapon(id, jumlah, petugas = 'Admin') {
    if (this.isConfigured && this.client) {
      const { data: item } = await this.client
        .from('weapons')
        .select('*')
        .eq('id', id)
        .single();

      if (!item) throw new Error('Senjata tidak ditemukan.');
      const currentQty = parseInt(item.qty) || 0;
      const qtyWithdraw = parseInt(jumlah) || 0;

      if (currentQty < qtyWithdraw) {
        throw new Error(`Stok tidak mencukupi! Tersisa ${currentQty} unit.`);
      }

      const newQty = currentQty - qtyWithdraw;
      await this.client
        .from('weapons')
        .update({
          qty: newQty,
          total_nilai: newQty * (parseFloat(item.harga_per_unit) || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      await this.addInventoryLog({
        jenis: 'SENJATA',
        nama: item.nama,
        aksi: 'WITHDRAW',
        jumlah: qtyWithdraw,
        unit: 'unit',
        petugas
      });

      window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      return true;
    }

    return ApiService.withdrawItem('SENJATA', id, jumlah, petugas);
  },

  async deleteWeapon(id) {
    if (this.isConfigured && this.client) {
      await this.client.from('weapons').delete().eq('id', id);
      window.dispatchEvent(new CustomEvent('wt:inventory-changed'));
      return true;
    }
    return ApiService.deleteItem('SENJATA', id);
  },

  // ===== RIWAYAT MUTASI LOGS =====
  async getInventoryLogs() {
    if (this.isConfigured && this.client) {
      const { data, error } = await this.client
        .from('inventory_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) {
        return data;
      }
    }
    return ApiService.getInventoryLogs();
  },

  async addInventoryLog(logData) {
    if (this.isConfigured && this.client) {
      const waktu = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
      await this.client
        .from('inventory_logs')
        .insert({
          id: 'log-inv-' + Date.now(),
          waktu,
          jenis: logData.jenis,
          nama: logData.nama,
          aksi: logData.aksi,
          jumlah: logData.jumlah,
          unit: logData.unit || 'pcs',
          petugas: logData.petugas || 'Admin'
        });
    }
  }
};
