import express, { Request, Response } from 'express';

// Helper to extract high-res image URLs from text or HTML
export function extractEbayImageUrls(content: string): string[] {
  if (!content) return [];
  
  // Find all i.ebayimg.com URLs
  const regex = /https?:\/\/i\.ebayimg\.com\/images\/g\/[a-zA-Z0-9~_\-]+\/s-l\d+\.(?:jpg|png|webp|jpeg)/gi;
  const matches = content.match(regex) || [];
  
  // Convert all thumbnail sizes (s-l300, s-l500, s-l640, etc.) to highest resolution s-l1600
  const highRes = matches.map((img) => img.replace(/\/s-l\d+\./, '/s-l1600.'));
  
  // Return unique list
  return Array.from(new Set(highRes));
}

export function setupEbayRoutes(app: express.Express) {
  app.post('/api/extract-ebay-images', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'URL requerida' });
      }

      const cleanUrl = url.trim();

      // Caso 1: El usuario pegó directamente un link de imagen de eBay o de cualquier web
      if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || cleanUrl.includes('i.ebayimg.com')) {
        const normalized = cleanUrl.replace(/\/s-l\d+\./, '/s-l1600.');
        return res.json({
          success: true,
          images: [normalized],
          message: 'Imagen directa detectada',
        });
      }

      // Caso 2: URL de publicación de eBay
      const itemIdMatch = cleanUrl.match(/\/itm\/(?:[^\/]+\/)?(\d{9,16})/i) || cleanUrl.match(/\b(\d{12})\b/);
      const itemId = itemIdMatch ? itemIdMatch[1] : null;

      // Intentar consultar la página con headers de navegador
      const targetUrls = itemId 
        ? [
            `https://www.ebay.com/itm/${itemId}`,
            cleanUrl
          ]
        : [cleanUrl];

      for (const target of targetUrls) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(target, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });
          clearTimeout(timeout);

          if (response.ok) {
            const html = await response.text();
            const extracted = extractEbayImageUrls(html);
            if (extracted.length > 0) {
              return res.json({
                success: true,
                images: extracted.slice(0, 10),
                itemId,
                message: `Se extrajeron ${extracted.length} fotos originales de eBay`,
              });
            }
          }
        } catch (fetchErr) {
          // Continuar con el siguiente intento
        }
      }

      // Si eBay bloquea el scraping por Cloud Akamai Challenge:
      return res.json({
        success: false,
        error: 'eBay requiere verificación antibot para esta URL. Puedes copiar la dirección de la imagen directamente desde eBay o pegarla con Ctrl+V / Subir foto.',
        itemId,
      });
    } catch (err: any) {
      console.error('Error in /api/extract-ebay-images:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Error del servidor' });
    }
  });
}
