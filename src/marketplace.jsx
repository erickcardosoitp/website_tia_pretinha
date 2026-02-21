import React, { useState, useMemo } from 'react'

/**
 * MARKETPLACE — INSTITUTO TIA PRETINHA
 * Layout padrão de e-commerce com:
 * - Sidebar de filtros (categoria + ordenação)
 * - Barra de busca
 * - Grid de cards com foto, descrição, valor e botão de carrinho
 * - Header com contador do carrinho
 * - Modal de carrinho com botão limpar
 *
 * FOTOS: coloque os arquivos na pasta /public do projeto.
 * Atualize o campo `img` de cada produto com o nome do arquivo.
 * Ex: img: '/camiseta.jpg'
 */

// ─── PRODUTOS ────────────────────────────────────────────────────────────────
const PRODUTOS = [
  {
    id: 1,
    nome: 'Garrafinha Tia Pretinha',
    categoria: 'Acessórios',
    preco: 18.00,
    descricao: 'Garrafinha oficial do Instituto Tia Pretinha. Perfeita para o dia a dia, treinos e atividades.',
    img: '/garrafinha_marketplace.jpeg',
  },
  {
    id: 2,
    nome: 'Boné Tia Pretinha',
    categoria: 'Acessórios',
    preco: 30.00,
    descricao: 'Boné oficial do Instituto Tia Pretinha. Estilo e identidade para apoiar nossa causa.',
    img: '/bone_marketplace.jpeg',
  },
  {
    id: 3,
    nome: 'Camisa Tia Pretinha',
    categoria: 'Vestuário',
    preco: 27.00,
    descricao: 'Camisa oficial do Instituto Tia Pretinha. Confortável, estilosa e cheia de significado.',
    img: '/camisa_marketplace.jpeg',
  },
  {
    id: 4,
    nome: 'Moletom Preto Tia Pretinha',
    categoria: 'Vestuário',
    preco: 100.00,
    descricao: 'Moletom preto premium do Instituto Tia Pretinha. Quentinho, resistente e com identidade visual exclusiva.',
    img: '/moletom_marketplace.jpeg',
  },
  {
    id: 5,
    nome: 'Corta-Vento Tia Pretinha',
    categoria: 'Vestuário',
    preco: 80.00,
    descricao: 'Corta-vento oficial do Instituto Tia Pretinha. Leve, funcional e ideal para os dias mais frescos.',
    img: '/cortavento_marketplace.jpeg',
  },
]

const CATEGORIAS = ['Todas', 'Vestuário', 'Acessórios']

const ORDENACOES = [
  { label: 'Relevância',      value: 'relevancia' },
  { label: 'Menor preço',     value: 'menor-preco' },
  { label: 'Maior preço',     value: 'maior-preco' },
  { label: 'A → Z',           value: 'az' },
  { label: 'Z → A',           value: 'za' },
]

const PIX = '21965540576'

// ─── ÍCONES ───────────────────────────────────────────────────────────────────
const IcoCart = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)
const IcoSearch = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
)
const IcoPlus = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)
const IcoMinus = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
)
const IcoTrash = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const IcoX = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const IcoWpp = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)
const IcoChevron = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Marketplace() {
  const [busca, setBusca]                   = useState('')
  const [categoria, setCategoria]           = useState('Todas')
  const [ordenacao, setOrdenacao]           = useState('relevancia')
  const [carrinho, setCarrinho]             = useState([])
  const [carrinhoAberto, setCarrinhoAberto] = useState(false)
  const [pixCopiado, setPixCopiado]         = useState(false)
  const [sidebarMobile, setSidebarMobile]   = useState(false)

  // ── Carrinho helpers ──────────────────────────────────────────────────────
  const addItem = (p) =>
    setCarrinho(prev => {
      const ex = prev.find(i => i.id === p.id)
      return ex
        ? prev.map(i => i.id === p.id ? { ...i, qtd: i.qtd + 1 } : i)
        : [...prev, { ...p, qtd: 1 }]
    })

  const subItem = (id) =>
    setCarrinho(prev => {
      const ex = prev.find(i => i.id === id)
      return ex?.qtd === 1
        ? prev.filter(i => i.id !== id)
        : prev.map(i => i.id === id ? { ...i, qtd: i.qtd - 1 } : i)
    })

  const removeItemTotal = (id) => setCarrinho(prev => prev.filter(i => i.id !== id))
  const limparCarrinho  = () => setCarrinho([])

  const totalQtd   = carrinho.reduce((a, i) => a + i.qtd, 0)
  const totalPreco = carrinho.reduce((a, i) => a + i.preco * i.qtd, 0)
  const getQtd     = (id) => carrinho.find(i => i.id === id)?.qtd ?? 0

  // ── Filtro + ordenação ────────────────────────────────────────────────────
  const produtosFiltrados = useMemo(() => {
    let lista = PRODUTOS.filter(p => {
      const matchCat    = categoria === 'Todas' || p.categoria === categoria
      const matchBusca  = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
                          p.descricao.toLowerCase().includes(busca.toLowerCase())
      return matchCat && matchBusca
    })
    switch (ordenacao) {
      case 'menor-preco': lista = [...lista].sort((a, b) => a.preco - b.preco);   break
      case 'maior-preco': lista = [...lista].sort((a, b) => b.preco - a.preco);   break
      case 'az':          lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome)); break
      case 'za':          lista = [...lista].sort((a, b) => b.nome.localeCompare(a.nome)); break
      default: break
    }
    return lista
  }, [busca, categoria, ordenacao])

  // ── PIX ──────────────────────────────────────────────────────────────────
  const copiarPix = () => {
    navigator.clipboard.writeText(PIX)
    setPixCopiado(true)
    setTimeout(() => setPixCopiado(false), 3000)
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────
  const finalizarPedido = () => {
    const lista = carrinho
      .map(i => `• ${i.qtd}x ${i.nome} — R$ ${(i.preco * i.qtd).toFixed(2).replace('.', ',')}`)
      .join('\n')
    const msg = encodeURIComponent(
      `Olá! Quero fazer um pedido na loja do Instituto Tia Pretinha 💜\n\n${lista}\n\n*Total: R$ ${totalPreco.toFixed(2).replace('.', ',')}*`
    )
    window.open(`https://wa.me/5521965540576?text=${msg}`, '_blank')
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* ── TOAST PIX ── */}
      <div className={`fixed bottom-6 right-6 z-[600] transition-all duration-400 ${pixCopiado ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="bg-[#2D1B4D] text-yellow-400 px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3 text-sm">
          ✓ Chave PIX copiada!
        </div>
      </div>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-[100] bg-[#1F1235] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo + voltar */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <img
              src="/png_instituto.jpg"
              alt="Instituto Tia Pretinha"
              className="h-9 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.location.href = '/'}
            />
            <a href="/" className="hidden sm:flex items-center gap-1 text-purple-300 hover:text-white text-xs font-semibold transition-colors">
              ← Voltar ao site
            </a>
            <div className="hidden sm:block w-px h-5 bg-white/20" />
            <span className="hidden sm:block text-white font-bold text-sm tracking-wide">Loja Oficial</span>
          </div>

          {/* Barra de busca central */}
          <div className="flex-1 max-w-lg mx-4 relative">
            <IcoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/10 bg-white/10 text-white placeholder-white/40 text-sm outline-none focus:bg-white/15 focus:border-yellow-400/50 transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <IcoX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botão carrinho */}
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="relative flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-purple-950 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 flex-shrink-0"
          >
            <IcoCart className="w-5 h-5" />
            <span className="hidden sm:inline">Carrinho</span>
            {totalQtd > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#2D1B4D] text-yellow-400 border border-yellow-400/30 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center">
                {totalQtd}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ══ LAYOUT PRINCIPAL ════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex gap-8">

        {/* ── SIDEBAR FILTROS (desktop) ─────────────────────────────────── */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">

            {/* Categoria */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Categoria</h3>
              <ul className="space-y-1">
                {CATEGORIAS.map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => setCategoria(cat)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        categoria === cat
                          ? 'bg-[#2D1B4D] text-yellow-400'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ordenação */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Ordenar por</h3>
              <ul className="space-y-1">
                {ORDENACOES.map(o => (
                  <li key={o.value}>
                    <button
                      onClick={() => setOrdenacao(o.value)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        ordenacao === o.value
                          ? 'bg-[#2D1B4D] text-yellow-400'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* ── CONTEÚDO PRINCIPAL ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Barra de filtros mobile + info de resultados */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{produtosFiltrados.length}</span> produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
            </p>

            {/* Filtros mobile */}
            <div className="flex gap-2 lg:hidden">
              {/* Categoria dropdown mobile */}
              <div className="relative">
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-sm font-semibold text-gray-700 pl-3 pr-8 py-2 rounded-xl shadow-sm outline-none focus:border-purple-400 cursor-pointer"
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <IcoChevron className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>

              {/* Ordenação dropdown mobile */}
              <div className="relative">
                <select
                  value={ordenacao}
                  onChange={e => setOrdenacao(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 text-sm font-semibold text-gray-700 pl-3 pr-8 py-2 rounded-xl shadow-sm outline-none focus:border-purple-400 cursor-pointer"
                >
                  {ORDENACOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <IcoChevron className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Ordenação desktop rápida */}
            <div className="hidden lg:flex relative">
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-sm font-semibold text-gray-700 pl-3 pr-8 py-2 rounded-xl shadow-sm outline-none focus:border-purple-400 cursor-pointer"
              >
                {ORDENACOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <IcoChevron className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ── GRID DE PRODUTOS ─────────────────────────────────────────── */}
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-32 text-gray-400">
              <IcoSearch className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg">Nenhum produto encontrado</p>
              <p className="text-sm mt-2">Tente outro termo ou categoria</p>
              <button
                onClick={() => { setBusca(''); setCategoria('Todas') }}
                className="mt-6 px-6 py-2 bg-[#2D1B4D] text-yellow-400 rounded-xl text-sm font-bold hover:bg-[#1F1235] transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {produtosFiltrados.map(p => {
                const qtdNoCart = getQtd(p.id)
                return (
                  <article
                    key={p.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Foto */}
                    <div className="h-64 bg-gray-100 overflow-hidden flex-shrink-0">
                        <img
                        src={p.img}
                        alt={p.nome}
                        className="w-full h-full object-cover"
                        onError={e => {
                          // fallback placeholder se foto não existir ainda
                          e.target.style.display = 'none'
                          e.target.parentNode.style.background = 'linear-gradient(135deg, #2D1B4D 0%, #4C1D95 100%)'
                          e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#facc15" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm0 0h.008v.008H13.5V12zM6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg><span style="color:#a78bfa;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;">Foto em breve</span></div>`
                        }}
                      />
                    </div>

                    {/* Conteúdo */}
                    <div className="p-5 flex flex-col flex-grow">
                      {/* Categoria badge */}
                      <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-widest text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full w-fit">
                        {p.categoria}
                      </span>

                      {/* Nome */}
                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-2">{p.nome}</h3>

                      {/* Descrição */}
                      <p className="text-gray-500 text-sm leading-relaxed flex-grow mb-4 line-clamp-3">{p.descricao}</p>

                      {/* Preço + botão */}
                      <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-gray-50">
                        <span className="text-2xl font-black text-[#2D1B4D]">
                          R$ <span>{p.preco.toFixed(2).replace('.', ',')}</span>
                        </span>

                        {qtdNoCart > 0 ? (
                          /* Controle de qtd */
                          <div className="flex items-center border border-[#2D1B4D] rounded-xl overflow-hidden">
                            <button
                              onClick={() => subItem(p.id)}
                              className="w-9 h-9 flex items-center justify-center text-[#2D1B4D] hover:bg-purple-50 transition-colors"
                            ><IcoMinus /></button>
                            <span className="w-8 text-center text-sm font-bold text-[#2D1B4D]">{qtdNoCart}</span>
                            <button
                              onClick={() => addItem(p)}
                              className="w-9 h-9 flex items-center justify-center text-[#2D1B4D] hover:bg-purple-50 transition-colors"
                            ><IcoPlus /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addItem(p)}
                            className="flex items-center gap-2 bg-[#2D1B4D] hover:bg-[#1F1235] text-yellow-400 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                          >
                            <IcoCart className="w-4 h-4" /> Adicionar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ MODAL CARRINHO ══════════════════════════════════════════════════ */}
      {carrinhoAberto && (
        <div
          className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6"
          onClick={() => setCarrinhoAberto(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header carrinho */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <IcoCart className="w-5 h-5 text-[#2D1B4D]" />
                <h2 className="font-bold text-lg text-gray-900">Carrinho</h2>
                {totalQtd > 0 && (
                  <span className="bg-[#2D1B4D] text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalQtd} {totalQtd === 1 ? 'item' : 'itens'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {carrinho.length > 0 && (
                  <button
                    onClick={limparCarrinho}
                    className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-wide transition-colors"
                  >
                    <IcoTrash className="w-3.5 h-3.5" /> Limpar
                  </button>
                )}
                <button
                  onClick={() => setCarrinhoAberto(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <IcoX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Itens */}
            <div className="flex-grow overflow-y-auto px-6 py-4 space-y-3">
              {carrinho.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <IcoCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Seu carrinho está vazio</p>
                  <p className="text-sm mt-1 text-gray-300">Adicione produtos para continuar</p>
                </div>
              ) : (
                carrinho.map(item => (
                  <div key={item.id} className="flex gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    {/* Miniatura */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={item.img}
                        alt={item.nome}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.target.style.display = 'none'
                          e.target.parentNode.style.background = 'linear-gradient(135deg, #2D1B4D, #4C1D95)'
                        }}
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-sm text-gray-900 leading-tight">{item.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.categoria}</p>
                      <p className="text-[#2D1B4D] font-black text-sm mt-1">
                        R$ {(item.preco * item.qtd).toFixed(2).replace('.', ',')}
                        {item.qtd > 1 && <span className="text-gray-400 font-normal text-xs ml-1">(× {item.qtd})</span>}
                      </p>
                    </div>
                    {/* Controles */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <button
                        onClick={() => removeItemTotal(item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <IcoTrash className="w-4 h-4" />
                      </button>
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button onClick={() => subItem(item.id)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"><IcoMinus className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-sm font-bold text-gray-900">{item.qtd}</span>
                        <button onClick={() => addItem(item)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"><IcoPlus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Rodapé */}
            {carrinho.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-100 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">Total</span>
                  <span className="text-2xl font-black text-[#2D1B4D]">
                    R$ {totalPreco.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  onClick={finalizarPedido}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5c] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-md active:scale-95 text-sm"
                >
                  <IcoWpp /> Finalizar pedido via WhatsApp
                </button>

                <button
                  onClick={copiarPix}
                  className="w-full bg-gray-50 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300 text-gray-700 hover:text-[#2D1B4D] font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
                >
                  📋 Copiar chave PIX ({PIX})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="mt-20 bg-[#1F1235] py-12 px-8 text-center border-t border-white/5">
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">© 2025 Instituto Tia Pretinha • Todos os direitos reservados</p>
        <p className="text-[11px] text-yellow-500/50 font-black uppercase tracking-widest mt-4 italic">Arquitetura Digital por Erick Gonçalves Cardoso</p>
      </footer>
    </div>
  )
}