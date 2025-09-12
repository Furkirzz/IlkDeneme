# deneme_http.py
from dotenv import load_dotenv
import os, libsql_client

load_dotenv(r".\.env")
url   = f"https://{os.environ['TURSO_HOST'].strip()}"   # <— https
token = os.environ["TURSO_AUTH_TOKEN"].strip()

with libsql_client.create_client_sync(url, auth_token=token) as c:
    print("Ping:", c.execute("select 1 as one").rows)
