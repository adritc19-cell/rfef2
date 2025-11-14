# RFEF Segunda Federación Grupo 5 — Renderer (Vercel)
- Arreglado: `export const config = { runtime: 'nodejs' }` (file-level config).
- Sin `vercel.json` para evitar conflictos. La versión de Node se fuerza con `engines.node: 20.x`.
- Dependencias: `@sparticuz/chromium@126`, `puppeteer-core@23.5`.

## Deploy
1) Sube esta carpeta a GitHub y en vercel.com → Add New Project → Import.
2) Deploy. La función queda en `/api/segunda-g5`.

## Prueba
HTML:
`/api/segunda-g5?target=https%3A%2F%2Fwww.rfef.es%2Fes%2Fcompeticiones%2Fsegunda-federacion&click=grupo%205|clasificaci%C3%B3n&selector=table&html=1`

JSON:
`/api/segunda-g5?target=...&html=0`
