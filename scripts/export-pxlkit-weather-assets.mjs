import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [modulePath, outputDir, selection = 'weather'] = process.argv.slice(2);
if (!modulePath || !outputDir) throw new Error('Usage: node export-pxlkit-weather-assets.mjs <module> <output-dir> [weather|effects]');

const icons = await import(pathToFileURL(modulePath).href);
const weather = {
  Sun: 'sun.svg', PulsingSun: 'pulsing-sun.svg', ClearNight: 'clear-night.svg',
  CloudSun: 'cloud-sun.svg', CloudyNight: 'cloudy-night.svg', Cloud: 'cloud.svg',
  Fog: 'fog.svg', DriftingFog: 'drifting-fog.svg', Drizzle: 'drizzle.svg',
  Rain: 'rain.svg', RainNight: 'rain-night.svg', Hail: 'hail.svg', Snow: 'snow.svg',
  FallingSnow: 'falling-snow.svg', SnowNight: 'snow-night.svg', Thunder: 'thunder.svg',
  LightningStrike: 'lightning-strike.svg',
};
const effects = { PixelRain: 'pixel-rain.svg', SparkBurst: 'spark-burst.svg' };
const selected = selection === 'effects' ? effects : weather;

function pixels(icon, grid = icon.grid, palette = icon.palette) {
  const result = [];
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y].length; x++) {
    const key = grid[y][x];
    if (key !== '.' && palette[key]) result.push({ x, y, color: palette[key] });
  }
  return result;
}

function rects(icon, grid = icon.grid, palette = icon.palette) {
  return pixels(icon, grid, palette).map(({ x, y, color }) =>
    `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`,
  ).join('');
}

function staticSvg(icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.size} ${icon.size}" shape-rendering="crispEdges">${rects(icon)}</svg>\n`;
}

function animatedSvg(icon) {
  const duration = icon.frames.length * icon.frameDuration;
  const step = (100 / icon.frames.length).toFixed(4);
  const styles = icon.frames.map((_, index) =>
    `.f${index}{opacity:0;animation:pxf ${duration}ms steps(1) ${index * icon.frameDuration}ms infinite both}`,
  ).join('');
  const frames = icon.frames.map((frame, index) => {
    const palette = frame.palette ? { ...icon.palette, ...frame.palette } : icon.palette;
    return `<g class="f${index}">${rects(icon, frame.grid, palette)}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.size} ${icon.size}" shape-rendering="crispEdges"><style>@keyframes pxf{0%{opacity:1}${step}%{opacity:0}100%{opacity:0}}${styles}</style>${frames}</svg>\n`;
}

await mkdir(outputDir, { recursive: true });
for (const [exportName, filename] of Object.entries(selected)) {
  const icon = icons[exportName];
  if (!icon) throw new Error(`Missing Pxlkit export: ${exportName}`);
  await writeFile(`${outputDir}/${filename}`, 'frames' in icon ? animatedSvg(icon) : staticSvg(icon));
  if (selection === 'effects') {
    const staticFilename = filename.replace('.svg', '-static.svg');
    const firstFrame = 'frames' in icon ? { ...icon, grid: icon.frames[0].grid, palette: { ...icon.palette, ...icon.frames[0].palette } } : icon;
    await writeFile(`${outputDir}/${staticFilename}`, staticSvg(firstFrame));
  }
}
