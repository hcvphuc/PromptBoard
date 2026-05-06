import { OllamaProvider } from './src/ai/ollama';

async function main() {
  console.log('Step 1: imported OllamaProvider');
  const provider = new OllamaProvider('https://ollama.com/v1', 'gemini-3-flash-preview', '95906ac4b56b4ac2bfbe2b3b3e26f62e.ED0wlWfIqlfRriJ4uo9ym6x1');
  console.log('Step 2: created provider:', provider.name);
  const available = await provider.isAvailable();
  console.log('Step 3: available:', available);
  if (!available) {
    console.error('Provider not available!');
    process.exit(1);
  }
  console.log('DONE');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });