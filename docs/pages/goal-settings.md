# 目標入力画面

## 画面の目的

- 短期・中期・長期の学習目標と、平日/休日の目標学習時間を入力する画面
- 初回は初期設定の内容をもとに表示し、保存後は目標入力の内容を表示する

---

## ざっくりまとめ

- 画面表示時：GET で目標入力（または初期設定）を取得してフォームへ反映
- 保存時：入力チェック → POST → API が DB へ保存
- 目標入力は upsert、目標内容は全削除して再登録

---

## API（`app/api/goal-settings/route.ts`）

### 全体の流れ

1. **GET** … 画面表示時に、保存済み目標入力または初期設定を取得してフォームへ表示
2. ユーザーが画面で編集
3. **POST** … 入力内容を検証し、DBへ保存（更新または新規作成）

---

### GET（取得）

**用途：** 画面表示時に、目標入力の内容を取る（未保存なら初期設定を使う）

**DBでの処理：**

1. **目標入力（`goalSetting`）を確認**
   - 指定ユーザーIDの目標入力があれば、紐づく目標内容（`userGoalContents`）も一緒に取得
   - → `source: "saved"` で返す

2. **目標入力がなければ初期設定（`initialSetting`）を確認**
   - 初期設定もなければ → `source: "empty"` で返す
   - 初期設定があれば → `source: "initial"` で返す（目標内容は空文字）

**返すもの：**

- `source` … データの出どころ
  - `"saved"` … 保存済みの平日/休日目標学習時間、メモ、目標内容
  - `"initial"` … 初期設定の時間・目標（目標内容は空）
  - `"empty"` … 未登録。各項目は `null`、目標は空配列
- `weekday_hours` / `weekday_minutes` / `holiday_hours` / `holiday_minutes`
- `memo`
- `goals` … 目標一覧（`goal_id`・`goal_type`・`goal_title`・`goal_subject`・`is_completed`）

**失敗時：**

- ステータス 500
- `{ error: "目標入力の取得に失敗しました" }`

---

### POST（保存）

**用途：** 目標入力を登録・更新する

**受け取るもの：**

- 平日の目標時間（時・分）
- 休日の目標時間（時・分）
- メモ（任意）
- 目標一覧 `goals`（`goal_type`・`goal_title`・`goal_subject`・`is_completed`）

**チェック：**

1. 必須項目の確認 … 時間・目標が未入力なら 400
2. 目標の中身の確認 … 目標タイプ・目標タイトル・目標内容が未入力・空白だけなら 400
3. どちらも `{ error: "未入力の項目があります" }` を返す
4. メモは未入力でも OK

**DBでの処理：**

トランザクション（`$transaction`）内で、次の3つをまとめて実行する。途中で失敗したら、すべて取り消す。

1. **目標入力テーブル（`goalSetting`）を `upsert`**
   - そのユーザーIDの目標入力がある → 更新
   - ない → 新規作成
   - 保存する内容：平日/休日の時間、メモ

2. **目標内容テーブル（`userGoalContent`）の既存データを削除**
   - そのユーザーIDの目標内容をすべて `deleteMany`

3. **目標内容テーブルへ再登録**
   - 画面から送られた目標を `createMany` でまとめて登録
   - `goal_id` は配列の順番（1から）で付与
   - 変更のない目標も含め、毎回入れ替える方式

**成功時：**

- `{ message: "登録しました" }`

**失敗時：**

- ステータス 500
- `{ error: "目標入力の保存に失敗しました" }`

---

## 画面の処理

### app/goal-settings/page.tsx

#### 全体の流れ

1. 画面を開く → API から既存データを取得してフォームへ表示
2. ユーザーが入力・編集
3. 「登録」ボタン → 入力チェック → API へ POST

---

#### 型・定数（23〜61行目）

- `Period` … 目標期間（short / medium / long）
- `GoalInput` … 目標1件（id・title・content・completed）
- `GoalsByPeriod` … 短期・中期・長期ごとの目標配列
- `PERIODS` … 期間名と `goal_type`（1/2/3）の対応表
- `emptyGoal()` … 空の目標1件を作る（画面用の一時ID付き）
- `emptyGoalsByPeriod()` … 短期のみ空欄1件を入れた初期状態

---

#### state（64〜71行目）

画面上の入力値を保持する。

- `goalsByPeriod` … 短期・中期・長期の目標一覧
- `weekdayHour` / `weekdayMinute` … 平日の目標時間
- `holidayHour` / `holidayMinute` … 休日の目標時間
- `memo` … メモ（任意）

---

#### 画面表示時の取得（`useEffect` / 77〜123行目）

**いつ動く：** ページを開いたときに1回（`useEffect(..., [])`）

**やること：**

1. `GET /api/goal-settings` でデータ取得
2. 失敗したら `console.error` して終了
3. 時間が取得できていれば、平日/休日の時間を state にセット
4. `setMemo(data.memo ?? "")` でメモを反映
5. 短期・中期・長期用の空配列 `next` を用意
6. 目標を1件ずつ見て、`goal_type` から期間を特定し `next` へ追加  
   （期間が分からない目標は `continue` で飛ばす）
7. 短期目標が0件なら空欄1件を追加 → `setGoalsByPeriod(next)`
8. 例外が出たら `catch` で `console.error`

**データの出どころによる見え方：**

- `source: "saved"` … 保存済みの時間・メモ・目標内容を表示
- `source: "initial"` … 初期設定の時間・目標タイトルを表示（目標内容は空）
- `source: "empty"` … 時間・メモは未入力、短期のみ空欄1件

---

#### 保存（`handleRegister` / 170〜217行目）

**いつ動く：** 369行目の「登録」ボタン（`onClick={handleRegister}`）

**やること：**

1. 短期・中期・長期の目標を1つの `goals` 配列にまとめる  
   - タイトルが空白だけの目標は除外  
   - `{ goal_type, goal_title, goal_subject, is_completed }` の形に変換
2. 目標内容が空の目標がないか確認（`hasMissingContent`）
3. 未入力チェック（時間・目標が1件以上・目標内容あり）  
   → 問題あれば `alert` して終了
4. `POST /api/goal-settings` で送信（DB保存は API 側）
5. 失敗 → API のエラーを `alert`  
   成功 → `alert("登録しました")`

---

#### 目標の操作（125〜168行目）

- `addGoal(period)` … その期間に空の目標入力欄を1件追加
- `updateGoal(period, id, field, value)` … 目標タイトルまたは目標内容を更新
- `toggleGoalCompleted(period, id, completed)` … 目標の完了状態を切り替え
- `removeGoal(period, id)` … 目標を削除（短期だけは最低1件残す）

---

#### 画面表示（219〜375行目）

- 短期・中期・長期目標（227〜282行目）… チェックボックス・目標タイトル・目標内容・追加/削除ボタン
- 平日の目標学習時間（284〜317行目）… 0〜23時、0〜59分の Select
- 休日の目標学習時間（319〜352行目）… 0〜23時、0〜59分の Select
- メモ（354〜364行目）… 任意入力の textarea
- 登録ボタン（367〜372行目）… `onClick={handleRegister}`
