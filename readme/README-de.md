<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Proxy-Assistent

</div>

<div align="center">

[![Chrome-Erweiterung](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Firefox-Erweiterung](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Mehrsprachig](https://img.shields.io/badge/Mehrsprachig-yellow)](README-de.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [**Deutsch**](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

Eine leistungsstarke Browser-Proxy-Verwaltungserweiterung, die Chrome und Firefox unterstützt und Ihnen hilft, Netzwerk-Proxys einfach zu konfigurieren und zu wechseln.

</div>

![](../public/img/promotion/1400-560.png)

## 1. ✨ Funktionen

### 1.1 🔌 Unterstützung mehrerer Proxy-Protokolle
- **HTTP** - Traditioneller HTTP-Proxy
- **HTTPS** - Sicherer HTTPS-Proxy
- **SOCKS5** - SOCKS5-Proxy mit TCP/UDP-Unterstützung
- **SOCKS4** - Legacy SOCKS4-Proxy-Kompatibilität

### 1.2 🌐 Multi-Browser-Unterstützung
- **Chrome** - Verwendung von Manifest V3 + Service Worker
- **Firefox** - Verwendung von onRequest API für Proxy-Intercept

### 1.3 🔄 Drei Proxy-Modi

| Modus | Beschreibung |
|-------|--------------|
| **Deaktiviert** | Proxy deaktivieren, Standard-Netzwerkverbindung des Systems verwenden |
| **Manuell** | Proxy manuell aus der Liste auswählen |
| **Automatisch** | Automatisch passenden Proxy basierend auf URL-Regeln auswählen (PAC-Modus) |

![](../public/img/promotion/1280-800-03.png)

### 1.4 📋 Flexible URL-Regelkonfiguration

- **Adressen ohne Proxy** (`bypass_urls`): Direktverbindungs-Domains/IPs im manuellen Modus
- **Adressen mit Proxy** (`include_urls`): Domains, die Proxy-Zugriff im automatischen Modus erfordern
- **Fallback-Strategie**: Im automatischen Modus direkte Verbindung oder Ablehnung bei Verbindungsfehler wählen
- Unterstützt Wildcard `*` und Domain-Matching
- Geeignet für Szenarien, in denen verschiedene Websites verschiedene Proxys verwenden

### 1.5 🔐 Proxy-Authentifizierungsunterstützung

- Benutzername/Passwort-Authentifizierung
- Automatische Behandlung von Authentifizierungsanforderungen des Proxy-Servers
- Sichere Speicherung von Anmeldeinformationen

### 1.6 🧪 Proxy-Testfunktionen

- **Verbindungstest**: Proxy-Verfügbarkeit überprüfen
- **Latenzmessung**: Proxy-Antwortzeit testen
- **Batch-Test**: Alle Proxys mit einem Klick testen
- **Farbindikatoren**: Grün(<500ms) / Orange(≥500ms) / Rot(Fehlgeschlagen)

### 1.7 🏃 Proxy-Statuserkennung

- Erkennen der aktuellen Browser-Proxy-Einstellungen
- Überprüfen, ob die Erweiterung den Proxy erfolgreich gesteuert hat
- Identifizieren anderer Erweiterungen, die den Proxy steuern
- Drei Ergebnisse bereitstellen: Status, Warnung, Fehler

### 1.8 🔍 PAC-Skript-Vorschau

- **Skript-Ansicht**: Automatisch generierten PAC-Skript-Inhalt anzeigen
- **Regelliste**: Klare Anzeige aller aktiven Proxy-Matching-Regeln
- **Debug-Support**: Einfache Fehlerbehebung bei Matching-Problemen im Auto-Modus

### 1.9 🌙 Themen-Modi

- **Hellmodus**: Für den Tag
- **Dunkelmodus**: Für die Nacht
- **Automatischer Wechsel**: Thema basierend auf der Zeit automatisch wechseln (konfigurierbarer Zeitraum)

![](../public/img/promotion/1280-800-02.png)

### 1.10 ☁️ Datenspeicherung und Synchronisierung

#### 1.10.1 Speicherstrategie

| Speichertyp | Speicherinhalt | Beschreibung |
|-------------|----------------|--------------|
| **Lokalspeicher (local)** | Proxy-Liste, Themeneinstellungen, Spracheinstellungen, Synchronisierungseinstellungen | Immer aktiv, Offline-Verfügbarkeit und Datenpersistenz gewährleistet |
| **Cloud-Synchronisierung (sync)** | Vollständige Konfigurationsdaten (Chunk-Speicher) | Optional, verwendet Chunk-Speicher, um Quotenlimits zu umgehen |

#### 1.10.2 Synchronisierungsmethoden

##### 1.10.2.1 Native Browser-Synchronisierung (Native Sync)
- Verwendet `chrome.storage.sync` API (Chrome) oder `browser.storage.sync` (Firefox)
- Automatische Synchronisierung über Chrome/Firefox-Konto
- Geeignet für Multi-Geräte-Synchronisierung mit demselben Browser-Konto
- **Chunk-Speicher**: Konfigurationsdaten werden automatisch in Chunks (7KB pro Chunk) aufgeteilt, um das 8KB-Limit für einzelne Elemente zu umgehen
- **Datenintegrität**: Verwendet Prüfsummen, um die Integrität der Synchronisierungsdaten sicherzustellen
- **Atomare Operationen**: Push-Vorgang löscht alte Daten, bevor neue Daten geschrieben werden, um Konsistenz zu gewährleisten
- **Quotenanzeige**: Echtzeitanzeige der genutzten/gesamten Quote (100KB) und Anzahl der Chunks

##### 1.10.2.2 GitHub Gist-Synchronisierung
- Synchronisierung der Konfiguration über Browser und Geräte hinweg via GitHub Gist
- Erfordert GitHub Personal Access Token
- Unterstützt manuelles Push/Pull oder automatische Synchronisierung
- Konfigurationsinhalt verschlüsselt gespeichert, sensible Informationen werden beim Export automatisch gelöscht

| Konfigurationselement | Beschreibung |
|----------------------|--------------|
| **Zugriffsschlüssel** | GitHub Personal Access Token (benötigt gist-Berechtigung) |
| **Dateiname** | Dateiname in Gist, Standard `proxy_assistant_config.json` |
| **Gist-ID** | Automatisch erkannt und gespeichert, keine manuelle Eingabe erforderlich |

#### 1.10.3 Synchronisierungsvorgänge

| Vorgang | Beschreibung |
|---------|--------------|
| **Push** | Lokale Konfiguration in die Cloud/Gist hochladen |
| **Pull** | Konfiguration aus der Cloud/Gist herunterladen |
| **Verbindung testen** | Gist Token-Gültigkeit und Konfigurationsstatus überprüfen |

#### 1.10.4 Import/Export

- **Exportieren**: JSON-Datei mit allen Proxy-Informationen, Themen-Einstellungen, Spracheinstellungen usw. generieren
- **Importieren**: Wiederherstellung der Konfiguration aus JSON-Datei unterstützen
- **Datensicherheit**: Export-Datei löscht automatisch sensible Informationen (Token, Passwort)
- **Format-Kompatibilität**: Import von Konfigurationsdateien aus älteren Versionen unterstützt

**Export-Struktur:**
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

### 1.11 🌍 Mehrsprachige Unterstützung

Diese Erweiterung unterstützt die folgenden Sprachen:

| Sprache | Code | Status |
|---------|------|--------|
| 简体中文 | zh-CN | ✅ Unterstützt |
| 繁體中文 | zh-TW | ✅ Unterstützt |
| English | en | ✅ Unterstützt |
| 日本語 | ja | ✅ Unterstützt |
| Français | fr | ✅ Unterstützt |
| Deutsch | de | ✅ Unterstützt |
| Español | es | ✅ Unterstützt |
| Português | pt | ✅ Unterstützt |
| Русский | ru | ✅ Unterstützt |
| 한국어 | ko | ✅ Unterstützt |

![](../public/img/promotion/1280-800-04.png)

## 2. 📷 Einstellungsseite

![](../public/img/demo.png)

## 3. 📁 Projektstruktur

```
ProxyAssistant/
├── conf/                     # Beispielkonfiguration
│   └── demo.json             # Beispielkonfigurationsdatei
├── readme/                   # Mehrsprachige Dokumentation
│   ├── README-zh-CN.md       # Vereinfachtes Chinesisch
│   ├── README-zh-TW.md       # Traditionelles Chinesisch
│   ├── README-en.md          # Englisch
│   ├── README-ja.md          # Japanisch
│   ├── README-fr.md          # Französisch
│   ├── README-de.md          # Deutsch
│   ├── README-es.md          # Spanisch
│   ├── README-pt.md          # Portugiesisch
│   ├── README-ru.md          # Russisch
│   └── README-ko.md          # Koreanisch
├── src/                      # Quellcode
│   ├── manifest_chrome.json  # Chrome-Erweiterungskonfiguration (Manifest V3)
│   ├── manifest_firefox.json # Firefox-Erweiterungskonfiguration
│   ├── main.html             # Einstellungsseite
│   ├── popup.html            # Popup-Seite
│   ├── js/
│   │   ├── main.js           # Hauptlogik der Einstellungsseite
│   │   ├── popup.js          # Hauptlogik des Popups
│   │   ├── worker.js         # Hintergrunddienst (Chrome: Service Worker)
│   │   ├── i18n.js           # Internationalisierungsunterstützung
│   │   └── jquery.js         # jQuery-Bibliothek
│   ├── css/
│   │   ├── main.css          # Stile der Einstellungsseite (inkl. allgemeine Komponenten)
│   │   ├── popup.css         # Popup-Stile
│   │   ├── theme.css         # Themen-Stile
│   │   └── eye-button.css    # Passwort-sichtbar-Button-Stile
│   └── images/               # Bildressourcen
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
├── public/                   # Öffentliche Ressourcen
    └── img/                  # Demo- und Werbebilder
├── tests/                    # Tests
│   ├── jest.config.js        # Jest-Konfiguration
│   ├── setup.js              # Testumgebung-Setup
│   ├── __mocks__/            # Mock-Dateien
│   │   └── chrome.js         # Chrome API Mock
│   ├── unit/                 # Unit-Tests
│   ├── integration/          # Integrationstests
│   └── e2e/                  # End-to-End-Tests
├── script/                   # Build-Skripte
│   └── build.sh              # Erweiterungs-Build-Skript
├── release/                  # Release-Notizen
│   └── *.md                  # Update-Logs für Versionen
├── build/                    # Build-Ausgabeverzeichnis
├── package.json              # Projektabhängigkeiten
├── package-lock.json         # Abhängigkeitsversionen-Sperre
├── Makefile                  # Build-Befehlseingang
├── jest.config.js            # Jest-Konfiguration (verweist auf tests/jest.config.js)
└── AGENTS.md                 # Entwicklungsleitfaden
```

## 4. 🚀 Schnellstart

### 4.1 Installation der Erweiterung

#### 4.1.1 Chrome

**Methode 1 (Empfohlen)**: Aus dem offiziellen Chrome Web Store installieren
1. Chrome öffnen und [Chrome Web Store](https://chrome.google.com/webstore) besuchen
2. Nach "Proxy-Assistent" suchen
3. Auf "Zu Chrome hinzufügen" klicken

**Methode 2**: Lokale Installation
- **Option A (Quellcode verwenden)**: Quellcode herunterladen, `src/manifest_chrome.json` in `manifest.json` umbenennen, dann das `src`-Verzeichnis laden
- **Option B (Installationspaket verwenden)**:
  1. Zur Seite [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) gehen
  2. Datei `proxy-assistant-chrome-x.x.x.zip` herunterladen
  3. Die heruntergeladene ZIP-Datei in ein beliebiges Verzeichnis entpacken
  4. Chrome öffnen und `chrome://extensions/` besuchen
  5. Den **"Entwicklermodus"** oben rechts aktivieren
  6. Auf den Button **"Entpackte Erweiterung laden"** oben links klicken
  7. Den in Schritt 3 entpackten Ordner auswählen
  8. Die Erweiterung erscheint in der Erweiterungsliste nach erfolgreicher Installation

#### 4.1.2 Firefox

**Methode 1 (Empfohlen)**: Aus den offiziellen Firefox-Add-ons installieren
1. Firefox öffnen und [Firefox-Add-ons](https://addons.mozilla.org/) besuchen
2. Nach "Proxy-Assistent" suchen
3. Auf "Zu Firefox hinzufügen" klicken

**Methode 2**: Lokale Installation
1. Das Firefox-Erweiterungs-Installationspaket (`.xpi`-Datei) aus dem `release`-Verzeichnis herunterladen
2. Firefox öffnen und `about:addons` besuchen
3. Auf **Zahnradsymbol** → **Add-on aus Datei installieren** klicken
4. Die heruntergeladene `.xpi`-Datei auswählen

#### 4.1.3 Microsoft Edge

Der Edge-Browser basiert auf dem Chromium-Kernel und kann Chrome-Erweiterungen direkt installieren.

**Methode 1 (Empfohlen)**: Aus dem Chrome Web Store installieren
1. Edge öffnen und `edge://extensions/` besuchen
2. Im Abschnitt "Neue Erweiterungen finden" auf "Erweiterungen aus dem Chrome Web Store abrufen" klicken, [Chrome Web Store](https://chrome.google.com/webstore) besuchen
3. Nach "Proxy-Assistent" suchen
4. Auf "Abrufen" klicken und dann "Zu Microsoft Edge hinzufügen"

**Methode 2**: Lokale Installation
1. Zur Seite [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) gehen
2. Datei `proxy-assistant-chrome-x.x.x.zip` herunterladen
3. Die heruntergeladene ZIP-Datei in ein beliebiges Verzeichnis entpacken
4. Edge öffnen und `edge://extensions/` besuchen
5. Den **"Entwicklermodus"** unten links aktivieren
6. Auf den Button **"Entpacktes Verzeichnis auswählen"** klicken
7. Den in Schritt 3 entpackten Ordner auswählen
8. Die Erweiterung erscheint in der Erweiterungsliste nach erfolgreicher Installation

### 4.2 Hinzufügen eines Proxys

1. Auf das Erweiterungssymbol klicken, um das Popup zu öffnen
2. Auf die **"Einstellungen"**-Schaltfläche klicken, um die Einstellungsseite zu öffnen
3. Auf die **"Neuer Proxy"**-Schaltfläche klicken, um einen neuen Proxy hinzuzufügen
4. Die Proxy-Informationen ausfüllen:
   - Proxy-Name
   - Protokolltyp (HTTP/HTTPS/SOCKS4/SOCKS5)
   - Proxy-Adresse (IP oder Domain)
   - Port
   - (Optional) Benutzername und Passwort
   - (Optional) URL-Regelkonfiguration
5. Auf die **"Speichern"**-Schaltfläche klicken

### 4.3 Verwenden von Proxys

**Manueller Modus**:
1. **"Manuell"** Modus im Popup auswählen
2. Den Proxy aus der Liste auswählen
3. Der Status "Verbunden" zeigt an, dass er aktiv ist

**Automatischer Modus**:
1. **"Automatisch"** Modus im Popup auswählen
2. URL-Regeln für jeden Proxy auf der Einstellungsseite konfigurieren
3. Der Proxy wird automatisch basierend auf der besuchten Website ausgewählt

## 5. 🛠️ Entwicklerhandbuch

### 5.1 Entwicklungsumgebung

**Voraussetzungen**:
- Node.js >= 14
- npm >= 6
- Chrome / Firefox Browser (zum Testen)
- web-ext (für Firefox XPI Build, optional)

**Abhängigkeiten installieren**:
```bash
make test_init
# oder
npm install
```

### 5.2 Testbefehle

| Befehl | Beschreibung |
|--------|--------------|
| `make test` | Alle Tests ausführen (Unit + Integration + E2E) |
| `make test_nocache` | Tests ohne Cache ausführen |
| `make test_unit` | Nur Unit-Tests ausführen |
| `make test_integration` | Nur Integrationstests ausführen |
| `make test_e2e` | Nur E2E-Tests ausführen |
| `make test_watch_nocache` | Tests im Watch-Modus ausführen |
| `make test_cov_nocache` | Tests ausführen und Abdeckungsbericht generieren |

**npm direkt verwenden**:
```bash
npm test                    # Alle Tests ausführen
npm run test:unit           # Nur Unit-Tests ausführen
npm run test:integration    # Nur Integrationstests ausführen
npm run test:e2e            # Nur E2E-Tests ausführen
npm run test:watch          # Tests im Watch-Modus ausführen
npm run test:coverage       # Tests ausführen und Abdeckungsbericht generieren
```

### 5.3 Build-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `make build` | Chrome- und Firefox-Erweiterungen bauen |
| `make clean` | Build-Artefakte bereinigen |
| `make test_clean` | Test-Cache und Abdeckungsdateien bereinigen |

**Version angeben**:
```bash
make build VERSION=1.4.0
# oder
./script/build.sh 1.3.1
```

**Build-Artefakte**:
```
build/
├── ProxyAssistant_{VERSION}_chrome.zip      # Chrome Installationspaket
├── ProxyAssistant_{VERSION}_chrome.tar.gz   # Chrome Quellpaket
├── ProxyAssistant_{VERSION}_firefox.zip     # Firefox Installationspaket
├── ProxyAssistant_{VERSION}_firefox.tar.gz  # Firefox Quellpaket
└── ProxyAssistant_{VERSION}_firefox.xpi     # Firefox offizielles Erweiterungspaket
```

### 5.4 Lokale Entwicklung

**Chrome Lokale Installation**:
1. `src/manifest_chrome.json` in `manifest.json` umbenennen
2. Chrome öffnen, `chrome://extensions/` besuchen
3. **"Entwicklermodus"** aktivieren
4. **"Entpackte Erweiterung laden"** klicken
5. `src` Verzeichnis auswählen

**Firefox Lokale Installation**:
1. `make build` verwenden, um XPI-Datei zu generieren
2. Firefox öffnen, `about:addons` besuchen
3. **Zahnradsymbol** → **Add-on aus Datei installieren** klicken
4. Die generierte `.xpi`-Datei auswählen

### 5.5 Code-Stil

- **Einrückung**: 2 Leerzeichen
- **Anführungszeichen**: Einfache Anführungszeichen
- **Benennung**: camelCase, Konstanten verwenden UPPER_SNAKE_CASE
- **Semikolons**: Konsistente Verwendung

Detaillierte Spezifikationen finden Sie in [AGENTS.md](../AGENTS.md)

## 6. 📖 Detaillierte Dokumentation

### 6.1 URL-Regelsyntax

Unterstützt die folgenden Matching-Regeln:

```
# Exakte Übereinstimmung
google.com

# Subdomain-Übereinstimmung
.google.com
www.google.com

# Wildcard-Übereinstimmung
*.google.com
*.twitter.com

# IP-Adresse
192.168.1.1
10.0.0.0/8
```

### 6.2 Fallback-Strategie

Im automatischen Modus, wenn die Proxy-Verbindung fehlschlägt:

| Strategie | Beschreibung |
|-----------|--------------|
| **Direktverbindung (DIRECT)** | Proxy umgehen, direkt zur Zielwebsite verbinden |
| **Verbindung ablehnen (REJECT)** | Die Anfrage ablehnen |

### 6.3 PAC-Skript-Automatikmodus

Der automatische Modus verwendet PAC (Proxy Auto-Config) Skripte:
- Wählt automatisch den Proxy basierend auf der aktuellen URL
- In der Reihenfolge der Proxy-Liste abgleichen, ersten übereinstimmenden Proxy zurückgeben
- Unterstützt Fallback-Strategie
- Stellt automatisch die letzte Konfiguration beim Browser-Start wieder her

### 6.4 Schnelloperationen

| Operation | Methode |
|-----------|---------|
| Proxy-Karte erweitern/zuklappen | Auf Kartenüberschrift klicken |
| Alle Karten erweitern/zuklappen | Auf "Alle erweitern/zuklappen"-Button klicken |
| Proxy per Drag & Drop neu ordnen | Ziehen am Griff auf der Kartenüberschrift |
| Passwort anzeigen/ausblenden | Auf das Auge-Symbol rechts vom Passwortfeld klicken |
| Einzelnen Proxy aktivieren/deaktivieren | Toggle auf der Karte |
| Einzelnen Proxy testen | Auf "Verbindung testen"-Button klicken |
| Alle Proxys testen | Auf "Alle testen"-Button klicken |
| Popup schnell schließen | Auf der Seite `ESC` Taste drücken |

### 6.5 Konfiguration importieren/exportieren

1. **Exportieren**: Auf "Konfiguration exportieren" klicken, um eine JSON-Datei herunterzuladen
2. **Importieren**: Auf "Konfiguration importieren" klicken und eine JSON-Datei zum Wiederherstellen auswählen

Die Konfiguration enthält:
- Alle Proxy-Informationen
- Themen-Einstellungen
- Dunkelmodus-Zeitraum
- Spracheinstellungen
- Synchronisationsschalter-Status

### 6.6 Proxy-Statuserkennung

Auf den Button "Proxy-Effekt erkennen" klicken kann:
- Den aktuellen Browser-Proxy-Modus anzeigen
- Überprüfen, ob die Erweiterung den Proxy erfolgreich gesteuert hat
- Erkennen, ob andere Erweiterungen die Steuerung übernommen haben
- Problemdiagnose und Vorschläge erhalten

## 7. 🔧 Technische Architektur

### 7.1 Manifest V3

- Chrome verwendet Manifest V3-Spezifikation
- Service Worker ersetzt Hintergrundseiten
- Firefox verwendet background scripts + onRequest API

### 7.2 Kernmodule

1. **worker.js (Chrome)**:
   - Proxy-Konfigurationsverwaltung
   - PAC-Skript-Generierung
   - Authentifizierungsbehandlung
   - Proxy-Testlogik
   - Speicheränderungen überwachen

2. **popup.js**:
   - Popup-Schnittstelleninteraktion
   - Proxy-Statusanzeige
   - Schneller Proxy-Wechsel
   - Automatische Übereinstimmungsanzeige

3. **main.js**:
   - Einstellungsseitenlogik
   - Proxy-Verwaltung (CRUD)
   - Drag & Drop-Sortierung
   - Import/Export
   - Proxy-Erkennungsfunktion

4. **i18n.js**:
   - Mehrsprachige Unterstützung
   - Echtzeit-Sprachwechsel

### 7.3 Datenspeicherung

- `chrome.storage.local`: Lokaler Speicher (immer verwendet)
- `chrome.storage.sync`: Cloud-Synchronisierungsspeicher (optional)
- Lokal-zuerst-Prinzip, löst Problem der Synchronisierungsquote

### 7.4 Browser-Kompatibilität

| Funktion | Chrome | Firefox |
|----------|--------|---------|
| Manueller Modus | ✅ | ✅ |
| Automatischer Modus | ✅ | ✅ |
| Proxy-Authentifizierung | ✅ | ✅ |
| Proxy-Test | ✅ | ✅ |
| Themenwechsel | ✅ | ✅ |
| Datensynchronisierung | ✅ | ✅ |
| Proxy-Erkennung | ✅ | ✅ |

## 8. 📝 Anwendungsfälle

### 8.1 Szenario 1: Mehrfacher Proxy-Wechsel

- Verschiedene Proxys für verschiedene Netzwerkumgebungen konfigurieren
- Unternehmens-Proxy für Büronetzwerk verwenden
- Wissenschaftlichen Proxy für Heimnetzwerk verwenden
- Schneller Ein-Klick-Wechsel

### 8.2 Szenario 2: Intelligentes Routing

- Inländische Websites direkte Verbindung
- Bestimmte Websites über Proxy
- Automatische Auswahl basierend auf Domain

### 8.3 Szenario 3: Proxy-Pool-Test

- Mehrere Proxys importieren
- Latenz im Batch testen
- Optimalen Proxy zum Verwenden auswählen

### 8.4 Szenario 4: Teamfreigabe

- Konfigurationsdatei exportieren
- Mit Teammitgliedern teilen
- Einheitliche Proxy-Konfiguration

## 9. ⚠️ Wichtige Hinweise

1. **Berechtigungsbeschreibung**: Die Erweiterung erfordert die folgenden Berechtigungen:
   - `proxy`: Proxy-Einstellungen verwalten
   - `storage`: Konfigurationen speichern
   - `webRequest` / `webRequestAuthProvider`: Authentifizierungsanfragen bearbeiten
   - `<all_urls>`: Auf alle Website-URLs zugreifen

2. **Konflikte mit anderen Erweiterungen**: Bei Proxy-Konflikten bitte andere Proxy/VPN-Erweiterungen deaktivieren

3. **Sicherheit**: Anmeldeinformationen werden lokal im Browser gespeichert. Bitte stellen Sie die Sicherheit Ihres Geräts sicher

4. **Netzwerkanforderungen**: Stellen Sie sicher, dass der Proxy-Server normal zugänglich ist

5. **Firefox-Einschränkung**: Die Mindestversion von Firefox ist 142.0

## 10. 📄 Datenschutzrichtlinie

[Datenschutzrichtlinie](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 11. 📄 Lizenz

MIT License - Siehe [LICENSE](../LICENSE)-Datei für Details

## 12. 🤝 Beiträge

Issue-Berichte und Pull-Requests sind willkommen!

## 13. 📧 Kontakt

Bei Fragen oder Anregungen senden Sie bitte Feedback über GitHub Issues.

---

<div align="center">

**Wenn dieses Projekt Ihnen geholfen hat, bitte unterstützen Sie es mit einem Star ⭐!**

</div>
