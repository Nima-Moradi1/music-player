const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const cli = require.resolve('react-native/cli.js', {paths: [root]});
const output = execFileSync(process.execPath, [cli, 'config'], {
  cwd: path.join(root, 'app'),
  encoding: 'utf8',
});
const alias = process.env.MUSIC_PLAYER_SHORT_ROOT;
if (!alias) {
  process.stdout.write(output);
} else {
  const canonical = fs.realpathSync.native(root);
  const remap = value => {
    if (typeof value === 'string' && value.toLowerCase().startsWith(canonical.toLowerCase())) {
      return alias.replace(/[\\/]$/, '') + value.slice(canonical.length);
    }
    if (Array.isArray(value)) {return value.map(remap);}
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, remap(item)]));
    }
    return value;
  };
  process.stdout.write(JSON.stringify(remap(JSON.parse(output))));
}

