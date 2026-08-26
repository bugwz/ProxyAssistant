<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="Proxy-Assistent">

# Proxy-Assistent

[![Chrome-Erweiterung](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Firefox-Erweiterung](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Mehrsprachig](https://img.shields.io/badge/Mehrsprachig-yellow)](README-de.md)

Browser-Proxyverwaltung für Chrome, Firefox und Edge

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [**Deutsch**](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

Proxy-Assistent verwaltet HTTP-, HTTPS-, SOCKS4- und SOCKS5-Proxys direkt im Browser. Die Erweiterung bietet die Modi Deaktiviert, Manuell und Automatisch und bündelt Proxyknoten, Szenarien, Routingregeln, Regelabonnements, Synchronisierung und Diagnose auf einer Einstellungsseite.

Chrome, Firefox und Edge verwenden Manifest V3. Edge nutzt dasselbe Chromium-Paket wie Chrome. Das Projekt basiert auf nativem JavaScript, jQuery und Browser-Erweiterungs-APIs.

![Einstellungen](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260826132015/assets/localized/de.png)

## Funktionen

### Proxyknoten und Betriebsarten

- HTTP-, HTTPS-, SOCKS4- und SOCKS5-Proxyknoten verwalten.
- Adresse, Port, Benutzername, Passwort, Farbe und Aktivierungsstatus konfigurieren.
- Im Erweiterungs-Popup zwischen Deaktiviert, Manuell und Automatisch wechseln.
- Im manuellen Modus den ausgewählten Knoten verwenden und Umgehungsadressen festlegen.
- Im automatischen Modus aus den Proxyadressen der Knoten ein PAC-Skript erzeugen und direkten oder abgelehnten Fallback wählen.
- Einen oder alle Knoten testen und Latenz beziehungsweise Fehler anzeigen.

### Proxyszenarien

- Knoten verschiedener Netzwerkumgebungen in getrennten Szenarien speichern.
- Das aktuelle Szenario in den Einstellungen oder im Popup wechseln.
- Szenarien hinzufügen, umbenennen, löschen und sortieren sowie Knoten verschieben.
- Standardproxy und automatische Aktivierung nach Wochentag und Zeitraum festlegen.

### Regelabonnements

- Von mehreren Knoten nutzbare Regelabonnements zentral verwalten.
- AutoProxy-, Switchy-Legacy-, Switchy-Omega- und PAC-Formate unterstützen.
- Quelle, Parsergebnis, Proxyregeln und Direktregeln anzeigen.
- Regeln umkehren und manuell oder alle 1 Minute, 6 Stunden, 12 Stunden, 1 Tag oder 5 Tage aktualisieren.
- Abonnements als Hintergrundaufgabe aktualisieren.

### Konfiguration, Synchronisierung und Diagnose

- JSON-Konfiguration importieren und exportieren und Abonnements sowie Cache optional einschließen.
- Konfiguration über die native Browsersynchronisierung zwischen Geräten übertragen oder abrufen.
- Konfiguration über GitHub Gist übertragen oder abrufen und geplante Synchronisierung verwenden.
- Native Synchronisierungsdaten in 7 KB große Blöcke teilen und Quotennutzung anzeigen.
- Proxykontrolle, PAC-Status und mögliche Erweiterungskonflikte prüfen.
- Laufzeitprotokolle nach Stufe filtern, aktualisieren, kopieren und löschen.

### Oberflächeneinstellungen

- Helles, dunkles oder zeitgesteuert automatisch wechselndes Design verwenden.
- Farben eines benutzerdefinierten Designs per JSON bearbeiten.
- Vereinfachtes und traditionelles Chinesisch, Englisch, Japanisch, Französisch, Deutsch, Spanisch, Portugiesisch, Russisch und Koreanisch verwenden.
> Die SOCKS5-Anmeldefelder sind derzeit deaktiviert, da die Proxy-API von Chrome keine SOCKS5-Authentifizierung mit Benutzername und Passwort unterstützt.

## Installation

### Aus einem Release-Paket installieren

Reguläre Nutzer können die Erweiterung direkt aus einem Erweiterungsstore installieren:

- [Chrome Web Store](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk) für Chrome und Edge, wenn Chrome-Erweiterungen dort zugelassen sind.
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant) für Firefox.

Das passende Paket kann außerdem unter [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) heruntergeladen werden:

- Chrome, Edge und andere Chromium-Browser verwenden `ProxyAssistant_<version>_chrome.zip`.
- Firefox-Builds enthalten `ProxyAssistant_<version>_firefox.zip` und `ProxyAssistant_<version>_firefox.xpi`.

Für Chrome oder Edge das ZIP entpacken, auf der Erweiterungsseite den Entwicklermodus aktivieren und den entpackten Ordner laden. Der Release-Prozess erzeugt das Firefox-XPI als Build-Artefakt; die direkte Installation hängt von der Firefox-Signaturrichtlinie ab. Reguläre Nutzer sollten daher Firefox Add-ons verwenden.

### Aus dem Quellcode bauen

Das Repository verwaltet getrennte Manifeste für Chrome und Firefox. Zuerst sollte das passende Browserverzeichnis oder Paket erzeugt werden, damit `src/manifest.json` nicht direkt bearbeitet werden muss.

```bash
npm ci
make build VERSION=dev
```

Für Chrome oder Edge `build/ProxyAssistant_dev_chrome.zip` entpacken und laden. Für Firefox das Firefox-ZIP entpacken, `about:debugging` öffnen, „Dieser Firefox“ und „Temporäres Add-on laden“ wählen und `manifest.json` öffnen. Zur XPI-Erzeugung wird `web-ext` benötigt. Ohne `web-ext` werden Firefox-ZIP und TAR.GZ weiterhin erzeugt, das XPI jedoch übersprungen.

## Verwendung

1. Proxy-Assistent über die Browser-Symbolleiste öffnen.
2. In den Einstellungen einen Knoten mit Protokoll, Adresse und Port hinzufügen.
3. Bei Bedarf Zugangsdaten und Routingregeln ergänzen.
4. Im Popup Deaktiviert, Manuell oder Automatisch wählen.
5. Im manuellen Modus einen Knoten auswählen; im automatischen Modus übernimmt das PAC-Skript das Routing.

Häufige Konfigurationen:

- Immer einen Proxy verwenden: manuellen Modus wählen und den Zielknoten auswählen.
- Bestimmte Websites über Proxy leiten: zu den Proxyadressen eines Knotens hinzufügen und Automatisch wählen.
- Bestimmte Websites direkt verbinden: zu den Umgehungsadressen hinzufügen oder Direktregeln aus einem Abonnement verwenden.
- Büro, Zuhause und andere Umgebungen trennen: eigene Szenarien anlegen und im Popup wechseln.

## Daten und Berechtigungen

Die Erweiterung fordert folgende Berechtigungen an:

| Permission | Zweck |
| --- | --- |
| `proxy` | Browser-Proxyeinstellungen lesen und ändern |
| `storage` | Lokale Konfiguration speichern und native Synchronisierung verwenden |
| `webRequest`, `webRequestAuthProvider` | Auf Proxy-Authentifizierungsanfragen antworten |
| `alarms` | Abonnements, Szenarien und Synchronisierung planen |
| `<all_urls>` | Proxyregeln für Webanfragen erzeugen und aktuelle Website lesen |


Die Konfiguration liegt standardmäßig in `chrome.storage.local`. Proxy-Benutzernamen und -Passwörter gehören zur Konfiguration und sind in Exportdateien und aktiv übertragenen Synchronisierungsdaten enthalten. GitHub-Token und Gist-ID werden ausgeschlossen. Exportdateien sind entsprechend zu schützen; vor der Synchronisierung sollten die Sicherheitsanforderungen geprüft werden.

Beim Abrufen werden lokale Fachdaten ersetzt, lokale Verbindungsdaten und Zeitpläne der Synchronisierung bleiben jedoch erhalten. Bei wichtigen Daten vorher eine Sicherung exportieren.

[Datenschutzerklärung](https://sites.google.com/view/proxy-assistant/privacy-policy)

## Entwicklung

### Voraussetzungen

- Node.js 20 wie in GitHub Actions
- npm
- Chrome, Firefox oder Edge für Browsertests
- `web-ext`, nur zum Erzeugen des Firefox-XPI

Abhängigkeiten installieren:

```bash
npm ci
```

### Tests

```bash
npm test                    # Alle Jest-Tests
npm run test:unit           # Unit-Tests
npm run test:integration    # Integrationstests
npm run test:e2e            # End-to-End-Tests
npm run test:watch          # Überwachungsmodus
npm run test:coverage       # Abdeckungstests
```

Verfügbare Makefile-Einstiege:

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### Build

```bash
make build VERSION=dev
```

Das Skript leert `build/`, wählt das Browser-Manifest und erzeugt:

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

Ohne `web-ext` wird die letzte Datei nicht erzeugt.

### Projektstruktur

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # Browser-Lokalisierungen
│   ├── css/                  # Stile für Einstellungen und Popup
│   ├── images/               # Erweiterungssymbole
│   ├── js/                   # Seiten-, Proxy-, Speicher-, Sync- und Hintergrundlogik
│   ├── main.html             # Einstellungsseite
│   ├── popup.html            # Erweiterungs-Popup
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Paketskript für Chrome und Firefox
├── readme/                   # README in anderen Sprachen
├── release/                  # Versionshinweise
├── Makefile
└── package.json
```

Kernmodule:

| Datei | Aufgabe |
| --- | --- |
| `src/js/worker.js` | Proxy anwenden, PAC erzeugen, Authentifizierung, Aufgaben und Nachrichten |
| `src/js/main.js` | Einstellungen initialisieren und Module koordinieren |
| `src/js/popup.js` | Modi, Szenarien und Knoten im Popup wechseln |
| `src/js/proxy.js` | Knotenformulare, Listen und Tests |
| `src/js/scenarios.js` | Szenarien und Zeitregeln |
| `src/js/subscription.js` | Abonnements verwalten, analysieren und planen |
| `src/js/config.js` | Konfigurationsformat, Migration, Import und Export |
| `src/js/storage.js` | Lokaler Cache und Persistenz |
| `src/js/sync.js` | Native Synchronisierung und GitHub Gist |
| `src/js/detection.js` | Proxykontroll- und PAC-Diagnose |

Code- und Testregeln stehen in [AGENTS.md](../AGENTS.md).

## Browserhinweise

- Chrome verwendet einen Manifest-V3-Service-Worker.
- Firefox nutzt ein Manifest-V3-Background-Skript; das aktuelle Manifest verlangt Firefox 142 oder neuer.
- Edge nutzt das Chrome-Paket aus dem Chrome Web Store oder als entpackten Build. Eigene Manifeste und automatisierte Buildziele bleiben Chrome und Firefox.
- Mehrere aktive Proxy- oder VPN-Erweiterungen können um die Kontrolle konkurrieren; die Proxy-Statusseite hilft bei der Diagnose.

## Feedback und Beiträge

Probleme und Wünsche bitte über [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues) melden. Relevante Tests ausführen und Proxyverhalten möglichst in Chrome, Firefox und Edge prüfen.

## Lizenz

Dieses Projekt verwendet die [MIT-Lizenz](../LICENSE).
