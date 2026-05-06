import { OllamaProvider } from './src/ai/ollama';

async function main() {
  const provider = new OllamaProvider('https://ollama.com/v1', 'gemini-3-flash-preview', '95906ac4b56b4ac2bfbe2b3b3e26f62e.ED0wlWfIqlfRriJ4uo9ym6x1');
  console.log('Provider name:', provider.name);
  
  // Manually test isAvailable logic
  const base = 'https://ollama.com/v1';
  console.log('Testing isAvailable manually...');
  try {
    const res = await fetch(`${base}/models`, {
      method: 'GET',
      headers: { Authorization: `Bearer 95906ac4b56b4ac2bfbe2b3b3e26f62e.ED0wlWfIqlfRriJ4uo9ym6x1` },
    });
    console.log('Direct fetch - status:', res.status, 'ok:', res.ok);
  } catch(e) {
    console.log('Direct fetch failed:', e);
  }
  
  try {
    const avail = await provider.isAvailable();
    console.log('isAvailable:', avail);
  } catch(e) {
    console.error('isAvailable error:', e);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });