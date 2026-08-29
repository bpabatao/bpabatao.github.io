# profile-sync Phase 2 (global skill + operations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the global `/profile-sync` skill: a stdlib-Python harvester that fills a local, redacted evidence ledger from GitHub, Bitbucket, git, Jira, CloudTrail, pipelines and local digests; a SKILL.md that drafts and verifies claims and opens the `profile-sync/*` PR; the one-time `--init` (config, Keychain, denylist, full-history backfill); and the weekly cron line.

**Architecture:** Four Python files under `~/.claude/skills/profile-sync/scripts/`: `redact.py` (scrubber), `parsers.py` (pure functions from raw API/text to ledger items, unit-tested with embedded fixtures), `sources.py` (network and subprocess fetchers that call the parsers), `harvest.py` (CLI: `run`, `backfill`, `delta`, `verify-claims`, `advance-draft`, `lock`, `unlock`, `status`, `init-config`, `init-secrets`). State lives in `~/.profile-sync/`. SKILL.md orchestrates: harvest -> per-company drafter subagents -> mechanical `verify-claims` -> LLM verifier -> edit `content.ts` -> `npm run render && npm run check && npm run build` -> branch, commit, push, `gh pr create|edit`.

**Tech Stack:** Python 3.9 stdlib (`json`, `subprocess`, `urllib.request`, `base64`, `re`, `datetime`, `unittest`), `gh` CLI (keyring auth), `aws` CLI v2 with IAM profiles `hth` and `nmblr`, `curl`-free (urllib), macOS `security` for Keychain, crontab.

**Spec:** `docs/superpowers/specs/2026-08-28-profile-sync-design.md` (sections 3, 4.2-4.5, 5, 6, 8, 9, 10, 11, 12.11-12.12, 13)

## Global Constraints

- Phase 1 PR (`profile-sync/init`) must be merged first; the skill edits `src/data/content.ts` and runs `npm run render|check|build` from that repo.
- No em dashes anywhere; plain dash "-". One sentence per line in Markdown.
- Python: standard library only, Python 3.9 compatible (no `match`, no `X | Y` annotations at runtime; use `from __future__ import annotations`).
- Every external call is read-only: `gh api` GET, HTTPS GET, `aws cloudtrail lookup-events`, `git fetch`/`git log`, `gh run list`. Writes are limited to `~/.profile-sync/`, the `profile-sync/*` branch, `gh pr create|edit`, and Keychain items `profile-sync-bitbucket-token` / `profile-sync-jira-token`.
- Never push to `main`, never force-push, never merge.
- Ledger, dossier, config and denylist stay in `~/.profile-sync/`; the PR body carries anonymised claims only.
- Identities: git author `Pabatao`; emails `jajapabatao@gmail.com`, `benedict.pabatao@thehth.com`, `benedict.pabatao@esc-partners.com`; GitHub `bpabatao`; Bitbucket uuid `{1ef35c9e-0e95-4bef-bb95-0204aed011be}`; Jira account `712020:c2742fce-6c53-40bc-b8aa-6afdddb512da`; IAM `benedict.pabatao@thehth.com` (profile `hth`, regions us-west-1, us-east-1, us-east-2, us-west-2) and `benedict@nmblr.co` (profile `nmblr`, us-east-2).
- Companies: `hth` (Bitbucket `esc-partners`, `~/projects/hth`, both Atlassian sites), `nmblr` (GitHub `Claroo-Ltd/nmblr-app`, `~/projects/nmblr`), `personal` (only `penagent`, `lexi-app`; always `needs-word`).
- Excluded repos: `maya`, `maya-ai-base`, `maya-ai-mvu`, `maya-delta`, `maya-pm`, `esc-ai-backend`, `email_delivery_report`, `knowledge-base-ccs`, `myhub-api-microservice-campaigns`, `autoresearch`, `plankton`, `hth-customer-portals`, `engineering-assistant`, `bpabatao.github.io`, `knowledge-base` (git; its `wiki/log.md` is read separately).
- Grades: A merged PR by Benedict; B commit by Benedict on the default branch; C Jira issue assigned to Benedict in status category Done (not Canceled); D CloudTrail mutating events under his IAM user, aggregated per month; E pipeline runs he triggered that succeeded; F `.remember`, memory notes, KB log.
- Draft cursor starts at `2026-07-18T00:00:00Z`; backfill starts `2023-06-01` (hth, personal) and `2024-03-01` (nmblr); CloudTrail backfills at most 90 days.
- Live API shapes verified 2026-08-28: Bitbucket PR list `values[].{id,title,updated_on,links.html.href,author.uuid,destination.branch.name,summary.raw}` with `next`; Bitbucket pipelines `values[].{build_number,created_on,state.name,state.result.name,creator.uuid,trigger.name,target.ref_name}`; Bitbucket repos `values[].{slug,mainbranch.name}` (82 repos, one page at `pagelen=100`); GitHub search `items[].{number,title,pull_request.merged_at,html_url,repository_url,user.login,body}`; Jira `/rest/api/3/search/jql` returns `{isLast, issues[], nextPageToken?}` and `resolutiondate` is always null in these workflows; CloudTrail `Events[].{EventName,EventSource,EventTime,Username,CloudTrailEvent(json string with "readOnly")}`; `gh run list --json databaseId,name,headBranch,createdAt,conclusion,event`.

---

## File structure

| File | Responsibility |
|---|---|
| `~/.claude/skills/profile-sync/SKILL.md` | Orchestration, modes, prompts, gates, allowed-tools |
| `~/.claude/skills/profile-sync/scripts/redact.py` | `redact(text, keep_emails) -> str`, `summarize(text) -> str` (500 chars) |
| `~/.claude/skills/profile-sync/scripts/parsers.py` | Pure parsers: raw JSON/text -> ledger items; tag extraction |
| `~/.claude/skills/profile-sync/scripts/sources.py` | Fetchers per source: `fetch_<source>(cfg, secrets, since) -> (items, new_watermark)`; paging, retries, timeouts |
| `~/.claude/skills/profile-sync/scripts/harvest.py` | CLI and state: config, secrets (env then Keychain), ledger append/dedupe, watermarks, draft cursor, lock, status, delta, verify-claims |
| `~/.claude/skills/profile-sync/scripts/test_redact.py`, `test_parsers.py`, `test_harvest.py` | `unittest` files |
| `~/.claude/skills/profile-sync/reference/config.example.json` | Filled template for `~/.profile-sync/config.json` |
| `~/.claude/skills/profile-sync/reference/anonymise.md` | Denylist and replacement descriptors |
| `~/.claude/skills/profile-sync/reference/pr-template.md` | PR title and body skeleton |
| `~/.profile-sync/` | `config.json`, `denylist.txt`, `ledger.jsonl`, `watermarks.json`, `runs/<date>/`, `logs/`, `lock` |

---

### Task 1: Skill scaffold, config template, denylist reference, `redact.py`

**Files:**
- Create: `~/.claude/skills/profile-sync/reference/config.example.json`
- Create: `~/.claude/skills/profile-sync/reference/anonymise.md`
- Create: `~/.claude/skills/profile-sync/scripts/redact.py`
- Test: `~/.claude/skills/profile-sync/scripts/test_redact.py`

**Interfaces:**
- Produces: `redact(text: str, keep_emails: Iterable[str] = ()) -> str`, `summarize(text: str, limit: int = 500) -> str`.

- [ ] **Step 1: Create the directories and the config template**

```bash
mkdir -p ~/.claude/skills/profile-sync/scripts ~/.claude/skills/profile-sync/reference ~/.profile-sync/runs ~/.profile-sync/logs
```

Create `~/.claude/skills/profile-sync/reference/config.example.json`:

```json
{
  "identities": {
    "git_author": "Pabatao",
    "emails": ["jajapabatao@gmail.com", "benedict.pabatao@thehth.com", "benedict.pabatao@esc-partners.com"],
    "github_login": "bpabatao",
    "bitbucket_uuid": "{1ef35c9e-0e95-4bef-bb95-0204aed011be}",
    "jira_account_id": "712020:c2742fce-6c53-40bc-b8aa-6afdddb512da"
  },
  "portfolio_repo": "/Users/macbook-pro/projects/personal/bpabatao.github.io",
  "bitbucket": { "workspace": "esc-partners", "company": "hth" },
  "github": {
    "repo_company": { "Claroo-Ltd/nmblr-app": "nmblr", "bpabatao/penagent": "personal", "bpabatao/lexi-app": "personal" },
    "actions_repos": ["Claroo-Ltd/nmblr-app"]
  },
  "jira": { "sites": ["https://esc-partners.atlassian.net", "https://hth.atlassian.net"], "company": "hth" },
  "aws": [
    { "profile": "hth", "company": "hth", "iam_user": "benedict.pabatao@thehth.com", "regions": ["us-west-1", "us-east-1", "us-east-2", "us-west-2"] },
    { "profile": "nmblr", "company": "nmblr", "iam_user": "benedict@nmblr.co", "regions": ["us-east-2"] }
  ],
  "cloudtrail_max_pages": 100,
  "repo_roots": { "hth": "/Users/macbook-pro/projects/hth", "nmblr": "/Users/macbook-pro/projects/nmblr", "personal": "/Users/macbook-pro/projects/personal" },
  "backfill_start": { "hth": "2023-06-01", "nmblr": "2024-03-01", "personal": "2023-06-01" },
  "exclude_repos": ["maya", "maya-ai-base", "maya-ai-mvu", "maya-delta", "maya-pm", "esc-ai-backend", "email_delivery_report", "knowledge-base-ccs", "myhub-api-microservice-campaigns", "autoresearch", "plankton", "hth-customer-portals", "engineering-assistant", "bpabatao.github.io", "knowledge-base"],
  "personal_allow": ["penagent", "lexi-app"],
  "memory_root": "/Users/macbook-pro/.claude/projects",
  "linkedin_export": "/Users/macbook-pro/.profile-sync/linkedin-export",
  "kb_log": "/Users/macbook-pro/projects/hth/knowledge-base/wiki/log.md",
  "draft_cursor_init": "2026-07-18T00:00:00Z",
  "tags": ["terraform", "cognito", "fastify", "idor", "pipeline", "cloudwatch", "bedrock", "graphql", "prisma", "ecs", "cloudfront", "waf", "oauth", "ccs", "security", "observability", "migration", "ci", "e2e", "mongodb", "postgres", "redis", "twilio", "ses", "lambda", "invoice cloud", "paystar", "paymentus", "rbac", "jwt", "cve", "cost"]
}
```

Create `~/.claude/skills/profile-sync/reference/anonymise.md`:

```markdown
# Anonymisation rules

Employer names are allowed: "ESC Partners / HometownHUB", "Nmblr".
Client, tenant and product-instance names are not.
The denylist below is copied to `~/.profile-sync/denylist.txt` by `harvest.py init-config`; `check-profile.ts` and `harvest.py verify-claims` both read that file.

## Denylist (whole word, case-insensitive)

(copy the 17 terms from `~/.profile-sync/denylist.txt`; never commit them)

## Replacements the drafter uses

| Instead of | Write |
|---|---|
| a tenant by name | "a utility tenant", "a water utility tenant", "a natural-gas utility tenant" |
| a list of tenants | "N utility tenants" |
| a client's portal name | "a tenant portal", "the tenant's customer portal" |
| a Jira key or PR number | nothing - it goes in the local dossier, not in the text |
| Oracle CC&B / CCS, Invoice Cloud, Twilio, Paymentus, PayStar | allowed - vendor products, already public on LinkedIn |
```

- [ ] **Step 2: Write the failing redaction test**

Create `~/.claude/skills/profile-sync/scripts/test_redact.py`:

```python
import unittest
from redact import redact, summarize


class RedactTest(unittest.TestCase):
    def test_token_shapes_vanish(self):
        cases = [
            "key AKIAABCDEFGHIJKLMNOP end",
            "bearer ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz0123456789",
            "gh ghp_abcdefghijklmnopqrstuvwxyz0123456789",
            "jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc",
            "password=Sup3rSecret!",
            "SECRET: hunter22222",
            "account 123456789012 here",
        ]
        for c in cases:
            out = redact(c)
            self.assertIn("[redacted]", out, c)
            self.assertNotIn("AKIA", out)
            self.assertNotIn("Sup3rSecret", out)

    def test_foreign_emails_and_phones_but_not_mine(self):
        out = redact("mail alice@example.com and jajapabatao@gmail.com call +39 333 123 4567", keep_emails=["jajapabatao@gmail.com"])
        self.assertNotIn("alice@example.com", out)
        self.assertIn("jajapabatao@gmail.com", out)
        self.assertNotIn("333 123 4567", out)

    def test_plain_text_untouched(self):
        s = "feat(account): assertAccountOwner on linked accounts (HUB-17)"
        self.assertEqual(redact(s), s)

    def test_summarize_caps_and_collapses_whitespace(self):
        self.assertEqual(summarize("a  b\n\nc"), "a b c")
        self.assertEqual(len(summarize("x" * 900, 500)), 500)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_redact -v`
Expected: `ModuleNotFoundError: No module named 'redact'`.

- [ ] **Step 4: Write `redact.py`**

```python
#!/usr/bin/env python3
"""Scrub secrets and PII before anything reaches the ledger or a PR body."""
from __future__ import annotations

import re
from typing import Iterable

MASK = "[redacted]"
PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"ATAT[A-Za-z0-9_-]{20,}"),
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]+)?"),
    re.compile(r"(?i)\b(password|passwd|pwd|secret|token|api[_-]?key)\b\s*[:=]\s*\S+"),
    re.compile(r"(?<!\d)\d{12}(?!\d)"),
    re.compile(r"\+?\d[\d\s().-]{8,}\d"),
]
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


def redact(text: str, keep_emails: Iterable[str] = ()) -> str:
    keep = {e.lower() for e in keep_emails}
    out = EMAIL.sub(lambda m: m.group(0) if m.group(0).lower() in keep else MASK, text)
    for p in PATTERNS:
        out = p.sub(MASK, out)
    return out


def summarize(text: str, limit: int = 500) -> str:
    return re.sub(r"\s+", " ", text or "").strip()[:limit]
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_redact -v`
Expected: 4 tests OK.

---

### Task 2: `harvest.py` core - config, secrets, ledger, watermarks, lock, status

**Files:**
- Create: `~/.claude/skills/profile-sync/scripts/harvest.py`
- Test: `~/.claude/skills/profile-sync/scripts/test_harvest.py`

**Interfaces:**
- Produces (module-level, all take an explicit `state_dir` so tests use a temp dir):
  - `load_config(state_dir) -> dict`
  - `secret(name, env_var, keychain_item) -> Optional[str]` (env first, then `security find-generic-password -s <item> -w`)
  - `Ledger(state_dir)`: `.ids: set`, `.append(items) -> int` (new count), `.iter() -> Iterator[dict]`
  - `Watermarks(state_dir)`: `.get(key, default)`, `.set(key, value)`, `.save()`, `.draft` property
  - `acquire_lock(state_dir) -> bool`, `release_lock(state_dir)`
  - `write_status(state_dir, run_date, status, **extra)`
  - CLI entry `main(argv)` with subcommands added in later tasks.

- [ ] **Step 1: Write the failing test**

Create `~/.claude/skills/profile-sync/scripts/test_harvest.py`:

```python
import json, os, tempfile, unittest
from pathlib import Path

import harvest


def item(i, ts="2026-08-01T00:00:00Z", grade="A", company="hth"):
    return {"id": i, "source": "github-pr", "company": company, "repo": "r", "ts": ts, "title": "t", "summary": "s", "ref": "u", "grade": grade, "tags": []}


class LedgerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_append_dedupes_and_persists(self):
        led = harvest.Ledger(self.d)
        self.assertEqual(led.append([item("a"), item("b"), item("a")]), 2)
        self.assertEqual(harvest.Ledger(self.d).append([item("b"), item("c")]), 1)
        self.assertEqual([x["id"] for x in harvest.Ledger(self.d).iter()], ["a", "b", "c"])

    def test_watermarks_and_draft_cursor(self):
        wm = harvest.Watermarks(self.d)
        self.assertEqual(wm.get("git:hth/x", "2020"), "2020")
        wm.set("git:hth/x", "2026-08-01T00:00:00Z")
        wm.draft = "2026-07-18T00:00:00Z"
        wm.save()
        again = harvest.Watermarks(self.d)
        self.assertEqual(again.get("git:hth/x", None), "2026-08-01T00:00:00Z")
        self.assertEqual(again.draft, "2026-07-18T00:00:00Z")

    def test_lock_is_exclusive_but_stale_safe(self):
        self.assertTrue(harvest.acquire_lock(self.d))
        self.assertFalse(harvest.acquire_lock(self.d))
        harvest.release_lock(self.d)
        (self.d / "lock").write_text("999999")
        self.assertTrue(harvest.acquire_lock(self.d), "a dead pid must not hold the lock")
        harvest.release_lock(self.d)

    def test_status_file(self):
        harvest.write_status(self.d, "2026-08-28", "ok", pr="https://x")
        s = json.loads((self.d / "runs" / "2026-08-28" / "status.json").read_text())
        self.assertEqual((s["status"], s["pr"]), ("ok", "https://x"))

    def test_secret_prefers_env(self):
        os.environ["PS_TEST_SECRET"] = "from-env"
        self.assertEqual(harvest.secret("x", "PS_TEST_SECRET", "no-such-item-profile-sync"), "from-env")
        del os.environ["PS_TEST_SECRET"]
        self.assertIsNone(harvest.secret("x", "PS_TEST_SECRET", "no-such-item-profile-sync"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_harvest -v`
Expected: `ModuleNotFoundError: No module named 'harvest'`.

- [ ] **Step 3: Write `harvest.py` (core; subcommands `run`, `backfill`, `delta`, `verify-claims`, `advance-draft` are added in Tasks 4 and 5)**

```python
#!/usr/bin/env python3
"""profile-sync harvester - fills ~/.profile-sync/ledger.jsonl from work evidence.

Read-only against every external system. Stdlib only. See SKILL.md for the flow.
Subcommands: run, backfill, delta, verify-claims, advance-draft, lock, unlock, status, mark,
init-config, init-secrets. Every subcommand accepts --state-dir (default ~/.profile-sync).
`mark <ok|nothing-new|failed> [--pr URL] [--reason TEXT]` writes today's runs/<date>/status.json.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Iterable, Iterator, Optional

HERE = Path(__file__).resolve().parent
DEFAULT_STATE = Path.home() / ".profile-sync"
KEYCHAIN = {"BITBUCKET_TOKEN": "profile-sync-bitbucket-token", "JIRA_API_TOKEN": "profile-sync-jira-token"}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_config(state_dir: Path) -> dict:
    p = state_dir / "config.json"
    if not p.exists():
        sys.exit(f"CONFIG_MISSING {p} - run: harvest.py init-config")
    return json.loads(p.read_text())


def secret(name: str, env_var: str, keychain_item: str) -> Optional[str]:
    """Env first (interactive shells export it), then the login Keychain (cron never sources .zshrc)."""
    if os.environ.get(env_var):
        return os.environ[env_var]
    try:
        out = subprocess.run(["security", "find-generic-password", "-s", keychain_item, "-w"], capture_output=True, text=True, timeout=10)
        return out.stdout.strip() or None if out.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def load_secrets(cfg: dict) -> dict:
    return {
        "bitbucket_email": os.environ.get("BITBUCKET_EMAIL") or cfg["identities"]["emails"][1],
        "bitbucket_token": secret("bitbucket", "BITBUCKET_TOKEN", KEYCHAIN["BITBUCKET_TOKEN"]),
        "jira_email": os.environ.get("JIRA_EMAIL") or cfg["identities"]["emails"][1],
        "jira_token": secret("jira", "JIRA_API_TOKEN", KEYCHAIN["JIRA_API_TOKEN"]),
    }


class Ledger:
    def __init__(self, state_dir: Path):
        self.path = state_dir / "ledger.jsonl"
        self.ids = {json.loads(l)["id"] for l in self.path.read_text().splitlines() if l.strip()} if self.path.exists() else set()

    def append(self, items: Iterable[dict]) -> int:
        n = 0
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a") as f:
            for it in items:
                if it["id"] in self.ids:
                    continue
                f.write(json.dumps(it, ensure_ascii=False) + "\n")
                self.ids.add(it["id"])
                n += 1
        return n

    def iter(self) -> Iterator[dict]:
        if not self.path.exists():
            return iter(())
        return (json.loads(l) for l in self.path.read_text().splitlines() if l.strip())


class Watermarks:
    def __init__(self, state_dir: Path):
        self.path = state_dir / "watermarks.json"
        self.data = json.loads(self.path.read_text()) if self.path.exists() else {}

    def get(self, key: str, default):
        return self.data.get(key, default)

    def set(self, key: str, value) -> None:
        self.data[key] = value

    @property
    def draft(self) -> Optional[str]:
        return self.data.get("draft")

    @draft.setter
    def draft(self, value: str) -> None:
        self.data["draft"] = value

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.data, indent=2, sort_keys=True))
        os.replace(tmp, self.path)


def _alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def acquire_lock(state_dir: Path) -> bool:
    lock = state_dir / "lock"
    state_dir.mkdir(parents=True, exist_ok=True)
    if lock.exists():
        try:
            if _alive(int(lock.read_text().strip())):
                return False
        except ValueError:
            pass
    lock.write_text(str(os.getpid()))
    return True


def release_lock(state_dir: Path) -> None:
    lock = state_dir / "lock"
    if lock.exists():
        lock.unlink()


def write_status(state_dir: Path, run_date: str, status: str, **extra) -> None:
    d = state_dir / "runs" / run_date
    d.mkdir(parents=True, exist_ok=True)
    (d / "status.json").write_text(json.dumps({"status": status, "at": now_iso(), **extra}, indent=2))


def cmd_status(state_dir: Path) -> None:
    wm = Watermarks(state_dir)
    runs = sorted((state_dir / "runs").glob("*/status.json")) if (state_dir / "runs").exists() else []
    last_ok = None
    for p in runs:
        s = json.loads(p.read_text())
        if s.get("status") in ("ok", "nothing-new"):
            last_ok = p.parent.name
    stale = last_ok is None or (dt.date.today() - dt.date.fromisoformat(last_ok)).days > 14
    print(json.dumps({"draft": wm.draft, "watermarks": len([k for k in wm.data if k != "draft"]), "last_ok_run": last_ok, "stale": stale, "ledger_items": len(Ledger(state_dir).ids)}, indent=2))


def cmd_init_config(state_dir: Path) -> None:
    state_dir.mkdir(parents=True, exist_ok=True)
    cfg_path = state_dir / "config.json"
    if not cfg_path.exists():
        cfg_path.write_text((HERE.parent / "reference" / "config.example.json").read_text())
        print(f"wrote {cfg_path}")
    deny = state_dir / "denylist.txt"
    md = (HERE.parent / "reference" / "anonymise.md").read_text()
    block = md.split("## Denylist")[1].split("## Replacements")[0]
    terms = [l.strip() for l in block.splitlines()[1:] if l.strip() and not l.startswith("#") and not l.startswith("(")]
    deny.write_text("# profile-sync client denylist - generated from reference/anonymise.md\n" + "\n".join(terms) + "\n")
    print(f"wrote {deny} ({len(terms)} terms)")
    wm = Watermarks(state_dir)
    if not wm.draft:
        wm.draft = json.loads(cfg_path.read_text())["draft_cursor_init"]
        wm.save()
        print(f"draft cursor set to {wm.draft}")


def cmd_init_secrets() -> None:
    """Store the two Atlassian tokens from the current env into the login Keychain (idempotent, -U updates)."""
    for env_var, item in KEYCHAIN.items():
        val = os.environ.get(env_var)
        if not val:
            print(f"SKIP {env_var} not set in this shell")
            continue
        subprocess.run(["security", "add-generic-password", "-a", os.environ.get("USER", "me"), "-s", item, "-w", val, "-U"], check=True)
        print(f"stored {item}")


def main(argv: list[str]) -> None:
    if not argv:
        sys.exit(__doc__)
    cmd, rest = argv[0], argv[1:]
    state_dir = Path(rest[rest.index("--state-dir") + 1]).expanduser() if "--state-dir" in rest else DEFAULT_STATE
    if cmd == "status":
        cmd_status(state_dir)
    elif cmd == "init-config":
        cmd_init_config(state_dir)
    elif cmd == "init-secrets":
        cmd_init_secrets()
    elif cmd == "lock":
        sys.exit(0 if acquire_lock(state_dir) else "LOCKED another run is in progress")
    elif cmd == "unlock":
        release_lock(state_dir)
    elif cmd == "mark":
        extra = {k: rest[rest.index(f"--{k}") + 1] for k in ("pr", "reason") if f"--{k}" in rest}
        write_status(state_dir, dt.date.today().isoformat(), rest[0], **extra)
    elif cmd in ("run", "backfill", "delta", "verify-claims", "advance-draft"):
        from commands import dispatch  # added in Task 4
        dispatch(cmd, rest, state_dir)
    else:
        sys.exit(f"unknown command {cmd}\n{__doc__}")


if __name__ == "__main__":
    main(sys.argv[1:])
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_harvest -v`
Expected: 5 tests OK. (The `lock` test writes pid `999999`; if that pid happens to be alive on this machine the test fails - re-run.)

- [ ] **Step 5: Smoke the CLI**

Run: `python3 ~/.claude/skills/profile-sync/scripts/harvest.py status --state-dir $HOME/.profile-sync-smoke && rm -rf $HOME/.profile-sync-smoke`
Expected: JSON with `"draft": null`, `"stale": true`, `"ledger_items": 0`.

---

### Task 3: `parsers.py` - pure parsers with fixtures

**Files:**
- Create: `~/.claude/skills/profile-sync/scripts/parsers.py`
- Test: `~/.claude/skills/profile-sync/scripts/test_parsers.py`

**Interfaces:**
- Produces (every function returns `list[dict]` of ledger items and never touches the network):
  - `tags_for(text, vocab) -> list[str]`
  - `make_item(id, source, company, repo, ts, title, summary, ref, grade, cfg) -> dict` (applies redact + summarize + tags)
  - `parse_github_prs(items_json, cfg) -> list`, `parse_bitbucket_prs(values, slug, cfg)`, `parse_bitbucket_pipelines(values, slug, cfg)`, `parse_gh_runs(runs, repo, cfg)`, `parse_git_log(text, company, repo, cfg)`, `parse_jira(issues, cfg)`, `parse_cloudtrail(events, profile_cfg, cfg)`, `parse_remember_day(text, company, repo, date, path, cfg)`, `parse_remember_archive(text, company, repo, path, cfg)`, `parse_memory_note(text, dirname, filename, mtime_iso, path, cfg)`, `parse_kb_log(text, cfg)`
  - `company_for_memory_dir(dirname, cfg) -> Optional[str]`, `company_for_github_repo(full_name, cfg, bitbucket_slugs) -> Optional[str]`, `iso(ts) -> str` (normalises any of the API timestamp shapes to `YYYY-MM-DDTHH:MM:SSZ`)

- [ ] **Step 1: Write the failing test**

Create `~/.claude/skills/profile-sync/scripts/test_parsers.py`:

```python
import json, unittest
from pathlib import Path

import parsers

CFG = json.loads((Path(__file__).resolve().parent.parent / "reference" / "config.example.json").read_text())
ME_BB = CFG["identities"]["bitbucket_uuid"]
ME_JIRA = CFG["identities"]["jira_account_id"]


class IsoTest(unittest.TestCase):
    def test_shapes(self):
        self.assertEqual(parsers.iso("2026-08-28T17:40:39.535127+00:00"), "2026-08-28T17:40:39Z")
        self.assertEqual(parsers.iso("2026-08-25T08:53:47.789-0700"), "2026-08-25T15:53:47Z")
        self.assertEqual(parsers.iso("2026-08-28T22:47:29+02:00"), "2026-08-28T20:47:29Z")
        self.assertEqual(parsers.iso("2026-08-28T19:52:21.714207558Z"), "2026-08-28T19:52:21Z")
        self.assertEqual(parsers.iso("2026-08-28"), "2026-08-28T00:00:00Z")


class GithubTest(unittest.TestCase):
    def test_prs_map_company_and_skip_mirrors(self):
        items = [
            {"number": 1697, "title": "feat: archive insights", "pull_request": {"merged_at": "2026-08-28T11:35:37Z"}, "html_url": "https://github.com/Claroo-Ltd/nmblr-app/pull/1697", "repository_url": "https://api.github.com/repos/Claroo-Ltd/nmblr-app", "user": {"login": "bpabatao"}, "body": "Implements Asana T1 with password=abc123456"},
            {"number": 5, "title": "mirror", "pull_request": {"merged_at": "2026-08-01T00:00:00Z"}, "html_url": "u", "repository_url": "https://api.github.com/repos/bpabatao/myhub-api", "user": {"login": "bpabatao"}, "body": ""},
            {"number": 6, "title": "someone else", "pull_request": {"merged_at": "2026-08-01T00:00:00Z"}, "html_url": "u", "repository_url": "https://api.github.com/repos/Claroo-Ltd/nmblr-app", "user": {"login": "other"}, "body": ""},
        ]
        out = parsers.parse_github_prs(items, CFG, bitbucket_slugs={"myhub-api"})
        self.assertEqual(len(out), 1)
        it = out[0]
        self.assertEqual((it["id"], it["company"], it["grade"], it["repo"]), ("gh:pr:Claroo-Ltd/nmblr-app#1697", "nmblr", "A", "nmblr-app"))
        self.assertIn("[redacted]", it["summary"])


class BitbucketTest(unittest.TestCase):
    def test_prs(self):
        values = [{"id": 676, "title": "HUB-17 CIH: map Pay Plan", "updated_on": "2026-08-28T17:40:39.535127+00:00", "links": {"html": {"href": "https://bitbucket.org/esc-partners/myhub-api/pull-requests/676"}}, "author": {"uuid": ME_BB}, "destination": {"branch": {"name": "develop"}}, "summary": {"raw": ""}},
                  {"id": 1, "title": "x", "updated_on": "2026-08-28T17:40:39+00:00", "links": {"html": {"href": "u"}}, "author": {"uuid": "{other}"}, "destination": {"branch": {"name": "develop"}}, "summary": {"raw": ""}}]
        out = parsers.parse_bitbucket_prs(values, "myhub-api", CFG)
        self.assertEqual([i["id"] for i in out], ["bb:pr:myhub-api#676"])
        self.assertEqual((out[0]["company"], out[0]["grade"], out[0]["ts"]), ("hth", "A", "2026-08-28T17:40:39Z"))

    def test_pipelines_keep_my_successful_runs_only(self):
        values = [{"build_number": 1683, "created_on": "2026-08-28T19:52:21.714207558Z", "state": {"name": "COMPLETED", "result": {"name": "SUCCESSFUL"}}, "creator": {"uuid": ME_BB}, "trigger": {"name": "PUSH"}, "target": {"ref_name": "develop"}},
                  {"build_number": 1682, "created_on": "2026-08-28T19:00:00Z", "state": {"name": "COMPLETED", "result": {"name": "FAILED"}}, "creator": {"uuid": ME_BB}, "trigger": {"name": "PUSH"}, "target": {"ref_name": None}}]
        out = parsers.parse_bitbucket_pipelines(values, "myhub-api", CFG)
        self.assertEqual([i["id"] for i in out], ["pipe:bb:myhub-api#1683"])
        self.assertEqual(out[0]["grade"], "E")


class GitJiraTest(unittest.TestCase):
    def test_git_log(self):
        text = "abc1234def\x1f2026-08-14T11:12:13+02:00\x1ffeat(account): assertAccountOwner on linked accounts\n\nsrc/routes/account.routes.ts\nsrc/x.ts\n\n9999999\x1f2026-08-15T00:00:00Z\x1fchore: bump\n"
        out = parsers.parse_git_log(text, "hth", "myhub-api", CFG)
        self.assertEqual([i["id"] for i in out], ["git:hth/myhub-api:abc1234", "git:hth/myhub-api:9999999"])
        self.assertEqual((out[0]["grade"], out[0]["ts"]), ("B", "2026-08-14T09:12:13Z"))
        self.assertIn("src/routes", out[0]["summary"])

    def test_jira_requires_my_assignee(self):
        issues = [{"key": "HUB-17", "fields": {"summary": "CIH", "status": {"name": "Done"}, "updated": "2026-08-25T08:53:47.789-0700", "project": {"key": "HUB"}, "assignee": {"accountId": ME_JIRA}}},
                  {"key": "HUB-18", "fields": {"summary": "not mine", "status": {"name": "Done"}, "updated": "2026-08-25T08:53:47.789-0700", "project": {"key": "HUB"}, "assignee": {"accountId": "x"}}},
                  {"key": "HUB-19", "fields": {"summary": "cancelled", "status": {"name": "Canceled"}, "updated": "2026-08-25T08:53:47.789-0700", "project": {"key": "HUB"}, "assignee": {"accountId": ME_JIRA}}}]
        out = parsers.parse_jira(issues, "https://esc-partners.atlassian.net", CFG)
        self.assertEqual([i["id"] for i in out], ["jira:HUB-17"])
        self.assertEqual((out[0]["grade"], out[0]["ref"]), ("C", "https://esc-partners.atlassian.net/browse/HUB-17"))


class CloudtrailTest(unittest.TestCase):
    def test_aggregates_mutating_events_per_month(self):
        ev = lambda name, src, t, ro: {"EventName": name, "EventSource": src, "EventTime": t, "Username": "benedict.pabatao@thehth.com", "CloudTrailEvent": json.dumps({"readOnly": ro})}
        events = [ev("UpdateService", "ecs.amazonaws.com", "2026-08-01T10:00:00+02:00", False), ev("UpdateService", "ecs.amazonaws.com", "2026-08-02T10:00:00+02:00", False), ev("DescribeServices", "ecs.amazonaws.com", "2026-08-02T10:00:00+02:00", True), ev("PutParameter", "ssm.amazonaws.com", "2026-07-30T10:00:00+02:00", False)]
        out = parsers.parse_cloudtrail(events, CFG["aws"][0], "us-east-1", CFG)
        ids = sorted(i["id"] for i in out)
        self.assertEqual(ids, ["ct:hth:us-east-1:2026-07:ssm:PutParameter", "ct:hth:us-east-1:2026-08:ecs:UpdateService"])
        ecs = next(i for i in out if "ecs" in i["id"])
        self.assertEqual((ecs["grade"], ecs["summary"]), ("D", "ecs:UpdateService x2 in 2026-08 (us-east-1)"))


class LocalDigestTest(unittest.TestCase):
    def test_remember_day_and_archive(self):
        day = "## 12:16 | fix/admin-search-linked-accounts\nLinked account search: Cognito isRegisteredToPortal; df2b7bd; 1340 pass\n\n## 14:00 | develop\nSecond entry\n"
        out = parsers.parse_remember_day(day, "hth", "myhub-api", "2026-06-25", "/p/today-2026-06-25.done.md", CFG)
        self.assertEqual([i["id"] for i in out], ["rem:hth/myhub-api:2026-06-25#1", "rem:hth/myhub-api:2026-06-25#2"])
        self.assertEqual((out[0]["grade"], out[0]["ts"], out[0]["title"]), ("F", "2026-06-25T12:16:00Z", "fix/admin-search-linked-accounts"))
        arc = "# Archive\n\n## Week of 2026-08-25\nHUB-41 SSN hardening deployed.\n\n## Week of 2026-08-18\nHUB-17 shipped.\n"
        out = parsers.parse_remember_archive(arc, "hth", "myhub-api", "/p/archive.md", CFG)
        self.assertEqual([i["id"] for i in out], ["rem:hth/myhub-api:week-2026-08-25", "rem:hth/myhub-api:week-2026-08-18"])

    def test_memory_note(self):
        text = "---\nname: project_hub17\ndescription: \"HUB-17 CIH page-context\"\nmetadata:\n  type: project\n---\n\nBody with password=nope123456 here.\n"
        out = parsers.parse_memory_note(text, "-Users-macbook-pro-projects-hth-myhub-api", "project_hub17.md", "2026-08-27T15:04:43Z", "/p/project_hub17.md", CFG)
        self.assertEqual(out[0]["id"], "mem:-Users-macbook-pro-projects-hth-myhub-api:project_hub17.md")
        self.assertEqual((out[0]["company"], out[0]["repo"], out[0]["title"]), ("hth", "myhub-api", "HUB-17 CIH page-context"))
        self.assertIn("[redacted]", out[0]["summary"])
        self.assertIsNone(parsers.company_for_memory_dir("-private-tmp-x", CFG))
        self.assertEqual(parsers.company_for_memory_dir("-Users-macbook-pro-projects-personal-penagent", CFG), "personal")
        self.assertIsNone(parsers.company_for_memory_dir("-Users-macbook-pro-projects-personal-bpabatao-github-io", CFG))

    def test_kb_log(self):
        text = "# Log\n\n## [2026-08-26] create | Contoso CIH follow-up\n- Source: contoso-portal PR #21\n- Created: wiki/hth/guides/x.md\n- Updated: wiki/index.md\n- Pages touched: 4\n- Notes: Two findings.\n\n## [2026-08-20] update | Mixed\n- Created: wiki/hth/a.md, wiki/nmblr/b.md\n- Notes: both\n"
        out = parsers.parse_kb_log(text, CFG)
        self.assertEqual([i["id"] for i in out], ["kb:2026-08-26:contoso-cih-follow-up"])
        self.assertEqual((out[0]["company"], out[0]["grade"]), ("hth", "F"))
        self.assertIn("Two findings", out[0]["summary"])


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_parsers -v`
Expected: `ModuleNotFoundError: No module named 'parsers'`.

- [ ] **Step 3: Write `parsers.py`**

```python
#!/usr/bin/env python3
"""Pure parsers: raw API/text -> ledger items. No network, no filesystem."""
from __future__ import annotations

import datetime as dt
import json
import re
from typing import Iterable, Optional

from redact import redact, summarize

GRADE = {"github-pr": "A", "bitbucket-pr": "A", "git": "B", "jira": "C", "cloudtrail": "D", "pipeline": "E", "remember": "F", "memory": "F", "kb-log": "F"}


def iso(ts: str) -> str:
    """Normalise every timestamp shape the sources emit to YYYY-MM-DDTHH:MM:SSZ (UTC)."""
    s = ts.strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        return s + "T00:00:00Z"
    s = re.sub(r"(\.\d+)", "", s)                       # drop fractional seconds of any length
    s = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", s)      # -0700 -> -07:00
    s = s.replace("Z", "+00:00")
    d = dt.datetime.fromisoformat(s)
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def tags_for(text: str, vocab: Iterable[str]) -> list[str]:
    low = text.lower()
    return sorted({t for t in vocab if t in low})


def make_item(id_, source, company, repo, ts, title, summary, ref, cfg, grade=None) -> dict:
    keep = cfg["identities"]["emails"]
    return {
        "id": id_, "source": source, "company": company, "repo": repo, "ts": iso(ts),
        "title": redact(summarize(title, 200), keep), "summary": redact(summarize(summary, 500), keep),
        "ref": ref, "grade": grade or GRADE[source], "tags": tags_for(f"{title} {summary}", cfg["tags"]),
    }


# ---- company resolution -------------------------------------------------------------------

def company_for_github_repo(full_name: str, cfg: dict, bitbucket_slugs: set) -> Optional[str]:
    mapped = cfg["github"]["repo_company"].get(full_name)
    if mapped:
        return mapped
    owner, _, name = full_name.partition("/")
    if name in bitbucket_slugs or name in cfg["exclude_repos"]:
        return None
    if owner == cfg["identities"]["github_login"] and name in cfg["personal_allow"]:
        return "personal"
    return None


MEMORY_DIR = re.compile(r"^-Users-.+?-projects-(hth|nmblr|personal)(?:-(.+))?$")
_norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())   # encoded dir names turn "." into "-"


def company_for_memory_dir(dirname: str, cfg: dict) -> Optional[str]:
    m = MEMORY_DIR.match(dirname)
    if not m:
        return None
    company, repo = m.group(1), (m.group(2) or "").split("--")[0]
    if any(_norm(repo) == _norm(ex) or _norm(repo).startswith(_norm(ex)) for ex in cfg["exclude_repos"]):
        return None
    if company == "personal" and repo not in cfg["personal_allow"]:
        return None
    return company


def _memory_repo(dirname: str) -> str:
    m = MEMORY_DIR.match(dirname)
    return ((m.group(2) or "") if m else "").split("--")[0] or "-"


# ---- sources -------------------------------------------------------------------------------

def parse_github_prs(items: list, cfg: dict, bitbucket_slugs: set) -> list[dict]:
    out = []
    for it in items:
        if it.get("user", {}).get("login") != cfg["identities"]["github_login"]:
            continue
        full = it["repository_url"].split("/repos/")[-1]
        company = company_for_github_repo(full, cfg, bitbucket_slugs)
        merged = (it.get("pull_request") or {}).get("merged_at")
        if not company or not merged:
            continue
        out.append(make_item(f"gh:pr:{full}#{it['number']}", "github-pr", company, full.split("/")[1], merged, it["title"], it.get("body") or "", it["html_url"], cfg))
    return out


def parse_bitbucket_prs(values: list, slug: str, cfg: dict) -> list[dict]:
    me = cfg["identities"]["bitbucket_uuid"]
    return [make_item(f"bb:pr:{slug}#{v['id']}", "bitbucket-pr", cfg["bitbucket"]["company"], slug, v["updated_on"], v["title"], (v.get("summary") or {}).get("raw") or "", v["links"]["html"]["href"], cfg)
            for v in values if (v.get("author") or {}).get("uuid") == me]


def parse_bitbucket_pipelines(values: list, slug: str, cfg: dict) -> list[dict]:
    me = cfg["identities"]["bitbucket_uuid"]
    out = []
    for v in values:
        if (v.get("creator") or {}).get("uuid") != me or ((v.get("state") or {}).get("result") or {}).get("name") != "SUCCESSFUL":
            continue
        branch = (v.get("target") or {}).get("ref_name") or "pull-request"
        out.append(make_item(f"pipe:bb:{slug}#{v['build_number']}", "pipeline", cfg["bitbucket"]["company"], slug, v["created_on"], f"pipeline #{v['build_number']} {branch}", f"{(v.get('trigger') or {}).get('name', '')} on {branch}", f"https://bitbucket.org/{cfg['bitbucket']['workspace']}/{slug}/pipelines/results/{v['build_number']}", cfg))
    return out


def parse_gh_runs(runs: list, repo: str, cfg: dict) -> list[dict]:
    company = cfg["github"]["repo_company"].get(repo)
    if not company:
        return []
    return [make_item(f"pipe:gh:{repo}#{r['databaseId']}", "pipeline", company, repo.split("/")[1], r["createdAt"], f"{r['name']} ({r['headBranch']})", f"{r['event']} {r['conclusion']}", f"https://github.com/{repo}/actions/runs/{r['databaseId']}", cfg)
            for r in runs if r.get("conclusion") == "success"]


def parse_git_log(text: str, company: str, repo: str, cfg: dict) -> list[dict]:
    """Format: %H<US>%aI<US>%s header lines; --name-only paths follow each header (git puts a blank line between)."""
    records = []
    for line in text.splitlines():
        if "\x1f" in line:
            sha, ts, subject = line.split("\x1f", 2)
            records.append([sha, ts, subject, []])
        elif line.strip() and records:
            records[-1][3].append(line.strip())
    out = []
    for sha, ts, subject, paths in records:
        dirs = sorted({p.rsplit("/", 1)[0] for p in paths if "/" in p})[:6]
        out.append(make_item(f"git:{company}/{repo}:{sha[:7]}", "git", company, repo, ts, subject, "touched: " + ", ".join(dirs), sha, cfg))
    return out


def parse_jira(issues: list, site: str, cfg: dict) -> list[dict]:
    me = cfg["identities"]["jira_account_id"]
    out = []
    for i in issues:
        f = i["fields"]
        if (f.get("assignee") or {}).get("accountId") != me or (f.get("status") or {}).get("name") == "Canceled":
            continue
        out.append(make_item(f"jira:{i['key']}", "jira", cfg["jira"]["company"], (f.get("project") or {}).get("key", ""), f["updated"], f"{i['key']} {f.get('summary', '')}", f"status {f['status']['name']}", f"{site}/browse/{i['key']}", cfg))
    return out


def parse_cloudtrail(events: list, aws_cfg: dict, region: str, cfg: dict) -> list[dict]:
    counts: dict = {}
    for e in events:
        if e.get("Username") != aws_cfg["iam_user"]:
            continue
        try:
            if json.loads(e.get("CloudTrailEvent") or "{}").get("readOnly", False):
                continue
        except ValueError:
            pass
        month = iso(e["EventTime"])[:7]
        service = e["EventSource"].split(".")[0]
        key = (month, service, e["EventName"])
        counts[key] = counts.get(key, 0) + 1
    out = []
    for (month, service, action), n in counts.items():
        out.append(make_item(f"ct:{aws_cfg['profile']}:{region}:{month}:{service}:{action}", "cloudtrail", aws_cfg["company"], aws_cfg["profile"], f"{month}-01", f"{service}:{action}", f"{service}:{action} x{n} in {month} ({region})", f"cloudtrail://{aws_cfg['profile']}/{region}", cfg))
    return out


def parse_remember_day(text: str, company: str, repo: str, date: str, path: str, cfg: dict) -> list[dict]:
    out, n = [], 0
    for m in re.finditer(r"^## (\d{2}):(\d{2})(?:-\d{2}:\d{2})? \| (.+?)\n(.*?)(?=^## |\Z)", text, flags=re.S | re.M):
        n += 1
        out.append(make_item(f"rem:{company}/{repo}:{date}#{n}", "remember", company, repo, f"{date}T{m.group(1)}:{m.group(2)}:00Z", m.group(3).strip(), m.group(4), path, cfg))
    return out


def parse_remember_archive(text: str, company: str, repo: str, path: str, cfg: dict) -> list[dict]:
    return [make_item(f"rem:{company}/{repo}:week-{m.group(1)}", "remember", company, repo, m.group(1), f"week of {m.group(1)}", m.group(2), path, cfg)
            for m in re.finditer(r"^## Week of (\d{4}-\d{2}-\d{2})\n(.*?)(?=^## |\Z)", text, flags=re.S | re.M)]


def parse_memory_note(text: str, dirname: str, filename: str, mtime_iso: str, path: str, cfg: dict) -> list[dict]:
    company = company_for_memory_dir(dirname, cfg)
    if not company:
        return []
    desc = re.search(r"^description:\s*\"?(.+?)\"?\s*$", text, flags=re.M)
    body = text.split("---", 2)[-1] if text.startswith("---") else text
    return [make_item(f"mem:{dirname}:{filename}", "memory", company, _memory_repo(dirname), mtime_iso, desc.group(1) if desc else filename, body, path, cfg)]


def parse_kb_log(text: str, cfg: dict) -> list[dict]:
    out = []
    for m in re.finditer(r"^## \[(\d{4}-\d{2}-\d{2})\] (\w+) \| (.+?)\n(.*?)(?=^## \[|\Z)", text, flags=re.S | re.M):
        date, kind, title, body = m.groups()
        hth, nmblr = "wiki/hth" in body, "wiki/nmblr" in body
        if hth == nmblr:
            continue  # mixed or unattributable entries never enter a company ledger
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60]
        notes = re.search(r"^- Notes:\s*(.+?)$", body, flags=re.M)
        out.append(make_item(f"kb:{date}:{slug}", "kb-log", "hth" if hth else "nmblr", "knowledge-base", date, f"{kind} {title}", notes.group(1) if notes else body, cfg["kb_log"], cfg))
    return out
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_parsers -v`
Expected: 10 tests OK.

---

### Task 4: `sources.py` fetchers and `commands.py` (`run`, `backfill`)

**Files:**
- Create: `~/.claude/skills/profile-sync/scripts/sources.py`
- Create: `~/.claude/skills/profile-sync/scripts/commands.py`
- Test: extend `test_harvest.py` with a `RunTest` that injects fake fetchers

**Interfaces:**
- `sources.py` produces `FETCHERS: dict[str, Callable]` keyed `github-pr, bitbucket-pr, pipeline-bb, pipeline-gh, git, jira, cloudtrail, remember, memory, kb-log`; each `fetch(cfg, secrets, wm: Watermarks, since_default: str, backfill: bool) -> list[dict]` and sets its own watermark keys on `wm`; raises `SourceError(str)` on auth/network failure.
- `commands.py` produces `dispatch(cmd, argv, state_dir)` and `run(cfg, secrets, state_dir, *, backfill=False, only=None, fetchers=FETCHERS) -> dict` returning `{"new": n, "by_source": {...}, "skipped": {source: reason}}`.

- [ ] **Step 1: Write the failing test (append to `test_harvest.py`)**

```python
class RunTest(unittest.TestCase):
    def test_run_appends_marks_skipped_and_keeps_failed_watermark(self):
        import commands
        tmp = tempfile.TemporaryDirectory()
        d = Path(tmp.name)
        cfg = {"draft_cursor_init": "2026-07-18T00:00:00Z"}
        good = lambda cfg, sec, wm, since, backfill: (wm.set("fake:ok", "2026-08-02T00:00:00Z"), [item("a", "2026-08-01T00:00:00Z"), item("b", "2026-08-02T00:00:00Z")])[1]

        def bad(cfg, sec, wm, since, backfill):
            raise commands.SourceError("401 token expired")

        res = commands.run(cfg, {}, d, fetchers={"okay": good, "broken": bad})
        self.assertEqual(res["new"], 2)
        self.assertEqual(res["skipped"], {"broken": "401 token expired"})
        wm = harvest.Watermarks(d)
        self.assertEqual(wm.get("fake:ok", None), "2026-08-02T00:00:00Z")
        self.assertIsNone(wm.get("fake:broken", None))
        self.assertEqual(commands.run(cfg, {}, d, fetchers={"okay": good})["new"], 0)
        tmp.cleanup()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_harvest.RunTest -v`
Expected: `ModuleNotFoundError: No module named 'commands'`.

- [ ] **Step 3: Write `sources.py`**

```python
#!/usr/bin/env python3
"""Fetchers: one function per source. Read-only. Each sets its own watermark keys."""
from __future__ import annotations

import base64
import datetime as dt
import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import parsers


class SourceError(Exception):
    pass


def _get_json(url: str, auth: str, retries: int = 3) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": auth, "Accept": "application/json"})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                time.sleep(int(e.headers.get("Retry-After", "10")))
                continue
            raise SourceError(f"{e.code} {url.split('?')[0]}")
        except (urllib.error.URLError, TimeoutError) as e:
            raise SourceError(f"network {e}")
    raise SourceError("retries exhausted")


def _basic(email: str, token: str) -> str:
    return "Basic " + base64.b64encode(f"{email}:{token}".encode()).decode()


def _sh(args: list, timeout: int = 120) -> str:
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired) as e:
        raise SourceError(f"{args[0]} {e}")
    if p.returncode != 0:
        raise SourceError(f"{args[0]} rc={p.returncode} {p.stderr.strip()[:200]}")
    return p.stdout


def _date(since_iso: str) -> str:
    return since_iso[:10]


def _json_stream(text: str):
    """Yield every top-level JSON value in a string of concatenated JSON documents."""
    dec, pos, n = json.JSONDecoder(), 0, len(text)
    while pos < n:
        while pos < n and text[pos].isspace():
            pos += 1
        if pos >= n:
            break
        obj, pos = dec.raw_decode(text, pos)
        yield obj


def _max_ts(items: list, current: str) -> str:
    return max([current] + [i["ts"] for i in items])


# ---- Bitbucket -----------------------------------------------------------------------------

def bitbucket_slugs(cfg, secrets) -> dict:
    """slug -> default branch for every repo in the workspace (one page; 82 repos today)."""
    ws = cfg["bitbucket"]["workspace"]
    data = _get_json(f"https://api.bitbucket.org/2.0/repositories/{ws}?role=member&pagelen=100&fields=next,values.slug,values.mainbranch.name", _basic(secrets["bitbucket_email"], secrets["bitbucket_token"]))
    slugs = {v["slug"]: (v.get("mainbranch") or {}).get("name", "develop") for v in data["values"]}
    nxt = data.get("next")
    while nxt:
        data = _get_json(nxt, _basic(secrets["bitbucket_email"], secrets["bitbucket_token"]))
        slugs.update({v["slug"]: (v.get("mainbranch") or {}).get("name", "develop") for v in data["values"]})
        nxt = data.get("next")
    return slugs


def fetch_bitbucket_prs(cfg, secrets, wm, since_default, backfill):
    if not secrets.get("bitbucket_token"):
        raise SourceError("BITBUCKET_TOKEN missing (env or Keychain)")
    ws, auth = cfg["bitbucket"]["workspace"], _basic(secrets["bitbucket_email"], secrets["bitbucket_token"])
    items = []
    for slug in bitbucket_slugs(cfg, secrets):
        if slug in cfg["exclude_repos"]:
            continue
        key = f"bitbucket-pr:{slug}"
        since = cfg["backfill_start"]["hth"] + "T00:00:00Z" if backfill else wm.get(key, since_default)
        q = urllib.parse.quote(f'state="MERGED" AND author.uuid="{cfg["identities"]["bitbucket_uuid"]}" AND updated_on>"{since}"')
        url = f"https://api.bitbucket.org/2.0/repositories/{ws}/{slug}/pullrequests?q={q}&sort=updated_on&pagelen=50&fields=next,values.id,values.title,values.updated_on,values.links.html.href,values.author.uuid,values.destination.branch.name,values.summary.raw"
        got = []
        while url:
            data = _get_json(url, auth)
            got += parsers.parse_bitbucket_prs(data.get("values", []), slug, cfg)
            url = data.get("next")
        if got:
            wm.set(key, _max_ts(got, since))
        items += got
    return items


def fetch_pipeline_bb(cfg, secrets, wm, since_default, backfill):
    if not secrets.get("bitbucket_token"):
        raise SourceError("BITBUCKET_TOKEN missing (env or Keychain)")
    ws, auth = cfg["bitbucket"]["workspace"], _basic(secrets["bitbucket_email"], secrets["bitbucket_token"])
    items = []
    for slug in bitbucket_slugs(cfg, secrets):
        if slug in cfg["exclude_repos"]:
            continue
        key = f"pipeline:bb:{slug}"
        since = cfg["backfill_start"]["hth"] + "T00:00:00Z" if backfill else wm.get(key, since_default)
        url = f"https://api.bitbucket.org/2.0/repositories/{ws}/{slug}/pipelines/?sort=-created_on&pagelen=100"
        got, stop = [], False
        while url and not stop:
            data = _get_json(url, auth)
            values = data.get("values", [])
            fresh = [v for v in values if parsers.iso(v["created_on"]) > since]
            stop = len(fresh) < len(values) or not values
            got += parsers.parse_bitbucket_pipelines(fresh, slug, cfg)
            url = data.get("next")
        if got:
            wm.set(key, _max_ts(got, since))
        items += got
    return items


# ---- GitHub ---------------------------------------------------------------------------------

def fetch_github_prs(cfg, secrets, wm, since_default, backfill):
    login, key = cfg["identities"]["github_login"], "github-pr:search"
    slugs = set(cfg.get("_bitbucket_slugs", {}))
    windows = []
    if backfill:
        start = int(cfg["backfill_start"]["nmblr"][:4])
        for y in range(min(start, int(cfg["backfill_start"]["personal"][:4])), dt.date.today().year + 1):
            windows.append(f"{y}-01-01..{y}-12-31")     # search caps at 1000 results per query
    else:
        windows.append(f">={_date(wm.get(key, since_default))}")
    items = []
    for w in windows:
        out = _sh(["gh", "api", "--paginate", f"search/issues?q=is:pr+author:{login}+is:merged+merged:{w}&per_page=100&sort=updated&order=asc"], timeout=300)
        for page in _json_stream(out):      # --paginate concatenates page objects; decode them one by one
            items += parsers.parse_github_prs(page.get("items", []), cfg, slugs)
    if items:
        wm.set(key, _max_ts(items, wm.get(key, since_default)))
    return items


def fetch_pipeline_gh(cfg, secrets, wm, since_default, backfill):
    items = []
    for repo in cfg["github"]["actions_repos"]:
        key = f"pipeline:gh:{repo}"
        since = cfg["backfill_start"]["nmblr"] + "T00:00:00Z" if backfill else wm.get(key, since_default)
        runs = json.loads(_sh(["gh", "run", "list", "--repo", repo, "--user", cfg["identities"]["github_login"], "--status", "success", "--limit", "500" if backfill else "100", "--json", "databaseId,name,headBranch,createdAt,conclusion,event"]))
        got = parsers.parse_gh_runs([r for r in runs if parsers.iso(r["createdAt"]) > since], repo, cfg)
        if got:
            wm.set(key, _max_ts(got, since))
        items += got
    return items


# ---- git ------------------------------------------------------------------------------------

def _repos(cfg):
    seen = set()
    for company, root in cfg["repo_roots"].items():
        rootp = Path(root)
        if not rootp.is_dir():
            continue
        for d in sorted(rootp.iterdir()):
            if not (d / ".git").exists() or d.name in cfg["exclude_repos"]:
                continue
            if company == "personal" and d.name not in cfg["personal_allow"]:
                continue
            try:
                remote = subprocess.run(["git", "-C", str(d), "remote", "get-url", "origin"], capture_output=True, text=True, timeout=10).stdout.strip() or str(d)
            except (OSError, subprocess.TimeoutExpired):
                continue
            if remote in seen:
                continue
            seen.add(remote)
            yield company, d


def _default_branch(repo: Path) -> str:
    for cand in ("refs/remotes/origin/HEAD",):
        p = subprocess.run(["git", "-C", str(repo), "symbolic-ref", "-q", cand], capture_output=True, text=True)
        if p.returncode == 0:
            return p.stdout.strip().rsplit("/", 1)[-1]
    for b in ("develop", "main", "master"):
        if subprocess.run(["git", "-C", str(repo), "rev-parse", "--verify", "-q", f"origin/{b}"], capture_output=True).returncode == 0:
            return b
    return "HEAD"


def fetch_git(cfg, secrets, wm, since_default, backfill):
    items = []
    for company, repo in _repos(cfg):
        key = f"git:{company}/{repo.name}"
        since = cfg["backfill_start"][company] + "T00:00:00Z" if backfill else wm.get(key, since_default)
        branch = _default_branch(repo)
        try:
            subprocess.run(["git", "-C", str(repo), "fetch", "--quiet", "origin", branch], capture_output=True, timeout=60)
        except (OSError, subprocess.TimeoutExpired):
            pass                      # offline or slow remote: log what is already local
        ref = f"origin/{branch}" if branch != "HEAD" else "HEAD"
        try:
            text = subprocess.run(["git", "-C", str(repo), "log", ref, f"--since={since}", f"--author={cfg['identities']['git_author']}", "--no-merges", "--format=%H%x1f%aI%x1f%s", "--name-only"], capture_output=True, text=True, timeout=120).stdout
        except (OSError, subprocess.TimeoutExpired) as e:
            raise SourceError(f"git log {repo.name}: {e}")
        got = parsers.parse_git_log(text, company, repo.name, cfg)
        if got:
            wm.set(key, _max_ts(got, since))
        items += got
    return items


# ---- Jira -----------------------------------------------------------------------------------

def fetch_jira(cfg, secrets, wm, since_default, backfill):
    if not secrets.get("jira_token"):
        raise SourceError("JIRA_API_TOKEN missing (env or Keychain)")
    auth, items = _basic(secrets["jira_email"], secrets["jira_token"]), []
    for site in cfg["jira"]["sites"]:
        key = f"jira:{urllib.parse.urlparse(site).hostname}"
        since = cfg["backfill_start"]["hth"] + "T00:00:00Z" if backfill else wm.get(key, since_default)
        jql = urllib.parse.quote(f'assignee = currentUser() AND statusCategory = Done AND status != Canceled AND updated >= "{_date(since)}" ORDER BY updated ASC')
        url, got = f"{site}/rest/api/3/search/jql?jql={jql}&fields=key,summary,status,updated,project,assignee&maxResults=100", []
        while url:
            data = _get_json(url, auth)
            got += parsers.parse_jira([i for i in data.get("issues", []) if parsers.iso(i["fields"]["updated"]) > since], site, cfg)
            url = f"{site}/rest/api/3/search/jql?jql={jql}&fields=key,summary,status,updated,project,assignee&maxResults=100&nextPageToken={data['nextPageToken']}" if data.get("nextPageToken") and not data.get("isLast") else None
        if got:
            wm.set(key, _max_ts(got, since))
        items += got
    return items


# ---- CloudTrail -----------------------------------------------------------------------------

def fetch_cloudtrail(cfg, secrets, wm, since_default, backfill):
    items = []
    floor = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=89)).strftime("%Y-%m-%dT%H:%M:%SZ")
    for aws in cfg["aws"]:
        for region in aws["regions"]:
            key = f"cloudtrail:{aws['profile']}:{region}"
            since = max(wm.get(key, since_default), floor)
            events, token, pages = [], None, 0
            while pages < cfg.get("cloudtrail_max_pages", 100):   # ponytail: page cap, raise cloudtrail_max_pages if a busy month truncates
                args = ["aws", "cloudtrail", "lookup-events", "--profile", aws["profile"], "--region", region, "--lookup-attributes", f"AttributeKey=Username,AttributeValue={aws['iam_user']}", "--start-time", since, "--max-results", "50", "--output", "json"]
                if token:
                    args += ["--next-token", token]
                data = json.loads(_sh(args, timeout=60))
                events += data.get("Events", [])
                token, pages = data.get("NextToken"), pages + 1
                if not token:
                    break
            got = parsers.parse_cloudtrail(events, aws, region, cfg)
            if events:
                wm.set(key, max(parsers.iso(e["EventTime"]) for e in events))
            items += got
    return items


# ---- local digests -------------------------------------------------------------------------

def _remember_dirs(cfg):
    for company, root in cfg["repo_roots"].items():
        rootp = Path(root)
        if (rootp / ".remember").is_dir():
            yield company, rootp.name, rootp / ".remember"
        for d in sorted(rootp.iterdir()) if rootp.is_dir() else []:
            if (d / ".remember").is_dir() and d.name not in cfg["exclude_repos"] and (company != "personal" or d.name in cfg["personal_allow"]):
                yield company, d.name, d / ".remember"


def fetch_remember(cfg, secrets, wm, since_default, backfill):
    items = []
    for company, repo, d in _remember_dirs(cfg):
        key = f"remember:{company}/{repo}"
        last = "" if backfill else wm.get(key, "")
        days = sorted(p for p in d.glob("today-*.done.md") if p.name > last)
        for p in days:
            items += parsers.parse_remember_day(p.read_text(errors="replace"), company, repo, p.name[6:16], str(p), cfg)
        arc = d / "archive.md"
        if arc.exists():
            items += parsers.parse_remember_archive(arc.read_text(errors="replace"), company, repo, str(arc), cfg)
        if days:
            wm.set(key, days[-1].name)
    return items


def fetch_memory(cfg, secrets, wm, since_default, backfill):
    items, root = [], Path(cfg["memory_root"])
    for d in sorted(root.iterdir()) if root.is_dir() else []:
        mem = d / "memory"
        if not mem.is_dir() or not parsers.company_for_memory_dir(d.name, cfg):
            continue
        key = f"memory:{d.name}"
        since = "1970-01-01T00:00:00Z" if backfill else wm.get(key, since_default)
        newest = since
        for p in sorted(mem.glob("*.md")):
            if p.name == "MEMORY.md":
                continue
            mtime = dt.datetime.fromtimestamp(p.stat().st_mtime, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            if mtime <= since:
                continue
            items += parsers.parse_memory_note(p.read_text(errors="replace"), d.name, p.name, mtime, str(p), cfg)
            newest = max(newest, mtime)
        if newest > since:
            wm.set(key, newest)
    return items


def fetch_kb_log(cfg, secrets, wm, since_default, backfill):
    p = Path(cfg["kb_log"])
    if not p.exists():
        raise SourceError(f"missing {p}")
    key = "kb-log:all"
    since = "1970-01-01" if backfill else wm.get(key, since_default)[:10]
    got = [i for i in parsers.parse_kb_log(p.read_text(errors="replace"), cfg) if i["ts"][:10] > since]
    if got:
        wm.set(key, max(i["ts"] for i in got))
    return got


FETCHERS = {
    "bitbucket-pr": fetch_bitbucket_prs,
    "github-pr": fetch_github_prs,
    "git": fetch_git,
    "jira": fetch_jira,
    "cloudtrail": fetch_cloudtrail,
    "pipeline-bb": fetch_pipeline_bb,
    "pipeline-gh": fetch_pipeline_gh,
    "remember": fetch_remember,
    "memory": fetch_memory,
    "kb-log": fetch_kb_log,
}
```

- [ ] **Step 4: Write `commands.py` (`run` and `backfill`; `delta`, `verify-claims`, `advance-draft` come in Task 5)**

```python
#!/usr/bin/env python3
"""Subcommands that need config + secrets. Kept out of harvest.py so the core stays testable offline."""
from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

import harvest
from sources import FETCHERS, SourceError, bitbucket_slugs


def run(cfg: dict, secrets: dict, state_dir: Path, *, backfill: bool = False, only=None, fetchers=None) -> dict:
    fetchers = fetchers or FETCHERS
    ledger, wm = harvest.Ledger(state_dir), harvest.Watermarks(state_dir)
    since_default = wm.draft or cfg["draft_cursor_init"]
    result = {"new": 0, "by_source": {}, "skipped": {}, "backfill": backfill}
    if "github-pr" in fetchers and fetchers is FETCHERS and secrets.get("bitbucket_token"):
        try:
            cfg["_bitbucket_slugs"] = bitbucket_slugs(cfg, secrets)   # GitHub mirrors of Bitbucket repos are skipped by name
        except SourceError as e:
            result["skipped"]["bitbucket-slugs"] = str(e)
    for name, fetch in fetchers.items():
        if only and name not in only:
            continue
        snapshot = dict(wm.data)
        try:
            print(f"harvest {name} ...", file=sys.stderr, flush=True)
            items = fetch(cfg, secrets, wm, since_default, backfill)
        except SourceError as e:
            wm.data = snapshot          # a failed source keeps its old watermark
            result["skipped"][name] = str(e)
            continue
        n = ledger.append(items)
        result["by_source"][name] = {"fetched": len(items), "new": n}
        result["new"] += n
    wm.save()
    return result


def dispatch(cmd: str, argv: list, state_dir: Path) -> None:
    cfg = harvest.load_config(state_dir)
    secrets = harvest.load_secrets(cfg)
    only = argv[argv.index("--source") + 1].split(",") if "--source" in argv else None
    if cmd in ("run", "backfill"):
        res = run(cfg, secrets, state_dir, backfill=(cmd == "backfill"), only=only)
        print(json.dumps(res, indent=2))
        return
    from claims import dispatch_claims  # Task 5
    dispatch_claims(cmd, argv, state_dir, cfg)
```

- [ ] **Step 5: Run the unit test, then a live single-source smoke per fetcher**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_harvest -v`
Expected: 6 tests OK.

Live smoke (uses a throwaway state dir; needs the Atlassian tokens in the shell, which `~/.zshrc` exports):
```bash
S=$HOME/.profile-sync-smoke && rm -rf $S && python3 ~/.claude/skills/profile-sync/scripts/harvest.py init-config --state-dir $S
for src in remember memory kb-log git jira pipeline-gh github-pr pipeline-bb bitbucket-pr cloudtrail; do
  echo "== $src"; python3 ~/.claude/skills/profile-sync/scripts/harvest.py run --source $src --state-dir $S | jq -c '{new, skipped, s: .by_source}'
done
wc -l $S/ledger.jsonl; jq -r '.grade' $S/ledger.jsonl | sort | uniq -c; grep -c '\[redacted\]' $S/ledger.jsonl
```
Expected: every source reports `skipped: {}` and a non-negative `new`; grades A-F all present; the ledger has items only after `2026-07-18` (the default since). `cloudtrail` may take 1-3 minutes. If a source is skipped, the reason names the failing call - fix before continuing.

---

### Task 5: `claims.py` - `delta`, `verify-claims`, `advance-draft`

**Files:**
- Create: `~/.claude/skills/profile-sync/scripts/claims.py`
- Test: `~/.claude/skills/profile-sync/scripts/test_claims.py`

**Interfaces:**
- `delta(ledger_items, draft_cursor, company=None, context=20) -> {"since": cursor, "items": [...after cursor...], "context": [...last N before cursor...]}`
- `verify(claims: list, ledger_index: dict, denylist: list) -> list` returns claims with `status` and `reason` filled (`proposed | needs-word | rejected`).
- `advance(ledger_items, wm)` sets `wm.draft` to the newest item ts.
- `dispatch_claims(cmd, argv, state_dir, cfg)`.

Claim shape (from the spec 4.5): `{company, target, jobId, text, resumeText?, evidence: [ids], status?, reason?}`.

- [ ] **Step 1: Write the failing test**

Create `~/.claude/skills/profile-sync/scripts/test_claims.py`:

```python
import unittest

import claims


def it(i, ts, grade, company="hth"):
    return {"id": i, "ts": ts, "grade": grade, "company": company, "source": "x", "repo": "r", "title": "t", "summary": "s", "ref": "u", "tags": []}


LEDGER = [it("a1", "2026-08-01T00:00:00Z", "A"), it("b1", "2026-08-02T00:00:00Z", "B"), it("f1", "2026-08-03T00:00:00Z", "F"),
          it("old", "2026-07-01T00:00:00Z", "A"), it("n1", "2026-08-04T00:00:00Z", "A", "nmblr"),
          it("a2", "2026-06-01T00:00:00Z", "A"), it("a3", "2026-07-20T00:00:00Z", "A"), it("a4", "2026-08-10T00:00:00Z", "A"), it("a5", "2026-08-11T00:00:00Z", "A"),
          it("p1", "2026-08-05T00:00:00Z", "B", "personal")]
INDEX = {x["id"]: x for x in LEDGER}
DENY = ["Acme Water", "Northwind Utilities"]


class DeltaTest(unittest.TestCase):
    def test_split_at_cursor_and_company(self):
        d = claims.delta(LEDGER, "2026-07-18T00:00:00Z", company="hth", context=1)
        self.assertEqual([x["id"] for x in d["items"]], ["a3", "a1", "b1", "f1", "a4", "a5"])
        self.assertEqual([x["id"] for x in d["context"]], ["old"])


class VerifyTest(unittest.TestCase):
    def v(self, **kw):
        base = {"company": "hth", "target": "receipt", "jobId": "hth", "text": "Built the thing for a utility tenant.", "evidence": ["a1"]}
        base.update(kw)
        return claims.verify([base], INDEX, DENY)[0]

    def test_rules(self):
        self.assertEqual(self.v()["status"], "proposed")
        self.assertEqual(self.v(evidence=["f1"])["status"], "needs-word")
        self.assertEqual(self.v(evidence=["nope"])["status"], "rejected")
        self.assertEqual(self.v(evidence=["a1", "n1"])["status"], "rejected")
        self.assertEqual(self.v(text="Shipped Acme Water portal")["status"], "rejected")
        self.assertEqual(self.v(text="x" * 221)["status"], "rejected")
        self.assertEqual(self.v(target="stack", text="Kubernetes", evidence=["a1", "b1"])["status"], "needs-word")
        self.assertEqual(self.v(target="stack", text="Kubernetes", evidence=["a1", "b1", "a3"])["status"], "proposed")
        self.assertEqual(self.v(target="candidate-case", text="Theme", evidence=["a1", "a4", "a5", "a3", "a2"])["status"], "proposed")
        self.assertEqual(self.v(target="secondary-project", company="personal", evidence=["p1"])["status"], "needs-word")
        self.assertEqual(self.v(target="fleet", text="A new tenant went live")["status"], "needs-word")
        self.assertEqual(self.v(target="metric")["status"], "rejected")
        self.assertEqual(self.v()["grade"], "A")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest test_claims -v`
Expected: `ModuleNotFoundError: No module named 'claims'`.

- [ ] **Step 3: Write `claims.py`**

```python
#!/usr/bin/env python3
"""Mechanical side of drafting: what the LLM may see (delta) and the rules every claim must pass (verify)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import harvest

STRONG = {"A", "B", "C"}
LIMITS = {"receipt": 220, "resume": 360}


def delta(items: list, cursor: str, company=None, context: int = 20) -> dict:
    rows = sorted((i for i in items if not company or i["company"] == company), key=lambda i: i["ts"])
    after = [i for i in rows if i["ts"] > cursor]
    before = [i for i in rows if i["ts"] <= cursor]
    return {"since": cursor, "items": after, "context": before[-context:] if context else []}


def _months(evidence: list) -> set:
    return {e["ts"][:7] for e in evidence}


def _deny_hit(text: str, denylist: list):
    for t in denylist:
        if re.search(rf"(^|[^A-Za-z]){re.escape(t)}($|[^A-Za-z])", text, flags=re.I):
            return t
    return None


def verify(cl: list, index: dict, denylist: list) -> list:
    out = []
    for c in cl:
        c = dict(c)
        ev = [index[e] for e in c.get("evidence", []) if e in index]
        missing = [e for e in c.get("evidence", []) if e not in index]
        strong = [e for e in ev if e["grade"] in STRONG]
        c["grade"] = min((e["grade"] for e in ev), default=None)
        hit = _deny_hit(c.get("text", "") + " " + c.get("resumeText", ""), denylist)
        target = c.get("target")

        def done(status, reason=""):
            c["status"], c["reason"] = status, reason
            out.append(c)

        if missing:
            done("rejected", f"unknown evidence ids: {missing}"); continue
        if not ev:
            done("rejected", "no evidence"); continue
        if {e["company"] for e in ev} != {c.get("company")}:
            done("rejected", "evidence crosses companies or does not match claim.company"); continue
        if hit:
            done("rejected", f"client name in text: {hit}"); continue
        if len(c.get("text", "")) > LIMITS["receipt"] or len(c.get("resumeText", "")) > LIMITS["resume"]:
            done("rejected", "text over limit (220 site / 360 resume)"); continue
        if target == "metric":
            done("rejected", "metrics are derived, not proposed"); continue
        if target in ("fleet", "secondary-project"):
            done("needs-word", "always confirmed by Benedict"); continue
        if target == "stack":
            ab = [e for e in ev if e["grade"] in ("A", "B")]
            if len(ab) >= 3 and len(_months(ab)) >= 2:
                done("proposed")
            else:
                done("needs-word", "stack needs >=3 A/B items across >=2 months")
            continue
        if target == "candidate-case":
            a = [e for e in ev if e["grade"] == "A"]
            done("proposed" if len(a) >= 5 and len(_months(a)) >= 2 else "needs-word", "" if len(a) >= 5 else "needs >=5 A items across >=2 months")
            continue
        if target == "receipt":
            done("proposed" if strong else "needs-word", "" if strong else "only F/D/E evidence")
            continue
        done("rejected", f"unknown target {target}")
    return out


def advance(items: list, wm: harvest.Watermarks) -> str:
    newest = max((i["ts"] for i in items), default=wm.draft)
    if newest and (not wm.draft or newest > wm.draft):
        wm.draft = newest
        wm.save()
    return wm.draft


def dispatch_claims(cmd: str, argv: list, state_dir: Path, cfg: dict) -> None:
    items = list(harvest.Ledger(state_dir).iter())
    wm = harvest.Watermarks(state_dir)
    cursor = wm.draft or cfg["draft_cursor_init"]
    if cmd == "delta":
        company = argv[argv.index("--company") + 1] if "--company" in argv else None
        grades = set(argv[argv.index("--grades") + 1]) if "--grades" in argv else None
        d = delta(items, cursor, company)
        if grades:
            d["items"] = [i for i in d["items"] if i["grade"] in grades]
        print(json.dumps(d, indent=1, ensure_ascii=False))
    elif cmd == "verify-claims":
        path = Path(argv[0])
        deny_path = state_dir / "denylist.txt"
        denylist = [l.strip() for l in deny_path.read_text().splitlines() if l.strip() and not l.startswith("#")] if deny_path.exists() else []
        verified = verify(json.loads(path.read_text()), {i["id"]: i for i in items}, denylist)
        path.write_text(json.dumps(verified, indent=1, ensure_ascii=False))
        counts = {s: sum(1 for c in verified if c["status"] == s) for s in ("proposed", "needs-word", "rejected")}
        print(json.dumps(counts))
    elif cmd == "advance-draft":
        print(advance([i for i in items if i["ts"] > cursor], wm))
    else:
        sys.exit(f"unknown claims command {cmd}")
```

- [ ] **Step 4: Run the tests**

Run: `cd ~/.claude/skills/profile-sync/scripts && python3 -m unittest discover -s . -p 'test_*.py' -v`
Expected: all tests in `test_redact`, `test_harvest`, `test_parsers`, `test_claims` OK (22 tests).

Run: `python3 ~/.claude/skills/profile-sync/scripts/harvest.py delta --company hth --grades ABC --state-dir $HOME/.profile-sync-smoke | jq '{since, n: (.items | length), ctx: (.context | length), first: .items[0].id}'`
Expected: `since` = `2026-07-18T00:00:00Z`, `n` > 0, first id from Jul/Aug 2026.

---

### Task 6: SKILL.md and the PR template

**Files:**
- Create: `~/.claude/skills/profile-sync/SKILL.md`
- Create: `~/.claude/skills/profile-sync/reference/pr-template.md`

- [ ] **Step 1: Write `reference/pr-template.md`**

```markdown
# PR skeleton

Title: `Profile sync: <n> receipts, <m> stack items (<from> - <to>)`

Body:

## Proposed (<n>)

For each proposed claim, one block:

- **<target> / <jobId>** - <text>
  - resume: <resumeText or "same">
  - replaces: <old bullet text or "none (append)">
  - evidence: grade <A|B|C>, <count> items (<A x2, B x5>), <company>

## Needs your word (<k>)

- **<target> / <jobId>** - <text> - why: <reason> - answer by editing `src/data/content.ts` on this branch or replying here.

## Candidate case studies

- <theme> - <count> A-grade items across <months>

## Sources skipped this run

- <source>: <reason>

## Verification

- `npm run check`: ok / `npm run build`: ok / `public/resume.pdf`: <pages> pages
- Dossier: `~/.profile-sync/runs/<date>/dossier.md`

Rules: no client names, no Jira keys, no private PR links, no repo names of client repos.
```

- [ ] **Step 2: Write `SKILL.md`**

```markdown
---
name: profile-sync
description: Use when updating the portfolio site, resume, or LinkedIn pack from real work evidence (PRs, commits, Jira, CloudTrail, pipelines, session digests), or when asked to sync the profile, refresh the resume, run the weekly profile sync, or set it up (--init). Opens a PR on bpabatao.github.io; never pushes to main.
argument-hint: "[--cron | --dry-run | --init | --check-linkedin]"
allowed-tools:
  - Read
  - Edit(src/data/content.ts)
  - Write(/Users/macbook-pro/.profile-sync/**)
  - Bash(python3 /Users/macbook-pro/.claude/skills/profile-sync/scripts/harvest.py *)
  - Bash(security find-generic-password *)
  - Bash(security add-generic-password *)
  - Bash(node scripts/render-resume.ts *)
  - Bash(python3 scripts/docx.py *)
  - Bash(node scripts/render-linkedin.ts *)
  - Bash(node scripts/check-profile.ts *)
  - Bash(npm run render)
  - Bash(npm run check *)
  - Bash(npm run build)
  - Bash(npm test)
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git checkout main)
  - Bash(git pull --ff-only origin main)
  - Bash(git checkout -b profile-sync/*)
  - Bash(git checkout profile-sync/*)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(git push origin profile-sync/*)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(gh pr create *)
  - Bash(gh pr edit *)
disallowed-tools:
  - mcp__claude_ai_Atlassian
  - mcp__claude_ai_Atlassian_Rovo
  - mcp__plugin_github_github
  - mcp__claude_ai_Slack
---

# profile-sync

## CRITICAL: read-only against every external system

The Jira, Confluence and Bitbucket tokens have full account permissions (Atlassian issues no read-only tokens).
This skill only ever issues GET requests to them, through `harvest.py` (`urllib`), and never through the Atlassian MCP connector - its write tools are disallowed above.
Never create, edit, transition, comment on, or log work against a Jira issue; never create or update a Confluence page; never open, approve, merge or comment on a Bitbucket PR; never trigger a pipeline.
The same holds for AWS (`cloudtrail lookup-events` only) and GitHub (`gh api` GET, `gh run list`, and `gh pr create|edit` on the portfolio repo only).

Keeps `bpabatao.github.io` (site), the resume and the LinkedIn paste-pack in sync with real work evidence.
It proposes; Benedict asserts. Every change is a PR on branch `profile-sync/<date>`; nothing reaches `main` from this skill.

Paths: REPO = `/Users/macbook-pro/projects/personal/bpabatao.github.io`, STATE = `~/.profile-sync`, H = `python3 /Users/macbook-pro/.claude/skills/profile-sync/scripts/harvest.py`.
Spec: `REPO/docs/superpowers/specs/2026-08-28-profile-sync-design.md`.

## Modes ($ARGUMENTS)

| Arg | Behaviour |
|---|---|
| (none) | Interactive. Up to 5 `needs-word` claims are asked with AskUserQuestion before the PR; the rest go to the PR block. |
| `--cron` | Unattended. Never ask; `needs-word` claims go to the PR body only. |
| `--dry-run` | Steps 1-6 only; write the dossier; no repo writes, no cursor advance. |
| `--init` | One-time setup (section below), then the full-history backfill. |
| `--check-linkedin` | Interactive only: read the newest `Positions.csv`, `Projects.csv`, `Skills.csv`, `Profile.csv` in `STATE/linkedin-export/`, diff titles, dates, descriptions, project list and skills against `linkedin/*.txt` and `content.ts`, add a drift list to the dossier; warn if the export is older than 60 days and ask Benedict for a fresh one. Never in cron. |

## Never

- Never push to `main`, force-push, merge, or delete branches.
- Never write client or tenant names into `content.ts`, the PR body, or LinkedIn text (denylist at `STATE/denylist.txt`). `fleetPortals` is the only exception and this skill never edits it.
- Never cite HtH evidence in an Nmblr bullet or vice versa.
- Never promote a claim whose only evidence is grade D, E or F.
- Never put Jira keys, private PR URLs, repo names of client repos, or the ledger into the PR body.
- Never edit `resume/*`, `public/resume.pdf` or `linkedin/*` by hand - they are rendered.

## Run

Work from REPO (`cd` there first). RUN_DATE = today `YYYY-MM-DD`. Keep a running `STATE/runs/RUN_DATE/dossier.md`.

1. **Lock and preflight.** `H lock` (exit if LOCKED). `H status`; if `stale` is true and not `--cron`, tell Benedict the last ok run date. `git status --porcelain` must be empty on REPO; if not, stop with `status: failed` (dirty tree).
2. **Harvest.** `H run` -> JSON. Record `by_source` and `skipped` in the dossier.
3. **Delta.** `H delta --company hth --grades ABCDE` and `H delta --company nmblr --grades ABCDE` and `H delta --company personal` (each JSON). If no company has an item with grade A, B or C: `H advance-draft`, `H mark nothing-new`, `H unlock`, print "nothing new since <cursor>", stop. Also run `H delta --grades F` per company to collect F context (memory notes and digests) for the drafters.
4. **Draft** - dispatch one subagent per company that has strong items (Agent tool, general-purpose, run both in parallel). Prompt (fill the brackets):

   > You draft resume-grade claims for Benedict Pabatao's public profile. Company: [hth|nmblr]. Employer string: ["ESC Partners / HometownHUB"|"Nmblr"]. Read `~/VOICE.md` for tone (direct, dense, plain dash, no hype). Read `~/.claude/skills/profile-sync/reference/anonymise.md` and never use a denylisted term; describe clients generically. Current bullets for this job (do not repeat them; you may propose replacing one if the new evidence makes it stronger - quote the old text in `replaces`): [paste `receipts` and `resumeReceipts` for jobId from REPO/src/data/content.ts]. Evidence items after the draft cursor (JSON, grades A-E): [paste delta items]. Context items (grade F digests and memory notes; context only, never sole evidence): [paste F items, truncated to 60]. Output ONLY a JSON array of claims, max 3 `receipt` claims plus any `stack` / `candidate-case` claims, shape: `{"company","target":"receipt|stack|candidate-case","jobId":"[hth|nmblr]","text":"<=220 chars, verb-first, site wording","resumeText":"<=360 chars, may open with **lead phrase** marker, keyword-dense","replaces":"<old bullet text or null>","evidence":["<ledger ids>"],"rationale":"one line"}`. A `receipt` needs at least one A/B/C id. Numbers only when an evidence item states them. No client names. No Jira keys in text.

   For `personal`, do not dispatch a drafter; instead list each personal item as a `secondary-project` claim with `text` = the repo name and the item title, `evidence` = its ids.
   Concatenate all claims into `STATE/runs/RUN_DATE/claims.json`.
5. **Verify (mechanical).** `H verify-claims STATE/runs/RUN_DATE/claims.json` -> statuses written back; print counts.
6. **Verify (semantic)** - dispatch one verifier subagent (general-purpose) with the verified claims file and the same delta JSON: 

   > You are the verifier. For each claim with status `proposed`, check: (1) every sentence in `text`/`resumeText` is supported by the cited evidence titles/summaries - a number not present in evidence downgrades the claim to `needs-word` with reason; (2) the text opens with a verb or a bolded verb-first lead; (3) no client, tenant or product-instance name (denylist in `~/.profile-sync/denylist.txt`), no Jira key, no PR number; (4) the wording matches `~/VOICE.md`. Return the same JSON array with `status`/`reason` updated; never upgrade a status, only downgrade. Output JSON only.

   Save the result over `claims.json`. If `--dry-run`: write the dossier (claims with statuses, evidence ids, skipped sources), `H unlock`, stop.
7. **Ask (interactive only).** For up to 5 `needs-word` claims, AskUserQuestion: "Keep as proposed / Drop / Edit (Other)". Update statuses.
8. **Apply.** For each `proposed` claim, edit `REPO/src/data/content.ts`: `receipt` -> append `text` to the job's `receipts` and `resumeText` (or `text`) to `resumeReceipts`, or replace the bullet named in `replaces` in both lists; `stack` -> add the item to the best-fitting `stackGroups` entry. Set `profile.updated` to RUN_DATE. Never touch `fleetPortals`, `cases.ts`, or any file but `content.ts`.
9. **Render and gate.** `npm run render && npm run check -- --require-fresh && npm run build`. On failure: revert `content.ts` (`git checkout -- src/data/content.ts`), `H mark failed --reason "<first CHECK_FAIL line>"`, `H unlock`, stop. Watermarks and the draft cursor are untouched, so the next run retries.
10. **Branch.** `gh pr list --head 'profile-sync/' --state open --json headRefName,url` - if an open `profile-sync/*` PR exists, `git checkout <that branch>` and re-apply steps 8-9 on top of it; else `git checkout main && git pull --ff-only origin main && git checkout -b profile-sync/RUN_DATE` (re-apply 8-9 if the checkout changed `content.ts`).
11. **Commit and PR.** `git add src/data/content.ts resume linkedin public/resume.pdf && git commit -m "Profile sync: <n> receipts, <m> stack items (<from> - <to>)"`. `git push origin profile-sync/<branch>`. Body from `reference/pr-template.md`; `gh pr create --base main` or `gh pr edit <url> --body-file` when updating. The body never contains ids, links or names from the ledger - only anonymised text, grades and counts.
12. **Finish.** Write the dossier (claims, statuses, evidence ids, skipped sources, PR URL). `H advance-draft`. `H mark ok --pr <url>`. `H unlock`. Print the PR URL and the counts.

## Failures

| Failure | Do |
|---|---|
| `H run` skipped a source | Continue; list it under "Sources skipped" in the PR body and dossier. Its watermark did not move. |
| No A/B/C items | `nothing-new`; advance the draft cursor; no PR. |
| All claims rejected or needs-word in cron | `nothing-new`; still advance the cursor; keep the claims in the dossier. |
| `npm run check` or `build` fails | `failed`; revert `content.ts`; cursor untouched. |
| PDF or docx step prints `PDF_SKIPPED` / fails | Continue; note "PDF not regenerated" in the PR body. |
| Open PR branch conflicts with `content.ts` edits | `failed` with the conflicting section named; never force. |
| `LOCKED` | Exit 0 with "another run in progress". |

## --init (one time, interactive)

1. `H init-config` (writes `STATE/config.json` from the example if absent, `STATE/denylist.txt` from `reference/anonymise.md`, sets the draft cursor to 2026-07-18).
2. `H init-secrets` (stores `BITBUCKET_TOKEN` and `JIRA_API_TOKEN` from this shell into Keychain; both must be exported by `~/.zshrc`).
3. Confirm `REPO` is on `main` with the phase 1 PR merged (`git log --oneline -1` mentions profile sync or later). If not, stop and say so.
4. `H run` once as a smoke; every source must be present in `by_source`.
5. Backfill, interactive with progress: `H backfill` (HtH from 2023-06, Nmblr from 2024-03; CloudTrail is capped at 90 days by design). Report `by_source` counts and total ledger size. `H status` must show the draft cursor still at `2026-07-18T00:00:00Z`.
6. Offer the crontab line from the spec (section 11) and install it only when Benedict says yes.
```

- [ ] **Step 3: Check the skill loads and lints**

Run: `grep -c $'\xe2\x80\x94' ~/.claude/skills/profile-sync/SKILL.md ~/.claude/skills/profile-sync/reference/*.md` 
Expected: `0` for every file.

In a fresh Claude Code session type `/profile-sync --dry-run` and confirm the skill is listed and loads (it will run steps 1-6 against the live state dir created in Task 7; before Task 7 exists, it stops at `CONFIG_MISSING` - that is the expected result at this point).

---

### Task 7: `--init` on this machine, then backfill

**Files:**
- Creates: `~/.profile-sync/config.json`, `~/.profile-sync/denylist.txt`, Keychain items, `~/.profile-sync/ledger.jsonl` (backfilled), `~/.profile-sync/watermarks.json`

Prerequisite: the phase 1 PR is merged and `REPO` `main` is at or after it.

- [ ] **Step 1: Config, denylist, cursor**

```bash
python3 ~/.claude/skills/profile-sync/scripts/harvest.py init-config
cat ~/.profile-sync/watermarks.json
```
Expected: `wrote ~/.profile-sync/config.json`, `wrote ~/.profile-sync/denylist.txt (17 terms)`, `draft cursor set to 2026-07-18T00:00:00Z`.

- [ ] **Step 2: Keychain**

```bash
python3 ~/.claude/skills/profile-sync/scripts/harvest.py init-secrets
env -i HOME="$HOME" PATH=/usr/bin:/bin USER="$USER" python3 -c "import sys; sys.path.insert(0,'$HOME/.claude/skills/profile-sync/scripts'); import harvest; print('bb', bool(harvest.secret('b','BITBUCKET_TOKEN','profile-sync-bitbucket-token')), 'jira', bool(harvest.secret('j','JIRA_API_TOKEN','profile-sync-jira-token')))"
```
Expected: `stored profile-sync-bitbucket-token`, `stored profile-sync-jira-token`, then `bb True jira True` from the cron-like environment.

- [ ] **Step 3: Smoke run, then backfill**

```bash
python3 ~/.claude/skills/profile-sync/scripts/harvest.py run | jq '{new, skipped, sources: (.by_source | keys)}'
time python3 ~/.claude/skills/profile-sync/scripts/harvest.py backfill | jq '{new, skipped, by_source}'
python3 ~/.claude/skills/profile-sync/scripts/harvest.py status
jq -r '"\(.company) \(.grade)"' ~/.profile-sync/ledger.jsonl | sort | uniq -c
jq -r '.ts[:4]' ~/.profile-sync/ledger.jsonl | sort | uniq -c
```
Expected: smoke `skipped: {}` and all 10 sources listed; backfill completes in roughly 10-20 minutes with thousands of `git` items and hundreds of PRs for both companies; `status` shows `draft` still `2026-07-18T00:00:00Z`; year counts start at 2023 (hth) and 2024 (nmblr). A skipped source names the exact failing call - fix and re-run `backfill --source <name>`.

---

### Task 8: Dry run, first real run, crontab

- [ ] **Step 1: Dry run**

In Claude Code, from `REPO`: `/profile-sync --dry-run`.
Expected: the dossier at `~/.profile-sync/runs/<today>/dossier.md` lists harvested counts, the claims JSON with statuses, and skipped sources; nothing in `git status`. Benedict reads the dossier; if a claim names a client or overstates, note it and adjust the drafter prompt wording in SKILL.md before the real run.

- [ ] **Step 2: First real run (interactive)**

`/profile-sync` from `REPO`. Answer the `needs-word` questions. 
Expected: a PR `profile-sync/<today>` with anonymised claims; `npm run check` and `build` green; `~/.profile-sync/runs/<today>/status.json` = `ok` with the PR URL; `harvest.py status` shows the draft cursor advanced to the newest ledger ts. Benedict reviews and merges (or edits the branch).

- [ ] **Step 3: Cron-like rehearsal**

```bash
cd /Users/macbook-pro/projects/personal/bpabatao.github.io && env -i HOME="$HOME" PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin USER="$USER" /Users/macbook-pro/.local/bin/claude -p "/profile-sync --cron" --max-turns 40 --max-budget-usd 5 | tail -20
```
Expected: `nothing new since <cursor>` (the real run just consumed the delta) or a PR update; no permission prompts; exit 0.

- [ ] **Step 4: Install the crontab line (only after Benedict says yes)**

```bash
mkdir -p ~/.profile-sync/logs
( crontab -l 2>/dev/null; cat <<'EOF'
# profile-sync - weekly Monday 08:30 local, after the 08:13 KB job. Logs stamp start + exit so a silent death is visible.
30 8 * * 1 cd /Users/macbook-pro/projects/personal/bpabatao.github.io && { /bin/date -u +'===== start \%Y-\%m-\%dT\%H:\%M:\%SZ'; /Users/macbook-pro/.local/bin/claude -p "/profile-sync --cron" --max-turns 40 --max-budget-usd 5; echo "===== exit $?"; } >> /Users/macbook-pro/.profile-sync/logs/profile-sync.log 2>&1
EOF
) | crontab -
crontab -l | tail -3
```
Expected: the two existing lines (KB job) remain and the new job is listed.

- [ ] **Step 5: Record**

Print for the session summary: ledger size, backfill counts per company, the first PR URL, the cron line, and the follow-ups from spec section 14 (recruiter redesign, `--check-linkedin` spike, transcripts).
