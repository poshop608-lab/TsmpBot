// yf-proxy Cloudflare Worker
// Routes: /nq, /econ-calendar (TV), /ff-calendar (ForexFactory proxy)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    // ── /ff-calendar?week=thisweek|nextweek ──
    if (path === '/ff-calendar') {
      const week = url.searchParams.get('week') || 'thisweek';
      const ffWeek = week === 'nextweek' ? 'nextweek' : 'thisweek';
      const ffUrl = `https://nfs.faireconomy.media/ff_calendar_${ffWeek}.json`;

      // Try multiple user agents — FF rate-limits some Cloudflare IPs
      const agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0',
      ];
      for (const ua of agents) {
        try {
          const r = await fetch(ffUrl, {
            headers: {
              'User-Agent': ua,
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://www.forexfactory.com/',
              'Origin': 'https://www.forexfactory.com',
            },
            cf: { cacheTtl: 7200, cacheEverything: true },
          });
          if (r.ok) {
            const data = await r.json();
            return new Response(JSON.stringify(data), { headers: { ...cors, 'Cache-Control': 'public, max-age=3600' } });
          }
          if (r.status !== 429) {
            return new Response(JSON.stringify({ error: `FF returned ${r.status}` }), { status: r.status, headers: cors });
          }
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
        }
      }
      return new Response(JSON.stringify({ error: 'FF 429 all agents' }), { status: 429, headers: cors });
    }

    // ── /econ-calendar?week=this|next (TradingView) ──
    if (path === '/econ-calendar') {
      const week = url.searchParams.get('week') || 'this';
      const tvUrl = `https://economic-calendar.tradingview.com/events?from=${_weekFrom(week)}&to=${_weekTo(week)}&countries=US`;
      try {
        const r = await fetch(tvUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Origin': 'https://www.tradingview.com',
            'Referer': 'https://www.tradingview.com/',
          },
        });
        if (!r.ok) return new Response(JSON.stringify({ error: `TV returned ${r.status}` }), { status: r.status, headers: cors });
        const raw = await r.json();
        const events = (raw.result || []).map(e => ({
          title: e.title,
          date: e.date ? e.date.slice(0, 10) : '',
          time: e.date ? e.date.slice(11, 16) : '',
          impact: e.importance === 3 ? 'High' : e.importance === 2 ? 'Medium' : 'Low',
          forecast: e.forecast != null ? String(e.forecast) : '',
          previous: e.previous != null ? String(e.previous) : '',
          actual: e.actual != null ? String(e.actual) : '',
          currency: e.currency || 'USD',
          country: e.country || 'US',
        }));
        return new Response(JSON.stringify(events), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
      }
    }

    // ── /nq (Yahoo Finance NQ futures) ──
    if (path === '/nq') {
      try {
        const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/NQ%3DF?interval=1m&range=1d', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const data = await r.json();
        return new Response(JSON.stringify(data), { headers: cors });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
      }
    }

    return new Response('not found', { status: 404 });
  },
};

function _isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function _weekFrom(week) {
  const now = new Date();
  const dow = now.getUTCDay();
  const mon = new Date(now);
  if (week === 'next') {
    mon.setUTCDate(now.getUTCDate() + (dow === 0 ? 1 : 8 - dow));
  } else {
    mon.setUTCDate(now.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  }
  return _isoDate(mon);
}
function _weekTo(week) {
  const from = new Date(_weekFrom(week) + 'T00:00:00Z');
  from.setUTCDate(from.getUTCDate() + 4);
  return _isoDate(from);
}
