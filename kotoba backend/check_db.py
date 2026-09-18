#!/usr/bin/env python3
"""
check_db.py — diagnose your Supabase DATABASE_URL in ~2 seconds.

Run this LOCALLY instead of redeploying to Render to test a guess.

Usage:
    python check_db.py "postgresql://postgres.abc:pw@aws-0-region.pooler.supabase.com:6543/postgres"

or, if DATABASE_URL is already set in your shell:
    python check_db.py

It checks the URL's shape first (username format, port, stray brackets,
characters that need encoding), then actually tries to connect and tells
you plainly what came back.
"""

import asyncio
import os
import sys

try:
    from sqlalchemy.engine import make_url
except ImportError:
    sys.exit("Run this from your backend folder, with the venv active "
             "(needs sqlalchemy + asyncpg installed).")


NEEDS_ENCODING = set('@/#%?:[] ')


def main():
    raw = (sys.argv[1] if len(sys.argv) > 1 else os.environ.get("DATABASE_URL", "")).strip()
    raw = raw.strip('"').strip("'")

    if not raw:
        sys.exit("No URL given. Pass it as an argument or set DATABASE_URL.")

    print("=" * 62)
    print("SHAPE CHECK")
    print("=" * 62)

    converted = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    try:
        url = make_url(converted)
    except Exception as e:
        sys.exit(f"FAIL  URL does not parse at all: {e}")

    user = url.username or ""
    host = url.host or ""
    pw = url.password or ""

    print(f"  username : {user}")
    print(f"  host     : {host}")
    print(f"  port     : {url.port}")
    print(f"  database : {url.database}")
    print(f"  password : {'*' * len(pw)}  ({len(pw)} chars)")
    if url.query:
        print(f"  query    : {dict(url.query)}  (will be stripped)")
    print()

    problems = []

    # 0. Unencoded '@' or '#' in the password.
    #    This is the nastiest failure mode because it is SILENT: the URL
    #    parser splits on the wrong '@', the password gets truncated, and
    #    Postgres reports a plain "password authentication failed" — which
    #    sends you hunting for a wrong password when the password is fine
    #    and the URL is what's broken.
    after_scheme = converted.split("://", 1)[-1]
    if after_scheme.count("@") > 1:
        problems.append(
            f"The password appears to contain an unencoded '@'.\n"
            f"     Everything after the FIRST '@' was read as the host, so the\n"
            f"     password actually sent is just: {pw!r}\n"
            "     This shows up as 'password authentication failed' even though\n"
            "     the password is correct. Reset it to letters+numbers only."
        )
    if "#" in after_scheme.split("@")[0]:
        problems.append(
            "The password appears to contain a '#'. Some env-var loaders treat\n"
            "     '#' as the start of a comment and silently truncate the value.\n"
            "     Reset the password to letters+numbers only."
        )

    # 1. The placeholder
    if "YOUR-PASSWORD" in pw:
        problems.append(
            "Password is still the literal placeholder [YOUR-PASSWORD].\n"
            "     Replace it with your real database password."
        )

    # 2. Username vs connection type.
    #    Shared pooler (…pooler.supabase.com) needs  postgres.<project-ref>
    #    Direct connection (db.<ref>.supabase.co)  needs  postgres
    is_pooler = "pooler.supabase.com" in host
    is_direct = host.startswith("db.") and host.endswith(".supabase.co")

    if is_pooler and "." not in user:
        problems.append(
            f"Username is '{user}', but the shared pooler needs the project ref:\n"
            f"     postgres.<project-ref>   e.g.  postgres.nyjlgyptdaqcfaimfvdu\n"
            "     (You get this exact username in Supabase's Connect dialog.)"
        )
    if is_direct and "." in user:
        problems.append(
            f"Username is '{user}', but the DIRECT connection uses a bare 'postgres'."
        )

    # 3. Characters in the password that break URL parsing unless encoded
    bad = sorted(set(pw) & NEEDS_ENCODING)
    if bad:
        problems.append(
            f"Password contains characters that need URL-encoding: {' '.join(bad)}\n"
            "     Easiest fix: reset the password to letters+numbers only."
        )

    # 4. Whitespace that got copied in
    if pw != pw.strip() or user != user.strip():
        problems.append("There is leading/trailing whitespace in the credentials.")

    if problems:
        for p in problems:
            print(f"  [!]  {p}")
        print()
    else:
        print("  Shape looks correct.\n")

    print("=" * 62)
    print("CONNECTION TEST")
    print("=" * 62)
    asyncio.run(try_connect(url.set(query={})))


async def try_connect(url):
    import asyncpg
    try:
        conn = await asyncio.wait_for(
            asyncpg.connect(
                user=url.username,
                password=url.password,
                host=url.host,
                port=url.port,
                database=url.database,
                statement_cache_size=0,
            ),
            timeout=15,
        )
        version = await conn.fetchval("SELECT version()")
        await conn.close()
        print("  SUCCESS — connected.")
        print(f"  {version.split(',')[0]}")
        print("\n  This URL works. Put it in Render as DATABASE_URL.")
    except asyncio.TimeoutError:
        print("  TIMEOUT after 15s — could not reach the host.")
        print("  Check the host/port, or whether your network blocks outbound 6543.")
    except Exception as e:
        name = type(e).__name__
        print(f"  FAILED — {name}")
        print(f"  {e}")
        if "password authentication failed" in str(e).lower():
            print()
            print("  That means host+port+username were accepted but the")
            print("  password did not match. Two usual causes:")
            print("    1. The username is missing the .<project-ref> suffix")
            print("       (see the shape check above).")
            print("    2. The password is genuinely wrong — reset it at")
            print("       Supabase → Settings → Database → Reset database password.")


if __name__ == "__main__":
    main()
