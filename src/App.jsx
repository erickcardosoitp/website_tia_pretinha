import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

// Variantes de animação reutilizadas nas seções (scroll reveal)
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
// amount baixo (não 0.2+) porque containers com stagger (grids de cards) podem ser
// bem mais altos que a tela no mobile — com threshold alto o whileInView nunca dispara
const REVEAL_VIEWPORT = { once: true, amount: 0.05 };

// Carrossel do Acervo: quantas fotos ficam visíveis na pilha (efeito "álbum")
const PILHA_TAMANHO = 4;

/**
 * INSTITUTO TIA PRETINHA - VERSÃO ESTRATÉGICA ONG
 * Desenvolvedor: Erick Gonçalves Cardoso
 * Correções: Enquadramento de Imagens, Nomes de Arquivos e Seção de Projetos
 */

// 1. IMPORTAÇÃO DE IMAGENS DO ACERVO (organizado por categoria em src/acervo/<categoria>/)
const acervoModulos = import.meta.glob('./acervo/*/*.jpg', { eager: true });

const ACERVO_CATEGORIAS = [
  { id: 'futebol', label: 'Futebol' },
  { id: 'ceasa', label: 'CEASA' },
  { id: 'jantinha-ame', label: 'Jantinha AME' },
  { id: 'roupas', label: 'Doação de Roupas' },
  { id: 'acao-comunitaria', label: 'Ação Comunitária' },
  { id: 'maos-que-acolhem', label: 'Mãos Que Acolhem' },
];

const acervoPorCategoria = ACERVO_CATEGORIAS.reduce((acc, cat) => {
  acc[cat.id] = Object.entries(acervoModulos)
    .filter(([caminho]) => caminho.includes(`/acervo/${cat.id}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod]) => mod.default);
  return acc;
}, {});

// Fotos reais das turmas (src/acervo/mural_turma/<curso>.jpg) usadas nos cards de Projetos
const muralTurmaPorNome = Object.fromEntries(
  Object.entries(acervoModulos)
    .filter(([caminho]) => caminho.includes('/acervo/mural_turma/'))
    .map(([caminho, mod]) => [caminho.split('/').pop().replace(/\.jpg$/i, ''), mod.default])
);

// Logos de parceiros/associações e de licenças/ferramentas (src/acervo/parceiros/*)
const parceirosModulos = import.meta.glob('./acervo/parceiros/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true });
const logoPorNomeParceiro = Object.fromEntries(
  Object.entries(parceirosModulos)
    .map(([caminho, mod]) => [caminho.split('/').pop().replace(/\.(jpe?g|png)$/i, '').toLowerCase(), mod.default])
);

const PARCEIROS = [
  { nome: 'CEASA — Banco de Alimentos', logo: '/logo_ceasa.png' },
  { nome: 'Instituto de Direitos Humanos AME o Santo Amaro', logo: '/logo_ame.png' },
  { nome: 'Associação de Moradores da Congonha', logo: logoPorNomeParceiro['associacao congonha'] },
  { nome: 'Associação de Moradores de Vaz Lobo', logo: logoPorNomeParceiro['associacao vaz lobo'] },
  { nome: 'Projeto Gol Social', logo: logoPorNomeParceiro['gol social'] },
].filter(p => p.logo);

const LICENCAS = [
  { nome: 'Claude for Nonprofits', desc: 'Inteligência artificial usada no desenvolvimento e na manutenção deste site e em tarefas administrativas do dia a dia.', logo: logoPorNomeParceiro['claude'] },
  { nome: 'Microsoft', desc: 'Ferramentas de produtividade — Word, Excel, Teams — para gestão administrativa e comunicação da equipe.', logo: logoPorNomeParceiro['microsoft'] },
  { nome: 'Google Workspace', desc: 'E-mail institucional, Drive e planilhas colaborativas para organizar dados de alunos, financeiro e projetos.', logo: logoPorNomeParceiro['google'] || logoPorNomeParceiro['google workspace'] },
  { nome: 'Azure', desc: 'Infraestrutura de nuvem que sustenta os sistemas do Instituto.', logo: logoPorNomeParceiro['azure'] },
  { nome: 'Canva', desc: 'Criação de artes, banners e posts para as redes sociais e campanhas de divulgação.', logo: logoPorNomeParceiro['canva'] },
  { nome: 'Adobe', desc: 'Edição de fotos e vídeos usados no registro e na divulgação das atividades do Instituto.', logo: logoPorNomeParceiro['adobe'] },
];

// Foto de destaque na tela principal (src/acervo_hero/03.jpg)
const heroModulos = import.meta.glob('./acervo_hero/*.jpg', { eager: true });
const fotosHero = Object.entries(heroModulos)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => mod.default);
const fotoHero = fotosHero[0];

const API_BASE = 'https://api.itp.institutotiapretinha.org/api';

const LINK_APRESENTACAO = 'https://drive.google.com/file/d/1EXb3z0h_vGt2mDAJ__9CbDZBzRF8pEXu/view?usp=sharing';
const ULTIMO_MES_PUBLICADO = '2026-06'; // atualizar ao fechar cada mês

function fmt(valor) {
  return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MESES_NOME = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function SecaoPrestacaoContas() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [mesSelecionado, setMesSelecionado] = useState('2026-06');
  const [mesesDisponiveis, setMesesDisponiveis] = useState([]);

  useEffect(() => {
    const [ano, mes] = mesSelecionado.split('-');
    setCarregando(true);
    fetch(`${API_BASE}/publico/prestacao-contas?ano=${ano}&mes=${mes}`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(d => {
        setDados(d);
        setCarregando(false);
        if (d?.porMes) setMesesDisponiveis(d.porMes.filter(pm => pm.receitas > 0 || pm.despesas > 0));
      });
  }, [mesSelecionado]);

  const ehFuncionarios = (cat) => (cat ?? '').toLowerCase().includes('funcionari');

  const agrupar = (lista, keyFn, valFn) =>
    Object.values(lista.reduce((acc, item) => {
      const k = keyFn(item);
      acc[k] = acc[k] ?? { ...item, valor: 0 };
      acc[k].valor += Number(valFn(item) ?? 0);
      return acc;
    }, {})).sort((a, b) => b.valor - a.valor);

  // Entradas: só tipo "Entrada" (dinheiro real recebido)
  // tipo "Receita" = recuperação de adiantamento/folha = contábil interno, não entra no DRE público
  const receitas = agrupar(
    (dados?.movimentacoes ?? []).filter(m => m.tipo === 'Entrada'),
    m => m.categoria,
    m => m.valor
  );

  // Saídas detalhadas (sem funcionários), agrupadas por categoria
  const despesasDetalhe = agrupar(
    (dados?.movimentacoes ?? []).filter(m => m.tipo === 'Saída' && !ehFuncionarios(m.categoria)),
    m => m.categoria,
    m => m.valor
  );

  // Funcionários: consolidado único
  const totalFuncionarios = (dados?.movimentacoes ?? [])
    .filter(m => m.tipo === 'Saída' && ehFuncionarios(m.categoria))
    .reduce((s, m) => s + Number(m.valor ?? 0), 0);

  const despesas = [
    ...despesasDetalhe,
    ...(totalFuncionarios > 0 ? [{ descricao: 'Funcionários (consolidado)', categoria: 'Funcionários', valor: totalFuncionarios, tipo: 'Saída', data: null }] : []),
  ];

  const totalDoacoes = receitas.reduce((s, m) => s + Number(m.valor ?? 0), 0);
  const totalGasto = despesas.reduce((s, m) => s + Number(m.valor ?? 0), 0);
  const saldoDoacoes = totalDoacoes - totalGasto;

  const categoriaPub = (cat, tipo) => {
    const c = (cat ?? '').toLowerCase();
    if (tipo === 'Entrada') {
      if (c.includes('uniform')) return 'Venda de Uniformes';
      if (c.includes('evento')) return 'Eventos Beneficentes';
      return 'Doações';
    } else {
      if (c.includes('cozinha')) return 'Alimentação';
      if (c.includes('material') || c.includes('celia') || c.includes('célia')) return 'Material Escolar e Manutenção';
      if (c.includes('funcionari')) return 'Funcionários';
      if (c.includes('evento')) return 'Eventos';
      return 'Outros';
    }
  };

  const agruparPub = (lista, tipo) =>
    Object.entries(
      lista.filter(m => m.tipo === tipo).reduce((acc, m) => {
        const k = categoriaPub(m.categoria, tipo);
        acc[k] = (acc[k] ?? 0) + Number(m.valor ?? 0);
        return acc;
      }, {})
    )
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const entradasPub = agruparPub(dados?.movimentacoes ?? [], 'Entrada');
  const saidasPub   = agruparPub(dados?.movimentacoes ?? [], 'Saída');

  return (
    <section id="transparencia" className="py-24 bg-[#2D1B4D] px-4 md:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6"
          initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
        >
          <div>
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
              Prestação de<br /><span className="text-yellow-400">Contas</span>
            </h2>
            <p className="mt-4 text-purple-200/60 text-base uppercase font-black tracking-widest">
              Fechamento · {MESES_NOME[parseInt(mesSelecionado.split('-')[1], 10) - 1]} / {mesSelecionado.split('-')[0]}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={LINK_APRESENTACAO}
              target="_blank"
              rel="noreferrer"
              className="bg-yellow-400 text-purple-950 px-7 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-colors shadow-xl shadow-yellow-400/20 text-center"
            >
              Ver Apresentação Completa →
            </a>
          </div>
        </motion.div>

        {/* Filtro de meses */}
        {mesesDisponiveis.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {mesesDisponiveis.map(pm => {
                const [ano, mes] = pm.mes.split('-');
                const label = `${MESES_NOME[parseInt(mes, 10) - 1]}/${ano.slice(2)}`;
                const ativo = pm.mes === mesSelecionado;
                return (
                  <button
                    key={pm.mes}
                    onClick={() => setMesSelecionado(pm.mes)}
                    className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${ativo ? 'bg-yellow-400 text-purple-950' : 'bg-white/5 text-purple-200/60 hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        )}

        {carregando && (
          <div className="text-center py-20 text-purple-300/50 font-black tracking-widest uppercase">Carregando dados...</div>
        )}

        {!carregando && mesSelecionado > ULTIMO_MES_PUBLICADO && (
          <div className="text-center py-24">
            <p className="text-5xl md:text-7xl font-black uppercase italic text-yellow-400 mb-4">Em Breve</p>
            <p className="text-purple-200/50 font-black uppercase tracking-widest text-sm">Fechamento ainda não publicado</p>
          </div>
        )}

        {!carregando && dados && mesSelecionado <= ULTIMO_MES_PUBLICADO && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Alunos Ativos', valor: dados.resumo.alunosAtivos, unidade: 'alunos', cor: 'text-yellow-400' },
                { label: 'Cursos', valor: dados.resumo.cursosAtivos, unidade: 'ativos', cor: 'text-purple-300' },
                { label: 'Voluntários', valor: dados.resumo.voluntarios, unidade: 'pessoas', cor: 'text-blue-400' },
                { label: 'Saldo do Mês', valor: fmt(saldoDoacoes), unidade: '', cor: saldoDoacoes >= 0 ? 'text-green-400' : 'text-red-400' },
              ].map((k, i) => (
                <motion.div
                  key={i} className="bg-[#1F1235] rounded-[2rem] p-6 border border-white/5"
                  initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.08 }}
                >
                  <p className="text-purple-200/50 text-xs uppercase font-black tracking-widest mb-2">{k.label}</p>
                  <p className={`text-lg md:text-3xl font-black leading-tight break-all ${k.cor}`}>{k.valor}</p>
                  {k.unidade && <p className="text-purple-200/30 text-xs mt-1 uppercase font-bold">{k.unidade}</p>}
                </motion.div>
              ))}
            </div>

            {/* Custo por Beneficiário */}
            {dados.resumo.totalInvestido > 0 && (
              <div className="bg-[#1F1235] rounded-[2rem] border border-white/5 p-6 md:p-7 mb-10">
                <p className="text-purple-300/50 text-xs uppercase font-black tracking-widest mb-5">Custo por Beneficiário</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-purple-200/40 text-[9px] md:text-[10px] uppercase font-black tracking-tight md:tracking-widest mb-1 leading-tight">Total Investido</p>
                    <p className="text-base md:text-xl font-black text-red-400 break-all">{fmt(dados.resumo.totalInvestido)}</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-purple-200/40 text-[9px] md:text-[10px] uppercase font-black tracking-tight md:tracking-widest mb-1 leading-tight">Beneficiários</p>
                    <p className="text-base md:text-xl font-black text-blue-400">{dados.resumo.beneficiarios}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-200/40 text-[9px] md:text-[10px] uppercase font-black tracking-tight md:tracking-widest mb-1 leading-tight">Custo Médio</p>
                    <p className="text-base md:text-xl font-black text-purple-300 break-all">{fmt(dados.resumo.custoMedio)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Abas */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[['resumo', 'Resumo por Categoria'], ['extrato', 'Extrato Completo']].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setAbaAtiva(k)}
                  className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${abaAtiva === k ? 'bg-yellow-400 text-purple-950' : 'bg-white/5 text-purple-200/60 hover:bg-white/10'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Aba Resumo */}
            {abaAtiva === 'resumo' && (
              <div className="space-y-6">
                {/* Entradas */}
                <div className="bg-[#1F1235] rounded-[2rem] p-8 border border-white/5">
                  <h3 className="text-green-400 font-black uppercase tracking-widest text-sm mb-6">Entradas</h3>
                  {entradasPub.length === 0 && <p className="text-purple-300/40 text-sm">Nenhum dado</p>}
                  <div className="space-y-3">
                    {entradasPub.map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1 gap-2">
                          <span className="text-purple-100 font-bold truncate min-w-0">{c.categoria}</span>
                          <span className="text-green-400 font-black whitespace-nowrap flex-shrink-0">{fmt(c.valor)}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500/60 rounded-full" style={{ width: `${(c.valor / (totalDoacoes || 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patrocínios — estático */}
                <div className="bg-[#1F1235] rounded-[2rem] p-8 border border-yellow-400/20">
                  <h3 className="text-yellow-400 font-black uppercase tracking-widest text-sm mb-6">Patrocínios &amp; Parcerias</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4">
                      <img src="/logo_ceasa.png" alt="CEASA" className="h-12 w-auto object-contain flex-shrink-0" loading="lazy" />
                      <div>
                        <p className="text-white font-black text-sm">CEASA — Banco de Alimentos</p>
                        <p className="text-purple-300/60 text-xs mt-1">45 caixas de hortifruti</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4">
                      <img src="/logo_ame.png" alt="Instituto de Direitos Humanos AME o Santo Amaro" className="h-12 w-auto object-contain flex-shrink-0" loading="lazy" />
                      <div>
                        <p className="text-white font-black text-sm">Instituto de Direitos Humanos AME o Santo Amaro</p>
                        <p className="text-purple-300/60 text-xs mt-1">Semana de quentinhas</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Saídas */}
                <div className="bg-[#1F1235] rounded-[2rem] p-8 border border-white/5">
                  <h3 className="text-red-400 font-black uppercase tracking-widest text-sm mb-6">Saídas</h3>
                  {saidasPub.length === 0 && <p className="text-purple-300/40 text-sm">Nenhum dado</p>}
                  <div className="space-y-3">
                    {saidasPub.map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1 gap-2">
                          <span className="text-purple-100 font-bold truncate min-w-0">{c.categoria}</span>
                          <span className="text-red-400 font-black whitespace-nowrap flex-shrink-0">{fmt(c.valor)}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(c.valor / (totalGasto || 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consolidado final */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#1F1235] rounded-[2rem] p-6 border border-green-500/20 text-center">
                    <p className="text-green-400/70 text-xs uppercase font-black tracking-widest mb-2">Total Arrecadado</p>
                    <p className="text-2xl font-black text-green-400">{fmt(totalDoacoes)}</p>
                  </div>
                  <div className="bg-[#1F1235] rounded-[2rem] p-6 border border-red-500/20 text-center">
                    <p className="text-red-400/70 text-xs uppercase font-black tracking-widest mb-2">Total Gasto</p>
                    <p className="text-2xl font-black text-red-400">{fmt(totalGasto)}</p>
                  </div>
                  <div className={`bg-[#1F1235] rounded-[2rem] p-6 border ${saldoDoacoes >= 0 ? 'border-yellow-400/30' : 'border-red-500/20'} text-center`}>
                    <p className="text-yellow-400/70 text-xs uppercase font-black tracking-widest mb-2">Saldo do Mês</p>
                    <p className={`text-2xl font-black ${saldoDoacoes >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>{fmt(saldoDoacoes)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Aba Extrato */}
            {abaAtiva === 'extrato' && (() => {
              const linhasIndividuais = (dados.movimentacoes ?? [])
                .filter(m => m.tipo === 'Entrada' || (m.tipo === 'Saída' && !ehFuncionarios(m.categoria)))
                .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''));
              const linhaFuncionarios = totalFuncionarios > 0
                ? [{ data: null, descricao: 'Funcionários (consolidado)', categoria: 'Funcionários', tipo: 'Saída', valor: totalFuncionarios }]
                : [];
              const linhas = [...linhasIndividuais, ...linhaFuncionarios];

              function exportarCSV() {
                const mesLabel = `${MESES_NOME[parseInt(mesSelecionado.split('-')[1], 10) - 1]}-${mesSelecionado.split('-')[0]}`;
                const cabecalho = 'Data;Descrição;Categoria;Tipo;Valor';
                const rows = linhas.map(m => {
                  const catPub = categoriaPub(m.categoria, m.tipo);
                  const ehPessoal = m.tipo === 'Entrada' && catPub === 'Doações';
                  return [
                    m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
                    `"${ehPessoal ? 'Contribuição Voluntária' : (m.descricao ?? '').replace(/"/g, '""')}"`,
                    `"${ehPessoal ? 'Doações' : catPub}"`,
                    m.tipo === 'Entrada' ? 'Entrada' : 'Saída',
                    Number(m.valor ?? 0).toFixed(2).replace('.', ','),
                  ].join(';');
                });
                const csv = '﻿' + [cabecalho, ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `prestacao-contas-${mesLabel}.csv`; a.click();
                URL.revokeObjectURL(url);
              }

              return (
                <div className="bg-[#1F1235] rounded-[2rem] border border-white/5 overflow-hidden">
                  <div className="flex justify-end px-6 pt-5">
                    <button
                      onClick={exportarCSV}
                      className="bg-yellow-400 text-purple-950 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
                    >
                      Exportar Excel ↓
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-6 py-4 text-purple-300/50 font-black uppercase tracking-widest text-xs whitespace-nowrap">Data</th>
                          <th className="text-left px-6 py-4 text-purple-300/50 font-black uppercase tracking-widest text-xs">Doador / Descrição</th>
                          <th className="text-right px-6 py-4 text-purple-300/50 font-black uppercase tracking-widest text-xs">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map((m, i) => {
                          const isEntrada = m.tipo === 'Entrada';
                          return (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                              <td className="px-6 py-3 text-purple-200/60 font-mono text-xs whitespace-nowrap">
                                {m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                              </td>
                              <td className="px-6 py-3">
                                {(() => {
                                  const catPub = categoriaPub(m.categoria, m.tipo);
                                  const ehPessoal = m.tipo === 'Entrada' &&
                                    (catPub === 'Doações' || catPub === 'Contribuições da Diretoria');
                                  const nome = ehPessoal ? 'Contribuição Voluntária' : (m.descricao || '—');
                                  const detalhe = ehPessoal ? null : m.detalhes;
                                  return (
                                    <>
                                      <span className="text-purple-100 font-bold">{nome}</span>
                                      {detalhe && <span className="text-purple-400/60 font-normal"> | {detalhe}</span>}
                                    </>
                                  );
                                })()}
                              </td>
                              <td className={`px-6 py-3 font-black text-right whitespace-nowrap ${isEntrada ? 'text-green-400' : 'text-red-400'}`}>
                                {isEntrada ? '+' : '-'}{fmt(m.valor)}
                              </td>
                            </tr>
                          );
                        })}
                        {linhas.length === 0 && (
                          <tr><td colSpan={3} className="px-6 py-10 text-center text-purple-300/40">Nenhuma movimentação registrada</td></tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-yellow-400/20 bg-yellow-400/5">
                          <td colSpan={2} className="px-6 py-4 font-black uppercase text-yellow-400 text-xs tracking-widest">Saldo do Período</td>
                          <td className={`px-6 py-4 font-black text-right text-lg ${saldoDoacoes >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {fmt(saldoDoacoes)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {!carregando && !dados && (
          <div className="text-center py-20">
            <p className="text-purple-300/40 font-black uppercase tracking-widest">Dados indisponíveis no momento</p>
          </div>
        )}

      </div>
    </section>
  );
}

function SecaoSuporte() {
  const [tab, setTab] = useState('abrir');
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', nome_aluno: '', assunto: '', mensagem: '' });
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState(null);
  const [erroAbrir, setErroAbrir] = useState('');
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState(null);
  const [erroBusca, setErroBusca] = useState('');

  const statusConfig = {
    aberto:       { label: 'Aberto',        cor: 'bg-yellow-400 text-yellow-900' },
    em_andamento: { label: 'Em andamento',  cor: 'bg-blue-500 text-white' },
    resolvido:    { label: 'Resolvido',     cor: 'bg-green-500 text-white' },
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErroAbrir('');
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/chamados/publico`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao enviar');
      setProtocolo(data.protocolo);
      setForm({ nome: '', email: '', telefone: '', nome_aluno: '', assunto: '', mensagem: '' });
    } catch (err) {
      setErroAbrir(err.message === 'Failed to fetch' ? 'Erro de conexão. Verifique sua internet e tente novamente.' : err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function handleBuscar(e) {
    e.preventDefault();
    setErroBusca('');
    setResultados(null);
    setBuscando(true);
    try {
      const res = await fetch(`${API_BASE}/chamados/publico/consultar?q=${encodeURIComponent(busca)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao buscar');
      setResultados(data.resultados);
    } catch (err) {
      setErroBusca(err.message === 'Failed to fetch' ? 'Erro de conexão. Verifique sua internet e tente novamente.' : err.message);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <section
      id="suporte" className="py-16 md:py-32 bg-[#1a0a35] text-white px-4 md:px-8"
    >
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
        >
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-center mb-4">SUPORTE E <span className="text-yellow-400">ATENDIMENTO</span></h2>
          <p className="text-purple-300 text-center mb-10">Abra um chamado ou consulte o status de um atendimento.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[['abrir','Abrir Chamado'],['consultar','Consultar Chamado']].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setProtocolo(null); setResultados(null); setErroAbrir(''); setErroBusca(''); }}
              className={`flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${tab === id ? 'bg-yellow-400 text-purple-950' : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab Abrir Chamado */}
        {tab === 'abrir' && (
          protocolo ? (
            <div className="bg-green-500/20 border border-green-400 rounded-2xl p-8 text-center">
              <p className="text-2xl font-black text-green-400 mb-2">Chamado aberto!</p>
              <p className="text-lg font-mono font-black text-white mb-3">{protocolo}</p>
              <p className="text-purple-300 text-sm">Guarde este protocolo para consultas. Nossa equipe entrará em contato pelo WhatsApp.</p>
              <button onClick={() => setProtocolo(null)} className="mt-6 bg-yellow-400 text-purple-950 px-8 py-3 rounded-xl font-black text-sm uppercase">Abrir novo chamado</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {[
                { key: 'nome', label: 'Nome completo', type: 'text', required: true },
                { key: 'email', label: 'E-mail', type: 'email', required: true },
                { key: 'telefone', label: 'Telefone / WhatsApp', type: 'tel', required: true },
                { key: 'nome_aluno', label: 'Nome do aluno (se aplicável)', type: 'text', required: false },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-sm text-purple-300 mb-1">{label}{required && <span className="text-yellow-400">*</span>}</label>
                  <input type={type} required={required} value={form[key]} onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
                    className="w-full bg-purple-900/50 border border-purple-700 rounded-xl px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-yellow-400" />
                </div>
              ))}
              <div>
                <label className="block text-sm text-purple-300 mb-1">Assunto<span className="text-yellow-400">*</span></label>
                <select required value={form.assunto} onChange={e => setForm(p => ({...p, assunto: e.target.value}))}
                  className="w-full bg-purple-900/50 border border-purple-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400">
                  <option value="">Selecione...</option>
                  {['Matrícula','Financeiro','Acadêmico','Dúvida Geral','Suporte','Outro'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-purple-300 mb-1">Mensagem<span className="text-yellow-400">*</span></label>
                <textarea required rows={4} value={form.mensagem} onChange={e => setForm(p => ({...p, mensagem: e.target.value}))}
                  className="w-full bg-purple-900/50 border border-purple-700 rounded-xl px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-yellow-400 resize-none" />
              </div>
              <p className="text-xs text-purple-400">📎 Caso precise enviar documentos, nossa equipe solicitará via WhatsApp após o contato.</p>
              {erroAbrir && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{erroAbrir}</p>}
              <button type="submit" disabled={enviando}
                className="bg-yellow-400 text-purple-950 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {enviando ? 'Enviando...' : 'Enviar chamado'}
              </button>
            </form>
          )
        )}

        {/* Tab Consultar Chamado */}
        {tab === 'consultar' && (
          <div className="flex flex-col gap-6">
            <form onSubmit={handleBuscar} className="flex gap-3">
              <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Protocolo (ITP-XXXXXX-XXX) ou seu nome"
                className="flex-1 bg-purple-900/50 border border-purple-700 rounded-xl px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-yellow-400" />
              <button type="submit" disabled={buscando || busca.trim().length < 3}
                className="bg-yellow-400 text-purple-950 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">
                {buscando ? '...' : 'Buscar'}
              </button>
            </form>
            {erroBusca && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{erroBusca}</p>}
            {resultados !== null && resultados.length === 0 && (
              <p className="text-purple-300 text-center py-6">Nenhum chamado encontrado. Verifique o protocolo ou entre em contato pelo WhatsApp.</p>
            )}
            {resultados?.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-purple-700">
                <table className="w-full text-sm">
                  <thead className="bg-purple-900/80">
                    <tr>
                      {['Protocolo','Assunto','Tipo','Status','Aberto em','Atualizado em'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-purple-300 font-black text-xs uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r, i) => {
                      const sc = statusConfig[r.status] ?? { label: r.status, cor: 'bg-purple-600 text-white' };
                      return (
                        <tr key={r.protocolo} className={i % 2 === 0 ? 'bg-purple-900/20' : 'bg-purple-900/40'}>
                          <td className="px-4 py-3 font-mono font-black text-yellow-400 whitespace-nowrap">{r.protocolo}</td>
                          <td className="px-4 py-3 text-white">{r.titulo}</td>
                          <td className="px-4 py-3 text-purple-300">{r.tipo}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-black px-2 py-1 rounded-full uppercase ${sc.cor}`}>{sc.label}</span></td>
                          <td className="px-4 py-3 text-purple-300 whitespace-nowrap">{new Date(r.criado_em).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3 text-purple-300 whitespace-nowrap">{new Date(r.atualizado_em).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState('inicio');
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  const [fotoAtual, setFotoAtual] = useState(0);
  const [categoriaAcervo, setCategoriaAcervo] = useState(ACERVO_CATEGORIAS[0].id);
  const [showPixToast, setShowPixToast] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);


  // --- LÓGICA DO ACERVO ---
  const fotosAcervo = acervoPorCategoria[categoriaAcervo] || [];
  const selecionarCategoriaAcervo = (id) => {
    setCategoriaAcervo(id);
    setFotoAtual(0);
  };
  const proximaFoto = () => setFotoAtual((prev) => (prev + 1) % fotosAcervo.length);
  const fotoAnterior = () => setFotoAtual((prev) => (prev - 1 + fotosAcervo.length) % fotosAcervo.length);
  const arrastarFoto = (_e, info) => {
    const threshold = 80;
    if (info.offset.x < -threshold) proximaFoto();
    else if (info.offset.x > threshold) fotoAnterior();
  };

  // --- TÍTULO DA PÁGINA ---
  useEffect(() => {
    const nomesSessoes = {
      'inicio': 'Início', 'sobre-nos': 'Sobre Nós', 'projetos': 'Projetos',
      'maos-que-acolhem': 'Mãos Que Acolhem', 'acervo': 'Acervo', 'transparencia': 'Transparência', 'suporte': 'Suporte', 'matricule-se': 'Matricule-se', 'como-ajudar': 'Ajuda', 'parceiros': 'Parceiros', 'contato': 'Contato'
    };
    document.title = `Instituto Tia Pretinha | ${nomesSessoes[activeSection] || 'Bem-vindo'}`;
  }, [activeSection]);

  // --- DETECÇÃO DE SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['inicio', 'sobre-nos', 'projetos', 'maos-que-acolhem', 'acervo', 'transparencia', 'suporte', 'matricule-se', 'como-ajudar', 'parceiros', 'contato'];
      const scrollPosition = window.scrollY + 250;
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && scrollPosition >= element.offsetTop && scrollPosition < element.offsetTop + element.offsetHeight) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const copiarChavePix = () => {
    navigator.clipboard.writeText("21965540576");
    setShowPixToast(true);
    setTimeout(() => setShowPixToast(false), 3000);
  }

  // --- LISTA DE PROJETOS COM NOMES DE ARQUIVOS CORRIGIDOS ---
  const projetos = [
    {
      id: 1,
      titulo: "Informática",
      prof: "Erick",
      desc: "Aulas práticas de computador e internet para o dia a dia e o mercado de trabalho.",
      detalhe: "Do básico — ligar o computador, digitação, navegação segura na internet e e-mail — até ferramentas de produtividade como editores de texto e planilhas. O objetivo é reduzir a exclusão digital e abrir portas para oportunidades de trabalho e estudo.",
      img: muralTurmaPorNome.informatica || "/pretina_ti.jpeg"
    },
    {
      id: 2,
      titulo: "Ballet Clássico",
      prof: "Ellen",
      desc: "Postura, disciplina e expressão corporal através da dança clássica.",
      detalhe: "As aulas trabalham alongamento, coordenação motora e musicalidade, além de fortalecer autoestima e disciplina. Encerramentos e apresentações valorizam o esforço de cada aluna na frente da comunidade.",
      img: muralTurmaPorNome.ballet || "/pretinha_ballet.jpeg"
    },
    {
      id: 3,
      titulo: "Jiu-Jitsu",
      prof: "Tico",
      desc: "Defesa pessoal, respeito e disciplina no tatame.",
      detalhe: "Além das técnicas de defesa pessoal, a modalidade ensina hierarquia, respeito ao próximo e controle emocional — valores que os alunos levam para fora do tatame.",
      img: muralTurmaPorNome['jiu-jitsu'] || "/pretinha_jiujtsu.jpeg"
    },
    {
      id: 4,
      titulo: "Capoeira",
      prof: "Anderson",
      desc: "Ginga, música e ancestralidade afro-brasileira em roda.",
      detalhe: "A capoeira une luta, dança e música numa só expressão. As crianças aprendem os toques do berimbau, as cantigas e a história da resistência negra brasileira, enquanto desenvolvem força, flexibilidade e ritmo.",
      img: "/pretinha_capoeira.jpeg"
    },
    {
      id: 5,
      titulo: "Futebol",
      prof: "João Paulo",
      desc: "Integração social e trabalho em equipe através do esporte.",
      detalhe: "Aulas gratuitas de futebol e futsal, com foco em disciplina, trabalho em equipe e integração social — o esporte como ferramenta de transformação, dentro e fora de campo.",
      img: acervoPorCategoria.futebol?.[14] || "/pretinha_fut.jpeg"
    },
    {
      id: 6,
      titulo: "Reforço Escolar",
      prof: "Érica",
      desc: "Apoio em Português e Matemática para fortalecer o desempenho escolar.",
      detalhe: "Atendimento em grupo focado na dificuldade de cada aluno, com acompanhamento pedagógico que reforça o conteúdo visto na escola e ajuda a recuperar o que ficou pra trás.",
      img: muralTurmaPorNome.reforco || "/pretinha_prevest.jpeg"
    },
    {
      id: 7,
      titulo: "Música",
      prof: "A confirmar",
      desc: "Teoria musical, ritmo e melodia — os primeiros passos de quem quer aprender música.",
      detalhe: "As aulas trazem noções de harmonia, melodia e ritmo, incluindo o estudo das notas musicais, preparando o caminho para quem quer seguir tocando um instrumento ou cantando.",
      img: muralTurmaPorNome.musica
    },
    {
      id: 8,
      titulo: "Pré-Vestibular",
      prof: "Equipe de Professores",
      desc: "Preparação para o Enem e vestibulares, com aulas de reforço para jovens e adultos.",
      detalhe: "Turma voltada para quem está se preparando para o Enem e vestibulares, com aulas de reforço nas principais disciplinas cobradas nas provas, incluindo língua inglesa.",
      img: muralTurmaPorNome['pre-vest']
    }
  ];

  return (
<div className="min-h-[100dvh] w-full bg-[#2D1B4D] text-white font-sans selection:bg-yellow-400 selection:text-purple-900 scroll-smooth overflow-x-hidden flex flex-col">      

{/* BOTÃO FLUTUANTE - MARKETPLACE */}
<a
  href="/marketplace"
  className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[200] w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-110 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] active:scale-95 transition-all duration-300 group"
  title="Marketplace Instituto Tia Pretinha"
>
  {/* Ícone de carrinho SVG - preto */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-7 h-7 text-purple-950 group-hover:scale-110 transition-transform duration-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>

  {/* Pulsação sutil de fundo */}
  <span className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
</a>

      {/* TOAST PIX */}
      <div className={`fixed bottom-24 right-4 md:bottom-10 md:right-10 z-[300] transition-all duration-500 transform ${showPixToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-yellow-400 text-purple-950 px-5 py-3 md:px-8 md:py-4 rounded-2xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3">
          <span className="text-2xl">💜</span>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-widest opacity-70">Sucesso</span>
            <span className="uppercase italic">Chave PIX Copiada!</span>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-[100] bg-[#1F1235]/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <img
            src="/png_instituto.jpg"
            alt="Logo"
            className="h-10 md:h-16 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          />

          <div className="hidden lg:flex items-center gap-5 py-2">
            {['inicio', 'sobre-nos', 'projetos', 'maos-que-acolhem', 'acervo', 'transparencia', 'suporte', 'matricule-se', 'como-ajudar', 'parceiros', 'contato'].map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className={`text-[10px] font-black uppercase tracking-widest relative py-2 whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeSection === item ? 'text-yellow-400' : 'text-purple-200 hover:text-white'
                }`}
              >
                {item === 'transparencia' ? 'Transparência' : item === 'matricule-se' ? 'Matricule-se' : item === 'maos-que-acolhem' ? 'Mãos Que Acolhem' : item.replace('-', ' ')}
                {activeSection === item && (
                  <motion.span layoutId="nav-underline" className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={copiarChavePix} className="bg-yellow-400 text-purple-950 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
              PIX
            </motion.button>
            <button
              onClick={() => setMenuAberto(v => !v)}
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              className="lg:hidden flex flex-col justify-center items-center gap-[5px] w-10 h-10 flex-shrink-0"
            >
              <span className={`block w-6 h-0.5 bg-white rounded-full transition-all ${menuAberto ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-white rounded-full transition-all ${menuAberto ? 'opacity-0' : ''}`}></span>
              <span className={`block w-6 h-0.5 bg-white rounded-full transition-all ${menuAberto ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuAberto && (
            <motion.div
              className="lg:hidden overflow-hidden max-w-7xl mx-auto"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="mt-4 pb-2 flex flex-col gap-1">
                {['inicio', 'sobre-nos', 'projetos', 'maos-que-acolhem', 'acervo', 'transparencia', 'suporte', 'matricule-se', 'como-ajudar', 'parceiros', 'contato'].map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    onClick={() => setMenuAberto(false)}
                    className={`text-sm font-black uppercase tracking-widest py-3 px-2 rounded-lg transition-colors ${
                      activeSection === item ? 'text-yellow-400 bg-white/5' : 'text-purple-200 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item === 'transparencia' ? 'Transparência' : item === 'matricule-se' ? 'Matricule-se' : item === 'maos-que-acolhem' ? 'Mãos Que Acolhem' : item.replace('-', ' ')}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <header id="inicio" className="relative min-h-screen flex items-center justify-center pt-20 px-4 md:px-8 text-center overflow-hidden">
        {fotoHero && (
          <div className="absolute inset-0 z-0 bg-[#1F1235] overflow-hidden">
            <motion.img
              src={fotoHero}
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: 8, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-cover object-[50%_42%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B4D]/55 via-[#2D1B4D]/40 to-[#2D1B4D]/75"></div>
          </div>
        )}
        <motion.div
          className="max-w-5xl z-10"
          initial="hidden" animate="visible" variants={staggerContainer}
        >
          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-9xl font-black leading-none mb-8 uppercase tracking-tighter italic">Instituto <br/><span className="text-yellow-400">Tia Pretinha</span></motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-2xl text-purple-100 max-w-4xl mx-auto font-light mb-12 italic">"Transformando vidas com afeto e ação."</motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="#matricule-se" className="bg-yellow-400 text-purple-900 px-8 sm:px-12 py-5 rounded-2xl font-black text-base md:text-lg shadow-xl shadow-yellow-400/10">MATRICULE-SE</motion.a>
            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="#projetos" className="bg-purple-600/30 border-2 border-white/20 px-8 sm:px-12 py-5 rounded-2xl font-black text-base md:text-lg">PROJETOS</motion.a>
          </motion.div>
        </motion.div>
      </header>

      {/* SOBRE NÓS */}
<section id="sobre-nos" className="py-20 md:py-40 bg-[#1F1235] px-4 md:px-8">
  <div className="max-w-7xl mx-auto">
    {/* Título da Seção */}
    <motion.div
      className="text-center mb-20"
      initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
    >
      <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase italic tracking-tighter">SOBRE NÓS</h2>
      <p className="text-2xl md:text-4xl text-yellow-400 font-medium leading-tight italic max-w-5xl mx-auto">
        "Aqui também é possível vencer."
      </p>
      <div className="h-2 w-24 bg-purple-500 mx-auto mt-8 rounded-full opacity-30"></div>
    </motion.div>

    {/* Bloco Biográfico: Tia Pretinha */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

      {/* Imagem com Moldura Estilizada */}
      <motion.div
        className="relative"
        initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeLeft}
      >
        <div className="absolute -inset-4 border-2 border-yellow-400/30 rounded-[3rem] rotate-3 -z-10"></div>
        <div className="overflow-hidden rounded-[3rem] shadow-2xl border-4 border-white/10 aspect-[4/5] lg:aspect-auto">
          <img
            src="/tiacelia.jpg"
            alt="Célia da Silva Paixão - Tia Pretinha"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        </div>
        <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-purple-950 p-8 rounded-3xl shadow-xl hidden md:block">
          <p className="font-black text-2xl uppercase italic leading-none">Célia da Silva Paixão</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 opacity-80">Fundadora & Nutricionista</p>
        </div>
      </motion.div>

      {/* Conteúdo de Texto */}
      <motion.div
        className="text-left"
        initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeRight}
      >
        <h3 className="text-3xl md:text-5xl font-black text-yellow-400 mb-8 uppercase italic leading-none">
          <span className="text-white">Tia Pretinha</span>
        </h3>
        
        <div className="space-y-6 text-purple-100/90 text-lg leading-relaxed">
          <p className="font-bold text-xl text-white italic">
            Sou mulher periférica, mãe, líder comunitária, empreendedora social e nutricionista.
          </p>
          
          <p>
            Minha trajetória não nasceu do privilégio — nasceu da luta, da escassez, da dor e, principalmente, da fé e da coragem de não desistir. Cresci vendo de perto a desigualdade e o abandono do poder público, realidades que vivi na pele, morando em fundo de quintal e enfrentando portas fechadas.
          </p>

          <p>
            Antes mesmo de fundar o Instituto, eu já ajudava moradores, orientava famílias e lutava por dignidade. Sempre entendi que liderança não é cargo — é serviço. Voltei a estudar já adulta, me formei em Nutrição e transformei minha caminhada em ferramenta de transformação coletiva.
          </p>

          <p className="bg-white/5 p-6 rounded-2xl border-l-4 border-yellow-400 italic">
            "Não trabalho por status. Trabalho por vidas. Minha missão é cuidar de pessoas e provar que da periferia também nascem líderes e futuros possíveis."
          </p>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 text-2xl">⚡</span>
              <span className="font-black uppercase text-sm tracking-widest">Resistência</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 text-2xl">💜</span>
              <span className="font-black uppercase text-sm tracking-widest">Afeto em Ação</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Manifesto Final */}
    <motion.div
      className="mt-24 text-center"
      initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
    >
       <p className="text-xl md:text-2xl font-light italic text-purple-200">
         "Sou prova viva de que quando Deus planta um propósito, <br className="hidden md:block"/>
         nenhuma dificuldade consegue arrancar."
       </p>
    </motion.div>
  </div>
</section>

      {/* PROJETOS - APENAS ESTA SEÇÃO */}
<section id="projetos" className="py-20 md:py-40 px-4 md:px-8 bg-[#1F1235]">
  <div className="max-w-7xl mx-auto">
    <motion.h2
      className="text-5xl font-black mb-20 text-center uppercase italic"
      initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
    >
      PROJETOS
    </motion.h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {projetos.map((p, idx) => (
        <motion.div
          key={p.id}
          className="bg-[#2D1B4D] rounded-[2.5rem] overflow-hidden flex flex-col group shadow-2xl"
          initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
          transition={{ duration: 0.7, ease: 'easeOut', delay: (idx % 4) * 0.08 }}
          whileHover={{ y: -8 }}
        >
          {/* FOTO: Ajustada para h-64 e zoom suave */}
          <div className="h-64 overflow-hidden bg-purple-900/20">
            <img
              src={p.img}
              alt={p.titulo}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
          </div>

          <div className="p-8 flex flex-col flex-grow">
            <h3 className="text-2xl font-black text-yellow-400 uppercase leading-none mb-2">
              {p.titulo}
            </h3>
            <p className="text-[10px] font-black text-purple-400 mb-4 uppercase">
              {['EM BREVE!', 'A confirmar', 'Equipe de Professores'].includes(p.prof) ? p.prof : `Prof. ${p.prof}`}
            </p>
            <p className="text-sm text-purple-100/70 mb-8 leading-relaxed">
              {p.desc}
            </p>
            <button 
              onClick={() => setProjetoSelecionado(p)} 
              className="mt-auto bg-purple-700/30 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-purple-900 transition-all shadow-lg active:scale-95"
            >
              Ver Detalhes
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>

      {/* MÃOS QUE ACOLHEM */}
      <section id="maos-que-acolhem" className="py-20 md:py-40 bg-[#2D1B4D] px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
          >
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
              Mãos Que <span className="text-yellow-400">Acolhem</span>
            </h2>
            <p className="mt-6 text-purple-200/70 text-lg max-w-3xl mx-auto">
              Acolhimento, orientação e apoio às famílias de pessoas privadas de liberdade no sistema prisional do Rio de Janeiro — em colaboração com a Secretaria de Estado de Administração Penitenciária (SEAP/RJ), sem vínculo institucional entre as partes.
            </p>
          </motion.div>

          {/* Fotos + Justificativa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              className="grid grid-cols-3 gap-3"
              initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeLeft}
            >
              {(acervoPorCategoria['maos-que-acolhem'] || []).map((src, i) => (
                <div key={i} className={`overflow-hidden rounded-[1.5rem] border-2 border-white/10 shadow-xl ${i === 0 ? 'col-span-3 aspect-[16/9]' : 'aspect-square'}`}>
                  <img src={src} alt={`Mãos Que Acolhem ${i + 1}`} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeRight}
            >
              <h3 className="text-2xl md:text-3xl font-black text-yellow-400 uppercase italic mb-4">Por que existe</h3>
              <p className="text-purple-100/90 leading-relaxed mb-4">
                O encarceramento não afeta só quem está preso — atinge famílias inteiras, que enfrentam desinformação, fragilidade emocional e ruptura de vínculos sociais. A falta de acolhimento humanizado agrava tensões no ambiente prisional e distancia as famílias da administração penitenciária.
              </p>
              <p className="text-purple-100/90 leading-relaxed">
                Reconhecendo a família como peça-chave da ressocialização, o Instituto Tia Pretinha atua como ponte de apoio nesse processo — de forma complementar, humanizada e respeitando integralmente as normas de segurança das unidades.
              </p>
            </motion.div>
          </div>

          {/* Objetivos específicos */}
          <motion.div
            className="mb-16"
            initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
          >
            <h3 className="text-yellow-400 font-black uppercase tracking-widest text-sm mb-8 text-center">O que fazemos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { t: 'Recepção Humanizada', d: 'Acolhimento presencial das famílias em dias de visita.' },
                { t: 'Orientação', d: 'Apoio para entender rotinas e procedimentos prisionais.' },
                { t: 'Canal de Apoio', d: 'Mediação complementar entre famílias e a administração penitenciária.' },
                { t: 'Voluntariado', d: 'Voluntários capacitados e supervisionados em campo.' },
              ].map((item, idx) => (
                <motion.div
                  key={item.t}
                  className="bg-[#1F1235] rounded-[2rem] p-6 border border-white/5"
                  initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.08 }}
                >
                  <h4 className="text-white font-black uppercase text-sm mb-2">{item.t}</h4>
                  <p className="text-purple-200/70 text-sm leading-relaxed">{item.d}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Impacto esperado */}
          <motion.div
            className="bg-[#1F1235] rounded-[2.5rem] p-8 md:p-12 border border-yellow-400/20 mb-16"
            initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
          >
            <h3 className="text-yellow-400 font-black uppercase tracking-widest text-sm mb-6">Impacto Esperado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                'Humanização do ambiente prisional',
                'Redução de ansiedade, tensão e conflitos no entorno das unidades',
                'Melhoria da comunicação entre famílias e administração penitenciária',
                'Fortalecimento dos vínculos familiares',
                'Contribuição indireta para a ressocialização',
                'Apoio à política penitenciária do Estado do Rio de Janeiro',
              ].map((txt) => (
                <div key={txt} className="flex items-start gap-3">
                  <span className="text-yellow-400 font-black">✓</span>
                  <p className="text-purple-100/85 text-sm leading-relaxed">{txt}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="text-center"
            initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
          >
            <a
              href="https://wa.me/5521965540576"
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-yellow-400 text-purple-950 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white transition-colors shadow-xl"
            >
              Quero Participar ou Apoiar
            </a>
          </motion.div>
        </div>
      </section>

      {/* ACERVO */}
      <section id="acervo" className="py-20 md:py-40 bg-[#1F1235] px-4 md:px-8">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
        >
          <h2 className="text-5xl font-black mb-10 uppercase italic tracking-tighter">ACERVO</h2>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {ACERVO_CATEGORIAS.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => selecionarCategoriaAcervo(cat.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-colors ${
                  categoriaAcervo === cat.id ? 'bg-yellow-400 text-purple-950' : 'bg-white/5 text-purple-200/60 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </motion.button>
            ))}
          </div>

          {fotosAcervo.length > 0 ? (
            <div className="flex justify-center pb-14">
              <div
                className="relative w-[300px] sm:w-[360px] md:w-[420px] aspect-[4/5] max-w-full"
                style={{ perspective: 1200 }}
              >
                {Array.from({ length: Math.min(PILHA_TAMANHO, fotosAcervo.length) }, (_, i) => i)
                  .slice().reverse()
                  .map((pos) => {
                    const idx = (fotoAtual + pos) % fotosAcervo.length;
                    const src = fotosAcervo[idx];
                    const inclinacao = pos === 0 ? 0 : (pos % 2 === 0 ? -4 : 4);
                    return (
                      <motion.img
                        key={src}
                        layout
                        src={src}
                        alt={`Foto ${idx + 1}`}
                        loading="lazy"
                        drag={pos === 0 ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.6}
                        dragMomentum={false}
                        onDragEnd={pos === 0 ? arrastarFoto : undefined}
                        animate={{
                          x: 0,
                          scale: 1 - pos * 0.06,
                          y: pos * 16,
                          rotate: inclinacao,
                          opacity: 1,
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{ zIndex: PILHA_TAMANHO - pos }}
                        className={`absolute inset-0 w-full h-full object-cover rounded-[2rem] border-4 border-white/10 shadow-2xl bg-black ${pos === 0 ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
                      />
                    );
                  })}
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={fotoAnterior} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-yellow-400 hover:text-purple-900 w-9 h-9 rounded-full z-30 font-black text-sm shadow-xl">←</motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={proximaFoto} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-yellow-400 hover:text-purple-900 w-9 h-9 rounded-full z-30 font-black text-sm shadow-xl">→</motion.button>
                <div className="absolute -bottom-10 left-0 right-0 flex flex-col items-center gap-3">
                  <span className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full text-[12px] font-black tracking-widest border border-white/20">
                    {fotoAtual + 1} / {fotosAcervo.length}
                  </span>
                  <div className="w-1/2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${((fotoAtual + 1) / fotosAcervo.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 border-2 border-dashed border-white/10 rounded-[3rem] text-purple-400">
              Nenhuma foto encontrada
            </div>
          )}
        </motion.div>
      </section>

      {/* TRANSPARÊNCIA */}
      <SecaoPrestacaoContas />

      <SecaoSuporte />

      {/* MATRICULE-SE */}
      <motion.section
        id="matricule-se" className="py-20 md:py-32 bg-yellow-400 text-purple-950 px-4 md:px-8 text-center"
        initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
      >
        <h2 className="text-4xl md:text-8xl font-black mb-10 uppercase tracking-tighter italic text-center">MATRICULE-SE</h2>
        <motion.a
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          href="https://itp.institutotiapretinha.org/inscricao"
          className="inline-block bg-purple-950 text-white px-8 md:px-16 py-5 md:py-6 rounded-3xl font-black text-lg md:text-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] uppercase"
        >Inscrição Online</motion.a>
      </motion.section>

      {/* AJUDA / PIX */}
      <section id="como-ajudar" className="py-20 md:py-40 px-4 md:px-8 bg-[#2D1B4D]">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2
            className="text-5xl font-black mb-20 uppercase tracking-tighter text-yellow-400"
            initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
          >COMO AJUDAR</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { t: "Doações PIX", d: "Ajude a manter nossas oficinas e lanches.", b: "Copiar Chave", act: copiarChavePix },
              { t: "Materiais", d: "Roupas, alimentos e itens escolares.", b: "Como Doar", link: "https://wa.me/5521965540576" },
              { t: "Voluntário", d: "Compartilhe seu talento conosco.", b: "Quero Ajudar", link: "https://wa.me/5521965540576" }
            ].map((item, idx) => (
              <motion.div key={idx}
                className="bg-[#1F1235] p-12 rounded-[3.5rem] border border-white/5 flex flex-col h-full shadow-xl"
                initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
                transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <h3 className="text-2xl font-black mb-4 uppercase">{item.t}</h3>
                <p className="text-purple-200/60 mb-8">{item.d}</p>
                {item.act ? (
                  <button onClick={item.act} className="mt-auto bg-white text-purple-950 px-10 py-4 rounded-2xl font-black text-sm uppercase hover:bg-yellow-400 transition-colors shadow-md">{item.b}</button>
                ) : (
                  <a href={item.link} target="_blank" rel="noreferrer" className="mt-auto inline-block bg-yellow-400 text-purple-950 px-10 py-4 rounded-2xl font-black text-sm uppercase hover:bg-white text-center transition-colors shadow-md">{item.b}</a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PARCEIROS E LICENÇAS */}
      <section id="parceiros" className="py-20 md:py-40 px-4 md:px-8 bg-[#2D1B4D]">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
          >
            <h2 className="text-5xl font-black mb-6 uppercase italic tracking-tighter">Parceiros &amp; Licenças</h2>
            <p className="text-purple-200/60 max-w-2xl mx-auto mb-16">
              Organizações e programas que apoiam o trabalho do Instituto Tia Pretinha.
            </p>
          </motion.div>

          <h3 className="text-yellow-400 font-black uppercase tracking-widest text-sm mb-8 text-left">Parceiros</h3>
          <div className="grid grid-cols-5 gap-2 sm:gap-4 md:gap-6 mb-16">
            {PARCEIROS.map((p, idx) => (
              <motion.div
                key={p.nome}
                initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
                transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.08 }}
                className="bg-[#1F1235] rounded-xl sm:rounded-[2rem] p-1.5 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-4 border border-white/5"
              >
                <div className="w-full aspect-square flex items-center justify-center">
                  <img src={p.logo} alt={p.nome} className="max-h-full max-w-full object-contain rounded-lg sm:rounded-xl" loading="lazy" />
                </div>
                <p className="hidden sm:flex items-center justify-center min-h-[2.8em] text-[11px] text-purple-200/70 font-bold uppercase tracking-wide leading-tight text-center">{p.nome}</p>
              </motion.div>
            ))}
          </div>

          <h3 className="text-yellow-400 font-black uppercase tracking-widest text-sm mb-8 text-left">Licenças &amp; Ferramentas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {LICENCAS.map((l, idx) => (
              <motion.div
                key={l.nome}
                initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
                transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-[#1F1235] rounded-[2rem] p-8 border border-white/5 flex flex-col items-center text-center gap-4"
              >
                {l.logo ? (
                  <div className="bg-white/90 rounded-xl inline-flex items-center justify-center px-6 py-4">
                    <img src={l.logo} alt={l.nome} className="h-16 w-auto max-w-[200px] object-contain" loading="lazy" />
                  </div>
                ) : (
                  <p className="text-xl font-black uppercase">{l.nome}</p>
                )}
                <p className="text-xs text-purple-300/60 leading-relaxed">{l.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 md:py-40 bg-[#1F1235] px-4 md:px-8">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial="hidden" whileInView="visible" viewport={REVEAL_VIEWPORT} variants={fadeUp}
        >
          <h2 className="text-5xl font-black mb-16 uppercase italic tracking-tighter">CONTATO</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.a whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} href="https://www.instagram.com/ins.tia_pretinha/" target="_blank" rel="noreferrer" className="p-8 bg-white/5 rounded-[2rem] hover:bg-yellow-400 hover:text-purple-950 transition-colors font-black uppercase text-[12px] tracking-widest shadow-lg">Instagram</motion.a>
            <motion.a whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} href="https://wa.me/5521965540576" target="_blank" rel="noreferrer" className="p-8 bg-white/5 rounded-[2rem] hover:bg-yellow-400 hover:text-purple-950 transition-colors font-black uppercase text-[12px] tracking-widest shadow-lg">WhatsApp</motion.a>
            <motion.a whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }} href="https://www.facebook.com/profile.php?id=100086387738515" target="_blank" rel="noreferrer" className="p-8 bg-white/5 rounded-[2rem] hover:bg-yellow-400 hover:text-purple-950 transition-colors font-black uppercase text-[12px] tracking-widest shadow-lg">Facebook</motion.a>
          </div>
        </motion.div>
      </section>

      {/* MODAL PROJETOS */}
      <AnimatePresence>
      {projetoSelecionado && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-purple-950/98 backdrop-blur-xl"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setProjetoSelecionado(null)}
        >
          <motion.div
            className="bg-white text-purple-950 max-w-2xl w-full rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setProjetoSelecionado(null)} className="absolute top-8 right-10 text-3xl font-black">✕</button>
            <h3 className="text-4xl font-black uppercase mb-6 tracking-tighter">{projetoSelecionado.titulo}</h3>
            <p className="text-xl text-slate-700 mb-10 leading-relaxed font-light italic">"{projetoSelecionado.detalhe}"</p>
            <button onClick={() => setProjetoSelecionado(null)} className="bg-purple-700 text-white px-8 py-5 rounded-2xl font-black w-full uppercase tracking-widest shadow-lg">Fechar</button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-black py-16 px-4 md:px-8 text-center border-t border-white/5">
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">© 2025 Instituto Tia Pretinha • Todos os direitos reservados</p>
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-2">CNPJ 11.759.851/0001-39</p>
        <p className="text-[11px] text-yellow-500/50 font-black uppercase tracking-widest mt-6 italic">Arquitetura Digital por Erick Gonçalves Cardoso</p>
      </footer>

      <Analytics /> {}
      <SpeedInsights /> {}
    </div>
  )
  
}

export default App