process.env.HOST = '127.0.0.1';
process.env.PORT = '4322';
// Node adapter 11.1.4 otherwise calls a logger method absent from Astro 7.2.1.
process.env.ASTRO_NODE_LOGGING = 'disabled';

await import('../.e2e-dist/server/entry.mjs');
