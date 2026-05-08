import fs from 'node:fs';

export function readJsonFile(path: string): unknown {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}
