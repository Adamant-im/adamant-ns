import packageJson from '../../package.json' assert { type: 'json' };

export function getAppVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return packageJson.version;
}

export function getAppName(): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  return packageJson.name;
}
