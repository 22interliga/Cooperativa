/* ============================================================
   CoopVia — geo.js
   Cálculo de KM real e GRÁTIS:
     endereço → Nominatim (geocode) → coordenadas → OSRM (rota) → KM
   ------------------------------------------------------------
   ⚠ Servidores públicos são DEMO (limitados). Em produção troque
   os endpoints em Geo.CFG por um OSRM/Nominatim próprio (Docker)
   ou serviço pago. Política Nominatim: máx 1 requisição/segundo.
   ============================================================ */
(function (g) {
  "use strict";

  const CFG = {
    // troque estes por seus servidores próprios em produção
    nominatim: "https://nominatim.openstreetmap.org/search",
    osrm: "https://router.project-osrm.org/route/v1/driving",
    email: "contato@interliga.app.br", // identifica o app (política Nominatim)
    countrycodes: "br",
    delayMs: 1100, // respeita o limite de 1 req/s do Nominatim
  };

  const CACHEKEY = "coopvia:v1:geocache";
  const cacheGet = () => { try { return JSON.parse(localStorage.getItem(CACHEKEY)) || {}; } catch (e) { return {}; } };
  const cacheSet = (c) => localStorage.setItem(CACHEKEY, JSON.stringify(c));
  const norm = (s) => String(s || "").trim().toLowerCase();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* endereço → {lat,lng,label} | null  (com cache) */
  async function geocode(address) {
    const key = norm(address);
    if (!key) return null;
    const cache = cacheGet();
    if (cache[key]) return cache[key];
    const url = `${CFG.nominatim}?format=json&limit=1&countrycodes=${CFG.countrycodes}` +
      `&q=${encodeURIComponent(address)}&email=${encodeURIComponent(CFG.email)}`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!data || !data.length) return null;
      const pt = { lat: +data[0].lat, lng: +data[0].lon, label: data[0].display_name };
      cache[key] = pt; cacheSet(cache);
      return pt;
    } catch (e) { return null; }
  }

  /* vários endereços em sequência (respeitando 1 req/s; usa cache) */
  async function geocodeMany(addresses) {
    const out = [];
    for (const a of addresses) {
      const cache = cacheGet();
      const cached = cache[norm(a)];
      if (cached) { out.push(cached); continue; }
      out.push(await geocode(a));
      await sleep(CFG.delayMs);
    }
    return out;
  }

  /* coordenadas → distância OSRM. points:[{lat,lng}] → {km,legs[]} | null */
  async function route(points) {
    const valid = points.filter(Boolean);
    if (valid.length < 2) return null;
    const coords = valid.map((p) => `${p.lng},${p.lat}`).join(";"); // OSRM = lng,lat
    const url = `${CFG.osrm}/${coords}?overview=false`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes || !data.routes.length) return null;
      const r = data.routes[0];
      return {
        km: r.distance / 1000,
        min: r.duration / 60,
        legs: (r.legs || []).map((l) => l.distance / 1000),
      };
    } catch (e) { return null; }
  }

  /* pipeline completo: lista de endereços → {km, trechos:[{de,para,km}], min} | {erro} */
  async function calcularRota(enderecos) {
    const lista = enderecos.map((e) => String(e || "").trim()).filter(Boolean);
    if (lista.length < 2) return { erro: "Informe pelo menos origem e destino." };
    const pts = await geocodeMany(lista);
    const faltando = lista.filter((_, i) => !pts[i]);
    if (faltando.length) return { erro: "Endereço não localizado: " + faltando.join(" · "), pts };
    const r = await route(pts);
    if (!r) return { erro: "OSRM não retornou rota. Verifique conexão e tente de novo.", pts };
    const trechos = r.legs.map((km, i) => ({ de: lista[i], para: lista[i + 1], km: Math.round(km * 10) / 10 }));
    return { km: Math.round(r.km * 10) / 10, min: Math.round(r.min), trechos, pts };
  }

  g.Geo = { geocode, geocodeMany, route, calcularRota, CFG,
    limparCache: () => localStorage.removeItem(CACHEKEY) };
})(window);
