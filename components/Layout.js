import { useState } from "react";
import Sidebar from "./Sidebar";
import { useRouter } from "next/router";

export default function Layout({ children, user }) {
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false); // State utama
  
  const isLoginPage = router.pathname === "/login";
  const showSidebar = !isLoginPage && user;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showSidebar && (
        <Sidebar isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
      )}
      
      <main className={`flex-1 transition-all duration-300 ${showSidebar ? (isMinimized ? "ml-20" : "ml-64") : "w-full"}`}>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}