# Filmoteka

Movies, series and the people behind them, with favorites, follows and a daily guessing game.
Built with SvelteKit and Svelte 5, powered by Supabase and TMDB. Runs on [Bun](https://bun.sh).

## Getting started

```sh
bun install
cp .env.example .env   # then fill in your keys
bun run dev
```

## Commands

| Command           | What it does                       |
| ----------------- | ---------------------------------- |
| `bun run dev`     | Dev server, running on Bun         |
| `bun run build`   | Production build for Vercel        |
| `bun run preview` | Serves the production build on Bun |
| `bun run check`   | Type and Svelte checks             |
| `bun run lint`    | Prettier and ESLint                |
| `bun run format`  | Formats the code                   |

`bun run build` deliberately runs Vite under Node. SvelteKit analyses routes in a worker that calls
`process.exit()`, and under `bun --bun` that ends the whole build early with exit code 0 and no output.
Vercel functions still run on Bun, through `runtime: 'bun1.x'` in `vite.config.js`.

## Environment

See [.env.example](.env.example). All keys stay on the server: the browser reaches Supabase through
the `/api/sb` gateway, which adds the key itself, blocks admin endpoints and runs signed-in requests
under the visitor's own token.
