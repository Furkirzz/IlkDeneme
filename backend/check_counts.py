from dotenv import load_dotenv
import os, libsql_client

load_dotenv(".env")
url   = f"https://{os.environ['TURSO_HOST'].strip()}"
token = os.environ["TURSO_AUTH_TOKEN"].strip()

system_like = ("sqlite_", "libsql_", "temp_")

with libsql_client.create_client_sync(url, auth_token=token) as c:
    tables = [r[0] for r in c.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).rows]
    print("Tablolar:", tables)
    print("\nSatır sayıları:")
    for t in tables:
        if t.startswith(system_like):  # sistem tablolarını geç
            continue
        try:
            cnt = c.execute(f"SELECT COUNT(*) FROM \"{t}\"").rows[0][0]
            print(f"- {t}: {cnt}")
        except Exception as e:
            print(f"- {t}: SAYIM HATASI → {e}")
