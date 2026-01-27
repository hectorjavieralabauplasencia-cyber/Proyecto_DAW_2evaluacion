import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// Base de la nueva API (TCGdex)
const TCG_API_BASE = 'https://api.tcgdex.net/v2/en/cards';

// CORS básico para tu frontend
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Ruta para obtener cartas con paginación
app.get('/api/cards', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = parseInt(req.query.pageSize || '20', 10);

    const url = `${TCG_API_BASE}?pagination:page=${page}&pagination:itemsPerPage=${pageSize}`;
    console.log('Llamando a TCGdex API:', url);

    const apiRes = await fetch(url);
    console.log('Respuesta TCGdex status:', apiRes.status);

    if (!apiRes.ok) {
      const errorText = await apiRes.text().catch(() => '');
      console.log('Error TCGdex cuerpo:', errorText);
      return res.status(500).json({ error: 'API error' });
    }

    // TCGdex devuelve un array de cartas
    const cards = await apiRes.json();

    const mapped = cards.map(card => {
      // Precio aproximado desde markets (si está disponible)
      const cm = card.pricing?.cardmarket || {};
      const price =
        cm['avg30-holo'] ??
        cm['avg-holo'] ??
        cm['avg30'] ??
        cm['avg'] ??
        null;

      return {
        id: card.id,               // ej: "lc-1"
        localId: card.localId,     // ej: "1"
        name: card.name,           // ej: "Alakazam"
        imageUrl: card.image ? `${card.image}/low.png` : null,
        apiRarity: card.rarity || null,
        priceEur: price
      };
    });

    res.json({
      data: mapped,
      count: mapped.length,
      totalCount: mapped.length
    });
  } catch (err) {
    console.error('Error servidor proxy:', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Proxy PokeMarket escuchando en http://localhost:${PORT}`);
});
