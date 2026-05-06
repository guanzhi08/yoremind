# YoRemind

時間 + 地點觸發的提醒 App。進入地理圍欄範圍且符合時間條件時，透過 FCM 推播通知。

## 功能

- **地點提醒**：設定地點與時間範圍，抵達時推播
- **地點清單**：帶著清單去購物或辦事
- **取貨提醒**：記錄超商取貨碼，路過門市時提醒
- **蝦皮截圖自動填表**：上傳蝦皮取貨通知截圖，OCR 自動辨識取件驗證碼、門市、期限

## 技術架構

| 層級 | 技術 |
|------|------|
| 後端 | Python FastAPI + PostgreSQL + SQLAlchemy |
| 認證 | JWT (python-jose) + bcrypt |
| 推播 | Firebase Cloud Messaging |
| 地圖 | OpenStreetMap + Leaflet.js + Nominatim（免費，無需 API Key）|
| OCR | OCR.space API（免費，繁體中文支援）|
| 前端 | React 18 + Vite PWA |
| 部署 | Render.com（後端）+ 靜態托管（前端）|

---

## 本地開發

### 後端

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # 填入你的環境變數

# 資料庫 migration（SQLite 開發用，自動建立）
alembic upgrade head

# 啟動
uvicorn app.main:app --reload --port 8000
```

API 文件：http://localhost:8000/docs

### 前端

```bash
cd frontend
npm install

cp .env.example .env            # 填入 VITE_API_URL（無需 Map API Key）

npm run dev                     # http://localhost:5173
```

---

## 環境變數

### 後端 (`backend/.env`)

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串，例：`postgresql://user:pass@host/dbname`；本地開發可用 `sqlite:///./yoremind.db` |
| `SECRET_KEY` | JWT 簽名金鑰（建議 32 字元以上隨機字串） |
| `FIREBASE_CREDENTIALS_JSON` | Firebase service account JSON（單行字串） |
| `OCR_SPACE_API_KEY` | OCR.space API Key（選填，預設使用 demo key `helloworld`，建議申請免費正式 key） |

### 前端 (`frontend/.env`)

| 變數 | 說明 |
|------|------|
| `VITE_API_URL` | 後端 API base URL，例：`https://yoremind-api.onrender.com` |

---

## Render.com 部署

1. Fork 或 push 到 GitHub
2. Render Dashboard → **New** → **Blueprint**
3. 選擇此 repo，Render 會讀取 `backend/render.yaml` 自動建立：
   - Web Service：`yoremind-api`
   - PostgreSQL：`yoremind-db`
4. 在 Environment 頁面填入 `MAP8_API_KEY` 與 `FIREBASE_CREDENTIALS_JSON`
5. 部署完成後，將後端 URL 填入前端 `VITE_API_URL`

### 前端部署（Netlify / Vercel）

```bash
cd frontend
npm run build
# 將 dist/ 目錄部署到靜態托管服務
```

---

## API 端點

| Method | Path | 說明 |
|--------|------|------|
| POST | `/auth/register` | 註冊 |
| POST | `/auth/login` | 登入 |
| GET | `/tasks` | 取得所有任務 |
| POST | `/tasks` | 建立任務 |
| PATCH | `/tasks/{id}` | 更新任務 |
| DELETE | `/tasks/{id}` | 刪除任務 |
| POST | `/tasks/{id}/items` | 新增清單項目 |
| PATCH | `/tasks/{id}/items/{item_id}` | 更新清單項目（勾選）|
| GET | `/parcels` | 取得取貨提醒 |
| POST | `/parcels` | 建立取貨提醒 |
| POST | `/parcels/parse-screenshot` | 上傳截圖，OCR 辨識蝦皮取貨資訊 |
| POST | `/location/update` | 上傳 GPS 位置（觸發地理圍欄）|
| GET | `/nominatim/search` | 代理 Nominatim 地標搜尋 |
| GET | `/nominatim/reverse` | 代理 Nominatim 反向地理編碼 |
| GET | `/health` | 健康檢查 |

---

## 地理圍欄邏輯

`POST /location/update` 流程：

1. 更新 FCM token（若有提供）
2. 查詢該使用者所有 `is_active = true` 且有設定座標的任務
3. 用 Haversine 公式計算距離
4. 若距離 ≤ `radius_m`，且在 `time_start`–`time_end` 範圍內，且距上次觸發 > 30 分鐘
5. 呼叫 FCM 發送推播，更新 `last_triggered_at`
6. 同步檢查 `status = pending` 的取貨提醒（300m 內觸發）

---

## 蝦皮截圖 OCR 自動填表

### 功能說明

在「新增取貨提醒」頁面點擊「📷 上傳蝦皮截圖自動填表」，選取蝦皮 App 的取貨通知截圖，系統會自動辨識並填入以下欄位：

| 欄位 | 辨識來源 |
|------|---------|
| 取貨碼 | 「取件驗證碼：XXXXXX」 |
| 取件截止日期 | 「YYYY-MM-DD 前」|
| 取貨門市 | 「至 XXX 取件」|
| 商品備註 | 含金額或數量的商品描述行 |

### 技術實作

#### 流程

```
使用者選取截圖（<input type="file">）
    ↓
前端：FormData 送出 POST /parcels/parse-screenshot
    ↓
後端：Pillow 壓縮圖片至 900KB 以下（OCR.space 免費限制）
    ↓
後端：base64 編碼後呼叫 OCR.space API（繁體中文，Engine 2）
    ↓
後端：regex 從 OCR 文字提取結構化欄位
    ↓
前端：將解析結果自動填入表單（null 欄位不覆蓋已有值）
```

#### 後端：`backend/app/services/ocr.py`

```python
async def parse_screenshot(image_bytes: bytes, content_type: str) -> dict:
    # 1. 壓縮圖片
    compressed, ct = _compress(image_bytes)   # Pillow resize + JPEG 壓縮

    # 2. 呼叫 OCR.space API
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.ocr.space/parse/image",
            data={
                "apikey": settings.OCR_SPACE_API_KEY,
                "language": "cht",        # 繁體中文
                "base64Image": f"data:{ct};base64,{b64}",
                "OCREngine": "2",         # Engine 2 對中文較準確
                "scale": "true",          # 自動放大小圖
            },
        )

    # 3. 解析文字 → regex 提取欄位
    text = "".join(p["ParsedText"] for p in result["ParsedResults"])
    return _extract_fields(text)
```

#### Regex 提取規則

```python
# 取件驗證碼（4–8 位數字）
re.search(r'取件驗證碼[：:]\s*(\d{4,8})', text)

# 截止日期（YYYY-MM-DD 或 YYYY/MM/DD）
re.search(r'(\d{4})[/-](\d{2})[/-](\d{2})', text)

# 取貨門市（「至 ... 取件」之間的文字）
re.search(r'至\s*(.+?)\s*取件', text, re.DOTALL)

# 商品備註（含 $金額 或 x數量 的行）
re.search(r'\$\d+|NT\$\d+|訂單金額', line)
re.search(r'x\d+', line)
```

#### 前端：`frontend/src/pages/AddParcel.jsx`

```js
const handleScreenshot = async (e) => {
  const fd = new FormData();
  fd.append("image", e.target.files[0]);

  const { data } = await client.post("/parcels/parse-screenshot", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 20000,
  });

  // null 欄位不覆蓋使用者已手動填入的值
  setForm(f => ({
    ...f,
    store_name:  data.store_name  ?? f.store_name,
    pickup_code: data.pickup_code ?? f.pickup_code,
    expires_at:  data.expires_at  ? `${data.expires_at}T23:59` : f.expires_at,
  }));
  if (data.note) setNote(data.note);
};
```

### OCR.space API Key 申請

預設使用 demo key（`helloworld`），有嚴格的流量與圖片大小限制，僅適合測試。

生產環境建議：
1. 前往 [ocr.space/OCRAPI](https://ocr.space/OCRAPI) 免費註冊
2. 取得 API Key（免費方案 25,000 次/月）
3. 在 Render Dashboard 的 Environment 設定 `OCR_SPACE_API_KEY`

### 新增的資料庫欄位

本功能新增 `parcels.note` 欄位（VARCHAR，可為空），用於儲存商品描述。

```sql
-- alembic/versions/001_add_parcel_note.py
ALTER TABLE parcels ADD COLUMN note VARCHAR;
```

### 已知限制

| 限制 | 說明 |
|------|------|
| OCR 準確度 | 取決於截圖清晰度；OCR 失敗的欄位會留空，可手動補填 |
| 圖片大小 | 自動壓縮至 900KB，超大截圖品質會略降 |
| 截圖格式 | 僅支援 JPEG / PNG / WebP |
| Demo key 限制 | `helloworld` key 每次請求有大小與頻率限制，建議正式使用申請免費 key |
| 非蝦皮截圖 | 其他平台截圖辨識率不保證，欄位可能全為 null |


---

## 本地開發

### 後端

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # 填入你的環境變數

# 資料庫 migration（SQLite 開發用，自動建立）
alembic upgrade head

# 啟動
uvicorn app.main:app --reload --port 8000
```

API 文件：http://localhost:8000/docs

### 前端

```bash
cd frontend
npm install

cp .env.example .env            # 填入 VITE_API_URL（無需 Map API Key）

npm run dev                     # http://localhost:5173
```

---

## 環境變數

### 後端 (`backend/.env`)

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串，例：`postgresql://user:pass@host/dbname`；本地開發可用 `sqlite:///./yoremind.db` |
| `SECRET_KEY` | JWT 簽名金鑰（建議 32 字元以上隨機字串） |
| `FIREBASE_CREDENTIALS_JSON` | Firebase service account JSON（單行字串） |

### 前端 (`frontend/.env`)

| 變數 | 說明 |
|------|------|
| `VITE_API_URL` | 後端 API base URL，例：`https://yoremind-api.onrender.com` |

---

## Render.com 部署

1. Fork 或 push 到 GitHub
2. Render Dashboard → **New** → **Blueprint**
3. 選擇此 repo，Render 會讀取 `backend/render.yaml` 自動建立：
   - Web Service：`yoremind-api`
   - PostgreSQL：`yoremind-db`
4. 在 Environment 頁面填入 `MAP8_API_KEY` 與 `FIREBASE_CREDENTIALS_JSON`
5. 部署完成後，將後端 URL 填入前端 `VITE_API_URL`

### 前端部署（Netlify / Vercel）

```bash
cd frontend
npm run build
# 將 dist/ 目錄部署到靜態托管服務
```

---

## API 端點

| Method | Path | 說明 |
|--------|------|------|
| POST | `/auth/register` | 註冊 |
| POST | `/auth/login` | 登入 |
| GET | `/tasks` | 取得所有任務 |
| POST | `/tasks` | 建立任務 |
| PATCH | `/tasks/{id}` | 更新任務 |
| DELETE | `/tasks/{id}` | 刪除任務 |
| POST | `/tasks/{id}/items` | 新增清單項目 |
| PATCH | `/tasks/{id}/items/{item_id}` | 更新清單項目（勾選）|
| GET | `/parcels` | 取得取貨提醒 |
| POST | `/parcels` | 建立取貨提醒 |
| POST | `/location/update` | 上傳 GPS 位置（觸發地理圍欄）|
| GET | `/nominatim/search` | 代理 Nominatim 地標搜尋 |
| GET | `/nominatim/reverse` | 代理 Nominatim 反向地理編碼 |
| GET | `/health` | 健康檢查 |

---

## 地理圍欄邏輯

`POST /location/update` 流程：

1. 更新 FCM token（若有提供）
2. 查詢該使用者所有 `is_active = true` 且有設定座標的任務
3. 用 Haversine 公式計算距離
4. 若距離 ≤ `radius_m`，且在 `time_start`–`time_end` 範圍內，且距上次觸發 > 30 分鐘
5. 呼叫 FCM 發送推播，更新 `last_triggered_at`
6. 同步檢查 `status = pending` 的取貨提醒（300m 內觸發）
