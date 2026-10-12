import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Layers,
  Sparkles,
  ShoppingBag,
  Scale,
  CreditCard,
  Building2,
  X,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Transaksi, Pengeluaran, LayananItem, Laundry, SettingsData, Pelanggan } from '../types';
import { formatRupiah, formatShortDate, formatShortTime, formatDateIndo } from '../utils/formatters';

export interface LaporanViewProps {
  onBack: () => void;
  transaksiList: Transaksi[];
  pengeluaranList: Pengeluaran[];
  activeLaundryId: string;
  activeLaundry?: Laundry;
  settings?: SettingsData;
  pelangganList?: Pelanggan[];
  onOpenDetailTransaksi?: (transaksiId: string) => void;
}

type DatePreset = 'hari_ini' | '7_hari' | '30_hari' | 'bulan_ini' | 'bulan_lalu' | 'tahun_ini' | 'semua' | 'kustom';
type ActiveTab = 'arus_kas_harian' | 'buku_transaksi' | 'pengeluaran' | 'top_pelanggan';

export const LaporanView: React.FC<LaporanViewProps> = ({
  onBack,
  transaksiList,
  pengeluaranList,
  activeLaundryId,
  activeLaundry,
  settings,
  pelangganList = [],
  onOpenDetailTransaksi,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Date Filtering State
  const [datePreset, setDatePreset] = useState<DatePreset>('bulan_ini');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Custom date range state (YYYY-MM-DD)
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }, []);

  const defaultEndDate = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const [customStartDate, setCustomStartDate] = useState<string>(defaultStartDate);
  const [customEndDate, setCustomEndDate] = useState<string>(defaultEndDate);

  // Sub-filtering & Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('arus_kas_harian');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusBayarFilter, setStatusBayarFilter] = useState<'semua' | 'Lunas' | 'Belum Lunas'>('semua');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [chartHoverDate, setChartHoverDate] = useState<string | null>(null);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Calculate start & end timestamp based on chosen filter
  const { startTs, endTs, filterLabel } = useMemo(() => {
    const now = new Date();

    if (datePreset === 'hari_ini') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startTs: s.getTime(), endTs: e.getTime(), filterLabel: `Hari Ini (${formatDateIndo(s.getTime())})` };
    }

    if (datePreset === '7_hari') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startTs: s.getTime(), endTs: e.getTime(), filterLabel: `7 Hari Terakhir (${formatShortDate(s.getTime())} - ${formatShortDate(e.getTime())})` };
    }

    if (datePreset === '30_hari') {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startTs: s.getTime(), endTs: e.getTime(), filterLabel: `30 Hari Terakhir (${formatShortDate(s.getTime())} - ${formatShortDate(e.getTime())})` };
    }

    if (datePreset === 'bulan_ini') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startTs: s.getTime(), endTs: e.getTime(), filterLabel: `Bulan Ini (${monthNames[now.getMonth()]} ${now.getFullYear()})` };
    }

    if (datePreset === 'bulan_lalu') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const lastMonthName = monthNames[s.getMonth()];
      return { startTs: s.getTime(), endTs: e.getTime(), filterLabel: `Bulan Lalu (${lastMonthName} ${s.getFullYear()})` };
    }

    if (datePreset === 'tahun_ini') {
      const s = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      const e = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      return { startTs: s.getTime(), endTs: e.getTime(), filterLabel: `Tahun ${selectedYear}` };
    }

    if (datePreset === 'kustom') {
      const s = new Date(customStartDate + 'T00:00:00');
      const e = new Date(customEndDate + 'T23:59:59.999');
      return { startTs: s.getTime(), endTs: e.getTime(), filterLabel: `Periode: ${customStartDate} s/d ${customEndDate}` };
    }

    // Default 'semua'
    return { startTs: 0, endTs: Date.now() + 86400000 * 365, filterLabel: 'Semua Waktu' };
  }, [datePreset, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Filter raw transactions & expenses for the active branch & chosen period
  const { filteredTrx, filteredExp } = useMemo(() => {
    const trx = transaksiList.filter((t) => {
      if (t.laundryId !== activeLaundryId) return false;
      const tTime = t.tanggalMasuk;
      return tTime >= startTs && tTime <= endTs;
    });

    const exp = pengeluaranList.filter((p) => {
      if (p.laundryId !== activeLaundryId) return false;
      const pTime = p.tanggal;
      return pTime >= startTs && pTime <= endTs;
    });

    return { filteredTrx: trx, filteredExp: exp };
  }, [transaksiList, pengeluaranList, activeLaundryId, startTs, endTs]);

  // Comprehensive Metrics Calculation
  const metrics = useMemo(() => {
    let totalOmzet = 0; // Nilai kotor seluruh invoice
    let kasMasukTrx = 0; // Uang yang riil sudah terkumpul (Lunas + DP)
    let totalPiutang = 0; // Tagihan belum lunas (Total - DP)
    let countLunas = 0;
    let countBelumLunas = 0;
    let totalBobotKg = 0;
    let totalPcs = 0;

    let tunaiCount = 0;
    let nonTunaiCount = 0;

    // Service Breakdown
    const serviceMap: Record<string, { weight: number; count: number; omzet: number }> = {};

    filteredTrx.forEach((t) => {
      totalOmzet += t.totalHarga;
      if (t.statusPembayaran === 'Lunas') {
        countLunas++;
        kasMasukTrx += t.totalHarga;
      } else {
        countBelumLunas++;
        kasMasukTrx += t.jumlahDp || 0;
        totalPiutang += Math.max(0, t.totalHarga - (t.jumlahDp || 0));
      }

      if (t.metodePembayaran === 'Non-Tunai') {
        nonTunaiCount++;
      } else {
        tunaiCount++;
      }

      t.items.forEach((it) => {
        const key = it.namaLayanan || 'Layanan Lainnya';
        if (!serviceMap[key]) {
          serviceMap[key] = { weight: 0, count: 0, omzet: 0 };
        }
        serviceMap[key].weight += it.berat || 0;
        serviceMap[key].count += 1;
        serviceMap[key].omzet += it.subtotal || 0;

        const satuan = (it.satuan || '').toLowerCase();
        if (satuan === 'pcs' || satuan === 'satuan' || satuan === 'meter') {
          totalPcs += it.berat;
        } else {
          totalBobotKg += it.berat;
        }
      });
    });

    const totalPengeluaran = filteredExp.reduce((sum, p) => sum + p.jumlah, 0);
    const labaBersihRiil = kasMasukTrx - totalPengeluaran;
    const profitMargin = kasMasukTrx > 0 ? (labaBersihRiil / kasMasukTrx) * 100 : 0;
    const avgOrderValue = filteredTrx.length > 0 ? Math.round(totalOmzet / filteredTrx.length) : 0;
    const collectionRate = totalOmzet > 0 ? Math.round((kasMasukTrx / totalOmzet) * 100) : 100;

    // Expense Breakdown by description
    const expenseCategoryMap: Record<string, number> = {};
    filteredExp.forEach((p) => {
      const cat = p.keterangan || 'Operasional Lainnya';
      expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + p.jumlah;
    });

    // Customer Ranking
    const customerMap: Record<string, { count: number; omzet: number; weight: number; piutang: number; phone?: string }> = {};
    filteredTrx.forEach((t) => {
      const cName = t.namaPelanggan || 'Pelanggan Umum';
      if (!customerMap[cName]) {
        customerMap[cName] = { count: 0, omzet: 0, weight: 0, piutang: 0, phone: t.nomorTelepon || undefined };
      }
      customerMap[cName].count += 1;
      customerMap[cName].omzet += t.totalHarga;
      if (t.statusPembayaran !== 'Lunas') {
        customerMap[cName].piutang += Math.max(0, t.totalHarga - (t.jumlahDp || 0));
      }
      t.items.forEach((it) => {
        customerMap[cName].weight += it.berat || 0;
      });
    });

    // Daily breakdown for timeline & visual chart
    const dailyMap: Record<string, { dateStr: string; trxCount: number; omzet: number; kasMasuk: number; pengeluaran: number; laba: number }> = {};

    filteredTrx.forEach((t) => {
      const dKey = new Date(t.tanggalMasuk).toISOString().slice(0, 10);
      if (!dailyMap[dKey]) {
        dailyMap[dKey] = { dateStr: dKey, trxCount: 0, omzet: 0, kasMasuk: 0, pengeluaran: 0, laba: 0 };
      }
      dailyMap[dKey].trxCount += 1;
      dailyMap[dKey].omzet += t.totalHarga;
      dailyMap[dKey].kasMasuk += t.statusPembayaran === 'Lunas' ? t.totalHarga : (t.jumlahDp || 0);
    });

    filteredExp.forEach((p) => {
      const dKey = new Date(p.tanggal).toISOString().slice(0, 10);
      if (!dailyMap[dKey]) {
        dailyMap[dKey] = { dateStr: dKey, trxCount: 0, omzet: 0, kasMasuk: 0, pengeluaran: 0, laba: 0 };
      }
      dailyMap[dKey].pengeluaran += p.jumlah;
    });

    // Calculate daily profit
    Object.values(dailyMap).forEach((row) => {
      row.laba = row.kasMasuk - row.pengeluaran;
    });

    const sortedDaily = Object.values(dailyMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    return {
      totalOmzet,
      kasMasukTrx,
      totalPiutang,
      totalPengeluaran,
      labaBersihRiil,
      profitMargin,
      totalTrx: filteredTrx.length,
      countLunas,
      countBelumLunas,
      totalBobotKg,
      totalPcs,
      avgOrderValue,
      collectionRate,
      tunaiCount,
      nonTunaiCount,
      serviceList: Object.entries(serviceMap).sort((a, b) => b[1].omzet - a[1].omzet),
      expenseList: Object.entries(expenseCategoryMap).sort((a, b) => b[1] - a[1]),
      customerList: Object.entries(customerMap).sort((a, b) => b[1].omzet - a[1].omzet),
      dailyRows: sortedDaily,
    };
  }, [filteredTrx, filteredExp]);

  // Tabular Filtered Transactions (by search & payment status)
  const tabFilteredTrx = useMemo(() => {
    return filteredTrx.filter((t) => {
      if (statusBayarFilter !== 'semua' && t.statusPembayaran !== statusBayarFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.namaPelanggan?.toLowerCase().includes(q);
        const matchInvoice = t.nomorTransaksi?.toLowerCase().includes(q);
        const matchPhone = t.nomorTelepon?.toLowerCase().includes(q);
        return matchName || matchInvoice || matchPhone;
      }
      return true;
    });
  }, [filteredTrx, statusBayarFilter, searchQuery]);

  // Export to CSV Function
  const handleExportCSV = () => {
    const laundryName = activeLaundry?.namaLaundry || 'Laundry Suci';
    let csv = `\uFEFF`; // UTF-8 BOM for MS Excel support
    csv += `LAPORAN KEUANGAN DAN OPERASIONAL LAUNDRY\n`;
    csv += `Laundry:;${laundryName}\n`;
    csv += `Periode:;${filterLabel}\n`;
    csv += `Tanggal Export:;${new Date().toLocaleString('id-ID')}\n\n`;

    // Summary Section
    csv += `RINGKASAN EKSEKUTIF\n`;
    csv += `Total Omzet (Penjualan):;${metrics.totalOmzet}\n`;
    csv += `Kas Masuk Riil:;${metrics.kasMasukTrx}\n`;
    csv += `Piutang Pelanggan:;${metrics.totalPiutang}\n`;
    csv += `Pengeluaran Operasional:;${metrics.totalPengeluaran}\n`;
    csv += `Laba Bersih Riil:;${metrics.labaBersihRiil}\n`;
    csv += `Margin Laba:;${metrics.profitMargin.toFixed(1)}%\n`;
    csv += `Total Nota Transaksi:;${metrics.totalTrx}\n`;
    csv += `Total Cucian (Kg):;${metrics.totalBobotKg.toFixed(1)}\n\n`;

    // Section 1: Daily Ledger
    csv += `ARUS KAS HARIAN\n`;
    csv += `Tanggal;Jumlah Nota;Omzet;Kas Masuk;Pengeluaran;Laba Bersih;Status\n`;
    metrics.dailyRows.forEach((r) => {
      csv += `${r.dateStr};${r.trxCount};${r.omzet};${r.kasMasuk};${r.pengeluaran};${r.laba};${r.laba >= 0 ? 'Surplus' : 'Defisit'}\n`;
    });
    csv += `\n`;

    // Section 2: Detailed Transactions
    csv += `RINCIAN TRANSAKSI\n`;
    csv += `No Nota;Tanggal Masuk;Nama Pelanggan;No Telepon;Layanan;Total Tagihan;DP / Terbayar;Sisa Piutang;Status Bayar;Status Pengerjaan\n`;
    filteredTrx.forEach((t) => {
      const serviceSummary = t.items.map((it) => `${it.namaLayanan} (${it.berat}${it.satuan})`).join(' + ');
      const terbayar = t.statusPembayaran === 'Lunas' ? t.totalHarga : (t.jumlahDp || 0);
      const sisa = Math.max(0, t.totalHarga - terbayar);
      const dateStr = new Date(t.tanggalMasuk).toISOString().slice(0, 16).replace('T', ' ');
      csv += `"${t.nomorTransaksi || '-'}";"${dateStr}";"${t.namaPelanggan}";"${t.nomorTelepon || '-'}";"${serviceSummary}";${t.totalHarga};${terbayar};${sisa};"${t.statusPembayaran}";"${t.status}"\n`;
    });
    csv += `\n`;

    // Section 3: Expenses
    csv += `RINCIAN PENGELUARAN\n`;
    csv += `Tanggal;Kategori Pengeluaran;Jumlah (Rp)\n`;
    filteredExp.forEach((e) => {
      const dateStr = new Date(e.tanggal).toISOString().slice(0, 10);
      csv += `"${dateStr}";"${e.keterangan}";${e.jumlah}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Laundry_${activeLaundry?.namaLaundry || 'Suci'}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Max value for daily trend chart scaling
  const maxChartVal = useMemo(() => {
    let max = 100000;
    metrics.dailyRows.forEach((r) => {
      if (r.kasMasuk > max) max = r.kasMasuk;
      if (r.pengeluaran > max) max = r.pengeluaran;
    });
    return max * 1.15;
  }, [metrics.dailyRows]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-[#800000] selection:text-white">
      {/* 1. TOP EXECUTIVE HEADER (PC Widescreen Optimized) */}
      <header className="bg-[#800000] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              title="Kembali ke Dashboard Kasir"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center gap-2 text-white font-medium text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg lg:text-xl tracking-tight leading-none text-white">
                  Laporan Keuangan & Operasional
                </h1>
                <span className="hidden md:inline-block text-white/40">|</span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/80 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  {activeLaundry?.namaLaundry || 'Cabang Utama'}
                </span>
              </div>
              <p className="text-[11px] text-white/70 tracking-wide mt-0.5">
                Executive Desktop Analytics · {filterLabel}
              </p>
            </div>
          </div>

          {/* Desktop Top Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white transition flex items-center gap-2 border border-white/20"
              title="Download spreadsheet CSV untuk Microsoft Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span className="hidden md:inline">Export Excel / CSV</span>
            </button>

            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-xs font-black text-[#800000] transition flex items-center gap-2 shadow-sm"
              title="Cetak lembaran laporan resmi ukuran kertas A4"
            >
              <Printer className="w-4 h-4 text-[#800000]" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. PC CONTROLS & DATE FILTER BAR */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Segmented Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
              {(
                [
                  { id: 'hari_ini', label: 'Hari Ini' },
                  { id: '7_hari', label: '7 Hari Terakhir' },
                  { id: '30_hari', label: '30 Hari Terakhir' },
                  { id: 'bulan_ini', label: 'Bulan Ini' },
                  { id: 'bulan_lalu', label: 'Bulan Lalu' },
                  { id: 'tahun_ini', label: 'Tahun Ini' },
                  { id: 'kustom', label: 'Rentang Kustom' },
                ] as const
              ).map((preset) => {
                const isActive = datePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setDatePreset(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-[#800000] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Selectors (when kustom or year is selected) */}
            <div className="flex items-center gap-2 flex-wrap">
              {datePreset === 'kustom' && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                  <span className="text-slate-500 font-medium">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none"
                  />
                  <span className="text-slate-400">s/d</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none"
                  />
                </div>
              )}

              {datePreset === 'tahun_ini' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-semibold">Tahun:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:ring-1 focus:ring-[#800000]"
                  >
                    {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 ml-auto">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Update: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* EXECUTIVE KPI STAT CARDS (5 Kolom Desktop Layout) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Omzet */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Omzet Penjualan</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatRupiah(metrics.totalOmzet)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{metrics.totalTrx} Nota Transaksi</span>
              <span className="font-semibold text-slate-700">AOV: {formatRupiah(metrics.avgOrderValue)}</span>
            </div>
          </div>

          {/* Card 2: Kas Masuk Riil */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Kas Masuk Riil (Collected)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {formatRupiah(metrics.kasMasukTrx)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Terkumpul {metrics.collectionRate}%</span>
              <span className="font-semibold text-emerald-700">{metrics.countLunas} Lunas</span>
            </div>
          </div>

          {/* Card 3: Piutang Pelanggan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Piutang Belum Lunas</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              {formatRupiah(metrics.totalPiutang)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{metrics.countBelumLunas} Nota Belum Lunas</span>
              <span className="font-semibold text-amber-700">Perlu Ditagih</span>
            </div>
          </div>

          {/* Card 4: Pengeluaran Operasional */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden group">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Beban Operasional</span>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-red-600 tracking-tight">
              {formatRupiah(metrics.totalPengeluaran)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{filteredExp.length} Transaksi Biaya</span>
              <span className="font-semibold text-red-700">{metrics.expenseList.length} Kategori</span>
            </div>
          </div>

          {/* Card 5: Laba Bersih Riil */}
          <div className={`rounded-2xl border p-4 shadow-2xs hover:shadow-xs transition relative overflow-hidden group ${
            metrics.labaBersihRiil >= 0
              ? 'bg-gradient-to-br from-emerald-500/10 via-white to-white border-emerald-200'
              : 'bg-gradient-to-br from-red-500/10 via-white to-white border-red-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span className={metrics.labaBersihRiil >= 0 ? 'text-emerald-900 font-extrabold' : 'text-red-900 font-extrabold'}>
                Laba Bersih Riil
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                metrics.labaBersihRiil >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl font-black tracking-tight ${
              metrics.labaBersihRiil >= 0 ? 'text-emerald-700' : 'text-red-600'
            }`}>
              {formatRupiah(metrics.labaBersihRiil)}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-600">Net Profit Margin</span>
              <span className={metrics.profitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                {metrics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </section>

        {/* 4. VISUAL ANALYTICS & BREAKDOWN (PC Two-Column Section) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Kiri: Grafik Tren Harian Arus Keuangan (2 Kolom Lebar) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#800000]" />
                  Tren Finansial Harian (Kas Masuk vs Beban Operasional)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi perbandingan uang masuk kasir dengan pengeluaran tiap tanggal
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
                  <span>Kas Masuk</span>
                </div>
                <div className="flex items-center gap-1.5 text-red-600">
                  <span className="w-3 h-3 rounded-xs bg-red-400 inline-block"></span>
                  <span>Pengeluaran</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Bar Chart */}
            <div className="pt-2">
              {metrics.dailyRows.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                  <span>Tidak ada data transaksi atau pengeluaran pada rentang waktu ini.</span>
                </div>
              ) : (
                <div className="h-64 w-full flex items-end gap-2 sm:gap-3 px-2 pt-6 pb-2 bg-slate-50/70 rounded-xl border border-slate-100 overflow-x-auto relative">
                  {metrics.dailyRows.map((row) => {
                    const masukHeight = Math.max(6, Math.min(100, (row.kasMasuk / maxChartVal) * 100));
                    const keluarHeight = Math.max(6, Math.min(100, (row.pengeluaran / maxChartVal) * 100));
                    const isHovered = chartHoverDate === row.dateStr;

                    return (
                      <div
                        key={row.dateStr}
                        onMouseEnter={() => setChartHoverDate(row.dateStr)}
                        onMouseLeave={() => setChartHoverDate(null)}
                        className="flex-1 min-w-[36px] max-w-[64px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      >
                        {/* Hover Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-[105%] z-20 bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-left pointer-events-none whitespace-nowrap min-w-[160px] animate-fade-in border border-slate-700">
                            <div className="text-[11px] font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1.5">
                              {formatDateIndo(new Date(row.dateStr + 'T00:00:00').getTime())}
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between gap-3 text-emerald-400 font-bold">
                                <span>Kas Masuk:</span>
                                <span>{formatRupiah(row.kasMasuk)}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-rose-400 font-semibold">
                                <span>Pengeluaran:</span>
                                <span>{formatRupiah(row.pengeluaran)}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-white font-extrabold border-t border-slate-700/80 pt-1 mt-1">
                                <span>Laba Harian:</span>
                                <span>{formatRupiah(row.laba)}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {row.trxCount} Nota Pesanan
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dual Bar (Kas Masuk & Pengeluaran) */}
                        <div className="w-full flex items-end justify-center gap-1 h-[85%] pb-1">
                          <div
                            style={{ height: `${masukHeight}%` }}
                            className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                              isHovered ? 'bg-emerald-600 shadow-md scale-y-105 origin-bottom' : 'bg-emerald-500'
                            }`}
                          />
                          <div
                            style={{ height: `${keluarHeight}%` }}
                            className={`w-1/2 rounded-t-sm transition-all duration-300 ${
                              isHovered ? 'bg-red-500 shadow-md scale-y-105 origin-bottom' : 'bg-red-400'
                            }`}
                          />
                        </div>

                        {/* Date Label */}
                        <div className="text-[10px] font-bold text-slate-500 truncate w-full text-center mt-1">
                          {row.dateStr.slice(8, 10)}/{row.dateStr.slice(5, 7)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick KPI Footer for the chart */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Total Beban Cucian</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {metrics.totalBobotKg.toFixed(1)} Kg <span className="text-xs font-normal text-slate-500">+ {metrics.totalPcs} Pcs</span>
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Rasio Pembayaran</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {metrics.tunaiCount} Tunai <span className="text-xs font-normal text-slate-500">· {metrics.nonTunaiCount} Non-Tunai</span>
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-slate-500 block text-[11px]">Rata-rata Laba / Nota</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {metrics.totalTrx > 0 ? formatRupiah(Math.round(metrics.labaBersihRiil / metrics.totalTrx)) : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>

          {/* Panel Kanan: Kinerja Layanan & Struktur Biaya (1 Kolom) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5 flex flex-col justify-between">
            {/* 1. Layanan Terlaris */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#800000]" />
                  Layanan Terlaris (Kontribusi Omzet)
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {metrics.serviceList.length} Layanan
                </span>
              </div>

              {metrics.serviceList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Belum ada layanan terdata.</p>
              ) : (
                <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                  {metrics.serviceList.slice(0, 5).map(([name, data]) => {
                    const pct = metrics.totalOmzet > 0 ? Math.round((data.omzet / metrics.totalOmzet) * 100) : 0;
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-[11px]">{data.weight.toFixed(1)} Unit</span>
                            <span className="font-extrabold text-slate-900">{formatRupiah(data.omzet)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-[#800000] rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Struktur Beban Pengeluaran */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                  Struktur Biaya Operasional
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  {formatRupiah(metrics.totalPengeluaran)}
                </span>
              </div>

              {metrics.expenseList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Tidak ada pengeluaran pada periode ini.</p>
              ) : (
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {metrics.expenseList.slice(0, 4).map(([cat, amount]) => {
                    const pct = metrics.totalPengeluaran > 0 ? Math.round((amount / metrics.totalPengeluaran) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{cat}</span>
                          <span className="font-bold text-red-600">{formatRupiah(amount)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-red-400 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. MULTI-TAB DETAILED LEDGER SECTION (PC Table Master) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Tabs Navigation & Search Bar */}
          <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('arus_kas_harian')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'arus_kas_harian'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arus Kas Harian ({metrics.dailyRows.length})
              </button>

              <button
                onClick={() => setActiveTab('buku_transaksi')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'buku_transaksi'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Buku Besar Transaksi ({filteredTrx.length})
              </button>

              <button
                onClick={() => setActiveTab('pengeluaran')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'pengeluaran'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengeluaran Operasional ({filteredExp.length})
              </button>

              <button
                onClick={() => setActiveTab('top_pelanggan')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'top_pelanggan'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Peringkat Pelanggan ({metrics.customerList.length})
              </button>
            </div>

            {/* Sub-Filters for Tab 2 */}
            {activeTab === 'buku_transaksi' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nota / nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#800000]"
                  />
                </div>

                <select
                  value={statusBayarFilter}
                  onChange={(e) => setStatusBayarFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#800000]"
                >
                  <option value="semua">Semua Status</option>
                  <option value="Lunas">Lunas Saja</option>
                  <option value="Belum Lunas">Belum Lunas (Piutang)</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab Content 1: Arus Kas Harian */}
          {activeTab === 'arus_kas_harian' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-center">Nota Masuk</th>
                    <th className="py-3 px-4 text-right">Total Omzet</th>
                    <th className="py-3 px-4 text-right text-emerald-800">Kas Masuk Riil</th>
                    <th className="py-3 px-4 text-right text-red-700">Pengeluaran</th>
                    <th className="py-3 px-4 text-right">Laba Harian</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {metrics.dailyRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        Tidak ada catatan arus kas pada rentang waktu ini.
                      </td>
                    </tr>
                  ) : (
                    metrics.dailyRows.map((row) => (
                      <tr key={row.dateStr} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {formatDateIndo(new Date(row.dateStr + 'T00:00:00').getTime())}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-600">
                          {row.trxCount} Order
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">
                          {formatRupiah(row.omzet)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          {formatRupiah(row.kasMasuk)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-red-600">
                          {formatRupiah(row.pengeluaran)}
                        </td>
                        <td className="py-3 px-4 text-right font-black">
                          <span className={row.laba >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                            {formatRupiah(row.laba)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              row.laba >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {row.laba >= 0 ? 'Surplus' : 'Defisit'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {metrics.dailyRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <td className="py-3 px-4">TOTAL KESELURUHAN</td>
                      <td className="py-3 px-4 text-center">{metrics.totalTrx} Order</td>
                      <td className="py-3 px-4 text-right">{formatRupiah(metrics.totalOmzet)}</td>
                      <td className="py-3 px-4 text-right text-emerald-700">{formatRupiah(metrics.kasMasukTrx)}</td>
                      <td className="py-3 px-4 text-right text-red-600">{formatRupiah(metrics.totalPengeluaran)}</td>
                      <td className="py-3 px-4 text-right text-emerald-800">{formatRupiah(metrics.labaBersihRiil)}</td>
                      <td className="py-3 px-4 text-center">
                        {metrics.labaBersihRiil >= 0 ? 'SURPLUS' : 'DEFISIT'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Tab Content 2: Buku Besar Transaksi */}
          {activeTab === 'buku_transaksi' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">No. Nota</th>
                    <th className="py-3 px-4">Waktu Masuk</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Rincian Layanan</th>
                    <th className="py-3 px-4 text-right">Total Tagihan</th>
                    <th className="py-3 px-4 text-right text-emerald-800">Terbayar</th>
                    <th className="py-3 px-4 text-right text-amber-700">Sisa Piutang</th>
                    <th className="py-3 px-4 text-center">Status Bayar</th>
                    <th className="py-3 px-4 text-center">Status Cucian</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {tabFilteredTrx.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                        Tidak ada transaksi yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    tabFilteredTrx.map((t) => {
                      const terbayar = t.statusPembayaran === 'Lunas' ? t.totalHarga : (t.jumlahDp || 0);
                      const sisaPiutang = Math.max(0, t.totalHarga - terbayar);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {t.nomorTransaksi || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatShortDate(t.tanggalMasuk)} {formatShortTime(t.tanggalMasuk)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{t.namaPelanggan}</div>
                            {t.nomorTelepon && (
                              <div className="text-[10px] text-slate-400 font-mono">{t.nomorTelepon}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                            {t.items.map((it) => `${it.namaLayanan} (${it.berat}${it.satuan})`).join(', ')}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                            {formatRupiah(t.totalHarga)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-700">
                            {formatRupiah(terbayar)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-amber-600">
                            {sisaPiutang > 0 ? formatRupiah(sisaPiutang) : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                t.statusPembayaran === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {t.statusPembayaran}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                t.status === 'Selesai'
                                  ? 'bg-blue-100 text-blue-800'
                                  : t.status === 'Diambil'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {onOpenDetailTransaksi && (
                              <button
                                onClick={() => onOpenDetailTransaksi(t.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-[#800000] hover:bg-slate-100 transition"
                                title="Lihat detail pesanan & nota"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content 3: Pengeluaran Operasional */}
          {activeTab === 'pengeluaran' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Kategori / Keterangan</th>
                    <th className="py-3 px-4 text-right">Nominal Pengeluaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredExp.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                        Tidak ada pencatatan pengeluaran operasional pada rentang waktu ini.
                      </td>
                    </tr>
                  ) : (
                    filteredExp.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {formatDateIndo(e.tanggal)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {e.keterangan}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-red-600">
                          {formatRupiah(e.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredExp.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                      <td className="py-3 px-4" colSpan={2}>TOTAL PENGELUARAN OPERASIONAL</td>
                      <td className="py-3 px-4 text-right text-red-600">{formatRupiah(metrics.totalPengeluaran)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* Tab Content 4: Peringkat Pelanggan */}
          {activeTab === 'top_pelanggan' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Nama Pelanggan</th>
                    <th className="py-3 px-4">No. Telepon</th>
                    <th className="py-3 px-4 text-center">Frekuensi Order</th>
                    <th className="py-3 px-4 text-center">Total Cucian</th>
                    <th className="py-3 px-4 text-right text-emerald-800">Total Belanja (LTV)</th>
                    <th className="py-3 px-4 text-right text-amber-700">Sisa Piutang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {metrics.customerList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        Belum ada pelanggan terdata pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    metrics.customerList.map(([name, data], idx) => (
                      <tr key={name} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-black text-slate-500">#{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{name}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{data.phone || '-'}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{data.count} Kali</td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-600">{data.weight.toFixed(1)} Kg/Pcs</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">{formatRupiah(data.omzet)}</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">
                          {data.piutang > 0 ? formatRupiah(data.piutang) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* 6. MODAL CETAK LAPORAN RESMI (A4 Standard Print Document Preview) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in no-print">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Top Bar */}
            <div className="bg-[#800000] text-white px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                <h3 className="font-extrabold text-sm tracking-wide">
                  Preview Dokumen Cetak Laporan (Standar A4)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#800000] font-black text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 rounded-full text-white/80 hover:bg-white/20 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Area) */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              <div
                id="printable-report"
                className="w-full max-w-2xl bg-white shadow-md p-8 border border-slate-200 text-slate-900 space-y-6"
              >
                {/* Official Letterhead (Kop Surat) */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                      {activeLaundry?.namaLaundry || settings?.headerStruk || 'Barokah Laundry Suci'}
                    </h2>
                    <p className="text-xs text-slate-600 max-w-md">
                      {activeLaundry?.alamat || settings?.address || 'Jl. Raya Cikutra No. 142, Bandung'}
                    </p>
                    <p className="text-xs text-slate-600 font-mono">
                      Telp / WhatsApp: {activeLaundry?.nomorTelepon || settings?.phoneNumber || '0856-5978-1477'}
                    </p>
                  </div>

                  {settings?.useLogo && settings?.logoPath && (
                    <img
                      src={settings.logoPath}
                      alt="Logo"
                      className="h-16 w-auto max-w-[120px] object-contain"
                    />
                  )}
                </div>

                {/* Report Title & Metadata */}
                <div className="text-center space-y-1">
                  <h3 className="font-black text-base uppercase tracking-wider text-slate-900">
                    LAPORAN KEUANGAN & OPERASIONAL
                  </h3>
                  <p className="text-xs font-semibold text-slate-600">
                    Periode: {filterLabel}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Dicetak pada: {formatDateIndo(Date.now(), true)}
                  </p>
                </div>

                {/* Executive Summary Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                    1. RINGKASAN EKSEKUTIF (LABA / RUGI)
                  </div>
                  <table className="w-full text-xs border border-slate-200">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-bold text-slate-700">Total Omzet Transaksi</td>
                        <td className="py-1.5 px-3 text-right font-black text-slate-900">{formatRupiah(metrics.totalOmzet)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-bold text-emerald-800">Kas Masuk Riil Diterima</td>
                        <td className="py-1.5 px-3 text-right font-black text-emerald-700">{formatRupiah(metrics.kasMasukTrx)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-bold text-amber-700">Piutang Belum Lunas</td>
                        <td className="py-1.5 px-3 text-right font-bold text-amber-600">{formatRupiah(metrics.totalPiutang)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 bg-slate-50 font-bold text-red-700">Total Beban Operasional</td>
                        <td className="py-1.5 px-3 text-right font-black text-red-600">{formatRupiah(metrics.totalPengeluaran)}</td>
                      </tr>
                      <tr className="bg-slate-100 font-black">
                        <td className="py-2 px-3 text-slate-900">LABA BERSIH RIIL</td>
                        <td className={`py-2 px-3 text-right text-sm ${metrics.labaBersihRiil >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {formatRupiah(metrics.labaBersihRiil)} ({metrics.profitMargin.toFixed(1)}%)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Service Breakdown Summary */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                    2. REKAPITULASI LAYANAN
                  </div>
                  <table className="w-full text-xs border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                        <th className="py-1.5 px-3 text-left">Nama Layanan</th>
                        <th className="py-1.5 px-3 text-center">Volume (Kg/Pcs)</th>
                        <th className="py-1.5 px-3 text-right">Omzet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {metrics.serviceList.map(([name, data]) => (
                        <tr key={name}>
                          <td className="py-1.5 px-3 font-medium text-slate-800">{name}</td>
                          <td className="py-1.5 px-3 text-center text-slate-600">{data.weight.toFixed(1)}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatRupiah(data.omzet)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expense Breakdown Summary */}
                {metrics.expenseList.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                      3. REKAPITULASI PENGELUARAN OPERASIONAL
                    </div>
                    <table className="w-full text-xs border border-slate-200">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                          <th className="py-1.5 px-3 text-left">Keterangan Biaya</th>
                          <th className="py-1.5 px-3 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {metrics.expenseList.map(([cat, val]) => (
                          <tr key={cat}>
                            <td className="py-1.5 px-3 font-medium text-slate-800">{cat}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-red-600">{formatRupiah(val)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signatures Block */}
                <div className="pt-8 flex justify-between text-xs text-center">
                  <div className="space-y-16">
                    <p className="text-slate-600">Kasir / Penanggung Jawab,</p>
                    <p className="font-bold border-t border-slate-400 pt-1 px-6">
                      ( .................................... )
                    </p>
                  </div>
                  <div className="space-y-16">
                    <p className="text-slate-600">Pemilik / Owner Laundry,</p>
                    <p className="font-bold border-t border-slate-400 pt-1 px-6">
                      ( .................................... )
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
