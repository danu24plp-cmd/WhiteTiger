/**
 * White Tiger Dashboard - Modul Penggajian & Setoran Anggota (Gambar 3)
 * Perhitungan:
 * - Batu Mentah: 100 pcs (1 paket) = $75 (Uang Bersih)
 * - Emas: 1 pcs = $1.3 (Uang Bersih)
 * - Tembaga: 1 pcs = $1.5 (Uang Bersih)
 * - Besi: 1 pcs = $1.0 (Uang Bersih)
 * - Bluni Kantor: 1 pcs = $1.5 (UANG ROC)
 * - Gaji Full Uang Bersih = Batu Mentah + Emas + Tembaga + Besi
 * - Gaji Full ROC = Bluni Kantor
 * - Format: $<Gaji Bersih> & $<Gaji ROC>
 */

const PenggajianModule = {
  currentFilter: 'ALL',
  searchKeyword: '',
  activeEditId: null,

  init() {
    this.bindEvents();
    this.render();

    window.addEventListener('wt:setoran-changed', () => this.render());
    window.addEventListener('wt:rates-changed', () => this.render());
    window.addEventListener('wt:members-changed', () => this.render());
  },

  bindEvents() {
    // Search
    const searchInput = document.getElementById('search-setoran');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchKeyword = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Filter status pills
    const filterGroup = document.getElementById('filter-setoran-status');
    if (filterGroup) {
      filterGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-status]');
        if (!btn) return;

        filterGroup.querySelectorAll('button').forEach(b => {
          b.classList.remove('bg-[#0570e9]', 'text-white');
          b.classList.add('bg-white', 'text-slate-600');
        });
        btn.classList.remove('bg-white', 'text-slate-600');
        btn.classList.add('bg-[#0570e9]', 'text-white');

        this.currentFilter = btn.dataset.status;
        this.render();
      });
    }

    // Modal Form inputs for Real-time Calculation Preview
    const inputs = ['input-batu-mentah', 'input-emas', 'input-tembaga', 'input-besi', 'input-bluni'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.calculateModalPreview());
      }
    });

    // Form submit
    const form = document.getElementById('setoran-modal-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSetoranForm();
      });
    }

    // New Setoran Button
    const newBtn = document.getElementById('btn-add-setoran');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.openAddModal());
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-setoran');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCsv());
    }
  },

  getFilteredData() {
    let list = StorageService.getSetoran();

    // Filter status
    if (this.currentFilter !== 'ALL') {
      list = list.filter(item => item.status === this.currentFilter);
    }

    // Search
    if (this.searchKeyword) {
      list = list.filter(item => item.nama.toLowerCase().includes(this.searchKeyword));
    }

    return list;
  },

  render() {
    const list = this.getFilteredData();
    const tbody = document.getElementById('penggajian-table-body');
    if (!tbody) return;

    let totalPaketBatu = 0;
    let totalEmas = 0;
    let totalTembaga = 0;
    let totalBesi = 0;
    let totalBluni = 0;
    let totalPayoutBersih = 0;
    let totalPayoutRoc = 0;
    let completedCount = 0;

    const allList = StorageService.getSetoran();
    allList.forEach(item => {
      const calc = StorageService.calculateGaji(item);
      totalPaketBatu += parseFloat(item.batuMentah) || 0;
      totalEmas += parseFloat(item.emas) || 0;
      totalTembaga += parseFloat(item.tembaga) || 0;
      totalBesi += parseFloat(item.besi) || 0;
      totalBluni += parseFloat(item.bluni) || 0;
      totalPayoutBersih += calc.gajiBersih;
      totalPayoutRoc += calc.gajiRoc;
      if (item.status === 'COMPLETED') completedCount++;
    });

    // Update Summary Header KPI Cards
    const elKpiBatu = document.getElementById('kpi-total-batu');
    const elKpiEmas = document.getElementById('kpi-total-emas');
    const elKpiTembaga = document.getElementById('kpi-total-tembaga');
    const elKpiBesi = document.getElementById('kpi-total-besi');
    const elKpiBluni = document.getElementById('kpi-total-bluni');
    const elKpiGajiBersih = document.getElementById('kpi-total-gaji-bersih');
    const elKpiGajiRoc = document.getElementById('kpi-total-gaji-roc');
    const elKpiCompleted = document.getElementById('kpi-setoran-completed');

    if (elKpiBatu) elKpiBatu.textContent = `${totalPaketBatu} Pkt (${totalPaketBatu * 100} pcs)`;
    if (elKpiEmas) elKpiEmas.textContent = `${totalEmas} pcs`;
    if (elKpiTembaga) elKpiTembaga.textContent = `${totalTembaga} pcs`;
    if (elKpiBesi) elKpiBesi.textContent = `${totalBesi} pcs`;
    if (elKpiBluni) elKpiBluni.textContent = `${totalBluni} pcs`;
    if (elKpiGajiBersih) elKpiGajiBersih.textContent = `$${totalPayoutBersih.toLocaleString()}`;
    if (elKpiGajiRoc) elKpiGajiRoc.textContent = `$${totalPayoutRoc.toLocaleString()}`;
    if (elKpiCompleted) elKpiCompleted.textContent = `${completedCount} / ${allList.length}`;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="15" class="py-8 text-center text-slate-400 text-xs">
            Tidak ada data setoran yang cocok dengan filter.
          </td>
        </tr>
      `;
      return;
    }

    const currentRole = StorageService.getCurrentRole();

    tbody.innerHTML = list.map((item, idx) => {
      const calc = StorageService.calculateGaji(item);
      const isCompleted = item.status === 'COMPLETED';

      return `
        <tr class="hover:bg-blue-50/40 border-b border-slate-100 transition-colors text-xs ${isCompleted ? 'bg-white' : 'bg-rose-50/10'}">
          <td class="excel-td font-mono text-slate-400 text-center">${idx + 1}</td>
          <td class="excel-td font-bold text-slate-900 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
            ${item.nama}
          </td>
          <td class="excel-td font-mono text-center ${item.batuMentah > 0 ? 'font-bold text-[#0570e9]' : 'text-slate-400'}">${item.batuMentah || 0}</td>
          <td class="excel-td font-mono text-center ${item.emas > 0 ? 'font-bold text-amber-600' : 'text-slate-400'}">${item.emas || 0}</td>
          <td class="excel-td font-mono text-center ${item.tembaga > 0 ? 'font-bold text-orange-600' : 'text-slate-400'}">${item.tembaga || 0}</td>
          <td class="excel-td font-mono text-center ${item.besi > 0 ? 'font-bold text-slate-700' : 'text-slate-400'}">${item.besi || 0}</td>
          <td class="excel-td font-mono text-center ${item.bluni > 0 ? 'font-bold text-sky-600' : 'text-slate-400'}">${item.bluni || 0}</td>
          <td class="excel-td font-mono font-bold text-slate-800 text-center bg-slate-50">${calc.totalSetoranPcs}</td>
          <td class="excel-td font-mono text-slate-600 text-right">$${calc.gajiBatu.toLocaleString()}</td>
          <td class="excel-td font-mono text-slate-600 text-right">$${calc.gajiEmas.toLocaleString()}</td>
          <td class="excel-td font-mono text-slate-600 text-right">$${calc.gajiTembaga.toLocaleString()}</td>
          <td class="excel-td font-mono text-slate-600 text-right">$${calc.gajiBesi.toLocaleString()}</td>
          <td class="excel-td font-mono font-semibold text-sky-700 text-right bg-sky-50/50">$${calc.gajiBluni.toLocaleString()}</td>
          <td class="excel-td font-mono font-bold text-emerald-700 text-right bg-emerald-50/50">$${calc.gajiBersih.toLocaleString()}</td>
          <td class="excel-td font-mono font-bold text-sky-700 text-right bg-sky-50/80">$${calc.gajiRoc.toLocaleString()}</td>
          <td class="excel-td font-mono font-bold text-[#0570e9] text-center bg-blue-50/60">${calc.displayGaji}</td>
          <td class="excel-td text-center">
            <button onclick="PenggajianModule.toggleStatus('${item.id || item.nama}')" 
              class="${isCompleted ? 'badge-status-completed' : 'badge-status-belum'} cursor-pointer hover:opacity-90 transition-opacity">
              ${item.status}
            </button>
          </td>
          <td class="excel-td text-right">
            <div class="flex items-center justify-end gap-1">
              <button onclick="PenggajianModule.openEditModal('${item.id || item.nama}')" title="Edit Data Setoran"
                class="p-1 text-slate-500 hover:text-[#0570e9] hover:bg-blue-50 rounded">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="PenggajianModule.printSlip('${item.id || item.nama}')" title="Cetak Slip Gaji"
                class="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              </button>
              ${currentRole === 'Admin' ? `
                <button onclick="PenggajianModule.deleteSetoranPrompt('${item.id || item.nama}')" title="Hapus"
                  class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  openAddModal() {
    this.activeEditId = null;
    const form = document.getElementById('setoran-modal-form');
    if (form) form.reset();

    // Populate members dropdown
    const select = document.getElementById('select-nama-anggota');
    if (select) {
      const members = StorageService.getMembers();
      select.innerHTML = members.map(m => `<option value="${m.nama}">${m.nama} (${m.jabatan})</option>`).join('');
    }

    document.getElementById('modal-setoran-title').textContent = 'Tambah Setoran Baru';
    this.calculateModalPreview();
    ItemsModule.showModal('modal-setoran');
  },

  openEditModal(idOrName) {
    const list = StorageService.getSetoran();
    const item = list.find(s => s.id === idOrName || s.nama.toLowerCase() === idOrName.toLowerCase());
    if (!item) return;

    this.activeEditId = item.id || item.nama;

    const select = document.getElementById('select-nama-anggota');
    if (select) {
      const members = StorageService.getMembers();
      select.innerHTML = members.map(m => `<option value="${m.nama}" ${m.nama.toLowerCase() === item.nama.toLowerCase() ? 'selected' : ''}>${m.nama}</option>`).join('');
    }

    document.getElementById('input-batu-mentah').value = item.batuMentah || 0;
    document.getElementById('input-emas').value = item.emas || 0;
    document.getElementById('input-tembaga').value = item.tembaga || 0;
    document.getElementById('input-besi').value = item.besi || 0;
    document.getElementById('input-bluni').value = item.bluni || 0;
    document.getElementById('select-status-setoran').value = item.status || 'COMPLETED';

    document.getElementById('modal-setoran-title').textContent = `Edit Setoran: ${item.nama}`;
    this.calculateModalPreview();
    ItemsModule.showModal('modal-setoran');
  },

  calculateModalPreview() {
    const batu = parseFloat(document.getElementById('input-batu-mentah').value) || 0;
    const emas = parseFloat(document.getElementById('input-emas').value) || 0;
    const tembaga = parseFloat(document.getElementById('input-tembaga').value) || 0;
    const besi = parseFloat(document.getElementById('input-besi').value) || 0;
    const bluni = parseFloat(document.getElementById('input-bluni').value) || 0;

    const calc = StorageService.calculateGaji({
      batuMentah: batu,
      emas,
      tembaga,
      besi,
      bluni
    });

    const elTotalPcs = document.getElementById('preview-total-pcs');
    const elGajiBersih = document.getElementById('preview-gaji-bersih');
    const elGajiRoc = document.getElementById('preview-gaji-roc');
    const elDisplay = document.getElementById('preview-gaji-display');

    if (elTotalPcs) elTotalPcs.textContent = `${calc.totalSetoranPcs} pcs`;
    if (elGajiBersih) elGajiBersih.textContent = `$${calc.gajiBersih.toLocaleString()}`;
    if (elGajiRoc) elGajiRoc.textContent = `$${calc.gajiRoc.toLocaleString()}`;
    if (elDisplay) elDisplay.textContent = calc.displayGaji;
  },

  saveSetoranForm() {
    const nama = document.getElementById('select-nama-anggota').value;
    const batuMentah = parseFloat(document.getElementById('input-batu-mentah').value) || 0;
    const emas = parseFloat(document.getElementById('input-emas').value) || 0;
    const tembaga = parseFloat(document.getElementById('input-tembaga').value) || 0;
    const besi = parseFloat(document.getElementById('input-besi').value) || 0;
    const bluni = parseFloat(document.getElementById('input-bluni').value) || 0;
    const status = document.getElementById('select-status-setoran').value;

    const record = {
      id: this.activeEditId || ('st-' + Date.now()),
      nama,
      batuMentah,
      emas,
      tembaga,
      besi,
      bluni,
      status
    };

    StorageService.saveSetoran(record);
    window.App.showToast(`Setoran ${nama} berhasil disimpan!`, 'success');
    ItemsModule.closeModal('modal-setoran');
  },

  toggleStatus(idOrName) {
    const list = StorageService.getSetoran();
    const item = list.find(s => s.id === idOrName || s.nama.toLowerCase() === idOrName.toLowerCase());
    if (!item) return;

    item.status = item.status === 'COMPLETED' ? 'BELUM SETORAN' : 'COMPLETED';
    StorageService.saveSetoran(item);
    window.App.showToast(`Status setoran ${item.nama} diubah ke ${item.status}`, 'info');
  },

  deleteSetoranPrompt(idOrName) {
    const list = StorageService.getSetoran();
    const item = list.find(s => s.id === idOrName || s.nama.toLowerCase() === idOrName.toLowerCase());
    if (!item) return;

    if (confirm(`Hapus catatan setoran untuk ${item.nama}?`)) {
      StorageService.deleteSetoran(item.id || item.nama);
      window.App.showToast(`Catatan setoran ${item.nama} telah dihapus.`, 'info');
    }
  },

  printSlip(idOrName) {
    const list = StorageService.getSetoran();
    const item = list.find(s => s.id === idOrName || s.nama.toLowerCase() === idOrName.toLowerCase());
    if (!item) return;

    const calc = StorageService.calculateGaji(item);
    const slipModalBody = document.getElementById('slip-modal-content');
    if (slipModalBody) {
      slipModalBody.innerHTML = `
        <div class="border-2 border-slate-800 p-6 bg-white rounded-xl font-mono text-slate-800 space-y-4">
          <div class="text-center border-b pb-3">
            <h2 class="font-bold text-lg text-[#0570e9]">WHITE TIGER ENTERPRISE</h2>
            <p class="text-xs text-slate-500">OFFICIAL PAYSLIP & SETORAN RECEIPT</p>
            <p class="text-[11px] text-slate-400">Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="flex justify-between text-xs border-b pb-2">
            <span>NAMA ANGGOTA: <strong>${item.nama}</strong></span>
            <span>STATUS: <strong>${item.status}</strong></span>
          </div>
          <table class="w-full text-xs">
            <tr class="border-b">
              <th class="text-left py-1">KOMPONEN</th>
              <th class="text-center py-1">QTY</th>
              <th class="text-right py-1">TOTAL GAJI</th>
            </tr>
            <tr>
              <td class="py-1">Batu Mentah ($75/100pcs)</td>
              <td class="text-center">${item.batuMentah || 0} Pkt</td>
              <td class="text-right font-bold">$${calc.gajiBatu.toLocaleString()} (Bersih)</td>
            </tr>
            <tr>
              <td class="py-1">Emas ($1.3/pcs)</td>
              <td class="text-center">${item.emas || 0} pcs</td>
              <td class="text-right font-bold">$${calc.gajiEmas.toLocaleString()} (Bersih)</td>
            </tr>
            <tr>
              <td class="py-1">Tembaga ($1.5/pcs)</td>
              <td class="text-center">${item.tembaga || 0} pcs</td>
              <td class="text-right font-bold">$${calc.gajiTembaga.toLocaleString()} (Bersih)</td>
            </tr>
            <tr>
              <td class="py-1">Besi ($1.0/pcs)</td>
              <td class="text-center">${item.besi || 0} pcs</td>
              <td class="text-right font-bold">$${calc.gajiBesi.toLocaleString()} (Bersih)</td>
            </tr>
            <tr class="border-b">
              <td class="py-1">Bluni Kantor ($1.5/pcs)</td>
              <td class="text-center">${item.bluni || 0} pcs</td>
              <td class="text-right font-bold text-[#0570e9]">$${calc.gajiBluni.toLocaleString()} (ROC)</td>
            </tr>
          </table>
          <div class="pt-2 border-t space-y-1 text-xs">
            <div class="flex justify-between">
              <span>TOTAL SETORAN FISIK:</span>
              <span class="font-bold">${calc.totalSetoranPcs} pcs</span>
            </div>
            <div class="flex justify-between text-emerald-700 font-bold">
              <span>TOTAL UANG BERSIH:</span>
              <span>$${calc.gajiBersih.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-[#0570e9] font-bold">
              <span>TOTAL UANG ROC:</span>
              <span>$${calc.gajiRoc.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-sm font-black border-t pt-2 text-slate-900">
              <span>HASIL AKHIR:</span>
              <span>${calc.displayGaji}</span>
            </div>
          </div>
          <div class="text-center pt-4 text-[10px] text-slate-400">
            *** Validated by White Tiger Automated System ***
          </div>
        </div>
      `;
    }

    ItemsModule.showModal('modal-slip-gaji');
  },

  exportCsv() {
    const list = StorageService.getSetoran();
    let csv = 'No,Nama,Batu Mentah (Pkt),Emas (Pcs),Tembaga (Pcs),Besi (Pcs),Bluni (Pcs),Total Pcs,Gaji Batu,Gaji Emas,Gaji Tembaga,Gaji Besi,Gaji Bluni,Gaji Bersih,Gaji ROC,Hasil Akhir,Status\n';
    
    list.forEach((item, idx) => {
      const calc = StorageService.calculateGaji(item);
      csv += `"${idx + 1}","${item.nama}","${item.batuMentah || 0}","${item.emas || 0}","${item.tembaga || 0}","${item.besi || 0}","${item.bluni || 0}","${calc.totalSetoranPcs}","${calc.gajiBatu}","${calc.gajiEmas}","${calc.gajiTembaga}","${calc.gajiBesi}","${calc.gajiBluni}","${calc.gajiBersih}","${calc.gajiRoc}","${calc.displayGaji}","${item.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `white_tiger_penggajian_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    window.App.showToast('Data penggajian berhasil diexport ke CSV!', 'success');
  }
};
