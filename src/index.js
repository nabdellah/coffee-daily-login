import app from './server.js';

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Sector Daily Logger running at http://localhost:${PORT}`);
});
