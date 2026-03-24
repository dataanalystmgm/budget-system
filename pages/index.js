import { useState, useEffect, cloneElement } from 'react'; // Tambahkan cloneElement di sini
import { db, auth } from '../firebase'; // Import auth dari firebase.js
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore'; // Tambahkan where
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, Target, 
  TrendingUp, Calendar, Filter, ChevronDown 
} from 'lucide-react';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States untuk Filter
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [timeUnit, setTimeUnit] = useState('day'); // day, week, month
  const [pieLimit, setPieLimit] = useState(5);

  const COLORS = ['#0d9488', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    // 1. Pantau status login user terlebih dahulu
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // 2. Query Transaksi: Hanya milik UID user yang login
        const qTrans = query(
          collection(db, "transactions"), 
          where("uid", "==", user.uid), // Filter UID
          orderBy("createdAt", "asc")
        );

        const unsubTrans = onSnapshot(qTrans, (snap) => {
          setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 3. Query Budgets: Hanya milik UID user yang login
        const qBudgets = query(
          collection(db, "budgets"),
          where("uid", "==", user.uid) // Filter UID
        );

        const unsubBudgets = onSnapshot(qBudgets, (snap) => {
          setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        setLoading(false);
        // Clean up listeners saat unmount
        return () => { unsubTrans(); unsubBudgets(); };
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 1. Logika Filter Data berdasarkan Tanggal (Client-side filter tetap ada untuk input date)
  const filteredData = transactions.filter(t => {
    const d = dayjs(t.createdAt);
    return d.isAfter(dayjs(startDate).subtract(1, 'day')) && d.isBefore(dayjs(endDate).add(1, 'day'));
  });

  // 2. Hitung Score Cards
  const totalIn = filteredData.filter(t => t.tipe === 'pemasukan').reduce((a, b) => a + b.nominal, 0);
  const totalOut = filteredData.filter(t => t.tipe === 'pengeluaran').reduce((a, b) => a + b.nominal, 0);
  const currentBalance = totalIn - totalOut;
  const totalBudgetSetup = budgets.filter(b => b.status === 'active').reduce((a, b) => a + b.amount, 0);
  const budgetVsActualPercent = totalBudgetSetup > 0 ? (totalOut / totalBudgetSetup) * 100 : 0;

  // 3. Data untuk Grafik Line (Pemasukan vs Pengeluaran)
  const getLineData = () => {
    const groups = {};
    filteredData.forEach(t => {
      const date = dayjs(t.createdAt).format(timeUnit === 'day' ? 'DD MMM' : timeUnit === 'week' ? 'W-YYYY' : 'MMM YYYY');
      if (!groups[date]) groups[date] = { name: date, masuk: 0, keluar: 0, saldo: 0 };
      if (t.tipe === 'pemasukan') groups[date].masuk += t.nominal;
      else groups[date].keluar += t.nominal;
    });
    
    let runningBalance = 0;
    return Object.values(groups).map(g => {
      runningBalance += (g.masuk - g.keluar);
      return { ...g, saldo: runningBalance };
    });
  };

  // 4. Data untuk Pie Chart (Proporsi Kategori)
  const getPieData = () => {
    const counts = {};
    filteredData.filter(t => t.tipe === 'pengeluaran').forEach(t => {
      counts[t.kategori] = (counts[t.kategori] || 0) + t.nominal;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, pieLimit);
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 tracking-widest text-xs">GENERATING DASHBOARD...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-10 font-sans">
      {/* HEADER & GLOBAL FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">My Dashboard</h2>
          <p className="text-slate-400 font-bold text-sm">Financial Systems & Monitoring</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 px-3 border-r border-slate-100">
            <Calendar size={16} className="text-teal-600" />
            <input type="date" className="text-xs font-black border-none focus:ring-0 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-slate-300">-</span>
            <input type="date" className="text-xs font-black border-none focus:ring-0 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <select className="text-xs font-black border-none focus:ring-0 outline-none px-4 cursor-pointer bg-transparent" value={timeUnit} onChange={e => setTimeUnit(e.target.value)}>
            <option value="day">Harian</option>
            <option value="week">Mingguan</option>
            <option value="month">Bulanan</option>
          </select>
        </div>
      </div>

      {/* SCORE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <ScoreCard title="Saldo Saat Ini" value={currentBalance} icon={<Wallet />} color="bg-slate-900" isMoney />
        <ScoreCard title="Total Pemasukan" value={totalIn} icon={<ArrowUpCircle />} color="bg-emerald-600" isMoney />
        <ScoreCard title="Total Pengeluaran" value={totalOut} icon={<ArrowDownCircle />} color="bg-rose-600" isMoney />
        <ScoreCard title="Budget Setup" value={totalBudgetSetup} icon={<Target />} color="bg-indigo-600" isMoney />
        <ScoreCard title="Budget vs Actual" value={budgetVsActualPercent} icon={<TrendingUp />} color={budgetVsActualPercent > 75 ? "bg-orange-500" : "bg-teal-600"} isPercent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRAFIK UTAMA */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-6">Cashflow vs Saldo</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getLineData()}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="saldo" stroke="#0d9488" strokeWidth={4} fillOpacity={1} fill="url(#colorSaldo)" />
                <Bar dataKey="masuk" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Top Pengeluaran</h3>
            <select className="text-[10px] font-black bg-slate-50 border-none rounded-lg px-2 outline-none" value={pieLimit} onChange={e => setPieLimit(Number(e.target.value))}>
              <option value={3}>TOP 3</option>
              <option value={5}>TOP 5</option>
              <option value={10}>TOP 10</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={getPieData()} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {getPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {getPieData().map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                  <span className="text-slate-500 uppercase tracking-tighter">{item.name}</span>
                </div>
                <span className="text-slate-800 font-black">Rp {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ title, value, icon, color, isMoney, isPercent }) {
  return (
    <div className={`${color} p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden group`}>
      <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
        {cloneElement(icon, { size: 80 })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{title}</p>
      <h4 className="text-xl font-black whitespace-nowrap">
        {isMoney && "Rp "}{value.toLocaleString()}{isPercent && "%"}
      </h4>
    </div>
  );
}