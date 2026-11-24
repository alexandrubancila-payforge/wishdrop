"""Run every end-to-end suite against a running WishDrop. Usage: python3 -I tests/e2e/run_all.py http://localhost:4400

Each suite signs up its own throwaway accounts and deletes them at the end.
Exit code 1 if any check fails.
"""
import os, subprocess, sys

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4400"
here = os.path.dirname(os.path.abspath(__file__))
photo = os.path.join(here, "..", "..", "public", "demo", "watch.jpg")
failed = False
for suite in ["core", "social", "notif", "gifts", "safety"]:
    args = [sys.executable, "-I", os.path.join(here, f"{suite}.py"), base] + ([photo] if suite == "core" else [])
    out = subprocess.run(args, capture_output=True, text=True)
    text = out.stdout + out.stderr
    print(f"== {suite}")
    print("\n".join(l for l in text.splitlines() if "FAIL" in l or "passed" in l or "Error" in l) or text[-2000:])
    if out.returncode != 0 or "FAIL" in text or " passed" not in text:
        failed = True
sys.exit(1 if failed else 0)
