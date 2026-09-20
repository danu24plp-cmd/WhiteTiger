/**
 * White Tiger Dashboard - Modul Data Uang ROC Brangkas (Gambar 1)
 * Pencatatan mutasi kas masuk, kas keluar, saldo, kategori aksi, dan transaksi Badside.
 */

const BrangkasModule = {
  currentActionFilter: 'ALL',
  searchKeyword: '',

  init() {
    this.bindEvents();
    this.render();

    window.addEventListener('wt:brangkas-changed', () => this.render());
  },

  bindEvents() {
    // Search
    const searchInput = document.getElementById('search-brangkas');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchKeyword = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Action filter
    const actionSelect = document.getElementById('filter-brangkas-action');
    if (actionSelect) {
      actionSelect.addEventListener('change', (e) => {
        this.currentActionFilter = e.target.value;
        this.render();
      });
    }

    // Add Trx button
    const addBtn = document.getElementById('btn-add-brangkas-trx');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }

    // Form submit
    const form = document.getElementById('brangkas-modal-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveTrx();
      });
    }
  },

  getFilteredList() {
    let list = StorageService.getBrangkas();

    if (this.currentActionFilter !== 'ALL') {
      list = list.filter(t => t.action === this.currentActionFilter);
    }

    if (this.searchKeyword) {
      list = list.filter(t => 
        (t.nama || '').toLowerCase().includes(this.searchKeyword) ||
        (t.aktivitas || '').toLowerCase().includes(this.searchKeyword) ||
        (t.action || '').toLowerCase().includes(this.searchKeyword)
      );
    }

    return list;
  },

  render() {
    const list = this.getFilteredList();
    const tbody = document.getElementById('brangkas-table-body');
    if (!tbody) return;

    // Calculate totals
    const totals = StorageService.getBrangkasTotals();

    const elMasuk = document.getElementById('brangkas-kpi-masuk');
    const elKeluar = document.getElementById('brangkas-kpi-keluar');
    const elTrxMasuk = document.getElementById('brangkas-kpi-trx-masuk');
    const elTrxKeluar = document.getElementById('brangkas-kpi-trx-keluar');
    const elUntung = document.getElementById('brangkas-kpi-untung');

    if (elMasuk) elMasuk.textContent = `$${totals.totalMasuk.toLocaleString()}`;
    if (elKeluar) elKeluar.textContent = `$${totals.totalKeluar.toLocaleString()}`;
    if (elTrxMasuk) elTrxMasuk.textContent = totals.trxMasuk;
    if (elTrxKeluar) elTrxKeluar.textContent = totals.trxKeluar;
    if (elUntung) {
      elUntung.textContent = `$${totals.totalKeuntungan.toLocaleString()}`;
      elUntung.className = `font-mono text-xl font-bold ${totals.totalKeuntungan >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="py-8 text-center text-slate-400 text-xs">
            Belum ada transaksi brangkas yang tercatat.
          </td>
        </tr>
      `;
      return;
    }

    // Running Balance computation (from bottom to top or top down)
    let runningSaldo = 0;
    // Calculate full saldo from chronologically ordered copy
    const chrono = [...StorageService.getBrangkas()].reverse();
    const saldoMap = {};
    chrono.forEach(t => {
      runningSaldo += (parseFloat(t.masuk) || 0) - (parseFloat(t.keluar) || 0);
      saldoMap[t.id] = runningSaldo;
    });

    const currentRole = StorageService.getCurrentRole();

    tbody.innerHTML = list.map(item => {
      const saldo = saldoMap[item.id] !== undefined ? saldoMap[item.id] : 0;
      const actionBadge = this.getActionBadge(item.action);

      return `
        <tr class="hover:bg-blue-50/30 border-b border-slate-100 text-xs transition-colors">
          <td class="excel-td font-mono text-slate-500">${item.tanggal}</td>
          <td class="excel-td font-semibold text-slate-800">${item.nama}</td>
          <td class="excel-td text-slate-700 max-w-xs truncate" title="${item.aktivitas}">${item.aktivitas}</td>
          <td class="excel-td font-mono font-semibold text-emerald-600 text-right">
            ${item.masuk > 0 ? `+$${parseFloat(item.masuk).toLocaleString()}` : '-'}
          </td>
          <td class="excel-td font-mono font-semibold text-rose-600 text-right">
            ${item.keluar > 0 ? `-$${parseFloat(item.keluar).toLocaleString()}` : '-'}
          </td>
          <td class="excel-td font-mono font-bold text-slate-900 text-right bg-slate-50/70">
            $${saldo.toLocaleString()}
          </td>
          <td class="excel-td text-center">
            <span class="tiger-badge text-[10px] ${actionBadge}">
              ${item.action}
            </span>
          </td>
          <td class="excel-td text-slate-600 text-center font-mono">${item.penjualanBadside || '-'}</td>
          <td class="excel-td text-slate-600 text-center font-mono">
            ${item.pembelianBadside ? `<span class="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">${item.pembelianBadside}</span>` : '-'}
          </td>
          <td class="excel-td text-right">
            ${currentRole === 'Admin' ? `
              <button onclick="BrangkasModule.deleteTrx('${item.id}')" title="Hapus Transaksi"
                class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  getActionBadge(action) {
    switch (action) {
      case 'PENJUALAN': return 'badge-action-penjualan';
      case 'PEMBELIAN': return 'badge-action-pembelian';
      case 'REWARD': return 'badge-action-reward';
      case 'ACTIVITY': return 'badge-action-activity';
      case 'GAJI': return 'badge-action-gaji';
      case 'CUCI UANG': return 'badge-action-cuci-uang';
      case 'SETORAN': return 'badge-action-setoran';
      default: return 'badge-action-tanpa-ket';
    }
  },

  openAddModal() {
    const form = document.getElementById('brangkas-modal-form');
    if (form) form.reset();

    const tglInput = document.getElementById('input-trx-tanggal');
    if (tglInput) tglInput.value = new Date().toLocaleDateString('en-GB');

    // Populate members in Nama dropdown
    const select = document.getElementById('select-trx-nama');
    if (select) {
      const members = StorageService.getMembers();
      select.innerHTML = `<option value="System">System</option>` + members.map(m => `<option value="${m.nama}">${m.nama}</option>`).join('');
    }

    ItemsModule.showModal('modal-brangkas');
  },

  saveTrx() {
    const tanggal = document.getElementById('input-trx-tanggal').value;
    const nama = document.getElementById('select-trx-nama').value;
    const aktivitas = document.getElementById('input-trx-aktivitas').value.trim();
    const tipe = document.getElementById('select-trx-tipe').value; // 'MASUK' | 'KELUAR'
    const nominal = parseFloat(document.getElementById('input-trx-nominal').value) || 0;
    const action = document.getElementById('select-trx-action').value;
    const pembelianBadside = document.getElementById('input-trx-badside').value.trim();

    if (nominal <= 0) {
      window.App.showToast('Nominal transaksi harus lebih dari 0.', 'warning');
      return;
    }

    StorageService.addBrangkasTrx({
      tanggal,
      nama,
      aktivitas,
      masuk: tipe === 'MASUK' ? nominal : 0,
      keluar: tipe === 'KELUAR' ? nominal : 0,
      action,
      penjualanBadside: '',
      pembelianBadside
    });

    window.App.showToast('Transaksi brangkas berhasil disimpan!', 'success');
    ItemsModule.closeModal('modal-brangkas');
  },

  deleteTrx(id) {
    if (confirm('Yakin ingin menghapus catatan transaksi brangkas ini?')) {
      StorageService.deleteBrangkasTrx(id);
      window.App.showToast('Transaksi telah dihapus.', 'info');
    }
  }
};
