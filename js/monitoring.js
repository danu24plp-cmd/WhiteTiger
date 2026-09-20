/**
 * White Tiger Dashboard - Modul Monitoring Setoran Per Tanggal (Gambar 2)
 * Menampilkan matriks status setoran anggota per tanggal periode (COMPLETED / BELUM SETORAN).
 */

const MonitoringModule = {
  dates: ['13/09/2026', '10/08/2025', '17/08/2025', '31/08/2025'],
  matrixData: {}, // { "Rafli": { "13/09/2026": "BELUM SETORAN", ... } }
  searchKeyword: '',

  init() {
    this.loadState();
    this.bindEvents();
    this.render();

    window.addEventListener('wt:members-changed', () => this.render());
    window.addEventListener('wt:setoran-changed', () => {
      this.syncFromSetoran();
      this.render();
    });
  },

  loadState() {
    const saved = localStorage.getItem('wt_monitoring_matrix_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.matrixData = parsed.matrixData || {};
        if (parsed.dates && parsed.dates.length) this.dates = parsed.dates;
      } catch (e) {
        this.generateDefaultMatrix();
      }
    } else {
      this.generateDefaultMatrix();
    }
  },

  generateDefaultMatrix() {
    const members = StorageService.getMembers();
    const setoran = StorageService.getSetoran();

    this.matrixData = {};
    members.forEach(m => {
      const rec = setoran.find(s => s.nama.toLowerCase() === m.nama.toLowerCase());
      const curStatus = rec ? rec.status : 'BELUM SETORAN';

      this.matrixData[m.nama] = {
        '13/09/2026': curStatus,
        '10/08/2025': (m.no % 3 === 0 || curStatus === 'COMPLETED') ? 'COMPLETED' : 'BELUM SETORAN',
        '17/08/2025': (m.no % 2 === 0) ? 'COMPLETED' : 'BELUM SETORAN',
        '31/08/2025': 'BELUM SETORAN'
      };
    });
    this.saveState();
  },

  syncFromSetoran() {
    const setoran = StorageService.getSetoran();
    setoran.forEach(s => {
      if (!this.matrixData[s.nama]) {
        this.matrixData[s.nama] = {};
      }
      this.matrixData[s.nama]['13/09/2026'] = s.status;
    });
    this.saveState();
  },

  saveState() {
    localStorage.setItem('wt_monitoring_matrix_v2', JSON.stringify({
      dates: this.dates,
      matrixData: this.matrixData
    }));
  },

  bindEvents() {
    const search = document.getElementById('search-monitoring');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchKeyword = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    const addPeriodBtn = document.getElementById('btn-add-period');
    if (addPeriodBtn) {
      addPeriodBtn.addEventListener('click', () => {
        const newDate = prompt('Masukkan tanggal periode baru (format DD/MM/YYYY):', new Date().toLocaleDateString('en-GB'));
        if (newDate && !this.dates.includes(newDate)) {
          this.dates.unshift(newDate);
          Object.keys(this.matrixData).forEach(nama => {
            this.matrixData[nama][newDate] = 'BELUM SETORAN';
          });
          this.saveState();
          this.render();
          window.App.showToast(`Periode ${newDate} ditambahkan!`, 'success');
        }
      });
    }
  },

  render() {
    const thead = document.getElementById('monitoring-table-head');
    const tbody = document.getElementById('monitoring-table-body');
    if (!thead || !tbody) return;

    // Render Headers
    thead.innerHTML = `
      <tr class="bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider">
        <th class="py-3 px-4 text-left border-r border-emerald-800">NAMA</th>
        ${this.dates.map(date => `
          <th class="py-3 px-4 text-center border-r border-emerald-800 font-mono">
            ${date}
          </th>
        `).join('')}
      </tr>
    `;

    // Filter members
    let members = StorageService.getMembers();
    if (this.searchKeyword) {
      members = members.filter(m => m.nama.toLowerCase().includes(this.searchKeyword));
    }

    // Render Rows
    tbody.innerHTML = members.map(m => {
      const rowStatuses = this.matrixData[m.nama] || {};

      return `
        <tr class="hover:bg-slate-50 border-b border-slate-200 text-xs">
          <td class="excel-td font-bold text-slate-900 border-r border-slate-200">${m.nama}</td>
          ${this.dates.map(date => {
            const status = rowStatuses[date] || 'BELUM SETORAN';
            const isCompleted = status === 'COMPLETED';

            return `
              <td class="excel-td text-center border-r border-slate-200">
                <button onclick="MonitoringModule.toggleCellStatus('${m.nama}', '${date}')"
                  title="Klik untuk mengubah status"
                  class="w-full py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${isCompleted ? 'bg-emerald-800 text-white hover:bg-emerald-700' : 'bg-rose-800 text-white hover:bg-rose-700'}">
                  ${status}
                </button>
              </td>
            `;
          }).join('')}
        </tr>
      `;
    }).join('');

    // Summary calculation
    const currentActiveDate = this.dates[0] || '13/09/2026';
    let totalCompleted = 0;
    members.forEach(m => {
      if (this.matrixData[m.nama] && this.matrixData[m.nama][currentActiveDate] === 'COMPLETED') {
        totalCompleted++;
      }
    });

    const elComp = document.getElementById('monitoring-completed-count');
    const elRate = document.getElementById('monitoring-completion-rate');
    if (elComp) elComp.textContent = `${totalCompleted} / ${members.length}`;
    if (elRate) elRate.textContent = `${members.length ? Math.round((totalCompleted / members.length) * 100) : 0}%`;
  },

  toggleCellStatus(nama, date) {
    if (!this.matrixData[nama]) {
      this.matrixData[nama] = {};
    }

    const current = this.matrixData[nama][date] || 'BELUM SETORAN';
    const next = current === 'COMPLETED' ? 'BELUM SETORAN' : 'COMPLETED';
    this.matrixData[nama][date] = next;

    // If it's the current date ('13/09/2026'), sync back to Setoran
    if (date === '13/09/2026') {
      const setoranList = StorageService.getSetoran();
      const item = setoranList.find(s => s.nama.toLowerCase() === nama.toLowerCase());
      if (item) {
        item.status = next;
        StorageService.saveSetoran(item);
      }
    }

    this.saveState();
    this.render();
  }
};
