/**
 * White Tiger Dashboard - Main Application Orchestrator
 * Coordinates Navigation, Authentication, Financial Analytics, Salary, Vault, and Attendance.
 */

window.App = {
  currentTab: 'keuangan',
  chartKeuanganRoc: null,
  chartTrxInOut: null,
  chartBadside: null,
  chartKeuntungan: null,

  init() {
    StorageService.init();

    this.bindNavigation();
    this.bindRoleSwitcher();
    this.bindRatesSettings();

    // Initialize all modules
    AuthModule.init();
    PenggajianModule.init();
    BrangkasModule.init();
    MonitoringModule.init();
    AnggotaModule.init();
    ItemsModule.init();
    UploadModule.init();

    // Init Charts
    this.initFinancialCharts();
    this.updateFinancialKpi();

    // Global event listeners
    window.addEventListener('wt:brangkas-changed', () => {
      this.updateFinancialKpi();
      this.updateFinancialCharts();
    });

    window.addEventListener('wt:setoran-changed', () => {
      this.updateFinancialKpi();
    });

    window.addEventListener('wt:role-changed', () => {
      this.renderRoleUi();
    });

    this.renderRoleUi();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  bindNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.tab;
        this.switchTab(targetView);
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update active nav styling
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Toggle view containers
    document.querySelectorAll('.view-section').forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    // Resize charts if on keuangan
    if (tabId === 'keuangan') {
      setTimeout(() => {
        if (this.chartKeuanganRoc) this.chartKeuanganRoc.resize();
        if (this.chartTrxInOut) this.chartTrxInOut.resize();
        if (this.chartBadside) this.chartBadside.resize();
        if (this.chartKeuntungan) this.chartKeuntungan.resize();
      }, 50);
    }

    if (window.lucide) window.lucide.createIcons();
  },

  bindRoleSwitcher() {
    const btnUser = document.getElementById('role-btn-user');
    const btnAdmin = document.getElementById('role-btn-admin');

    if (btnUser && btnAdmin) {
      btnUser.addEventListener('click', () => {
        StorageService.setCurrentRole('User');
        this.showToast('Beralih ke mode User.', 'info');
      });

      btnAdmin.addEventListener('click', () => {
        StorageService.setCurrentRole('Admin');
        this.showToast('Beralih ke mode Administrator. Akses penuh aktif!', 'success');
      });
    }
  },

  renderRoleUi() {
    const role = StorageService.getCurrentRole();
    const btnUser = document.getElementById('role-btn-user');
    const btnAdmin = document.getElementById('role-btn-admin');
    const roleLabel = document.getElementById('active-role-text');
    const topbarUserAvatar = document.getElementById('topbar-user-avatar');
    const topbarUserName = document.getElementById('topbar-user-name');
    const user = StorageService.getSession() || StorageService.getActiveUser();

    if (role === 'Admin') {
      btnAdmin.classList.add('active');
      btnUser.classList.remove('active');
      if (roleLabel) roleLabel.textContent = 'Administrator';
    } else {
      btnUser.classList.add('active');
      btnAdmin.classList.remove('active');
      if (roleLabel) roleLabel.textContent = 'Standard User';
    }

    if (topbarUserName && user) topbarUserName.textContent = user.name;
    if (topbarUserAvatar && user) topbarUserAvatar.src = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
  },

  bindRatesSettings() {
    const form = document.getElementById('rates-settings-form');
    if (!form) return;

    // Load initial values
    const rates = StorageService.getRates();
    document.getElementById('rate-batu-mentah').value = rates.batuMentahPaket;
    document.getElementById('rate-emas').value = rates.emasPcs;
    document.getElementById('rate-tembaga').value = rates.tembagaPcs;
    document.getElementById('rate-besi').value = rates.besiPcs;
    document.getElementById('rate-bluni').value = rates.bluniPcs;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const batuMentahPaket = parseFloat(document.getElementById('rate-batu-mentah').value) || 75;
      const emasPcs = parseFloat(document.getElementById('rate-emas').value) || 1.3;
      const tembagaPcs = parseFloat(document.getElementById('rate-tembaga').value) || 1.5;
      const besiPcs = parseFloat(document.getElementById('rate-besi').value) || 1.0;
      const bluniPcs = parseFloat(document.getElementById('rate-bluni').value) || 1.5;

      StorageService.saveRates({
        batuMentahPaket,
        emasPcs,
        tembagaPcs,
        besiPcs,
        bluniPcs
      });

      this.showToast('Tarif gaji berhasil diperbarui!', 'success');
    });
  },

  updateFinancialKpi() {
    const totals = StorageService.getBrangkasTotals();

    const elPemasukan = document.getElementById('kpi-dash-pemasukan');
    const elPengeluaran = document.getElementById('kpi-dash-pengeluaran');
    const elTrxMasuk = document.getElementById('kpi-dash-trx-masuk');
    const elTrxKeluar = document.getElementById('kpi-dash-trx-keluar');
    const elKeuntungan = document.getElementById('kpi-dash-keuntungan');
    const elPersen = document.getElementById('kpi-dash-persen');
    const elUangHilang = document.getElementById('kpi-dash-uang-hilang');
    const elTanpaKet = document.getElementById('kpi-dash-tanpa-ket');

    if (elPemasukan) elPemasukan.textContent = `$${totals.totalMasuk.toLocaleString()}`;
    if (elPengeluaran) elPengeluaran.textContent = `$${totals.totalKeluar.toLocaleString()}`;
    if (elTrxMasuk) elTrxMasuk.textContent = totals.trxMasuk;
    if (elTrxKeluar) elTrxKeluar.textContent = totals.trxKeluar;
    if (elKeuntungan) elKeuntungan.textContent = `$${totals.totalKeuntungan.toLocaleString()}`;
    if (elPersen) elPersen.textContent = `${totals.persenKeuntungan}%`;
    if (elUangHilang) elUangHilang.textContent = `$${totals.uangHilang.toLocaleString()}`;
    if (elTanpaKet) elTanpaKet.textContent = `$${totals.tanpaKeterangan.toLocaleString()}`;
  },

  initFinancialCharts() {
    const ctxRoc = document.getElementById('chart-analisis-roc');
    const ctxInOut = document.getElementById('chart-trx-in-out');
    const ctxBadside = document.getElementById('chart-pembelian-badside');
    const ctxUntung = document.getElementById('chart-keuntungan-mingguan');

    if (!ctxRoc || typeof Chart === 'undefined') return;

    // 1. Doughnut Chart: Analisis Keuangan ROC (Gambar 5)
    this.chartKeuanganRoc = new Chart(ctxRoc, {
      type: 'doughnut',
      data: {
        labels: ['Tanpa Keterangan', 'Pembelian Logistik', 'Gaji Anggota', 'Aktivitas Operasional', 'Cuci Uang', 'Reward'],
        datasets: [{
          data: [2000, 4500, 3750, 2300, 1600, 1200],
          backgroundColor: ['#f472b6', '#38bdf8', '#0570e9', '#34d399', '#1e293b', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 10, family: 'Inter' }, boxWidth: 10 }
          }
        },
        cutout: '70%'
      }
    });

    // 2. Transaksi Masuk & Keluar Bar Chart
    if (ctxInOut) {
      this.chartTrxInOut = new Chart(ctxInOut, {
        type: 'bar',
        data: {
          labels: ['TRX MASUK', 'TRX KELUAR'],
          datasets: [{
            data: [4, 5],
            backgroundColor: ['#06b6d4', '#0284c7'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
          }
        }
      });
    }

    // 3. Pembelian ke Badside (e.g. HCMC)
    if (ctxBadside) {
      this.chartBadside = new Chart(ctxBadside, {
        type: 'bar',
        data: {
          labels: ['HCMC', 'BLACK MARKET', 'SUPPLIER 3'],
          datasets: [{
            label: 'Pembelian Badside ($)',
            data: [4500, 1500, 800],
            backgroundColor: ['#06b6d4', '#3b82f6', '#93c5fd'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
          }
        }
      });
    }

    // 4. Keuntungan Mingguan Line Chart
    if (ctxUntung) {
      this.chartKeuntungan = new Chart(ctxUntung, {
        type: 'line',
        data: {
          labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
          datasets: [{
            label: 'Net Keuntungan ($)',
            data: [8200, 12400, 9800, 14900],
            borderColor: '#0570e9',
            backgroundColor: 'rgba(5, 112, 233, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
          }
        }
      });
    }
  },

  updateFinancialCharts() {
    if (!this.chartKeuanganRoc) return;
    const totals = StorageService.getBrangkasTotals();
    if (this.chartTrxInOut) {
      this.chartTrxInOut.data.datasets[0].data = [totals.trxMasuk, totals.trxKeluar];
      this.chartTrxInOut.update();
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;

    let borderClass = 'border-blue-200';
    let iconName = 'info';
    let iconColor = 'text-[#0570e9]';

    if (type === 'success') {
      borderClass = 'border-emerald-200';
      iconName = 'check-circle-2';
      iconColor = 'text-emerald-500';
    } else if (type === 'warning') {
      borderClass = 'border-amber-200';
      iconName = 'alert-triangle';
      iconColor = 'text-amber-500';
    } else if (type === 'error') {
      borderClass = 'border-rose-200';
      iconName = 'alert-octagon';
      iconColor = 'text-rose-500';
    }

    toast.className = `flex items-center gap-3 bg-white border ${borderClass} shadow-xl rounded-xl p-3.5 text-sm text-slate-800 pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-200 max-w-md w-full`;

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor} shrink-0"></i>
      <span class="flex-1 font-medium text-xs sm:text-sm">${message}</span>
      <button onclick="document.getElementById('${toastId}').remove()" class="text-slate-400 hover:text-slate-600 p-1">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 250);
      }
    }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
