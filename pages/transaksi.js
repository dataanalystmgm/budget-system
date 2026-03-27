import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  where, 
  onSnapshot 
} from 'firebase/firestore'; 
import Swal from 'sweetalert2';
import { Save, Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';

export default function Transaksi() {
  const [allCategories, setAllCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({ 
    nominal: '', 
    kategori: '', 
    tipe: 'pengeluaran', 
    keterangan: '' 
  });

  const GAS_URL = "https://script.google.com/macros/s/AKfycbwYr8gQ5PcoytLymSzKbJRmeSn3ttkn-LtJf0FDt8NcRfZMfmf2GSMD3ifpOqCo5GmI/exec";

  // --- LOGIKA FILTER KATEGORI BERDASARKAN USER LOGIN ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Hanya ambil kategori milik user yang login
        const qCats = query(
          collection(db, "categories"),
          where("uid", "==", user.uid),
          orderBy("name", "asc")
        );

        const unsubSnapshot = onSnapshot(qCats, (snap) => {
          setAllCategories(snap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })));
        });

        return () => unsubSnapshot();
      } else {
        setAllCategories([]);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!form.kategori) return Swal.fire('Oops', 'Pilih kategori!', 'warning');
    
    if (!auth.currentUser) {
        return Swal.fire('Error', 'Sesi login berakhir. Silakan login kembali.', 'error');
    }

    setUploading(true);
    Swal.fire({ 
      title: 'Mengunggah Data...', 
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });

    try {
      let driveUrl = "";

      // 1. Upload ke Google Drive via GAS jika ada file
      if (imageFile) {
        const base64Data = await convertToBase64(imageFile);
        const payload = {
          base64: base64Data,
          mimeType: imageFile.type,
          fileName: `MGM_${Date.now()}_${imageFile.name}`
        };

        const response = await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.status === "success") {
          driveUrl = result.url;
        } else {
          throw new Error("Gagal upload ke Drive");
        }
      }

      // 2. Simpan Data ke Firestore
      await addDoc(collection(db, "transactions"), {
        nominal: Number(form.nominal),
        keterangan: form.keterangan,
        kategori: form.kategori,
        tipe: form.tipe,
        imageUrl: driveUrl,
        uid: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        createdAt: new Date().toISOString() // Format ISO dengan "Z" untuk sinkronisasi Bot
      });

      Swal.fire({ icon: 'success', title: 'Tersimpan!', timer: 1500, showConfirmButton: false });
      
      // Reset Form
      setForm({ nominal: '', kategori: '', tipe: 'pengeluaran', keterangan: '' });
      setImageFile(null);
      setPreview(null);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 font-sans">
      <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <div className="p-2 bg-teal-100 text-teal-600 rounded-xl"><Save size={24} /></div>
        Input Transaksi
      </h2>

      <form onSubmit={handleSimpan} className="space-y-6">
        {/* Foto Box */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] block">
            Bukti Fisik (Google Drive)
          </label>
          {!preview ? (
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-50 cursor-pointer group transition-all">
                <Camera size={32} className="text-slate-300 group-hover:text-teal-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase">Kamera</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
              </label>
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-50 cursor-pointer group transition-all">
                <ImageIcon size={32} className="text-slate-300 group-hover:text-teal-500 mb-2" />
                <span className="text-[10px] font-black text-slate-400 uppercase">File Galeri</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          ) : (
            <div className="relative rounded-3xl overflow-hidden border-4 border-slate-100 shadow-lg">
              <img src={preview} alt="Preview" className="w-full h-56 object-cover" />
              <button 
                type="button" 
                onClick={() => {setPreview(null); setImageFile(null);}} 
                className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-xl hover:scale-110 transition"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Tipe & Kategori */}
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="text-xs font-bold text-slate-400 mb-2 block tracking-widest uppercase">Tipe</label>
             <select 
               className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" 
               value={form.tipe} 
               onChange={e => setForm({...form, tipe: e.target.value, kategori: ''})}
             >
               <option value="pengeluaran">Keluar (-)</option>
               <option value="pemasukan">Masuk (+)</option>
             </select>
           </div>
           <div>
             <label className="text-xs font-bold text-slate-400 mb-2 block tracking-widest uppercase">Kategori</label>
             <select 
               className="w-full p-3 bg-slate-50 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-teal-500" 
               value={form.kategori} 
               onChange={e => setForm({...form, kategori: e.target.value})} 
               required
             >
               <option value="">Pilih</option>
               {allCategories
                 .filter(c => c.tipe === form.tipe)
                 .map(c => <option key={c.id} value={c.name}>{c.name}</option>)
               }
             </select>
           </div>
        </div>

        {/* Nominal */}
        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block tracking-widest uppercase">Nominal (RP)</label>
          <input 
            type="number" 
            className="w-full p-4 bg-slate-50 rounded-2xl text-2xl font-black text-slate-800 border-none focus:ring-2 focus:ring-teal-500 outline-none" 
            value={form.nominal} 
            onChange={e => setForm({...form, nominal: e.target.value})} 
            required 
          />
        </div>

        {/* Keterangan */}
        <div>
          <label className="text-xs font-bold text-slate-400 mb-2 block tracking-widest uppercase">Keterangan (Opsional)</label>
          <input 
            type="text" 
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-800 border-none focus:ring-2 focus:ring-teal-500 outline-none" 
            placeholder="Contoh: Makan Siang di Kantin" 
            value={form.keterangan} 
            onChange={e => setForm({...form, keterangan: e.target.value})} 
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={uploading} 
          className={`w-full py-4 ${uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-teal-600'} text-white rounded-2xl font-black transition flex items-center justify-center gap-3 shadow-xl`}
        >
          {uploading ? (
            <><Loader2 className="animate-spin" /> Sedang Mengunggah...</>
          ) : (
            'Simpan Transaksi'
          )}
        </button>
      </form>
    </div>
  );
}