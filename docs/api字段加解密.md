# 字段级 API 加解密

此版本移除整包协议和 `X-Api-Encrypt` 触发机制，前后端必须同步发布。未配置字段的接口不启用加密。本次未修改任何业务接口的加密清单。

## 后端

```java
@ApiEncrypt(requestFields = {"mobile", "address.detail"},
            responseFields = {"data.mobile", "data.list[*].mobile"})
@PostMapping("/example")
public CommonResult<?> example(@Valid @RequestBody ExampleReqVO request) { /* ... */ }
```

路径相对于实际 JSON，不是 Java 属性名。请求解密先于 DTO 绑定、Bean Validation；响应加密在序列化后进行，业务脱敏先于加密。类级注解可被方法级注解整体覆盖，`@ApiEncrypt` 空清单可关闭类级配置。

```yaml
yudao:
  api-encrypt:
    enable: true
    algorithm: SM4
    request-key: ${API_ENCRYPT_REQUEST_KEY}
    response-key: ${API_ENCRYPT_RESPONSE_KEY}
```

路径仅支持 `mobile`、`address.detail`、`items[*].mobile`、`tags[*]`，不支持索引和其他 JSONPath。重复路径只处理一次。缺失或 null 跳过，空字符串正常处理，非字符串报错。指定请求字段必须为密文，不回退明文。路径错误、类型错误、认证失败均拒绝请求，响应加密失败返回错误，不输出缓存中的明文。

仅支持 JSON 请求体和同步 JSON 响应。不支持查询参数、表单、文件上传下载、SSE 或异步流式响应；不要对这些接口声明字段清单。请求方法可为 POST、PUT、PATCH、DELETE。响应字段应置于 `data` 内，保留业务错误码和错误信息为明文。


## 小程序端

### 配置示例
```text
VITE_API_FIELD_CRYPTO_ALGORITHM=SM4
VITE_API_FIELD_CRYPTO_REQUEST_KEY=0123456789abcdeffedcba9876543210  # 请求参数加密用的公钥
VITE_API_FIELD_CRYPTO_RESPONSE_KEY=fedcba98765432100123456789abcdef  # 响应参数解密用的私钥
```

### 请求示例
```js
request({
  url: '/example',
  method: 'POST',
  data: { mobile: '13800138000', address: { detail: '北京市' } },
  custom: {
    fieldCrypto: {
      request: ['mobile', 'address.detail'],
      response: ['data.mobile', 'data.list[*].mobile'],
    },
  },
});
```

前端复制数据后转换；令牌刷新重放保留原始 JSON，重新加密，避免二次加密。响应解密先于业务判断和登录令牌读取。前后端清单必须同步维护，不在 HTTP 请求中传递字段清单。

两端 `.env.field-crypto.example` 提供本地示例，复制变量到实际 Vite 环境文件。算法默认 SM4；未声明字段时不会使用密钥。生产环境替换示例密钥。小程序需重新构建 npm 和项目。安全随机数使用浏览器 `crypto.getRandomValues` 或微信 `wx.getRandomValues`，缺少安全随机数的平台明确报错，不使用 Math.random。SM2、国密库依赖 BigInt，需要支持 BigInt 的运行环境；H5/微信小程序需进行真实设备兼容性验证。

### 微信小程序启动兼容

`node-forge` 1.3.3 在模块加载时通过 `window/self` 获取全局对象，可能导致小程序启动报 `Cannot read properties of undefined (reading 'crypto')`，即使接口未启用字段加密也会触发。

`vite.config.js` 注册的小程序兼容插件仅在 `mp-weixin` 生效：构建时适配该库的全局对象识别，并将安全熵不足时的弱随机数回退改为明确失败。插件排除该库的依赖预构建，并校验源码匹配和适配执行情况；依赖代码变化或适配未执行时中止构建。安装目录和其他平台的依赖内容不变。

微信安全随机数仍由异步 `wx.getRandomValues` 提供，返回格式和字节数必须正确；RSA 解密前继续注入平台安全熵。Forge 在 RSA 盲化的每次抽样时都会重新播种；重复抽样导致安全熵耗尽时，插件抛出 `FORGE_SECURE_RANDOM_REQUIRED`，字段加密模块异步补充平台安全熵后重试。其他解密错误和随机数 API 失败直接拒绝，不降级。不要通过伪造同步 `crypto.getRandomValues`、补空 `window` 或修改依赖文件来绕过异常。

更新后停止 HBuilderX 当前运行任务，再重新运行到微信小程序。先检查首个 `crypto` 异常是否消失；若仍出现 `wx://not-found`，继续单独检查组件注册和路径。

## 协议 v1

字段线格式为 `fc:v1:<ALGORITHM>:<Base64>`，Base64 使用标准字母表及 padding，不进行整包编码。加密前将字符串编码成 **JSON 字符串字面量的 UTF-8 字节**，例如空字符串为 `22 22`。解密后必须解析回字符串，不接受其他 JSON 类型。这也避免 SM2 对零字节明文的实现差异。

| 算法 | 密钥格式 | Base64 内的字节布局 |
| --- | --- | --- |
| AES | 16/24/32 字节 HEX | 12 字节随机 nonce + GCM 密文 + 16 字节 tag |
| SM4 | 16 字节 HEX | 12 字节随机 nonce + GCM 密文 + 16 字节 tag |
| RSA | 公钥 SPKI DER Base64；私钥 PKCS8 DER Base64；至少 2048 位 | OAEP SHA-256，MGF1 SHA-256，空 label，单块密文 |
| SM2 | 私钥 32 字节 HEX；公钥 65 字节非压缩 HEX（04 开头） | C1C3C2，C1 包含 04，C3 为 SM3 摘要，无 ASN.1 |

AES/SM4 使用 128 位认证标签，不填充、无 AAD，每次加密生成新 nonce。RSA 最大明文长度为密钥字节数减 66，计入 JSON 字符串编码开销；超长明确报错，不分段。长字段使用 AES 或 SM4。

后端 request-key 为解密私钥/对称密钥，对应前端 REQUEST_KEY 为加密公钥/同一对称密钥。后端 response-key 为加密公钥/对称密钥，对应前端 RESPONSE_KEY 为解密私钥/同一对称密钥。请求和响应可配置不同密钥。不提供密钥交换或密钥下发服务。前端配置随构建产物分发，不应视为隐藏于客户端的秘密；继续使用 HTTPS。

## 验证

后端 `ApiEncryptTest` 验证四种算法、篡改、空字符串、长文本和路径。其 `main generate <file>` 输出包含临时测试密钥的互通向量；`main verify <file>` 验证 JavaScript 输出。不要将生产密钥写入测试向量。

两端 `tests/api-field-crypto.test.mjs` 可运行：

```sh
node tests/api-field-crypto.test.mjs
node --test tests/forge-miniprogram.test.mjs
# 可选：验证 Java 向量并输出 JavaScript 密文，供 Java verify 使用
node tests/api-field-crypto.test.mjs /tmp/java-vectors.json /tmp/js-vectors.json
```

测试通过不代表已完成后端服务、真实浏览器、小程序设备、部署密钥和业务接口联调。

小程序兼容回归覆盖实际 `node-forge` 依赖在无浏览器全局对象时的加载、安全熵不足拒绝、RSA 解密兼容，以及微信随机数成功、失败、缺失和返回格式错误。模拟环境检查不替代微信开发者工具及真机验证。

2026-11-06 验证记录：

- 自动检查：新增小程序兼容回归、现有 AES/SM4/RSA/SM2 字段加密测试通过；强制 RSA 首次盲化候选被拒绝后，确认会补充安全随机数并完成解密，随机数 API 失败和密文损坏仍拒绝。
- 编译：使用本机 HBuilderX 配套编译器 5.34，在临时副本完成微信小程序运行模式和发行模式编译，确认两份产物均包含全局对象适配和安全熵保护；原项目 `manifest.json` 保持不变。
- 微信开发者工具启动日志：工具授权未就绪，未完成验证，不据此声称 `crypto` 或 `wx://not-found` 已在模拟器中消失。
- 真机验证、H5 页面检查及后端真实业务联调：未执行。
