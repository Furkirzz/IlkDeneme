# deneme.py
import os
import asyncio
from dotenv import load_dotenv
from libsql_client import create_client

async def main():
    load_dotenv()  # .env'den LIBSQL_URL ve LIBSQL_AUTH_TOKEN'i yükler

    # Python için URL 'https://...' olmalı (libsql:// değil!)
    db = create_client(
        url=os.environ["LIBSQL_URL"],
        auth_token=os.environ["LIBSQL_AUTH_TOKEN"],
    )

    try:
        res = await db.execute("SELECT id, gun, Baslangic_saat, Bitis_saat, ders_kategori_id FROM base_dersprogrami;")
        # satırları yazdır
        print(res.rows)          # [{'now': '2025-09-01 21:35:42'}] gibi
        # veya:
        # for row in res:
        #     print(row)
    finally:
        # oturumu kapat (çok önemli!)
        await db.close()

if __name__ == "__main__":
    asyncio.run(main())
