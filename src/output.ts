export function printJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, jsonReplacer, 2)}\n`);
}

export function printCompact(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, jsonReplacer)}\n`);
}

export function jsonReplacer(_key: string, value: unknown) {
  if (typeof value === 'bigint') return value.toString();
  return value;
}
