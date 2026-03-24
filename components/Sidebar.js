import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  LayoutDashboard, Wallet, Heart, LogOut, Tag, 
  FileText, BarChart, ReceiptText, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { auth } from '../firebase';
import Swal from 'sweetalert2';

export default function Sidebar({ isMinimized, setIsMinimized }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
      Swal.fire({ icon: 'success', title: 'Logged Out', timer: 1000, showConfirmButton: false });
      router.push('/login');
    });
  };

  const menu = [
    { name: 'Home', icon: <LayoutDashboard size={20}/>, path: '/' },
    { name: 'Kategori', icon: <Tag size={20}/>, path: '/kategori' },
    { name: 'Transaksi', icon: <FileText size={20}/>, path: '/transaksi' },
    { name: 'Detail', icon: <ReceiptText size={20}/>, path: '/detail-transaksi' },
    { name: 'Budget', icon: <Wallet size={20}/>, path: '/atur-budget' },
    { name: 'Monitor', icon: <BarChart size={20}/>, path: '/monitor-budget' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-300 z-50 ${isMinimized ? 'w-20' : 'w-64'}`}>
      
      {/* Tombol Toggle Minimize */}
      <button 
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -right-3 top-10 bg-teal-500 text-white rounded-full p-1 shadow-lg hover:bg-teal-600 transition"
      >
        {isMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Header Logo */}
      <div className={`p-6 text-xl font-bold text-teal-400 border-b border-slate-800 overflow-hidden whitespace-nowrap ${isMinimized ? 'text-center' : ''}`}>
        {isMinimized ? 'M' : 'MGM Finance'}
      </div>

      {/* Profil Singkat */}
      <div className={`p-4 border-b border-slate-800 flex items-center gap-3 overflow-hidden`}>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-teal-500 min-w-[40px]" />
        ) : (
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center font-bold text-white min-w-[40px]">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
        )}
        {!isMinimized && (
          <div className="truncate">
            <p className="text-sm font-bold text-white truncate">{user?.displayName || 'User'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Sistem Keuangan</p>
          </div>
        )}
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 p-3 space-y-2 mt-4">
        {menu.map((item) => (
          <Link key={item.path} href={item.path} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${router.pathname === item.path ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <span className={isMinimized ? 'mx-auto' : ''}>{item.icon}</span>
            {!isMinimized && <span className="font-medium">{item.name}</span>}
            
            {/* Tooltip saat minimized */}
            {isMinimized && (
              <span className="absolute left-20 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {item.name}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} className={`p-5 border-t border-slate-800 flex items-center gap-4 text-red-400 hover:bg-red-900/20 transition-all ${isMinimized ? 'justify-center' : ''}`}>
        <LogOut size={20} />
        {!isMinimized && <span className="font-bold">Logout</span>}
      </button>
    </aside>
  );
}