import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Search, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { deleteDoc, doc } from 'firebase/firestore';

export default function DetailTransaksi() {
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Ambil data urut berdasarkan waktu terkecil (tua) ke terbesar (baru) 
    // agar kalkulasi saldo berjalan (running balance) akurat
    const q = query(collection(db, "transactions"), orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let runningBalance = 0;
      let inSum = 0;
      let outSum = 0;

      const data = snapshot.docs.map(doc => {
        const item = { id: doc.id, ...doc.data() };
        
        // Kalkulasi saldo berjalan
        if (item.tipe === 'pemasukan') {
          runningBalance += item.nominal;
          inSum += item.nominal;
        } else {
          runningBalance -= item.nominal;
          outSum += item.nominal;
        }

        // Simpan saldo saat transaksi ini terjadi ke dalam objek
        return { ...item, currentBalance: runningBalance };
      });

      // Balik urutan agar yang terbaru muncul di paling atas tabel
      setTransactions([...data].reverse());
      setTotals({ pemasukan: inSum, pengeluaran: outSum, saldo: runningBalance });
    });

    return () => unsubscribe();
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
      await deleteDoc(doc(db, "transactions", id));
      Swal.fire('Terhapus!', 'Transaksi telah dihapus.', 'success');
    }
  };

  const filteredData = transactions.filter(t => 
    t.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.kategori?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-8 tracking-tight">Detail Arus Kas</h2>

      {/* Ringkasan Saldo di Atas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white border border-slate-700">
          <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-1">Saldo Bersih</p>
          <h3 className="text-3xl font-black">Rp {totals.saldo.toLocaleString()}</h3>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Masuk</p>
          <h3 className="text-2xl font-bold text-emerald-700">Rp {totals.pemasukan.toLocaleString()}</h3>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Total Keluar</p>
          <h3 className="text-2xl font-bold text-red-700">Rp {totals.pengeluaran.toLocaleString()}</h3>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h4 className="font-bold text-slate-800">Riwayat & Running Balance</h4>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Cari keterangan..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                <th className="p-5 font-black text-center">Aksi</th>
                <th className="p-5 font-black">Waktu</th>
                <th className="p-5 font-black">Kategori</th>
                <th className="p-5 font-black">Keterangan</th>
                <th className="p-5 font-black text-right">Nominal</th>
                <th className="p-5 font-black text-right bg-slate-100/50 text-slate-600">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition group">
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-500 transition p-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                  <td className="p-4 text-[13px] text-slate-500 whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-md text-slate-600 uppercase">{t.kategori}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 truncate max-w-[200px]">{t.keterangan || '-'}</td>
                  <td className={`p-4 text-right font-bold text-sm ${t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.tipe === 'pemasukan' ? '+' : '-'} {t.nominal.toLocaleString()}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800 bg-slate-50/30 text-sm">
                    Rp {t.currentBalance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}