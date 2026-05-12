import type { AnalysisProvider } from './provider';

export class MockProvider implements AnalysisProvider {
  name = 'Mock';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(_prompt: string, _systemPrompt?: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return '';
  }
}
