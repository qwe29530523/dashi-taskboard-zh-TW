# 面向個人使用者的三列議題工作臺：ChatGPT Pro 協作與驗收記錄

## 協作資訊

- ChatGPT Pro 對話：https://chatgpt.com/c/6a6b2b0e-9dc0-83ea-a57e-3addec457e70
- 原始碼基線：`677b54451db707ae6132486b6593b7be11e4ee09`
- 提交給 ChatGPT Pro 的原始碼 ZIP：
  - 檔案：`codex-taskboard-pro-677b544.zip`
  - 位元組數：`1,645,317`
  - SHA-256：`a1a96179554d69cb2770910c7857981fa2a14fb39afcaa6e6fcfc0b07a17fef6`
- ChatGPT Pro 交付 ZIP：
  - 檔案：`codex-taskboard-pro-3col-board.zip`
  - 位元組數：`1,635,271`
  - SHA-256：`a3cca47873283f4eec2a4710fb46f7cd5427bdc310318494598b7db3ca6cf14e`
- ChatGPT Pro 主補丁：
  - 檔案：`codex-taskboard-pro-3col-board.patch`
  - 位元組數：`67,714`
  - SHA-256：`5393f54db5c5e2dca8071f2a999dda49a39da4058076945320455b223f7b832a`
- ChatGPT Pro 修正補丁：
  - 檔案：`codex-taskboard-pro-3col-board-fix.patch`
  - 位元組數：`3,035`
  - SHA-256：`091df00ba8e1d9304f86109f731564de06f5301f574b7a90ece4f1a0353f1044`

## 實現範圍

- 主工作臺固定顯示 `todo`、`in_progress`、`in_review` 三列。
- 三列文案改為“待處理”“處理中”“等你確認”。
- `backlog`、`blocked`、`done`、`canceled` 收入右側“其他任務”面板。
- 側面板支援四個狀態 Tab、計數、詳情入口、篩選同步和現有任務卡操作。
- 保留七狀態領域模型、API、CLI、資料庫和即時同步鏈路。
- 全域新建議題預設進入 `todo`；列內新建仍使用所在列狀態。
- 刪除舊的空列顯示、手動隱藏列和“隱藏列”執行路徑。
- 流程看板入口仍保持隱藏。

## 要求 ChatGPT Pro 修正的問題

首次交付為讓目標測試全部透過，順帶修改了評論附件和自動認領功能的舊測試斷言。這超出本次範圍。已要求並取得最小修正補丁：

- 恢復評論附件測試的基線斷言。
- 恢復自動認領測試的基線斷言。
- 只保留刪除 `BoardSettingsMenu.tsx` 所需的兩處測試改動。
- 未修改執行時程式碼、依賴、鎖檔案或其他測試。

## 獨立驗收

- 原始碼 ZIP 展開後金鑰掃描：`0` 條。
- ZIP 與主補丁應用後的原始碼：逐檔案一致。
- 主補丁和修正補丁：`git apply --check` 透過。
- `package.json` 和 `package-lock.json`：與基線逐位元組一致。
- `npm run typecheck`：透過。
- `npm run build:web`：透過。
- 當前工作樹相關合同測試：`22/22` 透過。
- 當前工作樹生產構建：透過。
- Codex 注入重新整理：埠 `9231`，`refreshed: true`。
- 當前本地管理面板：已確認顯示三列和“其他任務”入口。

完整 `npm test` 在安裝鎖檔案完整依賴後執行：

- 基線：`349` 項，`332` 透過，`17` 失敗。
- 修改後：`350` 項，`333` 透過，`17` 失敗。
- 失敗專案集合與基線一致，本次沒有新增失敗。

隔離資料目錄中的真實頁面已驗證：

- 三個主狀態列固定顯示。
- “其他任務”面板預設關閉，可開啟和關閉。
- 四個狀態 Tab、計數和內容正確。
- 面板任務可進入詳情，返回後保留活動 Tab。
- 搜尋同時作用於主列和側面板。
- 面板任務遷移到主列後，重新整理頁面仍保持新狀態。

未自動執行原生指標拖拽。當前瀏覽器驅動未暴露拖拽動作；已檢查真實拖拽鏈路仍復用 `TaskCard` 的 `dataTransfer` 和 `BoardColumn` 的原有 `onDrop`、排序及持久化流程。

## 當前狀態

- 修改只存在於本地 `feature/consumer-task-board` 分支工作樹。
- 未提交、未推送、未建立 PR、未部署。
- 未遷移資料庫，未修改線上配置，未操作真實使用者資料。
