"""Package an already-built frontend for Decky's 'Install Plugin from ZIP'."""

import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
files = ["plugin.json", "package.json", "dist/index.js", "README.md", "LICENSE"]
if not (root / "dist/index.js").is_file():
    raise SystemExit("Missing dist/index.js. Run bun run build before packaging.")

version = json.loads((root / "package.json").read_text())["version"]
output = root / "out" / f"decky-grid-menu-{version}.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for file in files:
        archive.write(root / file, f"decky-grid-menu/{file}")
print(output)
