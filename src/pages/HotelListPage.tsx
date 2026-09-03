import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Banner, Card } from '../components/ui';
import { formatApiError } from '../contexts/AuthContext';
import {
  adminUrl,
  fetchHotelHealth,
  fetchHotels,
  guestWebUrl,
  type HealthResult,
  type HotelRecord,
} from '../lib/api';

function HealthPill({ health }: { health: HealthResult | null | undefined }) {
  if (health === undefined) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">Načítám…</span>
    );
  }
  if (!health) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">
        Web · Admin
      </span>
    );
  }
  const ok = health.admin.ok && health.web.ok;
  const partial = health.admin.ok || health.web.ok;
  const tone = ok
    ? 'bg-emerald-50 text-emerald-700'
    : partial
      ? 'bg-amber-50 text-amber-800'
      : 'bg-slate-100 text-muted';
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
      title={`Admin ${health.admin.ok ? 'OK' : 'fail'} · Web ${health.web.ok ? 'OK' : 'fail'}`}
    >
      Web · Admin
    </span>
  );
}

export function HotelListPage() {
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [health, setHealth] = useState<Record<string, HealthResult | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchHotels();
        if (cancelled) return;
        setHotels(data.hotels);
        setLoading(false);
        await Promise.all(
          data.hotels.map(async (hotel) => {
            try {
              const result = await fetchHotelHealth(hotel.slug);
              if (!cancelled) {
                setHealth((prev) => ({ ...prev, [hotel.slug]: result.health }));
              }
            } catch {
              if (!cancelled) {
                setHealth((prev) => ({ ...prev, [hotel.slug]: null }));
              }
            }
          }),
        );
      } catch (e) {
        if (!cancelled) {
          setError(formatApiError(e));
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hotely</h1>
          <p className="mt-1 text-sm text-muted">Moduly, profil a odkazy na web / admin.</p>
        </div>
        <Link to="/hotels/new" className="hq-btn shrink-0">
          Nový hotel
        </Link>
      </div>
      {error ? (
        <div className="mb-4">
          <Banner tone="error">{error}</Banner>
        </div>
      ) : null}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="h-40 animate-pulse bg-slate-50" />
          <Card className="h-40 animate-pulse bg-slate-50" />
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {hotels.map((hotel) => {
          const web = guestWebUrl(hotel);
          const admin = adminUrl(hotel);
          const disabled = hotel.disabled_modules.slice(0, 4);
          return (
            <article
              key={hotel.slug}
              className="hq-card p-5 transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{hotel.name}</h2>
                  <p className="mt-0.5 font-mono text-xs text-muted">{hotel.slug}</p>
                </div>
                <HealthPill health={health[hotel.slug]} />
              </div>
              <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
                {disabled.length ? (
                  disabled.map((key) => (
                    <span
                      key={key}
                      className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      {key}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted">Všechny známé moduly zapnuté</span>
                )}
                {hotel.disabled_modules.length > 4 ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-muted">
                    +{hotel.disabled_modules.length - 4}
                  </span>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link className="hq-btn h-9 px-3" to={`/hotels/${hotel.slug}`}>
                  Detail
                </Link>
                {web ? (
                  <a className="hq-btn-ghost h-9 px-3" href={web} target="_blank" rel="noreferrer">
                    Web
                  </a>
                ) : null}
                {admin ? (
                  <a className="hq-btn-ghost h-9 px-3" href={admin} target="_blank" rel="noreferrer">
                    Admin
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {!loading && hotels.length === 0 && !error ? (
        <Card className="px-6 py-12 text-center">
          <p className="font-medium">Zatím žádný hotel</p>
          <p className="mt-1 text-sm text-muted">Vytvoř první instanci v databázi.</p>
          <Link to="/hotels/new" className="hq-btn mt-5 inline-flex">
            Nový hotel
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
