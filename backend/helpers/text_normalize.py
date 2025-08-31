# helpers/text_normalize.py
import pandas as pd

TR_FIX_MAP = str.maketrans({
    "þ": "ş", "ð": "ğ", "ý": "ı",
    "Þ": "Ş", "Ð": "Ğ", "Ý": "İ",
})

def _strip_none(s):
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return None
    t = str(s).strip()
    return t or None

def fix_turkish_mojibake(s: str):
    s = _strip_none(s)
    if not s:
        return None
    # 1) En yaygın: UTF-8 veriyi Latin-1/1254 gibi okumaktan kaynaklı
    try:
        s1 = s.encode("latin1", errors="strict").decode("utf-8", errors="strict")
        s = s1
    except Exception:
        pass
    # 2) Harf haritası (þ, ð, ý …)
    s = s.translate(TR_FIX_MAP)
    return s or None

def normalize_series(sr: pd.Series) -> pd.Series:
    return sr.map(fix_turkish_mojibake)