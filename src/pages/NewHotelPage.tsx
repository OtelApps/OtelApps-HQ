import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Banner, Button, Card, SelectField, TextField } from '../components/ui';
import { formatApiError } from '../contexts/AuthContext';
import { createHotel, fetchHotels, type HotelRecord } from '../lib/api';

export function NewHotelPage() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [appName, setAppName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [copyFrom, setCopyFrom] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchHotels()
      .then((data) => setHotels(data.hotels))
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const hotel = await createHotel({
        slug,
        name,
        app_name: appName || name,
        admin_email: adminEmail || null,
        copy_modules_from: copyFrom || null,
      });
      navigate(`/hotels/${hotel.slug}/nasazeni`);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/" className="text-sm text-muted hover:text-ink">
        ← Seznam
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nový hotel</h1>
      <p className="mb-6 text-sm text-muted">
        Nejdřív uložíme hotel do databáze. Pak tě krok po kroku provedeme nasazením Adminu, webu a mobilu.
      </p>
      <form onSubmit={onSubmit}>
        <Card className="space-y-4 p-6">
          <TextField
            label="Slug (adresa /h/slug/)"
            className="font-mono"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="hotel-plzen"
            required
          />
          <TextField
            label="Jméno hotelu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Název v appce (volitelné)"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Stejné jako jméno, když necháš prázdné"
          />
          <TextField
            label="E-mail recepce (volitelné)"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <SelectField label="Zkopírovat moduly z" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="">Defaulty z configu</option>
            {hotels.map((hotel) => (
              <option key={hotel.slug} value={hotel.slug}>
                {hotel.name} ({hotel.slug})
              </option>
            ))}
          </SelectField>
          {error ? <Banner tone="error">{error}</Banner> : null}
          <Button type="submit" disabled={busy}>
            {busy ? 'Ukládám…' : 'Uložit a začít nasazení'}
          </Button>
        </Card>
      </form>
    </div>
  );
}
