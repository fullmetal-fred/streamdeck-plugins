.PHONY: install build icons package clean dev

install:
	pnpm install

build: install
	node scripts/build.js

icons:
	node scripts/icons.js

package: build
	node scripts/package.js

dev:
	node scripts/build.js --watch

clean:
	rm -rf com.fullmetalfred.cliptype.sdPlugin release node_modules
