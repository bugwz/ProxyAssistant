<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="프록시 도우미">

# 프록시 도우미

[![Chrome 확장 프로그램](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Firefox 확장 프로그램](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![다국어](https://img.shields.io/badge/다국어-yellow)](README-ko.md)

Chrome, Firefox 및 Edge용 브라우저 프록시 관리자

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [**한국어**](README-ko.md)

</div>

프록시 도우미는 브라우저 안에서 HTTP, HTTPS, SOCKS4 및 SOCKS5 프록시를 관리합니다. 비활성화, 수동, 자동 모드를 제공하며 프록시 노드, 시나리오, 라우팅 규칙, 규칙 구독, 구성 동기화 및 진단을 하나의 설정 페이지에 모았습니다.

Chrome, Firefox 및 Edge는 Manifest V3를 사용합니다. Edge는 Chrome과 동일한 Chromium 패키지를 사용합니다. 프로젝트는 네이티브 JavaScript, jQuery 및 브라우저 확장 API로 개발되었습니다.

![설정 화면](../public/img/demo.png)

## 주요 기능

### 프록시 노드와 동작 모드

- HTTP, HTTPS, SOCKS4 및 SOCKS5 프록시 노드를 관리합니다.
- 주소, 포트, 사용자 이름, 비밀번호, 색상 및 활성 상태를 설정합니다.
- 확장 프로그램 팝업에서 비활성화, 수동 및 자동 모드를 전환합니다.
- 수동 모드에서 선택한 노드를 사용하고 프록시 제외 주소를 설정합니다.
- 자동 모드에서 각 노드의 프록시 사용 주소로 PAC 스크립트를 생성하고 직접 연결 또는 차단 폴백을 적용합니다.
- 개별 또는 전체 노드를 테스트하고 지연 시간이나 실패 상태를 표시합니다.

### 프록시 시나리오

- 서로 다른 네트워크 환경의 노드를 별도 시나리오에 저장합니다.
- 설정 페이지 또는 팝업에서 현재 시나리오를 전환합니다.
- 시나리오 추가, 이름 변경, 삭제, 정렬 및 시나리오 간 노드 이동을 지원합니다.
- 기본 프록시와 요일·시간대별 자동 활성화를 설정합니다.

### 규칙 구독

- 여러 노드가 공유할 수 있는 규칙 구독을 중앙에서 관리합니다.
- AutoProxy, Switchy Legacy, Switchy Omega 및 PAC 형식을 지원합니다.
- 원본 내용, 파싱 결과, 프록시 규칙 및 직접 연결 규칙을 확인합니다.
- 규칙 반전과 수동, 1분, 6시간, 12시간, 1일, 5일 갱신 주기를 지원합니다.
- 구독 갱신은 확장 프로그램 백그라운드 작업으로 실행됩니다.

### 구성, 동기화 및 진단

- JSON 구성을 가져오고 내보내며 구독 설정과 캐시 포함 여부를 선택합니다.
- 브라우저 기본 동기화 저장소로 같은 계정의 기기 간 구성을 푸시하거나 가져옵니다.
- GitHub Gist로 구성을 푸시하거나 가져오며 예약 동기화를 지원합니다.
- 기본 동기화 데이터를 7 KB 단위로 나누고 설정에 할당량 사용량을 표시합니다.
- 프록시 제어, PAC 상태 및 다른 확장 프로그램과의 충돌을 확인합니다.
- 수준별 런타임 로그를 필터링, 새로 고침, 복사 및 삭제합니다.

### 인터페이스 설정

- 밝은 테마, 어두운 테마 및 시간 기반 자동 전환을 지원합니다.
- JSON으로 사용자 정의 테마 색상을 편집합니다.
- 간체 중국어, 번체 중국어, 영어, 일본어, 프랑스어, 독일어, 스페인어, 포르투갈어, 러시아어 및 한국어를 지원합니다.
> Chrome 프록시 API가 SOCKS5 사용자 이름 및 비밀번호 인증을 지원하지 않으므로 현재 화면에서는 SOCKS5 인증 필드가 비활성화됩니다.

![밝은 테마](../public/img/demo-light.png)

![어두운 테마](../public/img/demo-night.png)

## 설치

### 릴리스 패키지에서 설치

일반 사용자는 확장 프로그램 스토어에서 직접 설치할 수 있습니다:

- [Chrome 웹 스토어](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk): Chrome 및 Chrome 확장 설치가 허용된 Edge용.
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant): Firefox용.

[GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases)에서도 해당 패키지를 다운로드할 수 있습니다:

- Chrome, Edge 및 기타 Chromium 브라우저는 `ProxyAssistant_<버전>_chrome.zip`을 사용합니다.
- Firefox 빌드에는 `ProxyAssistant_<버전>_firefox.zip`과 `ProxyAssistant_<버전>_firefox.xpi`가 포함됩니다.

Chrome 또는 Edge에서는 ZIP을 풀고 확장 프로그램 페이지에서 개발자 모드를 켠 뒤 압축 해제된 폴더를 로드하세요. 릴리스 과정에서 Firefox XPI가 빌드 결과물로 생성되지만 직접 설치 가능 여부는 Firefox 서명 정책에 따라 달라집니다. 따라서 일반 사용자는 Firefox Add-ons를 권장합니다.

### 소스에서 빌드

저장소는 Chrome과 Firefox용 Manifest를 별도로 관리합니다. `src/manifest.json`을 직접 수정하지 않도록 먼저 빌드 스크립트로 대상 브라우저 디렉터리 또는 패키지를 생성하는 것이 좋습니다.

```bash
npm ci
make build VERSION=dev
```

Chrome 또는 Edge에서는 `build/ProxyAssistant_dev_chrome.zip`을 풀어 로드합니다. Firefox 개발 시 Firefox ZIP을 풀고 `about:debugging`의 “이 Firefox”에서 임시 부가 기능 로드를 선택한 뒤 `manifest.json`을 지정합니다. XPI 생성에는 `web-ext`가 필요합니다. `web-ext`가 없어도 Firefox ZIP과 TAR.GZ는 생성되지만 XPI는 건너뜁니다.

## 기본 사용법

1. 브라우저 도구 모음에서 프록시 도우미를 엽니다.
2. 설정에서 프로토콜, 주소, 포트를 입력해 노드를 추가합니다.
3. 필요하면 인증 정보와 라우팅 규칙을 추가합니다.
4. 팝업에서 비활성화, 수동 또는 자동 모드를 선택합니다.
5. 수동 모드에서는 노드를 선택하고 자동 모드에서는 PAC 스크립트가 요청을 라우팅하도록 합니다.

일반적인 구성:

- 항상 하나의 프록시 사용: 수동 모드에서 대상 노드를 선택합니다.
- 특정 사이트에 프록시 사용: 프록시 사용 주소에 추가하고 자동 모드를 선택합니다.
- 특정 사이트 직접 연결: 제외 주소에 추가하거나 구독의 직접 연결 규칙을 사용합니다.
- 회사, 집 등 환경 분리: 시나리오를 각각 만들고 팝업에서 전환합니다.

## 데이터와 권한

확장 프로그램은 다음 권한을 요청합니다:

| Permission | 용도 |
| --- | --- |
| `proxy` | 브라우저 프록시 설정 읽기 및 변경 |
| `storage` | 로컬 구성 저장 및 브라우저 기본 동기화 |
| `webRequest`, `webRequestAuthProvider` | 프록시 인증 요청에 응답 |
| `alarms` | 구독, 시나리오 및 동기화 예약 |
| `<all_urls>` | 웹 요청용 프록시 규칙 생성 및 현재 사이트 읽기 |


구성은 기본적으로 `chrome.storage.local`에 저장됩니다. 프록시 사용자 이름과 비밀번호는 구성의 일부이므로 내보낸 파일과 사용자가 직접 푸시한 동기화 데이터에 포함됩니다. GitHub Token과 Gist ID는 내보내기 및 동기화 내용에서 제외됩니다. 동기화를 켜기 전에 내보낸 파일을 안전하게 보관하고 보안 요구 사항을 확인하세요.

원격 데이터를 가져오면 로컬 업무 구성이 교체되지만 로컬 동기화 연결 정보와 일정은 유지됩니다. 중요한 설정은 먼저 백업으로 내보내세요.

[개인정보 처리방침](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 개발

### 요구 사항

- GitHub Actions와 같은 Node.js 20
- npm
- 브라우저 테스트용 Chrome, Firefox 또는 Edge
- Firefox XPI 생성 시에만 `web-ext`

의존성 설치:

```bash
npm ci
```

### 테스트

```bash
npm test                    # 모든 Jest 테스트
npm run test:unit           # 단위 테스트
npm run test:integration    # 통합 테스트
npm run test:e2e            # 엔드투엔드 테스트
npm run test:watch          # 감시 모드
npm run test:coverage       # 커버리지 테스트
```

사용 가능한 Makefile 명령:

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### 빌드

```bash
make build VERSION=dev
```

빌드 스크립트는 `build/`를 정리하고 브라우저별 Manifest를 선택해 다음 파일을 생성합니다:

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

`web-ext`가 없으면 마지막 파일은 생성되지 않습니다.

### 프로젝트 구조

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # 브라우저 다국어 리소스
│   ├── css/                  # 설정 페이지와 팝업 스타일
│   ├── images/               # 확장 프로그램 아이콘
│   ├── js/                   # 페이지, 프록시, 저장소, 동기화 및 백그라운드 로직
│   ├── main.html             # 설정 페이지
│   ├── popup.html            # 확장 프로그램 팝업
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Chrome 및 Firefox 패키징 스크립트
├── public/img/               # README 및 스토어 이미지
├── readme/                   # 다른 언어 README
├── release/                  # 릴리스별 변경 사항
├── Makefile
└── package.json
```

핵심 모듈:

| 파일 | 역할 |
| --- | --- |
| `src/js/worker.js` | 프록시 적용, PAC 생성, 인증, 예약 작업 및 메시지 |
| `src/js/main.js` | 설정 페이지 초기화 및 모듈 조정 |
| `src/js/popup.js` | 팝업의 모드, 시나리오 및 노드 전환 |
| `src/js/proxy.js` | 노드 양식, 목록 및 테스트 |
| `src/js/scenarios.js` | 시나리오 관리 및 시간 규칙 |
| `src/js/subscription.js` | 구독 관리, 파싱 및 갱신 일정 |
| `src/js/config.js` | 구성 형식, 마이그레이션, 가져오기 및 내보내기 |
| `src/js/storage.js` | 로컬 구성 캐시 및 저장 |
| `src/js/sync.js` | 브라우저 기본 동기화 및 GitHub Gist |
| `src/js/detection.js` | 프록시 제어 및 PAC 진단 |

코드 및 테스트 규칙은 [AGENTS.md](../AGENTS.md)를 참고하세요.

## 브라우저 참고 사항

- Chrome은 Manifest V3 Service Worker를 사용합니다.
- Firefox는 Manifest V3 background script를 사용하며 현재 Manifest는 Firefox 142 이상을 요구합니다.
- Edge는 Chrome 웹 스토어 또는 압축 해제 폴더의 Chrome 패키지를 사용합니다. 전용 Manifest와 자동 빌드 대상은 Chrome과 Firefox입니다.
- 여러 프록시 또는 VPN 확장 프로그램이 제어권 충돌을 일으킬 수 있으므로 프록시 상태 페이지에서 진단하세요.

## 피드백 및 기여

문제와 기능 제안은 [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues)에 등록하세요. 관련 테스트를 실행하고 가능하면 Chrome, Firefox 및 Edge에서 프록시 동작을 확인하세요.

## 라이선스

이 프로젝트는 [MIT License](../LICENSE)를 사용합니다.
