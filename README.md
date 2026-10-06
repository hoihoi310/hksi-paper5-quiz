# HKSI Paper 5 Quiz

HKSI Paper 5 練習網站，使用 GitHub Pages 發布。題目在瀏覽器直接載入，朋友打開網站連結即可作答；目前題庫包含 1,000 題。

## 本機模式

下載或 clone 此 repo，然後直接用瀏覽器開啟 `hksi_paper5_quiz_supabase.html`。完成紀錄和錯題會保存在該瀏覽器的 local storage，不需要登入或 Supabase。

## 發布到 GitHub Pages

1. 將此專案推送到 GitHub 上的 repo。
2. 在 repo 的 **Settings → Pages → Build and deployment**，將來源設為 **GitHub Actions**。
3. 到 **Actions** 頁面確認 `Deploy to GitHub Pages` 工作流程成功。
4. GitHub 會在 Pages 設定頁顯示可分享的網站網址。

每次推送到 `main` 分支都會重新發布。也可以在 Actions 頁面手動執行部署。

## 跨裝置同步（可選）

不設定 Supabase 時，刷題仍可使用；登入按鈕不會生效，資料只保存在目前瀏覽器。要啟用 Email 登入、雲端成績及錯題同步：

1. 建立 Supabase 專案，並在 SQL Editor 執行 `supabase/schema.sql`。
2. 編輯 `supabase/config.js`，填入 Project URL 和 anon/publishable key。此 key 是前端公開 key，資料安全依賴 SQL 中的 Row Level Security 政策；不可放入 service role key。
3. 在 Supabase Authentication 的 URL 設定中加入 GitHub Pages 網址作為 Site URL 和 Redirect URL。
4. 在 Authentication → Providers → Email，關閉 **Confirm email**。否則新帳戶會套用 `Confirm signup` 模板，寄出「Confirm your email address」連結，而不是 OTP。
5. 在 Authentication → Emails → Magic link or OTP，將郵件模板設定為只寄送一次性驗證碼。保留 `{{ .Token }}`，移除包含 `{{ .ConfirmationURL }}` 的 `<a href=...>` 段落；否則同一封郵件會同時出現驗證碼和登入連結。

網站也能處理誤收到的登入連結：點擊連結回到網站後會直接建立登入狀態。不過若要使用頁面上的「輸入驗證碼」流程，模板必須移除 `{{ .ConfirmationURL }}`。

請勿將任何 Supabase service role key 或其他伺服器密鑰放進此 repo。

## 題庫

`database/` 內保存原始 JSON 題庫，網站直接內嵌合併後的題目，以便 GitHub Pages 靜態發布。

題庫格式化及嵌入 HTML 的指令：

```text
node scripts/build-question-bank.mjs
```

腳本會讀取 `database/*.json`，支援舊有陣列格式及帶有 `questions`、選項物件的新格式，檢查題目 ID、答案及 A-D 選項，然後更新 `hksi_paper5_quiz_supabase.html`。新增或修改題目後重新執行一次即可。
