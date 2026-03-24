import { useState } from "react";
import Sidebar from "./Sidebar";
import { useRouter } from "next/router";

export default function Layout({ children, user }) {
  const router = useRouter();
  
  // State minimized untuk Desktop
  const [isMinimized, setIsMinimized] = useState(false); 
  // State isOpen untuk toggle Sidebar di Mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false); 
  
  const isLoginPage = router.pathname === "/login";
  const showSidebar = !isLoginPage && user;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showSidebar && (
        <Sidebar 
          isMinimized={isMinimized} 
          setIsMinimized={setIsMinimized} 
          isMobileOpen={isMobileOpen} // Kirim state mobile
          setIsMobileOpen={setIsMobileOpen} // Kirim setter mobile
        />
      )}
      
      <main className={`
        flex-1 transition-all duration-300 w-full min-w-0
        ${showSidebar 
          ? (isMinimized 
              ? "md:ml-20 ml-0" // md: untuk desktop, ml-0 untuk HP
              : "md:ml-64 ml-0") // md: untuk desktop, ml-0 untuk HP
          : "w-full"}
      `}>
        {/* Container Konten */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          
          {/* Header Mobile (Hanya muncul jika Sidebar tidak melayang) */}
          {showSidebar && (
            <div className="md:hidden flex items-center justify-between mb-6">
              <div>
                <h1 className="font-black text-slate-800 tracking-tighter text-xl">My <span className="text-teal-600">FINANCE</span></h1>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Financial System</p>
              </div>
              {/* Tombol pemicu sidebar di mobile (Jika tidak ingin pakai floating button) */}
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}