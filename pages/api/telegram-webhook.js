import axios from 'axios';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, setDoc, doc, limit } from 'firebase/firestore';

const TELEGRAM_TOKEN = '8542020705:AAHqad2Nj8ARKPTSTaMYoRJd6H1wLGQyd6U';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export default async function handler(req, res) {
  // SEGERA BERI RESPON KE TELEGRAM AGAR TIDAK RETRY (SPAM)
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const text = message.text;

  try {
    // --- 1. LOGIKA LOGIN (/login email | PIN) ---
    if (text.startsWith('/login')) {
      const parts = text.replace('/login', '').split('|');
      if (parts.length === 2) {
        const email = parts[0].trim().toLowerCase();
        const pinInput = parts[1].trim();

        // Cari user di koleksi 'users'
        const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
        const userSnap = await getDocs(q);

        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          if (userData.telegramPin === pinInput) {
            // SIMPAN MAPPING KE KOLEKSI 'user_mappings'
            // Gunakan chatId sebagai ID Dokumen agar pencarian sangat cepat
            await setDoc(doc(db, 'user_mappings', String(chatId)), {
              chatId: chatId,
              uid: userSnap.docs[0].id,
              email: email,
              linkedAt: serverTimestamp()
            });
            await sendBot(chatId, `✅ *LOGIN BERHASIL!*\nSelamat datang, *${userData.name || email}*.\nSekarang Anda bisa input data.`);
            return res.status(200).send('OK');
          }
          await sendBot(chatId, `❌ *PIN SALAH!* Silakan cek PIN di menu Profile web.`);
          return res.status(200).send('OK');
        }
        await sendBot(chatId, `❌ *EMAIL TIDAK DITEMUKAN!*`);
        return res.status(200).send('OK');
      }
      await sendBot(chatId, `Format: \`/login email | PIN\``);
      return res.status(200).send('OK');
    }

    // --- 2. CEK STATUS LOGIN (MAPPING) ---
    // Mencari dokumen dengan ID yang sama dengan chatId (Lebih cepat daripada query where)
    const mapRef = doc(db, 'user_mappings', String(chatId));
    const mapSnap = await getDocs(query(collection(db, 'user_mappings'), where('chatId', '==', chatId), limit(1)));
    
    if (mapSnap.empty) {
      await sendBot(chatId, `⚠️ *AKSES DITOLAK.*\nSilakan login terlebih dahulu:\n\`/login email@mgmglove.com | PIN\``);
      return res.status(200).send('OK');
    }

    const userAuth = mapSnap.docs[0].data();
    const DYNAMIC_UID = userAuth.uid;

    // --- 3. PROSES PERINTAH (Hanya jika sudah login) ---

    // KATEGORI: /cat Nama | Tipe
    if (text.startsWith('/cat')) {
      const parts = text.replace('/cat', '').split('|');
      if (parts.length === 2) {
        await addDoc(collection(db, 'categories'), {
          name: parts[0].trim(),
          tipe: parts[1].trim(),
          uid: DYNAMIC_UID,
          createdAt: serverTimestamp()
        });
        await sendBot(chatId, `✅ Kategori *${parts[0].trim()}* berhasil disimpan.`);
      } else {
        await sendBot(chatId, `Gunakan format: \`/cat Nama | Tipe\``);
      }
    }

    // TRANSAKSI: /t Nominal | Ket | Kategori | Tipe
    else if (text.startsWith('/t')) {
      const parts = text.replace('/t', '').split('|');
      
      if (parts.length === 4) {
        const nominal = Number(parts[0].trim());
        const keterangan = parts[1].trim();
        const kategori = parts[2].trim();
        const tipe = parts[3].trim().toLowerCase(); // Paksa huruf kecil: pengeluaran/pemasukan

        await addDoc(collection(db, 'transactions'), {
          nominal: nominal,            // Sesuai gambar (bukan amount)
          keterangan: keterangan,      // Sesuai gambar (bukan description)
          kategori: kategori,          // Sesuai gambar (bukan category)
          tipe: tipe,                  // Sesuai gambar
          uid: DYNAMIC_UID,            // UID dari user_mappings
          userEmail: userAuth.email,   // Sesuai gambar (menambah userEmail)
          imageUrl: "",                // Sesuai gambar (field kosong)
          createdAt: new Date().toISOString() // Sesuai gambar (format ISO dengan "Z")
        });

        await sendBot(chatId, `✅ Transaksi *${keterangan}* sebesar *Rp${nominal.toLocaleString()}* berhasil dicatat ke kategori *${kategori}*.`);
        return res.status(200).send('OK');
      } else {
        await sendBot(chatId, `❌ Format salah!\nGunakan: \`/t Nominal | Keterangan | Kategori | Tipe\``);
      }
    }

else if (text.startsWith('/b')) {
  const parts = text.replace('/b', '').split('|');
  if (parts.length === 3) {
    const amount = Number(parts[0].trim());
    const groupName = parts[1].trim();
    const category = parts[2].trim();

    await addDoc(collection(db, 'budgets'), {
      amount: amount,                 // Sesuai gambar (bukan limit)
      groupName: groupName,           // Sesuai gambar
      category: category,             // Sesuai gambar
      status: "active",               // Sesuai gambar
      uid: DYNAMIC_UID,
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(1, 'month').startOf('month').format('YYYY-MM-DD'),
      createdAt: new Date().toISOString()
    });

    await sendBot(chatId, `✅ Budget *${groupName}* (Cat: ${category}) sebesar *Rp${amount.toLocaleString()}* berhasil diaktifkan!`);
    return res.status(200).send('OK');
  } else {
    await sendBot(chatId, `❌ Format salah!\nGunakan: \`/b Nominal | NamaGroup | Kategori\``);
  }
}

// --- 2. LOGIKA CEK SALDO & SUMMARY: /cek ---
    else if (text === '/cek') {
      try {
        // Ambil data Transaksi & Budget milik user ini
        const qTrans = query(collection(db, "transactions"), where("uid", "==", DYNAMIC_UID));
        const qBudgets = query(collection(db, "budgets"), where("uid", "==", DYNAMIC_UID));
        
        const [transSnap, budgetSnap] = await Promise.all([getDocs(qTrans), getDocs(qBudgets)]);
        
        const transactions = transSnap.docs.map(d => d.data());
        const budgets = budgetSnap.docs.map(d => d.data());

        // Filter bulan ini (mengikuti logika index.js)
        const startOfMonth = dayjs().startOf('month');
        const filteredTrans = transactions.filter(t => dayjs(t.createdAt).isAfter(startOfMonth.subtract(1, 'day')));

        // Hitung Score Cards (Logika dari Dashboard)
        const totalIn = filteredTrans.filter(t => t.tipe === 'pemasukan').reduce((a, b) => a + (b.nominal || 0), 0);
        const totalOut = filteredTrans.filter(t => t.tipe === 'pengeluaran').reduce((a, b) => a + (b.nominal || 0), 0);
        const currentBalance = totalIn - totalOut;
        
        const totalBudgetSetup = budgets.filter(b => b.status === 'active').reduce((a, b) => a + (b.amount || 0), 0);
        const budgetVsActualPercent = totalBudgetSetup > 0 ? (totalOut / totalBudgetSetup) * 100 : 0;

        // Susun Pesan
        const message = [
          `📊 *FINANCIAL SUMMARY (Bulan Ini)*`,
          `━━━━━━━━━━━━━━━━━━`,
          `💰 *Saldo Saat Ini:* Rp ${currentBalance.toLocaleString()}`,
          `📈 *Total Pemasukan:* Rp ${totalIn.toLocaleString()}`,
          `📉 *Total Pengeluaran:* Rp ${totalOut.toLocaleString()}`,
          `━━━━━━━━━━━━━━━━━━`,
          `🎯 *Budget Setup:* Rp ${totalBudgetSetup.toLocaleString()}`,
          `🔥 *Realisasi:* ${budgetVsActualPercent.toFixed(1)}%`,
          `━━━━━━━━━━━━━━━━━━`,
          `_Gunakan /t untuk mencatat transaksi baru._`
        ].join('\n');

        await sendBot(chatId, message);
        return res.status(200).send('OK');
      } catch (error) {
        console.error("Cek Error:", error);
        await sendBot(chatId, "❌ Gagal menarik ringkasan data.");
      }
    }
    // AKHIR DARI PROSES
    return res.status(200).send('OK');

  } catch (error) {
    console.error("Webhook Error:", error);
    // Tetap kirim 200 OK ke Telegram agar tidak terjadi loop kirim ulang
    return res.status(200).send('OK');
  }
}

// Helper untuk kirim pesan ke bot
async function sendBot(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error("Telegram Send Error:", err.message);
  }
}