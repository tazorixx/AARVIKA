"""Local-only preview server with SPA deep-link fallback. No deployment."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1] / 'dist'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)

    def do_GET(self):
        candidate = Path(self.translate_path(urlsplit(self.path).path))
        if not candidate.is_file() and '.' not in candidate.name:
            self.path = '/index.html'
        super().do_GET()

    def log_message(self, *_):
        pass

print('Local exported app: http://127.0.0.1:8082', flush=True)
ThreadingHTTPServer(('127.0.0.1', 8082), Handler).serve_forever()
