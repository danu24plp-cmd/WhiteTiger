/**
 * White Tiger Dashboard - Central Storage & State Layer
 * Stores Members, Salaries & Deposits, ROC Vault Transactions, Attendance Matrix, Rates, and Auth.
 */

const STORAGE_KEYS = {
  RATES: 'wt_rates_v2',
  MEMBERS: 'wt_members_v2',
  SETORAN: 'wt_setoran_v2',
  BRANGKAS: 'wt_brangkas_v2',
  MONITORING: 'wt_monitoring_v2',
  FILES: 'wt_dashboard_files_v1',
  USERS: 'wt_dashboard_users_v1',
  LOGS: 'wt_dashboard_logs_v1',
  SETTINGS: 'wt_dashboard_settings_v1',
  CURRENT_ROLE: 'wt_dashboard_current_role_v1',
  ACTIVE_USER: 'wt_dashboard_active_user_v1',
  SESSION: 'wt_dashboard_session_v1'
};

// Default Official Salary Rates as requested:
// Batu Mentah: 100 pcs (1 paket) = $75 (Uang Bersih)
// Emas: 1 pcs = $1.3 (Uang Bersih)
// Tembaga: 1 pcs = $1.5 (Uang Bersih)
// Besi: 1 pcs = $1.0 (Uang Bersih)
// Bluni Kantor: 1 pcs = $1.5 (Uang ROC)
const DEFAULT_RATES = {
  batuMentahPaket: 75, // $75 per paket (100 pcs)
  emasPcs: 1.3,        // $1.3 per pcs
  tembagaPcs: 1.5,     // $1.5 per pcs
  besiPcs: 1.0,        // $1.0 per pcs
  bluniPcs: 1.5        // $1.5 per pcs (MENGGUNAKAN UANG ROC)
};

// Seed 35+ Members from Image 4 (Table4)
const SEED_MEMBERS = [
  { no: 1, nama: 'Rafli', joinDate: '2025-01-15', pj: '-', jabatan: 'PRESIDEN', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 2, nama: 'Uce', joinDate: '2025-01-20', pj: '-', jabatan: 'VICE PRESIDEN', status: 'TIDAK AKTIF/CUTI', ket: 'SAMPE BELI PC', tglCuti: '2026-08-01', tglAktifKembali: '' },
  { no: 3, nama: 'Sehun', joinDate: '2025-01-25', pj: '-', jabatan: 'VICE PRESIDEN', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 4, nama: 'Jack', joinDate: '2025-02-01', pj: '-', jabatan: 'The Sergeant at Arms', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 17, nama: 'Bryan / Mas Yan', joinDate: '2025-02-10', pj: '-', jabatan: 'The Enforcer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 5, nama: 'Vincent', joinDate: '2025-02-12', pj: '-', jabatan: 'The Enforcer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 6, nama: 'Dio', joinDate: '2025-02-15', pj: '-', jabatan: 'The Enforcer', status: 'TIDAK AKTIF/CUTI', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 15, nama: 'Zenn', joinDate: '2025-02-20', pj: '-', jabatan: 'The Enforcer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 7, nama: 'Croz', joinDate: '2025-03-01', pj: '-', jabatan: 'The Road Captain', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 8, nama: 'Almer', joinDate: '2025-03-05', pj: '-', jabatan: 'The Road Captain', status: 'TIDAK AKTIF/CUTI', ket: 'DINAS DI LUAR KOTA', tglCuti: '10/09/2026', tglAktifKembali: '13/09/2026' },
  { no: 67, nama: 'JAENAP', joinDate: '2025-03-10', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 9, nama: 'Cipung', joinDate: '2025-03-15', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 10, nama: 'Jollie', joinDate: '2025-03-20', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 11, nama: 'Jocelyn', joinDate: '2025-03-25', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 12, nama: 'Rena', joinDate: '2025-04-01', pj: '-', jabatan: 'The Treasurer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 13, nama: 'Wojak', joinDate: '2025-04-05', pj: '-', jabatan: 'The Treasurer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 14, nama: 'Genat', joinDate: '2025-04-10', pj: '-', jabatan: 'The Treasurer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 16, nama: 'Jigsaw', joinDate: '2025-04-15', pj: '-', jabatan: 'The Tail Gunner', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 18, nama: 'Karamel', joinDate: '2025-05-01', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 19, nama: 'Akash', joinDate: '2025-05-05', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 20, nama: 'Jacob', joinDate: '2025-05-10', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 21, nama: 'Biwa', joinDate: '2025-05-15', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 22, nama: 'Starla', joinDate: '2025-05-20', pj: '-', jabatan: 'The Originally', status: 'TIDAK AKTIF/CUTI', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 23, nama: 'Goy', joinDate: '2025-06-01', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 24, nama: 'Jesslyn', joinDate: '2025-06-05', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 25, nama: 'Hani', joinDate: '2025-06-10', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 26, nama: 'Jack D Ash', joinDate: '2025-06-15', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 27, nama: 'Jamed', joinDate: '2025-07-01', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 28, nama: 'Jarot', joinDate: '2025-07-05', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 29, nama: 'Seika', joinDate: '2025-07-10', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 30, nama: 'Jayden', joinDate: '2025-07-15', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 31, nama: 'Kael', joinDate: '2025-07-20', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 32, nama: 'Kentang', joinDate: '2025-07-25', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 33, nama: 'Khai', joinDate: '2025-08-01', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 34, nama: 'Kidra', joinDate: '2025-08-05', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 35, nama: 'Lucas', joinDate: '2025-08-10', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' }
];

// Seed Setoran Data from Image 3 (Setoran_2)
const SEED_SETORAN = [
  { id: 'st-01', nama: 'Rafli', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-02', nama: 'Uce', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-03', nama: 'Sehun', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-04', nama: 'Jack', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 181, status: 'COMPLETED' },
  { id: 'st-05', nama: 'Vincent', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-06', nama: 'Dio', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-07', nama: 'Croz', batuMentah: 0, emas: 98, tembaga: 80, besi: 90, bluni: 0, status: 'COMPLETED' },
  { id: 'st-08', nama: 'Almer', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-09', nama: 'Cipung', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-10', nama: 'Jollie', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-11', nama: 'Jocelyn', batuMentah: 50, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-12', nama: 'Rena', batuMentah: 50, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-13', nama: 'Wojak', batuMentah: 16, emas: 25, tembaga: 19, besi: 36, bluni: 0, status: 'COMPLETED' },
  { id: 'st-14', nama: 'Genat', batuMentah: 50, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-15', nama: 'Zenn', batuMentah: 0, emas: 93, tembaga: 238, besi: 113, bluni: 0, status: 'COMPLETED' },
  { id: 'st-16', nama: 'Jigsaw', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-17', nama: 'Bryan / Mas Yan', batuMentah: 0, emas: 50, tembaga: 30, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-18', nama: 'Karamel', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-19', nama: 'Akash', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-20', nama: 'Jacob', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-21', nama: 'Biwa', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-22', nama: 'Starla', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-23', nama: 'Goy', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-24', nama: 'Jesslyn', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-25', nama: 'Hani', batuMentah: 18, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-26', nama: 'Jack D Ash', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-27', nama: 'Jamed', batuMentah: 15, emas: 0, tembaga: 0, besi: 0, bluni: 170, status: 'COMPLETED' },
  { id: 'st-28', nama: 'Jarot', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-29', nama: 'Seika', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-30', nama: 'Jayden', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-31', nama: 'Kael', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-32', nama: 'Kentang', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-33', nama: 'Khai', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-34', nama: 'Kidra', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-35', nama: 'Lucas', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' }
];

// Seed Brangkas ROC Transactions from Image 1
const SEED_BRANGKAS = [
  { id: 'trx-1', tanggal: '01/08/25', nama: 'Rafli', aktivitas: 'Setoran Hasil Pertambangan & Logam', masuk: 12500, keluar: 0, action: 'PENJUALAN', penjualanBadside: '', pembelianBadside: '' },
  { id: 'trx-2', tanggal: '01/08/25', nama: 'Almer', aktivitas: 'Pembelian logistik senjata', masuk: 0, keluar: 4500, action: 'PEMBELIAN', penjualanBadside: '', pembelianBadside: 'HCMC' },
  { id: 'trx-3', tanggal: '01/08/25', nama: 'Jack', aktivitas: 'Bonus Operasional Event Kota', masuk: 0, keluar: 1200, action: 'REWARD', penjualanBadside: '', pembelianBadside: '' },
  { id: 'trx-4', tanggal: '01/08/25', nama: 'Croz', aktivitas: 'Patroli & Escort VIP', masuk: 0, keluar: 800, action: 'ACTIVITY', penjualanBadside: '', pembelianBadside: '' },
  { id: 'trx-5', tanggal: '01/08/25', nama: 'Jocelyn', aktivitas: 'Pencairan Gaji Periode 1', masuk: 0, keluar: 3750, action: 'GAJI', penjualanBadside: '', pembelianBadside: '' },
  { id: 'trx-6', tanggal: '01/08/25', nama: 'Rena', aktivitas: 'Pengisian Amunisi Kantor', masuk: 0, keluar: 1500, action: 'ACTIVITY', penjualanBadside: '', pembelianBadside: '' },
  { id: 'trx-7', tanggal: '01/08/25', nama: 'Bryan / Mas Yan', aktivitas: 'Pembersihan Kas Gelap', masuk: 8000, keluar: 1600, action: 'CUCI UANG', penjualanBadside: '', pembelianBadside: '' },
  { id: 'trx-8', tanggal: '01/08/25', nama: 'Zenn', aktivitas: 'Setoran Emas & Tembaga', masuk: 3500, keluar: 0, action: 'SETORAN', penjualanBadside: '', pembelianBadside: '' },
  { id: 'trx-9', tanggal: '01/08/25', nama: 'System', aktivitas: 'Penerimaan Kas Gelap Anonim', masuk: 2000, keluar: 0, action: 'TANPA KET.', penjualanBadside: '', pembelianBadside: '' }
];

// Seed Monitoring Dates from Image 2
const SEED_MONITORING_DATES = ['13/09/2026', '10/08/2025', '17/08/2025', '31/08/2025'];

const StorageService = {
  init() {
    // Rates
    if (!localStorage.getItem(STORAGE_KEYS.RATES)) {
      localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(DEFAULT_RATES));
    }
    // Members
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(SEED_MEMBERS));
    }
    // Setoran
    if (!localStorage.getItem(STORAGE_KEYS.SETORAN)) {
      localStorage.setItem(STORAGE_KEYS.SETORAN, JSON.stringify(SEED_SETORAN));
    }
    // Brangkas
    if (!localStorage.getItem(STORAGE_KEYS.BRANGKAS)) {
      localStorage.setItem(STORAGE_KEYS.BRANGKAS, JSON.stringify(SEED_BRANGKAS));
    }
    // Session & Auth
    if (!localStorage.getItem(STORAGE_KEYS.SESSION)) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
        id: 'usr-admin-01',
        name: 'Administrator',
        email: 'admin@whitetiger.internal',
        password: 'admin123',
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, 'Admin');
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, localStorage.getItem(STORAGE_KEYS.SESSION));
    }
  },

  // ==================== RATES ====================
  getRates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATES);
      return data ? JSON.parse(data) : DEFAULT_RATES;
    } catch (e) {
      return DEFAULT_RATES;
    }
  },

  saveRates(newRates) {
    const updated = { ...this.getRates(), ...newRates };
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(updated));
    this.addLog('RATES_UPDATE', 'Salary conversion rates updated', this.getActiveUser().name);
    window.dispatchEvent(new CustomEvent('wt:rates-changed'));
    return updated;
  },

  // ==================== SETORAN & GAJI CALCULATIONS ====================
  getSetoran() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETORAN);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  calculateGaji(record) {
    const rates = this.getRates();
    const batuPaket = parseFloat(record.batuMentah) || 0;
    const emas = parseFloat(record.emas) || 0;
    const tembaga = parseFloat(record.tembaga) || 0;
    const besi = parseFloat(record.besi) || 0;
    const bluni = parseFloat(record.bluni) || 0;

    // Total Setoran Pcs = (Batu Paket * 100) + Emas + Tembaga + Besi + Bluni
    const totalSetoranPcs = (batuPaket * 100) + emas + tembaga + besi + bluni;

    // Gaji Components
    // Batu Mentah: 100 pcs (1 paket) = $75 (Uang Bersih)
    const gajiBatu = batuPaket * rates.batuMentahPaket;
    // Emas: 1 pcs = $1.3 (Uang Bersih)
    const gajiEmas = +(emas * rates.emasPcs).toFixed(1);
    // Tembaga: 1 pcs = $1.5 (Uang Bersih)
    const gajiTembaga = +(tembaga * rates.tembagaPcs).toFixed(1);
    // Besi: 1 pcs = $1.0 (Uang Bersih)
    const gajiBesi = +(besi * rates.besiPcs).toFixed(1);
    // Bluni: 1 pcs = $1.5 (MENGGUNAKAN UANG ROC)
    const gajiBluni = +(bluni * rates.bluniPcs).toFixed(1);

    // Gaji Full Uang Bersih = Batu + Emas + Tembaga + Besi
    const gajiBersih = +(gajiBatu + gajiEmas + gajiTembaga + gajiBesi).toFixed(1);
    // Gaji Full ROC = Bluni Kantor
    const gajiRoc = gajiBluni;

    return {
      totalSetoranPcs,
      gajiBatu,
      gajiEmas,
      gajiTembaga,
      gajiBesi,
      gajiBluni,
      gajiBersih,
      gajiRoc,
      displayGaji: `$${gajiBersih.toLocaleString()} & $${gajiRoc.toLocaleString()}`
    };
  },

  saveSetoran(record) {
    const list = this.getSetoran();
    const index = list.findIndex(item => item.id === record.id || item.nama.toLowerCase() === record.nama.toLowerCase());

    if (index >= 0) {
      list[index] = { ...list[index], ...record };
    } else {
      list.push({
        id: 'st-' + Date.now(),
        status: 'COMPLETED',
        ...record
      });
    }

    localStorage.setItem(STORAGE_KEYS.SETORAN, JSON.stringify(list));
    this.addLog('SETORAN_SAVE', `Setoran recorded for ${record.nama}`, this.getActiveUser().name);
    window.dispatchEvent(new CustomEvent('wt:setoran-changed'));
    return list;
  },

  deleteSetoran(id) {
    const list = this.getSetoran().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SETORAN, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('wt:setoran-changed'));
    return true;
  },

  // ==================== MEMBERS ====================
  getMembers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveMember(member) {
    const list = this.getMembers();
    const index = list.findIndex(m => m.nama.toLowerCase() === member.nama.toLowerCase());

    if (index >= 0) {
      list[index] = { ...list[index], ...member };
    } else {
      const maxNo = list.reduce((max, m) => Math.max(max, m.no || 0), 0);
      list.push({
        no: maxNo + 1,
        joinDate: new Date().toISOString().split('T')[0],
        pj: '-',
        status: 'AKTIF',
        ket: '',
        tglCuti: '',
        tglAktifKembali: '',
        ...member
      });
    }

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(list));
    this.addLog('MEMBER_UPDATE', `Member updated: ${member.nama}`, this.getActiveUser().name);
    window.dispatchEvent(new CustomEvent('wt:members-changed'));
    return list;
  },

  deleteMember(nama) {
    const list = this.getMembers().filter(m => m.nama.toLowerCase() !== nama.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(list));
    this.addLog('MEMBER_DELETE', `Member removed: ${nama}`, this.getActiveUser().name);
    window.dispatchEvent(new CustomEvent('wt:members-changed'));
    return true;
  },

  // ==================== BRANGKAS ROC ====================
  getBrangkas() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRANGKAS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addBrangkasTrx(trx) {
    const list = this.getBrangkas();
    const newTrx = {
      id: 'trx-' + Date.now(),
      tanggal: trx.tanggal || new Date().toLocaleDateString('en-GB'),
      masuk: parseFloat(trx.masuk) || 0,
      keluar: parseFloat(trx.keluar) || 0,
      action: trx.action || 'SETORAN',
      penjualanBadside: trx.penjualanBadside || '',
      pembelianBadside: trx.pembelianBadside || '',
      ...trx
    };
    list.unshift(newTrx);
    localStorage.setItem(STORAGE_KEYS.BRANGKAS, JSON.stringify(list));
    this.addLog('VAULT_TRX', `${newTrx.action}: $${newTrx.masuk || newTrx.keluar}`, this.getActiveUser().name);
    window.dispatchEvent(new CustomEvent('wt:brangkas-changed'));
    return newTrx;
  },

  deleteBrangkasTrx(id) {
    const list = this.getBrangkas().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.BRANGKAS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('wt:brangkas-changed'));
    return true;
  },

  getBrangkasTotals() {
    const list = this.getBrangkas();
    let totalMasuk = 0;
    let totalKeluar = 0;
    let trxMasuk = 0;
    let trxKeluar = 0;
    let uangHilang = 0;
    let tanpaKeterangan = 0;

    list.forEach(t => {
      const m = parseFloat(t.masuk) || 0;
      const k = parseFloat(t.keluar) || 0;
      if (m > 0) { totalMasuk += m; trxMasuk++; }
      if (k > 0) { totalKeluar += k; trxKeluar++; }
      if (t.action === 'TANPA KET.') { tanpaKeterangan += m; }
    });

    const totalKeuntungan = totalMasuk - totalKeluar;
    const persenKeuntungan = totalMasuk > 0 ? ((totalKeuntungan / totalMasuk) * 100).toFixed(1) : '0.0';

    return {
      totalMasuk,
      totalKeluar,
      trxMasuk,
      trxKeluar,
      totalKeuntungan,
      persenKeuntungan,
      uangHilang,
      tanpaKeterangan
    };
  },

  // ==================== MONITORING MATRIX ====================
  getMonitoringMatrix() {
    const members = this.getMembers();
    const setoran = this.getSetoran();
    const dates = SEED_MONITORING_DATES;

    // Return structured map of member -> date -> status
    return members.map(member => {
      const setoranRec = setoran.find(s => s.nama.toLowerCase() === member.nama.toLowerCase());
      const currentStatus = setoranRec ? setoranRec.status : 'BELUM SETORAN';

      return {
        nama: member.nama,
        dates: {
          '13/09/2026': currentStatus,
          '10/08/2025': member.no % 3 === 0 ? 'COMPLETED' : 'BELUM SETORAN',
          '17/08/2025': member.no % 2 === 0 ? 'COMPLETED' : 'BELUM SETORAN',
          '31/08/2025': 'BELUM SETORAN'
        }
      };
    });
  },

  // ==================== SESSION & AUDIT LOGS ====================
  getSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getSession();
  },

  setSession(user) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, user.role || 'User');
    this.addLog('LOGIN', 'User logged in', user.name);
    window.dispatchEvent(new CustomEvent('wt:auth-changed', { detail: { user, authenticated: true } }));
    window.dispatchEvent(new CustomEvent('wt:role-changed', { detail: { role: user.role, user } }));
  },

  clearSession() {
    const current = this.getSession();
    const userName = current ? current.name : 'User';
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    this.addLog('LOGOUT', 'User logged out', userName);
    window.dispatchEvent(new CustomEvent('wt:auth-changed', { detail: { user: null, authenticated: false } }));
  },

  authenticate(email, password) {
    if (email.toLowerCase().includes('admin') && (password === 'admin123' || password === 'tiger123')) {
      return { success: true, user: { name: 'Administrator', email, role: 'Admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' } };
    }
    if (email.toLowerCase().includes('alex') || password === 'tiger123') {
      return { success: true, user: { name: 'Alex Hunter', email, role: 'User', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' } };
    }
    return { success: false, message: 'Invalid credentials. Use demo accounts or tiger123.' };
  },

  updateUserPassword(email, newPassword) {
    this.addLog('PASSWORD_RESET', 'Password updated', email);
    return true;
  },

  getCurrentRole() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE) || 'Admin';
  },

  setCurrentRole(role) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, role);
    window.dispatchEvent(new CustomEvent('wt:role-changed', { detail: { role } }));
  },

  getActiveUser() {
    const s = this.getSession();
    return s || { name: 'Administrator', email: 'admin@whitetiger.internal', role: 'Admin' };
  },

  getLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addLog(action, resource, performedBy = 'User', status = 'Success') {
    const logs = this.getLogs();
    const newLog = {
      id: 'log-' + Date.now(),
      action,
      resource,
      performedBy,
      role: this.getCurrentRole(),
      status,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1'
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('wt:logs-changed'));
    return newLog;
  },

  // Legacy Files support for assets
  getFiles() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FILES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addFile(fileData) {
    const files = this.getFiles();
    files.unshift(fileData);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    window.dispatchEvent(new CustomEvent('wt:data-changed'));
    return fileData;
  },

  deleteFile(id) {
    const files = this.getFiles().filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    window.dispatchEvent(new CustomEvent('wt:data-changed'));
    return true;
  },

  getSettings() {
    return { maxUploadSizeMb: 50 };
  }
};

// Initialize
StorageService.init();
