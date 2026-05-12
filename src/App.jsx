import React, { useState, useEffect, useMemo } from 'react'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"

/**
 * INSTITUTO TIA PRETINHA - VERSÃO ESTRATÉGICA ONG
 * Desenvolvedor: Erick Gonçalves Cardoso
 * Correções: Enquadramento de Imagens, Nomes de Arquivos e Seção de Projetos
 */

// 1. IMPORTAÇÃO DE IMAGENS
const imagensImportadas = import.meta.glob('./carrosel_fotos/*.{jpeg,jpg,JPG,JPEG,png,PNG,webp}', { eager: true });

// 2. ORGANIZAÇÃO DA GALERIA
const listaDeFotos = Object.values(imagensImportadas)
  .map((mod) => mod.default)
  .sort((a, b) => a.localeCompare(b));

const API_BASE = 'https://api.itp.institutotiapretinha.org/api';

const LINK_APRESENTACAO = 'https://drive.google.com/file/d/1EXb3z0h_vGt2mDAJ__9CbDZBzRF8pEXu/view?usp=sharing';
const ULTIMO_MES_PUBLICADO = '2026-04'; // atualizar ao fechar cada mês

function fmt(valor) {
  return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MESES_NOME = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function SecaoPrestacaoContas() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [mesSelecionado, setMesSelecionado] = useState('2026-04');
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
      if (c.includes('doa')) return 'Doações';
      if (c.includes('uniform')) return 'Venda de Uniformes';
      if (c.includes('evento')) return 'Eventos Beneficentes';
      if (c.includes('celia') || c.includes('célia') || c.includes('material')) return 'Contribuições da Diretoria';
      return 'Outras Entradas';
    } else {
      if (c.includes('cozinha')) return 'Alimentação';
      if (c.includes('material') || c.includes('celia') || c.includes('célia')) return 'Material Escolar e Manutenção';
      if (c.includes('funcionari')) return 'Funcionários';
      if (c.includes('evento')) return 'Eventos';
      return 'Outros';
    }
  };

  const entradasPub = agrupar(
    (dados?.movimentacoes ?? []).filter(m => m.tipo === 'Entrada'),
    m => categoriaPub(m.categoria, 'Entrada'),
    m => m.valor
  );

  const saidasPub = agrupar(
    (dados?.movimentacoes ?? []).filter(m => m.tipo === 'Saída'),
    m => categoriaPub(m.categoria, 'Saída'),
    m => m.valor
  );

  return (
    <section id="transparencia" className="py-24 bg-[#2D1B4D] px-4 md:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 reveal transition-all duration-1000 opacity-0 translate-y-10">
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
        </div>

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
                <div key={i} className="bg-[#1F1235] rounded-[2rem] p-6 border border-white/5 reveal opacity-0 translate-y-10 transition-all duration-700" style={{ transitionDelay: `${i * 80}ms` }}>
                  <p className="text-purple-200/50 text-xs uppercase font-black tracking-widest mb-2">{k.label}</p>
                  <p className={`text-2xl md:text-3xl font-black ${k.cor}`}>{k.valor}</p>
                  {k.unidade && <p className="text-purple-200/30 text-xs mt-1 uppercase font-bold">{k.unidade}</p>}
                </div>
              ))}
            </div>

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
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-purple-100 font-bold">{c.categoria}</span>
                          <span className="text-green-400 font-black">{fmt(c.valor)}</span>
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
                      <img src="/logo_ceasa.png" alt="CEASA" className="h-12 w-auto object-contain flex-shrink-0" />
                      <div>
                        <p className="text-white font-black text-sm">CEASA — Banco de Alimentos</p>
                        <p className="text-purple-300/60 text-xs mt-1">45 caixas de hortifruti</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4">
                      <img src="/logo_ame.png" alt="Instituto AME" className="h-12 w-auto object-contain flex-shrink-0" />
                      <div>
                        <p className="text-white font-black text-sm">Instituto Direitos Humanos AME</p>
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
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-purple-100 font-bold">{c.categoria}</span>
                          <span className="text-red-400 font-black">{fmt(c.valor)}</span>
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
                const rows = linhas.map(m => [
                  m.data ? new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—',
                  `"${(m.descricao ?? '').replace(/"/g, '""')}"`,
                  `"${(m.categoria ?? '').replace(/"/g, '""')}"`,
                  m.tipo === 'Entrada' ? 'Entrada' : 'Saída',
                  Number(m.valor ?? 0).toFixed(2).replace('.', ','),
                ].join(';'));
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
    <section id="suporte" className="py-16 md:py-32 bg-[#1a0a35] text-white px-4 md:px-8 reveal transition-all duration-1000 opacity-0 translate-y-10">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-center mb-4">SUPORTE E <span className="text-yellow-400">ATENDIMENTO</span></h2>
        <p className="text-purple-300 text-center mb-10">Abra um chamado ou consulte o status de um atendimento.</p>

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
  const [showPixToast, setShowPixToast] = useState(false);

  // --- LÓGICA DE ANIMAÇÃO NO SCROLL (REVEAL) ---
  useEffect(() => {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.reveal');
    animatedElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [activeSection]);

  // --- LÓGICA DA GALERIA ---
  const fotosGaleria = useMemo(() => listaDeFotos, []);
  const proximaFoto = () => setFotoAtual((prev) => (prev + 1) % fotosGaleria.length);
  const fotoAnterior = () => setFotoAtual((prev) => (prev - 1 + fotosGaleria.length) % fotosGaleria.length);

  // --- TÍTULO DA PÁGINA ---
  useEffect(() => {
    const nomesSessoes = {
      'inicio': 'Início', 'sobre-nos': 'Sobre Nós', 'projetos': 'Projetos',
      'galeria': 'Galeria', 'transparencia': 'Transparência', 'suporte': 'Suporte', 'matricule-se': 'Matricule-se', 'como-ajudar': 'Ajuda', 'contato': 'Contato'
    };
    document.title = `Instituto Tia Pretinha | ${nomesSessoes[activeSection] || 'Bem-vindo'}`;
  }, [activeSection]);

  // --- DETECÇÃO DE SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['inicio', 'sobre-nos', 'projetos', 'galeria', 'transparencia', 'suporte', 'matricule-se', 'como-ajudar', 'contato'];
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
      desc: "Capacitação digital.", 
      detalhe: "Ferramentas de produtividade.", 
      img: "/pretina_ti.jpeg" 
    },
    { 
      id: 2, 
      titulo: "Ballet Clássico",
      prof: "Ellen", 
      desc: "Expressão artística.", 
      detalhe: "Consciência corporal.", 
      img: "/pretinha_ballet.jpeg" 
    },
    { 
      id: 3, 
      titulo: "Jiu-Jitsu", 
      prof: "Tico", 
      desc: "Defesa pessoal.", 
      detalhe: "Valores e autoconfiança.", 
      img: "/pretinha_jiujtsu.jpeg" 
    },
    { 
      id: 4, 
      titulo: "Danças Contemporâneas", 
      prof: "Letícia", 
      desc: "Movimento e criatividade.", 
      detalhe: "Exploração da linguagem corporal.", 
      img: "/pretinha_danca.jpeg" 
    },
    { 
      id: 5, 
      titulo: "Capoeira", 
      prof: "Anderson", 
      desc: "Cultura e esporte.", 
      detalhe: "Herança afro-brasileira.", 
      img: "/pretinha_capoeira.jpeg" 
    },
    { 
      id: 6, 
      titulo: "Futebol", 
      prof: "EM BREVE!", 
      desc: "Integração social.", 
      detalhe: "Trabalho em equipe.", 
      img: "/pretinha_fut.jpeg" 
    },
    { 
      id: 7, 
      titulo: "Inglês", 
      prof: "Karina", 
      desc: "Novo idioma.", 
      detalhe: "Prática e conversação.", 
      img: "/pretinha_ingles.jpeg" 
    },
    { 
      id: 8, 
      titulo: "Reforço Escolar", 
      prof: "Érica", 
      desc: "Apoio pedagógico.", 
      detalhe: "Português e Matemática.", 
      img: "/pretinha_prevest.jpeg" 
    }
  ];

  return (
<div className="min-h-[100dvh] w-full bg-[#2D1B4D] text-white font-sans selection:bg-yellow-400 selection:text-purple-900 scroll-smooth overflow-x-hidden flex flex-col">      

{/* BOTÃO FLUTUANTE - MARKETPLACE */}
<a
  href="/marketplace"
  className="fixed bottom-8 left-8 z-[200] w-16 h-16 bg-white rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-110 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] active:scale-95 transition-all duration-300 group"
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
          
          <div className="flex items-center gap-5 overflow-x-auto lg:overflow-visible no-scrollbar py-2 max-w-[60%] md:max-w-none">
            {['inicio', 'sobre-nos', 'projetos', 'galeria', 'transparencia', 'suporte', 'matricule-se', 'como-ajudar', 'contato'].map((item) => (
              <a 
                key={item} 
                href={`#${item}`} 
                className={`text-[10px] font-black uppercase tracking-widest relative py-2 whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeSection === item ? 'text-yellow-400' : 'text-purple-200 hover:text-white'
                }`}
              >
                {item === 'transparencia' ? 'Transparência' : item.replace('-', ' ')}
                {activeSection === item && (
                  <span className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full"></span>
                )}
              </a>
            ))}
          </div>

          <button onClick={copiarChavePix} className="bg-yellow-400 text-purple-950 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all">
            PIX
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header id="inicio" className="relative min-h-screen flex items-center justify-center pt-20 px-4 md:px-8 text-center">
        <div className="max-w-5xl z-10 reveal transition-all duration-1000 transform translate-y-10 opacity-0">
          <h1 className="text-4xl sm:text-5xl md:text-9xl font-black leading-none mb-8 uppercase tracking-tighter italic">Instituto <br/><span className="text-yellow-400">Tia Pretinha</span></h1>
          <p className="text-lg md:text-2xl text-purple-100 max-w-4xl mx-auto font-light mb-12 italic">"Transformando vidas com afeto e ação."</p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <a href="#matricule-se" className="bg-yellow-400 text-purple-900 px-8 sm:px-12 py-5 rounded-2xl font-black text-base md:text-lg hover:scale-105 transition-all shadow-xl shadow-yellow-400/10">MATRICULE-SE</a>
            <a href="#projetos" className="bg-purple-600/30 border-2 border-white/20 px-8 sm:px-12 py-5 rounded-2xl font-black text-base md:text-lg hover:bg-purple-600/50 transition-all">PROJETOS</a>
          </div>
        </div>
      </header>

      {/* SOBRE NÓS */}
<section id="sobre-nos" className="py-20 md:py-40 bg-[#1F1235] px-4 md:px-8">
  <div className="max-w-7xl mx-auto">
    {/* Título da Seção */}
    <div className="text-center mb-20 reveal transition-all duration-1000 transform translate-y-10 opacity-0">
      <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase italic tracking-tighter">SOBRE NÓS</h2>
      <p className="text-2xl md:text-4xl text-yellow-400 font-medium leading-tight italic max-w-5xl mx-auto">
        "Aqui também é possível vencer."
      </p>
      <div className="h-2 w-24 bg-purple-500 mx-auto mt-8 rounded-full opacity-30"></div>
    </div>

    {/* Bloco Biográfico: Tia Pretinha */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      
      {/* Imagem com Moldura Estilizada */}
      <div className="relative reveal transition-all duration-1000 transform -translate-x-10 opacity-0">
        <div className="absolute -inset-4 border-2 border-yellow-400/30 rounded-[3rem] rotate-3 -z-10"></div>
        <div className="overflow-hidden rounded-[3rem] shadow-2xl border-4 border-white/10 aspect-[4/5] lg:aspect-auto">
          <img 
            src="/tiacelia.jpg" 
            alt="Célia da Silva Paixão - Tia Pretinha" 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-purple-950 p-8 rounded-3xl shadow-xl hidden md:block">
          <p className="font-black text-2xl uppercase italic leading-none">Célia da Silva Paixão</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 opacity-80">Fundadora & Nutricionista</p>
        </div>
      </div>

      {/* Conteúdo de Texto */}
      <div className="reveal transition-all duration-1000 transform translate-x-10 opacity-0 text-left">
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
      </div>
    </div>

    {/* Manifesto Final */}
    <div className="mt-24 text-center reveal transition-all duration-1000 opacity-0">
       <p className="text-xl md:text-2xl font-light italic text-purple-200">
         "Sou prova viva de que quando Deus planta um propósito, <br className="hidden md:block"/>
         nenhuma dificuldade consegue arrancar."
       </p>
    </div>
  </div>
</section>

      {/* PROJETOS - APENAS ESTA SEÇÃO */}
<section id="projetos" className="py-20 md:py-40 px-4 md:px-8 bg-[#1F1235]">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-5xl font-black mb-20 text-center uppercase italic reveal opacity-0 translate-y-10 transition-all duration-700">
      PROJETOS
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {projetos.map((p, idx) => (
        <div 
          key={p.id} 
          className="bg-[#2D1B4D] rounded-[2.5rem] overflow-hidden flex flex-col group reveal opacity-0 translate-y-10 transition-all duration-700 shadow-2xl" 
          style={{ transitionDelay: `${idx * 100}ms` }}
        >
          {/* FOTO: Ajustada para h-64 e zoom suave */}
          <div className="h-64 overflow-hidden bg-purple-900/20">
            <img 
              src={p.img} 
              alt={p.titulo} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            />
          </div>

          <div className="p-8 flex flex-col flex-grow">
            <h3 className="text-2xl font-black text-yellow-400 uppercase leading-none mb-2">
              {p.titulo}
            </h3>
            <p className="text-[10px] font-black text-purple-400 mb-4 uppercase">
              {p.prof === "EM BREVE!" ? p.prof : `Prof. ${p.prof}`}
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
        </div>
      ))}
    </div>
  </div>
</section>

      {/* GALERIA */}
      <section id="galeria" className="py-20 md:py-40 bg-[#1F1235] px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center reveal transition-all duration-1000 opacity-0 translate-y-10">
          <h2 className="text-5xl font-black mb-20 uppercase italic tracking-tighter">GALERIA</h2>
          {fotosGaleria.length > 0 ? (
            <div className="relative h-[450px] md:h-[650px] rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-black group flex items-center justify-center">
              <img 
                src={fotosGaleria[fotoAtual]} 
                alt={`Foto ${fotoAtual + 1}`} 
                className="max-w-full max-h-full object-contain transition-opacity duration-500"
                loading="lazy" 
                key={fotoAtual}
              />
              <button onClick={fotoAnterior} className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-yellow-400 hover:text-purple-900 w-14 h-14 rounded-full z-20 font-black text-xl transition-all shadow-xl">←</button>
              <button onClick={proximaFoto} className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-yellow-400 hover:text-purple-900 w-14 h-14 rounded-full z-20 font-black text-xl transition-all shadow-xl">→</button>
              <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
                <span className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full text-[12px] font-black tracking-widest border border-white/20">
                  {fotoAtual + 1} / {fotosGaleria.length}
                </span>
                <div className="w-1/2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-300" 
                    style={{ width: `${((fotoAtual + 1) / fotosGaleria.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 border-2 border-dashed border-white/10 rounded-[3rem] text-purple-400">
              Nenhuma foto encontrada
            </div>
          )}
        </div>
      </section>

      {/* TRANSPARÊNCIA */}
      <SecaoPrestacaoContas />

      <SecaoSuporte />

      {/* MATRICULE-SE */}
      <section id="matricule-se" className="py-20 md:py-32 bg-yellow-400 text-purple-950 px-4 md:px-8 text-center reveal transition-all duration-1000 opacity-0 translate-y-10">
        <h2 className="text-4xl md:text-8xl font-black mb-10 uppercase tracking-tighter italic text-center">MATRICULE-SE</h2>
        <a href="https://itp.institutotiapretinha.org/inscricao" className="inline-block bg-purple-950 text-white px-8 md:px-16 py-5 md:py-6 rounded-3xl font-black text-lg md:text-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform uppercase">Inscrição Online</a>
      </section>

      {/* AJUDA / PIX */}
      <section id="como-ajudar" className="py-20 md:py-40 px-4 md:px-8 bg-[#2D1B4D]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-20 uppercase tracking-tighter text-yellow-400 reveal transition-all duration-700 opacity-0 translate-y-10">COMO AJUDAR</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { t: "Doações PIX", d: "Ajude a manter nossas oficinas e lanches.", b: "Copiar Chave", act: copiarChavePix },
              { t: "Materiais", d: "Roupas, alimentos e itens escolares.", b: "Como Doar", link: "https://wa.me/5521965540576" },
              { t: "Voluntário", d: "Compartilhe seu talento conosco.", b: "Quero Ajudar", link: "https://wa.me/5521965540576" }
            ].map((item, idx) => (
              <div key={idx} 
                className="bg-[#1F1235] p-12 rounded-[3.5rem] border border-white/5 flex flex-col h-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 reveal opacity-0 translate-y-10 transition-all duration-700"
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <h3 className="text-2xl font-black mb-4 uppercase">{item.t}</h3>
                <p className="text-purple-200/60 mb-8">{item.d}</p>
                {item.act ? (
                  <button onClick={item.act} className="mt-auto bg-white text-purple-950 px-10 py-4 rounded-2xl font-black text-sm uppercase hover:bg-yellow-400 transition-colors shadow-md">{item.b}</button>
                ) : (
                  <a href={item.link} target="_blank" rel="noreferrer" className="mt-auto inline-block bg-yellow-400 text-purple-950 px-10 py-4 rounded-2xl font-black text-sm uppercase hover:bg-white text-center transition-colors shadow-md">{item.b}</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-20 md:py-40 bg-[#1F1235] px-4 md:px-8">
        <div className="max-w-5xl mx-auto text-center reveal transition-all duration-1000 opacity-0 translate-y-10">
          <h2 className="text-5xl font-black mb-16 uppercase italic tracking-tighter">CONTATO</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <a href="https://www.instagram.com/ins.tia_pretinha/" target="_blank" rel="noreferrer" className="p-8 bg-white/5 rounded-[2rem] hover:bg-yellow-400 hover:text-purple-950 transition-all font-black uppercase text-[12px] tracking-widest shadow-lg">Instagram</a>
            <a href="https://wa.me/5521965540576" target="_blank" rel="noreferrer" className="p-8 bg-white/5 rounded-[2rem] hover:bg-yellow-400 hover:text-purple-950 transition-all font-black uppercase text-[12px] tracking-widest shadow-lg">WhatsApp</a>
            <a href="https://www.facebook.com/profile.php?id=100086387738515" target="_blank" rel="noreferrer" className="p-8 bg-white/5 rounded-[2rem] hover:bg-yellow-400 hover:text-purple-950 transition-all font-black uppercase text-[12px] tracking-widest shadow-lg">Facebook</a>
          </div>
        </div>
      </section>

      {/* MODAL PROJETOS */}
      {projetoSelecionado && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-purple-950/98 backdrop-blur-xl">
          <div className="bg-white text-purple-950 max-w-2xl w-full rounded-[2rem] md:rounded-[4rem] p-6 md:p-12 relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <button onClick={() => setProjetoSelecionado(null)} className="absolute top-8 right-10 text-3xl font-black">✕</button>
            <h3 className="text-4xl font-black uppercase mb-6 tracking-tighter">{projetoSelecionado.titulo}</h3>
            <p className="text-xl text-slate-700 mb-10 leading-relaxed font-light italic">"{projetoSelecionado.detalhe}"</p>
            <button onClick={() => setProjetoSelecionado(null)} className="bg-purple-700 text-white px-8 py-5 rounded-2xl font-black w-full uppercase tracking-widest shadow-lg">Fechar</button>
          </div>
        </div>
      )}

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