import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import { Chrome } from 'lucide-react'; // Icon Google-ish

export default function Login() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      Swal.fire({
        icon: 'success',
        title: 'Selamat Datang!',
        text: `Halo, ${user.displayName}`,
        timer: 2000,
        showConfirmButton: false
      });
      
      router.push('/');
    } catch (error) {
      console.error(error);
      Swal.fire('Gagal Login', 'Terjadi kesalahan saat login dengan Google', 'error');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">MGM Finance</h2>
        <p className="text-slate-500 mb-8">Kelola keuangan pribadi & pasangan dengan cerdas.</p>
        
        {/* Tombol Login Google */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 py-4 rounded-xl font-semibold hover:bg-slate-50 transition shadow-sm mb-4"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-5 h-5" />
          Masuk dengan Google
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Atau</span></div>
        </div>

        <p className="text-xs text-slate-400">
          Dengan masuk, Anda menyetujui pengaturan privasi sistem keuangan MGM.
        </p>
      </div>
    </div>
  );
}