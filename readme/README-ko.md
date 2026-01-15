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

![](../public/img/promotion/1400-560-big.jpg)

## ✨ 기능 특징

### 🔌 다중 프록시 프로토콜 지원
- **HTTP** - 전통적인 HTTP 프록시
- **HTTPS** - 보안 HTTPS 프록시
- **SOCKS5** - TCP/UDP를 지원하는 SOCKS5 프록시
- **SOCKS4** - 레거시 SOCKS4 프록시 호환성

### 🌐 다중 브라우저 지원
- **Chrome** - Manifest V3 + Service Worker 사용
- **Firefox** - onRequest API를 사용한 프록시 인터셉트

### 🔄 세 가지 프록시 모드

| 모드 | 설명 |
|------|------|
| **비활성화** | 프록시 비활성화, 시스템 기본 네트워크 연결 사용 |
| **수동** | 목록에서 프록시를 수동으로 선택 |
| **자동** | URL 규칙에 따라 자동으로 일치하는 프록시 선택 (PAC 모드) |

| ![](../public/img/demo-popup-01.png) | ![](../public/img/demo-popup-02.png) | ![](../public/img/demo-popup-03.png) |
|:---:|:---:|:---:|
| 비활성화 모드 | 수동 모드 | 자동 모드 |

### 📋 유연한 URL 규칙 구성

- **프록시를 사용하지 않는 주소** (`bypass_urls`): 수동 모드에서 직접 연결할 도메인/IP
- **프록시를 사용하는 주소** (`include_urls`): 자동 모드에서 프록시 접근이 필요한 도메인
- **대체 전략**: 자동 모드에서 연결 실패 시 직접 연결 또는 연결 거부 선택
- 와일드카드 `*` 및 도메인 매칭 지원
- 서로 다른 웹사이트에 서로 다른 프록시를 사용하는 시나리오에 적합

### 🔐 프록시 인증 지원

- 사용자명/비밀번호 인증 지원
- 프록시 서버의 인증 요청 자동 처리
- 자격 증명 정보 안전하게 저장

### 🧪 프록시 테스트 기능

- **연결 테스트**: 프록시 사용 가능 여부 확인
- **지연 시간 측정**: 프록시 응답 시간 테스트
- **일괄 테스트**: 모든 프록시를 한 번에 테스트
- **색상 표시**: 초록색(<500ms) / 주황색(≥500ms) / 빨간색(실패)

### 🏃 프록시 상태 감지

- 현재 브라우저 프록시 설정 감지
- 확장 프로그램이 프록시를 성공적으로 제어했는지 확인
- 다른 확장 프로그램의 프록시 제어 식별
- 상태, 경고, 오류 세 가지 결과 제공

### 🌙 테마 모드

- **라이트 모드**: 주간 사용
- **다크 모드**: 야간 사용
- **자동 전환**: 시간에 따라 테마 자동 전환 (구성 가능 시간대)

| ![라이트 모드](../public/img/demo-light.png) | ![다크 모드](../public/img/demo-night.png) |
|:---:|:---:|
| 라이트 모드 | 다크 모드 |

### ☁️ 데이터 저장 및 동기화

- **로컬 우선 저장**: 프록시 구성 항상 로컬 저장소에 저장
- **클라우드 동기화**: Chrome/Firefox 계정 동기화 선택적 활성화
- **스마트 병합**: 동기화 이상 시 로컬 및 원격 데이터 자동 병합
- **가져오기/내보내기**: JSON 형식 구성 백업 및 복원 지원

### 🌍 다국어 지원

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

## 📷 설정 인터페이스

![](../public/img/demo.png)

## 📁 프로젝트 구조

```
ProxyAssistant/
├── readme/                    # 다국어 문서
│   ├── README-zh-CN.md       # 간체 중국어
│   ├── README-zh-TW.md       # 번체 중국어
│   ├── README-en.md          # 영어
│   └── ...
├── src/                       # 소스 코드
│   ├── manifest_chrome.json  # Chrome 확장 프로그램 구성
│   ├── manifest_firefox.json # Firefox 확장 프로그램 구성
│   ├── main.html             # 설정 페이지
│   ├── popup.html            # 팝업 페이지
│   ├── js/
│   │   ├── worker.js         # 백그라운드 서비스 (Chrome: Service Worker)
│   │   ├── popup.js          # 팝업 메인 로직
│   │   ├── main.js           # 설정 페이지 메인 로직
│   │   ├── i18n.js           # 국제화 지원
│   │   └── jquery.js         # jQuery 라이브러리
│   ├── css/
│   │   ├── main.css          # 설정 페이지 스타일
│   │   ├── popup.css         # 팝업 스타일
│   │   ├── theme.css         # 테마 스타일
│   │   ├── switch.css        # 스위치 컴포넌트 스타일
│   │   ├── delete-button.css # 삭제 버튼 스타일
│   │   └── eye-button.css    # 비밀번호 표시 버튼 스타일
│   └── images/               # 이미지 리소스
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       ├── logo-128.png
│       └── promotion/        # 홍보 이미지
└── public/                   # 공개 리소스
```

## 🚀 빠른 시작

### 확장 프로그램 설치

**Chrome:**

방법 1 (권장): Chrome 공식 스토어에서 설치
1. Chrome을 열고 [Chrome 웹 스토어](https://chrome.google.com/webstore) 방문
2. "프록시 어시스턴트" 검색
3. "Chrome에 추가" 클릭

방법 2: 로컬 설치
- **옵션 A (소스 코드 사용)**: 소스 코드 다운로드, `src/manifest_chrome.json`을 `manifest.json`으로 이름 변경, then `src` 디렉토리 로드
- **옵션 B (설치 패키지 사용)**: release 디렉토리에서 Chrome 확장 설치 패키지 (`.zip` 파일) 다운로드, 압축 해제 후 해당 디렉토리 로드

**Firefox:**

방법 1 (권장): Firefox 공식附加组件에서 설치
1. Firefox를 열고 [Firefox附加组件](https://addons.mozilla.org/) 방문
2. "프록시 어시스턴트" 검색
3. "Firefox에 추가" 클릭

방법 2: 로컬 설치
1. release 디렉토리에서 Firefox 확장 설치 패키지 (`.xpi` 파일) 다운로드
2. Firefox를 열고 `about:addons` 방문
3. **톱니바퀴 아이콘** → **파일에서附加组件 설치** 클릭
4. 다운로드한 `.xpi` 파일 선택

### 프록시 추가

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

### 프록시 사용

**수동 모드**:
1. 팝업에서 **"수동"** 모드 선택
2. 목록에서 프록시 선택
3. "연결됨" 상태가 표시되면 활성화됨

**자동 모드**:
1. 팝업에서 **"자동"** 모드 선택
2. 설정 페이지에서 각 프록시에 대한 URL 규칙 구성
3. 방문하는 웹사이트에 따라 프록시가 자동으로 선택됨

## 📖 상세 설명

### URL 규칙 구문

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

### 대체 전략

자동 모드에서 프록시 연결이 실패할 때:

| 전략 | 설명 |
|------|------|
| **직접 연결 (DIRECT)** | 프록시 우회, 대상 웹사이트에 직접 연결 |
| **연결 거부 (REJECT)** | 요청 거부 |

### PAC 스크립트 자동 모드

자동 모드는 PAC (Proxy Auto-Config) 스크립트를 사용합니다:
- 현재 URL에 따라 프록시 자동 선택
- 프록시 목록 순서대로 매칭, 첫 번째 매칭 프록시 반환
- 대체 전략 지원
- 브라우저 시작 시 마지막 구성 자동 복원

### 바로 가기 작업

| 작업 | 방법 |
|------|------|
| 프록시 카드 펼치기/접기 | 카드 헤더 클릭 |
| 모든 카드 펼치기/접기 | "모두 펼치기/접기" 버튼 클릭 |
| 프록시 드래그하여 정렬 | 카드 헤더의 드래그 핸들 드래그 |
| 비밀번호 표시/숨기기 | 비밀번호 필드 오른쪽 눈 아이콘 클릭 |
| 개별 프록시 활성화/비활성화 | 카드에서 토글 |
| 개별 프록시 테스트 | "연결 테스트" 버튼 클릭 |
| 모든 프록시 테스트 | "모두 테스트" 버튼 클릭 |

### 구성 가져오기/내보내기

1. **구성 내보내기**: "구성 내보내기"를 클릭하여 JSON 파일 다운로드
2. **구성 가져오기**: "구성 가져오기"를 클릭하고 복원할 JSON 파일 선택

구성에 포함된 내용:
- 모든 프록시 정보
- 테마 설정
- 다크 모드 시간대
- 언어 설정
- 동기화 스위치 상태

### 프록시 상태 감지

"프록시 효과 감지" 버튼을 클릭하면:
- 현재 브라우저 프록시 모드 확인
- 확장 프로그램이 프록시를 성공적으로 제어했는지 확인
- 다른 확장 프로그램이 제어를 차지했는지 감지
- 문제 진단 및 제안 얻기

## 🔧 기술 아키텍처

### Manifest V3

- Chrome은 Manifest V3 사양 사용
- Service Worker가 백그라운드 페이지 대체
- Firefox는 background scripts + onRequest API 사용

### 핵심 모듈

1. **worker.js (Chrome)**:
   - 프록시 구성 관리
   - PAC 스크립트 생성
   - 인증 처리
   - 프록시 테스트 로직
   - 저장소 변경侦听

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

### 데이터 저장

- `chrome.storage.local`: 로컬 저장 (항상 사용)
- `chrome.storage.sync`: 클라우드 동기화 저장 (선택 사항)
- 로컬 우선 원칙, 동기화 할당량 문제 해결

### 브라우저 호환성

| 기능 | Chrome | Firefox |
|------|--------|---------|
| 수동 모드 | ✅ | ✅ |
| 자동 모드 | ✅ | ✅ |
| 프록시 인증 | ✅ | ✅ |
| 프록시 테스트 | ✅ | ✅ |
| 테마 전환 | ✅ | ✅ |
| 데이터 동기화 | ✅ | ✅ |
| 프록시 감지 | ✅ | ✅ |

## 📝 사용 시나리오

### 시나리오 1: 다중 프록시 전환

- 서로 다른 네트워크 환경에 대해 서로 다른 프록시 구성
- 사무실 네트워크에는 회사 프록시 사용
- 가정 네트워크에는 과학上网 프록시 사용
- 빠른 원클릭 전환

### 시나리오 2: 스마트 라우팅

- 국내 웹사이트는 직접 연결
- 특정 웹사이트는 프록시 통해
- 도메인에 따른 자동 선택

### 시나리오 3: 프록시 풀 테스트

- 여러 프록시 가져오기
- 일괄 지연 시간 테스트
- 사용할 최적의 프록시 선택

### 시나리오 4: 팀 공유

- 구성 파일 내보내기
- 팀원과 공유
- 통합 프록시 구성

## ⚠️ 주요 사항

1. **권한 설명**: 확장에 다음 권한이 필요합니다:
   - `proxy`: 프록시 설정 관리
   - `storage`: 구성 저장
   - `webRequest` / `webRequestAuthProvider`: 인증 요청 처리
   - `<all_urls>`: 모든 웹사이트 URL 접근

2. **다른 확장 프로그램과의 충돌**: 프록시 충돌이 발생하면 다른 프록시/VPN 확장 프로그램 비활성화

3. **보안**: 자격 증명은 브라우저에 로컬로 저장됩니다. 기기의 보안을 확인하세요.

4. **네트워크 요구 사항**: 프록시 서버가 정상적으로 접근 가능한지 확인

5. **Firefox 제한**: Firefox 최소 버전 요구 사항은 142.0입니다

## 📄 개인정보 처리방침

[개인정보 처리방침](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](../LICENSE) 파일을 참조하세요.

## 🤝 기여

이슈 보고 및 풀 리퀘스트를 환영합니다!

## 📧 연락처

질문이나 제안이 있으시면 GitHub Issues를 통해 피드백을 보내주세요.

---

<div align="center">

**이 프로젝트가 도움이 되셨다면, Star ⭐ 로 지원해 주세요!**

</div>
