import React, { useState, useEffect } from 'react';
import { StorageService, defaultSettings, defaultOwnerUser } from './utils/storage';
import {
  Transaksi,
  Layanan,
  Pelanggan,
  Pengeluaran,
  JenisPengeluaran,
  JenisPemasukan,
  User,
  Laundry,
  SettingsData,
  SubscriptionHistory,
  ArusKas,
  LayananItem,
} from './types';
import { SplashView } from './views/SplashView';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { TambahEditView } from './views/TambahEditView';
import { DetailTransaksiView } from './views/DetailTransaksiView';
import { StatusPengerjaanView } from './views/StatusPengerjaanView';
import { BukuKasView } from './views/BukuKasView';
import { LaporanView } from './views/LaporanView';
import { ArsipView } from './views/ArsipView';
import { KelolaPelangganView } from './views/KelolaPelangganView';
import { KelolaLayananView } from './views/KelolaLayananView';
import { KelolaOwnerView } from './views/KelolaOwnerView';
import { KelolaKasirView } from './views/KelolaKasirView';
import { SettingsView } from './views/SettingsView';

import { AturKasModal } from './components/AturKasModal';
import { SwitchBranchModal } from './components/SwitchBranchModal';
import { ApkPlaystoreModal } from './components/ApkPlaystoreModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useDeviceDetect } from './hooks/useDeviceDetect';

type ViewType =
  | 'splash'
  | 'auth'
  | 'dashboard'
  | 'tambah_edit'
  | 'detail_transaksi'
  | 'status_pengerjaan'
  | 'buku_kas'
  | 'laporan'
  | 'arsip'
  | 'kelola_pelanggan'
  | 'kelola_layanan'
  | 'kelola_owner'
  | 'kelola_kasir'
  | 'settings';

export default function App() {
  // Initialize sample data if first load
  useEffect(() => {
    StorageService.initData();
  }, []);

  // Application State
  const [activeView, setActiveView] = useState<ViewType>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    StorageService.get<User | null>('active_user', defaultOwnerUser)
  );

  const [settings, setSettings] = useState<SettingsData>(() =>
    StorageService.get<SettingsData>('settings', defaultSettings)
  );

  const [laundries, setLaundries] = useState<Laundry[]>(() =>
    StorageService.get<Laundry[]>('laundries', [])
  );

  const [activeLaundryId, setActiveLaundryId] = useState<string>(() =>
    StorageService.get<string>('current_laundry_id', 'lnd-1')
  );

  const [transaksiList, setTransaksiList] = useState<Transaksi[]>(() =>
    StorageService.get<Transaksi[]>('transaksi', [])
  );

  const [layananList, setLayananList] = useState<Layanan[]>(() =>
    StorageService.get<Layanan[]>('layanan', [])
  );

  const [pelangganList, setPelangganList] = useState<Pelanggan[]>(() =>
    StorageService.get<Pelanggan[]>('pelanggan', [])
  );

  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>(() =>
    StorageService.get<Pengeluaran[]>('pengeluaran', [])
  );

  const [manualCashLogs, setManualCashLogs] = useState<ArusKas[]>(() =>
    StorageService.get<ArusKas[]>('manual_cash_logs', [])
  );

  const [staffList, setStaffList] = useState<User[]>(() =>
    StorageService.get<User[]>('staff', [])
  );

  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>(() =>
    StorageService.get<SubscriptionHistory[]>('subscription_history', [])
  );

  const [jenisPengeluaranList, setJenisPengeluaranList] = useState<JenisPengeluaran[]>(() =>
    StorageService.get<JenisPengeluaran[]>('jenis_pengeluaran', [])
  );

  const [jenisPemasukanList, setJenisPemasukanList] = useState<JenisPemasukan[]>(() =>
    StorageService.get<JenisPemasukan[]>('jenis_pemasukan', [])
  );

  // Active transaction in view/edit
  const [selectedTransaksiId, setSelectedTransaksiId] = useState<string | null>(null);
  const [transaksiToEdit, setTransaksiToEdit] = useState<Transaksi | null>(null);

  // Global Modals
  const [isAturKasOpen, setIsAturKasOpen] = useState(false);
  const [isSwitchBranchOpen, setIsSwitchBranchOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Active branch entity
  const activeLaundry =
    laundries.find((l) => l.id === activeLaundryId) ||
    laundries[0] || {
      id: 'lnd-1',
      ownerId: 'own-1',
      namaLaundry: settings.headerStruk || 'Barokah Laundry Suci',
      alamat: settings.address,
      nomorTelepon: settings.phoneNumber,
    };

  // Sync state helpers
  const updateSettings = (newSettings: SettingsData) => {
    setSettings(newSettings);
    StorageService.set('settings', newSettings);
  };

  const updateTransaksiList = (newList: Transaksi[]) => {
    setTransaksiList(newList);
    StorageService.set('transaksi', newList);
  };

  const updatePengeluaranList = (newList: Pengeluaran[]) => {
    setPengeluaranList(newList);
    StorageService.set('pengeluaran', newList);
  };

  const updatePelangganList = (newList: Pelanggan[]) => {
    setPelangganList(newList);
    StorageService.set('pelanggan', newList);
  };

  const updateLayananList = (newList: Layanan[]) => {
    setLayananList(newList);
    StorageService.set('layanan', newList);
  };

  const updateLaundries = (newList: Laundry[]) => {
    setLaundries(newList);
    StorageService.set('laundries', newList);
  };

  const updateStaffList = (newList: User[]) => {
    setStaffList(newList);
    StorageService.set('staff', newList);
  };

  // Handlers
  const handleSelectBranch = (laundryId: string) => {
    setActiveLaundryId(laundryId);
    StorageService.set('current_laundry_id', laundryId);
  };

  const handleSaveTransaction = (
    data: Omit<Transaksi, 'id'> & { id?: string },
    items: LayananItem[]
  ) => {
    if (data.id) {
      // Edit existing
      const updatedList = transaksiList.map((t) =>
        t.id === data.id ? ({ ...data, id: data.id } as Transaksi) : t
      );
      updateTransaksiList(updatedList);
      setSelectedTransaksiId(data.id);
      setActiveView('detail_transaksi');
    } else {
      // Create new
      const dateKey = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const countToday =
        transaksiList.filter((t) => t.nomorTransaksi?.startsWith(dateKey)).length + 1;
      const newInvoice = `${dateKey}/${countToday}`;

      const newTrx: Transaksi = {
        ...data,
        id: `trx-${Date.now()}`,
        nomorTransaksi: newInvoice,
        items,
      };

      const updatedList = [newTrx, ...transaksiList];
      updateTransaksiList(updatedList);

      // Add points to customer if enabled
      if (settings.poinSystemEnabled && data.namaPelanggan) {
        const existingCust = pelangganList.find(
          (p) => p.nama.toLowerCase() === data.namaPelanggan.toLowerCase()
        );
        const earnedPoints = Math.floor(
          data.totalHarga / (settings.rupiahPerPoin * 10 || 100)
        );

        if (existingCust) {
          const updatedCust = { ...existingCust, poin: existingCust.poin + earnedPoints };
          updatePelangganList(
            pelangganList.map((p) => (p.id === existingCust.id ? updatedCust : p))
          );
        } else {
          const newCust: Pelanggan = {
            id: `pel-${Date.now()}`,
            laundryId: activeLaundryId,
            nama: data.namaPelanggan,
            nomorTelepon: data.nomorTelepon,
            alamat: data.alamat,
            poin: earnedPoints,
          };
          updatePelangganList([...pelangganList, newCust]);
        }
      }

      setSelectedTransaksiId(newTrx.id);
      setActiveView('detail_transaksi');
    }
  };

  const handleDeleteTransaction = (transaksiId: string) => {
    updateTransaksiList(transaksiList.filter((t) => t.id !== transaksiId));
    setActiveView('dashboard');
  };

  const handleSaveCustomer = (cust: Pelanggan) => {
    const exists = pelangganList.some((p) => p.id === cust.id);
    const updated = exists
      ? pelangganList.map((p) => (p.id === cust.id ? cust : p))
      : [...pelangganList, cust];
    updatePelangganList(updated);
  };

  const handleDeleteCustomer = (id: string) => {
    updatePelangganList(pelangganList.filter((p) => p.id !== id));
  };

  const handleSaveLayanan = (lay: Layanan) => {
    const exists = layananList.some((l) => l.id === lay.id);
    const updated = exists
      ? layananList.map((l) => (l.id === lay.id ? lay : l))
      : [...layananList, lay];
    updateLayananList(updated);
  };

  const handleDeleteLayanan = (id: string) => {
    updateLayananList(layananList.filter((l) => l.id !== id));
  };

  const handleAddLaundry = (
    nama: string,
    alamat?: string,
    telepon?: string,
    copyFromId?: string
  ) => {
    const newLndId = `lnd-${Date.now()}`;
    const newLnd: Laundry = {
      id: newLndId,
      ownerId: currentUser?.uid || 'own-1',
      namaLaundry: nama,
      alamat: alamat || null,
      nomorTelepon: telepon || null,
    };
    updateLaundries([...laundries, newLnd]);

    // Copy services if requested
    if (copyFromId) {
      const sourceLayanan = layananList.filter((l) => l.laundryId === copyFromId);
      const clonedLayanan = sourceLayanan.map((l, i) => ({
        ...l,
        id: `lay-${Date.now()}-${i}`,
        laundryId: newLndId,
      }));
      updateLayananList([...layananList, ...clonedLayanan]);
    }

    setActiveLaundryId(newLndId);
  };

  const handleUpdateLaundry = (lnd: Laundry) => {
    updateLaundries(laundries.map((l) => (l.id === lnd.id ? lnd : l)));
  };

  const handleDeleteLaundry = (laundryId: string) => {
    if (laundries.length <= 1) return;
    const remaining = laundries.filter((l) => l.id !== laundryId);
    updateLaundries(remaining);
    if (activeLaundryId === laundryId) {
      setActiveLaundryId(remaining[0].id);
    }
  };

  const handleAddKasir = (nama: string, email: string, _pass: string, laundryId: string) => {
    const newKasir: User = {
      uid: `usr-${Date.now()}`,
      emailOrPhone: email,
      username: nama,
      displayName: nama,
      role: 'admin',
      laundryId,
      laundries: {},
      walletBalance: 0,
    };
    updateStaffList([...staffList, newKasir]);
  };

  const handleDeleteKasir = (uid: string) => {
    updateStaffList(staffList.filter((u) => u.uid !== uid));
  };

  const handleTopUpWallet = (nominal: number) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + nominal,
    };
    setCurrentUser(updatedUser);
    StorageService.set('active_user', updatedUser);

    const historyItem: SubscriptionHistory = {
      id: `sub-${Date.now()}`,
      ownerId: currentUser.uid,
      purchaseDate: Date.now(),
      packageName: `Top Up Saldo (${nominal.toLocaleString('id-ID')})`,
      cost: nominal,
      durationDays: 0,
      newExpiryDate: currentUser.subscriptionEndDate || 0,
      laundries: [activeLaundryId],
    };
    const newHist = [historyItem, ...subscriptionHistory];
    setSubscriptionHistory(newHist);
    StorageService.set('subscription_history', newHist);
  };

  const handleExtendSubscription = (packageName: string, cost: number, days: number) => {
    if (!currentUser) return;
    const currentEnd = Math.max(Date.now(), currentUser.subscriptionEndDate || Date.now());
    const newEnd = currentEnd + days * 24 * 60 * 60 * 1000;

    const updatedUser = {
      ...currentUser,
      walletBalance: Math.max(0, currentUser.walletBalance - cost),
      subscriptionEndDate: newEnd,
      subscriptionType: 'premium',
    };
    setCurrentUser(updatedUser);
    StorageService.set('active_user', updatedUser);

    const historyItem: SubscriptionHistory = {
      id: `sub-${Date.now()}`,
      ownerId: currentUser.uid,
      purchaseDate: Date.now(),
      packageName,
      cost,
      durationDays: days,
      newExpiryDate: newEnd,
      laundries: laundries.map((l) => l.id),
    };
    const newHist = [historyItem, ...subscriptionHistory];
    setSubscriptionHistory(newHist);
    StorageService.set('subscription_history', newHist);
  };

  const handleSavePengeluaran = (peng: Omit<Pengeluaran, 'id'>) => {
    const newPeng: Pengeluaran = {
      ...peng,
      id: `pg-${Date.now()}`,
    };
    updatePengeluaranList([newPeng, ...pengeluaranList]);
    alert('Pengeluaran berhasil dicatat!');
  };

  const handleSavePemasukan = (pem: ArusKas) => {
    const updated = [pem, ...manualCashLogs];
    setManualCashLogs(updated);
    StorageService.set('manual_cash_logs', updated);
    alert('Pemasukan manual berhasil dicatat!');
  };

  // Selected Transaction Object
  const currentSelectedTransaksi =
    transaksiList.find((t) => t.id === selectedTransaksiId) || null;

  // Real-time device detection (Phone / Mobile vs PC / Desktop)
  const device = useDeviceDetect();
  const isEffectiveMobile = device.isMobile;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start text-slate-800 antialiased selection:bg-[#800000] selection:text-white">
      {/* Offline Toast */}
      <OfflineIndicator />

      {/* Main Container */}
      <div className={`w-full max-w-6xl bg-slate-100 ${activeView === 'dashboard' ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} relative flex flex-col overflow-x-hidden`}>
        {/* VIEW ROUTER */}
        {activeView === 'splash' && (
          <SplashView
            appName={settings.headerStruk || "Kafela's Laundry"}
            onFinish={() => {
              if (currentUser) {
                setActiveView('dashboard');
              } else {
                setActiveView('auth');
              }
            }}
          />
        )}

        {activeView === 'auth' && (
          <AuthView
            ownerUser={defaultOwnerUser}
            staffList={staffList}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              StorageService.set('active_user', user);
              setActiveView('dashboard');
            }}
          />
        )}

        {activeView === 'dashboard' && currentUser && (
          <DashboardView
            transaksiList={transaksiList}
            settings={settings}
            currentUser={currentUser}
            activeLaundry={activeLaundry}
            laundries={laundries}
            isMobile={isEffectiveMobile}
            deviceInfo={device}
            onOpenNewTransaksi={() => {
              setTransaksiToEdit(null);
              setActiveView('tambah_edit');
            }}
            onOpenDetailTransaksi={(id) => {
              setSelectedTransaksiId(id);
              setActiveView('detail_transaksi');
            }}
            onOpenArsip={() => setActiveView('arsip')}
            onOpenSettings={() => setActiveView('settings')}
            onOpenStatusPengerjaan={() => setActiveView('status_pengerjaan')}
            onOpenBukuKas={() => setActiveView('buku_kas')}
            onOpenLaporan={() => setActiveView('laporan')}
            onOpenAturKas={() => setIsAturKasOpen(true)}
            onOpenSwitchBranch={() => setIsSwitchBranchOpen(true)}
            onOpenApkModal={() => setIsApkModalOpen(true)}
            onOpenKelolaPelanggan={() => setActiveView('kelola_pelanggan')}
            onOpenKelolaLayanan={() => setActiveView('kelola_layanan')}
            onOpenKelolaOwner={() => setActiveView('kelola_owner')}
            onSelesaikanTransaksi={(trx) => {
              if (trx.status === 'Diterima') {
                const updated = { ...trx, status: 'Proses' as const };
                updateTransaksiList(
                  transaksiList.map((t) => (t.id === trx.id ? updated : t))
                );
              } else if (trx.status === 'Proses') {
                const updated = {
                  ...trx,
                  status: 'Selesai' as const,
                  tanggalStatusSelesai: Date.now(),
                };
                updateTransaksiList(
                  transaksiList.map((t) => (t.id === trx.id ? updated : t))
                );
              }
            }}
            onAmbilTransaksi={(trx) => {
              const sisa = Math.max(0, trx.totalHarga - trx.jumlahDp);
              if (sisa > 0) {
                if (
                  confirm(
                    `Transaksi ini memiliki sisa Rp ${sisa.toLocaleString(
                      'id-ID'
                    )}. Tandai lunas dan serahkan pakaian ke pelanggan?`
                  )
                ) {
                  const updated = {
                    ...trx,
                    status: 'Diambil' as const,
                    statusPembayaran: 'Lunas' as const,
                    tanggalPengambilan: Date.now(),
                  };
                  updateTransaksiList(
                    transaksiList.map((t) => (t.id === trx.id ? updated : t))
                  );
                }
              } else {
                const updated = {
                  ...trx,
                  status: 'Diambil' as const,
                  tanggalPengambilan: Date.now(),
                };
                updateTransaksiList(
                  transaksiList.map((t) => (t.id === trx.id ? updated : t))
                );
              }
            }}
          />
        )}

        {activeView === 'tambah_edit' && (
          <TambahEditView
            onBack={() => setActiveView('dashboard')}
            layananList={layananList}
            pelangganList={pelangganList}
            settings={settings}
            activeLaundryId={activeLaundryId}
            transaksiToEdit={transaksiToEdit}
            onSave={handleSaveTransaction}
          />
        )}

        {activeView === 'detail_transaksi' && currentSelectedTransaksi && currentUser && (
          <DetailTransaksiView
            onBack={() => setActiveView('dashboard')}
            transaksi={currentSelectedTransaksi}
            settings={settings}
            currentUser={currentUser}
            pelanggan={pelangganList.find(
              (p) =>
                p.nama.toLowerCase() ===
                currentSelectedTransaksi.namaPelanggan.toLowerCase()
            )}
            onEdit={(trx) => {
              setTransaksiToEdit(trx);
              setActiveView('tambah_edit');
            }}
            onDelete={handleDeleteTransaction}
          />
        )}

        {activeView === 'status_pengerjaan' && (
          <StatusPengerjaanView
            onBack={() => setActiveView('dashboard')}
            transaksiList={transaksiList}
            semuaLayanan={layananList}
            staffList={staffList}
            settings={settings}
            activeLaundryId={activeLaundryId}
            onOpenDetail={(id) => {
              setSelectedTransaksiId(id);
              setActiveView('detail_transaksi');
            }}
            onUpdateTransaksi={(updated) => {
              updateTransaksiList(
                transaksiList.map((t) => (t.id === updated.id ? updated : t))
              );
            }}
          />
        )}

        {activeView === 'buku_kas' && (
          <BukuKasView
            onBack={() => setActiveView('dashboard')}
            transaksiList={transaksiList}
            pengeluaranList={pengeluaranList}
            manualCashLogs={manualCashLogs}
            activeLaundryId={activeLaundryId}
            onOpenDetailTransaksi={(id) => {
              setSelectedTransaksiId(id);
              setActiveView('detail_transaksi');
            }}
          />
        )}

        {activeView === 'laporan' && (
          <LaporanView
            onBack={() => setActiveView('dashboard')}
            transaksiList={transaksiList}
            pengeluaranList={pengeluaranList}
            activeLaundryId={activeLaundryId}
          />
        )}

        {activeView === 'arsip' && (
          <ArsipView
            onBack={() => setActiveView('dashboard')}
            transaksiList={transaksiList}
            activeLaundryId={activeLaundryId}
            onOpenDetailTransaksi={(id) => {
              setSelectedTransaksiId(id);
              setActiveView('detail_transaksi');
            }}
            onRestoreTransaksi={(trx) => {
              const restored: Transaksi = {
                ...trx,
                status: 'Diterima',
                tanggalPengambilan: null,
              };
              updateTransaksiList(
                transaksiList.map((t) => (t.id === trx.id ? restored : t))
              );
            }}
          />
        )}

        {activeView === 'kelola_pelanggan' && (
          <KelolaPelangganView
            onBack={() => setActiveView('settings')}
            pelangganList={pelangganList}
            settings={settings}
            activeLaundryId={activeLaundryId}
            onSavePelanggan={handleSaveCustomer}
            onDeletePelanggan={handleDeleteCustomer}
          />
        )}

        {activeView === 'kelola_layanan' && (
          <KelolaLayananView
            onBack={() => setActiveView('settings')}
            layananList={layananList}
            activeLaundryId={activeLaundryId}
            onSaveLayanan={handleSaveLayanan}
            onDeleteLayanan={handleDeleteLayanan}
            onReorderLayanan={updateLayananList}
          />
        )}

        {activeView === 'kelola_owner' && currentUser && (
          <KelolaOwnerView
            onBack={() => setActiveView('settings')}
            currentUser={currentUser}
            laundries={laundries}
            activeLaundryId={activeLaundryId}
            subscriptionHistory={subscriptionHistory}
            onSelectLaundry={handleSelectBranch}
            onAddLaundry={handleAddLaundry}
            onUpdateLaundry={handleUpdateLaundry}
            onDeleteLaundry={handleDeleteLaundry}
            onTopUpWallet={handleTopUpWallet}
            onExtendSubscription={handleExtendSubscription}
          />
        )}

        {activeView === 'kelola_kasir' && (
          <KelolaKasirView
            onBack={() => setActiveView('settings')}
            staffList={staffList}
            laundries={laundries}
            onAddKasir={handleAddKasir}
            onDeleteKasir={handleDeleteKasir}
          />
        )}

        {activeView === 'settings' && currentUser && (
          <SettingsView
            onBack={() => setActiveView('dashboard')}
            settings={settings}
            currentUser={currentUser}
            activeLaundry={activeLaundry}
            onUpdateSettings={updateSettings}
            onOpenKelolaPelanggan={() => setActiveView('kelola_pelanggan')}
            onOpenKelolaLayanan={() => setActiveView('kelola_layanan')}
            onOpenKelolaOwner={() => setActiveView('kelola_owner')}
            onOpenKelolaKasir={() => setActiveView('kelola_kasir')}
            onOpenApkModal={() => setIsApkModalOpen(true)}
            onLogout={() => {
              setCurrentUser(null);
              StorageService.set('active_user', null);
              setActiveView('auth');
            }}
          />
        )}

        {/* Global Modals */}
        <AturKasModal
          isOpen={isAturKasOpen}
          onClose={() => setIsAturKasOpen(false)}
          isPemasukanEnabled={settings.pemasukanManualEnabled}
          daftarJenisPengeluaran={jenisPengeluaranList}
          daftarJenisPemasukan={jenisPemasukanList}
          onSavePengeluaran={handleSavePengeluaran}
          onSavePemasukan={handleSavePemasukan}
        />

        <SwitchBranchModal
          isOpen={isSwitchBranchOpen}
          onClose={() => setIsSwitchBranchOpen(false)}
          laundries={laundries}
          activeLaundryId={activeLaundryId}
          onSelectBranch={handleSelectBranch}
          onManageBranches={() => setActiveView('kelola_owner')}
        />

        <ApkPlaystoreModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
        />
      </div>
    </div>
  );
}
