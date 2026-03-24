import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { Edit2, Trash2, Plus, ArrowUpCircle, ArrowDownCircle, Tag } from 'lucide-react';
import Swal from 'sweetalert2';

export default function MasterKategori() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', tipe: 'pengeluaran' });

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    await addDoc(collection(db, "categories"), newCat);
    setNewCat({ ...newCat, name: '' });
    Swal.fire({ icon: 'success', title: 'Ditambahkan', timer: 1000, showConfirmButton: false });
  };

  const handleEdit = async (cat) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Kategori',
      html: `
        <div class="text-left px-4">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Kategori</label>
          <input id="swal-name" class="swal2-input !mt-0 !w-full !rounded-xl !text-base font-bold" value="${cat.name}">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-4 mb-1">Tipe</label>
          <select id="swal-tipe" class="swal2-input !mt-0 !w-full !rounded-xl !text-base font-bold">
            <option value="pengeluaran" ${cat.tipe === 'pengeluaran' ? 'selected' : ''}>Pengeluaran</option>
            <option value="pemasukan" ${cat.tipe === 'pemasukan' ? 'selected' : ''}>Pemasukan</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0d9488',
      preConfirm: () => ({
        name: document.getElementById('swal-name').value,
        tipe: document.getElementById('swal-tipe').value
      })
    });

    if (formValues) {
      await updateDoc(doc(db, "categories", cat.id), formValues);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Hapus Kategori?',
      text: `Kategori "${name}" akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!'
    });
    if (result.isConfirmed) await deleteDoc(doc(db, "categories", id));
  };

  // Pengelompokan Data
  const incomeCats = categories.filter(c => c.tipe === 'pemasukan');
  const expenseCats = categories.filter(c => c.tipe === 'pengeluaran');

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3 tracking-tighter">
        <Tag className="text-teal-600" /> Manajemen Kategori
      </h2>

      {/* Form Input Cepat */}
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap md:flex-nowrap gap-4 mb-12 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Nama Kategori</label>
          <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold" 
            placeholder="Contoh: Transportasi, Bonus..." value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} required />
        </div>
        <div className="w-full md:w-48">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Tipe</label>
          <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold cursor-pointer" 
            value={newCat.tipe} onChange={e => setNewCat({...newCat, tipe: e.target.value})}>
            <option value="pengeluaran">Pengeluaran</option>
            <option value="pemasukan">Pemasukan</option>
          </select>
        </div>
        <button className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-teal-600 transition shadow-lg w-full md:w-auto flex justify-center">
          <Plus />
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* KOLOM PEMASUKAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <ArrowUpCircle className="text-emerald-500" size={24} />
            <h3 className="font-black text-slate-700 uppercase tracking-widest text-sm">Daftar Pemasukan</h3>
            <span className="ml-auto bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">{incomeCats.length}</span>
          </div>
          <div className="grid gap-3">
            {incomeCats.map(cat => (
              <CategoryItem key={cat.id} cat={cat} onEdit={handleEdit} onDelete={handleDelete} color="emerald" />
            ))}
            {incomeCats.length === 0 && <EmptyState />}
          </div>
        </div>

        {/* KOLOM PENGELUARAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <ArrowDownCircle className="text-red-500" size={24} />
            <h3 className="font-black text-slate-700 uppercase tracking-widest text-sm">Daftar Pengeluaran</h3>
            <span className="ml-auto bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">{expenseCats.length}</span>
          </div>
          <div className="grid gap-3">
            {expenseCats.map(cat => (
              <CategoryItem key={cat.id} cat={cat} onEdit={handleEdit} onDelete={handleDelete} color="red" />
            ))}
            {expenseCats.length === 0 && <EmptyState />}
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-Komponen untuk Item List
function CategoryItem({ cat, onEdit, onDelete, color }) {
  const colorClass = color === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 flex justify-between items-center group hover:shadow-md transition duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          {color === 'emerald' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
        </div>
        <span className="font-bold text-slate-700">{cat.name}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(cat)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(cat.id, cat.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-300 text-xs font-bold uppercase tracking-tighter">Belum ada kategori</div>;
}