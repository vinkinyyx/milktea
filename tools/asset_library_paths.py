"""Shared paths for the current asset intake. Historical evidence stays immutable."""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
SETTINGS = json.loads((ROOT / 'config/asset-library-settings.json').read_text(encoding='utf-8'))
AUDIT_OUT = (ROOT / SETTINGS['audit_directory']).resolve()
assert AUDIT_OUT.is_relative_to(ROOT / 'evidence')
