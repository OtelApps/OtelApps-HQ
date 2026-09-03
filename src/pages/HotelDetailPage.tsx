import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Banner, Button, Card, TextField } from '../components/ui';
import { formatApiError } from '../contexts/AuthContext';
import {
  adminUrl,
  deleteHotel,
  fetchCatalog,
  fetchHotel,
  guestWebUrl,
  type HotelRecord,
  type ModuleCatalogItem,
  updateHotel,
  updateHotelModules,
} from '../lib/api';

const emptyForm = {
  name: '',
  app_name: '',
  admin_url: '',
  web_url: '',
  lat: '',
  lng: '',
  admin_email: '',
  app_store_url: '',
  play_store_url: '',
};

export function HotelDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<HotelRecord | null>(null);
  const [catalog, setCatalog] = useState<ModuleCatalogItem[]>([]);
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [row, cat] = await Promise.all([fetchHotel(slug), fetchCatalog()]);
        if (cancelled) return;
        setHotel(row);
        setCatalog(cat.modules);
        setModules(row.modules);
        setForm({
          name: row.name,
          app_name: row.profile.app_name,
          admin_url: row.profile.admin_url,
          web_url: row.profile.web_url,
          lat: row.profile.lat == null ? '' : String(row.profile.lat),
          lng: row.profile.lng == null ? '' : String(row.profile.lng),
          admin_email: row.profile.admin_email,
          app_store_url: row.profile.app_store_url,
          play_store_url: row.profile.play_store_url,
        });
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const web = hotel ? guestWebUrl(hotel) : null;
  const admin = hotel ? adminUrl(hotel) : null;

  function setField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const updated = await updateHotel(slug, {
        name: form.name,
        app_name: form.app_name,
        admin_url: form.admin_url,
        web_url: form.web_url,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
        admin_email: form.admin_email,
        app_store_url: form.app_store_url,
        play_store_url: form.play_store_url,
      });
      setHotel(updated);
      setStatus('Profil uložen.');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveModules(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const updated = await updateHotelModules(slug, modules);
      setModules(updated.modules);
      setStatus('Moduly uloženy.');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  function closeDelete() {
    setDeleteStep(0);
    setDeleteConfirmation('');
    setDeletePassword('');
  }

  async function confirmDelete(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await deleteHotel(slug, deleteConfirmation.trim(), deletePassword);
      navigate('/', { replace: true });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !hotel) {
    return <Banner tone="error">{error}</Banner>;
  }
  if (!hotel) {
    return <Card className="h-40 animate-pulse bg-slate-50" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-muted hover:text-ink">
            ← Seznam
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{hotel.name}</h1>
          <p className="mt-0.5 font-mono text-xs text-muted">{hotel.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link className="hq-btn-ghost h-9 px-3" to={`/hotels/${hotel.slug}/nasazeni`}>
            Pokračovat v nasazení
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
      </div>
      {error ? <Banner tone="error">{error}</Banner> : null}
      {status ? <Banner tone="ok">{status}</Banner> : null}

      <form onSubmit={saveProfile}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold tracking-tight">Profil</h2>
          <p className="mb-5 text-sm text-muted">Pole z YAML šablony. Slug po vytvoření neměň.</p>
          <p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Identita</p>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Jméno" value={form.name} onChange={(e) => setField('name', e.target.value)} />
            <TextField
              label="App name"
              value={form.app_name}
              onChange={(e) => setField('app_name', e.target.value)}
            />
          </div>
          <p className="mt-6 mb-3 text-xs font-medium tracking-wide text-muted uppercase">URL</p>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Admin URL"
              value={form.admin_url}
              onChange={(e) => setField('admin_url', e.target.value)}
            />
            <TextField label="Web URL" value={form.web_url} onChange={(e) => setField('web_url', e.target.value)} />
          </div>
          <p className="mt-6 mb-3 text-xs font-medium tracking-wide text-muted uppercase">Geo a store</p>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Lat" value={form.lat} onChange={(e) => setField('lat', e.target.value)} />
            <TextField label="Lng" value={form.lng} onChange={(e) => setField('lng', e.target.value)} />
            <TextField
              label="Admin e-mail"
              type="email"
              value={form.admin_email}
              onChange={(e) => setField('admin_email', e.target.value)}
            />
            <TextField
              label="App Store"
              value={form.app_store_url}
              onChange={(e) => setField('app_store_url', e.target.value)}
            />
            <TextField
              label="Play Store"
              value={form.play_store_url}
              onChange={(e) => setField('play_store_url', e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="mt-6">
            Uložit profil
          </Button>
        </Card>
      </form>

      <form onSubmit={saveModules}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold tracking-tight">Moduly</h2>
          <p className="mb-5 text-sm text-muted">Overlay nad config/modules.php.</p>
          <div className="grid gap-1.5 md:grid-cols-2 lg:grid-cols-3">
            {catalog.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={modules[item.key] ?? item.enabled_default}
                  onChange={(e) =>
                    setModules((prev) => ({
                      ...prev,
                      [item.key]: e.target.checked,
                    }))
                  }
                />
                <span>
                  <span className="block text-sm">{item.label}</span>
                  <span className="font-mono text-[11px] text-muted">{item.key}</span>
                </span>
              </label>
            ))}
          </div>
          <Button type="submit" disabled={busy} className="mt-6">
            Uložit moduly
          </Button>
        </Card>
      </form>

      <Card className="border-red-200 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-red-800">Nebezpečná zóna</h2>
        <p className="mt-1 text-sm text-muted">
          Smazání hotelu odstraní všechna hotelová data v databázi i staff účty WebAdminu. SuperAdmin zůstane.
          Nasazené Railway / Netlify / EAS projekty se nesmažou.
        </p>
        {(hotel.staff ?? []).length > 0 ? (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {(hotel.staff ?? []).map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  <span className="block font-medium">{member.name}</span>
                  <span className="block text-xs text-muted">{member.email}</span>
                </span>
                <span className="text-xs text-muted">{member.user_type}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">Žádné staff účty vázané na tento hotel.</p>
        )}
        <Button type="button" variant="danger" disabled={busy} className="mt-6" onClick={() => setDeleteStep(1)}>
          Smazat hotel
        </Button>
      </Card>

      {deleteStep > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <Card className="w-full max-w-md p-6">
            {deleteStep === 1 ? (
              <>
                <h3 className="text-lg font-semibold tracking-tight">Opravdu smazat {hotel.name}?</h3>
                <p className="mt-2 text-sm text-muted">
                  Zmizí všechna data hotelu včetně rezervací, concierge, financí a {(hotel.staff ?? []).length} staff
                  účtů. Tuto akci nelze vrátit.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={closeDelete}>
                    Zrušit
                  </Button>
                  <Button type="button" variant="danger" onClick={() => setDeleteStep(2)}>
                    Ano, chci smazat
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={confirmDelete}>
                <h3 className="text-lg font-semibold tracking-tight">Druhé potvrzení</h3>
                <p className="mt-2 text-sm text-muted">
                  Opište slug <span className="font-mono text-ink">{hotel.slug}</span> a zadejte heslo SuperAdmina.
                </p>
                <div className="mt-4 space-y-3">
                  <TextField
                    label="Slug hotelu"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <TextField
                    label="SuperAdmin"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                {error ? (
                  <div className="mt-4">
                    <Banner tone="error">{error}</Banner>
                  </div>
                ) : null}
                <div className="mt-6 flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={closeDelete} disabled={busy}>
                    Zrušit
                  </Button>
                  <Button type="submit" variant="danger" disabled={busy || deleteConfirmation.trim() !== hotel.slug}>
                    {busy ? 'Mažu…' : 'Smazat navždy'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
