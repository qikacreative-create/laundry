import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2, ArrowUp, ArrowDown, Check, X, Tag } from 'lucide-react';
import { Layanan } from '../types';
import { formatRupiah } from '../utils/formatters';

interface KelolaLayananViewProps {
  onBack: () => void;
  layananList: Layanan[];
  activeLaundryId: string;
  onSaveLayanan: (layanan: Layanan) => void;
  onDeleteLayanan: (layananId: string) => void;
  onReorderLayanan: (reorderedList: Layanan[]) => void;
}

export const KelolaLayananView: React.FC<KelolaLayananViewProps> = ({
  onBack,
  layananList,
  activeLaundryId,
  onSaveLayanan,
  onDeleteLayanan,
  onReorderLayanan,
}) => {
  const [editingLayanan, setEditingLayanan] = useState<Layanan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState<number>(0);
  const [satuanHarga, setSatuanHarga] = useState('Kg');
  const [durasiAngka, setDurasiAngka] = useState('3');
  const [durasiSatuan, setDurasiSatuan] = useState('Hari');
  const [hitungBebanKerja, setHitungBebanKerja] = useState(true);

  const openAddModal = () => {
    setEditingLayanan(null);
    setNama('');
    setHarga(7000);
    setSatuanHarga('Kg');
    setDurasiAngka('3');
    setDurasiSatuan('Hari');
    setHitungBebanKerja(true);
    setIsModalOpen(true);
  };

  const openEditModal = (lay: Layanan) => {
    setEditingLayanan(lay);
    setNama(lay.nama);
    setHarga(lay.harga);
    setSatuanHarga(lay.satuanHarga);

    const parts = lay.durasi.split(' ');
    setDurasiAngka(parts[0] || '1');
    setDurasiSatuan(parts[1] || 'Hari');
    setHitungBebanKerja(lay.hitungBebanKerja);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!nama.trim()) {
      alert('Nama layanan wajib diisi.');
      return;
    }
    if (harga <= 0) {
      alert('Harga harus lebih dari 0.');
      return;
    }

    const payload: Layanan = {
      id: editingLayanan ? editingLayanan.id : `lay-${Date.now()}`,
      laundryId: activeLaundryId,
      nama: nama.trim(),
      harga,
      satuanHarga,
      durasi: `${durasiAngka} ${durasiSatuan}`,
      satuanDurasi: durasiSatuan,
      hitungBebanKerja,
      urutan: editingLayanan ? editingLayanan.urutan : layananList.length,
    };

    onSaveLayanan(payload);
    setIsModalOpen(false);
  };

  const handleToggleBeban = (lay: Layanan) => {
    onSaveLayanan({
      ...lay,
      hitungBebanKerja: !lay.hitungBebanKerja,
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layananList.length) return;

    const updated = [...layananList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // update urutan
    const reordered = updated.map((it, idx) => ({ ...it, urutan: idx }));
    onReorderLayanan(reordered);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-[#800000] text-white shadow-md sticky top-0 z-30 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-white/10 transition">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-bold text-base tracking-wide">Kelola Daftar Harga</h1>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </header>

      {/* Column Headers (Matches activity_kelola_layanan.xml) */}
      <div className="bg-[#660000] text-white px-4 py-2 text-[11px] font-bold flex justify-between shadow-2xs">
        <span className="w-8 text-center">Beban</span>
        <span className="flex-1 px-3">Nama Layanan</span>
        <span className="w-20 text-center">Tarif</span>
        <span className="w-16 text-center">Durasi</span>
        <span className="w-16 text-right">Aksi</span>
      </div>

      {/* Services List */}
      <main className="flex-1 p-3 space-y-2 overflow-y-auto max-w-xl mx-auto w-full">
        {layananList.length === 0 ? (
          <div className="p-8 bg-white rounded-2xl text-center text-xs text-slate-400 border border-slate-200 italic">
            Belum ada layanan terdaftar.
          </div>
        ) : (
          layananList.map((lay, idx) => (
            <div
              key={lay.id}
              className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 hover:border-slate-300 transition"
            >
              {/* Checkbox hitung beban kerja */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <input
                  type="checkbox"
                  checked={lay.hitungBebanKerja}
                  onChange={() => handleToggleBeban(lay)}
                  title="Hitung ke beban kerja staf harian"
                  className="w-4 h-4 rounded accent-[#800000] cursor-pointer"
                />
              </div>

              {/* Service details */}
              <div className="flex-1 min-w-0 px-2">
                <div className="font-bold text-xs text-slate-900 truncate">{lay.nama}</div>
                <div className="text-[10px] text-slate-400">
                  {lay.hitungBebanKerja ? '✓ Masuk hitungan beban staf' : '✕ Tidak dihitung beban'}
                </div>
              </div>

              {/* Price */}
              <div className="w-20 text-center font-extrabold text-xs text-[#800000] shrink-0">
                {formatRupiah(lay.harga).replace('Rp ', '')}
                <span className="text-[10px] font-normal text-slate-500">/{lay.satuanHarga}</span>
              </div>

              {/* Duration */}
              <div className="w-16 text-center text-[11px] font-semibold text-slate-700 shrink-0">
                {lay.durasi}
              </div>

              {/* Action buttons (Reorder & Edit/Delete) */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, 'up')}
                    className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === layananList.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => openEditModal(lay)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#800000] hover:bg-rose-50"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus layanan '${lay.nama}'?`)) {
                      onDeleteLayanan(lay.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Add / Edit Service Modal (Matches dialog_add_edit_layanan.xml) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-[#800000] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingLayanan ? 'Ubah Layanan' : 'Tambah Layanan Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Nama Layanan *
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Cuci Setrika / Cuci Selimut"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#800000] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={harga || ''}
                    onChange={(e) => setHarga(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="7000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Satuan Harga
                  </label>
                  <select
                    value={satuanHarga}
                    onChange={(e) => setSatuanHarga(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Meter">Meter</option>
                    <option value="pcs">pcs</option>
                    <option value="Satuan">Satuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Durasi Pengerjaan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={durasiAngka}
                    onChange={(e) => setDurasiAngka(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-center focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Satuan Durasi
                  </label>
                  <select
                    value={durasiSatuan}
                    onChange={(e) => setDurasiSatuan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-[#800000] focus:outline-none"
                  >
                    <option value="Hari">Hari</option>
                    <option value="Jam">Jam</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hitungBebanKerja}
                  onChange={(e) => setHitungBebanKerja(e.target.checked)}
                  className="w-4 h-4 accent-[#800000]"
                />
                <span className="font-semibold text-slate-700">
                  Hitung beban kerja staf harian (Kg)
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-[#800000] hover:bg-[#660000] text-xs font-bold text-white shadow-xs transition"
                >
                  Simpan Layanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
