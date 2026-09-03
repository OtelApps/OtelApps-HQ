const TOKEN_KEY = 'otelapps_hq_token';

export type HotelProfile = {
  app_name: string;
  admin_url: string;
  web_url: string;
  lat: number | null;
  lng: number | null;
  admin_email: string;
  app_store_url: string;
  play_store_url: string;
};

export type HotelRecord = {
  id: string;
  slug: string;
  name: string;
  modules: Record<string, boolean>;
  disabled_modules: string[];
  profile: HotelProfile;
};

export type ModuleCatalogItem = {
  key: string;
  label: string;
  enabled_default: boolean;
};

export type HealthResult = {
  admin: { ok: boolean; status: number | null };
  web: { ok: boolean; status: number | null };
};

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

function apiBase(): string {
  if (import.meta.env.DEV) {
    return '';
  }
  return (import.meta.env.VITE_PLATFORM_API_URL ?? '').trim().replace(/\/$/, '');
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function platformFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  if (response.status === 401) {
    clearToken();
    throw new ApiError('Nepřihlášen.', 401);
  }

  const json = (await response.json().catch(() => ({}))) as { message?: string } & T;
  if (!response.ok) {
    const message =
      typeof json === 'object' && json && 'message' in json && typeof json.message === 'string'
        ? json.message
        : `HTTP ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return json as T;
}

export function login(email: string, password: string) {
  return platformFetch<{ token: string; user: { name: string; email: string } }>('/api/platform/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchHotels() {
  return platformFetch<{ hotels: HotelRecord[] }>('/api/platform/hotels');
}

export function fetchHotel(slug: string) {
  return platformFetch<HotelRecord>(`/api/platform/hotels/${encodeURIComponent(slug)}`);
}

export function fetchCatalog() {
  return platformFetch<{ modules: ModuleCatalogItem[] }>('/api/platform/module-catalog');
}

export function createHotel(payload: Record<string, unknown>) {
  return platformFetch<HotelRecord>('/api/platform/hotels', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateHotel(slug: string, payload: Record<string, unknown>) {
  return platformFetch<HotelRecord>(`/api/platform/hotels/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateHotelModules(slug: string, modules: Record<string, boolean>) {
  return platformFetch<{ slug: string; modules: Record<string, boolean> }>(
    `/api/platform/hotels/${encodeURIComponent(slug)}/modules`,
    {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    },
  );
}

export function fetchHotelHealth(slug: string) {
  return platformFetch<{ slug: string; health: HealthResult }>(
    `/api/platform/hotels/${encodeURIComponent(slug)}/health`,
  );
}

export type HotelEnvFiles = {
  webadmin: string;
  hostweb: string;
  mobile: string;
};

export function fetchHotelEnv(slug: string) {
  return platformFetch<{ slug: string; files: HotelEnvFiles }>(
    `/api/platform/hotels/${encodeURIComponent(slug)}/env`,
  );
}

export function guestWebUrl(hotel: HotelRecord): string | null {
  const base = hotel.profile.web_url.replace(/\/$/, '');
  if (!base) {
    return null;
  }
  return `${base}/h/${hotel.slug}/`;
}

export function adminUrl(hotel: HotelRecord): string | null {
  const base = hotel.profile.admin_url.replace(/\/$/, '');
  if (!base) {
    return null;
  }
  return `${base}/h/${hotel.slug}/`;
}
