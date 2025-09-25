from dotenv import load_dotenv
import os, re, libsql_client

# .env: TURSO_HOST=akademi-...turso.io  (ŞEMA YOK)  |  TURSO_AUTH_TOKEN=...
load_dotenv(".env")
url   = f"https://{os.environ['TURSO_HOST'].strip()}"
token = os.environ["TURSO_AUTH_TOKEN"].strip()

def iter_statements(path):
    buf = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith("PRAGMA"):      # SQLite meta komutlarını atla
                continue
            if s in ("BEGIN TRANSACTION;", "COMMIT;"):
                continue
            if "sqlite_sequence" in s:               # sistem tablosu → atla
                continue
            buf.append(line)
            if s.endswith(";"):
                yield "".join(buf); buf = []
    if buf: yield "".join(buf)

dump_path = r"C:\Users\Adile\Desktop\dump.sql"   # dump dosyanın yolu

ok = fail = 0
with libsql_client.create_client_sync(url, auth_token=token) as c:
    for st in iter_statements(dump_path):
        try:
            c.execute(st)
            ok += 1
        except Exception as e:
            fail += 1
            print("SKIP:", e)
print(f"Tamamlandı. Başarılı: {ok}, Atl./Hata: {fail}")
