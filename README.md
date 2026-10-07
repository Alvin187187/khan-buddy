# Khan Buddy

Web-mobile classroom app: one class, Khan Academy as the learning platform, then peer labs (2 or 3–5 students). Not a Kahoot clone.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

For classroom testing, in the Supabase dashboard turn **off** Authentication → Providers → Email → **Confirm email**, and set Site URL to your Vercel domain.

### Hotspot / LAN

`npm run build && npm start`, then phones open `http://<this-computer-ip>:3000`.

## Demo

1. Teacher signs up → create class → complete Khan Academy setup.
2. Assign **The cell cycle**. Students open the official KA unit, then a 3–5 **Cell Builder** table.
3. Assign **Functions** for a 2-player **Function Machine**.
4. Teacher Insights: named students, last KA open, stuck concept, reteach link. No public fail ranking.
