[中文简体](README.md) | English

[![Build Status](https://github.com/axetroy/fetest/workflows/test/badge.svg)](https://github.com/axetroy/fetest/actions)

Elegant/modern HTTP client based on Fetch

### Installation

```bash
$ npm install @axetroy/fetest --save-exact
```

```typescript
import fetest from '@axetroy/fetest

fetest.get("/api/api/user/{userId}", { path: { userId: 'foo' } })
  .then((data) => {
    console.log(data)
  })
```

## License

The [MIT License](LICENSE)
