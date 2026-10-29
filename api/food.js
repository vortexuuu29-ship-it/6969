// Wyszukiwanie produktów spożywczych w Open Food Facts (darmowa, otwarta baza – bez klucza).
// GET /api/food?barcode=5901234123457   lub   GET /api/food?q=jogurt naturalny
// Odpowiedź: { items: [...], upstreamFailed: true|false }
// upstreamFailed = żaden z serwerów Open Food Facts nie odpowiedział (wtedy aplikacja próbuje bezpośrednio z przeglądarki).
const UA = 'TRENdowaci/1.0 (prywatna aplikacja ekipy treningowej)';

const OFF_FIELDS = 'code,product_name,product_name_pl,generic_name,brands,nutriments,serving_size,serving_quantity';

const offNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const offR1 = (v) => Math.round(v * 10) / 10;

// Ujednolicenie produktu z Open Food Facts (różne endpointy zwracają trochę inne pola).
// incomplete = produkt jest w bazie, ale bez wartości odżywczych.
const normalizeOff = (p) => {
  if (!p || typeof p !== 'object') return null;
  const n = p.nutriments || {};
  const pick = (...keys) => {
    for (const k of keys) {
      const v = offNum(n[k]);
      if (v !== null) return v;
    }
    return null;
  };
  const name = String(p.product_name_pl || p.product_name || p.generic_name || '').trim();
  if (!name) return null;
  const brandRaw = Array.isArray(p.brands) ? p.brands[0] : String(p.brands || '').split(',')[0];
  const sq = offNum(p.serving_quantity);
  const base = {
    code: String(p.code || p._id || ''),
    name: name.slice(0, 90),
    brand: String(brandRaw || '').trim().slice(0, 40),
    servingG: sq && sq > 0 && sq < 2000 ? Math.round(sq) : null,
    servingLabel: String(p.serving_size || '').slice(0, 30)
  };
  const protein = pick('proteins_100g', 'proteins');
  const fat = pick('fat_100g', 'fat');
  const carbs = pick('carbohydrates_100g', 'carbohydrates');
  let kcal = pick('energy-kcal_100g', 'energy-kcal');
  if (kcal === null) {
    const kj = pick('energy-kj_100g', 'energy_100g', 'energy-kj', 'energy');
    if (kj !== null) kcal = kj / 4.184;
  }
  if (kcal === null && (protein !== null || fat !== null || carbs !== null)) kcal = (protein || 0) * 4 + (fat || 0) * 9 + (carbs || 0) * 4;
  const empty = { ...base, incomplete: true, per100: { kcal: 0, protein: 0, fat: 0, carbs: 0 } };
  if (kcal === null) return empty;
  const P = protein || 0;
  const F = fat || 0;
  const C = carbs || 0;
  // oczywiste błędy w bazie (ponad 100 g makro na 100 g, >950 kcal) traktujemy jak brak danych
  if (kcal < 0 || kcal > 950 || P < 0 || F < 0 || C < 0 || P + F + C > 110) return empty;
  return { ...base, per100: { kcal: Math.round(kcal), protein: offR1(P), fat: offR1(F), carbs: offR1(C) } };
};

// pojedyncze zapytanie z limitem czasu; null = błąd sieci/serwera (inaczej niż pusty wynik)
const getJson = async (url, ms = 5000) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(t);
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Dozwolona tylko metoda GET' });
  try {
    const barcode = String((req.query && req.query.barcode) || '').trim();
    const q = String((req.query && req.query.q) || '').trim();

    if (barcode) {
      if (!/^\d{8,14}$/.test(barcode)) return res.status(400).json({ error: 'Nieprawidłowy kod kreskowy' });
      // dwa adresy równolegle – wygrywa pierwszy, który coś znajdzie
      const urls = [
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${OFF_FIELDS}`,
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      ];
      const results = await Promise.all(urls.map((u) => getJson(u, 6000)));
      const answered = results.filter(Boolean);
      const found = answered.map((d) => (d.status === 1 && d.product ? normalizeOff({ ...d.product, code: barcode }) : null)).find(Boolean);
      if (answered.length) res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json({ items: found ? [found] : [], upstreamFailed: answered.length === 0 });
    }

    if (q.length >= 2 && q.length <= 60) {
      const enc = encodeURIComponent(q);
      const legacy = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${enc}&search_simple=1&action=process&json=1&page_size=20&fields=${OFF_FIELDS}&sort_by=unique_scans_n&tagtype_0=countries&tag_contains_0=contains&tag_0=poland`;
      const legacyAll = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${enc}&search_simple=1&action=process&json=1&page_size=20&fields=${OFF_FIELDS}&sort_by=unique_scans_n`;
      const modern = `https://search.openfoodfacts.org/search?q=${enc}&page_size=20&langs=pl&fields=${OFF_FIELDS}`;
      // trzy źródła równolegle (najwolniejsze obcinamy po kilku sekundach, bo Vercel ma limit czasu funkcji)
      const [a, b, c] = await Promise.all([getJson(modern, 6000), getJson(legacy, 6500), getJson(legacyAll, 6500)]);
      const answered = [a, b, c].filter(Boolean);
      const seen = new Set();
      const items = [];
      [a?.hits, b?.products, c?.products].forEach((list) => {
        (list || []).forEach((p) => {
          const it = normalizeOff(p);
          if (!it || it.incomplete) return;
          const key = it.code || it.name;
          if (seen.has(key)) return;
          seen.add(key);
          items.push(it);
        });
      });
      if (answered.length) res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
      return res.status(200).json({ items: items.slice(0, 15), upstreamFailed: answered.length === 0 });
    }

    return res.status(400).json({ error: 'Podaj barcode albo q (min. 2 znaki)' });
  } catch (err) {
    console.error('Błąd w /api/food:', err);
    return res.status(200).json({ items: [], upstreamFailed: true });
  }
};
