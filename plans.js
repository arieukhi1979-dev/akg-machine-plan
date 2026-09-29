
// API untuk Vercel - Database MC Plan - Support 30 user - Auto-sync 30 detik
// Untuk production, ganti dengan Vercel KV atau Vercel Postgres atau Supabase

let memoryDB = null; // fallback memory

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Coba pakai Vercel KV jika ada, kalau tidak pakai memory + filesystem temp
  try {
    if (req.method === 'GET') {
      // GET database
      let data = null;
      
      // Coba baca dari KV jika ada env
      if (process.env.KV_REST_API_URL) {
        try {
          const { kv } = await import('@vercel/kv');
          data = await kv.get('mc_plan_db');
        } catch(e) {}
      }
      
      // Fallback ke memory atau file
      if (!data) {
        data = memoryDB;
      }
      
      if (!data) {
        data = '[]';
      }
      
      // Jika data object, stringify
      if (typeof data === 'object') {
        return res.status(200).json(data);
      } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(data);
      }
    }
    
    if (req.method === 'POST') {
      const body = req.body;
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      
      // Simpan ke KV jika ada
      if (process.env.KV_REST_API_URL) {
        try {
          const { kv } = await import('@vercel/kv');
          await kv.set('mc_plan_db', bodyStr);
        } catch(e) {
          console.log('KV error', e);
        }
      }
      
      // Simpan ke memory juga
      memoryDB = bodyStr;
      
      return res.status(200).json({ status: 'ok', saved: new Date().toISOString(), size: bodyStr.length });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
