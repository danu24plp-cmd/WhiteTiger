/**
 * White Tiger Dashboard - Firestore Service
 * Menyediakan semua operasi CRUD async untuk koleksi Firestore:
 * - members (anggota)
 * - setoran (penggajian)
 * - brangkas (ROC vault)
 * - materials (berangkas bahan)
 * - weapons (berangkas senjata)
 * - logs (audit log)
 * - rates (tarif gaji)
 */

const DEFAULT_RATES = {
  batuMentahPaket: 75,
  emasPcs: 1.3,
  tembagaPcs: 1.5,
  besiPcs: 1.0,
  bluniPcs: 1.5
};

const SEED_MEMBERS = [
  { no: 1, nama: 'Rafli', joinDate: '2025-01-15', pj: '-', jabatan: 'PRESIDEN', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 2, nama: 'Uce', joinDate: '2025-01-20', pj: '-', jabatan: 'VICE PRESIDEN', status: 'TIDAK AKTIF/CUTI', ket: 'SAMPE BELI PC', tglCuti: '2026-08-01', tglAktifKembali: '' },
  { no: 3, nama: 'Sehun', joinDate: '2025-01-25', pj: '-', jabatan: 'VICE PRESIDEN', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 4, nama: 'Jack', joinDate: '2025-02-01', pj: '-', jabatan: 'The Sergeant at Arms', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 5, nama: 'Vincent', joinDate: '2025-02-12', pj: '-', jabatan: 'The Enforcer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 6, nama: 'Dio', joinDate: '2025-02-15', pj: '-', jabatan: 'The Enforcer', status: 'TIDAK AKTIF/CUTI', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 7, nama: 'Croz', joinDate: '2025-03-01', pj: '-', jabatan: 'The Road Captain', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 8, nama: 'Almer', joinDate: '2025-03-05', pj: '-', jabatan: 'The Road Captain', status: 'TIDAK AKTIF/CUTI', ket: 'DINAS DI LUAR KOTA', tglCuti: '10/09/2026', tglAktifKembali: '13/09/2026' },
  { no: 9, nama: 'Cipung', joinDate: '2025-03-15', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 10, nama: 'Jollie', joinDate: '2025-03-20', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 11, nama: 'Jocelyn', joinDate: '2025-03-25', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 12, nama: 'Rena', joinDate: '2025-04-01', pj: '-', jabatan: 'The Treasurer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 13, nama: 'Wojak', joinDate: '2025-04-05', pj: '-', jabatan: 'The Treasurer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 14, nama: 'Genat', joinDate: '2025-04-10', pj: '-', jabatan: 'The Treasurer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 15, nama: 'Zenn', joinDate: '2025-02-20', pj: '-', jabatan: 'The Enforcer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 16, nama: 'Jigsaw', joinDate: '2025-04-15', pj: '-', jabatan: 'The Tail Gunner', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 17, nama: 'Bryan / Mas Yan', joinDate: '2025-02-10', pj: '-', jabatan: 'The Enforcer', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
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
  { no: 35, nama: 'Lucas', joinDate: '2025-08-10', pj: '-', jabatan: 'The Originally', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' },
  { no: 67, nama: 'JAENAP', joinDate: '2025-03-10', pj: '-', jabatan: 'The Business Director', status: 'AKTIF', ket: '', tglCuti: '', tglAktifKembali: '' }
];

const SEED_SETORAN = [
  { id: 'st-01', nama: 'Rafli', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'BELUM SETORAN' },
  { id: 'st-04', nama: 'Jack', batuMentah: 0, emas: 0, tembaga: 0, besi: 0, bluni: 181, status: 'COMPLETED' },
  { id: 'st-07', nama: 'Croz', batuMentah: 0, emas: 98, tembaga: 80, besi: 90, bluni: 0, status: 'COMPLETED' },
  { id: 'st-11', nama: 'Jocelyn', batuMentah: 50, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-12', nama: 'Rena', batuMentah: 50, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-13', nama: 'Wojak', batuMentah: 16, emas: 25, tembaga: 19, besi: 36, bluni: 0, status: 'COMPLETED' },
  { id: 'st-14', nama: 'Genat', batuMentah: 50, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-15', nama: 'Zenn', batuMentah: 0, emas: 93, tembaga: 238, besi: 113, bluni: 0, status: 'COMPLETED' },
  { id: 'st-17', nama: 'Bryan / Mas Yan', batuMentah: 0, emas: 50, tembaga: 30, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-25', nama: 'Hani', batuMentah: 18, emas: 0, tembaga: 0, besi: 0, bluni: 0, status: 'COMPLETED' },
  { id: 'st-27', nama: 'Jamed', batuMentah: 15, emas: 0, tembaga: 0, besi: 0, bluni: 170, status: 'COMPLETED' }
];

const SEED_BRANGKAS = [
  { id: 'trx-1', tanggal: '01/08/25', nama: 'Rafli', aktivitas: 'Setoran Hasil Pertambangan & Logam', masuk: 12500, keluar: 0, action: 'PENJUALAN' },
  { id: 'trx-2', tanggal: '01/08/25', nama: 'Almer', aktivitas: 'Pembelian logistik senjata', masuk: 0, keluar: 4500, action: 'PEMBELIAN' },
  { id: 'trx-3', tanggal: '01/08/25', nama: 'Jack', aktivitas: 'Bonus Operasional Event Kota', masuk: 0, keluar: 1200, action: 'REWARD' },
  { id: 'trx-4', tanggal: '01/08/25', nama: 'Croz', aktivitas: 'Patroli & Escort VIP', masuk: 0, keluar: 800, action: 'ACTIVITY' },
  { id: 'trx-5', tanggal: '01/08/25', nama: 'Jocelyn', aktivitas: 'Pencairan Gaji Periode 1', masuk: 0, keluar: 3750, action: 'GAJI' },
  { id: 'trx-6', tanggal: '01/08/25', nama: 'Rena', aktivitas: 'Pengisian Amunisi Kantor', masuk: 0, keluar: 1500, action: 'ACTIVITY' },
  { id: 'trx-7', tanggal: '01/08/25', nama: 'Bryan / Mas Yan', aktivitas: 'Pembersihan Kas Gelap', masuk: 8000, keluar: 1600, action: 'CUCI UANG' },
  { id: 'trx-8', tanggal: '01/08/25', nama: 'Zenn', aktivitas: 'Setoran Emas & Tembaga', masuk: 3500, keluar: 0, action: 'SETORAN' },
  { id: 'trx-9', tanggal: '01/08/25', nama: 'System', aktivitas: 'Penerimaan Kas Gelap Anonim', masuk: 2000, keluar: 0, action: 'TANPA KET.' }
];

const FirestoreService = {
  _listeners: {},

  get db() {
    return FirebaseApp.getDb();
  },

  // ==================== SEED DATA ====================
  async seedInitialData() {
    // Cek apakah data sudah ada
    const ratesDoc = await this.db.collection('config').doc('rates').get();
    if (ratesDoc.exists) {
      console.log('Data sudah ada di Firestore, melewati seed.');
      return;
    }

    console.log('Menyemai data awal ke Firestore...');
    const batch = this.db.batch();

    // Rates
    batch.set(this.db.collection('config').doc('rates'), DEFAULT_RATES);

    // Members
    SEED_MEMBERS.forEach(m => {
      const ref = this.db.collection('members').doc('member-' + m.no);
      batch.set(ref, { ...m, _id: 'member-' + m.no, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });

    // Setoran
    SEED_SETORAN.forEach(s => {
      const ref = this.db.collection('setoran').doc(s.id);
      batch.set(ref, { ...s, _id: s.id, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });

    // Brangkas
    SEED_BRANGKAS.forEach(t => {
      const ref = this.db.collection('brangkas').doc(t.id);
      batch.set(ref, { ...t, _id: t.id, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();
    console.log('Data awal berhasil disemai ke Firestore.');
  },

  // ==================== RATES ====================
  async getRates() {
    const doc = await this.db.collection('config').doc('rates').get();
    return doc.exists ? doc.data() : DEFAULT_RATES;
  },

  async saveRates(newRates) {
    await this.db.collection('config').doc('rates').set(newRates, { merge: true });
    window.dispatchEvent(new CustomEvent('wt:rates-changed'));
    return newRates;
  },

  // ==================== MEMBERS ====================
  listenMembers(callback) {
    const unsub = this.db.collection('members')
      .orderBy('no', 'asc')
      .onSnapshot(snapshot => {
        const members = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
        callback(members);
        window.dispatchEvent(new CustomEvent('wt:members-changed', { detail: members }));
      }, err => console.error('listenMembers error:', err));
    this._listeners['members'] = unsub;
    return unsub;
  },

  async getMembers() {
    const snap = await this.db.collection('members').orderBy('no', 'asc').get();
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  },

  async saveMember(member) {
    const docId = member._docId || ('member-' + Date.now());
    const data = { ...member, _id: docId, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    delete data._docId;
    await this.db.collection('members').doc(docId).set(data, { merge: true });
    window.dispatchEvent(new CustomEvent('wt:members-changed'));
    return data;
  },

  async deleteMember(docId) {
    await this.db.collection('members').doc(docId).delete();
    window.dispatchEvent(new CustomEvent('wt:members-changed'));
    return true;
  },

  // ==================== SETORAN ====================
  listenSetoran(callback) {
    const unsub = this.db.collection('setoran')
      .onSnapshot(snapshot => {
        const setoran = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
        callback(setoran);
        window.dispatchEvent(new CustomEvent('wt:setoran-changed', { detail: setoran }));
      }, err => console.error('listenSetoran error:', err));
    this._listeners['setoran'] = unsub;
    return unsub;
  },

  async getSetoran() {
    const snap = await this.db.collection('setoran').get();
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  },

  async saveSetoran(record) {
    const docId = record._docId || record.id || ('st-' + Date.now());
    const data = { ...record, _id: docId, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    delete data._docId;
    await this.db.collection('setoran').doc(docId).set(data, { merge: true });
    window.dispatchEvent(new CustomEvent('wt:setoran-changed'));
    return data;
  },

  async deleteSetoran(docId) {
    await this.db.collection('setoran').doc(docId).delete();
    window.dispatchEvent(new CustomEvent('wt:setoran-changed'));
    return true;
  },

  // Hitung Gaji (pure function, tidak perlu Firestore)
  calculateGaji(record, rates) {
    rates = rates || DEFAULT_RATES;
    const batuPaket = parseFloat(record.batuMentah) || 0;
    const emas = parseFloat(record.emas) || 0;
    const tembaga = parseFloat(record.tembaga) || 0;
    const besi = parseFloat(record.besi) || 0;
    const bluni = parseFloat(record.bluni) || 0;

    const totalSetoranPcs = (batuPaket * 100) + emas + tembaga + besi + bluni;
    const gajiBatu = batuPaket * rates.batuMentahPaket;
    const gajiEmas = +(emas * rates.emasPcs).toFixed(1);
    const gajiTembaga = +(tembaga * rates.tembagaPcs).toFixed(1);
    const gajiBesi = +(besi * rates.besiPcs).toFixed(1);
    const gajiBluni = +(bluni * rates.bluniPcs).toFixed(1);
    const gajiBersih = +(gajiBatu + gajiEmas + gajiTembaga + gajiBesi).toFixed(1);
    const gajiRoc = gajiBluni;

    return { totalSetoranPcs, gajiBatu, gajiEmas, gajiTembaga, gajiBesi, gajiBluni, gajiBersih, gajiRoc,
      displayGaji: `$${gajiBersih.toLocaleString()} & $${gajiRoc.toLocaleString()}` };
  },

  // ==================== BRANGKAS ROC ====================
  listenBrangkas(callback) {
    const unsub = this.db.collection('brangkas')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const brangkas = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
        callback(brangkas);
        window.dispatchEvent(new CustomEvent('wt:brangkas-changed', { detail: brangkas }));
      }, err => console.error('listenBrangkas error:', err));
    this._listeners['brangkas'] = unsub;
    return unsub;
  },

  async getBrangkas() {
    const snap = await this.db.collection('brangkas').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  },

  async addBrangkasTrx(trx) {
    const docId = 'trx-' + Date.now();
    const data = {
      ...trx,
      _id: docId,
      tanggal: trx.tanggal || new Date().toLocaleDateString('id-ID'),
      masuk: parseFloat(trx.masuk) || 0,
      keluar: parseFloat(trx.keluar) || 0,
      action: trx.action || 'SETORAN',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await this.db.collection('brangkas').doc(docId).set(data);
    window.dispatchEvent(new CustomEvent('wt:brangkas-changed'));
    return data;
  },

  async deleteBrangkasTrx(docId) {
    await this.db.collection('brangkas').doc(docId).delete();
    window.dispatchEvent(new CustomEvent('wt:brangkas-changed'));
    return true;
  },

  // ==================== MATERIALS (Berangkas Bahan) ====================
  listenMaterials(callback) {
    const unsub = this.db.collection('materials')
      .orderBy('nama', 'asc')
      .onSnapshot(snapshot => {
        const materials = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
        callback(materials);
        window.dispatchEvent(new CustomEvent('wt:materials-changed', { detail: materials }));
      }, err => console.error('listenMaterials error:', err));
    this._listeners['materials'] = unsub;
    return unsub;
  },

  async getMaterials() {
    const snap = await this.db.collection('materials').orderBy('nama', 'asc').get();
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  },

  async depositMaterial(materialData) {
    const docId = materialData._docId || ('mat-' + Date.now());
    const existing = materialData._docId ? (await this.db.collection('materials').doc(docId).get()).data() : null;
    const currentQty = existing ? (existing.qty || 0) : 0;
    const newQty = currentQty + (parseFloat(materialData.qty) || 0);

    const data = {
      nama: materialData.nama,
      unit: materialData.unit || 'pcs',
      hargaPerUnit: parseFloat(materialData.hargaPerUnit) || 0,
      qty: newQty,
      totalNilai: newQty * (parseFloat(materialData.hargaPerUnit) || 0),
      _id: docId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!existing) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    await this.db.collection('materials').doc(docId).set(data, { merge: true });

    // Log transaksi
    await this.addInventoryLog({ jenis: 'BAHAN', aksi: 'DEPOSIT', nama: materialData.nama, jumlah: parseFloat(materialData.qty) || 0, unit: materialData.unit || 'pcs' });

    window.dispatchEvent(new CustomEvent('wt:materials-changed'));
    return data;
  },

  async withdrawMaterial(docId, jumlah) {
    const doc = await this.db.collection('materials').doc(docId).get();
    if (!doc.exists) throw new Error('Material tidak ditemukan');
    const material = doc.data();
    const newQty = Math.max(0, (material.qty || 0) - jumlah);

    await this.db.collection('materials').doc(docId).update({
      qty: newQty,
      totalNilai: newQty * (material.hargaPerUnit || 0),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await this.addInventoryLog({ jenis: 'BAHAN', aksi: 'WITHDRAW', nama: material.nama, jumlah, unit: material.unit });
    window.dispatchEvent(new CustomEvent('wt:materials-changed'));
    return { ...material, qty: newQty };
  },

  async deleteMaterial(docId) {
    await this.db.collection('materials').doc(docId).delete();
    window.dispatchEvent(new CustomEvent('wt:materials-changed'));
  },

  // ==================== WEAPONS (Berangkas Senjata) ====================
  listenWeapons(callback) {
    const unsub = this.db.collection('weapons')
      .orderBy('nama', 'asc')
      .onSnapshot(snapshot => {
        const weapons = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
        callback(weapons);
        window.dispatchEvent(new CustomEvent('wt:weapons-changed', { detail: weapons }));
      }, err => console.error('listenWeapons error:', err));
    this._listeners['weapons'] = unsub;
    return unsub;
  },

  async getWeapons() {
    const snap = await this.db.collection('weapons').orderBy('nama', 'asc').get();
    return snap.docs.map(d => ({ ...d.data(), _docId: d.id }));
  },

  async depositWeapon(weaponData) {
    const docId = weaponData._docId || ('wpn-' + Date.now());
    const existing = weaponData._docId ? (await this.db.collection('weapons').doc(docId).get()).data() : null;
    const currentQty = existing ? (existing.qty || 0) : 0;
    const newQty = currentQty + (parseFloat(weaponData.qty) || 0);

    const data = {
      nama: weaponData.nama,
      kategori: weaponData.kategori || 'Senjata Api',
      hargaPerUnit: parseFloat(weaponData.hargaPerUnit) || 0,
      qty: newQty,
      totalNilai: newQty * (parseFloat(weaponData.hargaPerUnit) || 0),
      kondisi: weaponData.kondisi || 'Baik',
      _id: docId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!existing) data.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    await this.db.collection('weapons').doc(docId).set(data, { merge: true });
    await this.addInventoryLog({ jenis: 'SENJATA', aksi: 'DEPOSIT', nama: weaponData.nama, jumlah: parseFloat(weaponData.qty) || 0, unit: 'pcs' });
    window.dispatchEvent(new CustomEvent('wt:weapons-changed'));
    return data;
  },

  async withdrawWeapon(docId, jumlah) {
    const doc = await this.db.collection('weapons').doc(docId).get();
    if (!doc.exists) throw new Error('Senjata tidak ditemukan');
    const weapon = doc.data();
    const newQty = Math.max(0, (weapon.qty || 0) - jumlah);

    await this.db.collection('weapons').doc(docId).update({
      qty: newQty,
      totalNilai: newQty * (weapon.hargaPerUnit || 0),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await this.addInventoryLog({ jenis: 'SENJATA', aksi: 'WITHDRAW', nama: weapon.nama, jumlah, unit: 'pcs' });
    window.dispatchEvent(new CustomEvent('wt:weapons-changed'));
    return { ...weapon, qty: newQty };
  },

  async deleteWeapon(docId) {
    await this.db.collection('weapons').doc(docId).delete();
    window.dispatchEvent(new CustomEvent('wt:weapons-changed'));
  },

  // ==================== INVENTORY LOG ====================
  async addInventoryLog(data) {
    await this.db.collection('inventoryLogs').add({
      ...data,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  listenInventoryLogs(callback, limit = 50) {
    const unsub = this.db.collection('inventoryLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .onSnapshot(snapshot => {
        const logs = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
        callback(logs);
      });
    this._listeners['inventoryLogs'] = unsub;
    return unsub;
  },

  // ==================== AUDIT LOGS ====================
  async addLog(action, resource, performedBy = 'User', status = 'Success') {
    const log = {
      action, resource, performedBy, status,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    await this.db.collection('auditLogs').add(log);
    window.dispatchEvent(new CustomEvent('wt:logs-changed'));
    return log;
  },

  listenLogs(callback, limit = 100) {
    const unsub = this.db.collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .onSnapshot(snapshot => {
        const logs = snapshot.docs.map(d => ({ ...d.data(), _docId: d.id }));
        callback(logs);
        window.dispatchEvent(new CustomEvent('wt:logs-changed', { detail: logs }));
      });
    this._listeners['auditLogs'] = unsub;
    return unsub;
  },

  // ==================== CLEANUP ====================
  unsubscribeAll() {
    Object.values(this._listeners).forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    this._listeners = {};
  }
};
