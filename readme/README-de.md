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

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/store/promotional/marquee-1632x656.jpeg)

## ✨ Funktionen

### 🔌 Unterstützung mehrerer Proxy-Protokolle
- **HTTP** - Traditioneller HTTP-Proxy
- **HTTPS** - Sicherer HTTPS-Proxy
- **SOCKS5** - SOCKS5-Proxy mit TCP/UDP-Unterstützung
- **SOCKS4** - Legacy SOCKS4-Proxy-Kompatibilität

### 🌐 Multi-Browser-Unterstützung
- **Chrome** - Verwendung von Manifest V3 + Service Worker
- **Firefox** - Verwendung von onRequest API für Proxy-Intercept

### 🔄 Drei Proxy-Modi

| Modus | Beschreibung |
|-------|--------------|
| **Deaktiviert** | Proxy deaktivieren, Standard-Netzwerkverbindung des Systems verwenden |
| **Manuell** | Proxy manuell aus der Liste auswählen |
| **Automatisch** | Automatisch passenden Proxy basierend auf URL-Regeln auswählen (PAC-Modus) |

| ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/popup/disabled.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/popup/manual.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/popup/auto.png) |
|:---:|:---:|:---:|
| Deaktiviert | Manuell | Automatisch |

### 📋 Flexible URL-Regelkonfiguration

- **Adressen ohne Proxy** (`bypass_urls`): Direktverbindungs-Domains/IPs im manuellen Modus
- **Adressen mit Proxy** (`include_urls`): Domains, die Proxy-Zugriff im automatischen Modus erfordern
- **Fallback-Strategie**: Im automatischen Modus direkte Verbindung oder Ablehnung bei Verbindungsfehler wählen
- Unterstützt Wildcard `*` und Domain-Matching
- Geeignet für Szenarien, in denen verschiedene Websites verschiedene Proxys verwenden

### 🔐 Proxy-Authentifizierungsunterstützung

- Benutzername/Passwort-Authentifizierung
- Automatische Behandlung von Authentifizierungsanforderungen des Proxy-Servers
- Sichere Speicherung von Anmeldeinformationen

### 🧪 Proxy-Testfunktionen

- **Verbindungstest**: Proxy-Verfügbarkeit überprüfen
- **Latenzmessung**: Proxy-Antwortzeit testen
- **Batch-Test**: Alle Proxys mit einem Klick testen
- **Farbindikatoren**: Grün(<500ms) / Orange(≥500ms) / Rot(Fehlgeschlagen)

### 🏃 Proxy-Statuserkennung

- Erkennen der aktuellen Browser-Proxy-Einstellungen
- Überprüfen, ob die Erweiterung den Proxy erfolgreich gesteuert hat
- Identifizieren anderer Erweiterungen, die den Proxy steuern
- Drei Ergebnisse bereitstellen: Status, Warnung, Fehler

### 🌙 Themen-Modi

- **Hellmodus**: Für den Tag
- **Dunkelmodus**: Für die Nacht
- **Automatischer Wechsel**: Thema basierend auf der Zeit automatisch wechseln (konfigurierbarer Zeitraum)

| ![Hellmodus](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/main/theme-light.png) | ![Dunkelmodus](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/main/theme-dark.png) |
|:---:|:---:|
| Hellmodus | Dunkelmodus |

### ☁️ Datenspeicherung und Synchronisierung

- **Lokaler Speicher zuerst**: Proxy-Konfiguration wird immer im lokalen Speicher gespeichert
- **Cloud-Synchronisierung**: Optional Chrome/Firefox-Kontosynchronisierung aktivieren
- **Intelligente Zusammenführung**: Automatische Zusammenführung lokaler und entfernter Daten bei Synchronisierungsanomalien
- **Import/Export**: JSON-Format Konfigurationssicherung und -wiederherstellung unterstützt

### 🌍 Mehrsprachige Unterstützung

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

## 📷 Einstellungsseite

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/main/settings.png)

## 📁 Projektstruktur

```
ProxyAssistant/
├── readme/                    # Mehrsprachige Dokumentation
│   ├── README-zh-CN.md       # Vereinfachtes Chinesisch
│   ├── README-zh-TW.md       # Traditionelles Chinesisch
│   ├── README-en.md          # Englisch
│   └── ...
├── src/                       # Quellcode
│   ├── manifest_chrome.json  # Chrome-Erweiterungskonfiguration
│   ├── manifest_firefox.json # Firefox-Erweiterungskonfiguration
│   ├── main.html             # Einstellungsseite
│   ├── popup.html            # Popup-Seite
│   ├── js/
│   │   ├── worker.js         # Hintergrunddienst (Chrome: Service Worker)
│   │   ├── popup.js          # Hauptlogik des Popups
│   │   ├── main.js           # Hauptlogik der Einstellungsseite
│   │   ├── i18n.js           # Internationalisierungsunterstützung
│   │   └── jquery.js         # jQuery-Bibliothek
│   ├── css/
│   │   ├── main.css          # Stile der Einstellungsseite
│   │   ├── popup.css         # Popup-Stile
│   │   ├── theme.css         # Themen-Stile
│   │   ├── switch.css        # Schalter-Komponenten-Stile
│   │   ├── delete-button.css # Löschen-Button-Stile
│   │   └── eye-button.css    # Passwort-sichtbar-Button-Stile
│   └── images/               # Bildressourcen
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       ├── logo-128.png
│       └── promotion/        # Werbebilder
└── public/                   # Öffentliche Ressourcen
```

## 🚀 Schnellstart

### Installation der Erweiterung

**Chrome:**

Methode 1 (Empfohlen): Aus dem offiziellen Chrome Web Store installieren
1. Chrome öffnen und [Chrome Web Store](https://chrome.google.com/webstore) besuchen
2. Nach "Proxy-Assistent" suchen
3. Auf "Zu Chrome hinzufügen" klicken

Methode 2: Lokale Installation
- **Option A (Quellcode verwenden)**: Quellcode herunterladen, `src/manifest_chrome.json` in `manifest.json` umbenennen, dann das `src`-Verzeichnis laden
- **Option B (Installationspaket verwenden)**: Das Chrome-Erweiterungs-Installationspaket (`.zip`-Datei) aus dem `release`-Verzeichnis herunterladen, entpacken und das entsprechende Verzeichnis laden

**Firefox:**

Methode 1 (Empfohlen): Aus den offiziellen Firefox-Add-ons installieren
1. Firefox öffnen und [Firefox-Add-ons](https://addons.mozilla.org/) besuchen
2. Nach "Proxy-Assistent" suchen
3. Auf "Zu Firefox hinzufügen" klicken

Methode 2: Lokale Installation
1. Das Firefox-Erweiterungs-Installationspaket (`.xpi`-Datei) aus dem `release`-Verzeichnis herunterladen
2. Firefox öffnen und `about:addons` besuchen
3. Auf **Zahnradsymbol** → **Add-on aus Datei installieren** klicken
4. Die heruntergeladene `.xpi`-Datei auswählen

### Hinzufügen eines Proxys

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

### Verwenden von Proxys

**Manueller Modus**:
1. **"Manuell"** Modus im Popup auswählen
2. Den Proxy aus der Liste auswählen
3. Der Status "Verbunden" zeigt an, dass er aktiv ist

**Automatischer Modus**:
1. **"Automatisch"** Modus im Popup auswählen
2. URL-Regeln für jeden Proxy auf der Einstellungsseite konfigurieren
3. Der Proxy wird automatisch basierend auf der besuchten Website ausgewählt

## 📖 Detaillierte Dokumentation

### URL-Regelsyntax

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

### Fallback-Strategie

Im automatischen Modus, wenn die Proxy-Verbindung fehlschlägt:

| Strategie | Beschreibung |
|-----------|--------------|
| **Direktverbindung (DIRECT)** | Proxy umgehen, direkt zur Zielwebsite verbinden |
| **Verbindung ablehnen (REJECT)** | Die Anfrage ablehnen |

### PAC-Skript-Automatikmodus

Der automatische Modus verwendet PAC (Proxy Auto-Config) Skripte:
- Wählt automatisch den Proxy basierend auf der aktuellen URL
- In der Reihenfolge der Proxy-Liste abgleichen, ersten übereinstimmenden Proxy zurückgeben
- Unterstützt Fallback-Strategie
- Stellt automatisch die letzte Konfiguration beim Browser-Start wieder her

### Schnelloperationen

| Operation | Methode |
|-----------|---------|
| Proxy-Karte erweitern/zuklappen | Auf Kartenüberschrift klicken |
| Alle Karten erweitern/zuklappen | Auf "Alle erweitern/zuklappen"-Button klicken |
| Proxy per Drag & Drop neu ordnen | Ziehen am Griff auf der Kartenüberschrift |
| Passwort anzeigen/ausblenden | Auf das Auge-Symbol rechts vom Passwortfeld klicken |
| Einzelnen Proxy aktivieren/deaktivieren | Toggle auf der Karte |
| Einzelnen Proxy testen | Auf "Verbindung testen"-Button klicken |
| Alle Proxys testen | Auf "Alle testen"-Button klicken |

### Konfiguration importieren/exportieren

1. **Exportieren**: Auf "Konfiguration exportieren" klicken, um eine JSON-Datei herunterzuladen
2. **Importieren**: Auf "Konfiguration importieren" klicken und eine JSON-Datei zum Wiederherstellen auswählen

Die Konfiguration enthält:
- Alle Proxy-Informationen
- Themen-Einstellungen
- Dunkelmodus-Zeitraum
- Spracheinstellungen
- Synchronisationsschalter-Status

### Proxy-Statuserkennung

Auf den Button "Proxy-Effekt erkennen" klicken kann:
- Den aktuellen Browser-Proxy-Modus anzeigen
- Überprüfen, ob die Erweiterung den Proxy erfolgreich gesteuert hat
- Erkennen, ob andere Erweiterungen die Steuerung übernommen haben
- Problemdiagnose und Vorschläge erhalten

## 🔧 Technische Architektur

### Manifest V3

- Chrome verwendet Manifest V3-Spezifikation
- Service Worker ersetzt Hintergrundseiten
- Firefox verwendet background scripts + onRequest API

### Kernmodule

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

### Datenspeicherung

- `chrome.storage.local`: Lokaler Speicher (immer verwendet)
- `chrome.storage.sync`: Cloud-Synchronisierungsspeicher (optional)
- Lokal-zuerst-Prinzip, löst Problem der Synchronisierungsquote

### Browser-Kompatibilität

| Funktion | Chrome | Firefox |
|----------|--------|---------|
| Manueller Modus | ✅ | ✅ |
| Automatischer Modus | ✅ | ✅ |
| Proxy-Authentifizierung | ✅ | ✅ |
| Proxy-Test | ✅ | ✅ |
| Themenwechsel | ✅ | ✅ |
| Datensynchronisierung | ✅ | ✅ |
| Proxy-Erkennung | ✅ | ✅ |

## 📝 Anwendungsfälle

### Szenario 1: Mehrfacher Proxy-Wechsel

- Verschiedene Proxys für verschiedene Netzwerkumgebungen konfigurieren
- Unternehmens-Proxy für Büronetzwerk verwenden
- Wissenschaftlichen Proxy für Heimnetzwerk verwenden
- Schneller Ein-Klick-Wechsel

### Szenario 2: Intelligentes Routing

- Inländische Websites direkte Verbindung
- Bestimmte Websites über Proxy
- Automatische Auswahl basierend auf Domain

### Szenario 3: Proxy-Pool-Test

- Mehrere Proxys importieren
- Latenz im Batch testen
- Optimalen Proxy zum Verwenden auswählen

### Szenario 4: Teamfreigabe

- Konfigurationsdatei exportieren
- Mit Teammitgliedern teilen
- Einheitliche Proxy-Konfiguration

## ⚠️ Wichtige Hinweise

1. **Berechtigungsbeschreibung**: Die Erweiterung erfordert die folgenden Berechtigungen:
   - `proxy`: Proxy-Einstellungen verwalten
   - `storage`: Konfigurationen speichern
   - `webRequest` / `webRequestAuthProvider`: Authentifizierungsanfragen bearbeiten
   - `<all_urls>`: Auf alle Website-URLs zugreifen

2. **Konflikte mit anderen Erweiterungen**: Bei Proxy-Konflikten bitte andere Proxy/VPN-Erweiterungen deaktivieren

3. **Sicherheit**: Anmeldeinformationen werden lokal im Browser gespeichert. Bitte stellen Sie die Sicherheit Ihres Geräts sicher

4. **Netzwerkanforderungen**: Stellen Sie sicher, dass der Proxy-Server normal zugänglich ist

5. **Firefox-Einschränkung**: Die Mindestversion von Firefox ist 142.0

## 📄 Datenschutzrichtlinie

[Datenschutzrichtlinie](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 📄 Lizenz

MIT License - Siehe [LICENSE](../LICENSE)-Datei für Details

## 🤝 Beiträge

Issue-Berichte und Pull-Requests sind willkommen!

## 📧 Kontakt

Bei Fragen oder Anregungen senden Sie bitte Feedback über GitHub Issues.

---

<div align="center">

**Wenn dieses Projekt Ihnen geholfen hat, bitte unterstützen Sie es mit einem Star ⭐!**

</div>
