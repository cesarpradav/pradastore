import React, { useState, useEffect, useMemo } from 'react';
import { PhoneItem, CurrencyRates, PhoneCondition, ItemStatus } from '../types';
import { 
  X, 
  Plus, 
  ExternalLink, 
  DollarSign, 
  Truck, 
  ShieldCheck, 
  Calculator, 
  Check, 
  AlertCircle,
  HelpCircle,
  Package,
  Search,
  ArrowUpRight,
  Sparkles,
  Smartphone,
  Layers,
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
  Star,
  Link,
  Camera,
  Loader2,
  Hash,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  ClipboardPaste,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';
import { 
  convertZoomBcvToUsdt, 
  calculateRealCostUsdt, 
  calculateProjectedProfit, 
  calculateRealProfit,
  formatUsdt,
  formatBcv,
  formatBs
} from '../utils/calculations';
import { detectCarrier, getTrackingUrl, CARRIERS } from '../utils/tracking';
import { IPHONE_PRESETS, findPresetModel, IPhonePresetModel } from '../data/iphonePresets';
import { compressImageFile, normalizeEbayImageUrl } from '../utils/imageCompressor';
import { getPresetIPhoneImage } from '../data/iphoneImages';
import { parseEbayOrderText, ParsedEbayOrder } from '../utils/ebayParser';

interface PhoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<PhoneItem>) => void;
  editingItem?: PhoneItem | null;
  rates: CurrencyRates;
  existingPhones?: PhoneItem[];
}

const CONDITIONS: PhoneCondition[] = ['Nuevo', 'Como Nuevo', 'Excelente', 'Buen Estado', 'Para Repuesto', 'Otro'];

export const PhoneFormModal: React.FC<PhoneFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  rates,
  existingPhones = [],
}) => {
  // Form State
  const [model, setModel] = useState('');
  const [condition, setCondition] = useState<PhoneCondition>('Excelente');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('');
  const [imei, setImei] = useState('');
  const [imei2, setImei2] = useState('');
  const [physicalGrade, setPhysicalGrade] = useState('');
  
  // eBay
  const [ebayLink, setEbayLink] = useState('');
  const [ebayOrderNumber, setEbayOrderNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Costs
  const [productCostUsdt, setProductCostUsdt] = useState<string>('0');
  const [hasUsShippingCost, setHasUsShippingCost] = useState<boolean>(false);
  const [usShippingCostUsdt, setUsShippingCostUsdt] = useState<string>('0');
  const [additionalCostUsdt, setAdditionalCostUsdt] = useState<string>('0');
  
  // Tracking USA & Pre-alerta Zoom
  const [usTrackingNumber, setUsTrackingNumber] = useState('');
  const [usCarrier, setUsCarrier] = useState('USPS');
  const [isPrealerted, setIsPrealerted] = useState<boolean>(false);
  const [zoomTrackingNumber, setZoomTrackingNumber] = useState('');
  const [showEarlyZoomTracking, setShowEarlyZoomTracking] = useState(false);
  
  // Zoom Cost
  const [zoomCostStatus, setZoomCostStatus] = useState<'known' | 'pending'>('pending');
  const [zoomCostBcv, setZoomCostBcv] = useState<string>('0');
  
  // Zoom Payment & Pickup
  const [isZoomPaid, setIsZoomPaid] = useState<boolean>(false);
  const [zoomPaidAmountBcv, setZoomPaidAmountBcv] = useState<string>('0');
  const [zoomPaymentMethod, setZoomPaymentMethod] = useState<'Bolívares (BCV)' | 'Dólares Efectivo' | 'Pago Móvil' | 'Transferencia'>('Pago Móvil');
  const [isZoomPickedUp, setIsZoomPickedUp] = useState<boolean>(false);
  const [zoomAgency, setZoomAgency] = useState('ZOOM Barinas');
  
  // Sales & Projection
  const [projectedPriceUsdt, setProjectedPriceUsdt] = useState<string>('0');
  const [status, setStatus] = useState<ItemStatus>('en_transito_usa');
  const [soldPriceUsdt, setSoldPriceUsdt] = useState<string>('');
  const [soldDate, setSoldDate] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerIdNumber, setBuyerIdNumber] = useState('');
  const [soldPaymentMethod, setSoldPaymentMethod] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [batteryHealth, setBatteryHealth] = useState<string>('');
  const [accessories, setAccessories] = useState<string>('');
  const [warrantyDays, setWarrantyDays] = useState<string>('30');
  const [notes, setNotes] = useState('');

  // Photos & eBay Extraction
  const [images, setImages] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string>('');
  const [isExtractingEbay, setIsExtractingEbay] = useState<boolean>(false);
  const [ebayExtractFeedback, setEbayExtractFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [manualImageUrl, setManualImageUrl] = useState<string>('');
  const [showManualUrlInput, setShowManualUrlInput] = useState<boolean>(false);

  // Anti-duplicados por Número de Orden de eBay
  const [allowDuplicateOrder, setAllowDuplicateOrder] = useState<boolean>(false);

  // Normalizar número de orden (eliminar "Order #", espacios)
  const cleanOrderNumber = useMemo(() => {
    return ebayOrderNumber.trim().replace(/^order\s*(number|#)?\s*[:.-]?\s*/i, '').trim();
  }, [ebayOrderNumber]);

  // Buscar si otra unidad ya tiene este mismo Order Number
  const duplicateOrderPhone = useMemo(() => {
    if (!cleanOrderNumber || cleanOrderNumber.length < 3) return null;
    const normalizedInput = cleanOrderNumber.toLowerCase();
    return (existingPhones || []).find((p) => {
      if (editingItem && p.id === editingItem.id) return false;
      if (!p.ebayOrderNumber) return false;
      const existingClean = p.ebayOrderNumber.trim().replace(/^order\s*(number|#)?\s*[:.-]?\s*/i, '').trim().toLowerCase();
      return existingClean === normalizedInput;
    });
  }, [cleanOrderNumber, existingPhones, editingItem]);

  const handleOrderNumberChange = (val: string) => {
    let cleaned = val.trim();
    // Si pega un texto como "Order # 24-10492-83719" extraerlo automáticamente
    const match = val.match(/(?:order\s*(?:#|number|no)?\s*[:.-]?\s*)?([0-9]{2}-[0-9]{5}-[0-9]{5}|[0-9]{12,14})/i);
    if (match && match[1]) {
      cleaned = match[1];
    }
    setEbayOrderNumber(cleaned);
    if (allowDuplicateOrder) setAllowDuplicateOrder(false);
  };

  // Selector de Modelos Predeterminados (Prioridad iPhone 13 & 14)
  const [selectedSeriesTab, setSelectedSeriesTab] = useState<'13' | '14' | 'other'>('13');

  // ASISTENTE DE AUTOCOMPLETADO DESDE RECIBO DE EBAY
  const [showEbayParser, setShowEbayParser] = useState<boolean>(!editingItem);
  const [rawEbayText, setRawEbayText] = useState<string>('');
  const [parsedEbayOrder, setParsedEbayOrder] = useState<ParsedEbayOrder | null>(null);
  const [autoLoadAppleImage, setAutoLoadAppleImage] = useState<boolean>(true);
  const [ebayParseSuccessMessage, setEbayParseSuccessMessage] = useState<string | null>(null);

  // Parsear texto de orden en tiempo real
  const handleParseEbayText = (text: string) => {
    setRawEbayText(text);
    setEbayParseSuccessMessage(null);
    if (!text.trim()) {
      setParsedEbayOrder(null);
      return;
    }
    const parsed = parseEbayOrderText(text);
    setParsedEbayOrder(parsed);
  };

  // Pegar directo desde el portapapeles con 1 clic
  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText && clipText.trim()) {
        setShowEbayParser(true);
        handleParseEbayText(clipText);
      }
    } catch (e) {
      console.warn('No se pudo acceder al portapapeles directamente:', e);
    }
  };

  // Detectar si la orden en el preview ya existe en inventario
  const duplicateInPreview = useMemo(() => {
    if (!parsedEbayOrder?.orderNumber) return null;
    const clean = parsedEbayOrder.orderNumber.trim().toLowerCase();
    return (existingPhones || []).find((p) => {
      if (editingItem && p.id === editingItem.id) return false;
      if (!p.ebayOrderNumber) return false;
      const exClean = p.ebayOrderNumber.trim().toLowerCase();
      return exClean === clean;
    });
  }, [parsedEbayOrder?.orderNumber, existingPhones, editingItem]);

  // Aplicar datos detectados al formulario
  const handleApplyParsedEbay = () => {
    if (!parsedEbayOrder) return;
    let appliedCount = 0;

    if (parsedEbayOrder.orderNumber) {
      setEbayOrderNumber(parsedEbayOrder.orderNumber);
      appliedCount++;
    }
    if (parsedEbayOrder.purchaseDate) {
      setPurchaseDate(parsedEbayOrder.purchaseDate);
      appliedCount++;
    }
    if (parsedEbayOrder.productCostUsdt !== undefined) {
      setProductCostUsdt(parsedEbayOrder.productCostUsdt.toString());
      appliedCount++;
    }
    if (parsedEbayOrder.usShippingCostUsdt !== undefined) {
      setUsShippingCostUsdt(parsedEbayOrder.usShippingCostUsdt.toString());
      setHasUsShippingCost(parsedEbayOrder.hasUsShippingCost ?? false);
      appliedCount++;
    }
    if (parsedEbayOrder.trackingNumber) {
      setUsTrackingNumber(parsedEbayOrder.trackingNumber);
      appliedCount++;
    }
    if (parsedEbayOrder.carrier) {
      setUsCarrier(parsedEbayOrder.carrier);
    }
    if (parsedEbayOrder.ebayLink) {
      setEbayLink(parsedEbayOrder.ebayLink);
      appliedCount++;
    }
    if (parsedEbayOrder.model) {
      setModel(parsedEbayOrder.model);
      appliedCount++;
      if (parsedEbayOrder.model.includes('13')) setSelectedSeriesTab('13');
      if (parsedEbayOrder.model.includes('14')) setSelectedSeriesTab('14');
    }
    if (parsedEbayOrder.storage) {
      setStorage(parsedEbayOrder.storage);
      appliedCount++;
    }
    if (parsedEbayOrder.color) {
      setColor(parsedEbayOrder.color);
      appliedCount++;
    }
    if (parsedEbayOrder.condition) {
      setCondition(parsedEbayOrder.condition);
      appliedCount++;
    }
    if (parsedEbayOrder.sellerUsername && !notes) {
      setNotes(`Vendedor eBay: ${parsedEbayOrder.sellerUsername}`);
    }

    // Auto-asignar foto oficial Apple si está tildado y no hay fotos cargadas
    if (autoLoadAppleImage && parsedEbayOrder.model && parsedEbayOrder.color) {
      const presetImg = getPresetIPhoneImage(parsedEbayOrder.model, parsedEbayOrder.color);
      if (presetImg) {
        setImages((prev) => (prev.length === 0 ? [presetImg] : prev));
        setPrimaryImage((prev) => prev || presetImg);
      }
    }

    setEbayParseSuccessMessage(`¡Éxito! Se rellenaron automáticamente ${appliedCount} campos con los datos de eBay.`);
  };

  // Detectar preset coincidente con el modelo escrito
  const matchedPreset = useMemo(() => {
    return findPresetModel(model);
  }, [model]);

  // Modelos a mostrar según la pestaña activa
  const displayedPresets = useMemo(() => {
    if (selectedSeriesTab === '13') {
      return IPHONE_PRESETS.filter((p) => p.series === 'iPhone 13');
    }
    if (selectedSeriesTab === '14') {
      return IPHONE_PRESETS.filter((p) => p.series === 'iPhone 14');
    }
    return IPHONE_PRESETS.filter((p) => p.series !== 'iPhone 13' && p.series !== 'iPhone 14');
  }, [selectedSeriesTab]);

  const handleSelectPresetModel = (preset: IPhonePresetModel) => {
    setModel(preset.name);
    // Si el almacenamiento actual no está disponible para este modelo, seleccionar el primero válido (ej: 128GB)
    if (!preset.storages.includes(storage)) {
      setStorage(preset.storages[0] || '128GB');
    }
  };

  // Load existing data if editing
  useEffect(() => {
    if (editingItem) {
      setModel(editingItem.model || '');
      setCondition(editingItem.condition || 'Excelente');
      setStorage(editingItem.storage || '');
      setColor(editingItem.color || '');
      setImei(editingItem.imei || editingItem.imei1 || '');
      setImei2(editingItem.imei2 || '');
      setPhysicalGrade(editingItem.physicalGrade || '');
      setEbayLink(editingItem.ebayLink || '');
      setEbayOrderNumber(editingItem.ebayOrderNumber || '');
      setPurchaseDate(editingItem.purchaseDate || new Date().toISOString().split('T')[0]);
      setProductCostUsdt(editingItem.productCostUsdt?.toString() || '0');
      const hasShip = Boolean(editingItem.usShippingCostUsdt && editingItem.usShippingCostUsdt > 0);
      setHasUsShippingCost(hasShip);
      setUsShippingCostUsdt(editingItem.usShippingCostUsdt?.toString() || '0');
      setAdditionalCostUsdt(editingItem.additionalCostUsdt?.toString() || '0');
      setUsTrackingNumber(editingItem.usTrackingNumber || '');
      setUsCarrier(editingItem.usCarrier || 'USPS');
      setIsPrealerted(editingItem.isPrealerted ?? false);
      setZoomTrackingNumber(editingItem.zoomTrackingNumber || '');
      setShowEarlyZoomTracking(Boolean(editingItem.zoomTrackingNumber));
      setZoomCostStatus(editingItem.zoomCostStatus || 'pending');
      setZoomCostBcv(editingItem.zoomCostBcv?.toString() || '0');
      setIsZoomPaid(editingItem.isZoomPaid ?? false);
      setZoomPaidAmountBcv(editingItem.zoomPaidAmountBcv?.toString() || '0');
      setZoomPaymentMethod(editingItem.zoomPaymentMethod || 'Pago Móvil');
      setIsZoomPickedUp(editingItem.isZoomPickedUp ?? false);
      setZoomAgency(editingItem.zoomAgency !== undefined && editingItem.zoomAgency !== '' ? editingItem.zoomAgency : 'ZOOM Barinas');
      setProjectedPriceUsdt(editingItem.projectedPriceUsdt?.toString() || '0');
      setStatus(editingItem.status || 'en_transito_usa');
      setSoldPriceUsdt(editingItem.soldPriceUsdt !== undefined ? editingItem.soldPriceUsdt.toString() : '');
      setSoldDate(editingItem.soldDate || '');
      setBuyerName(editingItem.buyerName || '');
      setBuyerPhone(editingItem.buyerPhone || '');
      setBuyerIdNumber(editingItem.buyerIdNumber || '');
      setSoldPaymentMethod(editingItem.soldPaymentMethod || '');
      setReceiptNumber(editingItem.receiptNumber || '');
      setBatteryHealth(editingItem.batteryHealth !== undefined ? editingItem.batteryHealth.toString() : '');
      setAccessories(editingItem.accessories || '');
      setWarrantyDays(editingItem.warrantyDays !== undefined ? editingItem.warrantyDays.toString() : '30');
      setNotes(editingItem.notes || '');
      const existingImages = editingItem.images && editingItem.images.length > 0
        ? [...editingItem.images]
        : (editingItem.primaryImage ? [editingItem.primaryImage] : []);
      setImages(existingImages);
      setPrimaryImage(editingItem.primaryImage || existingImages[0] || '');
      setEbayExtractFeedback(null);
      setManualImageUrl('');
      setShowManualUrlInput(false);
      setRawEbayText('');
      setParsedEbayOrder(null);
      setEbayParseSuccessMessage(null);
      setShowEbayParser(false);
    } else {
      // Reset form
      setModel('');
      setCondition('Excelente');
      setStorage('128GB');
      setColor('');
      setImei('');
      setImei2('');
      setPhysicalGrade('');
      setEbayLink('');
      setEbayOrderNumber('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setProductCostUsdt('');
      setHasUsShippingCost(false);
      setUsShippingCostUsdt('0');
      setAdditionalCostUsdt('0');
      setUsTrackingNumber('');
      setUsCarrier('USPS');
      setIsPrealerted(false);
      setZoomTrackingNumber('');
      setShowEarlyZoomTracking(false);
      setZoomCostStatus('pending');
      setZoomCostBcv('');
      setIsZoomPaid(false);
      setZoomPaidAmountBcv('');
      setZoomPaymentMethod('Pago Móvil');
      setIsZoomPickedUp(false);
      setZoomAgency('ZOOM Barinas');
      setProjectedPriceUsdt('');
      setStatus('en_transito_usa');
      setSoldPriceUsdt('');
      setSoldDate('');
      setBuyerName('');
      setBuyerPhone('');
      setBuyerIdNumber('');
      setSoldPaymentMethod('');
      setReceiptNumber('');
      setBatteryHealth('');
      setAccessories('');
      setWarrantyDays('30');
      setNotes('');
      setImages([]);
      setPrimaryImage('');
      setEbayExtractFeedback(null);
      setManualImageUrl('');
      setShowManualUrlInput(false);
      setRawEbayText('');
      setParsedEbayOrder(null);
      setEbayParseSuccessMessage(null);
      setShowEbayParser(true);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Numeric parse for live preview
  const numProductCost = parseFloat(productCostUsdt) || 0;
  const numUsShippingCost = hasUsShippingCost ? (parseFloat(usShippingCostUsdt) || 0) : 0;
  const numAdditionalCost = parseFloat(additionalCostUsdt) || 0;
  const numZoomCostBcv = zoomCostStatus === 'known' ? (parseFloat(zoomCostBcv) || 0) : 0;
  const zoomCostInUsdt = convertZoomBcvToUsdt(numZoomCostBcv, rates);
  
  const tempRealCostUsdt = Number((numProductCost + numUsShippingCost + zoomCostInUsdt + numAdditionalCost).toFixed(2));
  const tempRealCostBs = Number(((numProductCost + numUsShippingCost + numAdditionalCost) * rates.binanceUsdtRate + (numZoomCostBcv * rates.bcvRate)).toFixed(2));

  const numProjectedPrice = parseFloat(projectedPriceUsdt) || 0;
  const tempProjectedProfitUsdt = Number((numProjectedPrice - tempRealCostUsdt).toFixed(2));
  const tempProjectedMargin = tempRealCostUsdt > 0 ? ((tempProjectedProfitUsdt / tempRealCostUsdt) * 100).toFixed(1) : '0';

  const numSoldPrice = parseFloat(soldPriceUsdt) || 0;
  const tempRealProfitUsdt = Number((numSoldPrice - tempRealCostUsdt).toFixed(2));
  const tempRealMargin = tempRealCostUsdt > 0 ? ((tempRealProfitUsdt / tempRealCostUsdt) * 100).toFixed(1) : '0';

  // Photo handlers
  const handleExtractEbayImages = async () => {
    if (!ebayLink.trim()) {
      setEbayExtractFeedback({
        type: 'error',
        text: 'Por favor ingresa primero el Link de la publicación de eBay arriba.',
      });
      return;
    }

    setIsExtractingEbay(true);
    setEbayExtractFeedback(null);

    try {
      const res = await fetch('/api/extract-ebay-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ebayLink.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'No se pudieron extraer las fotos automáticamente debido al bloqueo antibot de eBay.');
      }

      const extracted: string[] = data.images || [];
      if (extracted.length === 0) {
        setEbayExtractFeedback({
          type: 'info',
          text: 'No se detectaron imágenes en la publicación. Puedes copiar la imagen directamente desde eBay con Ctrl+V o usar Foto Oficial Apple.',
        });
        return;
      }

      // Merge avoiding duplicates
      const newImages = [...images];
      for (const img of extracted) {
        if (!newImages.includes(img)) {
          newImages.push(img);
        }
      }

      setImages(newImages);
      if (!primaryImage && newImages.length > 0) {
        setPrimaryImage(newImages[0]);
      }

      setEbayExtractFeedback({
        type: 'success',
        text: `¡Éxito! Se añadieron ${extracted.length} foto(s) en alta resolución desde eBay.`,
      });
    } catch (err: any) {
      setEbayExtractFeedback({
        type: 'error',
        text: err.message || 'eBay bloquea las peticiones automáticas de servidor. Puedes copiar la imagen en eBay y pegarla aquí con Ctrl+V, o usar Foto Oficial Apple.',
      });
    } finally {
      setIsExtractingEbay(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageFile(file, 900, 0.82);
        compressedList.push(compressed);
      }

      setImages((prev) => {
        const next = [...prev, ...compressedList];
        if (!primaryImage && next.length > 0) {
          setPrimaryImage(next[0]);
        }
        return next;
      });

      setEbayExtractFeedback({
        type: 'success',
        text: `Se añadieron ${compressedList.length} imagen(es) optimizadas para almacenamiento ligero.`,
      });
    } catch {
      setEbayExtractFeedback({
        type: 'error',
        text: 'Error al procesar las imágenes locales.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleAddManualUrl = () => {
    if (!manualImageUrl.trim()) return;
    const cleanUrl = normalizeEbayImageUrl(manualImageUrl.trim());
    if (!images.includes(cleanUrl)) {
      const next = [...images, cleanUrl];
      setImages(next);
      if (!primaryImage) {
        setPrimaryImage(cleanUrl);
      }
      setEbayExtractFeedback({
        type: 'success',
        text: 'Foto añadida desde enlace.',
      });
    }
    setManualImageUrl('');
    setShowManualUrlInput(false);
  };

  const handleAddOfficialPresetImage = () => {
    const presetImg = getPresetIPhoneImage(model, color);
    if (!presetImg) {
      setEbayExtractFeedback({
        type: 'info',
        text: `No hay foto oficial predeterminada para "${model || 'este modelo'}". Puedes subir fotos personalizadas.`,
      });
      return;
    }

    if (!images.includes(presetImg)) {
      setImages((prev) => [presetImg, ...prev]);
    }
    setPrimaryImage(presetImg);
    setEbayExtractFeedback({
      type: 'success',
      text: `Se asignó la foto oficial de Apple para ${model} (${color || 'Color estándar'}).`,
    });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const removedImg = images[indexToRemove];
    const newImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(newImages);
    if (primaryImage === removedImg) {
      setPrimaryImage(newImages[0] || '');
    }
  };

  const handleSetPrimary = (img: string) => {
    setPrimaryImage(img);
  };

  const handlePasteImage = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            const compressed = await compressImageFile(file, 900, 0.82);
            setImages((prev) => {
              const next = [...prev, compressed];
              if (!primaryImage) setPrimaryImage(compressed);
              return next;
            });
            setEbayExtractFeedback({
              type: 'success',
              text: 'Foto pegada directamente desde el portapapeles.',
            });
          } catch {
            // ignore
          }
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) return;

    // Validación anti-duplicados por Order Number de eBay
    if (duplicateOrderPhone && !allowDuplicateOrder) {
      alert(
        `⚠️ ALERTA DE DUPLICADO: Ya existe un equipo con el Order Number "${cleanOrderNumber}" (${duplicateOrderPhone.model}, comprado el ${duplicateOrderPhone.purchaseDate}).\n\nPor favor verifica para evitar cargar la misma compra dos veces. Si compraste varios teléfonos juntos en la misma orden, activa la casilla "Permitir guardar de todos modos".`
      );
      return;
    }

    const data: Partial<PhoneItem> = {
      model: model.trim(),
      condition,
      storage: storage.trim() || undefined,
      color: color.trim() || undefined,
      imei: imei.trim() || undefined,
      imei1: imei.trim() || undefined,
      imei2: imei2.trim() || undefined,
      physicalGrade: physicalGrade.trim() || undefined,
      batteryHealth: batteryHealth.trim() ? parseInt(batteryHealth, 10) : undefined,
      accessories: accessories.trim() || undefined,
      warrantyDays: warrantyDays.trim() ? parseInt(warrantyDays, 10) : undefined,
      ebayLink: ebayLink.trim(),
      ebayOrderNumber: ebayOrderNumber.trim() || undefined,
      purchaseDate,
      productCostUsdt: numProductCost,
      usShippingCostUsdt: numUsShippingCost,
      additionalCostUsdt: numAdditionalCost,
      usTrackingNumber: usTrackingNumber.trim(),
      usCarrier,
      isPrealerted,
      prealertDate: isPrealerted ? (editingItem?.prealertDate || new Date().toISOString().split('T')[0]) : undefined,
      zoomTrackingNumber: isPrealerted ? (zoomTrackingNumber.trim() || undefined) : undefined,
      zoomCostStatus: isPrealerted ? zoomCostStatus : 'pending',
      zoomCostBcv: isPrealerted && zoomCostStatus === 'known' ? numZoomCostBcv : 0,
      isZoomPaid: isPrealerted && zoomCostStatus === 'known' ? isZoomPaid : false,
      zoomPaidAmountBcv: isPrealerted && zoomCostStatus === 'known' && isZoomPaid ? (parseFloat(zoomPaidAmountBcv) || numZoomCostBcv) : 0,
      zoomPaymentMethod: isPrealerted && zoomCostStatus === 'known' && isZoomPaid ? zoomPaymentMethod : undefined,
      isZoomPickedUp: isPrealerted && zoomCostStatus === 'known' ? isZoomPickedUp : false,
      zoomPickupDate: isPrealerted && zoomCostStatus === 'known' && isZoomPickedUp ? (editingItem?.zoomPickupDate || new Date().toISOString().split('T')[0]) : undefined,
      zoomAgency: isPrealerted ? (zoomAgency.trim() || 'ZOOM Barinas') : undefined,
      projectedPriceUsdt: numProjectedPrice,
      status,
      soldPriceUsdt: status === 'vendido' && numSoldPrice > 0 ? numSoldPrice : undefined,
      soldDate: status === 'vendido' ? (soldDate || new Date().toISOString().split('T')[0]) : undefined,
      buyerName: buyerName.trim() || undefined,
      buyerPhone: buyerPhone.trim() || undefined,
      buyerIdNumber: buyerIdNumber.trim() || undefined,
      soldPaymentMethod: soldPaymentMethod.trim() || undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      images: images.length > 0 ? images : undefined,
      primaryImage: primaryImage || (images.length > 0 ? images[0] : undefined),
    };

    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingItem ? 'Editar Teléfono en Inventario' : 'Registrar Nueva Importación (eBay ➔ Zoom)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detalles del producto, flete en Zoom, costos en USDT/BCV y proyección de venta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* ASISTENTE DE AUTOCOMPLETADO DESDE RECIBO / TEXTO DE EBAY */}
          <div className="rounded-2xl border border-amber-500/40 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900/90 p-4 shadow-sm transition-all space-y-3">
            {/* Header del Asistente */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                      Autocompletar con Recibo o Texto de eBay
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      ⚡ Asistente 1-Clic
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Copia y pega la orden de eBay para rellenar Order Number, costo, envío en USA, tracking, modelo y fotos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition cursor-pointer"
                  title="Pegar texto copiado de eBay directamente del portapapeles"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Pegar del Portapapeles</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEbayParser(!showEbayParser)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  title={showEbayParser ? 'Minimizar asistente' : 'Expandir asistente'}
                >
                  {showEbayParser ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Contenido Expandido del Asistente */}
            {showEbayParser && (
              <div className="space-y-3 pt-2 border-t border-amber-500/20 dark:border-amber-500/20">
                {/* Textarea para pegar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Pega aquí cualquier texto de tu compra en eBay (recibo, detalles de orden o correo):
                    </label>
                    <div className="flex items-center gap-2">
                      {/* Botón de ejemplo para prueba rápida */}
                      <button
                        type="button"
                        onClick={() => {
                          const sample = `Order info\nTime placed\tSep 23, 2026 at 1:27 PM\nOrder number\t16-15194-69056\nTotal\t$208.17 (1 item)\nSold by\tjiangh1987\nTracking details\nNumber\t9434608106244588086927\nItem info\nApple iPhone 13 128GB Blue iOS Smartphone 12MP Camera Bar MLAE3LL/A\n$200.00Unit price $200.00\nItem number: 327370889208\nUsedUsed\n1 item\n$200.00\nShipping\n$8.17\nOrder total\t$208.17`;
                          handleParseEbayText(sample);
                        }}
                        className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
                      >
                        Cargar ejemplo
                      </button>
                      {rawEbayText && (
                        <button
                          type="button"
                          onClick={() => {
                            setRawEbayText('');
                            setParsedEbayOrder(null);
                            setEbayParseSuccessMessage(null);
                          }}
                          className="text-slate-400 hover:text-rose-500 transition text-[10px]"
                        >
                          Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={rawEbayText}
                    onChange={(e) => handleParseEbayText(e.target.value)}
                    placeholder={`Order info
Time placed	Sep 23, 2026 at 1:27 PM
Order number	16-15194-69056
Total	$208.17 (1 item)
Tracking details Number 9434608106244588086927
Item info Apple iPhone 13 128GB Blue...
$200.00 Unit price
Item number: 327370889208
Shipping $8.17...`}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500 transition shadow-inner"
                  />
                </div>

                {/* Previsualización en Vivo de los Datos Detectados */}
                {parsedEbayOrder && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-amber-500/40 dark:border-amber-500/30 space-y-3 shadow-xs animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {parsedEbayOrder.detectedCount > 0 
                            ? `✓ Información detectada (${parsedEbayOrder.detectedCount} campos listos para aplicar)`
                            : 'No se pudieron detectar campos automáticamente. Puedes escribir los datos manualmente abajo.'}
                        </span>
                      </div>

                      {duplicateInPreview && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ¡Orden #{duplicateInPreview.ebayOrderNumber} ya existe en inventario!
                        </span>
                      )}
                    </div>

                    {/* Grid de Campos Detectados */}
                    {parsedEbayOrder.detectedCount > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        {/* 1. Order Number */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Order Number
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {parsedEbayOrder.orderNumber ? `#${parsedEbayOrder.orderNumber}` : '—'}
                          </span>
                        </div>

                        {/* 2. Modelo */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Modelo
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate block" title={parsedEbayOrder.model}>
                            {parsedEbayOrder.model || '—'}
                          </span>
                        </div>

                        {/* 3. Capacidad & Color */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Capacidad / Color
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {parsedEbayOrder.storage || '—'} {parsedEbayOrder.color ? `• ${parsedEbayOrder.color}` : ''}
                          </span>
                        </div>

                        {/* 4. Condición */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Condición
                          </span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs">
                            {parsedEbayOrder.condition || '—'}
                          </span>
                        </div>

                        {/* 5. Costo Producto */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Costo Producto
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            {parsedEbayOrder.productCostUsdt !== undefined ? `$${parsedEbayOrder.productCostUsdt.toFixed(2)} USDT` : '—'}
                          </span>
                        </div>

                        {/* 6. Envío en EE.UU. */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Envío en EE.UU.
                          </span>
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs">
                            {parsedEbayOrder.usShippingCostUsdt !== undefined 
                              ? (parsedEbayOrder.usShippingCostUsdt > 0 ? `$${parsedEbayOrder.usShippingCostUsdt.toFixed(2)} USDT` : 'GRATIS ($0.00)')
                              : '—'}
                          </span>
                        </div>

                        {/* 7. Tracking USA & Transportista */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Tracking USA ({parsedEbayOrder.carrier || 'Carrier'})
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs truncate block" title={parsedEbayOrder.trackingNumber}>
                            {parsedEbayOrder.trackingNumber || '—'}
                          </span>
                        </div>

                        {/* 8. Fecha de Compra */}
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">
                            Fecha Compra
                          </span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {parsedEbayOrder.purchaseDate || '—'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Opciones y Botón Aplicar Datos */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoLoadAppleImage}
                          onChange={(e) => setAutoLoadAppleImage(e.target.checked)}
                          className="rounded accent-amber-500"
                        />
                        <span>Cargar automáticamente foto oficial de Apple para este modelo y color</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleApplyParsedEbay}
                        disabled={parsedEbayOrder.detectedCount === 0}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                          parsedEbayOrder.detectedCount > 0
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Aplicar Datos al Formulario</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Banner de Confirmación / Éxito */}
                {ebayParseSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold">{ebayParseSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEbayParseSuccessMessage(null)}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 1: DATOS DEL TELÉFONO & EBAY */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Smartphone className="w-4 h-4" />
              <span>1. Datos del Teléfono y Compra en eBay</span>
            </h4>

            {/* BARRA DE MODELOS PREDETERMINADOS (PRIORIDAD IPHONE 13 Y 14) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Modelos Predeterminados
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    ⭐ Prioridad iPhone 13 &amp; 14
                  </span>
                </div>

                {/* Tabs de Selección de Serie */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedSeriesTab('13')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      selectedSeriesTab === '13'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Serie iPhone 13
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeriesTab('14')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      selectedSeriesTab === '14'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Serie iPhone 14
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeriesTab('other')}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                      selectedSeriesTab === 'other'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Otros (15, 12, 11)
                  </button>
                </div>
              </div>

              {/* Grid de Modelos de la Serie Activa */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {displayedPresets.map((preset) => {
                  const isSelected = model.toLowerCase().trim() === preset.name.toLowerCase().trim();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetModel(preset)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-slate-900 dark:text-slate-100 ring-2 ring-amber-500/40 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{preset.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{preset.screenSize}</span>
                        <span className="font-mono">{preset.storages.length} cap.</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Manual y Selección de Condición */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Producto / Modelo <span className="text-amber-500">*</span>
                  </label>
                  {matchedPreset && (
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      ✓ Modelo Apple Oficial detectado
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ej: iPhone 13 Pro / iPhone 14 Pro Max"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Condición</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as PhoneCondition)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ALMACENAMIENTO (GB) CON CHIPS RÁPIDOS */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Capacidad de Almacenamiento (GB)</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Seleccionado: <strong className="text-slate-900 dark:text-slate-100">{storage || 'No asignado'}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(matchedPreset?.storages || ['64GB', '128GB', '256GB', '512GB', '1TB']).map((cap) => {
                  const isSelected = storage === cap;
                  return (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setStorage(cap)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-medium border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cap}
                    </button>
                  );
                })}
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="Otro tamaño..."
                  className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* COLOR CON COLORES OFICIALES APPLE */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span>Color Oficial {matchedPreset ? `(${matchedPreset.name})` : ''}</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Seleccionado: <strong className="text-slate-900 dark:text-slate-100">{color || 'No asignado'}</strong>
                </span>
              </div>

              {matchedPreset ? (
                <div className="flex flex-wrap items-center gap-2">
                  {matchedPreset.colors.map((c) => {
                    const isSelected = color.toLowerCase().trim() === c.name.toLowerCase().trim() ||
                      color.toLowerCase().trim() === c.nameEn.toLowerCase().trim();
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.name)}
                        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-slate-900 dark:text-slate-100 font-bold ring-2 ring-amber-500/40 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={`${c.name} (${c.nameEn})`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full shrink-0 border ${c.borderClass || 'border-black/20 dark:border-white/20'}`}
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  Selecciona un modelo arriba (ej. iPhone 13 Pro o iPhone 14 Pro Max) para cargar sus colores oficiales automáticamente.
                </p>
              )}

              <div className="pt-1">
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Escribir color personalizado (ej: Sierra Blue, Grafito, Negro)..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* IMEI 1 e IMEI 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400">IMEI 1 (Principal)</label>
                <input
                  type="text"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  placeholder="15 dígitos"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">IMEI 2 (Secundario/eSIM)</label>
                <input
                  type="text"
                  value={imei2}
                  onChange={(e) => setImei2(e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Estado Físico / Grado Estético */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Estado Físico / Observaciones Estéticas (Para Certificado de Garantía)
              </label>
              <input
                type="text"
                value={physicalGrade}
                onChange={(e) => setPhysicalGrade(e.target.value)}
                placeholder='Ej. "Grado A - Pantalla intacta, leves micro-detalles en bisel"'
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Comercial / Ficha de Venta: Batería, Accesorios y Garantía */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400">🔋 Salud Batería (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={batteryHealth}
                  onChange={(e) => setBatteryHealth(e.target.value)}
                  placeholder="Ej: 87, 100"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Accesorios Incluidos
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {accessories.trim() ? 'Personalizado' : '⭐ Por defecto: Nada / Ninguno'}
                  </span>
                </div>
                <input
                  type="text"
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  placeholder="Por defecto: Nada / Solo equipo"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setAccessories('')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      !accessories.trim()
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ⭐ Nada (Por defecto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessories('Cable USB')}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    + Cable
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessories('Cargador y Cable')}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    + Cargador y Cable
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessories('Caja original + Cable')}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    + Caja y Cable
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">🛡️ Garantía (Días)</label>
                <input
                  type="number"
                  min="0"
                  value={warrantyDays}
                  onChange={(e) => setWarrantyDays(e.target.value)}
                  placeholder="30"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Link de Publicación en eBay
                  </label>
                  {ebayLink && (
                    <a
                      href={ebayLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1 transition"
                      title="Abrir publicación de eBay en nueva pestaña"
                    >
                      <span>Ver en eBay</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={ebayLink}
                      onChange={(e) => setEbayLink(e.target.value)}
                      placeholder="https://www.ebay.com/itm/..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleExtractEbayImages}
                    disabled={isExtractingEbay || !ebayLink.trim()}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                      isExtractingEbay || !ebayLink.trim()
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                    }`}
                    title="Extraer fotos originales de alta resolución de eBay"
                  >
                    {isExtractingEbay ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Extrayendo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Extraer de eBay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Feedback contextual de extracción eBay */}
                {ebayExtractFeedback && (
                  <div className={`p-2.5 rounded-xl text-xs space-y-1.5 transition-all ${
                    ebayExtractFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                      : ebayExtractFeedback.type === 'error'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-500/30'
                      : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-500/30'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-semibold">{ebayExtractFeedback.text}</p>
                          {ebayExtractFeedback.type === 'error' && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              💡 <strong>Solución rápida:</strong> En eBay haz clic derecho en la foto ➔ <em>"Copiar imagen"</em> y presiona <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Ctrl+V</kbd> aquí, o haz clic en <em>"Foto Oficial Apple"</em>.
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEbayExtractFeedback(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {ebayExtractFeedback.type === 'error' && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                        <button
                          type="button"
                          onClick={handleAddOfficialPresetImage}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>Cargar Foto Oficial Apple ({model || 'iPhone'})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowManualUrlInput(true);
                            // Scroll down to photos
                            const photoEl = document.querySelector('[data-section="photos"]');
                            if (photoEl) photoEl.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                        >
                          <Link className="w-3 h-3" />
                          <span>Pegar URL directo de imagen</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Fecha de Compra</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* NÚMERO DE ORDEN DE EBAY (ORDER NUMBER) - CONTROL ANTI-DUPLICADOS */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              duplicateOrderPhone 
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/30' 
                : cleanOrderNumber 
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60' 
                : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
            } space-y-2.5`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${
                    duplicateOrderPhone
                      ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}>
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Número de Orden eBay (Order Number)</span>
                      <span className="text-amber-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Número único que te da eBay al pagar (ej. <span className="font-mono font-semibold">24-10492-83719</span>). Previene cargar duplicados.
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  duplicateOrderPhone
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
                    : cleanOrderNumber
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {duplicateOrderPhone ? '⚠️ Duplicado Detectado' : cleanOrderNumber ? '✓ Orden Asignada' : '🛡️ Anti-Duplicados'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">#</span>
                  <input
                    type="text"
                    required
                    value={ebayOrderNumber}
                    onChange={(e) => handleOrderNumberChange(e.target.value)}
                    placeholder="Ej: 24-10492-83719 (o pega el texto del recibo de eBay)"
                    className={`w-full bg-white dark:bg-slate-900 border rounded-xl pl-8 pr-20 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden ${
                      duplicateOrderPhone
                        ? 'border-rose-500 focus:border-rose-600 ring-2 ring-rose-500/20'
                        : 'border-slate-300 dark:border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {ebayOrderNumber && (
                    <button
                      type="button"
                      onClick={() => setEbayOrderNumber('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Atajo para pegar o generar muestra */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clipText = await navigator.clipboard.readText();
                        if (clipText) handleOrderNumberChange(clipText);
                      } catch {
                        // ignore
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title="Pegar Order Number copiado del portapapeles"
                  >
                    Pegar del Portapapeles
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowEbayParser(true);
                      // Scroll to top of modal
                      const formContainer = document.querySelector('form.max-h-\\[80vh\\]');
                      if (formContainer) {
                        formContainer.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Abrir asistente de autocompletado desde el recibo de eBay"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Autocompletar Todo</span>
                  </button>
                </div>
              </div>

              {/* ALERTA DE DUPLICADO EN TIEMPO REAL */}
              {duplicateOrderPhone && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800/80 text-xs space-y-2 shadow-xs">
                  <div className="flex items-start gap-2 text-rose-700 dark:text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <div>
                      <span>¡Cuidado! Este Order Number ya está registrado en el inventario:</span>
                      <p className="text-[11px] font-normal text-rose-800 dark:text-rose-300 mt-0.5">
                        El equipo <strong>"{duplicateOrderPhone.model}"</strong> ya tiene asignada la orden <strong>#{duplicateOrderPhone.ebayOrderNumber}</strong> comprada el {duplicateOrderPhone.purchaseDate}.
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="font-mono text-slate-700 dark:text-slate-300">
                      <span>IMEI: {duplicateOrderPhone.imei || duplicateOrderPhone.imei1 || 'Sin IMEI aún'}</span>
                      <span className="mx-2">•</span>
                      <span>Costo: ${duplicateOrderPhone.productCostUsdt} USDT</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {duplicateOrderPhone.status}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowDuplicateOrder}
                      onChange={(e) => setAllowDuplicateOrder(e.target.checked)}
                      className="rounded accent-rose-600"
                    />
                    <span>Permitir guardar de todos modos (ej. compra de lote con 2 o más teléfonos en la misma orden)</span>
                  </label>
                </div>
              )}
            </div>

            {/* SECCIÓN DE FOTOS / GALERÍA */}
            <div 
              data-section="photos"
              onPaste={handlePasteImage}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Fotos del iPhone ({images.length})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Foto de portada para inventario, catálogo de clientes y notas de entrega
                    </span>
                  </div>
                </div>

                {/* Botones de acción de fotos */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Foto Oficial Apple 1-click */}
                  <button
                    type="button"
                    onClick={handleAddOfficialPresetImage}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title="Asignar foto oficial de render Apple para este modelo y color"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                    <span>Foto Oficial Apple</span>
                  </button>

                  {/* Subir archivo desde PC o Móvil */}
                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-sky-500" />
                    <span>Subir Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Cámara Móvil */}
                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer sm:hidden">
                    <Camera className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cámara</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* URL Directo */}
                  <button
                    type="button"
                    onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                    title="Pegar enlace directo de imagen"
                  >
                    <Link className="w-3.5 h-3.5 text-violet-500" />
                    <span>Por Enlace</span>
                  </button>
                </div>
              </div>

              {/* Input para URL manual */}
              {showManualUrlInput && (
                <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                  <input
                    type="url"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualUrl();
                      }
                    }}
                    placeholder="Pegar URL directo de imagen (ej: i.ebayimg.com/...)"
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualUrl}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualUrlInput(false);
                      setManualImageUrl('');
                    }}
                    className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Feedback de Extracción o subida */}
              {ebayExtractFeedback && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 ${
                  ebayExtractFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    : ebayExtractFeedback.type === 'error'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20'
                }`}>
                  <span>{ebayExtractFeedback.text}</span>
                  <button
                    type="button"
                    onClick={() => setEbayExtractFeedback(null)}
                    className="p-0.5 hover:opacity-70 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Grid de Fotos */}
              {images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                  {images.map((img, index) => {
                    const isPrimary = img === primaryImage || (!primaryImage && index === 0);
                    return (
                      <div
                        key={`${index}-${img.slice(0, 30)}`}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-white dark:bg-slate-900 ${
                          isPrimary
                            ? 'border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                        />

                        {/* Badge de Principal */}
                        {isPrimary && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[9px] font-black flex items-center gap-0.5 shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>PORTADA</span>
                          </div>
                        )}

                        {/* Controles de Hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(img)}
                              className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Marcar como foto de portada"
                            >
                              <Star className="w-3 h-3" />
                              <span>Portada</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition cursor-pointer"
                            title="Eliminar esta foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-1.5 bg-white/50 dark:bg-slate-900/40">
                  <ImageIcon className="w-7 h-7 mx-auto text-slate-400 dark:text-slate-600" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Sin fotos añadidas aún
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Coloca el enlace de eBay arriba y pulsa <strong>"Extraer de eBay"</strong>, o haz clic en <strong>"Foto Oficial Apple"</strong> para cargarla al instante. También puedes pegar imágenes directamente con <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Ctrl+V</kbd>.
                  </p>
                </div>
              )}
            </div>

            {/* COSTOS DE COMPRA EN EE.UU. Y GASTOS EXTRAS */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3.5">
              
              {/* FILA 1: Costo del Producto (Izquierda) + Costo de Envío en EE.UU. (Derecha) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                
                {/* 1. Costo del Producto */}
                <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-900/60 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Costo del Producto ($ USDT)</span>
                      <span className="text-amber-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={productCostUsdt}
                      onChange={(e) => setProductCostUsdt(e.target.value)}
                      placeholder="Ej: 350.00"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-0.5">
                    <span>En Bolívares (P2P):</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ≈ {formatBs(numProductCost * rates.binanceUsdtRate)}
                    </span>
                  </div>
                </div>

                {/* 2. Costo de Envío dentro de EE.UU. (eBay) */}
                <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-sky-500" />
                      <span>Envío en EE.UU. (eBay)</span>
                    </label>

                    {/* Toggle Gratis vs Con Costo */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          setHasUsShippingCost(false);
                          setUsShippingCostUsdt('0');
                        }}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          !hasUsShippingCost
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Gratis ($0)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasUsShippingCost(true);
                          if (usShippingCostUsdt === '0' || !usShippingCostUsdt) {
                            setUsShippingCostUsdt('6.00');
                          }
                        }}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                          hasUsShippingCost
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Con Costo ($)
                      </button>
                    </div>
                  </div>

                  {hasUsShippingCost ? (
                    <div className="space-y-1.5 pt-0.5 animate-in fade-in duration-150">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required={hasUsShippingCost}
                          value={usShippingCostUsdt}
                          onChange={(e) => setUsShippingCostUsdt(e.target.value)}
                          placeholder="Ej: 6.50"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-amber-500/50 rounded-xl pl-7 pr-3 py-2 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-hidden focus:border-amber-500"
                        />
                      </div>

                      {/* Atajos rápidos */}
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Atajos:</span>
                        {['4.99', '6.50', '8.95', '12.00'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setUsShippingCostUsdt(val)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                              usShippingCostUsdt === val
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            +${val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
                      <span>Envío doméstico gratis en eBay</span>
                      <span className="font-mono font-bold">$0.00</span>
                    </div>
                  )}

                  {/* Subtotal eBay */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Subtotal Compra eBay:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      ${Number((numProductCost + numUsShippingCost).toFixed(2))} USDT
                    </span>
                  </div>
                </div>

              </div>

              {/* FILA 2 (DEBAJO DE LOS 2): Gastos Extras / Repuestos (Aplica a veces y después que llegue) */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gastos Extras / Repuestos ($ USDT)</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    (Opcional: aplica a veces y después de que llegue el equipo a Venezuela)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={additionalCostUsdt}
                      onChange={(e) => setAdditionalCostUsdt(e.target.value)}
                      placeholder="0.00 (Micas, cargador, batería o repuestos)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Úsalo si invertiste en micas de hidrogel, cargadores rápidos 20W, cambio de batería o piezas de reparación tras la llegada.
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* SECCIÓN 2: LOGÍSTICA DE ENVÍO EE.UU. Y CASILLERO ZOOM */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>2. Logística de Envío &amp; Casillero Zoom</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal normal-case">
                EE.UU. ➔ Casillero Zoom Miami ➔ Retiro Vzla
              </span>
            </h4>

            {/* RENGLÓN 1 COMPACTO: GUÍA EE.UU. + TRANSPORTISTA + PREALERTA */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                {/* 1. Guía de Envío en EE.UU. */}
                <div className="sm:col-span-5 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Guía EE.UU. (Tracking USA)
                    </label>
                    {usTrackingNumber && (
                      <a
                        href={getTrackingUrl(usCarrier, usTrackingNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                        title={`Rastrear en ${usCarrier}`}
                      >
                        <span>{usCarrier}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={usTrackingNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUsTrackingNumber(val);
                      if (val.trim()) {
                        const detected = detectCarrier(val);
                        setUsCarrier(detected);
                      }
                    }}
                    placeholder="Ej: 9400... (USPS), 1Z... (UPS)"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
                  />
                </div>

                {/* 2. Transportista USA */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Carrier USA
                  </label>
                  <select
                    value={usCarrier}
                    onChange={(e) => setUsCarrier(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500 cursor-pointer"
                  >
                    <option value="USPS">USPS (Postal)</option>
                    <option value="UPS">UPS (1Z...)</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL Express</option>
                    <option value="Amazon">Amazon (TBA)</option>
                    <option value="OnTrac">OnTrac</option>
                    <option value="Otro">Otro Carrier</option>
                  </select>
                </div>

                {/* 3. ¿Prealertado en Casillero Zoom? */}
                <div className="sm:col-span-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      ¿Prealertado en Zoom?
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isPrealerted ? '✅ Sí' : '⚠️ No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsPrealerted(false)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        !isPrealerted
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrealerted(true)}
                      className={`flex-1 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        isPrealerted
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      ✓ Sí, Prealerta
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensaje sutil si NO está prealertado */}
              {!isPrealerted && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Pendiente por prealertar en casillero. Al marcar <strong>"Sí, Prealerta"</strong> se habilitará el control de guía y flete Zoom.</span>
                </div>
              )}
            </div>

            {/* SECCIÓN CONDICIONAL DE ZOOM (SOLO SI ESTÁ PREALERTADO) */}
            {isPrealerted && (
              <div className="p-3 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 space-y-3 shadow-2xs animate-in fade-in duration-150">
                
                {/* 1. RENGLÓN: ¿COSTO DE ZOOM FACTURADO? */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-200/60 dark:border-purple-800/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        ¿Costo de Zoom Facturado?
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block sm:inline sm:ml-2">
                        {zoomCostStatus === 'known' ? '✅ Ya Zoom pesó y facturó la guía' : '⏳ En espera de peso y cobro'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setZoomCostStatus('pending')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        zoomCostStatus === 'pending'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      ⏳ No - En espera
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomCostStatus('known')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        zoomCostStatus === 'known'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      ✅ Sí - Ya sé cuánto
                    </button>
                  </div>
                </div>

                {/* SI EL COSTO ESTÁ EN ESPERA (PENDIENTE) */}
                {zoomCostStatus === 'pending' ? (
                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-800/40 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Prealerta activa en casillero Miami. Zoom aún no ha emitido el costo final ni la guía en Venezuela.
                      </p>
                    </div>

                    {!showEarlyZoomTracking && !zoomTrackingNumber ? (
                      <button
                        type="button"
                        onClick={() => setShowEarlyZoomTracking(true)}
                        className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                      >
                        + Ingresar Guía Zoom anticipada
                      </button>
                    ) : (
                      <div className="w-full sm:w-auto flex items-center gap-2 pt-1 sm:pt-0">
                        <span className="text-[10px] text-slate-500 font-semibold shrink-0">Guía Zoom:</span>
                        <input
                          type="text"
                          value={zoomTrackingNumber}
                          onChange={(e) => setZoomTrackingNumber(e.target.value)}
                          placeholder="Ej: ZM-892104"
                          className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* SI YA SABE CUÁNTO (COSTO FACTURADO) -> MOSTRAR GUÍA ZOOM, COSTO, AGENCIA Y PAGOS */
                  <div className="space-y-2.5 pt-0.5">
                    {/* FILA A: GUÍA ZOOM + MONTO BCV + EQUIVALENCIAS */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      {/* Guía Zoom */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Guía Zoom / Casillero Vzla
                        </label>
                        <input
                          type="text"
                          value={zoomTrackingNumber}
                          onChange={(e) => setZoomTrackingNumber(e.target.value)}
                          placeholder="Ej: ZM-892104-CCS"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500"
                        />
                      </div>

                      {/* Monto Facturado en $ BCV */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[11px] font-bold text-sky-700 dark:text-sky-300">
                          Monto Facturado Zoom ($ BCV) <span className="text-amber-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={zoomCostBcv}
                            onChange={(e) => setZoomCostBcv(e.target.value)}
                            placeholder="Ej: 18.50"
                            className="w-full bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-800/60 rounded-lg pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-sky-700 dark:text-sky-300 focus:outline-hidden focus:border-sky-500"
                          />
                        </div>
                      </div>

                      {/* Equivalencias Rápidas */}
                      <div className="sm:col-span-3 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] space-y-0.5">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400">En Bs:</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400">{formatBs(numZoomCostBcv * rates.bcvRate)}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-400">En USDT:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">${zoomCostInUsdt}</span>
                        </div>
                      </div>
                    </div>

                    {/* FILA B: AGENCIA ZOOM + PAGADO + RETIRADO */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start pt-1">
                      {/* Agencia Zoom */}
                      <div className="sm:col-span-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Agencia Zoom Destino
                          </label>
                          <button
                            type="button"
                            onClick={() => setZoomAgency('ZOOM Barinas')}
                            className="text-[9px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            ⭐ Barinas
                          </button>
                        </div>
                        <input
                          type="text"
                          value={zoomAgency}
                          onChange={(e) => setZoomAgency(e.target.value)}
                          placeholder="Ej: ZOOM Barinas"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-sky-500"
                        />
                      </div>

                      {/* ¿Pagado en Zoom? */}
                      <div className="sm:col-span-4 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">¿Pagado en Zoom?</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setIsZoomPaid(false)}
                              className={`px-2 py-0.5 text-[10px] rounded font-semibold transition cursor-pointer ${
                                !isZoomPaid ? 'bg-amber-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Pendiente
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsZoomPaid(true);
                                if (!zoomPaidAmountBcv && numZoomCostBcv > 0) {
                                  setZoomPaidAmountBcv(numZoomCostBcv.toString());
                                }
                              }}
                              className={`px-2 py-0.5 text-[10px] rounded font-semibold transition cursor-pointer ${
                                isZoomPaid ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Pagado
                            </button>
                          </div>
                        </div>

                        {isZoomPaid && (
                          <select
                            value={zoomPaymentMethod}
                            onChange={(e) => setZoomPaymentMethod(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-slate-900 dark:text-slate-100"
                          >
                            <option value="Pago Móvil">Pago Móvil (BCV)</option>
                            <option value="Bolívares (BCV)">Transferencia Bs.</option>
                            <option value="Dólares Efectivo">Efectivo Taquilla</option>
                          </select>
                        )}
                      </div>

                      {/* ¿Retirado en Zoom? */}
                      <div className="sm:col-span-4 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">¿Retirado en Zoom?</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setIsZoomPickedUp(false)}
                              className={`px-2 py-0.5 text-[10px] rounded font-semibold transition cursor-pointer ${
                                !isZoomPickedUp ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              No
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsZoomPickedUp(true);
                                if (status === 'en_agencia_zoom' || status === 'en_casillero_zoom') {
                                  setStatus('disponible_para_venta');
                                }
                              }}
                              className={`px-2 py-0.5 text-[10px] rounded font-semibold transition cursor-pointer ${
                                isZoomPickedUp ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              Sí, Retirado
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          {isZoomPickedUp ? '✓ Equipo en tienda listo para venta.' : 'Aún en camino o en agencia.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: COSTO REAL, PRECIO PROSPECTADO & VENTA */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>3. Costo Real, Precio Prospectado y Ganancia</span>
            </h4>

            {/* Resumen de Costo Real Calculado */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xs">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Costo Real Consolidado:
                </span>
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${tempRealCostUsdt} <span className="text-xs font-sans font-normal text-emerald-700 dark:text-emerald-300">USDT</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
                  En Bolívares: <span className="text-sky-600 dark:text-sky-300 font-bold">{formatBs(tempRealCostBs)}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 sm:pl-4 pt-2 sm:pt-0">
                <div className="flex justify-between">
                  <span>Costo Teléfono:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">${numProductCost} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío en EE.UU.:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-300 font-semibold">
                    {numUsShippingCost > 0 ? `$${numUsShippingCost} USDT` : 'Gratis ($0)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Flete Zoom eq. USDT:</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">${zoomCostInUsdt} USDT</span>
                </div>
                {numAdditionalCost > 0 && (
                  <div className="flex justify-between">
                    <span>Gastos Extras:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">${numAdditionalCost} USDT</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estado del Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estado del Teléfono en Inventario
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ItemStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-amber-500 font-medium"
                >
                  <option value="en_transito_usa">🚚 En Tránsito USA (Comprado en eBay)</option>
                  <option value="en_casillero_zoom">📦 En Casillero Zoom (Miami / En Vuelo)</option>
                  <option value="en_agencia_zoom">🏢 En Agencia Zoom Vzla (Por Retirar/Pagar)</option>
                  <option value="disponible_para_venta">🟢 Disponible para la Venta (En Stock)</option>
                  <option value="reservado">🟡 Reservado / Apartado</option>
                  <option value="vendido">🔵 Vendido (Ganancia Consolidada)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Precio Prospectado ($ USDT) <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={projectedPriceUsdt}
                    onChange={(e) => setProjectedPriceUsdt(e.target.value)}
                    placeholder="Ej: 480.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-sm font-mono font-bold text-amber-600 dark:text-amber-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                {numProjectedPrice > 0 && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-mono flex justify-between">
                    <span>Ganancia Prospectada: +${tempProjectedProfitUsdt} USDT</span>
                    <span className="font-bold">+{tempProjectedMargin}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Si está marcado como Vendido */}
            {status === 'vendido' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-sky-200 dark:border-sky-800/60 space-y-3 animate-in fade-in">
                <h5 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-sky-500" />
                  Datos de la Venta y Ganancia Real
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Precio Vendido ($ USDT) <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={status === 'vendido'}
                      value={soldPriceUsdt}
                      onChange={(e) => setSoldPriceUsdt(e.target.value)}
                      placeholder="Ej: 520.00"
                      className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Fecha de Venta</label>
                    <input
                      type="date"
                      value={soldDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSoldDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Comprador / Cliente</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Nombre del comprador"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Info extra de venta para recibo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">C.I. / RIF Cliente</label>
                    <input
                      type="text"
                      value={buyerIdNumber}
                      onChange={(e) => setBuyerIdNumber(e.target.value)}
                      placeholder="V-12.345.678"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Teléfono WhatsApp</label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+58 412 1234567"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Método de Pago Recibido</label>
                    <input
                      type="text"
                      value={soldPaymentMethod}
                      onChange={(e) => setSoldPaymentMethod(e.target.value)}
                      placeholder="Binance USDT, Efectivo $, Pago Móvil"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {numSoldPrice > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">Ganancia Real Obtenida:</span>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                        +${tempRealProfitUsdt} USDT
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold font-mono text-[11px]">
                        +{tempRealMargin}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notas adicionales */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Notas / Detalles del Teléfono</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Estado de la batería %, detalles estéticos, accesorios incluidos..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btn-save-phone"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingItem ? 'Guardar Cambios' : 'Registrar Teléfono'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
