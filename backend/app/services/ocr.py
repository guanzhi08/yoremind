import io
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def parse_screenshot(image_bytes: bytes) -> dict:
    try:
        from PIL import Image
        import pytesseract
    except ImportError:
        raise RuntimeError("pytesseract/Pillow not installed")

    img = Image.open(io.BytesIO(image_bytes))

    # 放大圖片提升 OCR 準確度
    w, h = img.size
    if w < 1080:
        scale = 1080 / w
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    # 繁體中文 + 英文數字辨識
    text = pytesseract.image_to_string(img, lang="chi_tra+eng", config="--psm 4")
    logger.info("OCR raw text: %s", text[:500])

    # ── 取件驗證碼：格式「取件驗證碼：592998」 ──────────────────
    pickup_code: Optional[str] = None
    m = re.search(r'取件驗證碼[：:]\s*(\d{4,8})', text)
    if m:
        pickup_code = m.group(1)

    # ── 截止日期：格式「2026-05-05前」或「2026/05/05」 ──────────
    expires_at: Optional[str] = None
    m = re.search(r'(\d{4})[/-](\d{2})[/-](\d{2})', text)
    if m:
        expires_at = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # ── 取貨門市：格式「至 蝦皮店到店 新店百忍店 取件」 ──────────
    store_name: Optional[str] = None
    m = re.search(r'至\s*(.+?)\s*取件', text, re.DOTALL)
    if m:
        store_name = re.sub(r'\s+', ' ', m.group(1)).strip()
    if not store_name:
        for line in text.splitlines():
            line = line.strip()
            if '店到店' in line or ('蝦皮' in line and '店' in line):
                store_name = line
                break

    # ── 商品備註：商品名稱行 + 金額行 ───────────────────────────
    note: Optional[str] = None
    note_parts = []
    for line in (l.strip() for l in text.splitlines() if l.strip()):
        if re.search(r'\$\d+|NT\$\d+|訂單金額', line):
            note_parts.append(line)
        elif re.search(r'x\d+', line) and len(line) > 3:
            note_parts.append(line)
    if note_parts:
        note = ' / '.join(note_parts)

    return {
        "store_name": store_name,
        "pickup_code": pickup_code,
        "expires_at": expires_at,
        "note": note,
        "raw_text": text[:1000],
    }
