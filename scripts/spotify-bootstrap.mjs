import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export const REDIRECT_URI = 'http://127.0.0.1:43821/callback';
export const SPOTIFY_SCOPES = 'user-read-currently-playing user-read-recently-played';
const CALLBACK_HOST = '127.0.0.1';
const CALLBACK_PORT = 43821;
const CALLBACK_TIMEOUT_MS = 120_000;

export function buildAuthorizeUrl({ clientId, state }) {
  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
  }).toString();
  return url;
}

function stateMatches(actual, expected) {
  const actualBytes = Buffer.from(actual ?? '');
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function validateCallback(url, expectedState) {
  if (url.pathname !== '/callback') throw new Error('invalid callback path');
  if (url.searchParams.has('error')) throw new Error('authorization denied');
  if (!stateMatches(url.searchParams.get('state'), expectedState)) throw new Error('state mismatch');
  const code = url.searchParams.get('code');
  if (!code) throw new Error('authorization code missing');
  return code;
}

async function promptVisible(label) {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    return (await readline.question(label)).trim();
  } finally {
    readline.close();
  }
}

async function promptHidden(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('SPOTIFY_CLIENT_SECRET must be supplied through the environment outside an interactive terminal');
  }
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      error ? reject(error) : resolve(value.trim());
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') return finish(new Error('bootstrap cancelled'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else value += character;
      }
    };
    stdin.on('data', onData);
  });
}

function waitForAuthorizationCode(expectedState, authorizeUrl) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const server = createServer((request, response) => {
      try {
        const callbackUrl = new URL(request.url ?? '/', REDIRECT_URI);
        const code = validateCallback(callbackUrl, expectedState);
        response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Spotify authorization received. You may close this tab.');
        finish(undefined, code);
      } catch (error) {
        response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Spotify authorization rejected. Return to the terminal.');
        finish(error instanceof Error ? error : new Error('authorization failed'));
      }
    });
    const timer = setTimeout(() => finish(new Error('authorization timed out')), CALLBACK_TIMEOUT_MS);
    const finish = (error, code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      error ? reject(error) : resolve(code);
    };
    server.once('error', finish);
    server.listen(CALLBACK_PORT, CALLBACK_HOST, () => {
      stdout.write(`Open this Spotify authorization URL:\n${authorizeUrl.toString()}\n`);
    });
  });
}

async function exchangeCode({ clientId, clientSecret, code }) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Spotify token exchange failed');
  const text = await response.text();
  if (Buffer.byteLength(text) > 65_536) throw new Error('Spotify token response was oversized');
  const refreshToken = JSON.parse(text).refresh_token;
  if (typeof refreshToken !== 'string' || refreshToken.trim() === '') {
    throw new Error('Spotify did not return a refresh token');
  }
  return refreshToken;
}

function safeEnvValue(value, name) {
  if (!value || /[\r\n]/.test(value)) throw new Error(`${name} is invalid`);
  return value;
}

async function main() {
  const clientId = safeEnvValue(process.env.SPOTIFY_CLIENT_ID?.trim() || await promptVisible('Spotify client ID: '), 'client ID');
  const clientSecret = safeEnvValue(process.env.SPOTIFY_CLIENT_SECRET?.trim() || await promptHidden('Spotify client secret: '), 'client secret');
  const state = randomBytes(32).toString('base64url');
  const authorizeUrl = buildAuthorizeUrl({ clientId, state });
  const code = await waitForAuthorizationCode(state, authorizeUrl);
  const refreshToken = safeEnvValue(await exchangeCode({ clientId, clientSecret, code }), 'refresh token');
  const contents = [
    `SPOTIFY_CLIENT_ID=${clientId}`,
    `SPOTIFY_CLIENT_SECRET=${clientSecret}`,
    `SPOTIFY_REFRESH_TOKEN=${refreshToken}`,
    '',
  ].join('\n');
  await writeFile('.env.spotify.local', contents, { encoding: 'utf8', mode: 0o600 });
  stdout.write('Spotify credentials saved to .env.spotify.local\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : 'Spotify bootstrap failed';
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
