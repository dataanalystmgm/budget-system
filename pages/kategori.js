import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  where,
  writeBatch // Tambahkan ini untuk bulk insert
} from 'firebase/firestore';
import { Edit2, Trash2, Plus, ArrowUpCircle, ArrowDownCircle, Tag, List, CheckCircle2, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function MasterKategori() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', tipe: 'pengeluaran' });
  const [loading, setLoading] = useState(true);
  
  // State Baru untuk Fitur Bulk Add
  const [showBulkList, setShowBulkList] = useState(false);
  const [selectedBulk, setSelectedBulk] = useState([]);

  const PRESET_INCOME = [
    { name: "Gaji Pokok", icon: "💰" }, { name: "Lembur", icon: "🕒" }, { name: "Bonus/THR", icon: "🎁" },
    { name: "Komisi Project", icon: "🚀" }, { name: "Side Hustle", icon: "🛒" }, { name: "Dividen", icon: "📈" },
    { name: "Refund", icon: "🔄" }, { name: "Hadiah", icon: "🎉" }, { name: "Investasi", icon: "🏦" }, { name: "Pinjaman", icon: "🤝" }
  ];

  const PRESET_EXPENSE = [
    { name: "Makan Siang", icon: "🍱" }, { name: "Sembako", icon: "🛒" }, { name: "Token Listrik", icon: "⚡" },
    { name: "Air PDAM", icon: "💧" }, { name: "Gas LPG", icon: "🔥" }, { name: "Mandi/Cuci", icon: "🧼" },
    { name: "Keamanan/RT", icon: "🏘️" }, { name: "Perbaikan Rumah", icon: "🛠️" }, { name: "Sewa Kos", icon: "🏠" },
    { name: "Bensin", icon: "⛽" }, { name: "Parkir", icon: "🅿️" }, { name: "Tol", icon: "🛣️" },
    { name: "Servis Rutin", icon: "🔧" }, { name: "Cuci Mobil/Motor", icon: "🚿" }, { name: "Gojek/Grab", icon: "🛵" },
    { name: "Transport Umum", icon: "🚌" }, { name: "Pajak STNK", icon: "📄" }, { name: "Obat/Vitamin", icon: "💊" },
    { name: "Dokter", icon: "🩺" }, { name: "Skincare", icon: "✨" }, { name: "Potong Rambut", icon: "💇" },
    { name: "Gym/Olahraga", icon: "💪" }, { name: "Asuransi", icon: "🛡️" }, { name: "Pulsa/Data", icon: "📱" },
    { name: "WiFi", icon: "🌐" }, { name: "Streaming", icon: "🎬" }, { name: "Bioskop", icon: "🍿" },
    { name: "Game Online", icon: "🎮" }, { name: "Buku", icon: "📚" }, { name: "Zakat/Sedekah", icon: "🤲" },
    { name: "Kondangan", icon: "🤝" }, { name: "Kado", icon: "🎁" }, { name: "Orang Tua", icon: "👵" },
    { name: "Jajan Anak", icon: "🍭" }, { name: "Sekolah", icon: "🏫" }, { name: "Makan Mewah", icon: "🥩" },
    { name: "ATK", icon: "🖊️" }, { name: "Kopi Kerja", icon: "☕" }, { name: "Seminar", icon: "🎓" },
    { name: "Software", icon: "💻" }, { name: "Pakaian Kerja", icon: "👔" }, { name: "Pajak Tahunan", icon: "🏢" },
    { name: "Admin Bank", icon: "💳" }, { name: "Cicilan", icon: "📉" }, { name: "Dana Darurat", icon: "🚨" },
    { name: "Biaya Tarik Tunai", icon: "🏧" }, { name: "Hewan Peliharaan", icon: "🐾" }, { name: "Rokok/Vape", icon: "🚬" },
    { name: "Laundry", icon: "🧺" }, { name: "Tabungan Emas", icon: "✨" }
  ];

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(collection(db, "categories"), where("uid", "==", user.uid), orderBy("name", "asc"));
        const unsubSnapshot = onSnapshot(q, (snap) => {
          setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          setLoading(false);
        });
        return () => unsubSnapshot();
      } else { setLoading(false); }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCat.name || !auth.currentUser) return;
    await addDoc(collection(db, "categories"), { ...newCat, uid: auth.currentUser.uid, createdAt: new Date().toISOString() });
    setNewCat({ ...newCat, name: '' });
  };

  // Fungsi Baru: Bulk Insert
  const handleBulkSubmit = async () => {
    if (selectedBulk.length === 0) return setShowBulkList(false);
    
    Swal.fire({ title: 'Menambahkan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const batch = writeBatch(db);
    selectedBulk.forEach(item => {
      const docRef = doc(collection(db, "categories"));
      batch.set(docRef, {
        name: item.name,
        tipe: item.tipe,
        uid: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
    });

    try {
      await batch.commit();
      Swal.fire({ icon: 'success', title: 'Kategori Berhasil Ditambahkan', timer: 1500 });
      setSelectedBulk([]);
      setShowBulkList(false);
    } catch (e) {
      Swal.fire('Error', 'Gagal menambah kategori massal', 'error');
    }
  };

  const toggleSelectBulk = (item, tipe) => {
    const isExist = selectedBulk.find(i => i.name === item.name);
    if (isExist) {
      setSelectedBulk(selectedBulk.filter(i => i.name !== item.name));
    } else {
      setSelectedBulk([...selectedBulk, { ...item, tipe }]);
    }
  };

  // Logika Edit & Delete tetap sama...
  const handleEdit = async (cat) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Kategori',
      html: `<div class="text-left px-4">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Kategori</label>
          <input id="swal-name" class="swal2-input !mt-0 !w-full !rounded-xl !text-base font-bold" value="${cat.name}">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-4 mb-1">Tipe</label>
          <select id="swal-tipe" class="swal2-input !mt-0 !w-full !rounded-xl !text-base font-bold">
            <option value="pengeluaran" ${cat.tipe === 'pengeluaran' ? 'selected' : ''}>Pengeluaran</option>
            <option value="pemasukan" ${cat.tipe === 'pemasukan' ? 'selected' : ''}>Pemasukan</option>
          </select>
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'Update',
      confirmButtonColor: '#0d9488',
      preConfirm: () => ({ name: document.getElementById('swal-name').value, tipe: document.getElementById('swal-tipe').value })
    });
    if (formValues) await updateDoc(doc(db, "categories", cat.id), formValues);
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({ title: 'Hapus?', text: `Kategori "${name}" akan dihapus.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (result.isConfirmed) await deleteDoc(doc(db, "categories", id));
  };

  const incomeCats = categories.filter(c => c.tipe === 'pemasukan');
  const expenseCats = categories.filter(c => c.tipe === 'pengeluaran');

  if (loading) return <div className="p-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Syncing Categories...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans relative">
      {/* OVERLAY LIST PRESET (MODAL) */}
      {showBulkList && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-4 md:p-10 overflow-y-auto">
          <div className="bg-white max-w-5xl mx-auto rounded-[3rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Pilih Kategori Umum</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Pilih beberapa sekaligus</p>
              </div>
              <button onClick={() => setShowBulkList(false)} className="p-3 bg-slate-100 rounded-full hover:bg-red-100 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-10">
              {/* Preset Pemasukan - 2 Kolom */}
              <div>
                <h4 className="flex items-center gap-2 font-black text-emerald-500 uppercase tracking-widest text-[10px] mb-4">
                  <ArrowUpCircle size={14}/> Pemasukan
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_INCOME.map(item => (
                    <button key={item.name} onClick={() => toggleSelectBulk(item, 'pemasukan')} 
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 font-bold text-sm ${selectedBulk.find(i => i.name === item.name) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                      <span className="text-xl">{item.icon}</span> {item.name}
                      {selectedBulk.find(i => i.name === item.name) && <CheckCircle2 size={16} className="ml-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Pengeluaran - 4 Kolom */}
              <div>
                <h4 className="flex items-center gap-2 font-black text-red-400 uppercase tracking-widest text-[10px] mb-4">
                  <ArrowDownCircle size={14}/> Pengeluaran
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRESET_EXPENSE.map(item => (
                    <button key={item.name} onClick={() => toggleSelectBulk(item, 'pengeluaran')} 
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 font-bold text-xs text-center ${selectedBulk.find(i => i.name === item.name) ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}>
                      <span className="text-2xl">{item.icon}</span> {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button onClick={() => setShowBulkList(false)} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-slate-400 hover:text-slate-600">Batal</button>
              <button onClick={handleBulkSubmit} className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-teal-100 hover:bg-teal-700 transition">
                Simpan {selectedBulk.length} Kategori Dipilih
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
          <div className="p-2 bg-teal-100 text-teal-600 rounded-xl"><Tag size={24} /></div>
          Manajemen Kategori
        </h2>
        <button 
          onClick={() => setShowBulkList(true)}
          className="flex items-center gap-2 bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl font-black text-slate-600 text-xs uppercase tracking-widest hover:border-teal-500 hover:text-teal-600 transition shadow-sm"
        >
          <List size={18} /> Tambahkan Dari List
        </button>
      </div>

      {/* Form Input Cepat Tetap Ada */}
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap md:flex-nowrap gap-4 mb-12 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Input Manual</label>
          <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-teal-500 font-bold outline-none" 
            placeholder="Ketik nama kategori..." value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} required />
        </div>
        <div className="w-full md:w-48">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Tipe</label>
          <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold cursor-pointer outline-none" 
            value={newCat.tipe} onChange={e => setNewCat({...newCat, tipe: e.target.value})}>
            <option value="pengeluaran">Pengeluaran</option>
            <option value="pemasukan">Pemasukan</option>
          </select>
        </div>
        <button className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-teal-600 transition shadow-lg w-full md:w-auto flex justify-center h-[56px] items-center px-8 font-black">
          <Plus />
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* KOLOM PEMASUKAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <ArrowUpCircle className="text-emerald-500" size={24} />
            <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">Daftar Pemasukan</h3>
            <span className="ml-auto bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">{incomeCats.length}</span>
          </div>
          <div className="grid gap-3">
            {incomeCats.map(cat => <CategoryItem key={cat.id} cat={cat} onEdit={handleEdit} onDelete={handleDelete} color="emerald" />)}
            {incomeCats.length === 0 && <EmptyState />}
          </div>
        </div>

        {/* KOLOM PENGELUARAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <ArrowDownCircle className="text-red-500" size={24} />
            <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">Daftar Pengeluaran</h3>
            <span className="ml-auto bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black">{expenseCats.length}</span>
          </div>
          <div className="grid gap-3">
            {expenseCats.map(cat => <CategoryItem key={cat.id} cat={cat} onEdit={handleEdit} onDelete={handleDelete} color="red" />)}
            {expenseCats.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-Komponen Item & EmptyState tetap sama seperti kode Anda sebelumnya
function CategoryItem({ cat, onEdit, onDelete, color }) {
  const colorClass = color === 'emerald' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50';
  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 flex justify-between items-center group hover:shadow-md transition duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          {color === 'emerald' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
        </div>
        <span className="font-bold text-slate-700 text-sm">{cat.name}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(cat)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"><Edit2 size={14} /></button>
        <button onClick={() => onDelete(cat.id, cat.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Belum ada kategori</div>;
}