中文简体 | [English](README_en-US.md)

[![Build Status](https://github.com/axetroy/fata/workflows/test/badge.svg)](https://github.com/axetroy/fata/actions)

基于 Fetch 的优雅的/现代化的 HTTP 客户端

### 安装

```bash
$ npm install @axetroy/fata --save-exact
```

```typescript
import fata from '@axetroy/fata

fata.get("/api/api/user/{userId}", { path: { userId: 'foo' } })
  .then((data) => {
    console.log(data)
  })
```

## 开源许可

The [MIT License](LICENSE)
