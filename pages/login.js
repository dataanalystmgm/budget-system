import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // States untuk Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. FUNGSI LOGIN EMAIL & PASSWORD
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return Swal.fire('Error', 'Email dan Password wajib diisi', 'error');
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Swal.fire({ icon: 'success', title: 'Berhasil Masuk!', timer: 1500, showConfirmButton: false });
      router.push('/'); // Redirect ke Dashboard
    } catch (error) {
      let msg = "Gagal masuk. Periksa kembali email & password.";
      if (error.code === 'auth/user-not-found') msg = "User tidak ditemukan.";
      if (error.code === 'auth/wrong-password') msg = "Password salah.";
      Swal.fire('Login Gagal', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNGSI LOGIN GOOGLE
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      if (error.code !== 'auth/cancelled-popup-request') {
        Swal.fire('Error', 'Gagal login dengan Google', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans text-slate-800">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl w-full max-w-md border border-slate-100 text-center">
        <h1 className="text-4xl font-black mb-2 tracking-tight">My Finance</h1>
        <p className="text-slate-400 font-medium text-sm mb-10">Selamat datang kembali!</p>

        {/* Tombol Google */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition font-bold text-slate-700 mb-8"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Masuk dengan Google
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-300 font-black tracking-widest">Atau</span>
          </div>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <InputGroup 
            label="Email" 
            icon={<Mail size={18}/>} 
            type="email" 
            placeholder="nama@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputGroup 
            label="Password" 
            icon={<Lock size={18}/>} 
            type={showPassword ? "text" : "password"} 
            placeholder="••••••••"
            isPassword
            show={showPassword}
            toggle={() => setShowPassword(!showPassword)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-teal-600'} text-white p-4 rounded-2xl font-black mt-4 transition shadow-lg shadow-slate-200`}
          >
            {loading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>

        <p className="mt-8 text-sm text-slate-500 font-bold">
          Belum punya akun? <Link href="/signup" className="text-teal-600 hover:underline">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}

// Komponen InputGroup tetap di bawah
function InputGroup({ label, icon, type, placeholder, isPassword, show, toggle, value, onChange }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-4 text-slate-300">{icon}</div>
        <input 
          type={type} 
          value={value}
          onChange={onChange}
          className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 outline-none placeholder:text-slate-300"
          placeholder={placeholder}
          required
        />
        {isPassword && (
          <button type="button" onClick={toggle} className="absolute right-4 top-4 text-slate-400">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}