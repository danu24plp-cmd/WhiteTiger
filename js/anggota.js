/**
 * White Tiger Dashboard - Modul Struktur Organisasi & Anggota (Gambar 4)
 * Daftar lengkap anggota, jabatan, status aktif/cuti, dan tanggal keterangan.
 */

const AnggotaModule = {
  selectedJabatan: 'ALL',
  selectedStatus: 'ALL',
  searchKeyword: '',
  activeEditName: null,

  init() {
    this.bindEvents();
    this.render();

    window.addEventListener('wt:members-changed', () => this.render());
  },

  bindEvents() {
    // Search
    const search = document.getElementById('search-anggota');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchKeyword = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    // Filter Jabatan
    const filterJabatan = document.getElementById('filter-anggota-jabatan');
    if (filterJabatan) {
      filterJabatan.addEventListener('change', (e) => {
        this.selectedJabatan = e.target.value;
        this.render();
      });
    }

    // Filter Status
    const filterStatus = document.getElementById('filter-anggota-status');
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        this.selectedStatus = e.target.value;
        this.render();
      });
    }

    // Add Member Button
    const addBtn = document.getElementById('btn-add-anggota');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openAddModal());
    }

    // Form Submit
    const form = document.getElementById('anggota-modal-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveMemberForm();
      });
    }
  },

  getFilteredList() {
    let list = StorageService.getMembers();

    if (this.selectedJabatan !== 'ALL') {
      list = list.filter(m => m.jabatan === this.selectedJabatan);
    }

    if (this.selectedStatus !== 'ALL') {
      list = list.filter(m => m.status === this.selectedStatus);
    }

    if (this.searchKeyword) {
      list = list.filter(m => 
        m.nama.toLowerCase().includes(this.searchKeyword) ||
        (m.ket || '').toLowerCase().includes(this.searchKeyword) ||
        (m.jabatan || '').toLowerCase().includes(this.searchKeyword)
      );
    }

    return list;
  },

  render() {
    const list = this.getFilteredList();
    const tbody = document.getElementById('anggota-table-body');
    if (!tbody) return;

    // Counters
    const allMembers = StorageService.getMembers();
    const activeCount = allMembers.filter(m => m.status === 'AKTIF').length;
    const cutiCount = allMembers.filter(m => m.status.includes('CUTI') || m.status.includes('TIDAK AKTIF')).length;

    const elTotal = document.getElementById('anggota-total-count');
    const elAktif = document.getElementById('anggota-aktif-count');
    const elCuti = document.getElementById('anggota-cuti-count');

    if (elTotal) elTotal.textContent = allMembers.length;
    if (elAktif) elAktif.textContent = activeCount;
    if (elCuti) elCuti.textContent = cutiCount;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="py-8 text-center text-slate-400 text-xs">
            Tidak ada anggota yang cocok dengan filter pencarian.
          </td>
        </tr>
      `;
      return;
    }

    const currentRole = StorageService.getCurrentRole();

    tbody.innerHTML = list.map(m => {
      const jabatanBadge = this.getJabatanBadgeClass(m.jabatan);
      const isAktif = m.status === 'AKTIF';

      return `
        <tr class="hover:bg-blue-50/30 border-b border-slate-100 text-xs transition-colors">
          <td class="excel-td text-center font-mono text-slate-400">${m.no || '-'}</td>
          <td class="excel-td font-bold text-slate-900">${m.nama}</td>
          <td class="excel-td font-mono text-slate-500 text-center">${m.joinDate || '-'}</td>
          <td class="excel-td text-slate-500 text-center">${m.pj || '-'}</td>
          <td class="excel-td">
            <span class="tiger-badge text-[11px] ${jabatanBadge}">
              ${m.jabatan}
            </span>
          </td>
          <td class="excel-td text-center">
            <span class="${isAktif ? 'badge-status-aktif' : 'badge-status-cuti'}">
              ${m.status}
            </span>
          </td>
          <td class="excel-td text-slate-600 italic max-w-xs truncate" title="${m.ket}">${m.ket || '-'}</td>
          <td class="excel-td font-mono text-slate-500 text-center">${m.tglCuti || '-'}</td>
          <td class="excel-td font-mono text-slate-500 text-center">${m.tglAktifKembali || '-'}</td>
          <td class="excel-td text-right">
            <div class="flex items-center justify-end gap-1">
              <button onclick="AnggotaModule.openEditModal('${m.nama}')" title="Edit Anggota"
                class="p-1 text-slate-500 hover:text-[#0570e9] hover:bg-blue-50 rounded">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
              </button>
              ${currentRole === 'Admin' ? `
                <button onclick="AnggotaModule.deleteMemberPrompt('${m.nama}')" title="Hapus Anggota"
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

  getJabatanBadgeClass(jabatan) {
    switch (jabatan) {
      case 'PRESIDEN': return 'badge-role-presiden';
      case 'VICE PRESIDEN': return 'badge-role-vice-presiden';
      case 'The Sergeant at Arms': return 'badge-role-sergeant';
      case 'The Enforcer': return 'badge-role-enforcer';
      case 'The Road Captain': return 'badge-role-road-captain';
      case 'The Business Director': return 'badge-role-director';
      case 'The Treasurer': return 'badge-role-treasurer';
      case 'The Tail Gunner': return 'badge-role-tail-gunner';
      default: return 'badge-role-originally';
    }
  },

  openAddModal() {
    this.activeEditName = null;
    const form = document.getElementById('anggota-modal-form');
    if (form) form.reset();

    const tglInput = document.getElementById('input-anggota-join');
    if (tglInput) tglInput.value = new Date().toISOString().split('T')[0];

    document.getElementById('modal-anggota-title').textContent = 'Tambah Anggota Baru';
    ItemsModule.showModal('modal-anggota');
  },

  openEditModal(nama) {
    const list = StorageService.getMembers();
    const m = list.find(mem => mem.nama.toLowerCase() === nama.toLowerCase());
    if (!m) return;

    this.activeEditName = m.nama;

    document.getElementById('input-anggota-nama').value = m.nama;
    document.getElementById('input-anggota-join').value = m.joinDate || '';
    document.getElementById('input-anggota-pj').value = m.pj || '-';
    document.getElementById('select-anggota-jabatan').value = m.jabatan || 'The Originally';
    document.getElementById('select-anggota-status').value = m.status || 'AKTIF';
    document.getElementById('input-anggota-ket').value = m.ket || '';
    document.getElementById('input-anggota-cuti').value = m.tglCuti || '';
    document.getElementById('input-anggota-kembali').value = m.tglAktifKembali || '';

    document.getElementById('modal-anggota-title').textContent = `Edit Anggota: ${m.nama}`;
    ItemsModule.showModal('modal-anggota');
  },

  saveMemberForm() {
    const nama = document.getElementById('input-anggota-nama').value.trim();
    const joinDate = document.getElementById('input-anggota-join').value;
    const pj = document.getElementById('input-anggota-pj').value.trim() || '-';
    const jabatan = document.getElementById('select-anggota-jabatan').value;
    const status = document.getElementById('select-anggota-status').value;
    const ket = document.getElementById('input-anggota-ket').value.trim();
    const tglCuti = document.getElementById('input-anggota-cuti').value.trim();
    const tglAktifKembali = document.getElementById('input-anggota-kembali').value.trim();

    if (!nama) {
      window.App.showToast('Nama anggota tidak boleh kosong.', 'warning');
      return;
    }

    StorageService.saveMember({
      nama,
      joinDate,
      pj,
      jabatan,
      status,
      ket,
      tglCuti,
      tglAktifKembali
    });

    window.App.showToast(`Data anggota ${nama} berhasil disimpan!`, 'success');
    ItemsModule.closeModal('modal-anggota');
  },

  deleteMemberPrompt(nama) {
    if (confirm(`Yakin ingin menghapus anggota "${nama}" dari daftar organisasi?`)) {
      StorageService.deleteMember(nama);
      window.App.showToast(`Anggota ${nama} telah dihapus.`, 'info');
    }
  }
};
