// Wyszukiwanie produktów spożywczych w Open Food Facts (darmowa, otwarta baza – bez klucza).
// GET /api/food?barcode=5900334001113   lub   GET /api/food?q=jogurt naturalny
const UA = 'TRENdowaci/1.0 (prywatna aplikacja ekipy treningowej)';
const FIELDS = 'code,product_name,product_name_pl,generic_name,brands,nutriments,serving_size,serving_quantity';

const num = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const r1 = (v) => Math.round(v * 10) / 10;

const normalize = (p) => {
  const n = p.nutriments || {};
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === null) {
    const kj = num(n.energy_100g);
    if (kj !== null) kcal = kj / 4.184;
  }
  const name = String(p.product_name_pl || p.product_name || p.generic_name || '').trim();
  if (kcal === null || !name) return null;
  const protein = num(n.proteins_100g) ?? 0;
  const fat = num(n.fat_100g) ?? 0;
  const carbs = num(n.carbohydrates_100g) ?? 0;
  // odrzucamy oczywiste błędy w bazie (więcej niż 100 g makro na 100 g albo >950 kcal)
  if (kcal < 0 || kcal > 950 || protein < 0 || fat < 0 || carbs < 0 || protein + fat + carbs > 110) return null;
  const sq = num(p.serving_quantity);
  return {
    code: String(p.code || ''),
    name: name.slice(0, 90),
    brand: String(p.brands || '').split(',')[0].trim().slice(0, 40),
    per100: { kcal: Math.round(kcal), protein: r1(protein), fat: r1(fat), carbs: r1(carbs) },
    servingG: sq && sq > 0 && sq < 2000 ? Math.round(sq) : null,
    servingLabel: String(p.serving_size || '').slice(0, 30)
  };
};

const getJson = async (url) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Dozwolona tylko metoda GET' });
  try {
    const barcode = String(req.query?.barcode || '').trim();
    const q = String(req.query?.q || '').trim();

    if (barcode) {
      if (!/^\d{8,14}$/.test(barcode)) return res.status(400).json({ error: 'Nieprawidłowy kod kreskowy' });
      const data = await getJson(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${FIELDS}`);
      const item = data && data.status === 1 && data.product ? normalize({ ...data.product, code: barcode }) : null;
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json({ items: item ? [item] : [] });
    }

    if (q.length >= 2 && q.length <= 60) {
      const base = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}&sort_by=unique_scans_n`;
      // najpierw produkty sprzedawane w Polsce, a jeśli jest ich mało – cała baza
      let list = [];
      const pl = await getJson(`${base}&tagtype_0=countries&tag_contains_0=contains&tag_0=poland`);
      list = (pl?.products || []).map(normalize).filter(Boolean);
      if (list.length < 4) {
        const all = await getJson(base);
        const more = (all?.products || []).map(normalize).filter(Boolean);
        const seen = new Set(list.map((x) => x.code));
        more.forEach((x) => { if (!seen.has(x.code)) list.push(x); });
      }
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(200).json({ items: list.slice(0, 12) });
    }

    return res.status(400).json({ error: 'Podaj barcode albo q (min. 2 znaki)' });
  } catch (err) {
    console.error('Błąd w /api/food:', err);
    return res.status(502).json({ error: 'Baza produktów nie odpowiada' });
  }
};
