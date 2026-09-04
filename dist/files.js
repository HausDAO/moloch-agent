import fs from 'node:fs';
export function readJsonFile(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}
