import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  LogOut,
  Building2,
  Users,
  Tag,
  DollarSign,
  TrendingDown,
  Receipt,
  Printer,
  Sliders,
  Clock,
  Upload,
  Trash2,
  Check,
  X,
  Smartphone
} from 'lucide-react';
import { SettingsData, User, Laundry } from '../types';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface SettingsViewProps {
  onBack: () => void;
  settings: SettingsData;
  currentUser: User;
  activeLaundry: Laundry;
  onUpdateSettings: (newSettings: SettingsData) => void;
  onOpenKelolaPelanggan: () => void;
  onOpenKelolaLayanan: () => void;
  onOpenKelolaOwner: () => void;
  onOpenKelolaKasir: () => void;
  onOpenApkModal: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  settings,
  currentUser,
  activeLaundry,
  onUpdateSettings,
  onOpenKelolaPelanggan,
  onOpenKelolaLayanan,
  onOpenKelolaOwner,
  onOpenKelolaKasir,
  onOpenApkModal,
  onLogout,
}) => {
  const isOwner = currentUser.role === 'owner';

  // Sub-dialog states
  const [showInfoStrukModal, setShowInfoStrukModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showFeatureSettingsModal, setShowFeatureSettingsModal] = useState(false);

  // Edit receipt info state
  const [headerStruk, setHeaderStruk] = useState(settings.headerStruk);
  const [address, setAddress] = useState(settings.address);
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [footerStruk, setFooterStruk] = useState(settings.footerStruk);
  const [chattyFooter, setChattyFooter] = useState(settings.chattyFooter);
  const [useLogo, setUseLogo] = useState(settings.useLogo);
  const [logoPath, setLogoPath] = useState<string | null>(settings.logoPath);

  // Printer name
  const [printerName, setPrinterName] = useState(settings.printerName);

  // Toggle Features State
  const [pemasukanManual, setPemasukanManual] = useState(settings.pemasukanManualEnabled);
  const [estimasiPerItem, setEstimasiPerItem] = useState(settings.estimasiDisplayMode === 0);
  const [waNotification, setWaNotification] = useState(settings.waNotificationEnabled);
  const [selesaikanOtomatis, setSelesaikanOtomatis] = useState(settings.selesaikanSaatDitugaskan);
  const [ambilTanpaSelesai, setAmbilTanpaSelesai] = useState(settings.pengambilanTanpaSelesai);
  const [poinSystem, setPoinSystem] = useState(settings.poinSystemEnabled);
  const [rupiahTransaksi, setRupiahTransaksi] = useState(settings.rupiahPerPoin * 1000);
  const [poinDidapat, setPoinDidapat] = useState(1000);

  // Live Digital Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveInfoStruk = () => {
    onUpdateSettings({
      ...settings,
      headerStruk,
      address,
      phoneNumber,
      footerStruk,
      chattyFooter,
      useLogo,
      logoPath,
    });
    setShowInfoStrukModal(false);
    alert('Informasi struk berhasil disimpan!');
  };

  const handleSavePrinter = () => {
    if (!printerName.trim()) {
      alert('Nama printer tidak boleh kosong.');
      return;
    }
    onUpdateSettings({
      ...settings,
      printerName: printerName.trim(),
    });
    setShowPrinterModal(false);
    alert('Pengaturan printer berhasil disimpan!');
  };

  const handleSaveFeatureSettings = () => {
    const rPerPoin = poinDidapat > 0 ? Math.round(rupiahTransaksi / poinDidapat) : 10;
    onUpdateSettings({
      ...settings,
      pemasukanManualEnabled: pemasukanManual,
      estimasiDisplayMode: estimasiPerItem ? 0 : 1,
      waNotificationEnabled: waNotification,
      selesaikanSaatDitugaskan: selesaikanOtomatis,
      pengambilanTanpaSelesai: ambilTanpaSelesai,
      poinSystemEnabled: poinSystem,
      rupiahPerPoin: rPerPoin,
      nilaiTukarPoin: 1,
    });
    setShowFeatureSettingsModal(false);
    alert('Pengaturan fitur aplikasi berhasil disimpan!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPath(reader.result as string);
        setUseLogo(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* 1. APP BAR HEADER (Maroon) */}
      <header className="bg-[#800000] text-white shadow-md sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-bold text-base tracking-wide">Pengaturan Laundry</h1>
          <button
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin keluar dari akun ini?')) {
                onLogout();
              }
            }}
            title="Keluar Akun"
            className="p-1.5 rounded-full hover:bg-white/10 transition text-rose-200 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Info Langganan Bar */}
        <div className="px-4 pb-3 flex items-center justify-between border-t border-white/10 pt-2">
          <div>
            <div className="text-xs font-bold text-white">Status: Aktif</div>
            <div className="text-[11px] text-white/80">Paket Premium Laundry</div>
          </div>
          <button
            onClick={onOpenKelolaOwner}
            className="px-3 py-1 rounded-lg border border-white text-white font-bold text-xs hover:bg-white/15 transition active:scale-95"
          >
            + Perpanjang
          </button>
        </div>
      </header>

      {/* 2. MAIN SCROLL CONTAINER */}
      <main className="flex-1 p-3 space-y-3 overflow-y-auto max-w-xl mx-auto w-full">
        {/* Brand Profile Banner */}
        <div className="bg-[#800000] text-white rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <div className="text-lg font-black">{activeLaundry.namaLaundry}</div>
            <div className="flex justify-between text-xs text-white/80 pt-1 border-t border-white/10 mt-1">
              <span>Owner: {currentUser.displayName}</span>
              <span>{activeLaundry.nomorTelepon || settings.phoneNumber}</span>
            </div>
          </div>

          {/* Tombol Khusus: Unduh APK / Play Store */}
          <button
            onClick={onOpenApkModal}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-98"
          >
            <Smartphone className="w-4 h-4 text-slate-900" />
            <span>Unduh Berkas APK & Play Store (TWA)</span>
          </button>

          {/* SECTION 1: MANAJEMEN OUTLET (OWNER ONLY) */}
          {isOwner && (
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                MANAJEMEN OUTLET
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onOpenKelolaOwner}
                  className="py-2.5 px-3 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-bold text-left transition"
                >
                  Profil & Cabang
                </button>
                <button
                  onClick={onOpenKelolaKasir}
                  className="py-2.5 px-3 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-bold text-left transition"
                >
                  Kelola Kasir
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: MASTER DATA LAUNDRY */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              MASTER DATA LAUNDRY
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenKelolaPelanggan}
                className="py-2.5 px-3 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-bold text-left transition"
              >
                Data Pelanggan
              </button>
              <button
                onClick={onOpenKelolaLayanan}
                className="py-2.5 px-3 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-bold text-left transition"
              >
                Daftar Harga Layanan
              </button>
            </div>
          </div>

          {/* SECTION 3: STRUK & PRINTER */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              STRUK & PRINTER
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowInfoStrukModal(true)}
                className="py-2.5 px-3 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-bold text-left transition"
              >
                Identitas Struk
              </button>
              <button
                onClick={() => setShowPrinterModal(true)}
                className="py-2.5 px-3 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-bold text-left transition"
              >
                Printer Bluetooth
              </button>
            </div>
          </div>

          {/* SECTION 4: PENGATURAN FITUR */}
          <div className="pt-2">
            <button
              onClick={() => setShowFeatureSettingsModal(true)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#800000] font-black text-xs shadow-xs transition"
            >
              Pengaturan Fitur & Kebijakan
            </button>
          </div>

          {/* SECTION 5: INSTALASI APLIKASI PWA & APK */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              INSTALASI & APLIKASI
            </div>
            <div className="grid grid-cols-2 gap-2">
              <PWAInstallButton variant="standalone" className="!bg-white !text-[#800000] hover:!bg-amber-50" />
              <button
                onClick={onOpenApkModal}
                className="py-2.5 px-3 rounded-xl border border-white/30 hover:bg-white/10 text-xs font-bold text-left transition flex items-center justify-between"
              >
                <span>Panduan APK / TWA</span>
                <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Live Digital Clock at bottom (Matches cardJamLive) */}
      <footer className="bg-[#800000] text-white/80 text-center py-2 text-xs font-mono border-t border-white/10">
        {currentTimeStr}
      </footer>

      {/* MODAL 1: IDENTITAS STRUK */}
      {showInfoStrukModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Identitas & Logo Struk</h3>
              <button onClick={() => setShowInfoStrukModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Logo Section */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 text-center">
              <label className="flex items-center justify-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLogo}
                  onChange={(e) => setUseLogo(e.target.checked)}
                  className="w-4 h-4 accent-[#800000]"
                />
                <span>Gunakan Logo di Struk</span>
              </label>

              {useLogo && (
                <div className="space-y-2">
                  {logoPath ? (
                    <div className="relative inline-block border p-1 rounded-lg bg-white">
                      <img src={logoPath} alt="Logo" className="h-16 w-auto max-w-[140px] object-contain" />
                      <button
                        onClick={() => setLogoPath(null)}
                        className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 rounded-xl p-3 block cursor-pointer hover:bg-slate-100 transition">
                      <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs text-slate-500 font-semibold">Pilih Gambar Logo Toko</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Nama Laundry (Header Struk)
              </label>
              <input
                type="text"
                value={headerStruk}
                onChange={(e) => setHeaderStruk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Alamat Lengkap
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Catatan Syarat & Ketentuan Bawah Struk
              </label>
              <textarea
                rows={2}
                value={footerStruk}
                onChange={(e) => setFooterStruk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Pesan Penutup Struk
              </label>
              <input
                type="text"
                value={chattyFooter}
                onChange={(e) => setChattyFooter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowInfoStrukModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveInfoStruk}
                className="flex-1 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold shadow-xs"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTER BLUETOOTH */}
      {showPrinterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Atur Printer Bluetooth</h3>
              <button onClick={() => setShowPrinterModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Masukkan nama perangkat printer thermal bluetooth Anda (Contoh standar: <strong>RPP02N</strong> atau <strong>PT-210</strong>).
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Nama Bluetooth Printer
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPrinterName('RPP02N')}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Reset Default
              </button>
              <button
                onClick={handleSavePrinter}
                className="flex-1 py-2 rounded-xl bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold shadow-xs"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PENGATURAN FITUR (Matches activity_struk_settings.xml) */}
      {showFeatureSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Pengaturan Fitur Aplikasi</h3>
              <button onClick={() => setShowFeatureSettingsModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pemasukanManual}
                  onChange={(e) => setPemasukanManual(e.target.checked)}
                  className="w-4 h-4 accent-[#800000]"
                />
                <span className="font-bold text-slate-800">● Aktifkan Catat Pemasukan Manual</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={estimasiPerItem}
                  onChange={(e) => setEstimasiPerItem(e.target.checked)}
                  className="w-4 h-4 accent-[#800000]"
                />
                <span className="font-bold text-slate-800">
                  ● Tampilkan estimasi selesai pada setiap item layanan
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waNotification}
                  onChange={(e) => setWaNotification(e.target.checked)}
                  className="w-4 h-4 accent-[#800000]"
                />
                <span className="font-bold text-slate-800">
                  ● Konfirmasi kirim pesan WhatsApp saat cucian selesai
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selesaikanOtomatis}
                  onChange={(e) => setSelesaikanOtomatis(e.target.checked)}
                  className="w-4 h-4 accent-[#800000]"
                />
                <span className="font-bold text-slate-800">
                  ● Selesaikan status pengerjaan otomatis saat ditugaskan
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ambilTanpaSelesai}
                  onChange={(e) => setAmbilTanpaSelesai(e.target.checked)}
                  className="w-4 h-4 accent-[#800000]"
                />
                <span className="font-bold text-slate-800">
                  ● Izinkan ambil cucian tanpa menunggu status selesai
                </span>
              </label>

              {/* Loyalty Point Settings */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={poinSystem}
                    onChange={(e) => setPoinSystem(e.target.checked)}
                    className="w-4 h-4 accent-[#800000]"
                  />
                  <span>● Aktifkan sistem poin pelanggan</span>
                </label>

                {poinSystem && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                        Setiap Transaksi (Rp):
                      </span>
                      <input
                        type="number"
                        value={rupiahTransaksi}
                        onChange={(e) => setRupiahTransaksi(Math.max(1000, parseInt(e.target.value, 10) || 1000))}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                        Mendapat Poin:
                      </span>
                      <input
                        type="number"
                        value={poinDidapat}
                        onChange={(e) => setPoinDidapat(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowFeatureSettingsModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveFeatureSettings}
                className="flex-1 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-white text-xs font-bold shadow-xs"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
