import { Component } from 'react';
import { reportarErro } from './reportarErro';

// Sem isso, um crash em App.jsx durante o render deixa a tela em branco
// pro visitante do site publico, sem nenhum fallback (achado na
// varredura de pontos cegos de erro, 2026-09-11). O Application Insights
// (appInsights.js) ja rastreia excecoes automaticamente, mas isso e' um
// canal separado do catalogo de erros da VM (SharePoint/Parquet) - por
// isso reporta tambem pro /frontend-logs do erp_itp (mesmo dominio ja
// liberado no CSP/CORS), pra unificar num so lugar.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    reportarErro(error.message, error.stack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
          textAlign: 'center', fontFamily: 'system-ui, sans-serif',
        }}>
          <p style={{ fontSize: 15, color: '#475569' }}>Algo deu errado nesta página.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12,
              padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
