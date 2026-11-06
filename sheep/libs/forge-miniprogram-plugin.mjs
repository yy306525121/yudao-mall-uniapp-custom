// node-forge 1.3.3 assumes browser globals and otherwise permits weak entropy.
// Adapt only the WeChat bundle; leave installed dependencies and other platforms intact.
export default function forgeMiniprogramPlugin(platform = process.env.UNI_PLATFORM) {
  if (platform !== 'mp-weixin') return;

  const transformed = new Set();
  const targets = ['util.js', 'prng.js'];
  function replaceOnce(source, pattern, replacement, file) {
    const matches = source.match(pattern);
    if (!matches || matches.length !== 1) {
      throw new Error(`node-forge 小程序兼容适配失败：${file} 源码与预期不符，请检查依赖版本`);
    }
    return source.replace(pattern, () => replacement);
  }

  return {
    name: 'forge-miniprogram-compat',
    enforce: 'pre',
    // Prebundling would hide the original modules from the guarded transform.
    config() {
      return { optimizeDeps: { exclude: ['node-forge'] } };
    },
    transform(source, id) {
      if (id.startsWith('\0')) return;
      const file = id.split('?')[0].replace(/\\/g, '/');
      const target = targets.find((name) => file.endsWith(`/node_modules/node-forge/lib/${name}`));
      if (!target) return;

      const code =
        target === 'util.js'
          ? replaceOnce(
              source,
              /return typeof self === 'undefined' \? window : self;/g,
              `return typeof globalThis !== 'undefined' && globalThis
    ? globalThis
    : (typeof self !== 'undefined' && self
      ? self
      : (typeof window !== 'undefined' && window ? window : {}));`,
              target,
            )
          : replaceOnce(
              source,
              /    \/\/ be sad and add some weak random data\n[\s\S]*?(?=    return b\.getBytes\(needed\);)/g,
              `    // Platform entropy must be supplied before synchronous RSA blinding.
    if(b.length() < needed) {
      var error = new Error('当前运行平台不提供足够的安全随机数');
      error.code = 'FORGE_SECURE_RANDOM_REQUIRED';
      throw error;
    }

`,
              target,
            );
      transformed.add(target);
      return { code, map: null };
    },
    generateBundle() {
      const missing = targets.filter((name) => !transformed.has(name));
      if (missing.length) {
        this.error(
          `node-forge 小程序兼容适配未执行：${missing.join(', ')}，请检查依赖解析和预构建缓存`,
        );
      }
    },
  };
}
