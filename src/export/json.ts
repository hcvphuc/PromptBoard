import type { ProjectOutput } from '@/types/output';

export function exportJSON(output: ProjectOutput): string {
  return JSON.stringify(output, null, 2);
}