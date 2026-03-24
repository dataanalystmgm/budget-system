import '../styles/globals.css';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Tentukan halaman mana saja yang boleh dibuka tanpa login
  const publicRoutes = ['/login', '/signup'];
  const isPublicPage = publicRoutes.includes(router.pathname);

  useEffect(() => {
    // Listener untuk memantau status login user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);

      // 2. LOGIKA PROTEKSI ROUTE
      // Jika TIDAK ADA USER dan halaman yang dibuka BUKAN halaman publik (login/signup)
      if (!user && !isPublicPage) {
        router.push('/login');
      } 
      
      // Opsional: Jika SUDAH LOGIN dan mencoba buka login/signup, lempar ke dashboard
      if (user && isPublicPage) {
        router.push('/');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router.pathname]); // Pantau perubahan user dan URL

  // Tampilan loading saat cek status Firebase
  if (loading) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-teal-400">
        <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black tracking-widest text-sm uppercase">Loading My Finance...</p>
      </div>
    );
  }

  // 3. LOGIKA RENDER LAYOUT
  // Jika di halaman login/signup, tampilkan halaman SAJA (tanpa sidebar/navbar)
  // Jika sudah masuk (dashboard dll), bungkus dengan Layout
  return isPublicPage ? (
    <Component {...pageProps} user={user} />
  ) : (
    <Layout user={user}>
      <Component {...pageProps} user={user} />
    </Layout>
  );
}

export default MyApp;