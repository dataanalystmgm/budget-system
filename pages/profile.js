import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { 
  Lock, Hash, Save, User as UserIcon, Mail, 
  ShieldCheck, Eye, EyeOff, Info 
} from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        // Ambil data PIN dari Firestore jika sudah pernah dibuat
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setPin(userDoc.data().telegramPin || '');
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdatePin = async () => {
    // Validasi panjang PIN
    if (pin.length < 6) {
      return Swal.fire({
        icon: 'error',
        title: 'PIN Terlalu Pendek',
        text: 'PIN Telegram harus berisi 6 digit angka!',
        confirmButtonColor: '#0f172a'
      });
    }

    try {
      // Menggunakan setDoc + merge agar tidak error "No document to update"
      await setDoc(doc(db, 'users', user.uid), {
        telegramPin: pin,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      Swal.fire({
        icon: 'success',
        title: 'PIN Tersimpan!',
        text: 'Sekarang Anda bisa login ke Bot Telegram menggunakan PIN ini.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Error updating PIN:", error);
      Swal.fire('Error', 'Gagal menyimpan PIN: ' + error.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Profil Pengguna</h1>
          <p className="text-slate-500 font-medium italic">Kelola keamanan integrasi Telegram Anda.</p>
        </div>
        
        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/50">
          {/* Header Kartu Profil */}
          <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img 
                src={user?.photoURL || 'https://via.placeholder.com/150'} 
                alt="Profile" 
                className="w-24 h-24 rounded-[2rem] border-4 border-slate-800 object-cover shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-teal-500 p-2 rounded-xl border-4 border-slate-900">
                <ShieldCheck size={16} className="text-white" />
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black tracking-tight">{user?.displayName || 'MGM User'}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-slate-400 mt-1">
                <Mail size={14} />
                <span className="text-sm font-bold">{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Konten Pengaturan */}
          <div className="p-8 space-y-8">
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-none">Akses Telegram Bot</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Gunakan PIN untuk verifikasi</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">
                    6-Digit Security PIN
                  </label>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      
                      <input 
                        type={showPin ? "text" : "password"} 
                        maxLength={6}
                        placeholder="123456"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200 py-4 pl-12 pr-14 rounded-2xl font-black text-slate-700 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none text-xl tracking-[0.4em]"
                      />

                      {/* Tombol Show/Hide PIN */}
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors p-2"
                      >
                        {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    <button 
                      onClick={handleUpdatePin}
                      className="bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2 font-black"
                    >
                      <Save size={20} />
                      <span>Simpan PIN</span>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                  <div className="text-blue-600 mt-1"><Info size={16} /></div>
                  <div className="text-[11px] text-blue-800 font-medium leading-relaxed">
                    Ketik <code className="bg-blue-100 px-1 rounded font-bold">/login {user?.email} | [PIN]</code> di Telegram Bot untuk menghubungkan akun Anda.
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">MGM System Development</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}