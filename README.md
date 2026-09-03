# OtelApps HQ

Interní control plane nad hotely v shared Supabase. **Žádný Supabase service role v prohlížeči** — všechno jde přes Laravel `POST /api/platform/*` (Sanctum, jen superadmin).

Umí: seznam hotelů, checklist modulů, YAML pole profilu, health ping, odkazy na HostWeb `/h/{slug}/` a WebAdmin `/h/{slug}/`, wizard nové instance (řádek v DB, ne Railway/EAS).

## Rychlý start

```bash
cp .env.example .env
npm install
npm run dev    # http://127.0.0.1:5174  (HostWeb drží 5173)
```

WebAdmin musí běžet (`php artisan serve`). Vite proxyuje `/api/platform` na `VITE_PLATFORM_API_URL`.

Login: demo `superadmin@otelapps.test` / `password`. Recepce a ostatní dostanou 403.

V `.env` WebAdminu přidej HQ origin do `CORS_ALLOWED_ORIGINS` (`http://127.0.0.1:5174`).

## Env

| Proměnná | Účel |
|----------|------|
| `VITE_PLATFORM_API_URL` | Laravel origin (produkce i proxy target) |
| `VITE_HOSTWEB_ORIGIN` | default `web_url` u nového hotelu |

Token je v `sessionStorage` (`otelapps_hq_token`).

## Netlify

`netlify.toml` publish `dist`, SPA redirect `/*` → `index.html`. Build: `npm run build`. Nastav `VITE_PLATFORM_API_URL` na produkční WebAdmin a `CORS_ALLOWED_ORIGINS` na HQ URL.

## Související

- [OtelApps-WebAdmin](../OtelApps-WebAdmin) — platform API, `hotel_profiles`, `/h/{slug}`
- [HostWebClient](../HostWebClient) — guest web `/h/{slug}/`
- [OtelApps](../OtelApps) — mobil zůstává na `EXPO_PUBLIC_HOTEL_SLUG`

---

**Poslední aktualizace:** září 2026
