#!/usr/bin/env python3
"""Write the files Gradle needs on a GitHub Actions runner.

dotenv: .env from .env.example, with WG_APPLICATION_ID from the environment.
keystore: Play upload key and android/keystore.properties from the environment.
debug-keystore: stable debug key for the GitHub Release APK.

Values are read from the environment so they are not command-line arguments.
"""

import base64
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def prop(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace("\r", "\\r")


def write_dotenv() -> None:
    app_id = os.environ.get("WG_APPLICATION_ID", "").strip()
    if not app_id:
        raise SystemExit("WG_APPLICATION_ID secret is empty")
    source = (ROOT / ".env.example").read_text()
    lines = []
    replaced = False
    for line in source.splitlines():
        if line.startswith("WG_APPLICATION_ID="):
            lines.append(f"WG_APPLICATION_ID={app_id}")
            replaced = True
        else:
            lines.append(line)
    if not replaced:
        raise SystemExit(".env.example has no WG_APPLICATION_ID line")
    (ROOT / ".env").write_text("\n".join(lines) + "\n")
    print("wrote .env")


def write_keystore() -> None:
    raw = os.environ.get("PLAY_UPLOAD_KEYSTORE_BASE64", "").strip()
    store_password = os.environ.get("PLAY_UPLOAD_KEYSTORE_PASSWORD", "")
    alias = os.environ.get("PLAY_UPLOAD_KEY_ALIAS", "")
    key_password = os.environ.get("PLAY_UPLOAD_KEY_PASSWORD", "")
    if not raw or not store_password or not alias or not key_password:
        raise SystemExit("Play upload keystore secrets are incomplete")
    dest = ROOT / "android" / "app" / "keystore.jks"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(base64.b64decode(raw))
    os.chmod(dest, 0o600)
    lines = [
        "storeFile=keystore.jks",
        f"storePassword={prop(store_password)}",
        f"keyAlias={prop(alias)}",
        f"keyPassword={prop(key_password)}",
    ]
    props = ROOT / "android" / "keystore.properties"
    props.write_text("\n".join(lines) + "\n")
    os.chmod(props, 0o600)
    print("signing: Play upload keystore")


def write_debug_keystore() -> None:
    raw = os.environ.get("DEBUG_KEYSTORE_BASE64", "").strip()
    if not raw:
        raise SystemExit("DEBUG_KEYSTORE_BASE64 secret is empty")
    dest = ROOT / "android" / "app" / "debug.keystore"
    dest.write_bytes(base64.b64decode(raw))
    os.chmod(dest, 0o600)
    print("signing: debug keystore")


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "dotenv":
        write_dotenv()
    elif command == "keystore":
        write_keystore()
    elif command == "debug-keystore":
        write_debug_keystore()
    else:
        raise SystemExit("usage: ci-android-env.py dotenv|keystore|debug-keystore")


if __name__ == "__main__":
    main()
