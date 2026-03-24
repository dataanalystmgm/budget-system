import '../styles/globals.css';
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user && router.pathname !== '/login') {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-teal-400">Loading MGM Finance...</div>;

  return (
    <Layout user={user}>
      <Component {...pageProps} user={user} />
    </Layout>
  );
}

export default MyApp;