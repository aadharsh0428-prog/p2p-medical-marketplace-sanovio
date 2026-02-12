import XLSX from 'xlsx';
import { RawProductData } from '../types';

export function parseExcelFile(buffer: Buffer, filename: string): RawProductData[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

  return rawData.map(row => ({
    internalId: getField(row, ['internal_id', 'internalId']),
    artikelbezeichnung: getField(row, ['Artikelbezeichnung', 'artikelbezeichnung']) || '',
    marke: getField(row, ['Marke', 'marke', 'Brand']),
    artikelnummer: getField(row, ['Artikelnummer', 'artikelnummer']),
    jahresmenge: parseNumber(getField(row, ['Jahresmenge', 'jahresmenge'])),
    bestellmengeneinheit: getField(row, ['Bestellmengeneinheit', 'bestellmengeneinheit']),
    basismengeneinheitenProBME: parseNumber(getField(row, ['Basismengeneinheiten pro BME'])),
    basismengeneinheit: getField(row, ['Basismengeneinheit', 'basismengeneinheit']),
    gtin: getField(row, ['GTIN', 'gtin']),
    ean: getField(row, ['EAN', 'ean']),
    mdrKlasse: getField(row, ['MDR-Klasse', 'mdrKlasse']),
    nettoZielpreis: parseNumber(getField(row, ['Netto-Zielpreis', 'nettoZielpreis'])),
    waehrung: getField(row, ['Währung', 'waehrung']) || 'CHF'
  }));
}

function getField(row: any, keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      const value = String(row[key]).trim();
      return value.startsWith("'") ? value.substring(1) : value;
    }
  }
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = String(value).replace(/[^0-9.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export function validateExcelFile(buffer: Buffer, filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
    return { valid: false, error: 'Only .xlsx, .xls, .csv supported' };
  }
  if (buffer.length > 10 * 1024 * 1024) {
    return { valid: false, error: 'File must be under 10MB' };
  }
  return { valid: true };
}
