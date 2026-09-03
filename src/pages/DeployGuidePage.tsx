import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Banner, Button, Card, CopyBlock, TextField } from '../components/ui';
import { formatApiError } from '../contexts/AuthContext';
import {
  adminUrl,
  fetchHotel,
  fetchHotelEnv,
  guestWebUrl,
  type HotelEnvFiles,
  type HotelRecord,
  updateHotel,
} from '../lib/api';

const STEPS = 5;

type Progress = {
  step: number;
  done: boolean[];
};

function storageKey(slug: string): string {
  return `hq-deploy:${slug}`;
}

function readProgress(slug: string): Progress {
  const fallback: Progress = { step: 0, done: Array.from({ length: STEPS }, () => false) };
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Progress;
    if (typeof parsed.step !== 'number' || !Array.isArray(parsed.done)) {
      return fallback;
    }
    return {
      step: Math.min(STEPS - 1, Math.max(0, parsed.step)),
      done: Array.from({ length: STEPS }, (_, i) => Boolean(parsed.done[i])),
    };
  } catch {
    return fallback;
  }
}

function writeProgress(slug: string, progress: Progress): void {
  localStorage.setItem(storageKey(slug), JSON.stringify(progress));
}

export function DeployGuidePage() {
  const { slug = '' } = useParams();
  const [hotel, setHotel] = useState<HotelRecord | null>(null);
  const [files, setFiles] = useState<HotelEnvFiles | null>(null);
  const [progress, setProgress] = useState<Progress>(() => readProgress(slug));
  const [adminInput, setAdminInput] = useState('');
  const [webInput, setWebInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [row, env] = await Promise.all([fetchHotel(slug), fetchHotelEnv(slug)]);
    setHotel(row);
    setFiles(env.files);
    setAdminInput(row.profile.admin_url);
    setWebInput(row.profile.web_url);
  }, [slug]);

  useEffect(() => {
    setProgress(readProgress(slug));
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, reload]);

  function setStep(step: number) {
    const next = { ...progress, step };
    setProgress(next);
    writeProgress(slug, next);
  }

  function toggleDone() {
    const done = [...progress.done];
    done[progress.step] = !done[progress.step];
    const next = { ...progress, done };
    setProgress(next);
    writeProgress(slug, next);
  }

  async function saveUrls(payload: { admin_url?: string; web_url?: string }) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await updateHotel(slug, payload);
      await reload();
      setStatus('URL uložená v profilu hotelu.');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !hotel) {
    return <Banner tone="error">{error}</Banner>;
  }
  if (!hotel || !files) {
    return <Card className="h-40 animate-pulse bg-slate-50" />;
  }

  const step = progress.step;
  const webLink = guestWebUrl(hotel);
  const adminLink = adminUrl(hotel);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={`/hotels/${slug}`} className="text-sm text-muted hover:text-ink">
        ← Detail hotelu
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nasazení</h1>
      <p className="mt-1 font-mono text-xs text-muted">{hotel.slug}</p>
      <p className="mt-3 text-sm text-muted">
        Krok {step + 1} z {STEPS}. HQ nic nenasazuje za tebe — jen říká přesně, co kliknout a co zkopírovat.
      </p>

      <div className="mt-4 mb-6 flex gap-1.5">
        {Array.from({ length: STEPS }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`h-1.5 flex-1 rounded-full ${i === step ? 'bg-primary' : progress.done[i] ? 'bg-emerald-400' : 'bg-slate-200'}`}
            aria-label={`Krok ${i + 1}`}
          />
        ))}
      </div>

      {error ? <Banner tone="error">{error}</Banner> : null}
      {status ? (
        <div className="mb-4">
          <Banner tone="ok">{status}</Banner>
        </div>
      ) : null}

      <Card className="space-y-4 p-6">
        {step === 0 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight">Hotel je v databázi</h2>
            <p className="text-sm text-muted">
              <strong>{hotel.name}</strong> se slugem <span className="font-mono">{hotel.slug}</span> už existuje v
              Supabase (stejná DB jako ostatní klienti). Teď nasadíš tři appky se <strong>stejným slugem</strong>:
              WebAdmin, HostWeb, mobil. Nový git repo neděláš.
            </p>
            <p className="text-sm text-muted">
              Secrets (Supabase, APP_KEY, OpenAI) vezmi z už běžícího nasazení. Neměň je, jen doplň slug a URL.
            </p>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight">WebAdmin (Railway)</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
              <li>V Railway založ novou službu ze stejného repo <span className="font-mono">OtelApps-WebAdmin</span>.</li>
              <li>Do Variables vlož blok níže. Slug je už vyplněný.</li>
              <li>
                Prázdné secrets zkopíruj 1:1 z existujícího WebAdminu (<span className="font-mono">APP_KEY</span>,{' '}
                <span className="font-mono">SUPABASE_*</span>, OpenAI).
              </li>
              <li>Až Railway dá HTTPS URL, vepiš ji sem (bez cesty na konci) a ulož.</li>
            </ol>
            <CopyBlock title="webadmin.env" value={files.webadmin} />
            <TextField
              label="Admin URL z Railway"
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              placeholder="https://xxx.up.railway.app"
            />
            <Button
              type="button"
              disabled={busy || adminInput.trim() === ''}
              onClick={() => void saveUrls({ admin_url: adminInput.trim().replace(/\/$/, '') })}
            >
              Uložit admin URL
            </Button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight">HostWeb (Netlify)</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
              <li>Nový site z repo <span className="font-mono">HostWebClient</span>, publish složka <span className="font-mono">dist</span>.</li>
              <li>
                V env vlož blok níže. <span className="font-mono">VITE_WEBADMIN_URL</span> musí být URL z kroku 1.
                Anon Supabase zkopíruj z existujícího HostWebu.
              </li>
              <li>
                V repo je <span className="font-mono">netlify.toml</span> — SPA redirect <span className="font-mono">/*</span> na{' '}
                <span className="font-mono">index.html</span>, jinak <span className="font-mono">/h/{slug}/</span> spadne.
              </li>
              <li>Po deployi vepiš origin webu (bez <span className="font-mono">/h/…</span>) a ulož.</li>
            </ol>
            <CopyBlock title="hostweb.env" value={files.hostweb} />
            <TextField
              label="Web URL z Netlify"
              value={webInput}
              onChange={(e) => setWebInput(e.target.value)}
              placeholder="https://xxx.netlify.app"
            />
            <Button
              type="button"
              disabled={busy || webInput.trim() === ''}
              onClick={() => void saveUrls({ web_url: webInput.trim().replace(/\/$/, '') })}
            >
              Uložit web URL
            </Button>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight">Mobil (EAS)</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
              <li>
                V repo <span className="font-mono">OtelApps</span> ulož blok do <span className="font-mono">.env</span>.
              </li>
              <li>
                Na zkoušku: <span className="font-mono">npx expo start</span>. Produkce:{' '}
                <span className="font-mono">npx eas build</span>.
              </li>
              <li>
                Jedna binárka = tento slug. App Store / Play listing sem nepatří — URL obchodu doplníš později v
                detailu hotelu.
              </li>
            </ol>
            <CopyBlock title="mobile.env" value={files.mobile} />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2 className="text-lg font-semibold tracking-tight">CORS a kontrola</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
              <li>
                V Railway WebAdminu do <span className="font-mono">CORS_ALLOWED_ORIGINS</span> přidej origin HostWebu
                (ten z kroku 2).
              </li>
              <li>Otevři admin a web níže. Cesta musí být <span className="font-mono">/h/{slug}/</span>.</li>
              <li>
                Health v HQ na localhost selže — to je v pořádku. Až budou veřejné HTTPS URL, tečka na seznamu ožije.
              </li>
              {hotel.profile.admin_email ? (
                <li>
                  Účet recepce <span className="font-mono">{hotel.profile.admin_email}</span> vytvoř ručně ve WebAdminu
                  (User admin), HQ ho nezakládá.
                </li>
              ) : null}
            </ol>
            <div className="flex flex-wrap gap-2 pt-2">
              {adminLink ? (
                <a className="hq-btn" href={adminLink} target="_blank" rel="noreferrer">
                  Otevřít admin
                </a>
              ) : (
                <p className="text-sm text-muted">Admin URL chybí — vrať se na krok WebAdmin.</p>
              )}
              {webLink ? (
                <a className="hq-btn-ghost" href={webLink} target="_blank" rel="noreferrer">
                  Otevřít web
                </a>
              ) : (
                <p className="text-sm text-muted">Web URL chybí — vrať se na krok HostWeb.</p>
              )}
            </div>
            <Link to={`/hotels/${slug}`} className="hq-btn-ghost mt-2 inline-flex">
              Hotovo, jít na detail
            </Link>
          </>
        ) : null}

        <label className="flex items-center gap-2 pt-2 text-sm">
          <input type="checkbox" checked={progress.done[step]} onChange={toggleDone} />
          Tento krok mám hotový
        </label>
      </Card>

      <div className="mt-4 flex justify-between">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Zpět
        </Button>
        {step < STEPS - 1 ? (
          <Button type="button" onClick={() => setStep(step + 1)}>
            Další
          </Button>
        ) : (
          <Link to={`/hotels/${slug}`} className="hq-btn">
            Detail hotelu
          </Link>
        )}
      </div>
    </div>
  );
}
