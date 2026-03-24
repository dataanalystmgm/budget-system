import { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Tambahkan import auth
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore'; // Tambahkan where
import Swal from 'sweetalert2';
import { Calendar, Wallet, Plus } from 'lucide-react';

export default function AturBudget() {
  const [budget, setBudget] = useState({ groupName: '', category: '', amount: '', startDate: '', endDate: '' });
  const [categories, setCategories] = useState([]);
  const [existingGroups, setExistingGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Monitor status login user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const fetchInitial = async () => {
          // Ambil kategori global (atau bisa difilter per tipe pengeluaran)
          const catSnap = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
          setCategories(catSnap.docs.map(d => d.data().name));
          
          // 2. Ambil grup budget yang HANYA milik user ini untuk datalist
          const qBudgets = query(
            collection(db, "budgets"),
            where("uid", "==", user.uid)
          );
          
          const budgetSnap = await getDocs(qBudgets);
          const groups = [...new Set(budgetSnap.docs.map(d => d.data().groupName))];
          setExistingGroups(groups);
          setLoading(false);
        };
        fetchInitial();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!budget.startDate || !budget.endDate) return Swal.fire('Oops', 'Lengkapi rentang tanggal!', 'warning');
    
    if (!auth.currentUser) return Swal.fire('Error', 'Sesi login berakhir', 'error');

    try {
      // 3. Simpan Budget dengan menyertakan UID
      await addDoc(collection(db, "budgets"), { 
        ...budget, 
        uid: auth.currentUser.uid, // TAG ID USER
        amount: Number(budget.amount), 
        status: 'active',
        createdAt: new Date().toISOString()
      });
      
      Swal.fire({ icon: 'success', title: 'Budget Aktif!', timer: 1500, showConfirmButton: false });
      
      // Reset form dan update list grup lokal
      if (!existingGroups.includes(budget.groupName)) {
        setExistingGroups([...existingGroups, budget.groupName]);
      }
      setBudget({ groupName: '', category: '', amount: '', startDate: '', endDate: '' });
    } catch (error) {
      Swal.fire('Error', 'Gagal mengaktifkan anggaran', 'error');
    }
  };

  if (loading) return (
    <div className="p-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-[0.3em]">
      Loading Budget Settings...
    </div>
  );

  return (
    <div className="p-10 max-w-2xl mx-auto font-sans">
      <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800 tracking-tighter">
        <div className="p-2 bg-teal-100 text-teal-600 rounded-xl"><Wallet size={24} /></div>
        Pengaturan Budget Baru
      </h2>
      
      <form onSubmit={handleSave} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Nama Grup Budget</label>
          <input 
            list="groups" 
            className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 font-bold outline-none" 
            placeholder="Misal: Budget Nikah, Bulanan Maret..."
            value={budget.groupName} 
            onChange={e => setBudget({...budget, groupName: e.target.value})} 
            required 
          />
          <datalist id="groups">
            {existingGroups.map(g => <option key={g} value={g} />)}
          </datalist>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Kategori</label>
            <select className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 font-bold outline-none cursor-pointer" 
                    value={budget.category} onChange={e => setBudget({...budget, category: e.target.value})} required>
              <option value="">Pilih Kategori</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Target Limit (Rp)</label>
            <input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 font-black text-slate-800 outline-none" 
                   value={budget.amount} onChange={e => setBudget({...budget, amount: e.target.value})} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 flex items-center gap-1">
              <Calendar size={12} className="text-teal-500" /> Mulai
            </label>
            <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" 
                   value={budget.startDate} onChange={e => setBudget({...budget, startDate: e.target.value})} required />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 flex items-center gap-1 text-red-400">
              <Calendar size={12} /> Berakhir
            </label>
            <input type="date" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none" 
                   value={budget.endDate} onChange={e => setBudget({...budget, endDate: e.target.value})} required />
          </div>
        </div>

        <button className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] font-black mt-4 hover:bg-teal-600 transition-all shadow-xl shadow-slate-200">
          Aktifkan Anggaran
        </button>
      </form>
    </div>
  );
}