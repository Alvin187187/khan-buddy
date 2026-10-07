# Khan Buddy

Classroom layer around Khan Academy: Google Classroom–style classes, official KA lessons in-app, then a short multiplayer lab (guess, battle, build, solve, simulate). Join with class code or live PIN/QR.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

After the base schema, run `supabase/sql-chunks/05-multi-class.sql` in the SQL editor (drops one-class-per-teacher, adds announcements + live PIN games).

For classroom testing, in the Supabase dashboard turn **off** Authentication → Providers → Email → **Confirm email**, and set Site URL to your Vercel domain.

### Hotspot / LAN

`npm run build && npm start`, then phones open `http://<this-computer-ip>:3000`.

## Demo

1. Teacher signs in → **Classes** → create several rooms.
2. Stream: announce, share class QR. Classwork: assign a KA unit. **Open lesson in Khan Buddy**.
3. Play: launch a whole-class live game (virus, plant, sketch, ecosystem). Project the PIN. Students **Scan**.
4. Or students open a 2 / 3–5 table after the lesson.
5. Insights: who opened KA, live results, stuck concepts. No public fail ranking.
