[中文简体](README.md) | English

[![Build Status](https://github.com/axetroy/fata/workflows/ci/badge.svg)](https://github.com/axetroy/fata/actions)

Elegant and modern HTTP client based on Fetch

### Installation

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

## License

The [MIT License](LICENSE)
