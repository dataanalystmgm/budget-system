import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  Edit2, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Trash2, 
  Filter,
  PieChart,
  Target,
  Wallet
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function MonitorBudget() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync Data Real-time (Firebase)
  useEffect(() => {
    const qBudgets = query(collection(db, "budgets"), where("status", "==", "active"));
    
    const unsubBudgets = onSnapshot(qBudgets, (bSnap) => {
      const budgets = bSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const unsubTrans = onSnapshot(collection(db, "transactions"), (tSnap) => {
        const trans = tSnap.docs.map(d => d.data());

        const result = budgets.map(b => {
          const spent = trans
            .filter(t => 
              t.kategori === b.category && 
              t.tipe === 'pengeluaran' && 
              t.createdAt >= b.startDate && 
              t.createdAt <= b.endDate + 'T23:59:59'
            )
            .reduce((acc, curr) => acc + curr.nominal, 0);
          
          return { ...b, spent };
        });

        setMonitors(result);
        setLoading(false);
      });

      return () => unsubTrans();
    });

    return () => unsubBudgets();
  }, []);

  // HITUNG SUMMARY TOTAL
  const totalBudget = monitors.reduce((acc, curr) => acc + curr.amount, 0);
  const totalActual = monitors.reduce((acc, curr) => acc + curr.spent, 0);
  const totalPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  // FUNGSI EDIT DENGAN TAMPILAN PROPER
  const handleEditBudget = async (m) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Pengaturan Budget',
      customClass: {
        title: 'text-3xl font-black text-slate-700 tracking-tight !mt-10',
        htmlContainer: 'swal2-custom-ui-fix'
      },
      html: `
        <div class="p-8 text-left max-w-xl mx-auto">
          <div class="mb-6">
            <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Limit Budget (Rp)</label>
            <input id="swal-amount" type="number" 
                   class="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none text-lg font-bold text-slate-800" 
                   value="${m.amount}" placeholder="Masukkan Nominal">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Tgl Mulai</label>
              <input id="swal-start" type="date" 
                     class="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none text-slate-700" 
                     value="${m.startDate}">
            </div>
            <div>
              <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Tgl Selesai</label>
              <input id="swal-end" type="date" 
                     class="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none text-slate-700" 
                     value="${m.endDate}">
            </div>
          </div>
        </div>
        <div class="w-[90%] mx-auto h-2 bg-slate-700 rounded-full mb-8"></div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      confirmButtonColor: '#0d9488', 
      cancelButtonText: 'Cancel',
      cancelButtonColor: '#64748b',
      buttonsStyling: false, 
      customClass: {
        confirmButton: 'bg-teal-600 hover:bg-teal-700 text-white font-black py-4 px-8 rounded-xl mx-2 shadow-lg shadow-teal-100 transition duration-300',
        cancelButton: 'bg-slate-500 hover:bg-slate-600 text-white font-black py-4 px-8 rounded-xl mx-2 transition duration-300',
        title: 'text-3xl font-black text-slate-700 tracking-tight !mt-10 mb-8',
        actions: '!mb-10 !mt-2'
      },
      preConfirm: () => {
        const amount = document.getElementById('swal-amount').value;
        const startDate = document.getElementById('swal-start').value;
        const endDate = document.getElementById('swal-end').value;
        if (!amount || !startDate || !endDate) {
          Swal.showValidationMessage('Semua data wajib diisi!');
        }
        return { amount: Number(amount), startDate, endDate };
      }
    });

    if (formValues) {
      try {
        await updateDoc(doc(db, "budgets", m.id), formValues);
        Swal.fire({ icon: 'success', title: 'Data Diperbarui!', timer: 1500, showConfirmButton: false });
      } catch (error) {
        Swal.fire('Error', 'Gagal memperbarui data', 'error');
      }
    }
  };

  const handleDeleteBudget = async (id, category) => {
    const result = await Swal.fire({
      title: 'Hapus Budget?',
      text: `Budget untuk kategori "${category}" akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, "budgets", id));
      Swal.fire('Terhapus!', 'Data budget telah dibersihkan.', 'success');
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Memuat data anggaran...</div>;

  return (
    <div className="p-8">
      {/* SECTION SUMMARY TOTAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <Target className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform" size={120} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Budget Limit</p>
          <h2 className="text-3xl font-black text-white">Rp {totalBudget.toLocaleString()}</h2>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Actual Spent</p>
              <h2 className="text-3xl font-black text-slate-800">Rp {totalActual.toLocaleString()}</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black ${totalPercent > 75 ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}`}>
              {totalPercent.toFixed(1)}%
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4">
            <div className={`h-full transition-all duration-1000 ${totalPercent > 75 ? 'bg-orange-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(totalPercent, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-teal-600 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <Wallet className="absolute -right-4 -bottom-4 text-white/10 group-hover:rotate-12 transition-transform" size={120} />
          <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">Sisa Saldo Budget</p>
          <h2 className="text-3xl font-black text-white">Rp {(totalBudget - totalActual).toLocaleString()}</h2>
        </div>
      </div>

      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
          <div className="p-2.5 bg-teal-100 text-teal-600 rounded-2xl shadow-inner border border-teal-200">
            <TrendingUp size={28} />
          </div>
          Detail Anggaran Per Kategori
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {monitors.map((m) => {
          const percent = Math.min((m.spent / m.amount) * 100, 100);
          
          // Logika Warna Berdasarkan Persentase
          const isDanger = percent >= 95;
          const isWarning = percent > 75;
          
          let colorTheme = "teal";
          if (isDanger) colorTheme = "red";
          else if (isWarning) colorTheme = "orange";

          const themeClasses = {
            teal: { bar: "bg-teal-500", text: "text-teal-600", bg: "bg-teal-50/50", border: "border-teal-100", icon: "text-teal-500" },
            orange: { bar: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50/50", border: "border-orange-100", icon: "text-orange-500" },
            red: { bar: "bg-red-500", text: "text-red-600", bg: "bg-red-50/50", border: "border-red-100", icon: "text-red-500" }
          }[colorTheme];

          return (
            <div key={m.id} className="bg-white p-7 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-100 relative group transition-all duration-300 hover:-translate-y-2">
              
              <div className="absolute top-7 right-7 flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${themeClasses.bg} ${themeClasses.text} border ${themeClasses.border}`}>
                  {percent.toFixed(1)}%
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditBudget(m)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteBudget(m.id, m.category)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">{m.groupName}</p>
                <h3 className="font-extrabold text-slate-800 text-xl leading-snug">{m.category}</h3>
              </div>

              <div className="flex items-center gap-2.5 text-[10px] text-slate-500 mb-6 bg-slate-50 p-3 rounded-2xl w-fit font-bold border border-slate-100 shadow-inner">
                <Calendar size={13} className={themeClasses.icon} />
                <span>{m.startDate} <span className="mx-1 text-slate-300">/</span> {m.endDate}</span>
              </div>

              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-6 p-1 border border-slate-100 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${themeClasses.bar}`} 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              <div className={`space-y-4 ${themeClasses.bg} p-5 rounded-3xl border ${themeClasses.border} shadow-sm`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[11px] font-bold ${themeClasses.text} uppercase tracking-wider`}>Terpakai</span>
                  <span className={`font-black text-base ${themeClasses.text}`}>
                    Rp {m.spent.toLocaleString()}
                  </span>
                </div>
                <div className={`h-[1px] ${themeClasses.border} opacity-50 w-full`}></div>
                <div className="flex justify-between items-center">
                  <span className={`text-[11px] font-bold ${themeClasses.text} uppercase tracking-wider`}>Target Limit</span>
                  <span className="font-black text-base text-slate-800">
                    Rp {m.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {isWarning && (
                <div className={`mt-5 flex items-center justify-center gap-2 ${themeClasses.text} text-[10px] font-black animate-pulse uppercase tracking-widest ${themeClasses.bg} py-3 rounded-xl border ${themeClasses.border}`}>
                  <AlertCircle size={15} /> {isDanger ? 'Limit Tercapai!' : 'Warning: Mendekati Limit'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {monitors.length === 0 && (
        <div className="mt-16 bg-white border-2 border-dashed border-slate-200 p-24 rounded-[3rem] text-center shadow-lg shadow-slate-100">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Filter size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-extrabold text-xl">Belum ada anggaran yang sedang aktif.</p>
        </div>
      )}
    </div>
  );
}