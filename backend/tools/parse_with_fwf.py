# tools/parse_with_fwf.py
import pandas as pd
from pathlib import Path

# --- Sabit kolon aralıkları (start, end) ---
COLSPECS = [
    (0, 4),    # OKUL_KODU
    (10, 15),  # OGR_NO
    (15, 24),  # AD
    (24, 35),  # SOYAD
    (35, 38),  # SINIF (ilk iki index)
    (48, 49),  # CINSIYET (K/E)
    (49, 50),  # OTURUM (rakam)
    (50, 51),  # KITAPCIK (harf)
    (51, None) # CEVAPLAR (kalan)
]

# --- Kolon adları ---
NAMES = ["OKUL_KODU","OGR_NO","ADI","SOYAD","SINIF","CINSIYET","OTURUM","KITAPCIK","CEVAPLAR"]

# --- Türkçe karakter düzeltme haritası ---
TR_FIX_MAP = str.maketrans({
    "þ": "ş", "ð": "ğ", "ý": "ı",
    "Þ": "Ş", "Ð": "Ğ", "Ý": "İ",
})

def fix_turkish_mojibake(s: str):
    """
    Bozuk encoding (UTF-8'i Latin1/1254 gibi okuma) + birebir harf düzeltmesi
    """
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return None
    t = str(s).strip()
    if not t:
        return None

    # 1) UTF-8 -> Latin1 mojibake düzeltme denemesi
    try:
        t = t.encode("latin1", errors="strict").decode("utf-8", errors="strict")
    except Exception:
        pass

    # 2) Harf dönüşümü
    t = t.translate(TR_FIX_MAP)
    return t or None

def main():
    txt = Path("data/kirli.txt")

    # FWF (fixed-width file) oku
    df = pd.read_fwf(
        txt,
        colspecs=COLSPECS,
        names=NAMES,
        header=None,
        dtype=str,
        encoding="latin1"  # Dosya Latin1/Windows-1254 kirli geliyorsa bu uygundur
    )

    # Tüm kolonlarda temizlik + Türkçe düzeltme
    for c in NAMES:
        df[c] = df[c].map(fix_turkish_mojibake)

    # CEVAPLAR: boşlukları kaldır
    df["CEVAPLAR"] = df["CEVAPLAR"].map(lambda s: None if s is None else s.replace(" ", "*") or None)

    # CINSIYET: K/E -> Kız/Erkek
    map_cins = {"K": "Kız", "E": "Erkek"}
    df["CINSIYET_TEXT"] = df["CINSIYET"].map(lambda x: map_cins.get(x) if x else None)

    # CSV çıktısı
    out_csv = Path("data/parsed_fixed.csv")
    df.to_csv(out_csv, index=False, encoding="utf-8")
    print(f"OK -> {out_csv} (rows={len(df)})")

if __name__ == "__main__":
    main()