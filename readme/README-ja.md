<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# プロキシアシスタント

</div>

<div align="center">

[![Chrome拡張機能](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Firefox拡張機能](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![多言語](https://img.shields.io/badge/多言語-yellow)](README-ja.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [**日本語**](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

強力なブラウザプロキシ管理拡張機能。ChromeとFirefoxに対応し、ネットワークプロキシの構成と切り替えが簡単になります。

</div>

![](../public/img/promotion/1400-560.png)

## 1. ✨ 機能特徴

### 1.1 🔌 複数のプロキシプロトコル対応
- **HTTP** - 従来型HTTPプロキシ
- **HTTPS** - 安全なHTTPSプロキシ
- **SOCKS5** - TCP/UDP対応SOCKS5プロキシ
- **SOCKS4** - 旧SOCKS4プロキシ互換性

### 1.2 🌐 マルチブラウザ対応
- **Chrome** - Manifest V3 + Service Workerを使用
- **Firefox** - onRequest APIでプロキシをインターセプト

### 1.3 🔄 3つのプロキシモード

| モード | 説明 |
|--------|------|
| **無効** | プロキシを無効化し、システムデフォルトのネットワーク接続を使用 |
| **手動** | リストから手動でプロキシを選択 |
| **自動** | URLルールに基づいて自動的にプロキシを選択（PACモード） |

![](../public/img/promotion/1280-800-03.png)

### 1.4 📋 柔軟なURLルール設定

- **プロキシを使用しないアドレス** (`bypass_urls`): 手動モードで直接接続するドメイン/IP
- **プロキシを使用するアドレス** (`include_urls`): 自動モードでプロキシ経由でアクセスするドメイン
- **フォールバックポリシー**: 自動モードで接続失敗時に直接接続または拒否を選択
- ワイルドカード `*` とドメイン一致対応
- 異なるウェブサイトに異なるプロキシを使用するシナリオに最適

### 1.5 🔐 プロキシ認証対応

- ユーザー名/パスワード認証対応
- プロキシサーバーからの認証リクエストを自動処理
- 資格情報の安全な保存

### 1.6 🧪 プロキシテスト機能

- **接続テスト**: プロキシの可用性を確認
- **遅延測定**: プロキシの応答時間をテスト
- **一括テスト**: ワンクリックで全プロキシをテスト
- **カラー表示**: 緑(<500ms) / オレンジ(≥500ms) / 赤(失敗)

### 1.7 🏃 プロキシ状態検出

- 現在のブラウザプロキシ設定を検出
- 拡張機能がプロキシを正常に設定しているかを検証
- 他の拡張機能によるプロキシ制御を識別
- 正常、警告、エラーの3つの結果を提供

### 1.8 🔍 PACスクリプトプレビュー

- **スクリプト表示**: 自動生成されたPACスクリプトの内容を表示
- **ルールリスト**: 有効なプロキシマッチングルールを明確に表示
- **デバッグサポート**: 自動モードでのマッチング問題のトラブルシューティングを容易に

### 1.9 🌙 テーマモード

- **ライトモード**: 日中使用
- **ダークモード**: 夜間使用
- **自動切り替え**: 時間に応じてテーマを自動切り替え（設定可能）

![](../public/img/promotion/1280-800-02.png)

### 1.10 ☁️ データストレージと同期

#### 1.10.1 ストレージ戦略

| ストレージタイプ | ストレージ内容 | 説明 |
|-----------------|----------------|------|
| **ローカルストレージ (local)** | プロキシリスト、テーマ設定、言語設定、同期設定 | 常に有効、オフライン利用とデータ永続性を確保 |
| **クラウド同期 (sync)** | 完全な構成データ（チャンクストレージ） | オプション、チャンクストレージを使用してクォータ制限を回避 |

#### 1.10.2 同期方式

##### 1.10.2.1 ブラウザネイティブ同期 (Native Sync)
- `chrome.storage.sync` API（Chrome）または `browser.storage.sync`（Firefox）を使用
- Chrome/Firefoxアカウントによる自動同期
- 同一ブラウザアカウントの複数デバイス同期に最適
- **チャンクストレージ**: 構成データは自動的にチャンク化（7KB/チャンク）され、8KBの単一アイテムクォータ制限を回避
- **データ整合性**: チェックサムを使用して同期データの整合性を確保
- **アトミック操作**: Push操作は、一貫性を確保するために、新しいデータを書き込む前に古いデータをクリアします
- **クォータ表示**: 使用済み/総クォータ（100KB）とチャンク数をリアルタイムで表示

##### 1.10.2.2 GitHub Gist同期
- GitHub Gistを介してブラウザ間、デバイス間の構成同期を実現
- GitHub Personal Access Tokenの設定が必要
- 手動プッシュ/プルまたは自動同期に対応
- 構成内容は暗号化保存、エクスポート時に敏感情報を自動的にクリア

| 設定項目 | 説明 |
|----------|------|
| **アクセスキー** | GitHub Personal Access Token（gist権限が必要） |
| **ファイル名** | Gist内のファイル名、デフォルト `proxy_assistant_config.json` |
| **Gist ID** | 自動的に識別・保存、手動入力不要 |

#### 1.10.3 同期操作

| 操作 | 説明 |
|------|------|
| **プッシュ (Push)** | ローカル構成をクラウド/Gistにアップロード |
| **プル (Pull)** | クラウド/Gistから構成をローカルにダウンロード |
| **接続テスト** | Gist Tokenの有効性と構成状態を確認 |

#### 1.10.4 インポート/エクスポート

- **構成エクスポート**: すべてのプロキシ情報、テーマ設定、言語設定などを含むJSONファイルを生成
- **構成インポート**: JSONファイルから構成を復元に対応
- **データセキュリティ**: エクスポートファイルは敏感情報（Token、パスワード）を自動的にクリア
- **フォーマット互換性**: 旧バージョンの構成ファイルのインポートに対応

**エクスポート内容構造:**
```json
{
  "version": 1,
  "settings": {
    "appLanguage": "zh-CN",
    "themeMode": "light",
    "nightModeStart": "22:00",
    "nightModeEnd": "06:00"
  },
  "sync": {
    "type": "native",
    "gist": { "filename": "proxy_assistant_config.json" }
  },
  "proxies": [
    {
      "name": "My Proxy",
      "protocol": "http",
      "ip": "192.168.1.1",
      "port": "8080",
      "username": "",
      "password": "",
      "fallback_policy": "direct",
      "include_urls": "",
      "bypass_urls": ""
    }
  ]
}
```

### 1.11 🌍 多言語対応

この拡張機能は以下の言語に対応：

| 言語 | コード | 対応状況 |
|------|--------|----------|
| 简体中文 | zh-CN | ✅ 対応済み |
| 繁體中文 | zh-TW | ✅ 対応済み |
| English | en | ✅ 対応済み |
| 日本語 | ja | ✅ 対応済み |
| Français | fr | ✅ 対応済み |
| Deutsch | de | ✅ 対応済み |
| Español | es | ✅ 対応済み |
| Português | pt | ✅ 対応済み |
| Русский | ru | ✅ 対応済み |
| 한국어 | ko | ✅ 対応済み |

![](../public/img/promotion/1280-800-04.png)

## 2. 📷 設定画面

![](../public/img/demo.png)

## 3. 📁 プロジェクト構成

```
ProxyAssistant/
├── conf/                     # サンプル設定
│   └── demo.json             # サンプル設定ファイル
├── readme/                   # 多言語ドキュメント
│   ├── README-zh-CN.md       # 簡体字中国語
│   ├── README-zh-TW.md       # 繁体字中国語
│   ├── README-en.md          # 英語
│   ├── README-ja.md          # 日本語
│   ├── README-fr.md          # フランス語
│   ├── README-de.md          # ドイツ語
│   ├── README-es.md          # スペイン語
│   ├── README-pt.md          # ポルトガル語
│   ├── README-ru.md          # ロシア語
│   └── README-ko.md          # 韓国語
├── src/                      # ソースコード
│   ├── manifest_chrome.json  # Chrome拡張機能設定 (Manifest V3)
│   ├── manifest_firefox.json # Firefox拡張機能設定
│   ├── main.html             # 設定ページ
│   ├── popup.html            # ポップアップページ
│   ├── js/
│   │   ├── main.js           # 設定ページメインロジック
│   │   ├── popup.js          # ポップアップUIロジック
│   │   ├── worker.js         # Service Worker (Chrome) / Background Script (Firefox)
│   │   ├── i18n.js           # 国際化対応
│   │   └── jquery.js         # jQueryライブラリ
│   ├── css/
│   │   ├── main.css          # 設定ページスタイル（共通コンポーネント含む）
│   │   ├── popup.css         # ポップアップスタイル
│   │   ├── theme.css         # テーマスタイル
│   │   └── eye-button.css    # パスワード表示ボタンスタイル
│   └── images/               # 画像リソース
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
├── public/                   # 公開リソース
    └── img/                  # デモおよびプロモーション画像
├── tests/                    # テスト
│   ├── jest.config.js        # Jest設定
│   ├── setup.js              # テスト環境設定
│   ├── __mocks__/            # Mockファイル
│   │   └── chrome.js         # Chrome API Mock
│   ├── unit/                 # ユニットテスト
│   ├── integration/          # 統合テスト
│   └── e2e/                  # E2Eテスト
├── script/                   # ビルドスクリプト
│   └── build.sh              # 拡張機能ビルドスクリプト
├── release/                  # リリースノート
│   └── *.md                  # バージョン更新ログ
├── build/                    # ビルド出力ディレクトリ
├── package.json              # プロジェクト依存関係
├── package-lock.json         # 依存バージョンロック
├── Makefile                  # ビルドコマンドエントリ
├── jest.config.js            # Jest設定（tests/jest.config.jsを指す）
└── AGENTS.md                 # 開発ガイド
```

## 4. 🚀 クイックスタート

### 4.1 拡張機能のインストール

#### 4.1.1 Chrome

**方法1（推奨）**: Chrome ウェブストアからインストール
1. Chromeブラウザを開き、[Chrome ウェブストア](https://chrome.google.com/webstore)にアクセス
2. 「プロキシアシスタント」を検索
3. 「Chromeに追加」をクリック

**方法2**: ローカルインストール
- **オプションA（ソースコード使用）**: ソースコードダウンロード、`src/manifest_chrome.json` を `manifest.json` にリネームし、`src` ディレクトリを読み込む
- **オプションB（パッケージ使用）**:
  1. [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) ページにアクセス
  2. `proxy-assistant-chrome-x.x.x.zip` ファイルをダウンロード
  3. ダウンロードしたZIPファイルを任意のディレクトリに解凍
  4. Chromeブラウザを開き、`chrome://extensions/`にアクセス
  5. 右上の **"デベロッパーモード"** を有効化
  6. 左上の **"パッケージ化されていない拡張機能を読み込む"** ボタンをクリック
  7. 手順3で解凍したフォルダを選択
  8. 拡張機能が拡張機能リストに表示されればインストール成功

#### 4.1.2 Firefox

**方法1（推奨）**: Firefox アドオンからインストール
1. Firefoxブラウザを開き、[Firefox アドオン](https://addons.mozilla.org/)にアクセス
2. 「プロキシアシスタント」を検索
3. 「Firefoxに追加」をクリック

**方法2**: ローカルインストール
1. releaseディレクトリからFirefox拡張機能パッケージ（`.xpi` ファイル）をダウンロード
2. Firefoxブラウザを開き、`about:addons`にアクセス
3. **歯車アイコン** → **ファイルからアドオンをインストール**
4. ダウンロードした `.xpi` ファイルを選択

#### 4.1.3 Microsoft Edge

EdgeブラウザはChromiumカーネルに基づいており、Chrome拡張機能を直接インストールできます。

**方法1（推奨）**: Chrome ウェブストアからインストール
1. Edgeブラウザを開き、`edge://extensions/`にアクセス
2. 「新しい拡張機能を 찾는」セクションで「Chrome ウェブストアから拡張機能を取得」をクリックし、[Chrome ウェブストア](https://chrome.google.com/webstore)にアクセス
3. 「プロキシアシスタント」を検索
4. 「取得」をクリックしてから「Microsoft Edgeに追加」

**方法2**: ローカルインストール
1. [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) ページにアクセス
2. `proxy-assistant-chrome-x.x.x.zip` ファイルをダウンロード
3. ダウンロードしたZIPファイルを任意のディレクトリに解压
4. Edgeブラウザを開き、`edge://extensions/`にアクセス
5. 左下の **"デベロッパーモード"** を有効化
6. **"解压したディレクトリを選択"** ボタンをクリック
7. 手順3で解压したフォルダを選択
8. 拡張機能が拡張機能リストに表示されればインストール成功

### 4.2 プロキシの追加

1. 拡張機能アイコンをクリックしてポップアップを開く
2. **「設定」** ボタンをクリックして設定ページを開く
3. **「プロキシを追加」** ボタンをクリックして新しいプロキシを追加
4. プロキシ情報を入力：
   - プロキシ名
   - プロトコルタイプ (HTTP/HTTPS/SOCKS4/SOCKS5)
   - プロキシアドレス (IPまたはドメイン)
   - ポート番号
   - （オプション）ユーザー名とパスワード
   - （オプション）URLルール設定
5. **「保存」** ボタンをクリック

### 4.3 プロキシの使用

**手動モード**:
1. ポップアップで **「手動」** モードを選択
2. リストから使用するプロキシを選択
3. 「接続済み」と表示されれば有効

**自動モード**:
1. ポップアップで **「自動」** モードを選択
2. 設定ページで各プロキシのURLルールを設定
3. ウェブサイトへのアクセス時に自動的にプロキシを選択

## 5. 🛠️ 開発ガイド

### 5.1 開発環境

**前提条件**:
- Node.js >= 14
- npm >= 6
- Chrome / Firefox ブラウザ（テスト用）
- web-ext（Firefox XPI ビルド用、オプション）

**依存関係のインストール**:
```bash
make test_init
# または
npm install
```

### 5.2 テストコマンド

| コマンド | 説明 |
|----------|------|
| `make test` | 全テスト実行（ユニット + 統合 + e2e） |
| `make test_nocache` | キャッシュなしでテスト実行 |
| `make test_unit` | ユニットテストのみ実行 |
| `make test_integration` | 統合テストのみ実行 |
| `make test_e2e` | e2eテストのみ実行 |
| `make test_watch_nocache` | ウォッチモードでテスト実行 |
| `make test_cov_nocache` | テスト実行してカバレッジレポート生成 |

**npmを直接使用**:
```bash
npm test                    # 全テスト実行
npm run test:unit           # ユニットテストのみ実行
npm run test:integration    # 統合テストのみ実行
npm run test:e2e            # e2eテストのみ実行
npm run test:watch          # ウォッチモードでテスト実行
npm run test:coverage       # テスト実行してカバレッジレポート生成
```

### 5.3 ビルドコマンド

| コマンド | 説明 |
|----------|------|
| `make build` | ChromeとFirefox拡張機能をビルド |
| `make clean` | ビルド成果物をクリーン |
| `make test_clean` | テストキャッシュとカバレッジファイルをクリーン |

**バージョン指定**:
```bash
make build VERSION=1.3.1
# または
./script/build.sh 1.3.1
```

**ビルド成果物**:
```
build/
├── ProxyAssistant_{VERSION}_chrome.zip      # Chrome インストールパッケージ
├── ProxyAssistant_{VERSION}_chrome.tar.gz   # Chrome ソースパッケージ
├── ProxyAssistant_{VERSION}_firefox.zip     # Firefox インストールパッケージ
├── ProxyAssistant_{VERSION}_firefox.tar.gz  # Firefox ソースパッケージ
└── ProxyAssistant_{VERSION}_firefox.xpi     # Firefox 公式拡張パッケージ
```

### 5.4 ローカル開発

**Chrome ローカルインストール**:
1. `src/manifest_chrome.json` を `manifest.json` に変更
2. Chromeを開き、`chrome://extensions/` にアクセス
3. **"デベロッパーモード"** を有効化
4. **"パッケージ化されていない拡張機能を読み込む"** をクリック
5. `src` ディレクトリを選択

**Firefox ローカルインストール**:
1. `make build` を使用して XPI ファイルを生成
2. Firefoxを開き、`about:addons` にアクセス
3. **歯車アイコン** → **ファイルからアドオンをインストール**
4. 生成された `.xpi` ファイルを選択

### 5.5 コードスタイル

- **インデント**: 2 スペース
- **引用符**: シングルクォート
- **命名**: camelCase（定数は UPPER_SNAKE_CASE）
- **セミコロン**: 一貫して使用

詳細な仕様については [AGENTS.md](../AGENTS.md) を参照してください

## 6. 📖 詳細説明

### 6.1 URLルール構文

以下のマッチングルールに対応：

```
# 完全一致
google.com

# サブドメイン一致
.google.com
www.google.com

# ワイルドカード一致
*.google.com
*.twitter.com

# IPアドレス
192.168.1.1
10.0.0.0/8
```

### 6.2 フォールバックポリシー

自動モードでプロキシ接続が失敗した場合：

| ポリシー | 説明 |
|----------|------|
| **直接接続 (DIRECT)** | プロキシをバイパスし、ターゲットウェブサイトに直接接続 |
| **接続拒否 (REJECT)** | リクエストを拒否 |

### 6.3 PACスクリプト自動モード

自動モードはPAC（Proxy Auto-Config）スクリプトを使用：
- 現在のURLに基づいて自動的にプロキシを選択
- プロキシリスト順に一致を確認し、最初のマッチを返す
- フォールバックポリシー対応
- ブラウザ起動時に最後の構成を自動復元

### 6.4 クイック操作

| 操作 | 方法 |
|------|------|
| プロキシカードの展開/折叠 | カードヘッダーをクリック |
| 全カードの展開/折叠 | 「すべて展開/折叠」ボタンをクリック |
| プロキシのドラッグ並べ替え | カードヘッダーのドラッグハンドルをドラッグ |
| パスワードの表示/非表示 | パスワード欄右目のアイコンをクリック |
| 単一プロキシの有効/無効 | カード上のスイッチを切り替え |
| 単一プロキシのテスト | 「接続テスト」ボタンをクリック |
| 全プロキシのテスト | 「すべてテスト」ボタンをクリック |
| ポップアップ快速閉鎖 | ページ内で `ESC` キーを押す |

### 6.5 設定のインポート/エクスポート

1. **設定をエクスポート**: 「設定をエクスポート」をクリックしてJSONファイルをダウンロード
2. **設定を読み込む**: 「設定を読み込む」をクリックしてJSONファイルを選択

設定に含まれるもの：
- 全プロキシ情報
- テーマ設定
- ナイトモード時間帯
- 言語設定
- 同期設定

### 6.6 プロキシ状態検出

「プロキシ効果を検出」ボタンをクリックすると：
- 現在のブラウザプロキシモードを表示
- 拡張機能がプロキシを正常に設定しているかを検証
- 他の拡張機能が制御を奪っていないかを検出
- 問題の診断と解決策を取得

## 7. 🔧 技術アーキテクチャ

### 7.1 Manifest V3

- ChromeはManifest V3仕様に準拠
- Service Workerがバックグラウンドページを置き換え
- Firefoxはbackground scripts + onRequest APIを使用

### 7.2 コアモジュール

1. **worker.js (Chrome)**:
   - プロキシ設定管理
   - PACスクリプト生成
   - 認証処理
   - プロキシテストロジック
   - ストレージ変更監視

2. **popup.js**:
   - ポップアップインターフェース操作
   - プロキシ状態表示
   - クイックプロキシ切り替え
   - 自動一致表示

3. **main.js**:
   - 設定ページロジック
   - プロキシ管理（追加/変更/削除）
   - ドラッグ&ドロップ並べ替え
   - インポート/エクスポート
   - プロキシ検出機能

4. **i18n.js**:
   - 多言語対応
   - リアルタイム言語切り替え

### 7.3 データストレージ

- `chrome.storage.local`: ローカルストレージ（常に使用）
- `chrome.storage.sync`: クラウド同期ストレージ（オプション）
- ローカルファースト原則を採用し、同期配额問題を解決

### 7.4 ブラウザ互換性

| 機能 | Chrome | Firefox |
|------|--------|---------|
| 手動モード | ✅ | ✅ |
| 自動モード | ✅ | ✅ |
| プロキシ認証 | ✅ | ✅ |
| プロキシテスト | ✅ | ✅ |
| テーマ切り替え | ✅ | ✅ |
| データ同期 | ✅ | ✅ |
| プロキシ検出 | ✅ | ✅ |

## 8. 📝 使用シナリオ

### 8.1 シナリオ1: 複数プロキシ切り替え

- 異なるネットワーク環境に異なるプロキシを設定
- オフィスネットワークでは社内プロキシを使用
- 自宅ネットワークではVPNプロキシを使用
- ワンクリック快速切り替え

### 8.2 シナリオ2: スマートルーティング

- 国内ウェブサイトは直接接続
- 特定のウェブサイトはプロキシ経由
- ドメインに基づいて自動選択

### 8.3 シナリオ3: プロキシポールテスト

- 複数のプロキシをインポート
- バッチで遅延をテスト
- 最適なプロキシを選択

### 8.4 シナリオ4: チーム共有

- 設定ファイルをエクスポート
- チームメンバーと共有
- 統一されたプロキシ設定

## 9. ⚠️ 注意事項

1. **権限説明**: 拡張機能には以下の権限が必要です：
   - `proxy`: プロキシ設定管理
   - `storage`: 設定保存
   - `webRequest` / `webRequestAuthProvider`: 認証リクエスト処理
   - `<all_urls>`: 全ウェブサイトURLへのアクセス

2. **他の拡張機能との競合**: プロキシの競合が発生した場合は、他のプロキシ/VPN類拡張機能を無効にしてください

3. **セキュリティ**: 資格情報はブラウザのローカルに保存されます。デバイスの安全を確保してください

4. **ネットワーク要件**: プロキシサーバーに正常にアクセスできることを確認してください

5. **Firefox制限**: Firefox最低バージョン要件: 142.0

## 10. 📄 プライバシーポリシー

[プライバシーポリシー](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 11. 📄 ライセンス

MIT License - 詳細は [LICENSE](../LICENSE) ファイルを参照

## 12. 🤝 コントリビューション

IssueおよびPull Requestをお待ちしています！

## 13. 📧 連絡先

ご質問やご提案がある場合は、GitHub Issuesを通じてフィードバックしてください。

---

<div align="center">

**このプロジェクトが役に立った場合は、Star ⭐ を押してください！**

</div>
