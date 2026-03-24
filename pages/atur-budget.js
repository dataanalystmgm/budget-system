import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { Calendar, Wallet, Plus } from 'lucide-react';

export default function AturBudget() {
  const [budget, setBudget] = useState({ groupName: '', category: '', amount: '', startDate: '', endDate: '' });
  const [categories, setCategories] = useState([]);
  const [existingGroups, setExistingGroups] = useState([]);

  useEffect(() => {
    const fetchInitial = async () => {
      const catSnap = await getDocs(query(collection(db, "categories"), orderBy("name", "asc")));
      setCategories(catSnap.docs.map(d => d.data().name));
      
      const budgetSnap = await getDocs(collection(db, "budgets"));
      const groups = [...new Set(budgetSnap.docs.map(d => d.data().groupName))];
      setExistingGroups(groups);
    };
    fetchInitial();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!budget.startDate || !budget.endDate) return Swal.fire('Oops', 'Lengkapi rentang tanggal!', 'warning');

    await addDoc(collection(db, "budgets"), { 
      ...budget, 
      amount: Number(budget.amount), 
      status: 'active',
      createdAt: new Date().toISOString()
    });
    
    Swal.fire({ icon: 'success', title: 'Budget Aktif!', timer: 1500, showConfirmButton: false });
    setBudget({ groupName: '', category: '', amount: '', startDate: '', endDate: '' });
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-slate-800">
        <Wallet className="text-teal-600" /> Pengaturan Budget Baru
      </h2>
      
      <form onSubmit={handleSave} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-500 block mb-2">Nama Grup Budget</label>
          <input list="groups" className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500" 
                 placeholder="Misal: Budget Nikah, Bulanan Maret..."
                 value={budget.groupName} onChange={e => setBudget({...budget, groupName: e.target.value})} required />
          <datalist id="groups">
            {existingGroups.map(g => <option key={g} value={g} />)}
          </datalist>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-500 block mb-2">Kategori</label>
            <select className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500" 
                    value={budget.category} onChange={e => setBudget({...budget, category: e.target.value})} required>
              <option value="">Pilih</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 block mb-2">Target Limit (Rp)</label>
            <input type="number" className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 font-bold" 
                   value={budget.amount} onChange={e => setBudget({...budget, amount: e.target.value})} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-500 block mb-2 flex items-center gap-1">
              <Calendar size={14} /> Mulai
            </label>
            <input type="date" className="w-full p-3 bg-slate-50 border-none rounded-xl" 
                   value={budget.startDate} onChange={e => setBudget({...budget, startDate: e.target.value})} required />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 block mb-2 flex items-center gap-1 text-red-400">
              <Calendar size={14} /> Berakhir
            </label>
            <input type="date" className="w-full p-3 bg-slate-50 border-none rounded-xl" 
                   value={budget.endDate} onChange={e => setBudget({...budget, endDate: e.target.value})} required />
          </div>
        </div>

        <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-slate-800 transition shadow-lg">
          Aktifkan Anggaran
        </button>
      </form>
    </div>
  );
}