<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# 프록시 어시스턴트

</div>

<div align="center">

[![Chrome 확장 프로그램](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Firefox 확장 프로그램](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![다국어 지원](https://img.shields.io/badge/다국어지원-yellow)](README-ko.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [**한국어**](README-ko.md)

</div>

<div align="center">

Chrome와 Firefox를 지원하는 강력한 브라우저 프록시 관리 확장 프로그램으로, 네트워크 프록시를 쉽게 구성하고 전환할 수 있습니다.

</div>

![](../public/img/promotion/1400-560.png)

## 1. ✨ 기능 특징

### 1.1 🔌 다중 프록시 프로토콜 지원
- **HTTP** - 전통적인 HTTP 프록시
- **HTTPS** - 보안 HTTPS 프록시
- **SOCKS5** - TCP/UDP를 지원하는 SOCKS5 프록시
- **SOCKS4** - 레거시 SOCKS4 프록시 호환성

### 1.2 🌐 다중 브라우저 지원
- **Chrome** - Manifest V3 + Service Worker 사용
- **Firefox** - onRequest API를 사용한 프록시 인터셉트

### 1.3 🔄 세 가지 프록시 모드

| 모드 | 설명 |
|------|------|
| **비활성화** | 프록시 비활성화, 시스템 기본 네트워크 연결 사용 |
| **수동** | 목록에서 프록시를 수동으로 선택 |
| **자동** | URL 규칙에 따라 자동으로 일치하는 프록시 선택 (PAC 모드) |

![](../public/img/promotion/1280-800-03.png)

### 1.4 📋 유연한 URL 규칙 구성

- **프록시를 사용하지 않는 주소** (`bypass_urls`): 수동 모드에서 직접 연결할 도메인/IP
- **프록시를 사용하는 주소** (`include_urls`): 자동 모드에서 프록시 접근이 필요한 도메인
- **대체 전략**: 자동 모드에서 연결 실패 시 직접 연결 또는 연결 거부 선택
- 와일드카드 `*` 및 도메인 매칭 지원
- 서로 다른 웹사이트에 서로 다른 프록시를 사용하는 시나리오에 적합

### 1.5 🔐 프록시 인증 지원

- 사용자명/비밀번호 인증 지원
- 프록시 서버의 인증 요청 자동 처리
- 자격 증명 정보 안전하게 저장

### 1.6 🧪 프록시 테스트 기능

- **연결 테스트**: 프록시 사용 가능 여부 확인
- **지연 시간 측정**: 프록시 응답 시간 테스트
- **일괄 테스트**: 모든 프록시를 한 번에 테스트
- **색상 표시**: 초록색(<500ms) / 주황색(≥500ms) / 빨간색(실패)

### 1.7 🏃 프록시 상태 감지

- 현재 브라우저 프록시 설정 감지
- 확장 프로그램이 프록시를 성공적으로 제어했는지 확인
- 다른 확장 프로그램의 프록시 제어 식별
- 상태, 경고, 오류 세 가지 결과 제공

### 1.8 🔍 PAC 스크립트 미리보기

- **스크립트 보기**: 자동 생성된 PAC 스크립트 내용 확인
- **규칙 목록**: 적용된 모든 프록시 매칭 규칙을 명확하게 표시
- **디버깅 지원**: 자동 모드에서의 매칭 문제 해결을 용이하게 함

### 1.9 🌙 테마 모드

- **라이트 모드**: 주간 사용
- **다크 모드**: 야간 사용
- **자동 전환**: 시간에 따라 테마 자동 전환 (구성 가능 시간대)

![](../public/img/promotion/1280-800-02.png)

### 1.10 ☁️ 데이터 저장 및 동기화

#### 1.10.1 저장 전략

| 저장 유형 | 저장 내용 | 설명 |
|----------|-----------|------|
| **로컬 저장소 (local)** | 프록시 목록, 테마 설정, 언어 설정, 동기화 구성 | 항상 활성화, 오프라인 사용 가능 및 데이터 지속성 보장 |
| **클라우드 동기화 (sync)** | 전체 구성 데이터 (청크 저장) | 선택적 기능, 할당량 제한을 우회하기 위해 청크 저장 사용 |

#### 1.10.2 동기화 방식

##### 1.10.2.1 브라우저 네이티브 동기화 (Native Sync)
- `chrome.storage.sync` API(Chrome) 또는 `browser.storage.sync`(Firefox) 사용
- Chrome/Firefox 계정을 통한 자동 동기화
- 동일한 브라우저 계정으로 여러 기기 동기화에 적합
- **청크 저장**: 구성 데이터는 항목당 8KB 할당량 제한을 우회하기 위해 자동으로 청크(청크당 7KB)로 분할됩니다
- **데이터 무결성**: 체크섬을 사용하여 동기화 데이터 무결성 보장
- **원자적 작업**: Push 작업은 일관성을 보장하기 위해 새 데이터를 쓰기 전에 이전 데이터를 지웁니다
- **할당량 표시**: 사용/총 할당량(100KB) 및 청크 수를 실시간으로 표시

##### 1.10.2.2 GitHub Gist 동기화
- GitHub Gist를 통해 브라우저 및 기기 간 구성 동기화
- GitHub Personal Access Token 구성 필요
- 수동 푸시/풀 또는 자동 동기화 지원
- 구성 내용은 암호화되어 저장, 내보내기 시 민감 정보 자동 제거

| 구성 항목 | 설명 |
|-----------|------|
| **액세스 키** | GitHub Personal Access Token (gist 권한 필요) |
| **파일 이름** | Gist의 파일 이름, 기본값 `proxy_assistant_config.json` |
| **Gist ID** | 자동 인식 및 저장, 수동 입력 불필요 |

#### 1.10.3 동기화 작업

| 작업 | 설명 |
|------|------|
| **푸시 (Push)** | 로컬 구성을 클라우드/Gist에 업로드 |
| **풀 (Pull)** | 클라우드/Gist에서 구성 다운로드 |
| **연결 테스트** | Gist Token 유효성 및 구성 상태 확인 |

#### 1.10.4 가져오기/내보내기

- **구성 내보내기**: 모든 프록시 정보, 테마 설정, 언어 설정 등을 포함하는 JSON 파일 생성
- **구성 가져오기**: JSON 파일에서 구성 복원 지원
- **데이터 보안**: 내보내기 파일은 민감한 정보(Token, 비밀번호)를 자동으로 제거
- **형식 호환성**: 이전 버전 구성 파일 가져오기 지원

**내보내기 구조:**
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

### 1.11 🌍 다국어 지원

이 확장은 다음 언어를 지원합니다:

| 언어 | 코드 | 상태 |
|------|------|------|
| 简体中文 | zh-CN | ✅ 지원됨 |
| 繁體中文 | zh-TW | ✅ 지원됨 |
| English | en | ✅ 지원됨 |
| 日本語 | ja | ✅ 지원됨 |
| Français | fr | ✅ 지원됨 |
| Deutsch | de | ✅ 지원됨 |
| Español | es | ✅ 지원됨 |
| Português | pt | ✅ 지원됨 |
| Русский | ru | ✅ 지원됨 |
| 한국어 | ko | ✅ 지원됨 |

![](../public/img/promotion/1280-800-04.png)

## 2. 📷 설정 인터페이스

![](../public/img/demo.png)

## 3. 📁 프로젝트 구조

```
ProxyAssistant/
├── conf/                     # 예제 구성
│   └── demo.json             # 예제 구성 파일
├── readme/                   # 다국어 문서
│   ├── README-zh-CN.md       # 간체 중국어
│   ├── README-zh-TW.md       # 번체 중국어
│   ├── README-en.md          # 영어
│   ├── README-ja.md          # 일본어
│   ├── README-fr.md          # 프랑스어
│   ├── README-de.md          # 독일어
│   ├── README-es.md          # 스페인어
│   ├── README-pt.md          # 포르투갈어
│   ├── README-ru.md          # 러시아어
│   └── README-ko.md          # 한국어
├── src/                      # 소스 코드
│   ├── manifest_chrome.json  # Chrome 확장 프로그램 구성 (Manifest V3)
│   ├── manifest_firefox.json # Firefox 확장 프로그램 구성
│   ├── main.html             # 설정 페이지
│   ├── popup.html            # 팝업 페이지
│   ├── js/
│   │   ├── main.js           # 설정 페이지 메인 로직
│   │   ├── popup.js          # 팝업 UI 로직
│   │   ├── worker.js         # 백그라운드 서비스 (Chrome: Service Worker)
│   │   ├── i18n.js           # 국제화 지원
│   │   └── jquery.js         # jQuery 라이브러리
│   ├── css/
│   │   ├── main.css          # 설정 페이지 스타일 (공통 컴포넌트 포함)
│   │   ├── popup.css         # 팝업 스타일
│   │   ├── theme.css         # 테마 스타일
│   │   └── eye-button.css    # 비밀번호 표시 버튼 스타일
│   └── images/               # 이미지 리소스
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
├── public/                   # 공개 리소스
    └── img/                  # 데모 및 홍보 이미지
├── tests/                    # 테스트
│   ├── jest.config.js        # Jest 구성
│   ├── setup.js              # 테스트 환경 설정
│   ├── __mocks__/            # Mock 파일
│   │   └── chrome.js         # Chrome API Mock
│   ├── unit/                 # 단위 테스트
│   ├── integration/          # 통합 테스트
│   └── e2e/                  # E2E 테스트
├── script/                   # 빌드 스크립트
│   └── build.sh              # 확장 프로그램 빌드 스크립트
├── release/                  # 릴리스 노트
│   └── *.md                  # 버전 업데이트 로그
├── build/                    # 빌드 출력 디렉토리
├── package.json              # 프로젝트 의존성
├── package-lock.json         # 의존성 버전 잠금
├── Makefile                  # 빌드 명령 진입점
├── jest.config.js            # Jest 구성 (tests/jest.config.js를 가리킴)
└── AGENTS.md                 # 개발 가이드
```

## 4. 🚀 빠른 시작

### 4.1 확장 프로그램 설치

#### 4.1.1 Chrome

**방법 1 (권장)**: Chrome 공식 스토어에서 설치
1. Chrome을 열고 [Chrome 웹 스토어](https://chrome.google.com/webstore) 방문
2. "프록시 어시스턴트" 검색
3. "Chrome에 추가" 클릭

**방법 2**: 로컬 설치
- **옵션 A (소스 코드 사용)**: 소스 코드 다운로드, `src/manifest_chrome.json`을 `manifest.json`으로 이름 변경, then `src` 디렉토리 로드
- **옵션 B (설치 패키지 사용)**:
  1. [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) 페이지로 이동
  2. `proxy-assistant-chrome-x.x.x.zip` 파일 다운로드
  3. 다운로드한 ZIP 파일을 임의의 디렉토리에 압축 해제
  4. Chrome을 열고 `chrome://extensions/` 방문
  5. 오른쪽 상단의 **"개발자 모드"** 활성화
  6. 왼쪽 상단의 **"압축 해제된 확장 프로그램 로드"** 버튼 클릭
  7. 3단계에서 압축 해제한 폴더 선택
  8. 설치 성공 후 확장 프로그램이 확장 프로그램 목록에 표시됨

#### 4.1.2 Firefox

**방법 1 (권장)**: Firefox 공식附加组件에서 설치
1. Firefox를 열고 [Firefox附加组件](https://addons.mozilla.org/) 방문
2. "프록시 어시스턴트" 검색
3. "Firefox에 추가" 클릭

**방법 2**: 로컬 설치
1. release 디렉토리에서 Firefox 확장 설치 패키지 (`.xpi` 파일) 다운로드
2. Firefox를 열고 `about:addons` 방문
3. **톱니바퀴 아이콘** → **파일에서附加组件 설치** 클릭
4. 다운로드한 `.xpi` 파일 선택

#### 4.1.3 Microsoft Edge

Edge 브라우저는 Chromium 커널을 기반으로 하며, Chrome 확장 프로그램을 직접 설치할 수 있습니다.

**방법 1 (권장)**: Chrome 웹 스토어에서 설치
1. Edge를 열고 `edge://extensions/` 방문
2. "새 확장 프로그램 찾기" 섹션에서 "Chrome 웹 스토어에서 확장 프로그램 가져오기" 클릭, [Chrome 웹 스토어](https://chrome.google.com/webstore) 방문
3. "프록시 어시스턴트" 검색
4. "가져오기" 클릭 후 "Microsoft Edge에 추가"

**방법 2**: 로컬 설치
1. [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) 페이지로 이동
2. `proxy-assistant-chrome-x.x.x.zip` 파일 다운로드
3. 다운로드한 ZIP 파일을 임의의 디렉토리에 압축 해제
4. Edge를 열고 `edge://extensions/` 방문
5. 왼쪽 하단의 **"개발자 모드"** 활성화
6. **"압축 해제된 디렉토리 선택"** 버튼 클릭
7. 3단계에서 압축 해제한 폴더 선택
8. 설치 성공 후 확장 프로그램이 확장 프로그램 목록에 표시됨

### 4.2 프록시 추가

1. 확장 프로그램 아이콘을 클릭하여 팝업 열기
2. **"설정"** 버튼을 클릭하여 설정 페이지 열기
3. **"새 프록시"** 버튼을 클릭하여 새 프록시 추가
4. 프록시 정보 입력:
   - 프록시 이름
   - 프로토콜 유형 (HTTP/HTTPS/SOCKS4/SOCKS5)
   - 프록시 주소 (IP 또는 도메인)
   - 포트 번호
   - (선택 사항) 사용자명과 비밀번호
   - (선택 사항) URL 규칙 구성
5. **"저장"** 버튼 클릭

### 4.3 프록시 사용

**수동 모드**:
1. 팝업에서 **"수동"** 모드 선택
2. 목록에서 프록시 선택
3. "연결됨" 상태가 표시되면 활성화됨

**자동 모드**:
1. 팝업에서 **"자동"** 모드 선택
2. 설정 페이지에서 각 프록시에 대한 URL 규칙 구성
3. 방문하는 웹사이트에 따라 프록시가 자동으로 선택됨

## 5. 🛠️ 개발 가이드

### 5.1 개발 환경

**전제 조건**:
- Node.js >= 14
- npm >= 6
- Chrome / Firefox 브라우저 (테스트용)
- web-ext (Firefox XPI 빌드용, 선택 사항)

**의존성 설치**:
```bash
make test_init
# 또는
npm install
```

### 5.2 테스트 명령

| 명령 | 설명 |
|------|------|
| `make test` | 모든 테스트 실행 (단위 + 통합 + e2e) |
| `make test_nocache` | 캐시 없이 테스트 실행 |
| `make test_unit` | 단위 테스트만 실행 |
| `make test_integration` | 통합 테스트만 실행 |
| `make test_e2e` | e2e 테스트만 실행 |
| `make test_watch_nocache` | 감시 모드에서 테스트 실행 |
| `make test_cov_nocache` | 테스트 실행 및 커버리지 보고서 생성 |

**npm 직접 사용**:
```bash
npm test                    # 모든 테스트 실행
npm run test:unit           # 단위 테스트만 실행
npm run test:integration    # 통합 테스트만 실행
npm run test:e2e            # e2e 테스트만 실행
npm run test:watch          # 감시 모드에서 테스트 실행
npm run test:coverage       # 테스트 실행 및 커버리지 보고서 생성
```

### 5.3 빌드 명령

| 명령 | 설명 |
|------|------|
| `make build` | Chrome 및 Firefox 확장 프로그램 빌드 |
| `make clean` | 빌드 아티팩트 정리 |
| `make test_clean` | 테스트 캐시 및 커버리지 파일 정리 |

**버전 지정**:
```bash
make build VERSION=1.4.0
# 또는
./script/build.sh 1.3.1
```

**빌드 아티팩트**:
```
build/
├── ProxyAssistant_{VERSION}_chrome.zip      # Chrome 설치 패키지
├── ProxyAssistant_{VERSION}_chrome.tar.gz   # Chrome 소스 패키지
├── ProxyAssistant_{VERSION}_firefox.zip     # Firefox 설치 패키지
├── ProxyAssistant_{VERSION}_firefox.tar.gz  # Firefox 소스 패키지
└── ProxyAssistant_{VERSION}_firefox.xpi     # Firefox 공식 확장 패키지
```

### 5.4 로컬 개발

**Chrome 로컬 설치**:
1. `src/manifest_chrome.json`을 `manifest.json`으로 이름 변경
2. Chrome 열기, `chrome://extensions/` 방문
3. **"개발자 모드"** 활성화
4. **"압축 해제된 확장 프로그램 로드"** 클릭
5. `src` 디렉토리 선택

**Firefox 로컬 설치**:
1. `make build`를 사용하여 XPI 파일 생성
2. Firefox 열기, `about:addons` 방문
3. **톱니바퀴 아이콘** → **파일에서 애드온 설치** 클릭
4. 생성된 `.xpi` 파일 선택

### 5.5 코드 스타일

- **들여쓰기**: 2 공백
- **따옴표**: 작은따옴표
- **명명**: camelCase, 상수는 UPPER_SNAKE_CASE 사용
- **세미콜론**: 일관된 사용

자세한 사양은 [AGENTS.md](../AGENTS.md)를 참조하십시오

## 6. 📖 상세 설명

### 6.1 URL 규칙 구문

다음과 같은 매칭 규칙을 지원합니다:

```
# 정확한 일치
google.com

# 하위 도메인 일치
.google.com
www.google.com

# 와일드카드 일치
*.google.com
*.twitter.com

# IP 주소
192.168.1.1
10.0.0.0/8
```

### 6.2 대체 전략

자동 모드에서 프록시 연결이 실패할 때:

| 전략 | 설명 |
|------|------|
| **직접 연결 (DIRECT)** | 프록시 우회, 대상 웹사이트에 직접 연결 |
| **연결 거부 (REJECT)** | 요청 거부 |

### 6.3 PAC 스크립트 자동 모드

자동 모드는 PAC (Proxy Auto-Config) 스크립트를 사용합니다:
- 현재 URL에 따라 프록시 자동 선택
- 프록시 목록 순서대로 매칭, 첫 번째 매칭 프록시 반환
- 대체 전략 지원
- 브라우저 시작 시 마지막 구성 자동 복원

### 6.4 바로 가기 작업

| 작업 | 방법 |
|------|------|
| 프록시 카드 펼치기/접기 | 카드 헤더 클릭 |
| 모든 카드 펼치기/접기 | "모두 펼치기/접기" 버튼 클릭 |
| 프록시 드래그하여 정렬 | 카드 헤더의 드래그 핸들 드래그 |
| 비밀번호 표시/숨기기 | 비밀번호 필드 오른쪽 눈 아이콘 클릭 |
| 개별 프록시 활성화/비활성화 | 카드에서 토글 |
| 개별 프록시 테스트 | "연결 테스트" 버튼 클릭 |
| 모든 프록시 테스트 | "모두 테스트" 버튼 클릭 |
| 팝업快速关闭 | 페이지에서 `ESC` 키 누르기 |

### 6.5 구성 가져오기/내보내기

1. **구성 내보내기**: "구성 내보내기"를 클릭하여 JSON 파일 다운로드
2. **구성 가져오기**: "구성 가져오기"를 클릭하고 복원할 JSON 파일 선택

구성에 포함된 내용:
- 모든 프록시 정보
- 테마 설정
- 다크 모드 시간대
- 언어 설정
- 동기화 스위치 상태

### 6.6 프록시 상태 감지

"프록시 효과 감지" 버튼을 클릭하면:
- 현재 브라우저 프록시 모드 확인
- 확장 프로그램이 프록시를 성공적으로 제어했는지 확인
- 다른 확장 프로그램이 제어를 차지했는지 감지
- 문제 진단 및 제안 얻기

## 7. 🔧 기술 아키텍처

### 7.1 Manifest V3

- Chrome은 Manifest V3 사양 사용
- Service Worker가 백그라운드 페이지 대체
- Firefox는 background scripts + onRequest API 사용

### 7.2 핵심 모듈

1. **worker.js (Chrome)**:
   - 프록시 구성 관리
   - PAC 스크립트 생성
   - 인증 처리
   - 프록시 테스트 로직
   - 저장소 변경 감시

2. **popup.js**:
   - 팝업 인터페이스 상호작용
   - 프록시 상태 표시
   - 빠른 프록시 전환
   - 자동 매칭 표시

3. **main.js**:
   - 설정 페이지 로직
   - 프록시 관리 (CRUD)
   - 드래그 앤 드롭 정렬
   - 가져오기/내보내기
   - 프록시 감지 기능

4. **i18n.js**:
   - 다국어 지원
   - 실시간 언어 전환

### 7.3 데이터 저장

- `chrome.storage.local`: 로컬 저장 (항상 사용)
- `chrome.storage.sync`: 클라우드 동기화 저장 (선택 사항)
- 로컬 우선 원칙, 동기화 할당량 문제 해결

### 7.4 브라우저 호환성

| 기능 | Chrome | Firefox |
|------|--------|---------|
| 수동 모드 | ✅ | ✅ |
| 자동 모드 | ✅ | ✅ |
| 프록시 인증 | ✅ | ✅ |
| 프록시 테스트 | ✅ | ✅ |
| 테마 전환 | ✅ | ✅ |
| 데이터 동기화 | ✅ | ✅ |
| 프록시 감지 | ✅ | ✅ |

## 8. 📝 사용 시나리오

### 8.1 시나리오 1: 다중 프록시 전환

- 서로 다른 네트워크 환경에 대해 서로 다른 프록시 구성
- 사무실 네트워크에는 회사 프록시 사용
- 가정 네트워크에는 과학上网 프록시 사용
- 빠른 원클릭 전환

### 8.2 시나리오 2: 스마트 라우팅

- 국내 웹사이트는 직접 연결
- 특정 웹사이트는 프록시 통해
- 도메인에 따른 자동 선택

### 8.3 시나리오 3: 프록시 풀 테스트

- 여러 프록시 가져오기
- 일괄 지연 시간 테스트
- 사용할 최적의 프록시 선택

### 8.4 시나리오 4: 팀 공유

- 구성 파일 내보내기
- 팀원과 공유
- 통합 프록시 구성

## 9. ⚠️ 주요 사항

1. **권한 설명**: 확장에 다음 권한이 필요합니다:
   - `proxy`: 프록시 설정 관리
   - `storage`: 구성 저장
   - `webRequest` / `webRequestAuthProvider`: 인증 요청 처리
   - `<all_urls>`: 모든 웹사이트 URL 접근

2. **다른 확장 프로그램과의 충돌**: 프록시 충돌이 발생하면 다른 프록시/VPN 확장 프로그램 비활성화

3. **보안**: 자격 증명은 브라우저에 로컬로 저장됩니다. 기기의 보안을 확인하세요.

4. **네트워크 요구 사항**: 프록시 서버가 정상적으로 접근 가능한지 확인

5. **Firefox 제한**: Firefox 최소 버전 요구 사항은 142.0입니다

## 10. 📄 개인정보 처리방침

[개인정보 처리방침](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 11. 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](../LICENSE) 파일을 참조하세요.

## 12. 🤝 기여

이슈 보고 및 풀 리퀘스트를 환영합니다!

## 13. 📧 연락처

질문이나 제안이 있으시면 GitHub Issues를 통해 피드백을 보내주세요.

---

<div align="center">

**이 프로젝트가 도움이 되셨다면, Star ⭐ 로 지원해 주세요!**

</div>
