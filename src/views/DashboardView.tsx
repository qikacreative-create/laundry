import React, { useState, useMemo, useEffect } from 'react';
import {
  Archive,
  Settings as SettingsIcon,
  Search,
  Plus,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  CheckCircle,
  Truck,
  Building2,
  ChevronDown,
  Download,
  AlertCircle,
  Smartphone,
  Inbox,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronUp
} from 'lucide-react';
import { Transaksi, SettingsData, User, Laundry } from '../types';
import { formatRupiah, formatShortDate, formatShortTime } from '../utils/formatters';

export type DashboardFilterStatus = 'semua' | 'selesai' | 'baru_masuk' | 'sedang_dikerjakan';

interface DashboardViewProps {
  transaksiList: Transaksi[];
  settings: SettingsData;
  currentUser: User;
  activeLaundry: Laundry;
  laundries: Laundry[];
  isMobile?: boolean;
  deviceInfo?: {
    isMobile: boolean;
    isPhone: boolean;
    os: string;
  };
  onOpenNewTransaksi: () => void;
  onOpenDetailTransaksi: (transaksiId: string) => void;
  onOpenArsip: () => void;
  onOpenSettings: () => void;
  onOpenStatusPengerjaan: () => void;
  onOpenBukuKas: () => void;
  onOpenLaporan: () => void;
  onOpenAturKas: () => void;
  onOpenSwitchBranch: () => void;
  onOpenApkModal: () => void;
  onOpenKelolaPelanggan: () => void;
  onOpenKelolaLayanan: () => void;
  onOpenKelolaOwner: () => void;
  onSelesaikanTransaksi: (transaksi: Transaksi) => void;
  onAmbilTransaksi: (transaksi: Transaksi) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transaksiList,
  currentUser,
  activeLaundry,
  laundries,
  isMobile = false,
  deviceInfo,
  onOpenNewTransaksi,
  onOpenDetailTransaksi,
  onOpenArsip,
  onOpenSettings,
  onOpenStatusPengerjaan,
  onOpenBukuKas,
  onOpenLaporan,
  onOpenAturKas,
  onOpenSwitchBranch,
  onOpenApkModal,
  onOpenKelolaPelanggan,
  onOpenKelolaLayanan,
  onOpenKelolaOwner,
  onSelesaikanTransaksi,
  onAmbilTransaksi,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DashboardFilterStatus>('semua');
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);

  // Filter transactions for active branch (exclude archived/picked-up)
  const activeBranchTrx = useMemo(() => {
    return transaksiList.filter((trx) => trx.laundryId === activeLaundry.id && trx.status !== 'Diambil');
  }, [transaksiList, activeLaundry.id]);

  // Count items per category
  const filterCounts = useMemo(() => {
    let baruMasuk = 0;
    let sedangDikerjakan = 0;
    let selesai = 0;

    activeBranchTrx.forEach((t) => {
      if (t.status === 'Diterima') baruMasuk++;
      else if (t.status === 'Proses') sedangDikerjakan++;
      else if (t.status === 'Selesai') selesai++;
    });

    return {
      semua: activeBranchTrx.length,
      baruMasuk,
      sedangDikerjakan,
      selesai,
    };
  }, [activeBranchTrx]);

  // Search & Status Filter
  const displayedTrx = useMemo(() => {
    let list = activeBranchTrx;

    if (filterStatus === 'baru_masuk') {
      list = list.filter((t) => t.status === 'Diterima');
    } else if (filterStatus === 'sedang_dikerjakan') {
      list = list.filter((t) => t.status === 'Proses');
    } else if (filterStatus === 'selesai') {
      list = list.filter((t) => t.status === 'Selesai');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const nameMatch = t.namaPelanggan.toLowerCase().includes(q);
        const invMatch = t.nomorTransaksi?.toLowerCase().includes(q);
        const phoneMatch = t.nomorTelepon?.includes(q);
        return nameMatch || invMatch || phoneMatch;
      });
    }

    return list;
  }, [activeBranchTrx, filterStatus, searchQuery]);

  // Paginasi 10 Transaksi per Halaman (Hemat Memori & Ringan untuk HP)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset halaman saat filter status atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(displayedTrx.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTrx = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return displayedTrx.slice(start, start + ITEMS_PER_PAGE);
  }, [displayedTrx, validCurrentPage]);

  // Daily statistics calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();

    const branchAll = transaksiList.filter((t) => t.laundryId === activeLaundry.id);

    const masukHariIni = branchAll.filter((t) => t.tanggalMasuk >= startOfToday);
    const diambilHariIni = branchAll.filter((t) => (t.tanggalPengambilan || 0) >= startOfToday);
    const selesaiHariIni = branchAll.filter((t) => (t.tanggalStatusSelesai || 0) >= startOfToday);

    // Calculate income today
    let totalUangMasuk = 0;
    masukHariIni.forEach((t) => {
      if (t.statusPembayaran === 'Lunas') {
        totalUangMasuk += t.totalHarga;
      } else {
        totalUangMasuk += t.jumlahDp;
      }
    });

    // Add settlement for collected today
    diambilHariIni.forEach((t) => {
      if (t.tanggalMasuk < startOfToday && t.statusPembayaran === 'Lunas' && t.totalHarga > t.jumlahDp) {
        totalUangMasuk += t.totalHarga - t.jumlahDp;
      }
    });

    const harusSelesaiHariIni = activeBranchTrx.filter((t) => {
      if (t.status === 'Selesai') return false;
      if (!t.tanggalSelesai) return false;
      return t.tanggalSelesai <= Date.now() + 24 * 60 * 60 * 1000;
    }).length;

    const readyCount = activeBranchTrx.filter((t) => t.status === 'Selesai').length;

    return {
      transaksiMasuk: masukHariIni.length,
      transaksiDiambil: diambilHariIni.length,
      transaksiSelesai: selesaiHariIni.length,
      harusSelesai: harusSelesaiHariIni,
      totalUangMasuk,
      totalPengeluaran: 57000, // demo expense today
      readyCount,
    };
  }, [transaksiList, activeLaundry.id, activeBranchTrx]);

  const totalLaba = Math.max(0, stats.totalUangMasuk - stats.totalPengeluaran);

  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(new Date());

  const getEmptyStateMessage = () => {
    if (searchQuery.trim()) {
      return 'Tidak ada transaksi yang cocok dengan kata kunci pencarian.';
    }
    switch (filterStatus) {
      case 'baru_masuk':
        return 'Tidak ada pesanan baru masuk saat ini.';
      case 'sedang_dikerjakan':
        return 'Tidak ada pesanan yang sedang dikerjakan saat ini.';
      case 'selesai':
        return 'Tidak ada pesanan berstatus selesai (siap diambil) saat ini.';
      default:
        return 'Tidak ada antrean transaksi aktif saat ini.';
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-slate-100 text-slate-800 select-none overflow-hidden relative">
      {/* 1. TOOLBAR ATAS (Maroon) */}
      <header className="bg-[#800000] text-white shadow-md shrink-0 z-30">
        <div className="flex items-center justify-between px-3 md:px-6 h-14">
          {/* Tombol Kiri: Arsip Transaksi */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenArsip}
              title="Arsip Transaksi"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition"
            >
              <Archive className="w-5 h-5 text-white" />
            </button>

            {/* Nama Laundry & Switcher Cabang */}
            <button
              onClick={laundries.length > 1 ? onOpenSwitchBranch : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 active:scale-98 transition max-w-[180px] sm:max-w-[240px] md:max-w-[280px]"
            >
              <span className="font-bold text-base truncate text-white tracking-wide">
                {activeLaundry.namaLaundry}
              </span>
              {laundries.length > 1 && (
                <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />
              )}
            </button>
          </div>

          {/* Desktop Navigation Links (Visible on PC / Tablet) */}
          <div className="hidden lg:flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={onOpenStatusPengerjaan}
              className="px-3 py-1.5 rounded-lg hover:bg-white/20 text-white transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Status</span>
            </button>
            <button
              onClick={onOpenBukuKas}
              className="px-3 py-1.5 rounded-lg hover:bg-white/20 text-white transition flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Buku Kas</span>
            </button>
            <button
              onClick={onOpenLaporan}
              className="px-3 py-1.5 rounded-lg hover:bg-white/20 text-white transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Laporan</span>
            </button>
            <button
              onClick={onOpenKelolaPelanggan}
              className="px-3 py-1.5 rounded-lg hover:bg-white/20 text-white transition"
            >
              Pelanggan
            </button>
            <button
              onClick={onOpenKelolaLayanan}
              className="px-3 py-1.5 rounded-lg hover:bg-white/20 text-white transition"
            >
              Layanan
            </button>
            {currentUser.role === 'owner' && (
              <button
                onClick={onOpenKelolaOwner}
                className="px-3 py-1.5 rounded-lg hover:bg-white/20 text-white transition"
              >
                Owner & Cabang
              </button>
            )}
          </div>

          {/* Tombol Kanan: APK Play Store & Settings */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenApkModal}
              title="Unduh APK / Play Store"
              className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5 text-xs font-bold border border-white/20 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Unduh APK</span>
            </button>
            <button
              onClick={onOpenSettings}
              title="Pengaturan"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition"
            >
              <SettingsIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. AREA ATAS YANG BISA DI-SCROLL (Pencarian, Filter, Transaksi, Paginasi) */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 py-2.5">
        <div className="max-w-7xl mx-auto w-full space-y-3 pb-2">
          {/* Quick Primary Actions on PC */}
          <div className="hidden md:grid grid-cols-2 gap-2">
            <button
              onClick={onOpenNewTransaksi}
              className="py-2.5 px-4 rounded-2xl bg-[#800000] hover:bg-[#660000] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Transaksi Baru</span>
            </button>
            <button
              onClick={onOpenAturKas}
              className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Catat Kas</span>
            </button>
          </div>

          {/* 2. PENCARIAN TRANSAKSI */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
          
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pelanggan / no. nota (cth: 051026/1)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 pl-10 pr-8 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. FILTER TABS: PESANAN SELESAI, BARU MASUK, SEDANG DIKERJAKAN, SEMUA (Khusus Layar PC/Tablet, disembunyikan untuk HP) */}
          <div className={`${isMobile ? 'hidden' : 'hidden md:block'} bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs`}>
            <div className="flex items-center justify-between px-1 pb-1.5">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                <Filter className="w-3.5 h-3.5 text-[#800000]" />
                <span>Filter Pesanan:</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {filterStatus === 'semua' && 'Semua Pesanan Aktif'}
                {filterStatus === 'selesai' && 'Hanya Pesanan Selesai'}
                {filterStatus === 'baru_masuk' && 'Pesanan Baru Masuk'}
                {filterStatus === 'sedang_dikerjakan' && 'Sedang Dikerjakan'}
              </span>
            </div>

            {/* Filter Buttons Segmented Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {/* Tab 1: Pesanan Selesai */}
              <button
                type="button"
                onClick={() => setFilterStatus('selesai')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition active:scale-98 ${
                  filterStatus === 'selesai'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                    : 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200/60'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Selesai</span>
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    filterStatus === 'selesai'
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {filterCounts.selesai}
                </span>
              </button>

              {/* Tab 2: Pesanan Baru Masuk */}
              <button
                type="button"
                onClick={() => setFilterStatus('baru_masuk')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition active:scale-98 ${
                  filterStatus === 'baru_masuk'
                    ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-300'
                    : 'bg-rose-50/70 hover:bg-rose-100/70 text-rose-800 border border-rose-200/60'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>Baru Masuk</span>
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    filterStatus === 'baru_masuk'
                      ? 'bg-white/25 text-white'
                      : 'bg-rose-200 text-rose-900'
                  }`}
                >
                  {filterCounts.baruMasuk}
                </span>
              </button>

              {/* Tab 3: Pesanan Sedang Dikerjakan */}
              <button
                type="button"
                onClick={() => setFilterStatus('sedang_dikerjakan')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition active:scale-98 ${
                  filterStatus === 'sedang_dikerjakan'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                    : 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-800 border border-amber-200/60'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Dikerjakan</span>
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    filterStatus === 'sedang_dikerjakan'
                      ? 'bg-white/25 text-white'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {filterCounts.sedangDikerjakan}
                </span>
              </button>

              {/* Tab 4: Semua Pesanan */}
              <button
                type="button"
                onClick={() => setFilterStatus('semua')}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition active:scale-98 ${
                  filterStatus === 'semua'
                    ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span className="truncate">Semua</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    filterStatus === 'semua'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {filterCounts.semua}
                </span>
              </button>
            </div>
          </div>

          {/* 4. DAFTAR TRANSAKSI AKTIF */}
          <main className="space-y-1">
            {displayedTrx.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 mt-2 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {getEmptyStateMessage()}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {filterStatus !== 'semua' && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus('semua')}
                      className="text-xs text-[#800000] font-bold underline hover:text-[#660000]"
                    >
                      Lihat Semua Pesanan
                    </button>
                  )}
                </div>
              </div>
            ) : (
              paginatedTrx.map((trx, index) => {
                const isLunas = trx.statusPembayaran === 'Lunas';
                const sisa = Math.max(0, trx.totalHarga - trx.jumlahDp);
                const isEven = index % 2 === 0;

                const serviceText =
                  trx.items && trx.items.length > 0
                    ? trx.items.map((it) => `${it.namaLayanan} (${it.berat} ${it.satuan})`).join(', ')
                    : 'Layanan Cuci';

                return (
                  <div
                    key={trx.id}
                    onClick={() => onOpenDetailTransaksi(trx.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer transition hover:border-[#800000] hover:shadow-xs ${
                      isEven ? 'bg-white' : 'bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-1 sm:gap-1">
                      {/* Tanggal & Jam Masuk (Diperkecil / Compact) */}
                      <div className="w-9 shrink-0 text-center border-r border-slate-200 pr-1.5 flex flex-col justify-center">
                        <div className="text-[10px] text-slate-800 leading-none">
                          {formatShortTime(trx.tanggalMasuk)}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-none mt-1">
                          {formatShortDate(trx.tanggalMasuk)}
                        </div>
                      </div>

                      {/* Pelanggan, Layanan & Item Jadwal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {trx.namaPelanggan}
                          </span>
                               <div className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5">
                            {trx.nomorTransaksi || '-'}
                          </div>

{/* Lunas / Sisa di Ujung Kanan (menggunakan ml-auto dan text-right) */}
    <div className="ml-auto text-right">
      <div
        className={`text-xs font-black tracking-tight leading-tight ${
          isLunas ? 'text-emerald-600' : 'text-red-600'
        }`}
      >
        {isLunas ? 'Lunas' : formatRupiah(sisa).replace('Rp ', '')}
      </div>
    </div>
  </div>

                        <div className="text-[10px] text-slate-600 truncate mt-0.5 italic">
                          {serviceText}
                        </div>

             
                      </div>
<div className="shrink-0 flex flex-col items-end justify-start gap-1 self-stretch border-l border-slate-200 pl-2 text-center">


  {/* Tombol Indikator Fungsi Selesaikan di BAWAH (Memenuhi sisa ruang vertikal) */}
<div 
    className="flex-1 w-full flex items-stretch justify-stretch" 
    onClick={(e) => e.stopPropagation()}
  >
    {trx.status === 'Diterima' ? (
      <button
        type="button"
        onClick={() => onSelesaikanTransaksi(trx)}
        title="Mulai Pengerjaan"
        className="w-10 min-h-[20px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 transition"
      >
        <Clock className="w-4 h-4" />
      </button>
    ) : trx.status === 'Proses' ? (
      <button
        type="button"
        onClick={() => onSelesaikanTransaksi(trx)}
        title="Tandai Selesai"
        className="w-10 min-h-[20px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 transition"
      >
        <Sparkles className="w-4 h-4" />
      </button>
    ) : (
      <button
        type="button"
        onClick={() => onAmbilTransaksi(trx)}
        title="Ambil / Serahkan ke Pelanggan"
        className="w-10 min-h-[20px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 transition"
      >
        <Truck className="w-4 h-4" />
      </button>
    )}
  </div>
</div>
                   
                    </div>
                  </div>
                );
              })
            )}
          </main>

          {/* 5. KONTROL PAGINASI (10 TRANSAKSI PER HALAMAN) */}
          {displayedTrx.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
                Menampilkan <span className="font-bold text-slate-800">{(validCurrentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-800">{Math.min(validCurrentPage * ITEMS_PER_PAGE, displayedTrx.length)}</span> dari <span className="font-bold text-[#800000]">{displayedTrx.length}</span> transaksi
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={validCurrentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition flex items-center gap-1 active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((pageNum) => {
                        return (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          Math.abs(pageNum - validCurrentPage) <= 1
                        );
                      })
                      .map((pageNum, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && pageNum - prev > 1;

                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && <span className="text-xs text-slate-400 px-0.5">...</span>}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                validCurrentPage === pageNum
                                  ? 'bg-[#800000] text-white shadow-2xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    disabled={validCurrentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition flex items-center gap-1 active:scale-95"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. KARTU RINGKASAN HARIAN (Terkunci tetap di bawah, tidak terscroll) */}
      <div className="shrink-0 z-20 bg-slate-100/95 backdrop-blur-xs px-2 sm:px-4 pt-1.5 pb-[70px] border-t border-slate-200/80 shadow-md">
        <div className="max-w-7xl mx-auto w-full">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-2">
            {/* Header Ringkasan: Tanggal & User Login */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-800 capitalize">
                  {formattedToday}
                </span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                  {currentUser.displayName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition active:scale-95"
                title={isSummaryCollapsed ? "Buka Rincian Lengkap" : "Sembunyikan / Perkecil"}
              >
                <span>{isSummaryCollapsed ? 'Buka' : 'Kecilkan'}</span>
                {isSummaryCollapsed ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            </div>

            {isSummaryCollapsed ? (
              <div className="flex items-center justify-between text-[11px] font-bold pt-0.5">
                <span className="text-slate-600">
                  Masuk: <span className="text-emerald-700 font-extrabold">{formatRupiah(stats.totalUangMasuk)}</span>
                </span>
                <span className="text-slate-600">
                  Keluar: <span className="text-red-600 font-extrabold">{formatRupiah(stats.totalPengeluaran)}</span>
                </span>
                <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-black">
                  Laba: {formatRupiah(totalLaba)}
                </span>
              </div>
            ) : (
              <>
                {/* 3 Kotak Keuangan (Pemasukan, Pengeluaran, Laba) */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">Pemasukan</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {formatRupiah(stats.totalUangMasuk)}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">Pengeluaran</span>
                    <span className="text-xs font-bold text-red-600">
                      {formatRupiah(stats.totalPengeluaran)}
                    </span>
                  </div>
                </div>

                {/* Laba Hari Ini */}
                <div className="px-2.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Total Laba Hari Ini</span>
                  <span className="text-xs font-black text-emerald-700">
                    {formatRupiah(totalLaba)}
                  </span>
                </div>

                {/* Rincian Angka Transaksi */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1.5 text-slate-600 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span>Transaksi Masuk:</span>
                    <span className="font-bold text-slate-900">{stats.transaksiMasuk}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Selesai Hari Ini:</span>
                    <span className="font-bold text-emerald-700">{stats.transaksiSelesai}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Transaksi Diambil:</span>
                    <span className="font-bold text-slate-900">{stats.transaksiDiambil}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Harus Selesai:</span>
                    <span className="font-bold text-amber-600">{stats.harusSelesai}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 6. FLOATING ACTION BUTTON (+) TRANSAKSI BARU */}
      <button
        onClick={onOpenNewTransaksi}
        title="Buat Transaksi Baru"
        className={`fixed ${isSummaryCollapsed ? 'bottom-20' : 'bottom-[205px]'} md:bottom-20 right-4 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#800000] hover:bg-[#660000] text-white shadow-xl flex items-center justify-center transition-all active:scale-90 border-2 border-white`}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* 7. BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#800000] text-white h-16 flex items-center justify-around px-2 shadow-2xl border-t border-white/10 pb-safe">
        {/* Status Pengerjaan */}
        <button
          onClick={onOpenStatusPengerjaan}
          className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>Status</span>
        </button>

        {/* Keuangan (Buku Kas) */}
        <button
          onClick={onOpenBukuKas}
          className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
        >
          <DollarSign className="w-5 h-5 mb-0.5" />
          <span>Keuangan</span>
        </button>

        {/* Catat (Pengeluaran / Pemasukan Kas) */}
        <button
          onClick={onOpenAturKas}
          className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
        >
          <Plus className="w-5 h-5 mb-0.5" />
          <span>Catat Kas</span>
        </button>

        {/* Laporan Bulanan */}
        <button
          onClick={onOpenLaporan}
          className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span>Laporan</span>
        </button>
      </nav>
    </div>
  );
};

