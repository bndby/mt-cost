#!/usr/bin/env bash
# Host Gradle Play App Bundle.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CREDENTIALS="$ROOT/credentials.json"
if [[ ! -f "$CREDENTIALS" ]]; then
  echo "missing credentials.json (Play keystore pointer; gitignored)" >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ]]; then
  echo "ANDROID_HOME / ANDROID_SDK_ROOT is not set" >&2
  exit 1
fi

python3 - <<'PY'
import json
import shutil
from pathlib import Path

root = Path.cwd()
creds = json.loads((root / "credentials.json").read_text())
ks = creds["android"]["keystore"]
src = (root / ks["keystorePath"]).resolve()
if not src.is_file():
    raise SystemExit(f"missing keystore at {ks['keystorePath']}")
dest = root / "android" / "app" / "keystore.jks"
dest.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(src, dest)

def prop(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
    )

lines = [
    "storeFile=keystore.jks",
    f"storePassword={prop(ks['keystorePassword'])}",
    f"keyAlias={prop(ks['keyAlias'])}",
    f"keyPassword={prop(ks['keyPassword'])}",
]
(root / "android" / "keystore.properties").write_text("\n".join(lines) + "\n")
print("signing: Play upload keystore")
PY

VERSION="$(sed -n 's/.*versionName = "\([^"]*\)".*/\1/p' android/app/build.gradle.kts | head -1)"
OUT="$ROOT/wotcost-${VERSION}.aab"

(
  cd android
  ./gradlew :app:bundleRelease
)

AAB="android/app/build/outputs/bundle/release/app-release.aab"
if [[ ! -f "$AAB" ]]; then
  echo "gradle finished without $AAB" >&2
  exit 1
fi
cp -f "$AAB" "$OUT"

PLAY_UPLOAD_SHA1="EE:13:1B:7D:1F:B4:1F:88:4A:C9:38:D9:A9:D4:5D:CA:40:FC:A4:BF"
ACTUAL_SHA1="$(keytool -printcert -jarfile "$OUT" | awk '/SHA1:/{print $2; exit}')"
if [[ "$ACTUAL_SHA1" != "$PLAY_UPLOAD_SHA1" ]]; then
  echo "AAB signed with $ACTUAL_SHA1, Play upload cert is $PLAY_UPLOAD_SHA1" >&2
  exit 1
fi
echo "wrote $OUT (SHA1 $ACTUAL_SHA1)"
