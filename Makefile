bundle:
	@deno bundle ./src/fetest.ts ./dist/index.mjs

format-ceck:
	@deno fmt --check

format:
	@deno fmt src/*.ts src/**/*.ts

test:
	@deno test -A