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

    // --- LOGIC LOGIN (/login email | PIN) ---
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
            await setDoc(doc(db, 'user_mappings', String(chatId)), {
              chatId, uid: userSnap.docs[0].id, email, linkedAt: serverTimestamp()
            });
            return sendBot(chatId, `✅ Login Berhasil!\nSelamat datang *${userData.name || email}*.\n\nSekarang Anda bisa input data langsung ke MGM Finance.`);
          }
          return sendBot(chatId, `❌ PIN Salah! Silakan cek PIN di menu Profile web.`);
        }
        return sendBot(chatId, `❌ Akun email tidak ditemukan.`);
      }
      return sendBot(chatId, `Gunakan format: \`/login email | PIN\``);
    }

    // --- CEK MAPPING USER ---
    const mapSnap = await getDocs(query(collection(db, 'user_mappings'), where('chatId', '==', chatId)));
    if (mapSnap.empty) {
      return sendBot(chatId, `⚠️ Anda belum login.\nSilakan ketik:\n\`/login email@mgmglove.com | 123456\``);
    }
    const userAuth = mapSnap.docs[0].data();

    // --- LOGIC INPUT KATEGORI (/cat Nama | Tipe) ---
    if (text.startsWith('/cat')) {
      const parts = text.replace('/cat', '').split('|');
      if (parts.length === 2) {
        await addDoc(collection(db, 'categories'), {
          name: parts[0].trim(), type: parts[1].trim(), uid: userAuth.uid, createdAt: serverTimestamp()
        });
        return sendBot(chatId, `✅ Kategori *${parts[0].trim()}* berhasil ditambahkan!`);
      }
    }

    // --- LOGIC INPUT TRANSAKSI (/t Nominal | Ket | Kategori | Tipe) ---
    else if (text.startsWith('/t')) {
      const parts = text.replace('/t', '').split('|');
      if (parts.length === 4) {
        await addDoc(collection(db, 'transactions'), {
          amount: parseInt(parts[0].trim()),
          description: parts[1].trim(),
          category: parts[2].trim(),
          type: parts[3].trim(),
          uid: userAuth.uid,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        return sendBot(chatId, `✅ Transaksi Rp${parseInt(parts[0]).toLocaleString()} tercatat!`);
      }
    }

    // --- LOGIC INPUT BUDGET (/b Nominal | Kategori) ---
    else if (text.startsWith('/b')) {
      const parts = text.replace('/b', '').split('|');
      if (parts.length === 2) {
        await addDoc(collection(db, 'budgets'), {
          limit: parseInt(parts[0].trim()),
          category: parts[1].trim(),
          uid: userAuth.uid,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          createdAt: serverTimestamp()
        });
        return sendBot(chatId, `✅ Budget *${parts[1].trim()}* berhasil diatur!`);
      }
    }

    return res.status(200).send('OK');
  } catch (e) {
    console.error(e);
    return res.status(200).send('Error');
  }
}

async function sendBot(chatId, text) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, { chat_id: chatId, text, parse_mode: 'Markdown' });
}