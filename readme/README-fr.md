<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="Assistant Proxy">

# Assistant Proxy

[![Extension Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Extension Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingue](https://img.shields.io/badge/Multilingue-yellow)](README-fr.md)

Gestionnaire de proxy pour Chrome, Firefox et Edge

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [**Français**](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

Assistant Proxy gère les proxys HTTP, HTTPS, SOCKS4 et SOCKS5 dans le navigateur. L'extension propose les modes désactivé, manuel et automatique, et réunit les nœuds, scénarios, règles de routage, abonnements, synchronisation et diagnostics dans une même page de paramètres.

Chrome, Firefox et Edge utilisent Manifest V3. Edge utilise le même paquet Chromium que Chrome. Le projet repose sur JavaScript natif, jQuery et les API d'extension du navigateur.

![Paramètres d'Assistant Proxy](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260826132015/assets/localized/fr.png)

## Fonctionnalités

### Nœuds proxy et modes de fonctionnement

- Gérer les nœuds HTTP, HTTPS, SOCKS4 et SOCKS5.
- Configurer l’adresse, le port, le nom d’utilisateur, le mot de passe, la couleur et l’état actif.
- Basculer entre les modes désactivé, manuel et automatique depuis la fenêtre de l’extension.
- En mode manuel, utiliser le nœud sélectionné et définir les adresses qui contournent le proxy.
- En mode automatique, générer un script PAC à partir des adresses de chaque nœud, avec repli en connexion directe ou en refus.
- Tester un nœud ou tous les nœuds et afficher la latence ou l’échec.

### Scénarios proxy

- Conserver les nœuds de différents environnements réseau dans plusieurs scénarios.
- Changer le scénario courant depuis les paramètres ou la fenêtre de l’extension.
- Ajouter, renommer, supprimer et trier les scénarios, et déplacer les nœuds entre eux.
- Définir un proxy par défaut et une activation automatique par jour et plage horaire.

### Abonnements de règles

- Gérer de manière centralisée des abonnements partagés par plusieurs nœuds.
- Prendre en charge AutoProxy, Switchy Legacy, Switchy Omega et PAC.
- Afficher le contenu source, le résultat analysé, les règles proxy et les règles directes.
- Inverser les règles et actualiser manuellement ou toutes les 1 minute, 6 heures, 12 heures, 1 jour ou 5 jours.
- Exécuter les mises à jour des abonnements en tâche de fond.

### Configuration, synchronisation et diagnostic

- Importer et exporter la configuration JSON, avec choix d’inclure les abonnements et leur cache.
- Pousser ou récupérer la configuration entre appareils via la synchronisation native du navigateur.
- Pousser ou récupérer la configuration via GitHub Gist, avec synchronisation planifiée.
- Découper la synchronisation native en blocs de 7 KB et afficher l’utilisation du quota.
- Contrôler la prise en charge du proxy, l’état PAC et les conflits avec d’autres extensions.
- Filtrer, actualiser, copier et effacer les journaux d’exécution par niveau.

### Réglages de l’interface

- Utiliser les thèmes clair, sombre ou le changement automatique selon l’heure.
- Modifier les couleurs d’un thème personnalisé en JSON.
- Utiliser le chinois simplifié, le chinois traditionnel, l’anglais, le japonais, le français, l’allemand, l’espagnol, le portugais, le russe ou le coréen.
> Les champs d'authentification SOCKS5 sont désactivés dans l'interface actuelle, car l'API proxy de Chrome ne prend pas en charge l'authentification SOCKS5 par nom d'utilisateur et mot de passe.

## Installation

### Installer un paquet publié

Les utilisateurs ordinaires peuvent installer directement l’extension depuis une boutique :

- [Chrome Web Store](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk), pour Chrome et Edge lorsque les extensions Chrome y sont autorisées.
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant), pour Firefox.

Vous pouvez aussi télécharger le paquet correspondant depuis [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases) :

- Chrome, Edge et les autres navigateurs Chromium utilisent `ProxyAssistant_<version>_chrome.zip`.
- Les versions Firefox comprennent `ProxyAssistant_<version>_firefox.zip` et `ProxyAssistant_<version>_firefox.xpi`.

Pour Chrome ou Edge, décompressez le ZIP, activez le mode développeur sur la page des extensions, puis chargez le dossier décompressé. Le processus de publication produit le XPI Firefox comme artefact de construction ; son installation directe dépend de la politique de signature de Firefox. Les utilisateurs ordinaires devraient donc privilégier Firefox Add-ons.

### Construction depuis les sources

Le dépôt conserve des Manifest distincts pour Chrome et Firefox. Il est recommandé de produire d’abord le dossier ou le paquet du navigateur concerné afin d’éviter de modifier directement `src/manifest.json`.

```bash
npm ci
make build VERSION=dev
```

Décompressez `build/ProxyAssistant_dev_chrome.zip` pour Chrome ou Edge. Pour Firefox, décompressez son ZIP, ouvrez `about:debugging`, choisissez « Ce Firefox » puis « Charger un module complémentaire temporaire », et sélectionnez `manifest.json`. La génération du XPI nécessite `web-ext`. Sans `web-ext`, les fichiers ZIP et TAR.GZ de Firefox sont tout de même générés, mais le XPI est omis.

## Utilisation

1. Ouvrez Assistant Proxy depuis la barre d'outils.
2. Ajoutez un nœud dans les paramètres avec son protocole, son adresse et son port.
3. Ajoutez les identifiants et règles si nécessaire.
4. Choisissez le mode désactivé, manuel ou automatique dans la fenêtre de l'extension.
5. Sélectionnez un nœud en mode manuel ou laissez le script PAC router les requêtes en mode automatique.

Configurations courantes :

- Toujours utiliser un proxy : choisissez le mode manuel et le nœud voulu.
- Utiliser un proxy pour certains sites : ajoutez-les aux adresses utilisant le proxy, puis choisissez le mode automatique.
- Garder certains sites en connexion directe : ajoutez-les aux adresses à contourner ou fournissez des règles directes par abonnement.
- Séparer bureau, domicile et autres environnements : créez des scénarios et changez-les depuis la fenêtre de l’extension.

## Données et autorisations

L’extension demande les autorisations suivantes :

| Permission | Utilisation |
| --- | --- |
| `proxy` | Lire et modifier les réglages proxy du navigateur |
| `storage` | Enregistrer la configuration locale et utiliser la synchronisation native |
| `webRequest`, `webRequestAuthProvider` | Répondre aux demandes d’authentification du proxy |
| `alarms` | Planifier les abonnements, scénarios et synchronisations |
| `<all_urls>` | Générer les règles des requêtes web et lire le site courant |


La configuration est stockée par défaut dans `chrome.storage.local`. Les noms d'utilisateur et mots de passe des proxys font partie de la configuration et sont inclus dans les fichiers exportés et dans les données synchronisées que vous envoyez. Le jeton GitHub et l'identifiant Gist en sont exclus. Protégez les exports et vérifiez vos exigences de sécurité avant d'activer la synchronisation.

Une récupération distante remplace la configuration métier locale, tout en conservant les paramètres de connexion et les horaires de synchronisation locaux. Exportez une sauvegarde au préalable si nécessaire.

[Politique de confidentialité](https://sites.google.com/view/proxy-assistant/privacy-policy)

## Développement

### Prérequis

- Node.js 20, comme dans GitHub Actions
- npm
- Chrome, Firefox ou Edge pour les tests dans le navigateur
- `web-ext`, uniquement pour produire le XPI Firefox

Installer les dépendances :

```bash
npm ci
```

### Tests

```bash
npm test                    # Tous les tests Jest
npm run test:unit           # Tests unitaires
npm run test:integration    # Tests d’intégration
npm run test:e2e            # Tests de bout en bout
npm run test:watch          # Mode surveillance
npm run test:coverage       # Tests de couverture
```

Entrées Makefile disponibles :

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### Construction

```bash
make build VERSION=dev
```

Le script nettoie `build/`, sélectionne le Manifest de chaque navigateur et génère :

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

Le dernier fichier n’est pas généré sans `web-ext`.

### Structure du projet

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # Ressources de traduction du navigateur
│   ├── css/                  # Styles des paramètres et de la fenêtre
│   ├── images/               # Icônes de l’extension
│   ├── js/                   # Logique des pages, proxy, stockage, synchronisation et arrière-plan
│   ├── main.html             # Page des paramètres
│   ├── popup.html            # Fenêtre de l’extension
│   ├── manifest_chrome.json  # Manifest V3 Chrome
│   └── manifest_firefox.json # Manifest V3 Firefox
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Script de paquetage Chrome et Firefox
├── readme/                   # README dans les autres langues
├── release/                  # Notes de chaque publication
├── Makefile
└── package.json
```

Modules principaux :

| Fichier | Responsabilité |
| --- | --- |
| `src/js/worker.js` | Appliquer le proxy, générer PAC, gérer l’authentification, les tâches et messages |
| `src/js/main.js` | Initialiser les paramètres et coordonner les modules |
| `src/js/popup.js` | Changer modes, scénarios et nœuds dans la fenêtre |
| `src/js/proxy.js` | Formulaires, listes et tests des nœuds |
| `src/js/scenarios.js` | Gestion des scénarios et règles horaires |
| `src/js/subscription.js` | Gestion, analyse et planification des abonnements |
| `src/js/config.js` | Format, migration, import et export de configuration |
| `src/js/storage.js` | Cache local et persistance de la configuration |
| `src/js/sync.js` | Synchronisation native et GitHub Gist |
| `src/js/detection.js` | Diagnostic du contrôle proxy et PAC |

Consultez [AGENTS.md](../AGENTS.md) pour les conventions de code et de test.

## Remarques sur les navigateurs

- Chrome utilise un Service Worker Manifest V3.
- Firefox utilise un background script Manifest V3 ; le Manifest actuel requiert Firefox 142 ou ultérieur.
- Edge utilise le paquet Chrome, installable depuis le Chrome Web Store ou depuis le dossier Chrome décompressé. Les Manifest dédiés et cibles automatisées restent Chrome et Firefox.
- Plusieurs extensions proxy ou VPN actives peuvent entrer en conflit ; utilisez la page d’état du proxy pour le diagnostic.

## Retours et contributions

Signalez les problèmes et demandes via [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues). Exécutez les tests concernés et vérifiez si possible le comportement dans Chrome, Firefox et Edge.

## Licence

Ce projet utilise la [licence MIT](../LICENSE).
