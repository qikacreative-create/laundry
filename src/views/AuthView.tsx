import React, { useState } from 'react';
import { Lock, Mail, User, Phone, Building2, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthViewProps {
  onLoginSuccess: (user: UserType) => void;
  staffList: UserType[];
  ownerUser: UserType;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, staffList, ownerUser }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Form states
  const [namaLaundry, setNamaLaundry] = useState('');
  const [telepon, setTelepon] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert('Email/No. HP dan password harus diisi.');
      return;
    }

    // Check if logging in as staff or owner
    const staffMatch = staffList.find(
      (s) => s.emailOrPhone.toLowerCase() === email.trim().toLowerCase() || s.username.toLowerCase() === email.trim().toLowerCase()
    );

    if (staffMatch) {
      onLoginSuccess(staffMatch);
      return;
    }

    // Owner match or demo fallback
    if (
      email.toLowerCase().includes('laundry') ||
      email.toLowerCase().includes('owner') ||
      email.toLowerCase() === ownerUser.emailOrPhone.toLowerCase()
    ) {
      onLoginSuccess(ownerUser);
      return;
    }

    // General fallback: logged in as owner
    onLoginSuccess({
      ...ownerUser,
      emailOrPhone: email.trim(),
      displayName: username || 'Owner',
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLaundry.trim() || !telepon.trim() || !email.trim() || !password.trim()) {
      alert('Semua kolom wajib diisi.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (!agreeTerms) {
      alert('Anda harus menyetujui Syarat dan Ketentuan untuk mendaftar.');
      return;
    }

    const trialEnd = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const newOwner: UserType = {
      uid: `own-${Date.now()}`,
      emailOrPhone: email.trim(),
      username: username.trim() || namaLaundry.trim(),
      displayName: username.trim() || namaLaundry.trim(),
      nomorTelepon: telepon.trim(),
      role: 'owner',
      laundryId: 'lnd-1',
      laundries: { 'lnd-1': namaLaundry.trim() },
      walletBalance: 0,
      subscriptionEndDate: trialEnd,
      subscriptionType: 'premium',
      createdAt: Date.now(),
    };

    alert('Pendaftaran berhasil! Akun Anda aktif dengan masa uji coba 7 hari.');
    onLoginSuccess(newOwner);
  };

  const handleGoogleSignIn = () => {
    onLoginSuccess(ownerUser);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md mx-auto my-auto py-8">
        {/* Card Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#800000] text-white flex items-center justify-center mx-auto shadow-lg border border-red-500/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-wide text-white">Assalamu'alaikum</h1>
          <p className="text-xs text-slate-400">
            {isSignUp
              ? 'Daftarkan bisnis laundry Anda untuk manajemen terintegrasi'
              : 'Silakan masuk ke sistem kasir & operasional laundry'}
          </p>
        </div>

        {/* Auth Form Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-3.5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nama Laundry Anda *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={namaLaundry}
                      onChange={(e) => setNamaLaundry(e.target.value)}
                      placeholder="Contoh: Barokah Laundry Suci"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#800000]"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / HP *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={telepon}
                      onChange={(e) => setTelepon(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#800000]"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Username Pemilik
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nama panggilan pemilik"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#800000]"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                {isSignUp ? 'Email (untuk login) *' : 'Email / No. HP *'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="laundrysuciapp@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#800000]"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#800000]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Konfirmasi Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#800000]"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            {isSignUp && (
              <div className="flex items-start gap-2 pt-1 text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-[#800000]"
                />
                <label htmlFor="agree" className="text-[11px]">
                  Saya menyetujui{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-amber-400 underline font-semibold hover:text-amber-300"
                  >
                    Syarat dan Ketentuan Layanan
                  </button>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#800000] hover:bg-[#660000] text-white font-black text-xs uppercase tracking-wider shadow-lg transition active:scale-98 mt-2"
            >
              {isSignUp ? 'Daftar Sekarang' : 'Masuk Aplikasi'}
            </button>
          </form>

          {/* Google Sign In option */}
          <div className="pt-2">
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full py-2.5 rounded-xl border border-slate-600 bg-slate-900 hover:bg-slate-950 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSignUp ? 'Daftar dengan Google' : 'Masuk dengan Google'}</span>
            </button>
          </div>

          {/* Toggle Login / SignUp */}
          <div className="text-center pt-2 text-xs text-slate-400">
            {isSignUp ? (
              <span>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-red-400 font-bold hover:underline"
                >
                  Login di sini
                </button>
              </span>
            ) : (
              <span>
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-red-400 font-bold hover:underline"
                >
                  Daftar di sini
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Branding matching Android XML */}
      <footer className="text-center space-y-1.5 pb-2">
        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
          Terima kasih telah mempercayakan kami menjadi teman bisnis laundry Anda
        </p>
        <div className="inline-block px-4 py-1.5 rounded-full bg-[#800000] text-white text-xs font-bold tracking-wide">
          Jazakumullah Ahsanal Jaza • Powered By Kafila Suci
        </div>
      </footer>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-3 text-slate-200 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Syarat dan Ketentuan
              </h3>
              <button onClick={() => setShowTermsModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                Dengan mendaftar dan/atau menggunakan aplikasi kami, Anda menyatakan telah membaca, memahami, dan
                setuju untuk terikat oleh semua Ketentuan ini:
              </p>
              <p>
                <strong>1. Akun dan Pendaftaran:</strong> Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi
                dan semua aktivitas akun kasir turunan yang Anda buat.
              </p>
              <p>
                <strong>2. Layanan Berlangganan:</strong> Aplikasi disediakan sebagai layanan berbasis langganan (subscription).
                Pembelian atau perpanjangan memotong saldo dompet akun Anda.
              </p>
              <p>
                <strong>3. Kepemilikan Data:</strong> Anda adalah pemilik sah dari semua data bisnis transaksi dan pelanggan Anda.
              </p>
            </div>
            <button
              onClick={() => {
                setAgreeTerms(true);
                setShowTermsModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#800000] text-white font-bold text-xs mt-2"
            >
              Saya Mengerti & Setuju
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
