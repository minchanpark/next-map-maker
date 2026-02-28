#!/usr/bin/env python3
"""Codex notify hook.

Receives one JSON argument from Codex `notify` and emits an OS notification.
Official payload fields are documented in OpenAI Codex config docs.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from typing import Any, Tuple


def _clip(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."


def _load_payload(argv: list[str]) -> dict[str, Any]:
    raw = argv[1] if len(argv) > 1 else sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _build_notification(payload: dict[str, Any]) -> Tuple[str, str] | None:
    if payload.get("type") != "agent-turn-complete":
        return None

    last_assistant = str(payload.get("last-assistant-message") or "Turn complete")
    title = f"Codex: {_clip(last_assistant, 80)}"

    input_messages = payload.get("input-messages")
    if isinstance(input_messages, list):
        message_text = " ".join(str(item) for item in input_messages if item is not None)
    else:
        message_text = str(input_messages or "")

    if not message_text:
        message_text = str(payload.get("cwd") or os.getcwd())

    return title, _clip(message_text, 240)


def _notify_macos(title: str, message: str) -> None:
    if shutil.which("terminal-notifier"):
        subprocess.run(
            [
                "terminal-notifier",
                "-title",
                title,
                "-message",
                message,
                "-group",
                "codex-agent-turn-complete",
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return

    # JSON string encoding safely quotes text for AppleScript string literals.
    script = f"display notification {json.dumps(message)} with title {json.dumps(title)}"
    subprocess.run(["osascript", "-e", script], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def _notify_linux(title: str, message: str) -> bool:
    if not shutil.which("notify-send"):
        return False
    subprocess.run(["notify-send", title, message], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return True


def _fallback_bell() -> None:
    sys.stdout.write("\a")
    sys.stdout.flush()


def main(argv: list[str]) -> int:
    payload = _load_payload(argv)
    notification = _build_notification(payload)
    if notification is None:
        return 0

    title, message = notification

    try:
        if sys.platform == "darwin":
            _notify_macos(title, message)
        elif sys.platform.startswith("linux"):
            if not _notify_linux(title, message):
                _fallback_bell()
        else:
            _fallback_bell()
    except Exception:
        _fallback_bell()

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
