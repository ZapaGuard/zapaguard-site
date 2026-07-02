// Gateway stats for the homepage tiles and the /stats page.
// Tries the live worker endpoint first and falls back to generated demo data,
// so the pages work tonight and light up automatically once the API ships.

export const STATS_URL = 'https://get.zapaguard.com/-/zapaguard/stats';

export interface StatsSeries {
  count: number[];
  bytes: number[];
  totalCount: number;
  totalBytes: number;
}

export interface RangeStats {
  buckets: number[]; // bucket start times, unix seconds (hourly for 24h, daily for 30d)
  scans: StatsSeries;
  downloads: StatsSeries;
}

export interface BlockedEntry {
  ts: number;
  scanner: string; // engine that raised the block: clamav | osv.db | guarddog
  package: string;
  reason: string;
}

export interface Stats {
  generatedAt: string;
  h24: RangeStats;
  d30: RangeStats;
  blocked: BlockedEntry[];
  mock: boolean;
}

export async function loadStats(): Promise<Stats> {
  try {
    const resp = await fetch(STATS_URL, { signal: AbortSignal.timeout(4000) });
    if (!resp.ok) throw new Error(`stats endpoint returned ${resp.status}`);
    const data = await resp.json();
    if (!data.h24?.buckets || !data.d30?.buckets) throw new Error('unexpected payload');
    return { ...data, mock: false };
  } catch {
    return mockStats();
  }
}

// mulberry32 — seeded so the demo numbers stay put within the hour instead of
// changing on every navigation.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export function mockStats(): Stats {
  const HOUR = 3600;
  const DAY = 86400;
  const nowHour = Math.floor(Date.now() / 1000 / HOUR) * HOUR;
  const today = Math.floor(Date.now() / 1000 / DAY) * DAY;
  const rand = rng(nowHour);

  const hourly = (base: number, avgBytes: number): StatsSeries => {
    const count: number[] = [];
    const bytes: number[] = [];
    for (let i = 23; i >= 0; i--) {
      const utcHour = new Date((nowHour - i * HOUR) * 1000).getUTCHours();
      // diurnal curve peaking mid-work-day (UTC), never fully idle
      const daylight = 0.55 + 0.45 * Math.sin(((utcHour - 4) / 24) * 2 * Math.PI);
      const c = Math.round(base * daylight * (0.85 + rand() * 0.3));
      count.push(c);
      bytes.push(Math.round(c * avgBytes * (0.7 + rand() * 0.6)));
    }
    return { count, bytes, totalCount: sum(count), totalBytes: sum(bytes) };
  };

  const daily = (base: number, avgBytes: number): StatsSeries => {
    const count: number[] = [];
    const bytes: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const dow = new Date((today - i * DAY) * 1000).getUTCDay();
      const weekday = dow === 0 || dow === 6 ? 0.55 : 1; // weekend dip
      const c = Math.round(base * 17 * weekday * (0.85 + rand() * 0.3));
      count.push(c);
      bytes.push(Math.round(c * avgBytes * (0.7 + rand() * 0.6)));
    }
    return { count, bytes, totalCount: sum(count), totalBytes: sum(bytes) };
  };

  const blockedSamples: [string, string, string][] = [
    ['event-stream-utils', 'clamav', 'Js.Trojan.NpmMiner-9871264-0'],
    ['@types/node-fetch2', 'osv.db', 'MAL-2026-11842: malicious code in @types/node-fetch2'],
    ['discord-selfbot-v14', 'clamav', 'Js.Trojan.TokenStealer-7712905-0'],
    ['colorsjs', 'osv.db', 'MAL-2026-09310: typosquat of colors, exfiltrates env vars'],
    ['requets', 'clamav', 'Unix.Trojan.Generic-6591283-1'],
    ['webb3-utils', 'osv.db', 'MAL-2026-10077: wallet drainer in postinstall'],
    ['expresss-session', 'clamav', 'Js.Malware.Agent-6811023-1'],
    ['node-ipc-patch', 'clamav', 'Js.Trojan.Wiper-7263381-0'],
    ['crossenv', 'osv.db', 'MAL-2017-00219: exfiltrates environment variables'],
    ['loadash.merge', 'clamav', 'Js.Downloader.Generic-9034812-2'],
  ];
  let ts = nowHour - Math.round(rand() * HOUR);
  const blocked: BlockedEntry[] = blockedSamples.map(([pkg, scanner, sig]) => {
    ts -= Math.round((0.5 + rand() * 5) * HOUR);
    return { ts, scanner, package: pkg, reason: sig };
  });

  return {
    generatedAt: new Date().toISOString(),
    h24: {
      buckets: Array.from({ length: 24 }, (_, i) => nowHour - (23 - i) * HOUR),
      scans: hourly(820, 2.4 * 1024 * 1024), // ~19.7k scans / ~46 GB per day
      downloads: hourly(1010, 2.2 * 1024 * 1024),
    },
    d30: {
      buckets: Array.from({ length: 30 }, (_, i) => today - (29 - i) * DAY),
      scans: daily(820, 2.4 * 1024 * 1024),
      downloads: daily(1010, 2.2 * 1024 * 1024),
    },
    blocked,
    mock: true,
  };
}

export const fmtCount = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 10000 ? `${(n / 1e3).toFixed(1)}k` : n.toLocaleString('en-US');

export const fmtGB = (bytes: number): string => {
  const gb = bytes / 1024 ** 3;
  return gb >= 100 ? `${gb.toFixed(0)} GB` : gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
};

export const fmtHour = (ts: number): string =>
  new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const fmtDay = (ts: number): string =>
  new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });

export const fmtWhen = (ts: number): string =>
  new Date(ts * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
