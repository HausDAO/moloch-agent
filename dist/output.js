export function printJson(value) {
    process.stdout.write(`${JSON.stringify(value, jsonReplacer, 2)}\n`);
}
export function printCompact(value) {
    process.stdout.write(`${JSON.stringify(value, jsonReplacer)}\n`);
}
export function jsonReplacer(_key, value) {
    if (typeof value === 'bigint')
        return value.toString();
    return value;
}
