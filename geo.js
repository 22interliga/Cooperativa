/* ============================================================
   CoopVia — geo.js
   Busca de endereço + KM, grátis, com PROVEDOR DUPLO:
     endereço → Photon (principal) → se falhar → Nominatim (reserva)
              → coordenadas → OSRM (rota) → KM
   Ambos OpenStreetMap. Em produção troque por servidores próprios
   em Geo.CFG (Docker).
   ============================================================ */
(function (g) {
  "use strict";

  const CFG = {
    photon: "https://photon.komoot.io/api/",
    nominatim: "https://nominatim.openstreetmap.org/search",
    osrm: "https://router.project-osrm.org/route/v1/driving",
    email: "contato@interliga.app.br",
    lang: "default",
    biasLat: -12.9,   // viés Bahia/Salvador
    biasLng: -38.4,
    delayMs: 350,
  };

  const CACHEKEY = "coopvia:v1:geocache";
  const cacheGet = () => { try { return JSON.parse(localStorage.getItem(CACHEKEY)) || {}; } catch (e) { return {}; } };
  const cacheSet = (c) => localStorage.setItem(CACHEKEY, JSON.stringify(c));
  const norm = (s) => String(s || "").trim().toLowerCase();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function fetchT(url, opts, ms = 10000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, Object.assign({ signal: ctrl.signal }, opts || {})); }
    finally { clearTimeout(t); }
  }

  function labelPhoton(p) {
    const cidade = p.city || p.town || p.village || p.municipality || p.county;
    const parts = [p.name, p.street && p.name !== p.street ? p.street : null, p.housenumber, cidade, p.state, p.country];
    const seen = new Set();
    return parts.filter((x) => x && !seen.has(x) && seen.add(x)).join(", ");
  }

  /* provedor 1: Photon */
  async function viaPhoton(q, limit) {
    const url = `${CFG.photon}?q=${encodeURIComponent(q)}&limit=${limit}` +
      `&lat=${CFG.biasLat}&lon=${CFG.biasLng}&location_bias_scale=0.4`;
    let res;
    try { res = await fetchT(url, { headers: { Accept: "application/json" } }, 8000); }
    catch (e) { throw new Error(e.name === "AbortError" ? "Photon: tempo esgotado" : "Photon: sem conexão"); }
    if (!res.ok) throw new Error("Photon: respondeu " + res.status);
    const data = await res.json();
    return (data.features || [])
      .filter((f) => f.geometry && f.geometry.coordinates)
      .map((f) => ({ label: labelPhoton(f.properties || {}), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }));
  }

  /* provedor 2: Nominatim (reserva) */
  async function viaNominatim(q, limit) {
    const url = `${CFG.nominatim}?format=json&limit=${limit}&countrycodes=br&addressdetails=1` +
      `&q=${encodeURIComponent(q)}&email=${encodeURIComponent(CFG.email)}`;
    let res;
    try { res = await fetchT(url, { headers: { Accept: "application/json" } }, 8000); }
    catch (e) { throw new Error(e.name === "AbortError" ? "Nominatim: tempo esgotado" : "Nominatim: sem conexão"); }
    if (!res.ok) throw new Error("Nominatim: respondeu " + res.status);
    const data = await res.json();
    return (data || []).map((d) => ({ label: d.display_name, lat: +d.lat, lng: +d.lon }));
  }

  /* busca com fallback: Photon → Nominatim. Lança só se AMBOS falharem. */
  async function buscar(q, limit) {
    const erros = [];
    try { const a = await viaPhoton(q, limit); if (a.length) return a; }
    catch (e) { erros.push(e.message); }
    try { const b = await viaNominatim(q, limit); if (b.length) return b; }
    catch (e) { erros.push(e.message); }
    if (erros.length) throw new Error(erros.join(" · "));
    return []; // ambos responderam, nenhum achou
  }

  async function suggest(query) {
    const q = String(query || "").trim();
    if (q.length < 3) return [];
    return await buscar(q, 5);
  }

  async function geocode(address) {
    const key = norm(address);
    if (!key) return null;
    const cache = cacheGet();
    if (cache[key]) return cache[key];
    const list = await buscar(address, 1);
    if (!list.length) return null;
    const pt = { lat: list[0].lat, lng: list[0].lng, label: list[0].label };
    cache[key] = pt; cacheSet(cache);
    return pt;
  }

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

  async function route(points) {
    const valid = points.filter(Boolean);
    if (valid.length < 2) return null;
    const coords = valid.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `${CFG.osrm}/${coords}?overview=false`;
    let res;
    try { res = await fetchT(url); }
    catch (e) { throw new Error(e.name === "AbortError" ? "tempo esgotado no cálculo da rota (OSRM)" : "sem conexão com o OSRM"); }
    if (!res.ok) throw new Error("OSRM respondeu " + res.status);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes || !data.routes.length) return null;
    const r = data.routes[0];
    return { km: r.distance / 1000, min: r.duration / 60, legs: (r.legs || []).map((l) => l.distance / 1000) };
  }

  async function calcularRota(enderecos) { return calcularRotaPts(enderecos); }

  async function calcularRotaPts(items) {
    const lista = items.map((it) => (typeof it === "string" ? it.trim() : it)).filter((x) => x && (typeof x !== "string" || x.length));
    if (lista.length < 2) return { erro: "Informe pelo menos origem e destino." };
    const labels = lista.map((it) => (typeof it === "string" ? it : (it.label || "ponto")));
    const pts = [];
    try {
      for (const it of lista) {
        if (it && typeof it === "object" && it.lat != null) { pts.push(it); }
        else { pts.push(await geocode(String(it))); await sleep(CFG.delayMs); }
      }
    } catch (e) { return { erro: e.message }; }
    const faltando = labels.filter((_, i) => !pts[i]);
    if (faltando.length) return { erro: "Endereço não localizado: " + faltando.join(" · ") };
    let r;
    try { r = await route(pts); } catch (e) { return { erro: e.message }; }
    if (!r) return { erro: "OSRM não retornou rota para estes pontos." };
    const trechos = r.legs.map((km, i) => ({ de: labels[i], para: labels[i + 1], km: Math.round(km * 10) / 10 }));
    return { km: Math.round(r.km * 10) / 10, min: Math.round(r.min), trechos, pts };
  }

  g.Geo = { suggest, geocode, geocodeMany, route, calcularRota, calcularRotaPts, buscar, CFG,
    limparCache: () => localStorage.removeItem(CACHEKEY) };
})(window);
