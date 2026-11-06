import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import forgeMiniprogramPlugin from '../sheep/libs/forge-miniprogram-plugin.mjs';
import { createFieldCrypto } from '../sheep/request/field-crypto/index.js';

const require = createRequire(import.meta.url);
const forgeRoot = path.dirname(require.resolve('node-forge'));
const vectors = JSON.parse(
  fs.readFileSync(new URL('./fixtures/field-crypto-v1.json', import.meta.url)),
);

// Load the real CommonJS dependency graph in a mini-program-like realm.
function loadForge({ patched = true, globals = {} } = {}) {
  const plugin = patched ? forgeMiniprogramPlugin('mp-weixin') : undefined;
  const context = vm.createContext({ setTimeout, clearTimeout, ...globals });
  vm.runInContext("Math.random = () => { throw new Error('weak entropy was used'); };", context);
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const original = fs.readFileSync(filename, 'utf8');
    const code = plugin?.transform(original, filename)?.code || original;
    const module = { exports: {} };
    cache.set(filename, module);
    function localRequire(id) {
      if (!id.startsWith('.')) throw new Error(`Unexpected platform dependency: ${id}`);
      return load(require.resolve(path.resolve(path.dirname(filename), id)));
    }
    vm.runInContext(`(function(require, module, exports) {\n${code}\n})`, context, {
      filename,
    })(localRequire, module, module.exports);
    return module.exports;
  }
  const forge = load(require.resolve('node-forge'));
  plugin?.generateBundle.call({ error: (message) => assert.fail(message) });
  return { forge, context };
}

test('compatibility applies only to the original WeChat forge modules and fails closed', () => {
  for (const platform of ['h5', 'app-plus', 'mp-alipay']) {
    assert.equal(forgeMiniprogramPlugin(platform), undefined);
  }
  const plugin = forgeMiniprogramPlugin('mp-weixin');
  assert.deepEqual(plugin.config().optimizeDeps.exclude, ['node-forge']);
  assert.equal(plugin.transform('untouched', '/project/src/util.js'), undefined);
  assert.equal(
    plugin.transform('untouched', '\0/project/node_modules/node-forge/lib/util.js'),
    undefined,
  );
  for (const name of ['util.js', 'prng.js']) {
    const id = path.join(forgeRoot, name);
    const original = fs.readFileSync(id, 'utf8');
    assert.throws(() => plugin.transform('unexpected dependency version', id), /源码与预期不符/);
    assert.throws(() => plugin.transform(original + original, id), /源码与预期不符/);
    assert.ok(plugin.transform(original, id + '?commonjs').code);
  }
  assert.doesNotThrow(() => plugin.generateBundle());
  assert.throws(
    () =>
      forgeMiniprogramPlugin('mp-weixin').generateBundle.call({
        error: (message) => {
          throw new Error(message);
        },
      }),
    /兼容适配未执行/,
  );
});

test('real forge loads without browser globals, with a safe fallback when globalThis is absent', () => {
  assert.throws(
    () => loadForge({ patched: false, globals: { window: undefined } }),
    /Cannot read properties of undefined \(reading 'crypto'\)/,
  );
  for (const globals of [
    {},
    { globalThis: undefined },
    { globalThis: undefined, self: {} },
    { globalThis: undefined, window: {} },
  ]) {
    const { forge } = loadForge({ globals });
    assert.equal(
      forge.md.sha256.create().update('abc').digest().toHex(),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    assert.throws(() => forge.random.getBytesSync(32), /不提供足够的安全随机数/);
  }
});

test('RSA blinding refills platform entropy after a rejected candidate and preserves failure handling', async () => {
  const browser = loadForge({ globals: { crypto: webcrypto } }).forge;
  assert.equal(browser.random.getBytesSync(32).length, 32);

  const { forge, context } = loadForge();
  let requests = 0;
  let rngFailure;
  context.wx = {
    getRandomValues({ length, success, fail }) {
      requests++;
      if (rngFailure) return fail(rngFailure);
      const values = vm.runInContext(`new Uint8Array(${length})`, context);
      webcrypto.getRandomValues(values);
      success({ randomValues: values.buffer });
    },
  };
  const source = fs
    .readFileSync(new URL('../sheep/request/field-crypto/index.js', import.meta.url), 'utf8')
    .replace(/^import .*\n/gm, '')
    .replace(/^export /gm, '');
  const createFieldCrypto = vm.runInContext(
    `(function(forge) { ${source}\nreturn createFieldCrypto; })`,
    context,
  )(forge);
  const vector = vectors.find((item) => item.algorithm === 'RSA');
  const crypto = createFieldCrypto(vector);
  const getBytes = forge.random.getBytes;
  let draws = 0;
  let refills = 0;
  forge.random.getBytes = function (count) {
    let result;
    try {
      result = getBytes.call(this, count);
    } catch (error) {
      if (error.code === 'FORGE_SECURE_RANDOM_REQUIRED') refills++;
      throw error;
    }
    // Consume real entropy, then force the first candidate outside the RSA modulus.
    return draws++ === 0 ? '\xff'.repeat(count) : result;
  };
  for (const item of vector.cases) {
    assert.equal(await crypto.decrypt(item.cipher), item.plain);
  }
  assert.ok(refills > 0);
  assert.ok(requests > vector.cases.length);
  rngFailure = new Error('wx secure entropy failed');
  await assert.rejects(crypto.decrypt(vector.cases[0].cipher), (error) => error === rngFailure);
  rngFailure = undefined;
  const corrupted = Buffer.from(vector.cases[0].cipher.split(':').at(-1), 'base64');
  corrupted[corrupted.length - 1] ^= 1;
  await assert.rejects(crypto.decrypt('fc:v1:RSA:' + corrupted.toString('base64')));
});

test('field encryption uses wx entropy without globalThis and rejects unavailable or invalid entropy', async () => {
  const runtime = globalThis;
  const descriptors = Object.fromEntries(
    ['globalThis', 'crypto', 'wx'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(runtime, key),
    ]),
  );
  const requests = [];
  const key = '0123456789abcdeffedcba9876543210';
  try {
    Object.defineProperty(runtime, 'crypto', { configurable: true, value: undefined });
    runtime.globalThis = undefined;
    runtime.wx = {
      getRandomValues({ length, success }) {
        requests.push(length);
        success({ randomValues: webcrypto.getRandomValues(new Uint8Array(length)).buffer });
      },
    };
    for (const algorithm of ['AES', 'SM4']) {
      const crypto = createFieldCrypto({ algorithm, requestKey: key, responseKey: key });
      const first = await crypto.encrypt('微信安全随机数');
      const second = await crypto.encrypt('微信安全随机数');
      assert.notEqual(first, second);
      assert.equal(await crypto.decrypt(first), '微信安全随机数');

      const failure = new Error('wx.getRandomValues failed');
      runtime.wx.getRandomValues = ({ fail }) => fail(failure);
      await assert.rejects(crypto.encrypt('must reject'), (error) => error === failure);
      for (const values of [new ArrayBuffer(0), new ArrayBuffer(11), undefined]) {
        runtime.wx.getRandomValues = ({ success }) => success({ randomValues: values });
        await assert.rejects(crypto.encrypt('must reject'), /平台安全随机数返回长度或格式无效/);
      }
      runtime.wx = undefined;
      await assert.rejects(crypto.encrypt('must reject'), /不提供安全随机数 API/);
      runtime.wx = {
        getRandomValues({ length, success }) {
          requests.push(length);
          success({ randomValues: webcrypto.getRandomValues(new Uint8Array(length)).buffer });
        },
      };
    }
    assert.deepEqual(requests, [12, 12, 12, 12]);
  } finally {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(runtime, key, descriptor);
      else delete runtime[key];
    }
  }
});
