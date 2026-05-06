import io
import re
import base64
import logging
from typing import Optional

import httpx
from PIL import Image

logger = logging.getLogger(__name__)

OCR_SPACE_URL = "https://api.ocr.space/parse/image"


def _compress(image_bytes: bytes) -> tuple:
    """Resize and compress image to under 1 MB (OCR.space free tier limit)."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    w, h = img.size
    if w > 1500:
        img = img.resize((1500, int(h * 1500 / w)), Image.LANCZOS)
    buf = io.BytesIO()
    quality = 85
    while True:
        buf.seek(0); buf.truncate()
        img.save(buf, format="JPEG", quality=quality)
        if buf.tell() <= 900_000 or quality <= 40:
            break
        quality -= 10
    return buf.getvalue(), "image/jpeg"


async def parse_screenshot(image_bytes: bytes, content_type: str = "image/jpeg") -> dict:
    from app.core.config import settings

    api_key = settings.OCR_SPACE_API_KEY or "helloworld"
    compressed, ct = _compress(image_bytes)
    b64 = base64.b64encode(compressed).decode()

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            OCR_SPACE_URL,
            data={
                "apikey": api_key,
                "language": "cht",
                "base64Image": f"data:{ct};base64,{b64}",
                "isOverlayRequired": "false",
                "OCREngine": "2",
                "scale": "true",
            },
        )

    result = resp.json()
    if result.get("IsErroredOnProcessing"):
        err = result.get("ErrorMessage") or result.get("ErrorDetails", "OCR failed")
        raise ValueError(str(err))

    text = "".join(
        p.get("ParsedText", "") for p in result.get("ParsedResults", [])
    )
    logger.info("OCR.space raw text: %s", text[:500])
    return _extract_fields(text)


def _extract_fields(text: str) -> dict:
    # 取件驗證碼：格式「取件驗證碼：592998」
    pickup_code: Optional[str] = None
    m = re.search(r'取件驗證碼[：:]\s*(\d{4,8})', text)
    if m:
        pickup_code = m.group(1)

    # 截止日期：格式「2026-05-05」或「2026/05/05」
    expires_at: Optional[str] = None
    m = re.search(r'(\d{4})[/-](\d{2})[/-](\d{2})', text)
    if m:
        expires_at = f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # 取貨門市：格式「至 蝦皮店到店 新店百忍店 取件」
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

    # 商品備註：抓含金額或數量的行
    note_parts = []
    for line in (l.strip() for l in text.splitlines() if l.strip()):
        if re.search(r'\$\d+|NT\$\d+|訂單金額', line):
            note_parts.append(line)
        elif re.search(r'x\d+', line) and len(line) > 3:
            note_parts.append(line)
    note = ' / '.join(note_parts) if note_parts else None

    return {
        "store_name": store_name,
        "pickup_code": pickup_code,
        "expires_at": expires_at,
        "note": note,
        "raw_text": text[:1000],
    }
