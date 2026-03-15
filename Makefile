.PHONY: install build icons package clean link

install:
	pnpm install

build: install
	pnpm run build

icons:
	node scripts/icons.js

package: build
	node scripts/package.js

link: build
	pnpm run link

clean:
	rm -rf com.fullmetalfred.cliptype.sdPlugin/bin com.fullmetalfred.cliptype.sdPlugin/imgs release node_modules
