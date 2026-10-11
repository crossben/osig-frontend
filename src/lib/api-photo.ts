// "Check a photo": metadata inspection and stripping. The server works in
// memory and stores nothing; the photo is sent only to our own API.

import { apiClient } from '@/lib/api-client';

export interface PhotoInspection {
  file: {
    format: string;
    mimeType: string;
    extension: string;
    width: number;
    height: number;
    megapixels: number;
    sizeBytes: number;
    mode: string;
    animated: boolean;
    hasIccProfile: boolean;
  };
  gps: { latitude: number; longitude: number; altitude: number | null; timestamp: string | null } | null;
  camera: { make?: string; model?: string; lens?: string; serialNumber?: string; software?: string; artist?: string; copyright?: string };
  settings: { fNumber?: number; exposureTime?: string; iso?: number; focalLength?: number };
  dates: { taken?: string; digitized?: string; modified?: string; offset?: string };
  orientation: string | null;
  xmp: { creatorTool?: string; createDate?: string; modifyDate?: string; softwareAgent?: string } | null;
  thumbnail: { width: number; height: number; mismatch: boolean } | null;
  hasExif: boolean;
  metadataStripped: boolean;
}

const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
function toCamel(v: unknown): any {
  if (Array.isArray(v)) return v.map(toCamel);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [camel(k), toCamel(x)]));
  return v;
}

async function errorFrom(e: any): Promise<Error> {
  let detail: unknown = e?.response?.data?.detail;
  const data = e?.response?.data;
  if (!detail && data instanceof Blob) {
    try { detail = JSON.parse(await data.text()).detail; } catch { /* not JSON */ }
  }
  const err = new Error(typeof detail === 'string' ? detail : e?.message || 'Request failed', { cause: e }) as Error & { status?: number };
  err.status = e?.response?.status;
  return err;
}

function form(file: Blob, name: string) {
  const fd = new FormData();
  fd.append('file', file, name);
  return fd;
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const photoApi = {
  inspect: async (file: Blob, name: string): Promise<PhotoInspection> => {
    try {
      const res = await apiClient.post('/photo/inspect', form(file, name), multipart);
      return toCamel(res.data);
    } catch (e) {
      throw await errorFrom(e);
    }
  },
  strip: async (file: Blob, name: string): Promise<{ blob: Blob; filename: string }> => {
    try {
      const res = await apiClient.post('/photo/strip', form(file, name), { ...multipart, responseType: 'blob' });
      const cd = String(res.headers['content-disposition'] ?? '');
      const m = /filename\*=UTF-8''([^;]+)/.exec(cd) ?? /filename="([^"]+)"/.exec(cd);
      return { blob: res.data as Blob, filename: m ? decodeURIComponent(m[1]) : 'photo-clean.jpg' };
    } catch (e) {
      throw await errorFrom(e);
    }
  },
};
