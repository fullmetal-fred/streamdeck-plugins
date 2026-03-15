#!/bin/bash
#
# ClipType Helper — macOS keystroke simulator
#
# Listens on http://127.0.0.1:23456/ for POST requests from the
# ClipType Stream Deck plugin. Uses osascript (AppleScript) to
# simulate keystrokes.
#
# Prerequisites:
#   - macOS 10.15+
#   - System Preferences > Security > Privacy > Accessibility must
#     grant access to this script / Terminal / Stream Deck
#
# Usage: ./cliptype-helper.sh
#

PORT=23456

# Check if already running
if curl -s "http://127.0.0.1:$PORT/health" > /dev/null 2>&1; then
    echo "ClipType helper is already running on port $PORT"
    exit 0
fi

echo "ClipType helper listening on http://127.0.0.1:$PORT/"

# We use a simple Python HTTP server since macOS ships with Python 3
python3 -c "
import http.server
import json
import subprocess
import time
import sys

class ClipTypeHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress request logging

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{\"status\":\"ok\"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/type':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            data = json.loads(body)
            text = data.get('text', '')
            char_delay = data.get('charDelayMs', 20) / 1000.0
            line_delay = data.get('lineDelayMs', 50) / 1000.0

            try:
                # Small pause to let user switch to target window
                time.sleep(0.5)
                type_text_applescript(text, char_delay, line_delay)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{\"status\":\"ok\"}')
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                msg = json.dumps({'status': 'error', 'message': str(e)})
                self.wfile.write(msg.encode('utf-8'))

        elif self.path == '/stop':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{\"status\":\"stopping\"}')
            sys.exit(0)
        else:
            self.send_response(404)
            self.end_headers()

def type_text_applescript(text, char_delay, line_delay):
    \"\"\"Type text using AppleScript keystroke simulation.\"\"\"
    for char in text:
        if char == '\n':
            subprocess.run([
                'osascript', '-e',
                'tell application \"System Events\" to key code 36'
            ], check=True)
            time.sleep(line_delay)
        elif char == '\t':
            subprocess.run([
                'osascript', '-e',
                'tell application \"System Events\" to key code 48'
            ], check=True)
            time.sleep(char_delay)
        else:
            escaped = char.replace('\\\\', '\\\\\\\\').replace('\"', '\\\\\"')
            subprocess.run([
                'osascript', '-e',
                f'tell application \"System Events\" to keystroke \"{escaped}\"'
            ], check=True)
            time.sleep(char_delay)

server = http.server.HTTPServer(('127.0.0.1', $PORT), ClipTypeHandler)
server.serve_forever()
"
