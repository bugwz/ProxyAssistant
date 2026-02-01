# PAC 订阅配置示例

## 格式说明

PAC (Proxy Auto-Config) 是一种使用 JavaScript 函数定义代理规则的标准格式。文件内容必须包含 `FindProxyForURL` 函数。

## 配置结构

```json
{
  "subscription": {
    "enabled": true,
    "current": "pac",
    "lists": {
      "pac": {
        "url": "https://example.com/proxy.pac",
        "content": "...",
        "refreshInterval": 1440,
        "reverse": false,
        "lastFetchTime": null
      }
    }
  }
}
```

## 完整 PAC 脚本示例

```javascript
// 示例 PAC 脚本
// 来源: https://example.com/proxy.pac

function FindProxyForURL(url, host) {
  // 直连规则
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      shExpMatch(host, "localhost") ||
      isInNet(host, "10.0.0.0", "255.0.0.0") ||
      isInNet(host, "172.16.0.0", "255.240.0.0") ||
      isInNet(host, "192.168.0.0", "255.255.0.0") ||
      isInNet(host, "127.0.0.0", "255.255.255.0")) {
    return "DIRECT";
  }

  // 公司内网代理
  if (shExpMatch(host, "*.company.com") ||
      shExpMatch(host, "*.internal.net")) {
    return "PROXY 10.12.56.112:9090";
  }

  // 国外网站走代理
  if (shExpMatch(host, "*.google.com") ||
      shExpMatch(host, "*.github.com") ||
      shExpMatch(host, "*.youtube.com") ||
      shExpMatch(host, "*.twitter.com")) {
    return "PROXY proxy.example.com:8080";
  }

  // 默认直连
  return "DIRECT";
}
```

## 常用 PAC 函数

| 函数 | 说明 |
|-----|------|
| `isPlainHostName(host)` | 判断是否为简单主机名（无域名点） |
| `dnsResolve(host)` | 解析主机名 IP |
| `isInNet(host, ip, mask)` | 判断主机是否在指定网段 |
| `shExpMatch(str, pattern)` | Shell 风格模式匹配 |
| `url.substring(0, 5) == "https:"` | URL 协议判断 |
| `return "DIRECT"` | 直连 |
| `return "PROXY ip:port"` | 使用代理 |
| `return "SOCKS5 ip:port"` | 使用 SOCKS5 代理 |

## 验证规则

订阅内容必须包含 `FindProxyForURL` 函数，否则会被识别为无效格式。

## 参考资源

- [MDN: Proxy Auto-Config (PAC) File](https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_(PAC)_file)
