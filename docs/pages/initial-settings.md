# 初期設定画面

## 画面の目的

- アカウント登録後に、学習言語・学習目標・目標学習時間を入力する画面
- 初回登録と、あとからの変更の両方で使う

---

## ざっくりまとめ

- 画面表示時：GET で言語・設定を取得してフォームへ反映
- 保存時：入力チェック → POST → API が DB へ保存
- 初期設定は upsert、目標は全削除して再登録

---

## API（`app/api/initial-settings/route.ts`）

### 全体の流れ

1. **GET** … 画面表示時に、現在の設定を取得してフォームへ表示
2. ユーザーが画面で編集
3. **POST** … 入力内容を検証し、DBへ保存（更新または新規作成）

---

### GET（取得）

**用途：** 画面表示時に、言語一覧と保存済みの初期設定を取る

**DBでの処理：**

1. **言語一覧（`programmingLanguage`）**
   - 言語IDの昇順で取得
   - 言語IDと言語名だけ返す

2. **初期設定（`initialSetting`）**
   - 指定ユーザーIDの初期設定を1件取得
   - 紐づく目標（`userGoals`）も一緒に取得（目標IDの昇順）

**返すもの：**

- `languages` … プルダウン用の言語一覧
- `setting` … 初期設定。未登録なら `null`
  - 登録済みのときは、言語ID・平日/休日の時間・目標一覧 `goals` を含む
  - 目標は `goal_id`・`goal_type`・`goal_title` の3項目だけ返す

**失敗時：**

- ステータス 500
- `{ error: "初期設定の取得に失敗しました" }`

---

### POST（保存）

**用途：** フォームの内容を登録・更新する

**受け取るもの：**

- 言語ID
- 平日の目標時間（時・分）
- 休日の目標時間（時・分）
- 目標一覧 `goals`（`goal_type`・`goal_title`）

**チェック：**

1. 必須項目の確認 … 言語ID・時間・目標が未入力なら 400
2. 目標の中身の確認 … 目標タイプや目標タイトルが未入力・空白だけなら 400
3. どちらも `{ error: "未入力の項目があります" }` を返す

**DBでの処理：**

トランザクション（`$transaction`）内で、次の3つをまとめて実行する。途中で失敗したら、すべて取り消す。

1. **初期設定テーブル（`initialSetting`）を `upsert`**
   - そのユーザーIDの初期設定がある → 更新
   - ない → 新規作成
   - 保存する内容：言語ID、平日/休日の時間

2. **目標テーブル（`userGoal`）の既存データを削除**
   - そのユーザーIDの目標をすべて `deleteMany`

3. **目標テーブルへ再登録**
   - 画面から送られた目標を `createMany` でまとめて登録
   - 変更のない目標も含め、毎回入れ替える方式

**成功時：**

- `{ message: "登録しました" }`

**失敗時：**

- ステータス 500
- `{ error: "初期設定の保存に失敗しました" }`

---

## 画面の処理

### app/initial-settings/page.tsx

#### 全体の流れ

1. 画面を開く → API から既存データを取得してフォームへ表示
2. ユーザーが入力・編集
3. 「保存」ボタン → 入力チェック → API へ POST

---

#### 型・定数（23〜63行目）

- `Language` … 言語1件（ID・名前）
- `Period` … 目標期間（short / medium / long）
- `GoalInput` … 目標1件（id・title）
- `GoalsByPeriod` … 短期・中期・長期ごとの目標配列
- `PERIODS` … 期間名と `goal_type`（1/2/3）の対応表
- `emptyGoal()` … 空の目標1件を作る（画面用の一時ID付き）
- `emptyGoalsByPeriod()` … 各期間に空欄1件ずつ入れた初期状態

---

#### state（67〜74行目）

画面上の入力値を保持する。

- `languages` … 言語プルダウンの候補一覧
- `language` … 選択中の言語ID
- `goalsByPeriod` … 短期・中期・長期の目標一覧
- `weekdayHour` / `weekdayMinute` … 平日の目標時間
- `holidayHour` / `holidayMinute` … 休日の目標時間

---

#### 画面表示時の取得（`useEffect` / 81〜128行目）

**いつ動く：** ページを開いたときに1回（`useEffect(..., [])`）

**やること：**

1. `GET /api/initial-settings` でデータ取得
2. 失敗したら `console.error` して終了
3. `setLanguages(data.languages ?? [])` で言語候補を反映
4. `data.setting` があるかで分岐
   - **未登録（`null`）** … 言語候補だけ表示。選択値・時間・目標は初期値のまま
   - **登録済み** … 下記 5〜8 を実行
5. 保存済みの言語・平日/休日の時間を state にセット
6. 短期・中期・長期用の空配列 `next` を用意
7. 保存済み目標を1件ずつ見て、`goal_type` から期間を特定し `next` へ追加  
   （期間が分からない目標は `continue` で飛ばす）
8. 目標が0件の期間には空欄1件を追加 → `setGoalsByPeriod(next)`
9. 例外が出たら `catch` で `console.error`

---

#### 保存（`handleRegister` / 131〜173行目）

**いつ動く：** 362行目の「保存」ボタン（`onClick={handleRegister}`）

**やること：**

1. 短期・中期・長期の目標を1つの `goals` 配列にまとめる  
   - 空白だけの目標は除外  
   - `{ goal_type, goal_title }` の形に変換
2. 未入力チェック（言語・時間・目標が1件以上）  
   → 問題あれば `alert` して終了
3. `POST /api/initial-settings` で送信（DB保存は API 側）
4. 失敗 → API のエラーを `alert`  
   成功 → `alert("保存しました")`

---

#### 目標の操作（175〜200行目）

- `addGoal(period)` … その期間に空の目標入力欄を1件追加
- `updateGoalTitle(period, id, title)` … 入力中の目標名を更新
- `removeGoal(period, id)` … 目標を削除（短期だけは最低1件残す）

---

#### 画面表示（202〜368行目）

- 学習言語（212〜233行目）… `languages` を Select で表示
- 短期・中期・長期目標（235〜272行目）… `goalsByPeriod` を Input で表示。追加・削除ボタンあり
- 平日の目標学習時間（276〜316行目）… 0〜23時、0〜59分の Select
- 休日の目標学習時間（318〜357行目）… 0〜23時、0〜59分の Select
- 保存ボタン（360〜365行目）… `onClick={handleRegister}`
