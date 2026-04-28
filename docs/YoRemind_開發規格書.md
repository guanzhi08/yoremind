__LocaRemind__

基於時間與位置資訊的提醒工具

__手機 App 開發規格書__

Mobile Application Specification

版本 Version 1\.0

文件日期：2026 年 4 月

機密文件 — 僅限內部使用

# __目錄__

# __一、產品概述與目標__

## __1\.1 產品簡介__

LocaRemind 是一款結合「時間」與「地理位置」的智慧提醒應用程式，專為需要在特定場合、特定時段完成任務的使用者設計。不同於傳統純時間提醒工具，LocaRemind 僅在使用者身處正確地點且時間符合設定區間時才觸發提醒，有效降低無關場景下的干擾通知，提升提醒的實用性與精準度。

## __1\.2 核心價值主張__

- 精準觸發：位置 \+ 時間雙重條件，避免不在場景下的無效通知
- 場景化任務：支援「提醒」與「代辦清單」兩種任務類型，對應不同使用情境
- 智慧學習：代辦清單未完成時主動詢問是否調整，累積使用習慣
- 低電量友好：採用地理圍欄（Geofence）而非持續 GPS 輪詢，最小化電池消耗

## __1\.3 目標使用者__

__使用者族群__

__典型場景__

__痛點解決__

__上班族__

在公司附近才提醒開會前準備事項

減少通勤路上的無用通知

__家庭主婦／主夫__

到超市時提醒採購清單

忘記購物清單的問題

__學生__

到圖書館才提醒需查閱的資料

位置相關的學習任務管理

__旅行者__

到達景點時提醒需要做的事情

異地陌生環境下的任務提示

## __1\.4 商業目標__

1. MVP 版本（3 個月內）：完成核心提醒 \+ 代辦清單功能，iOS 與 Android 雙平台上線
2. 成長期（6 個月）：DAU 達 10,000，使用者平均每週建立 3 個以上任務
3. 變現期（12 個月）：導入 Premium 訂閱（進階地點管理、更多地理圍欄數量、雲端同步）

# __一（續）、三大核心流程框架__

LocaRemind 的所有功能圍繞「擷取 → 紀錄 → 提醒」三大核心流程展開。每一筆任務都從某種形式的擷取開始，經過使用者確認與紀錄，最終在正確的時間與地點觸發提醒。此框架是產品功能設計與開發優先順序的根本依據。

__三大核心流程總覽__

  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐

  │  1\. 擷取 Capture │ ──► │  2\. 紀錄 Record  │ ──► │  3\. 提醒 Remind  │

  │                  │     │                  │     │                  │

  │  主動 ／ 被動    │     │  確認時間地點內容│     │  位置 \+ 時間觸發 │

  │  多元輸入管道    │     │  結構化儲存任務  │     │  路徑規劃 / 建議 │

  └──────────────────┘     └──────────────────┘     └──────────────────┘

## __1\.5\.1 擷取（Capture）__

擷取是任務生命週期的起點，負責從各種來源收集「需要被提醒的資訊」，分為使用者主動提供與被動接收兩種模式。

### __主動擷取（由使用者提供）__

__擷取管道__

__說明與應用場景__

__螢幕截圖分析__

使用者上傳蝦皮通知、超商簡訊、會議邀請截圖等，系統以 OCR（Cloud Vision API）分析圖片文字，自動辨識任務相關資訊（地點、時間、代碼），顯示預覽後引導進入紀錄流程。

__會議內容__

使用者輸入或貼上會議資訊（標題、時間、地點、待確認事項），系統解析後自動建立「提醒」或「代辦清單」任務，並以會議地點作為地理圍欄座標。

__語音紀錄__

使用者以語音輸入待辦事項（例如：「下次去全家要記得取貨」），系統轉換為文字後，結合自然語言解析（NLP）辨識關鍵資訊（地點名稱、時間詞、任務動作），引導進入確認流程。

__網頁內容__

透過瀏覽器分享功能（Share Sheet）或 PWA 的 Web Share Target API，使用者可將網頁（如餐廳介紹、Google Maps 地點、活動頁面）直接分享至 LocaRemind，系統擷取頁面標題、地址資訊，自動預填地點欄位。

### __被動擷取__

__擷取來源__

__說明與應用場景__

__由其他人指定任務__

指派功能（Phase 2）：任務建立者將提醒或代辦清單指派給其他使用者。被指派者不需主動建立任務，系統自動將指派任務推送至其擷取佇列，等待確認進入紀錄流程。被動擷取降低了任務建立的摩擦，適用於家庭分工、團隊協作等場景。

## __1\.5\.2 紀錄（Record）__

紀錄是擷取與提醒之間的關鍵確認步驟。無論資訊來源為何，任務正式儲存前系統都會主動引導使用者確認三個核心維度，確保提醒在正確的場景下觸發。

紀錄流程採「新增前主動確認」設計原則：系統不允許跳過任何核心欄位直接儲存，以保證每一筆任務的觸發精準度。

__確認維度__

__必填 / 選填__

__說明__

__⏰  時間__

必填（單點時間 或 時間區間）

使用者確認觸發時間：可設為單一時間點（如 14:30）或時間區間（如 09:00–11:00）。時間區間內只要進入地理圍欄即觸發，時間點則在到達時間且身處圍欄內才觸發。亦可設定重複規則（每日 / 每週 / 指定日期）。

__📍  地點__

必填（地標搜尋 或 地圖點選）

使用者確認觸發地點：透過 Map8 地標搜尋快速定位，或在地圖上手動拖拉定位針精準設定。同時設定地理圍欄半徑（預設 200 公尺，可調整 50–1000 公尺）。螢幕截圖 / 網頁內容擷取的地點會自動預填，使用者僅需確認或修正。

__📝  內容__

必填（標題）；選填（描述、子項目）

使用者確認任務內容：包含任務標題（必填，最多 50 字）、描述（選填）。若任務類型為代辦清單，需確認所有子項目；子項目可由擷取來源自動帶入，使用者可新增、刪除或編輯。

__紀錄設計原則__

• 擷取自動帶入的欄位以高亮色標示，提示使用者「此欄位由系統辨識，請確認是否正確」

• 三個維度必須全部確認才能完成紀錄，系統不允許以「稍後補填」方式儲存不完整任務

• 確認介面支援一頁完成（Bottom Sheet 展開式），減少頁面跳轉的認知負擔

• 每次確認動作都記錄使用者修正次數，供後續 AI 推薦優化參考（Phase 2）

## __1\.5\.3 提醒（Remind）__

提醒是三大流程的最終輸出。系統在使用者最需要的場景下，以最低干擾的方式呈現已紀錄的任務，並提供場景感知的延伸服務。

### __時間地點符合提醒__

當使用者同時滿足「進入地理圍欄」與「時間在有效區間內」兩個條件，系統透過 FCM 推播觸發提醒通知（詳見第六章觸發邏輯）。提醒依任務類型呈現不同互動介面：

- 提醒類型：展開式通知，含「知道了」與「查看詳情」動作按鈕
- 代辦清單類型：可直接在通知介面勾選子項目，全部完成後自動關閉
- 取貨提醒類型：通知含一鍵複製取貨代碼與「已取貨」確認按鈕

### __出門前多地點路徑規劃__

使用者當日有多個待辦任務分布在不同地點時，系統於每日設定時間（預設 08:00）推送「今日任務路徑建議」通知，協助使用者在出門前規劃最佳拜訪順序：

- 依任務的時間限制（最晚需到達時間）與目前位置，計算建議拜訪順序
- 以地圖介面顯示多點路徑，標示每個任務地點與預計抵達時間
- 使用者可調整順序或略過某個地點，系統自動重新計算
- 整合 Map8 路徑規劃 API，估算各段行駛時間（步行 / 騎車 / 開車）

此功能針對有多個地點型任務的使用者提供主動規劃服務，從被動的「靠近才提醒」升級為主動的「出發前規劃」。（Phase 2）

### __附近喜愛點建議__

當使用者在某地點完成任務（或靠近任務地點等待中），系統分析其歷史任務地點偏好與當前位置，主動建議附近可能感興趣的地點或待辦事項：

- 若附近有其他未完成任務且時間允許，推送「順路提醒」：「你附近 300 公尺有一筆待辦：取貨（全家信義店）」
- 若使用者曾在某類地點（例如超市）建立過多筆任務，且附近有同類地點，提示「你常在這類地點新增任務，是否要建立新提醒？」
- 建議以非侵入式方式呈現（App 內 Banner，而非推播），避免過度打擾
- 使用者可在設定中關閉此功能，或設定建議的最小距離門檻

附近喜愛點建議基於裝置端本地資料分析（不上傳地點偏好至伺服器），符合隱私優先原則。（Phase 2）

# __二、使用者故事（User Stories）__

## __2\.1 任務管理__

US\-01　身為使用者，我希望能新增一個「提醒」任務，並設定地點與時間，以便在正確時間與地點收到通知。

US\-02　身為使用者，我希望能新增一個「代辦清單」任務，加入多個子項目，以便在目標地點逐一確認完成。

US\-03　身為使用者，我希望可以查看所有已建立的任務清單，並能快速篩選「未完成」、「今日」等狀態。

US\-04　身為使用者，我希望能編輯或刪除已建立的任務，維持任務列表整潔。

## __2\.2 地點設定__

US\-05　身為使用者，我希望可以輸入地標關鍵字搜尋地點，系統自動顯示建議清單。

US\-06　身為使用者，我希望在選擇地點後，能在地圖上拖拉標記進行精準定位，並設定觸發半徑。

US\-07　身為使用者，我希望能將常用地點儲存為「我的地點」（例如：家、公司、超市），方便下次快速選取。

## __2\.3 時間設定__

US\-08　身為使用者，我希望既可設定單一時間點，也可設定一段時間區間（例如 9:00–11:00）作為有效提醒時段。

US\-09　身為使用者，我希望能設定任務的有效日期範圍（一次性 / 每日重複 / 指定星期）。

## __2\.4 通知與互動__

US\-10　身為使用者，當我靠近目標地點且時間符合設定時，我希望收到清楚的推播通知。

US\-11　身為使用者，收到代辦清單通知後，我希望能直接在通知介面展開並勾選清單項目。

US\-12　身為使用者，若我離開地點或超出時間區間而代辦清單未全數完成，我希望 App 詢問我是否調整提醒設定，以便下次再提醒。

US\-13　身為使用者，我希望能設定靜音時段，以避免在不適當的時間（例如深夜）收到通知。

## __2\.5 系統與隱私__

US\-14　身為使用者，我希望 App 在背景執行時不會明顯消耗電池，確保日常使用體驗不受影響。

US\-15　身為使用者，我希望我的位置資料不會在未告知的情況下傳送至伺服器，確保隱私安全。

## __2\.6 任務指派（Assignment）__

US\-16　身為使用者（指派者），我希望能將一個「提醒」或「代辦清單」任務指派給其他已註冊的使用者（透過帳號搜尋），或產生邀請連結讓對方加入，使被指派者在符合時間與地點條件時同樣觸發提醒。

US\-17　身為被指派者，我希望收到任務邀請後，能在 App 中預覽任務內容（名稱、地點、時間、清單項目）並選擇接受或拒絕，以確保我知悉並同意接收此提醒。

US\-18　身為使用者（指派者），當被指派者完成任務（確認提醒或勾選完所有清單項目）後，我希望能收到「已完成」推播通知，以便即時掌握任務執行狀態。

US\-19　身為使用者（指派者），若被指派者因離開地點或超出時間而未完成任務，我希望能選擇是否接收「未完成」通知，並決定是否替被指派者重新安排提醒。

US\-20　身為使用者，我希望能在任務詳情頁查看所有被指派者的進度狀態（待接受、進行中、已完成、未完成），以便統一追蹤多人任務。

## __2\.7 電商包裹取貨提醒__

US\-21　身為使用者，當我有包裹在超商等待取件時，我希望能快速新增一筆「取貨提醒」，輸入門市與到期日後，App 在我靠近該超商時跳出提醒，避免包裹逾期退回。

US\-22　身為使用者，我希望可以直接上傳蝦皮通知截圖或超商簡訊截圖，讓 App 自動辨識並帶入取貨代碼、門市名稱、到期日與手機號碼，減少手動輸入錯誤。

US\-23　身為使用者，當包裹到期日只剩 1 天或當天時，我希望不管我身在何處都能收到一則倒數提醒推播，確保我不會忘記取件。

# __三、功能規格__

## __3\.1 主要畫面架構__

__App 導航結構（Tab Bar）__

📋  首頁（Home）－ 任務總覽、快速新增入口

🗺️  地圖（Map）－ 任務地點視覺化概覽

➕  新增（Add）－ 建立新任務的主入口（中央浮動按鈕）

📍  我的地點（Places）－ 常用地點管理

⚙️  設定（Settings）－ 通知偏好、隱私、帳號

## __3\.2 新增任務流程（Step by Step）__

### __步驟一：選擇任務類型__

使用者點擊「＋」按鈕後，顯示 Bottom Sheet，包含：

- 提醒（Reminder）：觸發後跳出一則通知訊息
- 代辦清單（Checklist）：觸發後展開可勾選的項目列表

### __步驟二：填寫任務基本資訊__

進入任務編輯頁面，包含以下欄位：

__欄位__

__類型__

__說明__

__任務名稱__

文字輸入

最多 50 字元，必填

__任務描述__

文字輸入

選填，最多 200 字元

__任務類型__

選擇器

提醒 / 代辦清單

__清單項目__

動態列表

僅代辦清單類型顯示，可新增／刪除子項目

### __步驟三：設定時間__

使用者可選擇以下兩種模式之一：

- __單一時間點：__例如「14:30」，代表 14:30 開始的 15 分鐘視窗為有效觸發時段
- __時間區間：__例如「09:00 – 11:00」，整個區間內均為有效觸發時段

此外，使用者可設定重複規則：

- 僅一次（預設）
- 每日
- 指定星期（週一至週日多選）
- 自訂日期範圍

### __步驟四：設定地點__

地點設定分為兩個子步驟：

1. __關鍵字搜尋：__使用者在搜尋框輸入地標名稱（例如「台北101」），系統呼叫地圖 API 顯示建議清單
2. __精準定位：__選擇建議地點後進入地圖畫面，使用者可拖拉「定位針」調整確切座標，並以滑桿設定觸發半徑（預設 200 公尺，範圍 50–1000 公尺）

### __步驟五：確認與儲存__

顯示任務摘要卡，包含名稱、類型、時間、地點地圖縮圖及半徑，使用者確認後儲存。系統在背景建立地理圍欄並設定通知排程。

## __3\.3 首頁（Home）設計__

- 頂部顯示「今日活躍任務」橫向捲動卡片（即今日時間內且有任務的地點）
- 主列表顯示所有任務，可按「類型」、「狀態」、「地點」篩選
- 任務卡片顯示：名稱、地點縮圖、下次觸發時間、完成進度（代辦清單類型顯示 x/n）
- 長壓任務卡片可進行快速編輯、停用、刪除操作

## __3\.4 通知互動介面__

### __提醒類型通知__

採用 iOS Rich Notification / Android Expandable Notification，包含：

- App 圖示、任務名稱、地點資訊
- 動作按鈕：「知道了」（關閉）、「查看詳情」（開啟 App 任務頁）

### __代辦清單類型通知__

展開通知後顯示可互動的清單：

- 每個項目旁顯示勾選框（使用通知 Action Button 模擬）
- 完成所有項目時，通知自動收起並顯示「全部完成！」
- 使用者亦可點擊通知進入 App 內的完整 Checklist 介面

### __未完成離開提示__

當偵測到使用者離開地理圍欄或超出時間區間，且代辦清單仍有未勾選項目時，顯示一則後續通知：

__未完成提示通知範例__

您已離開「家樂福信義店」，但「週末採購清單」尚有 3 項未完成。

\[調整提醒\]  \[忽略\]  \[查看清單\]

## __3\.5 任務指派流程__

### __步驟一：建立任務後選擇指派__

在任務摘要確認頁面，使用者可點擊「指派給他人」按鈕，進入指派設定畫面。

- 搜尋欄：輸入被指派者的 App 帳號（電子郵件或使用者名稱），即時顯示搜尋建議
- 邀請連結：若對方尚未加入 App，可產生一次性邀請連結，透過任意通訊工具傳送
- 批量指派：可同時新增多名被指派者（免費版上限 3 人，Premium 無限制）
- 通知偏好：指派者可設定是否接收「未完成」通知（預設開啟「已完成」通知）

### __步驟二：被指派者收到邀請__

被指派者收到 FCM 推播通知（標題：「\[指派者名稱\] 傳送了一項任務給你」），點擊後進入任務預覽頁：

__預覽資訊__

__說明__

任務名稱與描述

顯示指派者建立的原始內容

地點地圖縮圖

顯示目標地點與觸發半徑圈

時間設定

顯示有效時間區間與重複規則

清單項目

若為代辦清單類型，顯示所有子項目（唯讀預覽）

被指派者可選擇：

- \[接受\]：系統在其裝置上建立對應的地理圍欄監控，任務出現在其首頁列表中
- \[拒絕\]：指派者收到「對方拒絕接受」推播通知，可選擇重新指派或取消

### __步驟三：觸發與完成回報__

被指派者進入地理圍欄且時間符合後，其裝置觸發本地通知（與一般任務相同）。完成後：

- 提醒類型：被指派者點擊「已確認」，App 透過 FCM 呼叫後端 API 通知指派者
- 代辦清單：所有項目勾選完成後，後端廣播「已完成」事件，指派者收到推播通知
- 未完成離開：被指派者離開圍欄未完成時，若指派者開啟「未完成通知」，同樣收到推播

### __指派進度追蹤頁__

指派者可在任務詳情頁的「指派總覽」分頁查看所有被指派者的狀態矩陣：

__被指派者__

__邀請狀態__

__觸發狀態__

__完成狀態__

王小明

已接受

已觸發（14:32）

✅ 已完成

李美玲

已接受

未觸發

— 等待中

陳大偉

待接受

—

— 未接受邀請

## __3\.6 取貨提醒輸入流程__

使用者點擊「＋」→ 選擇「取貨提醒（Parcel Pickup）」類型，進入輸入頁面，可選擇以下兩種方式建立：

### __方式一：手動輸入__

__欄位__

__類型__

__說明__

__手機號碼__

數字輸入

取件用手機號碼，選填（部分超商需要）

__取貨代碼 / 條碼__

文字輸入

必填；支援鍵盤手動輸入或相機掃描條碼

__門市名稱__

Map8 搜尋

輸入關鍵字後由 Map8 Places API 顯示建議（例如「全家信義店」），選定後自動帶入座標

__到期日期__

日期選擇器

必填；App 自動推算距今剩餘天數

__備註__

文字輸入

選填，例如：蝦皮訂單編號、品項描述

### __方式二：截圖自動辨識（OCR）__

使用者點擊「上傳截圖辨識」按鈕，選擇相簿圖片或即時拍照，App 在裝置端（離線）執行 OCR 分析後，自動填入可辨識的欄位。

1. __上傳截圖：__選擇手機相簿中的蝦皮通知截圖、超商簡訊、或電子郵件截圖
2. __OCR 辨識：__使用 Google ML Kit Text Recognition（離線可用）分析圖片文字，以正規表達式比對取貨代碼（數字串）、門市關鍵字、到期日格式（如「2026/05/01」或「5月1日前取貨」）、手機號碼
3. __預覽確認：__辨識結果以高亮色標示填入各欄位，使用者可逐欄手動修正；未能辨識的欄位顯示空白等待補填
4. __門市定位：__辨識到門市名稱後自動呼叫 Map8 Places API 進行地點驗證與座標取得，若多筆符合則顯示清單供使用者選擇
5. __儲存任務：__確認後儲存，系統建立地理圍欄並設定到期倒數推播

__OCR 辨識支援格式（範例）__

蝦皮店到店通知：「取件編號 AB12345678，請於 2026/05/01 前至 全家信義文昌店 取貨」

超商簡訊：「您有包裹，取件號碼：Z9876543210，門市：7\-ELEVEN 大安復興店，期限：05/02」

無法辨識時（例如圖片模糊）：提示使用者「辨識失敗，請手動輸入」並切換至方式一

### __取貨提醒首頁卡片__

取貨提醒在首頁以獨立區塊「待取件包裹」呈現，以剩餘天數排序（最緊急在前）：

- 卡片顯示：門市名稱與地圖縮圖、取貨代碼（部分遮蔽保護隱私，例如 AB1234\*\*\*\*）、到期日與剩餘天數標籤（紅色 = 今日 / 明日到期）
- 快速動作：長壓卡片可「查看完整代碼」、「複製取貨代碼」、「標記已取貨」
- 已取貨後任務移至「已完成」分類，可供歷史查詢

# __四、技術架構建議（雲端優先、地端極簡）__

本專案採用「雲端優先（Cloud\-First）、地端極簡（Thin Client）」設計原則：地端（手機 / PC 瀏覽器）僅負責 UI 呈現、GPS 座標回報與推播接收，所有業務邏輯（地理圍欄判斷、OCR 辨識、任務排程、指派通知）均集中在後端雲端執行。此架構讓同一套程式碼庫可同時支援 iOS、Android 與 PC 三個平台，大幅降低跨平台開發與維護成本。

## __4\.1 雲端優先架構圖__

__系統架構概覽（Cloud\-First）__

┌──────────────────────────────────────────────────────────────┐

│                     Thin Clients（地端）                     │

│                                                              │

│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │

│  │  iOS Safari     │  │ Android Chrome  │  │ PC Browser │  │

│  │  \(PWA \+ 殼\)     │  │  \(PWA \+ 殼\)     │  │   \(PWA\)    │  │

│  │  ─ UI 呈現      │  │  ─ UI 呈現      │  │  ─ UI 呈現 │  │

│  │  ─ GPS 回報     │  │  ─ GPS 回報     │  │  ─ GPS 回報│  │

│  │  ─ FCM 接收     │  │  ─ FCM 接收     │  │  ─ FCM 接收│  │

│  └────────┬────────┘  └────────┬────────┘  └─────┬──────┘  │

└───────────┼────────────────────┼─────────────────┼─────────┘

            │ HTTPS REST API      │                 │

            │ GPS 座標上傳（每 5 分鐘）              │

            └────────────────────┴─────────────────┘

                                 │

                                 ▼

┌──────────────────────────────────────────────────────────────┐

│                  Backend（Render\.com Free）                  │

│                                                              │

│  ┌────────────────┐  ┌──────────────────┐  ┌────────────┐  │

│  │  REST API      │  │  Geofence Engine  │  │  Cron Jobs │  │

│  │  Node\.js /     │  │  ─ 接收 GPS 座標  │  │  ─ 到期倒數│  │

│  │  FastAPI       │  │  ─ 計算是否進圍欄  │  │  ─ 逾期掃描│  │

│  │                │  │  ─ 觸發 FCM 推播   │  └────────────┘  │

│  └────────────────┘  └──────────────────┘                   │

│                                                              │

│  ┌──────────────────────────────────────────────────────┐   │

│  │  PostgreSQL（Render Free）                            │   │

│  │  Users / Tasks / Assignments / Parcels / TriggerLog  │   │

│  └──────────────────────────────────────────────────────┘   │

└─────────────────────────────┬────────────────────────────────┘

                              │

           ┌──────────────────┼───────────────────┐

           ▼                  ▼                   ▼

  ┌──────────────┐  ┌──────────────────┐  ┌───────────────┐

  │  FCM（免費） │  │  Map8 API（免費）│  │ Cloud Vision  │

  │  Android/iOS │  │  地標搜尋/地圖   │  │ OCR API（免費 │

  │  /PC Chrome  │  │  JS SDK          │  │ 1000次/月）   │

  └──────────────┘  └──────────────────┘  └───────────────┘

## __4\.2 前端框架：PWA 為主 \+ 原生殼輔助__

前端採用 React（或 Next\.js）開發 Progressive Web App（PWA），單一程式碼庫同時支援三個平台。iOS 和 Android 額外以 Capacitor（或 React Native WebView）包成原生殼，取得背景 GPS 與推播的原生權限；PC 版直接以瀏覽器開啟，使用標準 Web Geolocation API。

__PWA（純瀏覽器）__

__PWA \+ 原生殼（Capacitor）__

__程式碼庫__

單一（React）

單一（React）\+ 少量原生橋接層

__平台支援__

iOS Safari / Android Chrome / PC

iOS App / Android App \+ PC（仍用 PWA）

__背景 GPS__

受瀏覽器限制（iOS Safari 不支援，Android 受限）

完整支援（原生 Core Location / Fused Location）

__推播通知__

Android Chrome 支援；iOS 需 iOS 16\.4\+ 且加入主畫面

完整支援（FCM \+ APNs）

__App Store 上架__

不需要

需要（iOS App Store / Google Play）

__開發複雜度__

低

中（需設定 Capacitor 插件與原生專案）

__MVP 建議策略__

第一階段（MVP）：純 PWA，先驗證產品核心價值，PC / Android Chrome 可完整體驗；

              iOS 使用者需將網頁加入主畫面（Add to Home Screen）才能接收推播。

第二階段：加入 Capacitor 原生殼，上架 iOS App Store 與 Google Play，

          解鎖背景 GPS 與完整推播支援。

## __4\.3 地圖：Map8 JavaScript SDK__

地圖顯示與地標搜尋統一使用 Map8 JavaScript SDK，在 PWA 內以 Web 元件嵌入，不需要任何原生橋接，PC、iOS Safari、Android Chrome 皆可正常渲染。

__Map8 功能模組__

__用途說明__

__Map8 JS SDK（地圖顯示）__

在 PWA 內嵌入互動式地圖，供使用者拖拉定位針、查看地理圍欄範圍；PC / 手機瀏覽器皆相容

__Map8 Places Search API__

地標關鍵字搜尋與自動完成建議，後端呼叫後回傳前端顯示（避免前端暴露 API Key）

__Map8 Geocoding API__

後端呼叫，將座標轉換為可讀地址，存入 Task / Parcel 的 storeAddress 欄位

__Map8 Static Maps API__

後端產生任務卡片地圖縮圖 URL，前端直接顯示 <img>，無需在地端渲染地圖元件

__Map8 免費方案說明__

• 免費方案提供一定額度的 API 呼叫次數（以 Map8 官方最新公告為準，網址：https://map8\.zone）

• 後端呼叫 Places / Geocoding API 時加入快取層（Redis 或 PostgreSQL 快取表），

  相同關鍵字結果快取 24 小時，有效降低 API 呼叫頻率

• 前端地圖顯示（JS SDK）另計免費圖磚配額，與後端 API 配額分開計算

## __4\.4 雲端地理圍欄引擎（Server\-side Geofencing）__

本架構將地理圍欄判斷從裝置端移至後端，地端只負責定期上傳 GPS 座標，由 Geofence Engine 統一計算進出圍欄事件，再透過 FCM 觸發推播。

### __座標上傳機制__

__設計項目__

__說明__

__上傳頻率__

前景模式：每 2 分鐘；背景模式（原生殼）：每 5 分鐘；PWA 背景：依瀏覽器 Background Sync API 或使用者重新開啟時觸發

__GPS 精度__

使用 Web Geolocation API 的 enableHighAccuracy: true（手機 GPS）；PC 瀏覽器使用 IP 定位（精度低，僅供輔助）

__API 端點__

POST /api/location  \{ lat, lng, accuracy, timestamp \}；每次上傳後端立即比對使用者所有 ACTIVE 任務

__進入圍欄判斷__

haversine\(userLat, userLng, taskLat, taskLng\) ≤ task\.radius

__離開圍欄判斷__

距離 > task\.radius × 1\.2（20% 緩衝帶，防抖動）；連續 2 次座標上傳均超出才確認離開

__觸發後推播__

後端呼叫 FCM Admin SDK 發送推播至該使用者所有已註冊裝置（含 iOS / Android / PC Chrome）

### __電量與精度取捨__

雲端地理圍欄以「座標輪詢」取代「系統原生圍欄」，對電量有一定影響，需針對各平台制定策略：

__情境__

__策略__

__預估額外電耗__

iOS（原生殼）

Capacitor Background Geolocation 插件；每 5 分鐘上傳；使用 Significant\-change location service 輔助

~2–4% / 24h

Android（原生殼）

Fused Location Provider（PRIORITY\_BALANCED\_POWER\_ACCURACY）\+ WorkManager 排程

~1–3% / 24h

PWA 前景模式

Geolocation watchPosition \+ throttle 每 2 分鐘上傳一次

~3–5% / h（螢幕常亮）

PWA 背景（Android）

Background Sync API / Periodic Background Sync（需使用者授權）

~0\.5–1% / 24h

PC 瀏覽器

僅前景模式輪詢，瀏覽器關閉後不上傳；靠近辦公室 / 常駐地點的任務最適合 PC 使用情境

可忽略（桌機接電）

__省電模式（使用者可開啟）__

• 開啟省電模式後，上傳頻率降為每 15 分鐘一次

• 任務地理圍欄半徑自動擴大 50%（精度降低、但電量消耗顯著下降）

• 觸發延遲從 ≤5 分鐘增加至 ≤15 分鐘

## __4\.5 推播通知：FCM 統一推送（Android / iOS / PC）__

所有推播均由後端呼叫 Firebase Cloud Messaging Admin SDK 發送，地端不需自行判斷觸發條件。FCM 免費且無訊息數量上限，同時支援三個平台。

__通知類型__

__觸發來源__

__說明__

進入地理圍欄

後端 Geofence Engine

座標上傳 → 後端判斷進入圍欄 → FCM 推播提醒

任務指派邀請

後端 API

指派者送出後，後端 FCM 通知被指派者

指派完成 / 未完成回報

後端 API

被指派者完成後，後端廣播給指派者

取貨到期倒數

後端 Cron Job

D\-1 / D\-0 由 Cron 掃描排程，呼叫 FCM 推播

取貨包裹逾期

後端 Cron Job

逾期後更新 Parcel\.status = EXPIRED，FCM 通知使用者

FCM Token 由各平台在 App 初次啟動時向後端註冊，存入 User\.fcmTokens（陣列，支援同一帳號多裝置）。推播時後端廣播至該使用者所有 Token，FCM 自動處理 iOS（APNs 轉送）與 Android / PC Chrome 的差異。

## __4\.6 後端服務：Render\.com 免費方案__

後端部署於 Render\.com 免費方案，集中處理所有業務邏輯，包含地理圍欄判斷、OCR 呼叫、指派邏輯、Cron 排程及 FCM 推送。

### __服務組成__

- __Web Service（Node\.js / FastAPI）：__RESTful API，處理認證、Task / Parcel / Assignment CRUD、座標接收、地理圍欄引擎、FCM 推送呼叫。
- __PostgreSQL（Render Free）：__500 MB 免費方案，儲存所有業務資料；地端不保留任何本機 DB。
- __Cron Jobs（Render Cron 或內建排程）：__到期倒數推播（D\-1 / D\-0）、逾期 Parcel 掃描、過期 TriggerLog 清理。
- __Firebase Authentication：__Google / Apple Sign In，JWT Refresh Token 機制。

### __Render\.com 免費方案限制與對應處理__

__限制項目__

__免費方案規格__

__建議處理方式__

__冷啟動（Cold Start）__

閒置 15 分鐘後休眠，首次請求等待 30–60 秒

地端顯示「連線中\.\.\.」；GPS 座標上傳本身可充當 Keep\-alive 心跳（每 5 分鐘）

__PostgreSQL 儲存上限__

500 MB

定期清理 TriggerLog > 90 天資料；Parcel OCR 原始文字欄位選擇性保留

__PostgreSQL 有效期__

免費 DB 90 天後到期需續約

設定行事曆提醒；MVP 驗證完成後升級至 $7/月付費方案

__計算資源__

0\.1 CPU / 512 MB RAM

Geofence Engine 採用輕量 Haversine 公式（純數學，無 IO）；座標上傳量大時加入請求佇列

__每月免費用量__

750 小時 / 月（單一 Web Service）

單一 Service 可全月不間斷；Cron Job 建議合併至同一 Service 避免用量分散

## __4\.7 OCR：Google Cloud Vision API（雲端統一處理）__

截圖 OCR 辨識改由後端統一呼叫 Google Cloud Vision API，前端僅上傳圖片，辨識結果由後端 Regex 比對後回傳給前端顯示預覽。此架構讓 PC 瀏覽器也能使用截圖辨識功能，且辨識能力不受裝置性能影響。

__比較項目__

__Google ML Kit（舊方案）__

__Cloud Vision API（新方案）__

執行環境

裝置端（離線）

後端雲端（需網路）

費用

完全免費

每月前 1,000 次免費；超出 $1\.5 / 1,000 次

平台支援

Android \+ iOS（需原生殼）

全平台（iOS / Android / PC，任何瀏覽器皆可上傳）

辨識準確度

中（裝置端模型）

高（Google 伺服器端大模型）

隱私性

高（圖片不離開裝置）

中（圖片上傳後端後轉送 Google）；後端收到後立即刪除原始圖片，只保留辨識文字

跨平台一致性

低（各平台模型版本不同）

高（統一後端處理）

__免費額度估算__

Cloud Vision API 每月 1,000 次免費（文字辨識 DOCUMENT\_TEXT\_DETECTION）

假設每位用戶平均每月上傳 3 張截圖 → 支援約 333 位 MAU 零成本使用

超出後費用極低（$1\.5 / 1,000 次），1,000 位 MAU 月費約 $4\.5

後端對同一使用者每分鐘限制 1 次上傳，防止濫用消耗免費額度

### __OCR 後處理邏輯（後端 Regex 比對）__

__欄位__

__Regex 範例（後端執行）__

取貨代碼

\[A\-Z0\-9\]\{8,20\}  （含英數字混合，8–20 碼）

到期日

\(d\{4\}\[/\-\]d\{1,2\}\[/\-\]d\{1,2\}\) | \(d\{1,2\}月d\{1,2\}日\)

手機號碼

09d\{8\}  （台灣手機格式）

門市關鍵字

\(7\-ELEVEN|全家|萊爾富|OK mart|FamilyMart\)\[sS\]\{0,20\}店

__成本估算（MVP 階段）__

Render\.com Web Service：$0 / 月（Free）

Render\.com PostgreSQL：$0 / 月（Free，90 天後需續約）

Firebase FCM 推播通知：$0 / 月（免費無訊息上限）

Map8 地圖 API：$0 / 月（免費額度內）

Firebase Authentication：$0 / 月（免費額度：10,000 MAU）

Google Cloud Vision OCR：$0 / 月（每月前 1,000 次免費，約 333 MAU 零成本）

預估 MVP 月費總計：$0（333 MAU 以內）

# __五、資料模型__

## __5\.1 使用者（User）__

User \{

  id:            UUID          // 主鍵

  email:         String        // 登入帳號

  displayName:   String        // 顯示名稱

  createdAt:     DateTime      // 帳號建立時間

  updatedAt:     DateTime      // 最後更新時間

  settings:      UserSettings  // 通知偏好、靜音時段等

\}

UserSettings \{

  muteStart:     Time?         // 靜音開始時間（可空）

  muteEnd:       Time?         // 靜音結束時間

  vibration:     Boolean       // 是否震動

  sound:         Boolean       // 是否播放音效

  defaultRadius: Int           // 預設地理圍欄半徑（公尺）

\}

## __5\.2 任務（Task）__

Task \{

  id:            UUID

  userId:        UUID          // 外鍵 → User

  type:          TaskType      // REMINDER | CHECKLIST

  title:         String        // 最多 50 字元

  description:   String?       // 選填，最多 200 字元

  status:        TaskStatus    // ACTIVE | PAUSED | COMPLETED | ARCHIVED

  // 時間設定

  timeMode:      TimeMode      // POINT | RANGE

  timePoint:     Time?         // 當 timeMode = POINT 時使用

  timeRangeStart:Time?         // 當 timeMode = RANGE 時使用

  timeRangeEnd:  Time?

  repeatRule:    RepeatRule    // ONCE | DAILY | WEEKLY | CUSTOM

  repeatDays:    Int\[\]?        // 0=週日, 1=週一 … 6=週六

  dateRangeStart:Date?         // 有效日期起始（可空表示即時生效）

  dateRangeEnd:  Date?         // 有效日期終止（可空表示永久）

  // 位置設定

  locationId:    UUID?         // 外鍵 → Location（選用 SavedLocation）

  latitude:      Float

  longitude:     Float

  radius:        Int           // 觸發半徑（公尺），50–1000

  locationName:  String        // 地點顯示名稱

  locationAddress:String?

  // 代辦清單

  checklistItems:ChecklistItem\[\]  // 僅 CHECKLIST 類型有值

  // 觸發紀錄

  lastTriggeredAt:DateTime?

  triggerCount:  Int           // 已觸發次數

  createdAt:     DateTime

  updatedAt:     DateTime

\}

## __5\.3 代辦項目（ChecklistItem）__

ChecklistItem \{

  id:            UUID

  taskId:        UUID          // 外鍵 → Task

  content:       String        // 項目描述，最多 100 字元

  order:         Int           // 排序序號

  isCompleted:   Boolean       // 是否已勾選

  completedAt:   DateTime?     // 完成時間

\}

## __5\.4 儲存地點（SavedLocation）__

SavedLocation \{

  id:            UUID

  userId:        UUID          // 外鍵 → User

  name:          String        // 顯示名稱（例如：「家」、「公司」）

  latitude:      Float

  longitude:     Float

  address:       String?

  emoji:         String?       // 快捷識別圖示（例如 🏠 🏢）

  usageCount:    Int           // 使用次數（用於排序常用地點）

  createdAt:     DateTime

\}

## __5\.5 觸發紀錄（TriggerLog）__

TriggerLog \{

  id:            UUID

  taskId:        UUID

  assignmentId:  UUID?         // 若為指派任務，關聯對應 Assignment

  triggeredAt:   DateTime      // 觸發時間

  triggerType:   TriggerType   // ENTER（進入）| EXIT（離開）

  latitude:      Float         // 觸發時的使用者位置

  longitude:     Float

  completedItems:Int           // 已完成清單項目數（快照）

  totalItems:    Int           // 總清單項目數（快照）

  wasAbandoned:  Boolean       // 是否未完成就離開

\}

## __5\.6 任務指派（Assignment）__

Assignment 表記錄每一筆指派關係，一個 Task 可以有多筆 Assignment（對應多位被指派者）。

Assignment \{

  id:               UUID

  taskId:           UUID              // 外鍵 → Task（原始任務）

  assignerId:       UUID              // 外鍵 → User（指派者）

  assigneeId:       UUID?             // 外鍵 → User（被指派者，接受邀請後填入）

  inviteToken:      String?           // 邀請連結 Token（未註冊者用）

  inviteEmail:      String?           // 邀請電子郵件（搜尋已註冊帳號時填入）

  status:           AssignmentStatus  // PENDING | ACCEPTED | REJECTED | COMPLETED | ABANDONED

  // 通知偏好（指派者設定）

  notifyOnComplete: Boolean           // 被指派者完成時，通知指派者（預設 true）

  notifyOnAbandon:  Boolean           // 被指派者未完成離開時，通知指派者（預設 true）

  // 狀態時間戳記

  invitedAt:        DateTime          // 發出邀請時間

  respondedAt:      DateTime?         // 被指派者回應（接受/拒絕）時間

  triggeredAt:      DateTime?         // 被指派者裝置觸發提醒時間

  completedAt:      DateTime?         // 被指派者完成任務時間

  abandonedAt:      DateTime?         // 被指派者未完成離開時間

  // 被指派者專屬清單進度（若 Task\.type = CHECKLIST）

  assigneeChecklistSnapshot: AssigneeChecklistItem\[\]

  createdAt:        DateTime

  updatedAt:        DateTime

\}

AssigneeChecklistItem \{

  id:               UUID

  assignmentId:     UUID              // 外鍵 → Assignment

  sourceItemId:     UUID              // 對應 ChecklistItem\.id（原始任務項目）

  content:          String            // 快照內容（防原始項目被修改後失準）

  isCompleted:      Boolean

  completedAt:      DateTime?

\}

AssignmentStatus \{

  PENDING    // 已發出邀請，等待被指派者回應

  ACCEPTED   // 被指派者已接受，地理圍欄已在其裝置建立

  REJECTED   // 被指派者拒絕

  COMPLETED  // 被指派者已完成所有項目（或確認提醒）

  ABANDONED  // 被指派者離開地點/超時，任務未完成

\}

資料庫關聯示意（ER 圖簡化）：

User  1──\* Task        （建立任務）

Task  1──\* Assignment  （一個任務可指派給多人）

User  1──\* Assignment  （作為指派者 assignerId）

User  1──\* Assignment  （作為被指派者 assigneeId，接受後填入）

Assignment 1──\* AssigneeChecklistItem  （被指派者的清單進度）

ChecklistItem <── AssigneeChecklistItem\.sourceItemId  （快照來源）

## __5\.7 包裹取貨（Parcel）__

Parcel 為獨立資料表，與 Task 平行存在（取貨提醒屬於專屬任務類型，資料結構更精簡）。

Parcel \{

  id:              UUID

  userId:          UUID              // 外鍵 → User

  // 取件資訊

  pickupCode:      String            // 取貨代碼 / 條碼，必填

  phoneNumber:     String?           // 取件手機號碼，選填

  notes:           String?           // 備註（訂單編號、品項描述）

  sourceImage:     String?           // OCR 來源截圖的本機路徑（加密儲存，可選保留）

  // 門市資訊

  storeName:       String            // 門市名稱（例如：全家信義文昌店）

  storeChain:      StoreChain        // SEVEN | FAMILY | HILIFE | OK | OTHER

  latitude:        Float

  longitude:       Float

  storeAddress:    String?

  radius:          Int               // 地理圍欄半徑，預設 150 公尺

  // 時間

  expiresAt:       Date              // 到期日，必填

  reminderSentAt:  DateTime?         // 最後一次到期倒數推播時間

  // 狀態

  status:          ParcelStatus      // WAITING | PICKED\_UP | EXPIRED

  pickedUpAt:      DateTime?         // 使用者手動標記已取貨的時間

  // OCR 元資料

  ocrConfidence:   Float?            // ML Kit 辨識信心度 0\.0–1\.0（供 UI 提示修正）

  ocrRawText:      String?           // 辨識原始文字（除錯用，選擇性保留）

  createdAt:       DateTime

  updatedAt:       DateTime

\}

ParcelStatus \{

  WAITING    // 等待取件中（地理圍欄監控中）

  PICKED\_UP  // 使用者已手動標記取貨完成

  EXPIRED    // 已超過到期日未取件

\}

StoreChain \{

  SEVEN      // 7\-ELEVEN

  FAMILY     // 全家 FamilyMart

  HILIFE     // 萊爾富

  OK         // OK mart

  OTHER      // 其他超商或自訂地點

\}

# __六、觸發邏輯與邊界條件__

## __6\.1 核心觸發條件__

__觸發條件（AND 邏輯）__

✅  條件 A：使用者進入任務的地理圍欄（距離 ≤ 設定半徑）

✅  條件 B：當前時間位於任務的有效時間區間內

✅  條件 C：任務狀態為 ACTIVE

✅  條件 D：今日尚未觸發過此任務（防重複觸發）

✅  條件 E：當前時間不在使用者的靜音時段內

## __6\.2 觸發流程（狀態機）__

__狀態__

__事件__

__動作__

IDLE（等待）

進入地理圍欄

檢查時間條件 → 若符合則進入 TRIGGERED 狀態

TRIGGERED（已觸發）

推播通知送出

記錄 TriggerLog，任務類型決定通知樣式

IN\_PROGRESS（進行中，Checklist 限定）

使用者勾選項目

即時更新 ChecklistItem\.isCompleted

COMPLETED（完成）

全部項目勾選完成

更新 Task\.status = COMPLETED（一次性）或重置（重複型）

ABANDONED（放棄）

離開圍欄 / 超出時間，未完成

標記 TriggerLog\.wasAbandoned = true，推送詢問通知

## __6\.3 邊界條件與特殊案例__

### __BC\-01：進入圍欄但時間不符__

不觸發通知，持續監控。若在圍欄內且時間到達有效時段起始點，則在該時間點觸發通知（需搭配本地定時通知機制）。

### __BC\-02：已在圍欄內，App 才啟動或設定才完成__

App 啟動時主動執行一次位置檢查（One\-shot location query）。若使用者已在圍欄範圍內且時間符合，立即觸發通知，避免因系統 didEnterRegion 未觸發而漏失提醒。

### __BC\-03：多任務同時觸發__

多個任務同時滿足條件時，系統逐一推送通知，並在通知中心依任務分組顯示，避免通知堆疊造成使用者困擾。同時觸發數量上限建議設為 3 則，多餘的排隊延遲 30 秒依序推送。

### __BC\-04：代辦清單部分完成離開__

偵測到 EXIT 事件後，延遲 60 秒確認（避免短暫離開後立即返回的誤判），若確認已離開，則推送「未完成詢問通知」。若使用者在 60 秒內重新進入圍欄，取消詢問流程。

### __BC\-05：GPS / 位置服務被關閉__

App 偵測到位置權限被撤銷或 GPS 關閉時，顯示 In\-App Banner 提示使用者啟用位置服務，並暫停相關任務的地理圍欄監控。

### __BC\-06：時間區間跨越午夜（例如 23:00–01:00）__

系統需正確處理跨日時間區間，判斷邏輯：若 timeRangeStart > timeRangeEnd，則視為跨日區間，計算時需加入日期偏移。

### __BC\-07：iOS 地理圍欄數量超出 20 個上限__

當使用者建立超過 20 個活躍任務時，系統需動態調度地理圍欄：

- 優先監控使用者當前位置附近（距離最近的前 20 個）的任務
- 使用 Significant Location Change 感知使用者移動，動態替換監控的圍欄集合
- Super Premium 使用者可解鎖後端輔助的圍欄調度服務

## __6\.4 指派任務觸發邏輯與通知回傳流程__

### __6\.4\.1 被指派者端觸發流程__

被指派者接受邀請後，後端 API 回傳原始任務的地點與時間設定，App 在被指派者裝置上建立對應的本地地理圍欄。後續觸發邏輯與一般任務相同，觸發條件仍為「位置 \+ 時間 \+ 任務 ACTIVE \+ 未靜音」四項 AND 條件。

__指派任務觸發條件（被指派者裝置）__

✅  條件 A：被指派者進入原始任務的地理圍欄

✅  條件 B：當前時間位於原始任務的有效時間區間內

✅  條件 C：Assignment\.status = ACCEPTED

✅  條件 D：今日尚未觸發過此 Assignment（防重複觸發）

✅  條件 E：當前時間不在被指派者的靜音時段內

### __6\.4\.2 完成回報流程（FCM）__

被指派者完成任務後，App 呼叫後端 API 更新 Assignment\.status = COMPLETED。後端接收到請求後執行以下動作：

1. 更新 Assignment\.completedAt = NOW\(\)
2. 若 Assignment\.notifyOnComplete = true，透過 FCM 向指派者（assignerId 對應的 FCM Token）推送「已完成」通知
3. 若原始任務的 repeatRule = ONCE，將 Task\.status 更新為 COMPLETED；若為重複型任務，僅重置 Assignment 的進度（下次觸發繼續）

__完成通知內容__

__範例文字__

標題

王小明 完成了你指派的任務

內文

"週末採購清單" 已於 14:35 全部完成，地點：家樂福信義店

動作按鈕

\[查看詳情\]  \[知道了\]

### __6\.4\.3 未完成通知流程（FCM）__

被指派者裝置偵測到 EXIT 事件且清單未完成（延遲 60 秒確認後），App 呼叫後端 API 更新 Assignment\.status = ABANDONED。後端同時：

1. 更新 Assignment\.abandonedAt = NOW\(\)
2. 若 Assignment\.notifyOnAbandon = true，透過 FCM 向指派者推送「未完成」通知
3. 被指派者裝置同時推送本地詢問通知（是否調整提醒），與一般任務相同邏輯

### __6\.4\.4 邊界條件__

__BC\-A：被指派者拒絕邀請__

後端更新 Assignment\.status = REJECTED，透過 FCM 通知指派者。指派者可在進度頁重新邀請或選擇其他被指派者。

__BC\-B：邀請連結逾期__

邀請連結（inviteToken）預設有效期 7 天，逾期後 Assignment 自動標記 EXPIRED，連結失效並通知指派者。

__BC\-C：指派者刪除原始任務__

刪除 Task 時，系統同時廣播 FCM 通知所有 status = ACCEPTED 的被指派者，告知任務已取消，被指派者裝置移除對應的地理圍欄。

__BC\-D：被指派者裝置無網路（離線）__

地理圍欄觸發與本地通知仍可正常運作（本地邏輯），但「完成回報」需在網路恢復後才能同步至後端並推送 FCM 給指派者。App 應在離線時本地暫存完成狀態，待網路恢復後自動上傳，同時提示使用者「完成通知將在網路恢復後送出」。

## __6\.5 取貨提醒觸發邏輯__

取貨提醒（Parcel）同時具備兩種獨立的觸發機制，兩者並行運作、互不排斥：

### __機制一：靠近門市地理圍欄觸發__

__取貨圍欄觸發條件（AND 邏輯）__

✅  條件 A：使用者進入門市地理圍欄（預設半徑 150 公尺）

✅  條件 B：Parcel\.status = WAITING（尚未取貨）

✅  條件 C：當前日期 ≤ Parcel\.expiresAt（尚未到期）

✅  條件 D：今日尚未因此 Parcel 觸發過圍欄通知（防重複）

✅  條件 E：當前時間不在使用者靜音時段內

觸發後推送本地通知，內容包含取貨代碼（點擊可複製）、門市名稱、到期剩餘天數，以及動作按鈕：

- \[複製取貨代碼\]：一鍵複製到剪貼簿
- \[已取貨\]：點擊後立即標記 Parcel\.status = PICKED\_UP，任務完成
- \[稍後提醒\]：關閉通知，下次靠近同一門市時再次觸發

### __機制二：到期倒數時間推播（FCM / 本地排程）__

此機制不依賴地理圍欄，而是基於到期日的時間排程，確保使用者即使不靠近門市也能收到警示：

__推播時機__

__推播方式__

__說明__

到期日前 1 天（D\-1）上午 9:00

本地排程通知

建立 Parcel 時同步排程，不需網路，App 背景可觸發

到期日當天（D\-0）上午 9:00

本地排程通知

最後一次提醒，標示「今日最後取件期限」

到期後隔日 00:00

後端 FCM（批次任務）

後端 Cron Job 掃描已過期 Parcel，更新 status = EXPIRED，並推送 FCM 提醒「包裹已逾期」

本地排程通知在 App 初次建立 Parcel 或使用者手動調整到期日時重新排程，確保時間準確。若使用者在 D\-1 或 D\-0 推播前已標記「已取貨」，系統自動取消尚未觸發的排程通知。

### __6\.5\.3 取貨完成與逾期流程__

__狀態__

__事件__

__動作__

WAITING

使用者點擊「已取貨」

status → PICKED\_UP，pickedUpAt = NOW\(\)，移除地理圍欄，取消尚未觸發的排程通知

WAITING

到期日 \+1 日 Cron 掃描

status → EXPIRED，推送 FCM「包裹已逾期」，地理圍欄自動移除

PICKED\_UP / EXPIRED

任意

任務歸檔至「已完成」，不再觸發任何通知

### __6\.5\.4 邊界條件__

__BC\-P1：OCR 辨識後門市座標無法取得（離線）__

Parcel 先以「待定座標」狀態儲存（latitude / longitude 為 null），地理圍欄暫不建立。App 顯示黃色警示「門市位置待確認，連線後將自動完成設定」。網路恢復後自動呼叫 Map8 補全座標並建立圍欄。

__BC\-P2：同一門市有多筆待取件包裹__

地理圍欄以門市為單位合併（相同 latitude / longitude 只建立一個圍欄），進入圍欄時同時顯示該門市所有待取件包裹，以清單形式呈現於通知展開區域。

__BC\-P3：取貨代碼含條碼（Barcode）__

Parcel 通知展開後，若 pickupCode 格式符合 Code 128 / EAN\-13 等常見條碼規格，App 在通知內容頁嘗試顯示條碼圖像（需進入 App 全螢幕顯示），方便使用者直接讓店員掃描。

# __七、非功能性需求__

## __7\.1 效能需求__

__指標__

__目標值__

__備註__

PWA 首次載入時間

< 3 秒

含 Service Worker 快取後，二次載入 < 1 秒

地點搜尋回應時間

< 1 秒

後端呼叫 Map8 Places API，結果快取 24 小時

圍欄觸發通知延遲

< 10 分鐘

取決於 GPS 上傳頻率（預設 5 分鐘）\+ FCM 推送延遲（< 5 秒）

OCR 辨識回應時間

< 5 秒

含圖片上傳後端 \+ Cloud Vision API 處理 \+ Regex 比對

API 回應時間（P95）

< 500 ms

Render\.com 喚醒後穩定狀態；冷啟動例外（30–60 秒）

GPS 座標上傳大小

< 200 bytes / 次

JSON payload 極小，不影響行動網路流量

## __7\.2 電量消耗__

- 雲端地理圍欄以 5 分鐘 GPS 輪詢取代系統原生圍欄，電量消耗高於純原生方案，需透過策略控制在可接受範圍
- 原生殼（Capacitor）版本目標：背景 24 小時額外電耗 < 5%（採用 Balanced Power 定位模式 \+ 動態調整上傳頻率）
- PWA 前景模式不作電量保證（使用者主動使用中），但提供省電模式（15 分鐘輪詢）讓使用者自主選擇
- PC 瀏覽器版本電量消耗可忽略（桌機 / 筆電接電狀態）
- 後端 Geofence Engine 採用純數學 Haversine 計算（無 DB 讀取），單次座標判斷 < 1ms，不造成伺服器負擔

## __7\.3 隱私與資料安全__

### __雲端優先架構下的隱私設計__

- GPS 座標頻繁上傳至後端：明確在隱私政策中告知使用者「位置資料傳輸至伺服器用於圍欄判斷」，並提供關閉選項（關閉後降級為手動確認模式）
- 後端僅保留最近 10 筆座標紀錄（供 EXIT 事件判斷使用），不建立長期位置歷史軌跡，保護使用者隱私
- OCR 截圖上傳後端後，Cloud Vision API 辨識完成即刪除原始圖片，後端僅保留辨識文字結果
- 遵循最小資料原則：資料庫中不儲存非業務必要的個人資料

### __使用者授權__

- 位置存取（PWA）：瀏覽器標準 Geolocation API 授權對話框，iOS Safari / Android Chrome / PC 瀏覽器皆會顯示
- 位置存取（原生殼）：iOS 需「始終允許」（Always Allow）才能在背景上傳座標；Android 需「一律允許」背景位置權限
- 推播通知（PWA）：Web Push API 授權對話框，Android Chrome 直接支援；iOS 16\.4\+ 需先「加入主畫面」才能請求推播權限
- 提供隱私政策說明頁，於首次開啟時展示，明確說明各類資料用途
- 使用者可隨時在設定頁刪除帳號及所有雲端資料（GDPR Right to Erasure）

### __資料傳輸安全__

- 所有 API 通訊使用 HTTPS / TLS 1\.3
- API 認證採用 Firebase JWT（短效 1 小時）\+ Refresh Token；GPS 上傳端點需 JWT 驗證，防止他人偽造座標
- PWA 採用 Content Security Policy（CSP）防止 XSS 攻擊
- 圖片上傳端點限制檔案類型（僅接受 image/jpeg、image/png）與大小（< 5 MB）

## __7\.4 跨平台相容性與 PWA 限制__

雲端優先架構以 PWA 為核心，需特別關注各平台對 Web 標準的支援差異。以下為已知限制與對應解決方案：

__平台__

__已知限制__

__對應方案__

__iOS Safari__

Web Push（推播）需 iOS 16\.4\+ 且須先「加入主畫面」；背景 JS 執行受限，Periodic Background Sync 不支援；定位精度與原生相當，但背景定位會被系統暫停

引導使用者加入主畫面並開啟推播；背景定位限制透過 Capacitor 原生殼解決；App Store 版本為完整體驗

__Android Chrome__

Web Push 完整支援；Periodic Background Sync 需使用者授權且觸發不可預期；背景定位需「始終允許」位置權限

純 PWA 可提供接近完整體驗；建議提示使用者授予背景位置權限；Play Store 版本（Capacitor）解決所有限制

__PC Chrome / Edge__

Web Push 完整支援（需使用者允許）；Geolocation 精度依賴 IP 定位或 Wi\-Fi 定位（精度低，約 100m–幾公里）；瀏覽器關閉後無法接收位置更新

PC 版最適合用於「辦公室 / 家中固定地點」任務（精度足夠）；提示使用者開啟瀏覽器以保持 GPS 上傳；未來可加入桌面 App（Electron）選項

__Firefox__

Web Push 支援；Periodic Background Sync 尚未支援；Geolocation 行為與 Chrome 相近

基本功能可用；建議以 Chrome / Edge 為主要支援目標，Firefox 為次要支援

__Safari（macOS）__

Web Push 需 macOS 13\+ Ventura；Geolocation 精度低（Wi\-Fi / IP）

macOS Ventura 以上提供完整推播支援；地點精度限制同 PC Chrome

### __最低版本需求（PWA \+ 原生殼）__

__平台__

__最低版本__

__關鍵功能支援說明__

iOS Safari（PWA）

iOS 16\.4

Web Push 最低版本；加入主畫面後完整推播支援

iOS App（原生殼）

iOS 16

完整背景定位 \+ FCM/APNs 推播；建議上架 App Store 以提供最佳體驗

Android Chrome（PWA）

Android 10 / Chrome 90\+

Web Push 完整支援；背景定位需使用者授權

Android App（原生殼）

Android 10 \(API 29\)

完整背景定位 \+ FCM；Fused Location Provider 支援

PC 瀏覽器（Chrome / Edge）

Chrome 90 / Edge 90\+

Web Push 支援；定位精度受 IP / Wi\-Fi 限制

## __7\.5 可靠性__

- 後端 SLA 目標：Render\.com Free 約 99\.5% 可用性（可接受的停機時間 ≤ 3\.6h / 月）
- 冷啟動期間（最長 60 秒）：GPS 上傳請求排隊在前端本地緩衝（最多 3 筆），服務恢復後依序補送
- FCM 推播可靠性：FCM 保證 at\-least\-once 投遞，重複通知在前端以通知 ID 去重
- 離線降級：PWA Service Worker 快取靜態資源，離線時仍可瀏覽已載入的任務清單；GPS 上傳與 FCM 通知需恢復網路後執行
- Crash / Error 監控：整合 Sentry（免費方案 5,000 events / 月）監控前後端例外

# __八、未來擴充方向__

## __8\.1 短期（3–6 個月）__

- __Widget 支援：__iOS Lock Screen Widget / Android Home Screen Widget，顯示當日近期任務與狀態
- __Siri Shortcuts / Google Assistant 整合：__以語音快速新增任務（「提醒我到家後買牛奶」）
- __任務範本（Template）：__提供預設範本（例如「超市採購清單」、「出差前準備清單」），使用者快速套用
- __地點匯入：__從聯絡人、行事曆、地圖 App 匯入地點資訊

## __8\.2 中期（6–12 個月）__

- __多裝置同步：__透過 iCloud / 自建同步服務，在 iPad、Apple Watch、多支手機間同步任務
- __Apple Watch App：__在手腕上直接查看並勾選代辦清單項目
- __協作功能：__共享任務 / 清單，例如家庭成員共用採購清單（任一人勾選即同步）
- __機器學習推薦：__根據使用者歷史觸發紀錄，自動推薦最適合的時間與半徑設定

## __8\.3 長期（12 個月以上）__

- __IoT 整合：__連結智慧家居（例如：到家時自動勾選「鎖門」任務，並觸發相應自動化）
- __AR 導航輔助：__到達地點後，以 AR 視角顯示需完成的任務項目（對應實體環境標記）
- __企業版（Enterprise）：__為中小企業提供現場工作人員任務管理，支援管理員後台與進度追蹤
- __API 開放：__提供 Webhook / Open API，讓第三方服務（Notion、Zapier 等）整合任務資料

## __8\.4 Premium 訂閱功能規劃__

__功能__

__免費版__

__Premium__

活躍任務數量

最多 10 個

無限制

儲存地點

最多 5 個

無限制

多裝置同步

❌

✅

觸發紀錄保留

30 天

無限

協作 / 共享任務

❌

✅

進階統計分析

❌

✅

# __九、最小可行方案（MVP）__

本章定義以一位全端工程師獨立開發、目標零成本上線的 MVP 規格。原則：只實作能驗證「時間 \+ 地點雙條件提醒」核心價值的功能，所有進階功能推遲至 Phase 2 驗證市場後再實作。後端技術鎖定 Python FastAPI。

## __9\.1 MVP 功能範圍表__

__功能項目__

__MVP 狀態__

__決策理由__

使用者註冊 / 登入（Email \+ 密碼）

✅ 包含

核心前提，無法省略

新增「提醒」任務（時間 \+ 地點）

✅ 包含

核心功能 \#1

新增「代辦清單」任務（時間 \+ 地點）

✅ 包含

核心功能 \#2，差異化賣點

Map8 地標搜尋 \+ 地圖點選確認

✅ 包含

地點設定必要 UX，Map8 免費

地端 GPS 每 5 分鐘上傳 → 後端圍欄判斷

✅ 包含

雲端優先架構核心

FCM 推播通知（Android \+ iOS）

✅ 包含

觸發通知的唯一輸出管道

代辦清單勾選介面

✅ 包含

代辦清單任務完成的必要互動

取貨提醒（手動輸入，不含 OCR）

✅ 包含

驗證第三種任務類型需求

任務指派給其他使用者

❌ Phase 2

需要多使用者協作基礎設施，MVP 先驗證單人使用

截圖 OCR 自動辨識（Cloud Vision）

❌ Phase 2

手動輸入已可驗證取貨提醒流程，OCR 是體驗優化

PC 瀏覽器版本

❌ Phase 2

手機版先上線，PC 定位精度低且使用情境較少

歷史紀錄 / 統計分析

❌ Phase 2

非核心驗證指標

Premium 付費 / 訂閱功能

❌ Phase 2

先驗證留存率再考慮變現

到期倒數時間推播（D\-1 / D\-0）

❌ Phase 2

MVP 取貨提醒只做地理圍欄觸發，到期推播為體驗加分

## __9\.2 MVP 系統架構圖__

__MVP 架構（極簡版）__

  手機瀏覽器（iOS Safari / Android Chrome）

  React PWA（Vite）

  ┌─────────────────────────────────────────┐

  │  UI：任務列表 / 新增任務 / 勾選清單     │

  │  每 5 分鐘：POST /api/location          │

  │  Map8 JS SDK：地圖顯示 / 地標搜尋       │

  └───────────────┬─────────────────────────┘

                  │ HTTPS

                  ▼

  Render\.com Free Web Service

  Python FastAPI

  ┌─────────────────────────────────────────┐

  │  /auth   → JWT 登入 / 註冊              │

  │  /tasks  → Task CRUD                    │

  │  /parcels→ Parcel CRUD                  │

  │  /location → GPS 接收 \+ Haversine 圍欄  │

  │             判斷 → FCM 推播              │

  │  /map    → Map8 Places API 代理          │

  └──────────────┬──────────────────────────┘

                 │

      ┌──────────┴──────────┐

      ▼                     ▼

  Render PostgreSQL     Firebase FCM

  （免費 500MB）        （免費，推播）

前端部署於 Cloudflare Pages（免費），後端部署於 Render\.com Free Web Service。兩者皆透過 HTTPS 通訊，無任何付費基礎設施。

## __9\.3 FastAPI 專案結構__

locaremind\-backend/

├── main\.py                   \# FastAPI app 入口、CORS 設定、router 掛載

├── requirements\.txt          \# 依賴套件清單

├── \.env                      \# 環境變數（不提交 git）

│

├── app/

│   ├── core/

│   │   ├── config\.py         \# 設定（DB URL、JWT secret、FCM 金鑰路徑）

│   │   ├── security\.py       \# JWT 生成 / 驗證、bcrypt 密碼雜湊

│   │   └── database\.py       \# SQLAlchemy engine、SessionLocal、Base

│   │

│   ├── models/               \# SQLAlchemy ORM 模型

│   │   ├── user\.py           \# User、UserSettings

│   │   ├── task\.py           \# Task、ChecklistItem

│   │   └── parcel\.py         \# Parcel

│   │

│   ├── schemas/              \# Pydantic 輸入 / 輸出 schema（請求 / 回應驗證）

│   │   ├── auth\.py           \# RegisterRequest、LoginRequest、TokenResponse

│   │   ├── task\.py           \# TaskCreate、TaskUpdate、TaskResponse

│   │   ├── parcel\.py         \# ParcelCreate、ParcelResponse

│   │   └── location\.py       \# LocationUpload

│   │

│   ├── routers/              \# API 路由

│   │   ├── auth\.py           \# POST /auth/register、/auth/login、/auth/refresh

│   │   ├── tasks\.py          \# CRUD /tasks

│   │   ├── checklist\.py      \# PATCH /tasks/\{id\}/items/\{item\_id\}

│   │   ├── parcels\.py        \# CRUD /parcels

│   │   ├── location\.py       \# POST /location（圍欄引擎入口）

│   │   └── map\.py            \# GET /map/search（Map8 Places 代理）

│   │

│   ├── services/

│   │   ├── geofence\.py       \# Haversine 計算、進出圍欄判斷邏輯

│   │   ├── fcm\.py            \# Firebase Admin SDK 推播封裝

│   │   └── map8\.py           \# Map8 Places API 呼叫封裝

│   │

│   └── deps\.py               \# FastAPI Depends：get\_db\(\)、get\_current\_user\(\)

│

└── alembic/                  \# Alembic 資料庫遷移

    ├── env\.py

    ├── versions/             \# 遷移腳本（自動生成）

    └── alembic\.ini

### __核心依賴套件（requirements\.txt）__

fastapi==0\.111\.0

uvicorn\[standard\]==0\.30\.0

sqlalchemy==2\.0\.30

alembic==1\.13\.1

psycopg2\-binary==2\.9\.9      \# PostgreSQL 驅動

pydantic\[email\]==2\.7\.1

python\-jose\[cryptography\]==3\.3\.0  \# JWT

passlib\[bcrypt\]==1\.7\.4      \# 密碼雜湊

firebase\-admin==6\.5\.0       \# FCM 推播

httpx==0\.27\.0               \# 呼叫 Map8 API

python\-dotenv==1\.0\.1

## __9\.4 核心 API 端點清單__

__Method__

__路徑__

__功能說明__

__需 JWT__

POST

/api/auth/register

Email \+ 密碼註冊，回傳 access\_token / refresh\_token

否

POST

/api/auth/login

Email \+ 密碼登入，回傳 access\_token / refresh\_token

否

POST

/api/auth/refresh

以 refresh\_token 換發新 access\_token（1 小時有效期）

否（帶 refresh token）

POST

/api/auth/fcm\-token

更新 / 新增裝置 FCM Token（登入後呼叫）

是

GET

/api/tasks

取得目前使用者所有任務列表（支援 status / type 篩選）

是

POST

/api/tasks

建立新任務（REMINDER 或 CHECKLIST），含地點與時間設定

是

GET

/api/tasks/\{id\}

取得單一任務詳情（含 checklistItems）

是

PATCH

/api/tasks/\{id\}

更新任務（名稱、時間、地點、狀態 ACTIVE / PAUSED）

是

DELETE

/api/tasks/\{id\}

刪除任務

是

PATCH

/api/tasks/\{id\}/items/\{item\_id\}

勾選 / 取消勾選代辦清單子項目（is\_completed: bool）

是

GET

/api/parcels

取得目前使用者所有取貨提醒（支援 status 篩選）

是

POST

/api/parcels

建立取貨提醒（手動輸入門市、取貨代碼、到期日）

是

PATCH

/api/parcels/\{id\}/pickup

標記已取貨（status → PICKED\_UP）

是

DELETE

/api/parcels/\{id\}

刪除取貨提醒

是

POST

/api/location

地端上傳 GPS 座標，後端執行 Haversine 圍欄判斷，觸發 FCM

是

GET

/api/map/search?q=\{keyword\}

Map8 Places API 代理，防止前端暴露 API Key

是

## __9\.5 資料庫 Schema（MVP 精簡版）__

MVP 只建立三張核心資料表，省略 TriggerLog、SavedLocation、Assignment 等 Phase 2 用到的表。

\-\- users

CREATE TABLE users \(

  id           UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  email        VARCHAR\(255\) UNIQUE NOT NULL,

  hashed\_pwd   VARCHAR\(255\) NOT NULL,

  display\_name VARCHAR\(100\),

  fcm\_tokens   TEXT\[\],              \-\- 多裝置推播 Token

  mute\_start   TIME,                \-\- 靜音開始（NULL = 不靜音）

  mute\_end     TIME,

  created\_at   TIMESTAMPTZ DEFAULT NOW\(\)

\);

\-\- tasks

CREATE TABLE tasks \(

  id             UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  user\_id        UUID REFERENCES users\(id\) ON DELETE CASCADE,

  type           VARCHAR\(20\) NOT NULL,   \-\- REMINDER | CHECKLIST

  title          VARCHAR\(100\) NOT NULL,

  description    TEXT,

  status         VARCHAR\(20\) DEFAULT 'ACTIVE',  \-\- ACTIVE | PAUSED | COMPLETED

  \-\- 時間設定

  time\_mode      VARCHAR\(10\) NOT NULL,   \-\- POINT | RANGE

  time\_point     TIME,

  time\_range\_start TIME,

  time\_range\_end   TIME,

  repeat\_rule    VARCHAR\(20\) DEFAULT 'ONCE',

  repeat\_days    INT\[\],

  \-\- 地點設定

  latitude       DOUBLE PRECISION NOT NULL,

  longitude      DOUBLE PRECISION NOT NULL,

  radius         INT DEFAULT 200,

  location\_name  VARCHAR\(255\),

  \-\- 觸發紀錄

  last\_triggered\_at TIMESTAMPTZ,

  trigger\_count  INT DEFAULT 0,

  created\_at     TIMESTAMPTZ DEFAULT NOW\(\),

  updated\_at     TIMESTAMPTZ DEFAULT NOW\(\)

\);

\-\- checklist\_items

CREATE TABLE checklist\_items \(

  id           UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  task\_id      UUID REFERENCES tasks\(id\) ON DELETE CASCADE,

  content      VARCHAR\(200\) NOT NULL,

  ord          INT NOT NULL,

  is\_completed BOOLEAN DEFAULT FALSE,

  completed\_at TIMESTAMPTZ

\);

\-\- parcels

CREATE TABLE parcels \(

  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid\(\),

  user\_id       UUID REFERENCES users\(id\) ON DELETE CASCADE,

  pickup\_code   VARCHAR\(100\) NOT NULL,

  phone\_number  VARCHAR\(20\),

  store\_name    VARCHAR\(255\) NOT NULL,

  store\_chain   VARCHAR\(20\),   \-\- SEVEN | FAMILY | HILIFE | OK | OTHER

  latitude      DOUBLE PRECISION NOT NULL,

  longitude     DOUBLE PRECISION NOT NULL,

  radius        INT DEFAULT 150,

  expires\_at    DATE NOT NULL,

  status        VARCHAR\(20\) DEFAULT 'WAITING',  \-\- WAITING | PICKED\_UP | EXPIRED

  picked\_up\_at  TIMESTAMPTZ,

  notes         TEXT,

  created\_at    TIMESTAMPTZ DEFAULT NOW\(\)

\);

## __9\.6 地理圍欄輪詢設計__

### __GPS 上傳 API（地端 → 後端）__

地端（React PWA）以 setInterval 每 5 分鐘呼叫一次 Geolocation API 取得座標，再以 fetch 上傳至後端：

// 前端（React PWA）

const uploadLocation = async \(\) => \{

  const pos = await new Promise\(\(resolve, reject\) =>

    navigator\.geolocation\.getCurrentPosition\(resolve, reject,

      \{ enableHighAccuracy: true, timeout: 10000 \}\)

  \);

  await fetch\('/api/location', \{

    method: 'POST',

    headers: \{ 'Authorization': \`Bearer $\{accessToken\}\`,

               'Content\-Type': 'application/json' \},

    body: JSON\.stringify\(\{

      lat: pos\.coords\.latitude,

      lng: pos\.coords\.longitude,

      accuracy: pos\.coords\.accuracy,   // 公尺，供後端評估精度

      ts: new Date\(\)\.toISOString\(\)

    \}\)

  \}\);

\};

setInterval\(uploadLocation, 5 \* 60 \* 1000\);  // 每 5 分鐘

### __後端圍欄判斷邏輯（FastAPI \+ Haversine）__

\# app/services/geofence\.py

from math import radians, sin, cos, sqrt, atan2

def haversine\(lat1, lng1, lat2, lng2\) \-> float:

    """回傳兩點距離（公尺）"""

    R = 6\_371\_000  \# 地球半徑（公尺）

    d\_lat = radians\(lat2 \- lat1\)

    d\_lng = radians\(lng2 \- lng1\)

    a = sin\(d\_lat/2\)\*\*2 \+ cos\(radians\(lat1\)\) \* cos\(radians\(lat2\)\) \* sin\(d\_lng/2\)\*\*2

    return R \* 2 \* atan2\(sqrt\(a\), sqrt\(1 \- a\)\)

\# app/routers/location\.py

@router\.post\("/location"\)

async def upload\_location\(

    payload: LocationUpload,

    db: Session = Depends\(get\_db\),

    current\_user: User = Depends\(get\_current\_user\)

\):

    now = datetime\.utcnow\(\)

    now\_time = now\.time\(\)

    today = now\.date\(\)

    \# 取得使用者所有 ACTIVE 任務（Task \+ Parcel）

    tasks = db\.query\(Task\)\.filter\(

        Task\.user\_id == current\_user\.id,

        Task\.status == "ACTIVE"

    \)\.all\(\)

    parcels = db\.query\(Parcel\)\.filter\(

        Parcel\.user\_id == current\_user\.id,

        Parcel\.status == "WAITING",

        Parcel\.expires\_at >= today

    \)\.all\(\)

    triggered = \[\]

    for task in tasks:

        dist = haversine\(payload\.lat, payload\.lng, task\.latitude, task\.longitude\)

        if dist > task\.radius:

            continue  \# 不在圍欄內

        if task\.last\_triggered\_at and task\.last\_triggered\_at\.date\(\) == today:

            continue  \# 今日已觸發

        if not is\_in\_time\_window\(task, now\_time\):

            continue  \# 時間不符

        if is\_muted\(current\_user, now\_time\):

            continue  \# 靜音時段

        triggered\.append\(\("task", task\)\)

    for parcel in parcels:

        dist = haversine\(payload\.lat, payload\.lng, parcel\.latitude, parcel\.longitude\)

        if dist <= parcel\.radius:

            triggered\.append\(\("parcel", parcel\)\)

    \# 推送 FCM

    for kind, item in triggered:

        await send\_fcm\_notification\(current\_user\.fcm\_tokens, kind, item\)

        if kind == "task":

            item\.last\_triggered\_at = now

            item\.trigger\_count \+= 1

    db\.commit\(\)

    return \{"triggered": len\(triggered\)\}

### __FCM 推播封裝（FastAPI）__

\# app/services/fcm\.py

import firebase\_admin

from firebase\_admin import credentials, messaging

\_app = firebase\_admin\.initialize\_app\(

    credentials\.Certificate\("firebase\-service\-account\.json"\)

\)

async def send\_fcm\_notification\(tokens: list\[str\], kind: str, item\) \-> None:

    if not tokens:

        return

    title = item\.title if kind == "task" else f"取貨提醒：\{item\.store\_name\}"

    body  = "你有一個代辦清單需要完成" if \(kind=="task" and item\.type=="CHECKLIST"\) \\

            else \("提醒：" \+ \(item\.title if kind=="task" else item\.pickup\_code\)\)

    message = messaging\.MulticastMessage\(

        tokens=tokens,

        notification=messaging\.Notification\(title=title, body=body\),

        data=\{"kind": kind, "id": str\(item\.id\)\},

        android=messaging\.AndroidConfig\(priority="high"\),

        apns=messaging\.APNSConfig\(

            payload=messaging\.APNSPayload\(

                aps=messaging\.Aps\(sound="default", badge=1\)

            \)

        \)

    \)

    messaging\.send\_each\_for\_multicast\(message\)

## __9\.7 開發里程碑__

以一位全端工程師每週 40 小時為基準，總計 10 週完成 MVP，含基本測試與部署。

__週次__

__里程碑__

__主要任務__

Week 1

專案初始化 \+ 環境設定

建立 FastAPI 專案結構、設定 SQLAlchemy \+ Alembic、Render\.com 部署設定、Cloudflare Pages 設定、環境變數管理（\.env）

Week 2

資料庫 Schema \+ 認證 API

Alembic 初始遷移（users / tasks / checklist\_items / parcels）、POST /auth/register、POST /auth/login、JWT middleware、bcrypt 密碼雜湊

Week 3

Task CRUD API

GET/POST/PATCH/DELETE /tasks、POST /tasks 含 ChecklistItem 批次建立、PATCH /tasks/\{id\}/items/\{item\_id\} 勾選介面、Pydantic schema 驗證

Week 4

Parcel API \+ Map8 代理

CRUD /parcels、PATCH /parcels/\{id\}/pickup、GET /map/search Map8 Places 代理、後端環境變數注入 Map8 API Key

Week 5

地理圍欄引擎 \+ FCM

POST /location 端點、Haversine 計算模組、時間視窗判斷、靜音時段過濾、firebase\-admin 初始化、send\_fcm\_notification 封裝、端到端觸發測試

Week 6

前端骨架 \+ 認證

Vite React PWA 初始化、React Router 路由、Login / Register 頁、JWT 儲存（memory \+ refresh token in httpOnly cookie）、Axios interceptor 自動 refresh

Week 7

前端：任務列表 \+ 新增任務流程

Home 頁任務卡片、新增任務 Bottom Sheet（類型選擇）、時間設定元件（單點 / 區間）、Map8 JS SDK 整合（地圖顯示 \+ 地標搜尋 \+ 定位針拖拉）

Week 8

前端：代辦清單 \+ 取貨提醒 \+ 推播

ChecklistItem 勾選 UI、取貨提醒新增頁（手動輸入）、取貨卡片首頁區塊、PWA Manifest \+ Service Worker、FCM Web Push 整合（getToken / onMessage）

Week 9

前端：GPS 輪詢 \+ 整合測試

GPS 上傳 setInterval（5 分鐘）、前端 FCM Token 上傳至後端、模擬靠近地點的端到端觸發流程測試（手動模擬座標）、iOS Safari 加入主畫面測試

Week 10

Bug Fix \+ 上線準備

Bug 修復、基本 UI 美化（Tailwind CSS 調整）、API 錯誤處理 \+ 前端 Toast 提示、Render\.com 生產環境設定、Cloudflare Pages 自訂網域、軟上線（Beta 測試邀請）

## __9\.8 免費方案資源總覽__

__服務__

__免費額度__

__主要限制__

__超出後選項__

__Render\.com Web Service__

750 小時 / 月（單 Service 可全月不斷）

閒置 15 分鐘冷啟動（30–60 秒）；0\.1 CPU / 512 MB RAM

Starter $7/月（無冷啟動）

__Render\.com PostgreSQL__

500 MB 儲存；90 天有效期後需手動續約

90 天到期需手動操作；無自動備份

Pro $7/月（無限期 \+ 備份）

__Firebase FCM__

免費，無訊息數量上限

需 Google 帳號 \+ Firebase 專案；APNs 設定需 Apple 開發者帳號

永久免費

__Firebase Authentication__

10,000 MAU / 月免費

MVP 階段遠低於上限；若不採用 Firebase Auth 可自建 JWT

Spark 計畫超出後 $0\.0055 / MAU

__Map8（台灣地圖）__

免費方案（詳見官方公告）

後端快取 24 小時可大幅降低呼叫次數

依使用量計費

__Cloudflare Pages__

無限靜態請求；500 次 / 月 Build；免費 SSL \+ CDN

僅靜態檔案 hosting；CI/CD Build 次數上限

Pro $20/月（500 次→20,000 次 Build）

__Apple 開發者帳號__

—

iOS APNs 推播必須付費 $99 USD / 年；PWA 加入主畫面可不需要（iOS 16\.4\+ 推播）

$99 USD / 年（App Store 上架）

__MVP 月費總計估算__

Render\.com Web Service：$0（Free）

Render\.com PostgreSQL：$0（Free，需每 90 天手動續約）

Firebase FCM \+ Auth：$0（免費額度內）

Map8 地圖 API：$0（免費額度內）

Cloudflare Pages：$0（Free）

Apple 開發者帳號：$0（MVP 先跑 PWA，不上 App Store）

合計：$0 / 月（純 PWA，不含 App Store 上架）

若需上架 iOS App Store：\+$99 USD / 年（Apple 開發者帳號）

# __附錄：版本紀錄與聯絡資訊__

__版本__

__日期__

__修訂內容__

__作者__

v1\.0

2026\-04\-22

初稿建立

開發團隊

如有任何問題或建議，請聯繫產品負責人。本文件為開發討論基礎，規格細節將隨需求評審持續更新。

