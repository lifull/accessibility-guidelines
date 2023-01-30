const path = require('path');
const { Assets, Asset } = require('./models/asset');

const JSNEO_ORIGINAL_PATH = 'assets/js';
const IMPORTMAP_PATH = '_site/assets/js/importmaps.json';

const sources = path.resolve(__dirname, `../../${JSNEO_ORIGINAL_PATH}/**/*.js`);
const importMapsPath = path.resolve(__dirname, `../../${IMPORTMAP_PATH}`);

/* library系のalias */
const aliases = {
  '/library/npm/es-module-shims@1.6.2/es-module-shims.js': 'es-module-shims',
  '/library/npm/@hotwired/stimulus@3.2.1/stimulus.js': '@hotwired/stimulus',
  // '/library/npm/tabbable@6.0.1/tabbable.js': 'tabbable'
  //   'https://cdn.skypack.dev/@hotwired/stimulus@3.2': '@hotwired/stimulus',
};

const assets = Assets.getByPattern(sources, importMapsPath, aliases);

assets.build();
assets.saveAsImportMaps();

// watch
if (process.env.IMPORTMAP_GENERATE_MODE === 'watch') {
  const chokidar = require('chokidar');

  const watcher = chokidar.watch(sources, {
    ignored: /[/\\]\./,
    persistent: true,
    // watchをpollingモードにするオプション
    // ex: IMPORTMAP_WATCH_POLLING=1 npm run dev:js:importmaps
    ...(process.env.IMPORTMAP_WATCH_POLLING
      ? {
          usePolling: true
        }
      : {})
  });

  watcher.on('ready', () => {
    watcher
      .on('add', path => {
        const asset = new Asset(path);
        asset.build();
        assets.add(asset);
        assets.saveAsImportMaps();
      })
      .on('change', path => {
        const asset = new Asset(path);
        asset.build();
        assets.add(asset);
        assets.saveAsImportMaps();
      })
      .on('unlink', path => {
        assets.removeFromPath(path);
        assets.saveAsImportMaps();
      });
  });
}

console.log(`[import-maps] ${IMPORTMAP_PATH}`);
