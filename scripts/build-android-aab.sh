#!/usr/bin/env bash
# Host Gradle Play App Bundle. Not EAS Docker (`eas build --local`).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

VERSION="$(node -p "require('./package.json').version")"
OUT="$ROOT/mt-cost-${VERSION}.aab"
CREDENTIALS="$ROOT/credentials.json"

if [[ ! -f "$CREDENTIALS" ]]; then
  echo "missing credentials.json (Play keystore pointer; gitignored)" >&2
  exit 1
fi

if [[ -z "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ]]; then
  echo "ANDROID_HOME / ANDROID_SDK_ROOT is not set" >&2
  exit 1
fi

CI=1 npx expo prebuild -p android

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

props = root / "android" / "gradle.properties"
text = props.read_text() if props.exists() else ""
lines = [
    line
    for line in text.splitlines()
    if not line.startswith("MYAPP_UPLOAD_")
]
lines.extend(
    [
        "MYAPP_UPLOAD_STORE_FILE=keystore.jks",
        f"MYAPP_UPLOAD_KEY_ALIAS={ks['keyAlias']}",
        f"MYAPP_UPLOAD_STORE_PASSWORD={ks['keystorePassword']}",
        f"MYAPP_UPLOAD_KEY_PASSWORD={ks['keyPassword']}",
    ]
)
props.write_text("\n".join(lines) + "\n")

gradle = root / "android" / "app" / "build.gradle"
g = gradle.read_text()
debug_only = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }"""
with_release = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }"""
if debug_only not in g:
    raise SystemExit("android/app/build.gradle signingConfigs block changed; cannot inject Play upload key")
g = g.replace(debug_only, with_release, 1)
release_debug = """            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug"""
release_play = """            signingConfig signingConfigs.release"""
if release_debug not in g:
    raise SystemExit("android/app/build.gradle release still not on debug template; cannot switch to Play upload key")
g = g.replace(release_debug, release_play, 1)
if "signingConfig signingConfigs.release" not in g:
    raise SystemExit("release buildType is still not using signingConfigs.release")
gradle.write_text(g)
print("signing: Play upload keystore + release signingConfig")
PY

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
