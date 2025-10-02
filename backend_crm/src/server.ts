import app from './app';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err instanceof Error ? err.stack : err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason instanceof Error ? reason.stack : reason);
  process.exit(1);
});

const port = Number(process.env.PORT) || 3333;

try {
  app.listen(port, () => {
    console.log();
    console.log(`Escutando na porta ${port}`);
    console.log(`CTRL + Clique em http://localhost:${port}`);
    console.log();
  });
} catch (error) {
  console.error('Erro fatal ao iniciar o servidor:', error);
  process.exit(1);
}
