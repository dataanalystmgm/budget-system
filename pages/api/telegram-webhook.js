import axios from 'axios';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, setDoc, doc } from 'firebase/firestore';

const TELEGRAM_TOKEN = '8542020705:AAHqad2Nj8ARKPTSTaMYoRJd6H1wLGQyd6U';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).send('OK');

    const chatId = message.chat.id;
    const text = message.text;

    // --- 1. LOGIC LOGIN (Harus di cek paling pertama) ---
    if (text.startsWith('/login')) {
      const parts = text.replace('/login', '').split('|');
      if (parts.length === 2) {
        const email = parts[0].trim().toLowerCase();
        const pinInput = parts[1].trim();

        const q = query(collection(db, 'users'), where('email', '==', email));
        const userSnap = await getDocs(q);

        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          if (userData.telegramPin === pinInput) {
            // Simpan mapping menggunakan setDoc agar ChatID jadi ID Dokumen (Unik)
            await setDoc(doc(db, 'user_mappings', String(chatId)), {
              chatId, 
              uid: userSnap.docs[0].id, 
              email, 
              linkedAt: serverTimestamp()
            });
            return sendBot(chatId, `✅ *Login Berhasil!*\nSelamat datang *${userData.name || email}*.\nSekarang silakan gunakan perintah /cat atau /t.`);
          }
          return sendBot(chatId, `❌ *PIN Salah!* Silakan cek PIN di menu Profile web.`);
        }
        return sendBot(chatId, `❌ *Email tidak ditemukan!* Pastikan email sudah terdaftar di web.`);
      }
      return sendBot(chatId, `Format salah. Gunakan: \`/login email | PIN\``);
    }

    // --- 2. VALIDASI APAKAH SUDAH TERHUBUNG? ---
    // Kita cari apakah ChatID ini sudah ada di koleksi user_mappings
    const mappingDoc = await getDocs(query(collection(db, 'user_mappings'), where('chatId', '==', chatId)));
    
    if (mappingDoc.empty) {
      return sendBot(chatId, `⚠️ *Akses Ditolak.*\nAnda belum login. Silakan ketik:\n\`/login email@mgmglove.com | PIN\``);
    }

    // Jika sudah ada, ambil datanya
    const userAuth = mappingDoc.docs[0].data();
    const DYNAMIC_UID = userAuth.uid;

    // --- 3. LOGIC INPUT DATA (Hanya jalan jika sudah login) ---

    // INPUT KATEGORI
    if (text.startsWith('/cat')) {
      const parts = text.replace('/cat', '').split('|');
      if (parts.length === 2) {
        await addDoc(collection(db, 'categories'), {
          name: parts[0].trim(),
          type: parts[1].trim(),
          uid: DYNAMIC_UID,
          createdAt: serverTimestamp()
        });
        return sendBot(chatId, `✅ Kategori *${parts[0].trim()}* (${parts[1].trim()}) berhasil masuk ke akun *${userAuth.email}*!`);
      }
      return sendBot(chatId, "Format salah. Gunakan: `/cat Nama | Tipe` ");
    }

    // INPUT TRANSAKSI
    else if (text.startsWith('/t')) {
      const parts = text.replace('/t', '').split('|');
      if (parts.length === 4) {
        await addDoc(collection(db, 'transactions'), {
          amount: parseInt(parts[0].trim()),
          description: parts[1].trim(),
          category: parts[2].trim(),
          type: parts[3].trim(),
          uid: DYNAMIC_UID,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        return sendBot(chatId, `✅ Transaksi Rp${parseInt(parts[0]).toLocaleString()} berhasil dicatat!`);
      }
      return sendBot(chatId, "Format salah. Gunakan: `/t Nominal | Ket | Kategori | Tipe` ");
    }

    // INPUT BUDGET
    else if (text.startsWith('/b')) {
      const parts = text.replace('/b', '').split('|');
      if (parts.length === 2) {
        await addDoc(collection(db, 'budgets'), {
          limit: parseInt(parts[0].trim()),
          category: parts[1].trim(),
          uid: DYNAMIC_UID,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          createdAt: serverTimestamp()
        });
        return sendBot(chatId, `✅ Budget *${parts[1].trim()}* diatur ke Rp${parseInt(parts[0]).toLocaleString()}!`);
      }
    }

    return res.status(200).send('OK');
  } catch (e) {
    console.error("Error Webhook:", e);
    return res.status(200).send('Error');
  }
}

async function sendBot(chatId, text) {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error("Error Send Telegram:", error);
  }
}