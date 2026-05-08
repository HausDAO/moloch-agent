export function printJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printCompact(value: unknown) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}
