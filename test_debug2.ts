import { OllamaProvider } from './src/ai/ollama';

async function main() {
  // baseUrl should be 'https://ollama.com' — the provider appends /v1/ internally
  const provider = new OllamaProvider('https://ollama.com', 'gemini-3-flash-preview', '95906ac4b56b4ac2bfbe2b3b3e26f62e.ED0wlWfIqlfRriJ4uo9ym6x1');
  console.log('Provider name:', provider.name);
  
  try {
    const avail = await provider.isAvailable();
    console.log('isAvailable:', avail);
  } catch(e) {
    console.error('isAvailable error:', e);
  }
  
  // Quick generate test
  try {
    console.log('Testing generate...');
    const result = await provider.generate('Return a JSON object: {"hello": "world"}', 'You are a helpful assistant. Always respond with valid JSON only.');
    console.log('Generate result:', result.substring(0, 300));
  } catch(e) {
    console.error('Generate error:', e);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });