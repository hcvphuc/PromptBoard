import { proxyFetch } from './src/ai/proxyFetch';

async function main() {
  console.log('Testing proxyFetch directly...');
  try {
    const result = await proxyFetch('https://ollama.com/v1/models', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer 95906ac4b56b4ac2bfbe2b3b3e26f62e.ED0wlWfIqlfRriJ4uo9ym6x1' },
    });
    console.log('proxyFetch result:', { ok: result.ok, status: result.status, bodyLength: result.body?.length, bodyStart: result.body?.substring(0, 200) });
  } catch (e) {
    console.error('proxyFetch error:', e);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });