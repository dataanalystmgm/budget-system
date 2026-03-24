const Home = () => {
  return (
    <div className="p-10 min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-bold text-teal-600 mb-4">Selamat Datang di MGM Digital Finance</h1>
        <p className="text-lg leading-relaxed text-slate-600 mb-6">
          Sistem ini dirancang khusus untuk membantu pengelolaan keuangan personal maupun persiapan dana pernikahan. 
          Anda dapat melacak pengeluaran harian, mengatur kategori, dan memantau budget secara real-time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl font-medium text-teal-800">
            ✅ Pantau pengeluaran berdasarkan kategori.
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl font-medium text-blue-800">
            ✅ Sinkronisasi bukti struk ke Google Drive.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;