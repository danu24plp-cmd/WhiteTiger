/**
 * White Tiger Dashboard - Inventory Module (Berangkas Bahan & Senjata)
 * Mengelola stok bahan tambang & persenjataan, deposit, withdraw, dan rekap total nilai aset.
 */

const InventoryModule = {
  materials: [],
  weapons: [],
  logs: [],

  async init() {
    await this.refreshData();
    this.bindEvents();

    // Dengarkan event perubahan data berangkas
    window.addEventListener('wt:inventory-changed', async () => {
      await this.refreshData();
    });

    console.log('✅ InventoryModule berhasil diinisialisasi');
  },

  async refreshData() {
    const service = (window.SqlService && SqlService.isConfigured) ? SqlService : ApiService;
    this.materials = await service.getMaterials();
    this.weapons = await service.getWeapons();
    this.logs = await service.getInventoryLogs();

    this.renderMaterials();
    this.renderWeapons();
    this.renderLogs();
    this.updateTotals();
  },

  bindEvents() {
    // Tombol Buka Modal Deposit
    const btnDepositBahan = document.getElementById('btn-open-deposit-bahan');
    if (btnDepositBahan) {
      btnDepositBahan.addEventListener('click', () => this.openDepositModal('BAHAN'));
    }

    const btnDepositSenjata = document.getElementById('btn-open-deposit-senjata');
    if (btnDepositSenjata) {
      btnDepositSenjata.addEventListener('click', () => this.openDepositModal('SENJATA'));
    }

    // Form Deposit Submit
    const depositForm = document.getElementById('form-inventory-deposit');
    if (depositForm) {
      depositForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitDeposit();
      });
    }

    // Form Withdraw Submit
    const withdrawForm = document.getElementById('form-inventory-withdraw');
    if (withdrawForm) {
      withdrawForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitWithdraw();
      });
    }

    // Dynamic Select di Modal Deposit (pilih barang ada atau baru)
    const selectBarang = document.getElementById('deposit-item-select');
    if (selectBarang) {
      selectBarang.addEventListener('change', (e) => {
        this.handleDepositSelectChange(e.target.value);
      });
    }

    // Tutup Modal Buttons
    document.querySelectorAll('[data-close-inv-modal]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModals());
    });
  },

  // ===== RENDER TABEL BAHAN =====
  renderMaterials() {
    const tbody = document.getElementById('materials-table-body');
    if (!tbody) return;

    if (this.materials.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-8 text-center text-slate-400">
            <i data-lucide="package-open" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs">Belum ada bahan di berangkas. Klik tombol "+ Deposit Bahan" untuk menambahkan.</p>
          </td>
        </tr>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = this.materials.map(m => {
      const isLow = (m.qty || 0) <= 20;
      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <td class="px-4 py-3">
            <div class="font-bold text-slate-800 text-xs">${m.nama}</div>
            <div class="text-[10px] text-slate-400">${m.keterangan || 'Material Tambang'}</div>
          </td>
          <td class="px-4 py-3 text-xs text-slate-600 font-mono">${m.unit || 'pcs'}</td>
          <td class="px-4 py-3 text-center">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
              ${(m.qty || 0).toLocaleString()}
            </span>
          </td>
          <td class="px-4 py-3 text-right text-xs font-mono text-slate-700">$${(m.hargaPerUnit || 0).toLocaleString('en-US', { minimumFractionDigits: 1 })}</td>
          <td class="px-4 py-3 text-right text-xs font-mono font-bold text-[#0570e9]">$${(m.totalNilai || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="px-4 py-3 text-center">
            <div class="flex items-center justify-center gap-1.5">
              <button onclick="InventoryModule.openWithdrawModal('BAHAN', '${m.id}')"
                title="Ambil Bahan (Withdraw)"
                class="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-semibold flex items-center gap-1 transition-colors">
                <i data-lucide="arrow-down-circle" class="w-3.5 h-3.5"></i>
                <span>Ambil</span>
              </button>
              <button onclick="InventoryModule.openDepositExisting('BAHAN', '${m.id}')"
                title="Tambah Stok (Deposit)"
                class="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 transition-colors">
                <i data-lucide="arrow-up-circle" class="w-3.5 h-3.5"></i>
                <span>Tambah</span>
              </button>
              <button onclick="InventoryModule.deleteItem('BAHAN', '${m.id}', '${m.nama}')"
                title="Hapus Bahan"
                class="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  // ===== RENDER TABEL SENJATA =====
  renderWeapons() {
    const tbody = document.getElementById('weapons-table-body');
    if (!tbody) return;

    if (this.weapons.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-4 py-8 text-center text-slate-400">
            <i data-lucide="shield-off" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs">Belum ada persenjataan di berangkas. Klik tombol "+ Deposit Senjata" untuk menambahkan.</p>
          </td>
        </tr>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tbody.innerHTML = this.weapons.map(w => {
      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <td class="px-4 py-3">
            <div class="font-bold text-slate-800 text-xs">${w.nama}</div>
          </td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              ${w.kategori || 'Handgun'}
            </span>
          </td>
          <td class="px-4 py-3 text-center">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              ${(w.qty || 0).toLocaleString()} unit
            </span>
          </td>
          <td class="px-4 py-3 text-right text-xs font-mono text-slate-700">$${(w.hargaPerUnit || 0).toLocaleString()}</td>
          <td class="px-4 py-3 text-right text-xs font-mono font-bold text-[#0570e9]">$${(w.totalNilai || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td class="px-4 py-3 text-center text-xs">
            <span class="text-slate-600 text-[11px] font-medium">${w.kondisi || 'Baik'}</span>
          </td>
          <td class="px-4 py-3 text-center">
            <div class="flex items-center justify-center gap-1.5">
              <button onclick="InventoryModule.openWithdrawModal('SENJATA', '${w.id}')"
                title="Ambil Senjata"
                class="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-semibold flex items-center gap-1 transition-colors">
                <i data-lucide="arrow-down-circle" class="w-3.5 h-3.5"></i>
                <span>Ambil</span>
              </button>
              <button onclick="InventoryModule.openDepositExisting('SENJATA', '${w.id}')"
                title="Tambah Stok"
                class="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1 transition-colors">
                <i data-lucide="arrow-up-circle" class="w-3.5 h-3.5"></i>
                <span>Tambah</span>
              </button>
              <button onclick="InventoryModule.deleteItem('SENJATA', '${w.id}', '${w.nama}')"
                title="Hapus Senjata"
                class="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  // ===== RENDER RIWAYAT MUTASI LOGS =====
  renderLogs() {
    const tbody = document.getElementById('inventory-logs-table-body');
    if (!tbody) return;

    if (this.logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-slate-400 text-xs">Belum ada riwayat transaksi berangkas.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.logs.map(log => {
      const isDeposit = log.aksi === 'DEPOSIT';
      const isSenjata = log.jenis === 'SENJATA';
      return `
        <tr class="hover:bg-slate-50/50 transition-colors border-b border-slate-100 text-xs">
          <td class="px-4 py-2.5 font-mono text-slate-500 text-[11px]">${log.waktu || '-'}</td>
          <td class="px-4 py-2.5">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${isSenjata ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
              ${log.jenis}
            </span>
          </td>
          <td class="px-4 py-2.5 font-bold text-slate-800">${log.nama}</td>
          <td class="px-4 py-2.5 text-center">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${isDeposit ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${log.aksi}
            </span>
          </td>
          <td class="px-4 py-2.5 text-right font-mono font-bold ${isDeposit ? 'text-emerald-600' : 'text-amber-600'}">
            ${isDeposit ? '+' : '-'}${log.jumlah} ${log.unit || ''}
          </td>
          <td class="px-4 py-2.5 text-slate-600 text-right">${log.petugas || 'Admin'}</td>
        </tr>`;
    }).join('');
  },

  // ===== KALKULASI & UPDATE TOTALS =====
  updateTotals() {
    const totalNilaiBahan = this.materials.reduce((sum, m) => sum + (parseFloat(m.totalNilai) || 0), 0);
    const totalNilaiSenjata = this.weapons.reduce((sum, w) => sum + (parseFloat(w.totalNilai) || 0), 0);
    const grandTotal = totalNilaiBahan + totalNilaiSenjata;

    const countBahanPcs = this.materials.reduce((sum, m) => sum + (parseFloat(m.qty) || 0), 0);
    const countSenjataUnit = this.weapons.reduce((sum, w) => sum + (parseFloat(w.qty) || 0), 0);

    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setText('kpi-inv-total-bahan', `$${totalNilaiBahan.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setText('kpi-inv-total-senjata', `$${totalNilaiSenjata.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setText('kpi-inv-grand-total', `$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setText('kpi-inv-count-bahan', `${this.materials.length} jenis (${countBahanPcs.toLocaleString()} item)`);
    setText('kpi-inv-count-senjata', `${this.weapons.length} jenis (${countSenjataUnit.toLocaleString()} unit)`);
  },

  // ===== MODAL DEPOSIT =====
  openDepositModal(jenis = 'BAHAN') {
    const modal = document.getElementById('modal-inventory-deposit');
    if (!modal) return;

    document.getElementById('deposit-jenis-input').value = jenis;
    document.getElementById('deposit-modal-title').textContent = `Deposit ${jenis === 'BAHAN' ? 'Bahan / Material' : 'Senjata'}`;

    // Tampilkan / sembunyikan field spesifik jenis
    const groupKategori = document.getElementById('deposit-group-kategori');
    const groupUnit = document.getElementById('deposit-group-unit');
    const groupKondisi = document.getElementById('deposit-group-kondisi');

    if (groupKategori) groupKategori.classList.toggle('hidden', jenis !== 'SENJATA');
    if (groupKondisi) groupKondisi.classList.toggle('hidden', jenis !== 'SENJATA');
    if (groupUnit) groupUnit.classList.toggle('hidden', jenis === 'SENJATA');

    // Populate dropdown pilihan barang yang sudah ada
    const select = document.getElementById('deposit-item-select');
    if (select) {
      const items = jenis === 'BAHAN' ? this.materials : this.weapons;
      select.innerHTML = `
        <option value="__NEW__">+ Input Barang Baru...</option>
        ${items.map(it => `<option value="${it.id}">${it.nama} (Stok: ${it.qty})</option>`).join('')}
      `;
      select.value = '__NEW__';
      this.handleDepositSelectChange('__NEW__');
    }

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  openDepositExisting(jenis, id) {
    this.openDepositModal(jenis);
    const select = document.getElementById('deposit-item-select');
    if (select) {
      select.value = id;
      this.handleDepositSelectChange(id);
    }
  },

  handleDepositSelectChange(selectedId) {
    const jenis = document.getElementById('deposit-jenis-input').value;
    const nameInput = document.getElementById('deposit-nama-input');
    const hargaInput = document.getElementById('deposit-harga-input');
    const unitInput = document.getElementById('deposit-unit-input');
    const kategoriInput = document.getElementById('deposit-kategori-input');

    if (selectedId === '__NEW__') {
      if (nameInput) { nameInput.value = ''; nameInput.readOnly = false; }
      if (hargaInput) { hargaInput.value = ''; hargaInput.readOnly = false; }
      if (unitInput) { unitInput.value = 'pcs'; unitInput.readOnly = false; }
    } else {
      const items = jenis === 'BAHAN' ? this.materials : this.weapons;
      const item = items.find(it => it.id === selectedId);
      if (item) {
        if (nameInput) { nameInput.value = item.nama; nameInput.readOnly = true; }
        if (hargaInput) { hargaInput.value = item.hargaPerUnit; nameInput.readOnly = true; }
        if (unitInput && item.unit) { unitInput.value = item.unit; }
        if (kategoriInput && item.kategori) { kategoriInput.value = item.kategori; }
      }
    }
  },

  async submitDeposit() {
    const jenis = document.getElementById('deposit-jenis-input').value;
    const nama = document.getElementById('deposit-nama-input').value.trim();
    const qty = parseFloat(document.getElementById('deposit-qty-input').value);
    const hargaPerUnit = parseFloat(document.getElementById('deposit-harga-input').value) || 0;
    const unit = document.getElementById('deposit-unit-input')?.value || 'pcs';
    const kategori = document.getElementById('deposit-kategori-input')?.value || 'Handgun';
    const kondisi = document.getElementById('deposit-kondisi-input')?.value || 'Baik';
    const keterangan = document.getElementById('deposit-ket-input')?.value || '';

    if (!nama || isNaN(qty) || qty <= 0) {
      window.App.showToast('Nama barang dan jumlah deposit harus diisi dengan benar.', 'error');
      return;
    }

    const itemData = { nama, qty, hargaPerUnit, unit, kategori, kondisi, keterangan };
    const user = StorageService.getActiveUser();
    const petugas = user ? user.name : 'Admin';

    try {
      if (window.SqlService && SqlService.isConfigured) {
        if (jenis === 'BAHAN') {
          await SqlService.depositMaterial(itemData, petugas);
        } else {
          await SqlService.depositWeapon(itemData, petugas);
        }
      } else {
        await ApiService.depositItem(jenis, itemData, petugas);
      }
      window.App.showToast(`Berhasil mendepositkan ${qty} ${nama} ke berangkas!`, 'success');
      this.closeModals();
      await this.refreshData();
    } catch (err) {
      window.App.showToast(`Gagal melakukan deposit: ${err.message}`, 'error');
    }
  },

  // ===== MODAL WITHDRAW =====
  openWithdrawModal(jenis, id) {
    const modal = document.getElementById('modal-inventory-withdraw');
    if (!modal) return;

    const items = jenis === 'BAHAN' ? this.materials : this.weapons;
    const item = items.find(it => it.id === id);
    if (!item) return;

    document.getElementById('withdraw-jenis-input').value = jenis;
    document.getElementById('withdraw-id-input').value = id;
    document.getElementById('withdraw-nama-display').textContent = item.nama;
    document.getElementById('withdraw-max-qty').textContent = `${item.qty} ${item.unit || 'unit'}`;
    document.getElementById('withdraw-qty-input').max = item.qty;
    document.getElementById('withdraw-qty-input').value = '';

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  async submitWithdraw() {
    const jenis = document.getElementById('withdraw-jenis-input').value;
    const id = document.getElementById('withdraw-id-input').value;
    const qty = parseFloat(document.getElementById('withdraw-qty-input').value);

    if (isNaN(qty) || qty <= 0) {
      window.App.showToast('Masukkan jumlah pengambilan yang valid.', 'error');
      return;
    }

    const user = StorageService.getActiveUser();
    const petugas = user ? user.name : 'Admin';

    try {
      if (window.SqlService && SqlService.isConfigured) {
        if (jenis === 'BAHAN') {
          await SqlService.withdrawMaterial(id, qty, petugas);
        } else {
          await SqlService.withdrawWeapon(id, qty, petugas);
        }
      } else {
        await ApiService.withdrawItem(jenis, id, qty, petugas);
      }
      window.App.showToast(`Berhasil mengambil ${qty} dari berangkas!`, 'success');
      this.closeModals();
      await this.refreshData();
    } catch (err) {
      window.App.showToast(err.message, 'error');
    }
  },

  async deleteItem(jenis, id, nama) {
    if (!confirm(`Apakah Anda yakin ingin menghapus "${nama}" dari daftar berangkas?`)) return;
    try {
      if (window.SqlService && SqlService.isConfigured) {
        if (jenis === 'BAHAN') {
          await SqlService.deleteMaterial(id);
        } else {
          await SqlService.deleteWeapon(id);
        }
      } else {
        await ApiService.deleteItem(jenis, id);
      }
      window.App.showToast(`Item "${nama}" berhasil dihapus.`, 'info');
      await this.refreshData();
    } catch (err) {
      window.App.showToast('Gagal menghapus item: ' + err.message, 'error');
    }
  },

  closeModals() {
    const mDeposit = document.getElementById('modal-inventory-deposit');
    const mWithdraw = document.getElementById('modal-inventory-withdraw');
    if (mDeposit) mDeposit.classList.add('hidden');
    if (mWithdraw) mWithdraw.classList.add('hidden');

    const formD = document.getElementById('form-inventory-deposit');
    const formW = document.getElementById('form-inventory-withdraw');
    if (formD) formD.reset();
    if (formW) formW.reset();
  }
};
