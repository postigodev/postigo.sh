export const resumeContent = {
  eyebrow: '[RESUME]',
  title: 'Resume',
  paragraphs: [
    'Software Engineer focused on backend and product engineering.',
    'This route is ready for the reviewed resume artifact.',
  ],
} as const;

export const privacyContent = {
  eyebrow: '[PUBLIC_DATA_DISCLOSURE]',
  title: 'Privacy',
  paragraphs: [
    "This portfolio displays the owner's current or recently played Spotify content: track or episode title, artist or publisher, album or show, cover art, playback status, progress, and a Spotify link. The server caches this display data for about 30 seconds.",
    'Visitors do not connect a Spotify account, and this site does not use Spotify to identify or track visitors. Spotify credentials remain server-side.',
    'GitHub profile statistics are public data cached for up to six hours.',
    "The location box uses Vercel's coarse IP-derived geo headers only after the configured administrator is authorized. It stores the latest city, region or country, timezone, and approximate latitude and longitude rounded to one decimal; it does not store an IP address or location history.",
    'The server sends only those rounded administrator coordinates to MET Norway for current weather, caches the result, and never geolocates portfolio visitors.',
  ],
} as const;

export const creditsContent = {
  eyebrow: '[CREDITS]',
  title: 'Credits',
  paragraphs: [
    'Icons by Pxlkit, used and adapted under the Pxlkit Asset License.',
    'Weather data from MET Norway, used under the Norwegian Licence for Open Government Data 2.0 and Creative Commons Attribution 4.0 International.',
  ],
} as const;
