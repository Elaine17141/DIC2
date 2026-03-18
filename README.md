# 🤖 Reinforcement Learning Grid Map (DIC2)

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Framework-Flask-lightgrey.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> [!TIP]
> **🚀 Live Demo**: [https://elaine17141.github.io/DIC2/](https://elaine17141.github.io/DIC2/)

本專案是一個基於 **強化學習 (Reinforcement Learning)** 理論開發的互動式網格地圖模擬器。使用者可自定義 $n \times n$ 的地圖配置，並交由後端伺服器運用 **價值迭代 (Value Iteration)** 演算法，即時推算並視覺化各狀態的「最大期望價值矩陣」以及達到目標的「最佳動作策略」。

---

## 📑 目錄
- [✨ 功能亮點](#-功能亮點)
- [🧩 專案架構](#-專案架構)
- [🧠 演算法原理](#-演算法原理)
- [🚀 快速開始](#-快速開始)
- [📖 使用說明](#-使用說明)

---

## ✨ 功能亮點

- **🛠️ 高度自定義**：支援 3x3 至 10x10 的動態網格生成。
- **🖱️ 直觀交互**：
  - **綠色單元格**：起點 (Start State)
  - **紅色單元格**：終點 (Terminal State)
  - **灰色單元格**：障礙物 (Walls/Blocked States)
- **📊 雙重矩陣視圖**：
  - **Value Matrix**：顯示每個狀態經過價值迭代收斂後的精確**最大預期價值 $V^*(s)$**。
  - **Policy Matrix**：顯示推導出的**最佳動作路徑**（指向最高價值鄰居的最佳行動箭頭），完美避開障礙物並以最高效率走向終點。
- **⚡ 伺服器運算**：前端畫面採用非同步請求 (Fetch API)，結合 Flask 後端運算核心確保精確的價值迭代推導。

---

## 🧩 專案架構

```text
.
├── app.py              # Flask 後端主程式 (實作 Value Iteration 與提供 API)
├── solve.py            # Python 測試腳本 (可由終端機印出最佳政策與價值)
├── templates/
│   └── index.html      # 主頁面結構
├── static/
│   ├── style.css       # 現代化 UI 樣式 (Glassmorphism 風格)
│   └── script.js       # 前端互動邏輯與網格渲染
├── requirements.txt    # 專案依賴套件
└── README.md           # 專案說明文件
```

---

## 🧠 演算法原理

本專案的核心基於求解 **Bellman Optimality Equation** 的 **價值迭代 (Value Iteration)** 演算法：

### 1. 價值迭代 (Value Iteration)
系統會在每個狀態下，評估所有可能動作（上、下、左、右）帶來的期望回報，並不斷更新該狀態的最大價值，直到全域收斂。
$$V_{k+1}(s) = \max_{a \in A} \sum_{s', r} p(s', r | s, a) [r + \gamma V_k(s')]$$

收斂後，系統會依據最終的價值矩陣，針對每一個狀態反推能獲得最大期望回報的動作，形成最佳政策 $\pi^*(s)$。

### 2. 環境參數設定
- **折扣因子 ($\gamma$)**：$0.9$ (注重未來獎勵的程度)。
- **獎勵函數 (Reward Function)**：
  - 進入終點：$+10$
  - 一般移動或撞牆：$-1$ (生存懲罰，激勵 Agent 尋找最短路徑)。
- **邊界與牆壁**：遇到牆壁或地圖邊緣將會留在原地不動 (不會越界)。
- **收斂條件**：$\max_s |V_{k+1}(s) - V_k(s)| < 10^{-4}$。

---

## 🚀 快速開始

### 環境需求
- Python 3.8+
- 現代瀏覽器 (Chrome, Edge, Safari, Firefox)

### 步驟 1: 安裝依賴
```bash
pip install -r requirements.txt
```

### 步驟 2: 啟動 Flask 專案
```bash
python app.py
```

### 步驟 3: 訪問網頁
開啟瀏覽器前往 [http://127.0.0.1:5000](http://127.0.0.1:5000) 即可開始互動體驗。

---

## 📖 使用說明

1. **設定規模**：輸入地圖大小 (n) 並點擊 `Generate Grid`。
2. **三步配置**：
   - 第一下：設定**起點** (綠色)。
   - 第二下：設定**終點** (紅色)。
   - 第三下及後續：點擊格子以新增/刪除**牆壁** (灰色)。
3. **執行計算**：點擊 `Calculate V(s)` 將網格狀態送交給 Flask 伺服器運算。
4. **查看結果**：系統會以動畫切換至結果分頁。右側清晰顯示出 **最佳指引箭頭 (Policy)**，左側為 **對應的最大價值 (Value)**。若有多條等價的最佳路徑，格子中將同時並列顯示多個方向箭頭。

---
> *Developed for Deep Reinforcement Learning Course (DIC2)*
