export type ParsedArgs = {
  command: string;
  flags: Record<string, string | boolean>;
  positionals: string[];
};

export function parseArgs(argv: string[]): ParsedArgs {
  const [command = 'help', ...rest] = argv;
  const flags: Record<string, string | boolean> = {};
  const positionals: string[] = [];

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

  if (flags.guild && !flags.dao) flags.dao = flags.guild;

  return { command, flags, positionals };
}

export function stringFlag(flags: Record<string, string | boolean>, name: string, fallback?: string): string | undefined {
  const value = flags[name];
  if (typeof value === 'string') return value;
  return fallback;
}

export function requiredFlag(flags: Record<string, string | boolean>, name: string): string {
  const value = stringFlag(flags, name);
  if (!value) throw new Error(`Missing required --${name}`);
  return value;
}

export function numberFlag(flags: Record<string, string | boolean>, name: string, fallback: number): number {
  const value = stringFlag(flags, name);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`--${name} must be a non-negative integer`);
  return parsed;
}
