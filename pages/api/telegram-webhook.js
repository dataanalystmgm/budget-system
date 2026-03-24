import axios from 'axios';
import { db } from '../../firebase'; // Pastikan path ke config firebase Anda benar
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Ganti dengan UID Firebase Anda agar data masuk ke akun Anda
const MY_UID = "ISI_DENGAN_UID_FIREBASE_ANDA"; 

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).send('OK');

    const chatId = message.chat.id;
    const text = message.text;
    let responseText = "Format salah. Gunakan:\n\n" +
                       "1. Kategori: `/cat NamaKategori` \n" +
                       "2. Transaksi: `/t Nominal | Keterangan | NamaKategori` \n" +
                       "3. Budget: `/b Nominal | NamaKategori` ";

    // --- 1. LOGIC INPUT KATEGORI (/cat) ---
    // Format: /cat NamaKategori | Tipe
    if (text.startsWith('/cat')) {
      const parts = text.replace('/cat', '').split('|');
      if (parts.length === 2) {
        const catName = parts[0].trim();
        const type = parts[1].trim(); // Pemasukan atau Pengeluaran

        await addDoc(collection(db, 'categories'), {
          name: catName,
          type: type, // Menambahkan field tipe sesuai form web
          uid: MY_UID,
          createdAt: serverTimestamp()
        });
        responseText = `✅ Kategori *${catName}* (${type}) berhasil ditambahkan ke sistem MGM!`;
      } else {
        responseText = "❌ Format salah! Gunakan: `/cat NamaKategori | Tipe` \nContoh: `/cat Produksi | Pengeluaran`";
      }
    }

    // --- 2. LOGIC INPUT TRANSAKSI (/t) ---
    // Format: /t 50000 | Beli Mur | Produksi | Pengeluaran
    else if (text.startsWith('/t')) {
      const parts = text.replace('/t', '').split('|');
      if (parts.length === 4) {
        const amount = parseInt(parts[0].trim());
        const desc = parts[1].trim();
        const catName = parts[2].trim();
        const type = parts[3].trim();

        await addDoc(collection(db, 'transactions'), {
          amount,
          description: desc,
          category: catName,
          type: type, // Penting untuk kalkulasi total saldo di Dashboard
          uid: MY_UID,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
        responseText = `✅ Transaksi Rp${amount.toLocaleString()} tercatat sebagai *${type}* di kategori *${catName}*!`;
      } else {
        responseText = "❌ Format salah! Gunakan: `/t Nominal | Ket | Kategori | Tipe` \nContoh: `/t 50000 | Beli Lem | Produksi | Pengeluaran`";
      }
    }

    // --- 3. LOGIC INPUT BUDGET (/b) ---
    // Format: /b 1000000 | Produksi
    else if (text.startsWith('/b')) {
      const parts = text.replace('/b', '').split('|');
      if (parts.length === 2) {
        const amount = parseInt(parts[0].trim());
        const catName = parts[1].trim();

        await addDoc(collection(db, 'budgets'), {
          limit: amount,
          category: catName,
          uid: MY_UID,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          createdAt: serverTimestamp()
        });
        responseText = `✅ Budget kategori *${catName}* diatur ke Rp${amount.toLocaleString()}!`;
      }
    }

    // Kirim Balasan ke Telegram
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: responseText,
      parse_mode: 'Markdown'
    });

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error Telegram Webhook:', error);
    return res.status(200).send('Error but OK'); // Telegram butuh 200 agar tidak kirim ulang
  }
}