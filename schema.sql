-- ====================================================================
-- WHITE TIGER DASHBOARD - DATABASE SCHEMA (SQL / POSTGRESQL / MYSQL)
-- Database terpusat untuk sinkronisasi multi-user secara online
-- ====================================================================

-- 1. TABEL RATES (TARIF GAJI RESMI)
CREATE TABLE IF NOT EXISTS rates (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    batu_mentah_paket NUMERIC(10, 2) DEFAULT 75.0,
    emas_pcs NUMERIC(10, 2) DEFAULT 1.3,
    tembaga_pcs NUMERIC(10, 2) DEFAULT 1.5,
    besi_pcs NUMERIC(10, 2) DEFAULT 1.0,
    bluni_pcs NUMERIC(10, 2) DEFAULT 1.5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO rates (id, batu_mentah_paket, emas_pcs, tembaga_pcs, besi_pcs, bluni_pcs)
VALUES ('default', 75.0, 1.3, 1.5, 1.0, 1.5)
ON CONFLICT (id) DO NOTHING;

-- 2. TABEL BERANGKAS BAHAN (MATERIALS)
CREATE TABLE IF NOT EXISTS materials (
    id VARCHAR(100) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    unit VARCHAR(50) DEFAULT 'pcs',
    qty NUMERIC(12, 2) DEFAULT 0,
    harga_per_unit NUMERIC(12, 2) DEFAULT 0,
    total_nilai NUMERIC(15, 2) DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Awal Bahan
INSERT INTO materials (id, nama, unit, qty, harga_per_unit, total_nilai, keterangan) VALUES
('mat-1', 'Batu Mentah', 'paket (100 pcs)', 180, 75.0, 13500.0, 'Bahan tambang utama'),
('mat-2', 'Emas Murni', 'pcs', 350, 1.3, 455.0, 'Hasil olahan tambang'),
('mat-3', 'Tembaga', 'pcs', 420, 1.5, 630.0, 'Logam konduktor'),
('mat-4', 'Besi Batangan', 'pcs', 290, 1.0, 290.0, 'Material konstruksi & senjata'),
('mat-5', 'Bluni Kantor', 'pcs', 500, 1.5, 750.0, 'Mata uang ROC khusus kantor'),
('mat-6', 'Bubuk Mesiu', 'kg', 85, 4.5, 382.5, 'Bahan amunisi & peledak')
ON CONFLICT (id) DO NOTHING;

-- 3. TABEL BERANGKAS SENJATA (WEAPONS)
CREATE TABLE IF NOT EXISTS weapons (
    id VARCHAR(100) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    kategori VARCHAR(80) DEFAULT 'Handgun',
    qty INTEGER DEFAULT 0,
    harga_per_unit NUMERIC(12, 2) DEFAULT 0,
    total_nilai NUMERIC(15, 2) DEFAULT 0,
    kondisi VARCHAR(50) DEFAULT 'Baik (100%)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Awal Senjata
INSERT INTO weapons (id, nama, kategori, qty, harga_per_unit, total_nilai, kondisi) VALUES
('wpn-1', 'Combat Pistol', 'Handgun', 12, 1500.0, 18000.0, 'Baik (100%)'),
('wpn-2', 'AP Pistol', 'Handgun', 8, 2200.0, 17600.0, 'Baik (100%)'),
('wpn-3', 'SMG Gusenberg', 'Submachine Gun', 6, 4500.0, 27000.0, 'Sangat Baik'),
('wpn-4', 'Heavy Rifle', 'Assault Rifle', 5, 8500.0, 42500.0, 'Baru'),
('wpn-5', 'Pump Shotgun MK II', 'Shotgun', 4, 3200.0, 12800.0, 'Baik (95%)')
ON CONFLICT (id) DO NOTHING;

-- 4. TABEL RIWAYAT MUTASI BERANGKAS (INVENTORY LOGS)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id VARCHAR(100) PRIMARY KEY,
    waktu VARCHAR(80),
    jenis VARCHAR(50) NOT NULL, -- 'BAHAN' atau 'SENJATA'
    nama VARCHAR(150) NOT NULL,
    aksi VARCHAR(50) NOT NULL,  -- 'DEPOSIT' atau 'WITHDRAW'
    jumlah NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'pcs',
    petugas VARCHAR(100) DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Awal Log Mutasi
INSERT INTO inventory_logs (id, waktu, jenis, nama, aksi, jumlah, unit, petugas) VALUES
('log-inv-1', '01/10/2026 10:15', 'SENJATA', 'Heavy Rifle', 'DEPOSIT', 2, 'unit', 'Rafli (Presiden)'),
('log-inv-2', '01/10/2026 09:30', 'BAHAN', 'Batu Mentah', 'DEPOSIT', 50, 'paket (100 pcs)', 'Jack'),
('log-inv-3', '30/09/2026 16:45', 'SENJATA', 'Combat Pistol', 'WITHDRAW', 1, 'unit', 'Croz'),
('log-inv-4', '30/09/2026 14:20', 'BAHAN', 'Emas Murni', 'DEPOSIT', 100, 'pcs', 'Zenn')
ON CONFLICT (id) DO NOTHING;

-- 5. TABEL ANGGOTA ORGANISASI (MEMBERS)
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(100) PRIMARY KEY,
    no INTEGER NOT NULL,
    nama VARCHAR(150) NOT NULL,
    join_date VARCHAR(50),
    pj VARCHAR(100) DEFAULT '-',
    jabatan VARCHAR(100) DEFAULT 'The Originally',
    status VARCHAR(50) DEFAULT 'AKTIF',
    ket TEXT,
    tgl_cuti VARCHAR(50),
    tgl_aktif_kembali VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL SETORAN & GAJI (SETORAN)
CREATE TABLE IF NOT EXISTS setoran (
    id VARCHAR(100) PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    batu_mentah NUMERIC(10, 2) DEFAULT 0,
    emas NUMERIC(10, 2) DEFAULT 0,
    tembaga NUMERIC(10, 2) DEFAULT 0,
    besi NUMERIC(10, 2) DEFAULT 0,
    bluni NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'BELUM SETORAN',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABEL KAS UANG ROC (BRANGKAS)
CREATE TABLE IF NOT EXISTS brangkas (
    id VARCHAR(100) PRIMARY KEY,
    tanggal VARCHAR(50),
    nama VARCHAR(150),
    aktivitas TEXT,
    masuk NUMERIC(15, 2) DEFAULT 0,
    keluar NUMERIC(15, 2) DEFAULT 0,
    action VARCHAR(50) DEFAULT 'SETORAN',
    penjualan_badside VARCHAR(100) DEFAULT '',
    pembelian_badside VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AKTIFKAN REALTIME REPLICATION (Jika menggunakan Supabase PostgreSQL)
-- ALTER PUBLICATION supabase_realtime ADD TABLE materials, weapons, inventory_logs, setoran, brangkas, members, rates;
