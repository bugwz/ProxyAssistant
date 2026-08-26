<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="プロキシアシスタント">

# プロキシアシスタント

[![Chrome 拡張機能](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Firefox 拡張機能](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![多言語](https://img.shields.io/badge/多言語-yellow)](README-ja.md)

Chrome、Firefox、Edge 向けのブラウザプロキシ管理拡張機能

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [**日本語**](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

プロキシアシスタントは、HTTP、HTTPS、SOCKS4、SOCKS5 プロキシをブラウザ内で管理します。無効、手動、自動の 3 モードに加え、プロキシノード、シナリオ、ルーティングルール、ルール購読、設定同期、診断を 1 つの設定画面にまとめています。

Chrome、Firefox、Edge は Manifest V3 を使用し、Edge は Chrome と同じ Chromium ビルドを利用します。プロジェクトはネイティブ JavaScript、jQuery、ブラウザ拡張 API で実装されています。

![設定画面](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260826132015/assets/localized/ja.png)

## 主な機能

### プロキシノードと動作モード

- HTTP、HTTPS、SOCKS4、SOCKS5 のプロキシノードを管理します。
- アドレス、ポート、ユーザー名、パスワード、色、有効状態などを設定できます。
- 拡張機能のポップアップから無効、手動、自動モードを切り替えます。
- 手動モードでは選択したノードを使用し、プロキシを使用しないアドレスを設定できます。
- 自動モードでは各ノードのプロキシ対象アドレスから PAC スクリプトを生成し、直接接続または拒否のフォールバックを設定できます。
- 単一または全ノードをテストし、遅延や失敗状態を表示します。

### プロキシシナリオ

- 異なるネットワーク環境のノードを複数のシナリオに分けて保存します。
- 設定画面またはポップアップから現在のシナリオを切り替えます。
- シナリオの追加、名前変更、削除、並べ替え、およびノード移動に対応します。
- 既定のプロキシを指定し、曜日と時間帯による自動有効化を設定できます。

### ルール購読

- 複数のプロキシノードで共有できるルール購読を一元管理します。
- AutoProxy、Switchy Legacy、Switchy Omega、PAC 形式に対応します。
- 元データ、解析結果、プロキシ対象ルール、直接接続ルールを確認できます。
- ルール反転と、手動、1 分、6 時間、12 時間、1 日、5 日の更新周期に対応します。
- 購読更新は拡張機能のバックグラウンドタスクで実行されます。

### 設定、同期、診断

- JSON 設定をインポートおよびエクスポートし、購読設定やキャッシュを含めるか選択できます。
- ブラウザ標準の同期ストレージを使い、同じブラウザアカウントの端末間で設定をプッシュまたはプルします。
- GitHub Gist で設定をプッシュまたはプルし、定期同期も利用できます。
- 標準同期データを 7 KB 単位に分割し、設定画面に使用量を表示します。
- プロキシ制御、PAC スクリプト状態、他の拡張機能との競合を確認します。
- レベル別の実行ログを絞り込み、更新、コピー、消去できます。

### インターフェース設定

- ライト、ダーク、時間指定の自動テーマ切り替えに対応します。
- JSON でカスタムテーマ色を編集できます。
- 簡体字中国語、繁体字中国語、英語、日本語、フランス語、ドイツ語、スペイン語、ポルトガル語、ロシア語、韓国語に対応します。
> 現在の画面では SOCKS5 認証欄は無効です。Chrome のプロキシ API は SOCKS5 のユーザー名とパスワード認証をサポートしていません。

## インストール

### リリースパッケージからインストール

通常の利用者は、拡張機能ストアから直接インストールできます：

- [Chrome ウェブストア](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)：Chrome、および Chrome 拡張機能のインストールを許可した Edge 向け。
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)：Firefox 向け。

対応するパッケージは [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) からもダウンロードできます：

- Chrome、Edge などの Chromium ブラウザは `ProxyAssistant_<version>_chrome.zip` を使用します。
- Firefox ビルドには `ProxyAssistant_<version>_firefox.zip` と `ProxyAssistant_<version>_firefox.xpi` が含まれます。

Chrome または Edge では ZIP を展開し、拡張機能ページでデベロッパーモードを有効にして、展開済みディレクトリを読み込んでください。リリース処理で生成される Firefox XPI はビルド成果物であり、直接インストールできるかどうかは Firefox の署名ポリシーに依存します。通常の利用者には Firefox Add-ons を推奨します。

### ソースからビルド

リポジトリでは Chrome と Firefox の Manifest を個別に管理しています。`src/manifest.json` を直接編集せずに済むよう、先にビルドスクリプトで対象ブラウザのディレクトリまたはパッケージを生成することを推奨します。

```bash
npm ci
make build VERSION=dev
```

Chrome または Edge では `build/ProxyAssistant_dev_chrome.zip` を展開して読み込みます。Firefox の開発では Firefox ZIP を展開し、`about:debugging` の「この Firefox」から「一時的なアドオンを読み込む」を選び、`manifest.json` を指定します。XPI の生成には `web-ext` が必要です。 `web-ext` がない場合も Firefox の ZIP と TAR.GZ は生成されますが、XPI は省略されます。

## 基本的な使い方

1. ブラウザのツールバーからプロキシアシスタントを開きます。
2. 設定画面でプロトコル、アドレス、ポートを指定してノードを追加します。
3. 必要に応じて認証情報とルーティングルールを設定します。
4. ポップアップに戻り、無効、手動、自動モードを選択します。
5. 手動モードではノードを選択し、自動モードでは PAC スクリプトにルーティングを任せます。

一般的な設定例：

- 常に 1 つのプロキシを使う：手動モードで対象ノードを選択します。
- 特定サイトだけプロキシを使う：ノードの「プロキシを使用するアドレス」に追加し、自動モードを選択します。
- 特定サイトを直接接続する：手動モードの「プロキシを使用しないアドレス」に追加するか、購読から直接接続ルールを提供します。
- 職場や自宅などを分ける：シナリオを個別に作成し、ポップアップから切り替えます。

## データと権限

拡張機能は次の権限を要求します：

| Permission | 用途 |
| --- | --- |
| `proxy` | ブラウザのプロキシ設定を読み取り、変更する |
| `storage` | ローカル設定を保存し、ブラウザ同期を利用する |
| `webRequest`、`webRequestAuthProvider` | プロキシ認証要求に応答する |
| `alarms` | 購読更新、シナリオ自動切り替え、定期同期を実行する |
| `<all_urls>` | ウェブ要求向けのプロキシルールを生成し、現在のサイトを読み取る |


設定は既定で `chrome.storage.local` に保存されます。プロキシのユーザー名とパスワードは設定の一部であり、エクスポートファイルと明示的にプッシュした同期データに含まれます。GitHub Token と Gist ID はエクスポートおよび同期内容から除外されます。同期を有効にする前に安全要件を確認してください。

リモート設定をプルするとローカルの業務設定は置き換わりますが、ローカルの同期接続情報とスケジュールは保持されます。重要な設定は事前にバックアップしてください。

[プライバシーポリシー](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 開発

### 必要環境

- Node.js 20（GitHub Actions と同じバージョン）
- npm
- ブラウザ内検証用の Chrome、Firefox、Edge
- Firefox XPI の生成時のみ `web-ext`

依存関係をインストール：

```bash
npm ci
```

### テスト

```bash
npm test                    # すべての Jest テストを実行
npm run test:unit           # ユニットテスト
npm run test:integration    # 統合テスト
npm run test:e2e            # エンドツーエンドテスト
npm run test:watch          # 監視モード
npm run test:coverage       # カバレッジテスト
```

Makefile のコマンドも利用できます：

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### ビルド

```bash
make build VERSION=dev
```

ビルドスクリプトは `build/` を消去し、各ブラウザの Manifest を選択して次のファイルを生成します：

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

`web-ext` がない場合、最後のファイルは生成されません。

### プロジェクト構成

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # ブラウザ国際化リソース
│   ├── css/                  # 設定画面とポップアップのスタイル
│   ├── images/               # 拡張機能アイコン
│   ├── js/                   # 画面、プロキシ、保存、同期、バックグラウンド処理
│   ├── main.html             # 設定画面
│   ├── popup.html            # 拡張機能ポップアップ
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Chrome と Firefox のパッケージスクリプト
├── readme/                   # 他言語 README
├── release/                  # 各リリースの変更記録
├── Makefile
└── package.json
```

主要モジュール：

| ファイル | 役割 |
| --- | --- |
| `src/js/worker.js` | プロキシ設定適用、PAC 生成、認証、定期処理、バックグラウンドメッセージ |
| `src/js/main.js` | 設定画面の初期化とモジュール連携 |
| `src/js/popup.js` | ポップアップでのモード、シナリオ、ノード切り替え |
| `src/js/proxy.js` | プロキシノードのフォーム、一覧、テスト操作 |
| `src/js/scenarios.js` | シナリオ管理と時間ルール |
| `src/js/subscription.js` | 購読管理、解析、更新スケジュール |
| `src/js/config.js` | 設定形式、移行、インポート、エクスポート |
| `src/js/storage.js` | ローカル設定キャッシュと永続化 |
| `src/js/sync.js` | ブラウザ同期と GitHub Gist 同期 |
| `src/js/detection.js` | プロキシ制御と PAC の診断 |

コード規約とテスト要件は [AGENTS.md](../AGENTS.md) を参照してください。

## ブラウザに関する注意

- Chrome は Manifest V3 Service Worker を使用します。
- Firefox は Manifest V3 background script を使用し、現在の Manifest は Firefox 142 以降を要求します。
- Edge は Chrome パッケージを使用し、Chrome ウェブストアまたは展開済み Chrome ビルドから読み込めます。専用 Manifest と自動ビルド対象は Chrome と Firefox です。
- 複数のプロキシまたは VPN 拡張機能を同時に有効にすると制御が競合する場合があります。「プロキシ状態」ページで診断できます。

## フィードバックと貢献

問題や機能要望は [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues) へ報告してください。変更に関連するテストを実行し、プロキシ動作は可能な限り Chrome、Firefox、Edge で確認してください。

## ライセンス

本プロジェクトは [MIT License](../LICENSE) で提供されます。
