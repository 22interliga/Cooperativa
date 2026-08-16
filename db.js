/* ============================================================
   CoopVia — Gestão de Transporte Corporativo (Cooperativa)
   db.js  →  modelo de dados + seed + MOTOR DE CÁLCULO
   Stack: localStorage (demo) — pronto p/ Firebase Firestore
   ============================================================ */
(function (global) {
  "use strict";

  const NS = "coopvia:v1"; // prefixo isolado deste projeto no storage

  /* ---------- utilidades ---------- */
  const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9);
  const hoje = () => new Date().toISOString().slice(0, 10);
  const BRL = (n) =>
    (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (n) => Number(n) || 0;

  /* ---------- persistência ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(NS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function save(db) {
    localStorage.setItem(NS, JSON.stringify(db));
    return db;
  }

  /* ============================================================
     SEED — dados de demonstração
     ============================================================ */
  function seed() {
    const empA = uid("emp");
    const empB = uid("emp");

    const mot1 = uid("mot"); // TICIANA
    const mot2 = uid("mot"); // CARLOS
    const mot3 = uid("mot"); // JOSÉ

    const vec1 = uid("vec");
    const vec2 = uid("vec");
    const vec3 = uid("vec");

    // roteiros padronizados (doc 2, seção 5)
    const rt = (nome, origem, destino, kmPadrao, valor, modelo, extra = {}) => ({
      id: uid("rot"),
      codigo: extra.codigo,
      nome,
      empresaId: extra.empresaId || empA,
      origem,
      destino,
      pontos: extra.pontos || [],
      kmPadrao,
      // modelo de remuneração: 'fixo' | 'km' | 'fixo_km'
      modelo,
      valorFixo: valor,
      valorPorKm: extra.valorPorKm || 1.8,
      valorBase: extra.valorBase || 0,
      pedagioPadrao: extra.pedagioPadrao || 0,
      estacionamentoPadrao: 0,
      tempoPrevisto: extra.tempo || "",
      idaVolta: extra.idaVolta || false,
      status: "ativo",
      obs: "",
    });

    const rot1 = rt("ACELEN x CAIPE", "ACELEN", "CAIPE", 32, 42, "fixo", { codigo: "R001" });
    const rot2 = rt("ACELEN x CAIPE/M. DE DEUS", "ACELEN", "CAIPE / Madre de Deus", 48, 62, "fixo", { codigo: "R002" });
    const rot3 = rt("ACELEN x MADRE DE DEUS", "ACELEN", "Madre de Deus", 40, 55, "fixo", { codigo: "R003" });
    const rot4 = rt("ACELEN x SANTO ESTEVÃO", "ACELEN", "Santo Estevão", 55, 68, "fixo", { codigo: "R004" });
    const rot5 = rt("ACELEN x SÃO SEBASTIÃO", "ACELEN", "São Sebastião do Passé", 38, 0, "km", { codigo: "R005", valorPorKm: 1.8 });

    const f = (nome, cpf, emp, rua, dest, ent, sai, rota) => ({
      id: uid("fun"),
      nome, cpf, telefone: "(71) 9" + Math.floor(Math.random() * 9000 + 1000) + "-0000",
      empresaId: emp, matricula: String(Math.floor(Math.random() * 9000 + 1000)),
      setor: "Operação",
      endereco: rua, referencia: "", destino: dest,
      horaEntrada: ent, horaSaida: sai,
      dias: "Seg a Sex", tipo: "Ida e volta",
      rotaId: rota, status: "ativo",
    });

    const db = {
      _meta: { criadoEm: new Date().toISOString(), versao: 1 },

      usuarios: [
        { id: uid("usr"), nome: "Administração", login: "admin", senha: "123", papel: "admin" },
        { id: uid("usr"), nome: "Operador", login: "operador", senha: "123", papel: "operador" },
        { id: uid("usr"), nome: "Financeiro", login: "financeiro", senha: "123", papel: "financeiro" },
        { id: uid("usr"), nome: "RH ACELEN", login: "acelen", senha: "123", papel: "empresa", empresaId: empA },
        { id: uid("usr"), nome: "RH Braskem", login: "braskem", senha: "123", papel: "empresa", empresaId: empB },
        { id: uid("usr"), nome: "TICIANA", login: "ticiana", senha: "123", papel: "motorista", motoristaId: mot1 },
        { id: uid("usr"), nome: "CARLOS", login: "carlos", senha: "123", papel: "motorista", motoristaId: mot2 },
      ],

      empresas: [
        { id: empA, nome: "ACELEN", cnpj: "12.345.678/0001-90", contato: "RH ACELEN", telefone: "(71) 3000-0000", status: "ativo" },
        { id: empB, nome: "Braskem", cnpj: "98.765.432/0001-10", contato: "RH Braskem", telefone: "(71) 3111-1111", status: "ativo" },
      ],

      motoristas: [
        { id: mot1, nome: "TICIANA", cpf: "111.111.111-11", telefone: "(71) 99999-1111", cnh: "01234567890", categoria: "D", validadeCnh: "2028-05-10", veiculoId: vec1, status: "ativo", obs: "" },
        { id: mot2, nome: "CARLOS SILVA", cpf: "222.222.222-22", telefone: "(71) 99999-2222", cnh: "09876543210", categoria: "D", validadeCnh: "2027-11-20", veiculoId: vec2, status: "ativo", obs: "" },
        { id: mot3, nome: "JOSÉ SANTOS", cpf: "333.333.333-33", telefone: "(71) 99999-3333", cnh: "05555555555", categoria: "D", validadeCnh: "2026-09-01", veiculoId: vec3, status: "ativo", obs: "" },
      ],

      veiculos: [
        { id: vec1, marca: "Fiat", modelo: "Doblò", ano: 2021, placa: "ABC-1234", cor: "Branco", capacidade: 7, km: 125430, renavam: "00123456789", seguro: "2026-12-01", licenciamento: "2026-10-01", status: "disponivel", motoristaId: mot1, custoKm: 1.2 },
        { id: vec2, marca: "Renault", modelo: "Kangoo", ano: 2020, placa: "DEF-5678", cor: "Prata", capacidade: 7, km: 98800, renavam: "00987654321", seguro: "2026-08-25", licenciamento: "2026-11-15", status: "disponivel", motoristaId: mot2, custoKm: 1.15 },
        { id: vec3, marca: "Fiat", modelo: "Doblò", ano: 2019, placa: "GHI-9012", cor: "Branco", capacidade: 7, km: 210500, renavam: "00456789123", seguro: "2026-09-30", licenciamento: "2026-12-20", status: "disponivel", motoristaId: mot3, custoKm: 1.25 },
      ],

      roteiros: [rot1, rot2, rot3, rot4, rot5],

      funcionarios: [
        f("João da Silva", "444.444.444-44", empA, "Rua A, 100 — Candeias", "ACELEN", "07:00", "17:00", rot1.id),
        f("Maria Souza", "555.555.555-55", empA, "Rua B, 250 — Candeias", "ACELEN", "07:00", "17:00", rot1.id),
        f("Pedro Lima", "666.666.666-66", empA, "Rua C, 80 — Madre de Deus", "ACELEN", "07:00", "17:00", rot3.id),
        f("Ana Costa", "777.777.777-77", empA, "Rua D, 40 — Caipe", "ACELEN", "06:00", "16:00", rot2.id),
        f("Roberto Alves", "888.888.888-88", empB, "Rua E, 12 — Candeias", "Braskem", "08:00", "18:00", null),
      ],

      // solicitações da empresa (doc 1, seção 2)
      solicitacoes: [
        { id: uid("sol"), empresaId: empB, tipo: "Novo funcionário", descricao: "Incluir Roberto Alves na rota da manhã", data: hoje(), status: "pendente" },
      ],

      // contratos cooperativa ↔ empresa (o que a EMPRESA paga)
      contratos: [
        { id: uid("con"), empresaId: empA, numero: "CT-2026-001", modelo: "por_funcionario", valor: 320, dataInicio: "2026-01-01", dataFim: "2026-12-31", status: "ativo", obs: "" },
        { id: uid("con"), empresaId: empB, numero: "CT-2026-002", modelo: "mensal_fixo", valor: 18000, dataInicio: "2026-02-01", dataFim: "2026-12-31", status: "ativo", obs: "" },
      ],

      viagens: [], // boletins — preenchidos abaixo
      fechamentos: [],
      ocorrencias: [],
      auditoria: [],
    };

    // ---- alguns boletins já concluídos (p/ testar produção e fechamento) ----
    const mkViagem = (motoristaId, veiculoId, roteiro, data, extras = {}) => {
      const kmPrev = roteiro.kmPadrao;
      const corrida = valorCorrida(roteiro, kmPrev);
      const b = {
        id: uid("via"),
        boletim: gerarNumeroBoletim(db),
        data,
        empresaId: roteiro.empresaId,
        roteiroId: roteiro.id,
        roteiroNome: roteiro.nome,
        motoristaId, veiculoId,
        sentido: "ida_volta",
        origem: roteiro.origem, destino: roteiro.destino,
        horaSaida: extras.saida || "06:00", horaChegada: extras.chegada || "07:05",
        passageiros: extras.pax || 6,
        kmPrevisto: kmPrev,
        kmInicial: extras.kmi || null, kmFinal: extras.kmf || null,
        kmRealizado: extras.kmr != null ? extras.kmr : kmPrev,
        motivoDesvio: "",
        valorCorrida: corrida,
        pedagio: num(extras.pedagio), estacionamento: 0, hora: 0, outros: 0,
        total: corrida + num(extras.pedagio),
        embarques: [], status: "concluida",
      };
      db.viagens.push(b);
      return b;
    };

    mkViagem(mot1, vec1, rot1, "2026-02-05", { pax: 6 });
    mkViagem(mot1, vec1, rot2, "2026-02-06", { pax: 5, kmr: 48 });
    mkViagem(mot1, vec1, rot4, "2026-02-07", { pax: 7, kmr: 55, pedagio: 0 });
    mkViagem(mot2, vec2, rot3, "2026-02-06", { pax: 4 });

    // uma viagem programada p/ hoje (testar app do motorista)
    const prog = mkViagem(mot1, vec1, rot1, hoje(), { pax: 4 });
    prog.status = "programada";
    prog.total = 0; prog.valorCorrida = valorCorrida(rot1, rot1.kmPadrao);
    prog.embarques = db.funcionarios
      .filter((x) => x.rotaId === rot1.id)
      .map((x) => ({ funcionarioId: x.id, nome: x.nome, endereco: x.endereco, status: "aguardando" }));

    return save(db);
  }

  /* ============================================================
     MOTOR DE CÁLCULO
     ============================================================ */

  // nº único de boletim (6 dígitos, crescente)
  function gerarNumeroBoletim(db) {
    const base = 405800;
    const usados = (db.viagens || []).map((v) => num(v.boletim)).filter(Boolean);
    const max = usados.length ? Math.max(...usados) : base;
    return max + 1 + Math.floor(Math.random() * 3);
  }

  // KM da rota — hoje usa kmPadrão do roteiro / manual.
  // HOOK: substituir por Google Maps Distance Matrix (doc 2, seção 2 e 20).
  function calcularKmRota(roteiro, { idaVolta = false, kmManual = null } = {}) {
    let km = kmManual != null ? num(kmManual) : num(roteiro.kmPadrao);
    if (idaVolta || roteiro.idaVolta) km = km * 2;
    return km;
  }

  // valor da corrida — 3 modelos (doc 2, seção 6)
  function valorCorrida(roteiro, km) {
    const m = roteiro.modelo || "fixo";
    if (m === "km") return num(km) * num(roteiro.valorPorKm);
    if (m === "fixo_km") return num(roteiro.valorBase) + num(km) * num(roteiro.valorPorKm);
    return num(roteiro.valorFixo); // fixo
  }

  // total da viagem (doc 2, seção 8)
  function totalViagem(v) {
    return num(v.valorCorrida) + num(v.pedagio) + num(v.estacionamento) + num(v.hora) + num(v.outros);
  }

  // KM realizado a partir de inicial/final
  function kmRealizado(kmInicial, kmFinal) {
    const r = num(kmFinal) - num(kmInicial);
    return r > 0 ? r : 0;
  }

  // custo operacional e rentabilidade (doc 2, seções 17-18)
  function custoRota(veiculo, km) {
    return num(km) * num(veiculo && veiculo.custoKm);
  }
  function rentabilidade(receita, custo) {
    return num(receita) - num(custo);
  }

  /* ---------- FECHAMENTO por período (doc 2, seções 10-12) ---------- */
  function calcularFechamento(db, motoristaId, ini, fim, adiantamento = 0, descontos = 0) {
    const viagens = (db.viagens || []).filter(
      (v) =>
        v.motoristaId === motoristaId &&
        v.status === "concluida" &&
        v.data >= ini &&
        v.data <= fim
    );
    const totais = viagens.reduce(
      (a, v) => {
        a.kmTotal += num(v.kmRealizado || v.kmPrevisto);
        a.corridas += num(v.valorCorrida);
        a.pedagios += num(v.pedagio);
        a.estacionamentos += num(v.estacionamento);
        a.horas += num(v.hora);
        a.bruto += totalViagem(v);
        return a;
      },
      { kmTotal: 0, corridas: 0, pedagios: 0, estacionamentos: 0, horas: 0, bruto: 0 }
    );
    const liquido = totais.bruto - num(adiantamento) - num(descontos);
    return {
      motoristaId, ini, fim,
      qtd: viagens.length,
      ...totais,
      adiantamento: num(adiantamento),
      descontos: num(descontos),
      liquido,
      viagens,
    };
  }

  /* ---------- FATURAMENTO da EMPRESA (o que a empresa paga) ----------
     Usa os MESMOS boletins, mas números do lado da empresa —
     nunca a produção/valor do motorista (doc 1, seções 15-16). */
  const MODELOS_FATURA = {
    mensal_fixo: "Valor mensal fixo",
    por_funcionario: "Valor por funcionário",
    por_viagem: "Valor por viagem",
    por_km: "Valor por km",
    por_rota: "Valor por rota",
  };
  function contratoAtivo(db, empresaId) {
    return (db.contratos || []).find((c) => c.empresaId === empresaId && c.status === "ativo") || null;
  }
  function faturarEmpresa(db, empresaId, ini, fim, contrato) {
    contrato = contrato || contratoAtivo(db, empresaId);
    const viagens = (db.viagens || []).filter(
      (v) => v.empresaId === empresaId && v.status === "concluida" && v.data >= ini && v.data <= fim
    );
    const funcionarios = (db.funcionarios || []).filter((f) => f.empresaId === empresaId && f.status === "ativo").length;
    const rotas = (db.roteiros || []).filter((r) => r.empresaId === empresaId && r.status === "ativo").length;
    const kmTotal = viagens.reduce((a, v) => a + num(v.kmRealizado || v.kmPrevisto), 0);
    const taxa = num(contrato && contrato.valor);
    const modelo = contrato ? contrato.modelo : null;
    let qtd = 0, unidade = "";
    switch (modelo) {
      case "mensal_fixo": qtd = 1; unidade = "mês (fixo)"; break;
      case "por_funcionario": qtd = funcionarios; unidade = "funcionário ativo"; break;
      case "por_viagem": qtd = viagens.length; unidade = "viagem realizada"; break;
      case "por_km": qtd = kmTotal; unidade = "km rodado"; break;
      case "por_rota": qtd = rotas; unidade = "rota ativa"; break;
      default: qtd = 0; unidade = "sem contrato";
    }
    const total = modelo === "mensal_fixo" ? taxa : taxa * qtd;
    return { empresaId, ini, fim, contrato, modelo, modeloLabel: MODELOS_FATURA[modelo] || "—",
      taxa, qtd, unidade, total, funcionarios, rotas, kmTotal, qtdViagens: viagens.length, viagens };
  }

  /* ============================================================
     API pública
     ============================================================ */
  const DB = {
    NS,
    get() {
      const db = load();
      if (!db) return seed();
      // migração leve: garante coleções novas em dados antigos
      let changed = false;
      ["contratos", "fechamentos", "ocorrencias", "auditoria", "solicitacoes", "roteiros"].forEach((k) => {
        if (!Array.isArray(db[k])) { db[k] = []; changed = true; }
      });
      if (changed) save(db);
      return db;
    },
    save,
    reset() {
      localStorage.removeItem(NS);
      return seed();
    },
    log(db, acao, detalhe) {
      const u = Auth.current();
      db.auditoria.unshift({
        id: uid("aud"), usuario: u ? u.nome : "-", acao, detalhe,
        ts: new Date().toISOString(),
      });
      save(db);
    },
    // helpers de referência
    empresa: (db, id) => db.empresas.find((x) => x.id === id),
    motorista: (db, id) => db.motoristas.find((x) => x.id === id),
    veiculo: (db, id) => db.veiculos.find((x) => x.id === id),
    roteiro: (db, id) => db.roteiros.find((x) => x.id === id),
    // cálculos expostos
    gerarNumeroBoletim,
    calcularKmRota,
    valorCorrida,
    totalViagem,
    kmRealizado,
    custoRota,
    rentabilidade,
    calcularFechamento,
    faturarEmpresa,
    contratoAtivo,
    MODELOS_FATURA,
    uid, hoje, BRL, num,
  };

  /* ============================================================
     AUTENTICAÇÃO simples (localStorage de sessão)
     ============================================================ */
  const SKEY = NS + ":sessao";
  const Auth = {
    login(loginStr, senha) {
      const db = DB.get();
      const u = db.usuarios.find(
        (x) => x.login === String(loginStr).trim().toLowerCase() && x.senha === senha
      );
      if (!u) return null;
      sessionStorage.setItem(SKEY, JSON.stringify(u));
      return u;
    },
    current() {
      try {
        return JSON.parse(sessionStorage.getItem(SKEY));
      } catch (e) {
        return null;
      }
    },
    logout() {
      sessionStorage.removeItem(SKEY);
      location.href = "login.html";
    },
    // exige login e (opcional) papel específico
    require(papeis) {
      const u = Auth.current();
      if (!u) {
        location.href = "login.html";
        return null;
      }
      if (papeis && !papeis.includes(u.papel)) {
        location.href = Auth.home(u.papel);
        return null;
      }
      return u;
    },
    home(papel) {
      if (papel === "empresa") return "empresa.html";
      if (papel === "motorista") return "motorista.html";
      return "index.html"; // admin, operador, financeiro
    },
  };

  global.DB = DB;
  global.Auth = Auth;
})(window);
