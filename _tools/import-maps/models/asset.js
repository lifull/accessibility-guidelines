const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  glob = require('glob');

const DOCUMENT_ROOT = process.env.npm_package_config_documentRootDir;
const JSNEO_OUTPUT_PATH = process.env.npm_package_config_jsneoOutputPath;
const JSNEO_ORIGINAL_PATH = process.env.npm_package_config_jsneoOriginalPath;

class Asset {
  static DOCUMENT_ROOT_PATH = path.resolve(
    __dirname,
    `../../../${DOCUMENT_ROOT}/`
  );
  static BUILDED_PATH = path.resolve(
    __dirname,
    `../../../${JSNEO_OUTPUT_PATH}/`
  );

  constructor(filePath, ext = '.js') {
    this.filePath = filePath;
    this.ext = ext;
  }

  build() {
    fs.mkdirSync(this.constructor.BUILDED_PATH, { recursive: true });
    fs.copyFileSync(this.filePath, this.buildPath);
  }

  get content() {
    return fs.readFileSync(this.filePath, 'utf-8');
  }

  get digest() {
    if (!this._digest) {
      this._digest = crypto
        .createHash('sha1')
        .update(this.content, 'utf8')
        .digest('hex');
    }

    return this._digest;
  }

  get fileName() {
    return path.basename(this.filePath, this.ext);
  }

  get buildPath() {
    return `${this.constructor.BUILDED_PATH}/${this.fileName}-${this.digest}${this.ext}`;
  }

  get realWebPath() {
    return `/smp${this.buildPath.replace(
      new RegExp(`^${this.constructor.DOCUMENT_ROOT_PATH}`),
      ''
    )}`;
  }

  get aliasWebPath() {
    const dir = path.resolve(__dirname, `../../../${JSNEO_ORIGINAL_PATH}`);
    return this.filePath.replace(dir, '');
  }
}

class Assets {
  constructor(assets, importMapPath, aliases = {}) {
    this.assets = assets;
    this.importMapPath = importMapPath;
    this.aliases = aliases;
  }

  build() {
    this.assets.forEach(asset => asset.build());
  }

  add(newAsset) {
    let index = this.assets.findIndex(
      asset => asset.filePath === newAsset.filePath
    );
    if (index !== -1) {
      this.assets.splice(index, 1, newAsset);
      return;
    }
    this.assets.push(newAsset);
  }

  removeFromPath(path) {
    let index = this.assets.findIndex(asset => asset.filePath === path);
    if (index !== -1) {
      this.assets.splice(index, 1);
    }
  }

  saveAsImportMaps() {
    fs.mkdirSync(path.dirname(this.importMapPath), { recursive: true });
    fs.writeFileSync(
      this.importMapPath,
      JSON.stringify(this.importMaps, null, '  '),
      'utf-8'
    );

    console.log(
      `[import-maps] generated: \n${JSON.stringify(
        this.importMaps,
        null,
        '  '
      )}`
    );
  }

  get importMaps() {
    const mappings = this.assets.reduce((memo, asset) => {
      const alias = this.aliases[asset.aliasWebPath];
      memo[alias || asset.aliasWebPath] = `${asset.realWebPath}`;
      return memo;
    }, {});

    return {
      imports: mappings
    };
  }

  static getByPattern(pattern, importMapPath, aliases) {
    const files = glob.sync(pattern, { absolute: true });
    return new Assets(
      files.map(path => new Asset(path)),
      importMapPath,
      aliases
    );
  }
}

module.exports.Assets = Assets;
module.exports.Asset = Asset;
