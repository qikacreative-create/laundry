import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  User,
  Laundry,
  Transaksi,
  Pelanggan,
  Layanan,
  Pengeluaran,
  SettingsData,
} from '../types';
import { defaultLayananList, defaultSettings } from './storage';

export class FirebaseSyncService {
  // 1. Get or create user profile
  static async getOrCreateUserProfile(firebaseUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    phoneNumber?: string | null;
  }): Promise<User> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as User;
      }

      const defaultLaundryId = `lnd-${firebaseUser.uid}`;
      const newUser: User = {
        uid: firebaseUser.uid,
        emailOrPhone: firebaseUser.email || firebaseUser.phoneNumber || '',
        username: firebaseUser.displayName || 'Owner',
        displayName: firebaseUser.displayName || "Kafela's Owner",
        nomorTelepon: firebaseUser.phoneNumber || '',
        role: 'owner',
        laundryId: defaultLaundryId,
        laundries: { [defaultLaundryId]: "Kafela's Laundry" },
        walletBalance: 0,
        createdAt: Date.now(),
        subscriptionType: 'premium',
        subscriptionEndDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };

      await setDoc(userDocRef, newUser);

      // Create initial branch
      const branchRef = doc(db, 'laundries', defaultLaundryId);
      const initialBranch: Laundry = {
        id: defaultLaundryId,
        ownerId: firebaseUser.uid,
        namaLaundry: "Kafela's Laundry",
        alamat: 'Bandung',
        nomorTelepon: firebaseUser.phoneNumber || '',
      };
      await setDoc(branchRef, initialBranch);

      // Create initial services
      for (const lay of defaultLayananList) {
        const layDoc = doc(db, 'laundries', defaultLaundryId, 'layanan', lay.id);
        await setDoc(layDoc, { ...lay, laundryId: defaultLaundryId });
      }

      return newUser;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  }

  // 2. Fetch Laundries for User
  static async fetchLaundries(ownerId: string): Promise<Laundry[]> {
    const laundriesRef = collection(db, 'laundries');
    try {
      const q = query(laundriesRef, where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      const list: Laundry[] = [];
      snap.forEach((d) => list.push(d.data() as Laundry));
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'laundries');
    }
  }

  // 3. Fetch Transaksi
  static async fetchTransaksi(laundryId: string): Promise<Transaksi[]> {
    const path = `laundries/${laundryId}/transaksi`;
    try {
      const snap = await getDocs(collection(db, path));
      const list: Transaksi[] = [];
      snap.forEach((d) => {
        const data = d.data() as Partial<Transaksi>;
        list.push({
          id: data.id || d.id,
          laundryId: data.laundryId || laundryId,
          namaPelanggan: data.namaPelanggan || 'Pelanggan',
          totalHarga: typeof data.totalHarga === 'number' ? data.totalHarga : 0,
          jumlahDp: typeof data.jumlahDp === 'number' ? data.jumlahDp : 0,
          tanggalMasuk: typeof data.tanggalMasuk === 'number' ? data.tanggalMasuk : Date.now(),
          tanggalSelesai: data.tanggalSelesai || null,
          status: (data.status as any) || 'Diterima',
          statusPembayaran: (data.statusPembayaran as any) || 'Belum Lunas',
          items: Array.isArray(data.items) ? data.items : [],
          nomorTransaksi: data.nomorTransaksi || null,
          nomorTelepon: data.nomorTelepon || null,
          alamat: data.alamat || null,
          catatan: data.catatan || null,
          metodePembayaran: data.metodePembayaran || null,
          metodePembayaranDetail: data.metodePembayaranDetail || null,
          dikerjakanOleh: data.dikerjakanOleh || null,
        } as Transaksi);
      });
      return list.sort((a, b) => b.tanggalMasuk - a.tanggalMasuk);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  }

  // Save Transaksi
  static async saveTransaksi(trx: Transaksi): Promise<void> {
    const path = `laundries/${trx.laundryId}/transaksi/${trx.id}`;
    try {
      await setDoc(doc(db, 'laundries', trx.laundryId, 'transaksi', trx.id), trx);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // Delete Transaksi
  static async deleteTransaksi(laundryId: string, trxId: string): Promise<void> {
    const path = `laundries/${laundryId}/transaksi/${trxId}`;
    try {
      await deleteDoc(doc(db, 'laundries', laundryId, 'transaksi', trxId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  // 4. Fetch Pelanggan
  static async fetchPelanggan(laundryId: string): Promise<Pelanggan[]> {
    const path = `laundries/${laundryId}/pelanggan`;
    try {
      const snap = await getDocs(collection(db, path));
      const list: Pelanggan[] = [];
      snap.forEach((d) => list.push(d.data() as Pelanggan));
      return list;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  }

  // Save Pelanggan
  static async savePelanggan(pel: Pelanggan): Promise<void> {
    const path = `laundries/${pel.laundryId}/pelanggan/${pel.id}`;
    try {
      await setDoc(doc(db, 'laundries', pel.laundryId, 'pelanggan', pel.id), pel);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // 5. Fetch Layanan
  static async fetchLayanan(laundryId: string): Promise<Layanan[]> {
    const path = `laundries/${laundryId}/layanan`;
    try {
      const snap = await getDocs(collection(db, path));
      const list: Layanan[] = [];
      snap.forEach((d) => list.push(d.data() as Layanan));
      return list.sort((a, b) => a.urutan - b.urutan);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  }

  // Save Layanan
  static async saveLayanan(lay: Layanan): Promise<void> {
    const path = `laundries/${lay.laundryId}/layanan/${lay.id}`;
    try {
      await setDoc(doc(db, 'laundries', lay.laundryId, 'layanan', lay.id), lay);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // Delete Layanan
  static async deleteLayanan(laundryId: string, layId: string): Promise<void> {
    const path = `laundries/${laundryId}/layanan/${layId}`;
    try {
      await deleteDoc(doc(db, 'laundries', laundryId, 'layanan', layId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  }

  // 6. Fetch Pengeluaran
  static async fetchPengeluaran(laundryId: string): Promise<Pengeluaran[]> {
    const path = `laundries/${laundryId}/pengeluaran`;
    try {
      const snap = await getDocs(collection(db, path));
      const list: Pengeluaran[] = [];
      snap.forEach((d) => list.push(d.data() as Pengeluaran));
      return list.sort((a, b) => b.tanggal - a.tanggal);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  }

  // Save Pengeluaran
  static async savePengeluaran(peng: Pengeluaran): Promise<void> {
    const path = `laundries/${peng.laundryId}/pengeluaran/${peng.id}`;
    try {
      await setDoc(doc(db, 'laundries', peng.laundryId, 'pengeluaran', peng.id), peng);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  // 7. Fetch Settings
  static async fetchSettings(laundryId: string): Promise<SettingsData | null> {
    const path = `laundries/${laundryId}/settings/main`;
    try {
      const snap = await getDoc(doc(db, 'laundries', laundryId, 'settings', 'main'));
      if (snap.exists()) {
        return snap.data() as SettingsData;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  }

  // Save Settings
  static async saveSettings(laundryId: string, settings: SettingsData): Promise<void> {
    const path = `laundries/${laundryId}/settings/main`;
    try {
      await setDoc(doc(db, 'laundries', laundryId, 'settings', 'main'), settings);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }
}
