export function blockUnauthenticatedDeployment(res) {
  if (!process.env.VERCEL) return false;

  res.status(503).json({
    error: 'API temporariamente indisponível enquanto a autenticação está sendo configurada.',
  });
  return true;
}
