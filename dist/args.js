export function parseArgs(argv) {
    const [command = 'help', ...rest] = argv;
    const flags = {};
    const positionals = [];
    for (let i = 0; i < rest.length; i += 1) {
        const item = rest[i];
        if (!item.startsWith('--')) {
            positionals.push(item);
            continue;
        }
        const key = item.slice(2);
        const next = rest[i + 1];
        if (!next || next.startsWith('--')) {
            flags[key] = true;
            continue;
        }
        flags[key] = next;
        i += 1;
    }
    return { command, flags, positionals };
}
export function stringFlag(flags, name, fallback) {
    const value = flags[name];
    if (typeof value === 'string')
        return value;
    return fallback;
}
export function requiredFlag(flags, name) {
    const value = stringFlag(flags, name);
    if (!value)
        throw new Error(`Missing required --${name}`);
    return value;
}
export function numberFlag(flags, name, fallback) {
    const value = stringFlag(flags, name);
    if (!value)
        return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0)
        throw new Error(`--${name} must be a non-negative integer`);
    return parsed;
}
