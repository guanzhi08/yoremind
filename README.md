# YoRemind

時間 + 地點觸發的提醒 App。進入地理圍欄範圍且符合時間條件時，透過 FCM 推播通知。

## 功能

- **地點提醒**：設定地點與時間範圍，抵達時推播
- **地點清單**：帶著清單去購物或辦事
- **取貨提醒**：記錄超商取貨碼，路過門市時提醒

## 技術架構

| 層級 | 技術 |
|------|------|
| 後端 | Python FastAPI + PostgreSQL + SQLAlchemy |
| 認證 | JWT (python-jose) + bcrypt |
| 推播 | Firebase Cloud Messaging |
| 地圖 | OpenStreetMap + Leaflet.js + Nominatim（免費，無需 API Key）|
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
