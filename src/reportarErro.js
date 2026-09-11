// Reporta pro mesmo /frontend-logs do erp_itp, unificando com o catálogo
// de erros da VM em vez de ficar só no Application Insights isolado.
export function reportarErro(message, stack) {
  fetch('https://api.itp.institutotiapretinha.org/api/frontend-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      stack,
      pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
      origem: 'site-institucional',
    }),
  }).catch(() => {});
}
