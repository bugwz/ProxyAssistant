<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Proxy-Assistent

</div>

<div align="center">

[![Chrome-Erweiterung](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Mehrsprachig](https://img.shields.io/badge/Unterstützt-mehrere-Sprachen-yellow)](README-en.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [**Deutsch**](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

Eine leistungsst Chrome-Browser-Proxy-Verwaltungserweiterung, die Ihnen hilft, Netzwerk-Proxys einfach zu konfigurieren und zu wechseln.
</div>

![](public/images/promotion/1400-560-big.jpeg)

## ✨ Funktionen

### 🔌 Unterstützung mehrerer Proxy-Protokolle
- **HTTP** - Traditioneller HTTP-Proxy
- **HTTPS** - Sicherer HTTPS-Proxy
- **SOCKS5** - SOCKS5-Proxy mit TCP/UDP-Unterstützung
- **SOCKS4** - Legacy SOCKS4-Proxy-Kompatibilität

### 🔄 Drei Proxy-Modi

| Modus | Beschreibung |
|-------|--------------|
| **Deaktiviert** | Proxy deaktivieren, Standard-Netzwerkverbindung des Systems verwenden |
| **Manuell** | Proxy manuell aus der Liste auswählen |
| **Automatisch** | Automatisch passenden Proxy basierend auf URL-Regeln auswählen (PAC-Modus) |

| ![](../../public/img/demo-popup-01.png) | ![](../../public/img/demo-popup-02.png) | ![](../../public/img/demo-popup-03.png) |
|:---:|:---:|:---:|
| Deaktiviert | Manuell | Automatisch |

### 📋 Flexible URL-Regelkonfiguration

- **Adressen ohne Proxy** (`bypass_urls`): Direktverbindungs-Domains/IPs
- **Adressen mit Proxy** (`include_urls`): Domains, die Proxy-Zugriff erfordern
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

### 🌙 Themen-Modi

- **Hellmodus**: Für den Tag
- **Dunkelmodus**: Für die Nacht
- **Automatischer Wechsel**: Thema basierend auf der Zeit automatisch wechseln

| ![Hellmodus](../../public/img/demo-light.png) | ![Dunkelmodus](../../public/img/demo-night.png) |
|:---:|:---:|
| Hellmodus | Dunkelmodus |

### ☁️ Datensynchronisierung

- **Google-Konto-Synchronisierung**: Proxy-Konfigurationen über mehrere Geräte hinweg synchronisieren
- **Lokaler Speicher**: Option zum lokalen Speichern

### 🌍 Mehrsprachige Unterstützung

Diese Erweiterung unterstützt 5 Sprachen:

| Sprache | Code | Status |
|---------|------|--------|
| 简体中文 | zh-CN | ✅ Unterstützt |
| 繁體中文 | zh-TW | ✅ Unterstützt |
| English | en | ✅ Unterstützt |
| 日本語 | ja | ✅ Unterstützt |
| Français | fr | ✅ Unterstützt |

## 📷 Einstellungsseite

![](../../public/img/demo.png)

## 📁 Projektstruktur

```
ProxyAssistant/
├──                     # Mehrsprachige Dokumentation
│   ├── README-zh-CN.md       # Vereinfachtes Chinesisch
│   ├── README-zh-TW.md       # Traditionelles Chinesisch
│   ├── README-en.md          # Englisch
│   └── ...
├── src/                       # Quellcode
│   ├── manifest.json         # Chrome-Erweiterungskonfiguration
│   ├── main.html             # Einstellungsseite
│   ├── popup.html            # Popup-Seite
│   ├── js/
│   │   ├── main.js           # Hauptlogik der Einstellungsseite
│   │   ├── popup.js          # Hauptlogik des Popups
│   │   ├── service-worker.js # Hintergrunddienst (Proxy-Kernlogik)
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
│       ├── demo.png
│       ├── demo-light.png
│       ├── demo-night.png
│       ├── demo-popup-01.png
│       ├── demo-popup-02.png
│       ├── demo-popup-03.png
│       └── promotion/
│           └── 1400-560-big.jpeg
└── public/                   # Öffentliche Ressourcen
    └── ...
```

## 🚀 Schnellstart

### Installation der Erweiterung

1. Öffnen Sie Chrome und navigieren Sie zu `chrome://extensions/`
2. Aktivieren Sie den **"Entwicklermodus"** oben rechts
3. Klicken Sie auf **"Entpackte Erweiterung laden"**
4. Wählen Sie den `ProxyAssistant/src` Ordner

### Hinzufügen eines Proxys

1. Klicken Sie auf das Erweiterungssymbol, um das Popup zu öffnen
2. Klicken Sie auf die **"Einstellungen"**-Schaltfläche, um die Einstellungsseite zu öffnen
3. Klicken Sie auf die **"Neu"**-Schaltfläche, um einen neuen Proxy hinzuzufügen
4. Füllen Sie die Proxy-Informationen aus:
   - Proxy-Name
   - Protokolltyp (HTTP/HTTPS/SOCKS5)
   - Proxy-Adresse (IP oder Domain)
   - Portnummer
   - (Optional) Benutzername und Passwort
5. Klicken Sie auf die **"Speichern"**-Schaltfläche

### Verwenden von Proxys

**Manueller Modus**:
1. Wählen Sie den **"Manuell"**-Modus im Popup
2. Wählen Sie einen Proxy aus der Liste
3. Der Status "Verbunden" zeigt an, dass er aktiv ist

**Automatischer Modus**:
1. Wählen Sie den **"Automatisch"**-Modus im Popup
2. Konfigurieren Sie URL-Regeln für jeden Proxy auf der Einstellungsseite
3. Proxys werden automatisch basierend auf der besuchten Website ausgewählt

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

### PAC-Skript-Automatikmodus

Der automatische Modus verwendet PAC (Proxy Auto-Config) Skripte:
- Wählt automatisch den Proxy basierend auf der aktuellen URL
- Unterstützt Fallback-Richtlinien (direkte Verbindung oder Ablehnung)
- Stellt automatisch die letzte Konfiguration beim Browser-Start wieder her

### Tastaturkürzel

| Aktion | Methode |
|--------|---------|
| Proxy-Karte erweitern/zuklappen | Auf Kartenüberschrift klicken |
| Alle Karten erweitern/zuklappen | Auf "Alle erweitern"-Button klicken |
| Proxy per Drag & Drop neu ordnen | Ziehen am Griff auf der Kartenüberschrift |
| Passwort anzeigen/ausblenden | Auf das Auge-Symbol im Passwortfeld klicken |
| Einzelnen Proxy testen | Auf "Testen"-Button klicken |
| Alle Proxys testen | Auf "Alle testen"-Button klicken |

### Konfiguration importieren/exportieren

1. **Exportieren**: Klicken Sie auf "Exportieren", um eine JSON-Datei herunterzuladen
2. **Importieren**: Klicken Sie auf "Importieren" und wählen Sie eine JSON-Datei aus

Die Konfiguration enthält:
- Alle Proxy-Informationen
- Theme-Einstellungen
- Synchronisierungseinstellungen

## 🔧 Technische Architektur

### Manifest V3

- Verwendet die Chrome-Erweiterung Manifest V3-Spezifikation
- Service Worker ersetzt Hintergrundseiten
- Sicherere und effizientere Architektur

### Kernmodule

1. **service-worker.js**:
   - Proxy-Konfigurationsverwaltung
   - PAC-Skript-Generierung
   - Authentifizierungsbehandlung
   - Proxy-Testlogik

2. **popup.js**:
   - Popup-Schnittstelleninteraktion
   - Proxy-Statusanzeige
   - Schneller Proxy-Wechsel

3. **main.js**:
   - Einstellungsseitenlogik
   - Proxy-Verwaltung (CRUD)
   - Drag & Drop-Sortierung
   - Import/Export

4. **i18n.js**:
   - Mehrsprachige Unterstützung
   - Echtzeit-Sprachwechsel

### Datenspeicherung

- `chrome.storage.local`: Lokaler Speicher
- `chrome.storage.sync`: Cloud-Synchronisierungsspeicher
- Automatische Speicherquotenbehandlung

## 📝 Anwendungsfälle

### Szenario 1: Mehrfacher Proxy-Wechsel

- Verschiedene Proxys für verschiedene Netzwerkumgebungen konfigurieren
- Unternehmens-Proxy für Büronetzwerk verwenden
- VPN-Proxy für Heimnetzwerk verwenden
- Schneller Ein-Klick-Wechsel

### Szenario 2: Intelligentes Routing

- Inländische Websites direkte Verbindung
- Bestimmte Websites über Proxy
- Automatische Auswahl basierend auf Domain

### Szenario 3: Proxy-Pool-Test

- Mehrere Proxys importieren
- Latenz im Batch testen
- Optimalen Proxy auswählen

### Szenario 4: Teamfreigabe

- Konfigurationsdatei exportieren
- Mit Teammitgliedern teilen
- Einheitliche Proxy-Konfiguration

## ⚠️ Wichtige Hinweise

1. **Berechtigungsbeschreibung**: Die Erweiterung erfordert die folgenden Berechtigungen:
   - `proxy`: Proxy-Einstellungen verwalten
   - `storage`: Konfigurationen speichern
   - `webRequest`: Authentifizierungsanfragen bearbeiten
   - `<all_urls>`: Auf alle Website-URLs zugreifen

2. **Konflikte mit anderen Erweiterungen**: Bei Proxy-Konflikten deaktivieren Sie bitte andere Proxy-Erweiterungen

3. **Sicherheit**: Anmeldeinformationen werden lokal im Browser gespeichert. Bitte stellen Sie die Sicherheit Ihres Geräts sicher

4. **Netzwerkanforderungen**: Stellen Sie sicher, dass der Proxy-Server zugänglich ist

## 📄 Lizenz

MIT License - Siehe [LICENSE](../LICENSE)-Datei für Details

## 🤝 Beiträge

Issue-Berichte und Pull-Requests sind willkommen!

## 📧 Kontakt

Bei Fragen oder Anregungen senden Sie bitte Feedback über GitHub Issues.
