import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';

export default function SignUp() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // States untuk Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Buat Akun di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      const user = userCredential.user;

      // 2. Simpan Data Tambahan ke Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        createdAt: new Date().toISOString(),
        role: 'user' // default role
      });

      Swal.fire({
        icon: 'success',
        title: 'Pendaftaran Berhasil!',
        text: 'Selamat datang di MGM Finance',
        timer: 2000,
        showConfirmButton: false
      });

      router.push('/'); // Redirect ke Dashboard
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-xl w-full max-w-md border border-slate-100 text-center">
        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Buat Akun</h1>
        <p className="text-slate-400 font-medium text-sm mb-10">Mulai kelola keuangan MGM sekarang.</p>

        <form onSubmit={handleSignUp} className="space-y-4 text-left">
          <InputGroup 
            label="Nama Lengkap" 
            icon={<User size={18}/>} 
            type="text" 
            placeholder="Masukkan nama Anda" 
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <InputGroup 
            label="Email" 
            icon={<Mail size={18}/>} 
            type="email" 
            placeholder="nama@email.com" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <InputGroup 
            label="Password" 
            icon={<Lock size={18}/>} 
            type={showPassword ? "text" : "password"} 
            placeholder="Minimal 8 karakter"
            isPassword
            show={showPassword}
            toggle={() => setShowPassword(!showPassword)}
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-2xl border border-teal-100 mt-2">
            <ShieldCheck className="text-teal-600 shrink-0" size={20} />
            <p className="text-[10px] text-teal-800 font-bold leading-relaxed">
              Data Anda akan dienkripsi dan disimpan dengan aman di server kami.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full ${loading ? 'bg-slate-400' : 'bg-teal-600 hover:bg-slate-900'} text-white p-4 rounded-2xl font-black mt-4 transition shadow-lg shadow-teal-100`}
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="mt-8 text-sm text-slate-500 font-bold">
          Sudah punya akun? <Link href="/login" className="text-teal-600 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}

function InputGroup({ label, icon, type, placeholder, isPassword, show, toggle, value, onChange, required }) {
  return (
    <div>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1.5 block">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-4 text-slate-300">{icon}</div>
        <input 
          type={type} 
          required={required}
          value={value}
          onChange={onChange}
          className="w-full p-4 pl-12 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold text-slate-700 outline-none"
          placeholder={placeholder}
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