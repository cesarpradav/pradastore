import express from 'express';
import { setupRatesRoutes } from '../src/server/rates';
import { setupEbayRoutes } from '../src/server/ebayScraper';

const app = express();
app.use(express.json());

// Configurar endpoints de backend
setupRatesRoutes(app);
setupEbayRoutes(app);

export default app;
