#!/usr/bin/env python3
"""
Credible Demo Server
Serves local test pages for evaluating the Credible Chrome Extension.
"""

import argparse
import http.server
import os
import socketserver
import sys
from pathlib import Path

DEFAULT_PORT = 8080
DEFAULT_HOST = "127.0.0.1"


class DemoHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler that sets CORS headers and defaults to index.html."""

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()


def run_demo_server(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT):
    demo_pages_dir = Path(__file__).resolve().parent / "pages"
    if not demo_pages_dir.exists():
        print(f"Error: Demo pages directory not found at {demo_pages_dir}")
        sys.exit(1)

    os.chdir(demo_pages_dir)

    # Allow immediate address reuse upon restart
    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer((host, port), DemoHTTPRequestHandler) as httpd:
            print("=" * 68)
            print("  CREDIBLE CYBERSECURITY EVALUATION & DEMO SERVER")
            print("=" * 68)
            print(f"  Listening on: http://{host}:{port}/")
            print(f"  Serving directory: {demo_pages_dir}")
            print("-" * 68)
            print("  Available Test Scenarios:")
            print(f"    • Hub / Index:        http://{host}:{port}/index.html")
            print(f"    • 1. Benign Job:      http://{host}:{port}/benign.html")
            print(f"    • 2. Suspicious Scam: http://{host}:{port}/suspicious.html")
            print(f"    • 3. Ambiguous:       http://{host}:{port}/ambiguous.html")
            print(f"    • 4. Prompt Attack:   http://{host}:{port}/prompt-injection.html")
            print(f"    • 5. Error & Fallback:http://{host}:{port}/error-demo.html")
            print("=" * 68)
            print("  Press Ctrl+C to stop the server.\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDemo server stopped cleanly.")
    except OSError as e:
        print(f"\nError starting demo server on port {port}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Credible Demo Scenario Server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to bind (default: {DEFAULT_PORT})")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help=f"Host address to bind (default: {DEFAULT_HOST})")
    args = parser.parse_args()

    run_demo_server(host=args.host, port=args.port)

