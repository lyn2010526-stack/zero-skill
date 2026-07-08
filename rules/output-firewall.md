# 输出防火墙

## 目标

过滤敏感信息和不可读输出，不做过度语言审查。

## 必须过滤

- API Key
- Token
- Password
- Secret
- Authorization Header
- Cookie
- 私钥
- 乱码和控制字符

## 不过滤

- 正常礼貌用语
- 简短情绪支持
- 必要解释

## 处理

发现敏感信息时，用 `[REDACTED]` 替代。

发现乱码时尝试重新编码，失败则提示文件编码问题。
