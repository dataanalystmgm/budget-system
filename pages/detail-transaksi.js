import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, where, deleteDoc, doc } from 'firebase/firestore'; 
import { Wallet, ArrowUpCircle, ArrowDownCircle, Search, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DetailTransaksi() {
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, "transactions"), 
          where("uid", "==", user.uid),
          orderBy("createdAt", "asc")
        );
        
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          let runningBalance = 0;
          let inSum = 0;
          let outSum = 0;

          const data = snapshot.docs.map(doc => {
            const item = { id: doc.id, ...doc.data() };
            
            // PROTEKSI NaN: Pastikan nominal adalah angka, jika tidak ada gunakan 0
            const nominal = Number(item.nominal) || 0;

            // Kalkulasi saldo berjalan
            if (item.tipe === 'pemasukan') {
              runningBalance += nominal;
              inSum += nominal;
            } else {
              runningBalance -= nominal;
              outSum += nominal;
            }

            return { ...item, nominal: nominal, currentBalance: runningBalance };
          });

          setTransactions([...data].reverse());
          setTotals({ pemasukan: inSum, pengeluaran: outSum, saldo: runningBalance });
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Transaksi?',
      text: "Data yang dihapus tidak bisa dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "transactions", id));
        Swal.fire('Terhapus!', 'Transaksi telah dihapus.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Gagal menghapus data.', 'error');
      }
    }
  };

  const filteredData = transactions.filter(t => 
    t.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.kategori?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="p-10 text-center font-black text-slate-400 animate-pulse uppercase tracking-widest">
      Loading Financial Logs...
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Detail Arus Kas</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white border border-slate-700 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] mb-1 opacity-80">Saldo Bersih</p>
            <h3 className="text-3xl font-black">Rp {totals.saldo.toLocaleString()}</h3>
          </div>
          <Wallet className="absolute -right-4 -bottom-4 text-white/5" size={100} />
        </div>
        
        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Total Masuk</p>
          <h3 className="text-2xl font-black text-emerald-700">Rp {totals.pemasukan.toLocaleString()}</h3>
          <ArrowUpCircle className="absolute -right-4 -bottom-4 text-emerald-500/10" size={100} />
        </div>

        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 relative overflow-hidden">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] mb-1">Total Keluar</p>
          <h3 className="text-2xl font-black text-red-700">Rp {totals.pengeluaran.toLocaleString()}</h3>
          <ArrowDownCircle className="absolute -right-4 -bottom-4 text-red-500/10" size={100} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Riwayat & Running Balance</h4>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-3 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Cari keterangan atau kategori..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-xs font-bold outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                <th className="p-5 font-black text-center">Aksi</th>
                <th className="p-5 font-black">Waktu</th>
                <th className="p-5 font-black">Kategori</th>
                <th className="p-5 font-black">Keterangan</th>
                <th className="p-5 font-black text-right">Nominal</th>
                <th className="p-5 font-black text-right bg-slate-100/30 text-slate-600">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.length > 0 ? filteredData.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 transition p-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td className="p-4 text-[12px] font-bold text-slate-500 whitespace-nowrap">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                    <span className="block text-[10px] opacity-50">
                        {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-black px-3 py-1 bg-slate-100 rounded-lg text-slate-600 uppercase tracking-tighter">
                        {t.kategori}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-600 truncate max-w-[200px] italic">
                    {t.keterangan || '-'}
                  </td>
                  <td className={`p-4 text-right font-black text-sm ${t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.tipe === 'pemasukan' ? '+' : '-'} {t.nominal.toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-black text-slate-800 bg-slate-50/20 text-sm">
                    Rp {t.currentBalance.toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Tidak ada transaksi ditemukan
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}