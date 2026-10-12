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
import { PWAInstallButton } from '../components/PWAInstallButton';

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
  // 3 Tombol Filter: Default awal menampilkan semua transaksi baru masuk
  const [filterStatus, setFilterStatus] = useState<DashboardFilterStatus>('baru_masuk');
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false);
  const [trxToAmbil, setTrxToAmbil] = useState<Transaksi | null>(null);

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

          {/* Tombol Kanan: Pasang PWA, APK Play Store & Settings */}
          <div className="flex items-center gap-1.5">
            <PWAInstallButton variant="header" />
   
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
          {/* PWA Install Banner */}
          <PWAInstallButton variant="banner" />

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

      {/* 2. PENCARIAN & 3 TOMBOL FILTER BERSEBELAHAN */}
<div className="bg-white rounded-2xl border border-slate-200 p-2 sm:p-3 shadow-2xs">
            {/* Selalu 2 kolom horizontal berdampingan di HP maupun PC */}
            <div className="grid grid-cols-2 gap-1 items-center">
              
              {/* Kolom 1: Kolom Pencarian */}
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pelanggan..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 pl-9 pr-8 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:bg-white transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Kolom 2: 3 Tombol Filter */}
              <div className="grid grid-cols-3 gap-1 w-full">
                {/* Tombol 1: Baru Masuk */}
                <button
                  type="button"
                  onClick={() => setFilterStatus(filterStatus === 'baru_masuk' ? 'semua' : 'baru_masuk')}
                  className={`py-2 px-1 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                    filterStatus === 'baru_masuk'
                      ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-300'
                      : 'bg-rose-50/80 hover:bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] px-1 rounded-full font-black bg-rose-200 text-rose-900">
                    {filterCounts.baruMasuk}
                  </span>
                </button>

                {/* Tombol 2: Sedang Dikerjakan */}
                <button
                  type="button"
                  onClick={() => setFilterStatus(filterStatus === 'sedang_dikerjakan' ? 'semua' : 'sedang_dikerjakan')}
                  className={`py-2 px-1 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                    filterStatus === 'sedang_dikerjakan'
                      ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                      : 'bg-amber-50/80 hover:bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] px-1 rounded-full font-black bg-amber-200 text-amber-900">
                    {filterCounts.sedangDikerjakan}
                  </span>
                </button>

                {/* Tombol 3: Selesai */}
                <button
                  type="button"
                  onClick={() => setFilterStatus(filterStatus === 'selesai' ? 'semua' : 'selesai')}
                  className={`py-2 px-1 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                    filterStatus === 'selesai'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                      : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[10px] px-1 rounded-full font-black bg-emerald-200 text-emerald-900">
                    {filterCounts.selesai}
                  </span>
                </button>
              </div>

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
                  Array.isArray(trx.items) && trx.items.length > 0
                    ? trx.items.map((it) => `${it?.namaLayanan || 'Layanan'} (${it?.berat || 0} ${it?.satuan || ''})`).join(', ')
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
        onClick={() => setTrxToAmbil(trx)}
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
  {/* Sisi Kiri: Tanggal Hari Ini */}
  <div className="flex items-center gap-2">
    <span className="text-[11px] font-bold text-slate-800 capitalize">
      {formattedToday}
    </span>
  </div>

  {/* Sisi Kanan: Display Name di ujung kanan & Tombol Collapse */}
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[130px]">
      {currentUser.displayName}
    </span>

    <button
      type="button"
      onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition active:scale-95 flex items-center justify-center"
      title={isSummaryCollapsed ? "Buka Rincian Lengkap" : "Sembunyikan / Perkecil"}
    >
      {isSummaryCollapsed ? (
        <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
      )}
    </button>
  </div>
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
        className={`fixed ${isSummaryCollapsed ? 'bottom-5' : 'bottom-[20px]'} md:bottom-5 left-1/2 -translate-x-1/2 z-40 w-15 h-12 sm:w-17 sm:h-14 rounded-full bg-[#800000] hover:bg-[#660000] text-white shadow-xl flex items-center justify-center transition-all active:scale-90 border-2 border-white`}
      >
        <Plus className="w-7 h-7" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#800000] text-white h-14 flex items-center justify-around px-1 shadow-2xl border-t border-white/10 pb-safe">
  {/* 1. Status Pengerjaan */}
  <button
    onClick={onOpenStatusPengerjaan}
    className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
  >
    <Clock className="w-5 h-5 mb-0.5" />
    <span>Status</span>
  </button>

  {/* 2. Keuangan (Buku Kas) */}
  <button
    onClick={onOpenBukuKas}
    className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
  >
    <DollarSign className="w-5 h-5 mb-0.5" />
    <span>Keuangan</span>
  </button>

  {/* 3. KOSONG DI TENGAH (Spacer / Ruang Kosong) */}
  <div className="flex-1 h-full pointer-events-none" aria-hidden="true" />

  {/* 4. Catat (Pengeluaran / Pemasukan Kas) */}
  <button
    onClick={onOpenAturKas}
    className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
  >
    <Plus className="w-5 h-5 mb-0.5" />
    <span>Catat Kas</span>
  </button>

  {/* 5. Laporan Bulanan */}
  <button
    onClick={onOpenLaporan}
    className="flex flex-col items-center justify-center flex-1 py-1 hover:bg-white/10 rounded-xl transition text-[10px] active:scale-95"
  >
    <FileText className="w-5 h-5 mb-0.5" />
    <span>Laporan</span>
  </button>
</nav>

      {/* MODAL KONFIRMASI PENGAMBILAN TRANSAKSI ("Benar mau diambil?") */}
      {trxToAmbil && (() => {
        const isLunas = trxToAmbil.statusPembayaran === 'Lunas';
        const sisa = Math.max(0, trxToAmbil.totalHarga - (trxToAmbil.jumlahDp || 0));
        const servicesDesc =
          Array.isArray(trxToAmbil.items) && trxToAmbil.items.length > 0
            ? trxToAmbil.items.map((it) => `${it?.namaLayanan || 'Layanan'} (${it?.berat || 0} ${it?.satuan || ''})`).join(', ')
            : 'Layanan Laundry';

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Icon */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Truck className="w-7 h-7" />
              </div>

              {/* Title & Pertanyaan Utama */}
              <h3 className="text-lg font-black text-slate-900 text-center tracking-tight">
                Benar mau diambil?
              </h3>
              <p className="text-xs text-slate-500 text-center mt-1">
                Konfirmasi penyerahan cucian ke pelanggan
              </p>

              {/* Rincian Transaksi */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[190px]">
                    {trxToAmbil.namaPelanggan}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">No. Nota / Faktur:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {trxToAmbil.nomorTransaksi || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-500 shrink-0">Layanan:</span>
                  <span className="text-slate-800 font-medium text-right line-clamp-2">
                    {servicesDesc}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Total Tagihan:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatRupiah(trxToAmbil.totalHarga)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200">
                  <span className="text-slate-500">Status Pembayaran:</span>
                  {isLunas || sisa <= 0 ? (
                    <span className="px-2 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 text-[11px]">
                      LUNAS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full font-black bg-rose-100 text-rose-800 text-[11px]">
                      SISA {formatRupiah(sisa)}
                    </span>
                  )}
                </div>
              </div>

              {/* Catatan Sisa Pembayaran / Pelunasan */}
              {!isLunas && sisa > 0 ? (
                <div className="mt-3.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Masih terdapat sisa tagihan sebesar <strong className="font-bold text-rose-700">{formatRupiah(sisa)}</strong>.
                    Jika Anda konfirmasi <strong>"Ya, Benar Diambil"</strong>, transaksi ini otomatis ditandai <strong>LUNAS</strong> dan diserahkan.
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    Cucian sudah lunas dan siap diserahkan kepada pelanggan. Data akan otomatis masuk ke arsip cucian selesai diambil.
                  </div>
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setTrxToAmbil(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 transition active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAmbilTransaksi(trxToAmbil);
                    setTrxToAmbil(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs text-white shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  <span>Ya, Benar Diambil</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

