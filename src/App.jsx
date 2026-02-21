import React, { useState, useEffect, useMemo } from 'react'

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
      'galeria': 'Galeria', 'transparencia': 'Transparência', 'matricule-se': 'Matricule-se', 'como-ajudar': 'Ajuda', 'contato': 'Contato'
    };
    document.title = `Instituto Tia Pretinha | ${nomesSessoes[activeSection] || 'Bem-vindo'}`;
  }, [activeSection]);

  // --- DETECÇÃO DE SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['inicio', 'sobre-nos', 'projetos', 'galeria', 'transparencia', 'matricule-se', 'como-ajudar', 'contato'];
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
    <div className="min-h-screen bg-[#2D1B4D] text-white font-sans selection:bg-yellow-400 selection:text-purple-900 scroll-smooth overflow-x-hidden">
      
      {/* TOAST PIX */}
      <div className={`fixed bottom-10 right-10 z-[300] transition-all duration-500 transform ${showPixToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-yellow-400 text-purple-950 px-8 py-4 rounded-2xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4">
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
            {['inicio', 'sobre-nos', 'projetos', 'galeria', 'transparencia', 'matricule-se', 'como-ajudar', 'contato'].map((item) => (
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
      <header id="inicio" className="relative min-h-screen flex items-center justify-center pt-20 px-8 text-center">
        <div className="max-w-5xl z-10 reveal transition-all duration-1000 transform translate-y-10 opacity-0">
          <h1 className="text-5xl md:text-9xl font-black leading-none mb-8 uppercase tracking-tighter italic">Instituto <br/><span className="text-yellow-400">Tia Pretinha</span></h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-4xl mx-auto font-light mb-12 italic">"Transformando vidas com afeto e ação."</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#matricule-se" className="bg-yellow-400 text-purple-900 px-12 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-yellow-400/10">MATRICULE-SE</a>
            <a href="#projetos" className="bg-purple-600/30 border-2 border-white/20 px-12 py-5 rounded-2xl font-black text-lg hover:bg-purple-600/50 transition-all">PROJETOS</a>
          </div>
        </div>
      </header>

      {/* SOBRE NÓS */}
      <section id="sobre-nos" className="py-40 bg-[#1F1235] px-8 text-center">
        <div className="max-w-6xl mx-auto reveal transition-all duration-1000 transform translate-y-10 opacity-0">
          <h2 className="text-5xl md:text-7xl font-black mb-10 uppercase italic">SOBRE NÓS</h2>
          <p className="text-2xl md:text-4xl text-yellow-400 font-medium leading-tight mb-12 italic max-w-5xl mx-auto">"Aqui também é possível vencer."</p>
          <div className="h-2 w-24 bg-purple-500 mx-auto rounded-full opacity-30"></div>
          <p className="mt-12 text-purple-100/80 text-lg max-w-3xl mx-auto leading-relaxed">
            O Instituto Tia Pretinha é um projeto que nasceu do coração da comunidade para oferecer esporte, cultura e educação para quem mais precisa.
          </p>
        </div>
      </section>

      {/* PROJETOS - APENAS ESTA SEÇÃO */}
<section id="projetos" className="py-40 px-8 bg-[#1F1235]">
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
      <section id="galeria" className="py-40 bg-[#1F1235] px-8">
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
      <section id="transparencia" className="py-40 bg-[#2D1B4D] px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-20 gap-8 reveal transition-all duration-1000 opacity-0 translate-y-10">
            <div>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">Prestação de <br/><span className="text-yellow-400">Contas</span></h2>
              <p className="mt-6 text-purple-200/60 max-w-xl text-lg uppercase font-black tracking-widest mx-auto md:mx-0">Transparência total com cada centavo investido no futuro.</p>
            </div>
            <div className="bg-yellow-400 text-purple-950 px-8 py-4 rounded-2xl font-black text-2xl animate-pulse shadow-xl shadow-yellow-400/20">
              EM BREVE!
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-40 grayscale">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#1F1235] p-10 rounded-[3rem] border border-white/10 shadow-lg reveal transition-all duration-700 opacity-0 translate-y-10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full mb-6 flex items-center justify-center text-purple-400">📄</div>
                <div className="w-full h-4 bg-white/10 rounded-full mb-4"></div>
                <div className="w-2/3 h-4 bg-white/5 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MATRICULE-SE */}
      <section id="matricule-se" className="py-32 bg-yellow-400 text-purple-950 px-8 text-center reveal transition-all duration-1000 opacity-0 translate-y-10">
        <h2 className="text-5xl md:text-8xl font-black mb-10 uppercase tracking-tighter italic text-center">MATRICULE-SE</h2>
        <a href="https://forms.gle/wddeiiAL3Fgn8feJ8" target="_blank" rel="noopener noreferrer" className="inline-block bg-purple-950 text-white px-16 py-6 rounded-3xl font-black text-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform uppercase">Inscrição Online</a>
      </section>

      {/* AJUDA / PIX */}
      <section id="como-ajudar" className="py-40 px-8 bg-[#2D1B4D]">
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
      <section id="contato" className="py-40 bg-[#1F1235] px-8">
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
          <div className="bg-white text-purple-950 max-w-2xl w-full rounded-[4rem] p-12 relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <button onClick={() => setProjetoSelecionado(null)} className="absolute top-8 right-10 text-3xl font-black">✕</button>
            <h3 className="text-4xl font-black uppercase mb-6 tracking-tighter">{projetoSelecionado.titulo}</h3>
            <p className="text-xl text-slate-700 mb-10 leading-relaxed font-light italic">"{projetoSelecionado.detalhe}"</p>
            <button onClick={() => setProjetoSelecionado(null)} className="bg-purple-700 text-white px-8 py-5 rounded-2xl font-black w-full uppercase tracking-widest shadow-lg">Fechar</button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-black py-16 px-8 text-center border-t border-white/5">
        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">© 2025 Instituto Tia Pretinha • Todos os direitos reservados</p>
        <p className="text-[11px] text-yellow-500/50 font-black uppercase tracking-widest mt-6 italic">Arquitetura Digital por Erick Gonçalves Cardoso</p>
      </footer>
    </div>
  )
}



export default App