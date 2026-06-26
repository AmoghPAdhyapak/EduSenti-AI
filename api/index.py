"""Vercel Python serverless entry point for the EduSentiAI Flask API.

Vercel's @vercel/python runtime detects the module-level WSGI `app` object and
serves it. The `vercel.json` rewrites route every `/edusentiai/api/*` request to
this function, and Flask matches them via its blueprint url_prefixes.
"""
import os
import sys

# The actual application code lives in the underscore-prefixed `_lib` package so
# Vercel does not treat those modules as additional serverless functions.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '_lib'))

from app_factory import create_app  # noqa: E402

app = create_app()
application = app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5100)), debug=True)
