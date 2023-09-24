export function getEnvOrThrow(name: string): string {
  const v = process.env[name];
  if (v === undefined) {
    throw new Error(`Env Variable not found: '${name}'`);
  }

  return v;
}
