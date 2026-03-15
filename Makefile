.PHONY: install build icons package clean link dev

PLUGIN_DIR := com.fullmetalfred.cliptype.sdPlugin
PLUGIN_UUID := com.fullmetalfred.cliptype

# Detect WSL → deploy to Windows plugins path
ifdef WSL_DISTRO_NAME
  WIN_USER := $(shell cmd.exe /C "echo %USERNAME%" 2>/dev/null | tr -d '\r')
  SD_PLUGINS := /mnt/c/Users/$(WIN_USER)/AppData/Roaming/Elgato/StreamDeck/Plugins
else ifeq ($(shell uname),Darwin)
  SD_PLUGINS := $(HOME)/Library/Application Support/com.elgato.StreamDeck/Plugins
else
  SD_PLUGINS :=
endif

install:
	pnpm install

build: install
	pnpm run build

icons:
	node scripts/icons.js

package: build
	node scripts/package.js

# Link/deploy plugin into Stream Deck
link: build
ifdef WSL_DISTRO_NAME
	@echo "WSL detected — copying to Windows Stream Deck plugins dir..."
	@mkdir -p "$(SD_PLUGINS)"
	rm -rf "$(SD_PLUGINS)/$(PLUGIN_DIR)"
	cp -r "$(PLUGIN_DIR)" "$(SD_PLUGINS)/$(PLUGIN_DIR)"
	@echo "Deployed to $(SD_PLUGINS)/$(PLUGIN_DIR)"
	@echo "Restart Stream Deck to pick up changes."
else
	streamdeck link $(PLUGIN_DIR)
endif

# Watch + auto-deploy (WSL: copies on each rebuild, native: uses streamdeck restart)
dev: build link
ifdef WSL_DISTRO_NAME
	@echo "Watching for changes... (Ctrl+C to stop)"
	pnpm run build -- --watch
else
	pnpm run watch
endif

clean:
	rm -rf $(PLUGIN_DIR)/bin $(PLUGIN_DIR)/imgs release node_modules
