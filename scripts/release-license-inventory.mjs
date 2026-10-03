import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const rootModules = join(process.cwd(), 'node_modules');
const store = join(rootModules, '.pnpm');
const packages = new Map();

function record(path) {
  try {
    const manifest = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'));
    if (!manifest.name || !manifest.version) return;
    const license = typeof manifest.license === 'string' ? manifest.license : null;
    packages.set(`${manifest.name}@${manifest.version}`, {
      name: manifest.name,
      version: manifest.version,
      license,
      needsReview: !license || /^(UNKNOWN|UNLICENSED|SEE LICENSE)/i.test(license),
    });
  } catch {
    // A virtual-store entry can contain links that do not have a package manifest.
  }
}

function scanModules(modules) {
  for (const name of readdirSync(modules, {withFileTypes: true})) {
    if (name.name.startsWith('.')) continue;
    if (name.name.startsWith('@')) {
      for (const child of readdirSync(join(modules, name.name))) {
        record(join(modules, name.name, child));
      }
    } else {
      record(join(modules, name.name));
    }
  }
}

scanModules(rootModules);
for (const entry of readdirSync(store, {withFileTypes: true})) {
  if (!entry.isDirectory()) continue;
  const modules = join(store, entry.name, 'node_modules');
  let names;
  try {
    names = readdirSync(modules, {withFileTypes: true});
  } catch {
    continue;
  }
  if (names.length) scanModules(modules);
}

const items = [...packages.values()].sort((a, b) =>
  `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`),
);
process.stdout.write(
  JSON.stringify({packages: items, reviewCount: items.filter(x => x.needsReview).length}, null, 2),
);
