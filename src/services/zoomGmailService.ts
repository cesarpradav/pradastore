import { PhoneItem, ItemStatus } from '../types';

export interface ZoomEmailEvent {
  messageId: string;
  threadId: string;
  date: string;
  from: string;
  subject: string;
  snippet: string;
  
  // Datos extraídos
  eventType: 'llegada_miami' | 'factura_emitida' | 'disponible_agencia' | 'entregado' | 'desconocido';
  eventTitle: string;
  detectedUsTracking?: string;
  detectedZoomTracking?: string;
  detectedCostBcv?: number;
  detectedWeightKg?: number;
  detectedAgency?: string;
  
  // Coincidencia con inventario
  matchedPhone?: PhoneItem;
  applied?: boolean;
}

/**
 * Decodifica cadenas base64url que devuelve la API de Gmail
 */
function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return '';
  }
}

/**
 * Extrae texto legible de las partes del correo de Gmail
 */
function extractBodyText(payload: any): string {
  if (!payload) return '';
  let text = '';

  if (payload.body && payload.body.data) {
    text += ' ' + decodeBase64Url(payload.body.data);
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += ' ' + decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        // Quitar etiquetas HTML básicas para obtener texto
        const clean = html.replace(/<[^>]*>/g, ' ');
        text += ' ' + clean;
      } else if (part.parts) {
        text += ' ' + extractBodyText(part);
      }
    }
  }

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Analiza el texto del correo de Zoom para extraer datos clave
 */
export function parseZoomEmailContent(
  subject: string, 
  body: string, 
  snippet: string
): Omit<ZoomEmailEvent, 'messageId' | 'threadId' | 'date' | 'from'> {
  const fullText = `${subject} ${snippet} ${body}`.toLowerCase();

  // 1. Detectar tipo de evento
  let eventType: ZoomEmailEvent['eventType'] = 'desconocido';
  let eventTitle = 'Notificación General de Zoom';

  if (
    /entregado|entrega\s*exitosa|retiro\s*conforme|paquete\s*retirado|ha\s*sido\s*entregado/i.test(fullText)
  ) {
    eventType = 'entregado';
    eventTitle = '✅ Paquete Retirado en Zoom';
  } else if (
    /disponible\s*en\s*agencia|listo\s*para\s*retirar|en\s*oficina\s*destino|llegada\s*a\s*agencia/i.test(fullText)
  ) {
    eventType = 'disponible_agencia';
    eventTitle = '🏢 Disponible para Retirar en Agencia';
  } else if (
    /factura|flete\s*a\s*pagar|monto\s*a\s*cancelar|su\s*env[íi]o\s*ha\s*sido\s*procesado|gu[íi]a\s*emitida|flete\s*facturado/i.test(fullText)
  ) {
    eventType = 'factura_emitida';
    eventTitle = '🧾 Factura & Guía Zoom Emitida';
  } else if (
    /recibido\s*en\s*miami|recepci[óo]n\s*en\s*casillero|ingreso\s*a\s*casillero|paquete\s*recibido/i.test(fullText)
  ) {
    eventType = 'llegada_miami';
    eventTitle = '📦 Recibido en Casillero Miami';
  }

  // 2. Extraer Tracking USA (USPS, UPS, FedEx, DHL, etc.)
  let detectedUsTracking: string | undefined;
  const usTrackingRegexes = [
    /\b(94[0-9]{20})\b/i,
    /\b(92[0-9]{20})\b/i,
    /\b(93[0-9]{20})\b/i,
    /\b(1Z[0-9A-Z]{16})\b/i,
    /\b([0-9]{12,15})\b/i,
    /(?:tracking|gu[íi]a\s*origen|tracking\s*usa|remesa)[\s\S]{0,30}?\b([0-9A-Z]{10,24})\b/i,
  ];

  for (const regex of usTrackingRegexes) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      detectedUsTracking = match[1].toUpperCase();
      break;
    }
  }

  // 3. Extraer Guía Zoom
  let detectedZoomTracking: string | undefined;
  const zoomRegexes = [
    /\b(ZM-[0-9A-Z-]+)\b/i,
    /(?:gu[íi]a\s*zoom|nro\.?\s*gu[íi]a|gu[íi]a\s*nacional|c[óo]digo\s*zoom)[\s\S]{0,25}?\b([0-9]{10,12}|ZM-[0-9A-Z-]+)\b/i,
  ];

  for (const regex of zoomRegexes) {
    const match = fullText.match(regex);
    if (match && match[1]) {
      detectedZoomTracking = match[1].toUpperCase();
      break;
    }
  }

  // 4. Extraer Costo en $ BCV
  let detectedCostBcv: number | undefined;
  const costMatch = fullText.match(/(?:monto|total|flete|costo|facturado|importe)[\s\S]{0,35}?(?:USD|\$)?\s*([0-9]+[.,][0-9]{2})/i);
  if (costMatch && costMatch[1]) {
    const normalized = costMatch[1].replace(',', '.');
    const val = parseFloat(normalized);
    if (!isNaN(val) && val > 0 && val < 500) {
      detectedCostBcv = val;
    }
  }

  // 5. Extraer Agencia Destino
  let detectedAgency: string | undefined;
  const agencyMatch = fullText.match(/(?:agencia|destino|oficina|retirar\s*en)[\s\S]{0,40}?(ZOOM\s+[A-Za-z\s]+|Barinas|Bole[íi]ta|Valencia|Caracas)/i);
  if (agencyMatch && agencyMatch[1]) {
    const name = agencyMatch[1].trim();
    detectedAgency = name.toLowerCase().startsWith('zoom') ? name : `ZOOM ${name}`;
  }

  return {
    subject,
    snippet,
    eventType,
    eventTitle,
    detectedUsTracking,
    detectedZoomTracking,
    detectedCostBcv,
    detectedAgency,
  };
}

/**
 * Consulta la API de Gmail para encontrar correos de Zoom
 */
export async function fetchZoomEmailsFromGmail(
  accessToken: string,
  phones: PhoneItem[],
  maxResults = 25
): Promise<ZoomEmailEvent[]> {
  if (!accessToken) {
    throw new Error('No hay token de acceso a Gmail. Inicia sesión con Google.');
  }

  // Consulta amplia para capturar notificaciones de casillero y rastreo de Zoom
  const query = 'from:zoom.red OR from:zoom OR "ZOOM Casillero" OR "Guía ZOOM" OR "Grupo ZOOM" OR "ZOOM Envíos"';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const errBody = await listRes.text();
    if (listRes.status === 401) {
      throw new Error('AUTH_EXPIRED: La sesión de Google ha expirado. Por favor vuelve a conectar tu cuenta.');
    }
    if (
      listRes.status === 403 &&
      (errBody.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
       errBody.includes('insufficientPermissions') ||
       errBody.includes('insufficient authentication scopes'))
    ) {
      throw new Error('SCOPE_INSUFFICIENT: Permisos insuficientes de Gmail. Debes autorizar el acceso de lectura en la pantalla de consentimiento de Google.');
    }
    throw new Error(`Error de Gmail API (${listRes.status}): ${errBody}`);
  }

  const listData = await listRes.json();
  const messages: { id: string; threadId: string }[] = listData.messages || [];

  if (messages.length === 0) {
    return [];
  }

  // Consultar detalles de los correos encontrados
  const events: ZoomEmailEvent[] = [];

  for (const item of messages.slice(0, 15)) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!msgRes.ok) continue;
      const msgData = await msgRes.json();

      const headers = msgData.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const date = getHeader('Date');
      const snippet = msgData.snippet || '';
      const body = extractBodyText(msgData.payload);

      const parsed = parseZoomEmailContent(subject, body, snippet);

      // Vincular con un iPhone de nuestro inventario
      let matchedPhone: PhoneItem | undefined;

      if (parsed.detectedUsTracking) {
        matchedPhone = phones.find((p) => {
          if (!p.usTrackingNumber) return false;
          const cleanPhoneTrack = p.usTrackingNumber.trim().toUpperCase();
          const cleanEmailTrack = parsed.detectedUsTracking!.trim().toUpperCase();
          return cleanPhoneTrack === cleanEmailTrack || cleanPhoneTrack.includes(cleanEmailTrack) || cleanEmailTrack.includes(cleanPhoneTrack);
        });
      }

      if (!matchedPhone && parsed.detectedZoomTracking) {
        matchedPhone = phones.find((p) => {
          if (!p.zoomTrackingNumber) return false;
          return p.zoomTrackingNumber.trim().toUpperCase() === parsed.detectedZoomTracking!.trim().toUpperCase();
        });
      }

      events.push({
        messageId: item.id,
        threadId: item.threadId,
        date,
        from,
        ...parsed,
        matchedPhone,
      });
    } catch (e) {
      console.warn('Error leyendo mensaje individual de Gmail:', e);
    }
  }

  return events;
}

/**
 * Aplica los datos detectados de un correo de Zoom a un PhoneItem
 */
export function applyZoomEventToPhone(phone: PhoneItem, event: ZoomEmailEvent): PhoneItem {
  const updated: PhoneItem = { ...phone, updatedAt: new Date().toISOString() };

  if (event.detectedZoomTracking && !updated.zoomTrackingNumber) {
    updated.zoomTrackingNumber = event.detectedZoomTracking;
  }

  if (event.detectedCostBcv && (!updated.zoomCostBcv || updated.zoomCostStatus !== 'known')) {
    updated.zoomCostBcv = event.detectedCostBcv;
    updated.zoomCostStatus = 'known';
  }

  if (event.detectedAgency && (!updated.zoomAgency || updated.zoomAgency === 'ZOOM Barinas')) {
    updated.zoomAgency = event.detectedAgency;
  }

  // Actualización de estado según el hito
  switch (event.eventType) {
    case 'llegada_miami':
      updated.isPrealerted = true;
      if (updated.status === 'en_transito_usa') {
        updated.status = 'en_casillero_zoom';
      }
      break;

    case 'factura_emitida':
      updated.isPrealerted = true;
      updated.zoomCostStatus = 'known';
      if (event.detectedCostBcv) {
        updated.zoomCostBcv = event.detectedCostBcv;
      }
      if (updated.status === 'en_transito_usa') {
        updated.status = 'en_casillero_zoom';
      }
      break;

    case 'disponible_agencia':
      updated.isPrealerted = true;
      if (updated.status !== 'vendido' && updated.status !== 'disponible_para_venta') {
        updated.status = 'en_agencia_zoom';
      }
      break;

    case 'entregado':
      updated.isZoomPickedUp = true;
      updated.zoomPickupDate = new Date().toISOString().split('T')[0];
      if (updated.status !== 'vendido') {
        updated.status = 'disponible_para_venta';
      }
      break;
  }

  return updated;
}
