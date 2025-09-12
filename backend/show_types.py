from dotenv import load_dotenv
import os, libsql_client
load_dotenv(".env")

URL   = f"https://{os.environ['TURSO_HOST'].strip()}"
TOKEN = os.environ["TURSO_AUTH_TOKEN"].strip()

tables = ["base_phone", "base_image", "CategoryImage", "CategoryText", "City", "District", "Phone"]
with libsql_client.create_client_sync(URL, auth_token=TOKEN) as c:
    for t in tables:
        # base.<Model> -> tablo adınız farklıysa düzenleyin (örn: base_address)
        print(f"== {t} ==")
        for row in c.execute(f"PRAGMA table_info('{t}')").rows:
            # cid, name, type, notnull, dflt, pk
            print(f"  {row[1]} : {row[2]}")
