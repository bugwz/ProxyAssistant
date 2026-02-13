<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Assistant Proxy

</div>

<div align="center">

[![Extension Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Extension Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingue](https://img.shields.io/badge/Multilingue-yellow)](README-fr.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [**Français**](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

Une extension puissante de gestion de proxy pour navigateur, compatible avec Chrome/Firefox/Edge, supportant la gestion multi-scénarios, vous permettant de configurer et de basculer facilement entre différents proxies réseau.

</div>

![](../public/img/promotion/1400-560.png)

## 1. ✨ Fonctionnalités

### 1.1 🔌 Prise en charge de plusieurs protocoles proxy
- **HTTP** - Proxy HTTP traditionnel
- **HTTPS** - Proxy HTTPS sécurisé
- **SOCKS5** - Proxy SOCKS5 avec support TCP/UDP
- **SOCKS4** - Compatibilité proxy SOCKS4 legacy

### 1.2 🌐 Prise en charge multi-navigateurs
- **Chrome** - Utilise Manifest V3 + Service Worker
- **Firefox** - Utilise Manifest V3 + l'API `proxy.onRequest` pour l'interception des requêtes proxy
- **Edge** - Parfaitement compatible avec les extensions Chrome, basé sur le noyau Chromium

### 1.3 🔄 Trois modes proxy

| Mode | Description |
|------|-------------|
| **Désactiver** | Désactiver le proxy, utiliser la connexion réseau par défaut du système |
| **Manuel** | Sélectionner manuellement un proxy depuis la liste |
| **Automatique** | Sélectionner automatiquement le proxy correspondant selon les règles d'URL (mode PAC) |

![](../public/img/promotion/1280-800-03.png)

### 1.4 🎬 Mode Scénario

- **Support Multi-scénarios**: Créer différents ensembles de configurations de proxy (ex: Entreprise, Domicile, Environnement de développement)
- **Basculement Rapide**: Changement en un clic des listes de proxy entre différents scénarios
- **Gestion Flexible**: Support de l'ajout, renommage, suppression et tri des scénarios
- **Migration de Proxy**: Support du déplacement des proxies entre différents scénarios
- **Application automatique**: Sélection et application automatiques du proxy lors du changement de scénario en mode manuel

### 1.5 📥 Fonctionnalité d'abonnement proxy

- **Support multi-format**: Prend en charge les formats d'abonnement AutoProxy, SwitchyLegacy, SwitchyOmega, PAC
- **Mise à jour automatique**: Prend en charge la mise à jour automatique planifiée (1min/6h/12h/1jour)
- **Inversion des règles**: Prend en charge l'inversion des règles de correspondance et de contournement de l'abonnement (mode liste blanche/noire)
- **Aperçu des règles**: Visualisation rapide des règles de correspondance et de contournement extraites de l'abonnement
- **ID unique**: Chaque proxy et scénario possède un ID unique pour une gestion précise

### 1.6 📋 Configuration flexible des règles d'URL

- **Adresses bypassant le proxy** (`bypass_rules`): Domaines/IP de connexion directe en mode manuel
- **Adresses utilisant le proxy** (`include_rules`): Domaines nécessitant un accès proxy en mode automatique
- **Politique de repli**: Choisir la connexion directe ou le refus en cas d'échec en mode automatique
- Prise en charge du joker `*` et de la correspondance de domaine
- Convient aux scénarios où différents sites web utilisent différents proxies

### 1.7 🔐 Prise en charge de l'authentification proxy

- Authentification par nom d'utilisateur/mot de passe
- Traitement automatique des demandes d'authentification du serveur proxy
- Stockage sécurisé des identifiants

### 1.8 🧪 Fonctionnalités de test de proxy

- **Test de connexion**: Vérifier la disponibilité du proxy
- **Mesure de latence**: Tester le temps de réponse du proxy
- **Test en lot**: Tester tous les proxies en un clic
- **Indicateurs de couleur**: Vert(<500ms) / Orange(≥500ms) / Rouge(Echec)

### 1.9 🏃 Détection de l'état du proxy

- Détecter les paramètres proxy actuels du navigateur
- Vérifier si l'extension contrôle correctement le proxy
- Identifier si d'autres extensions contrôlent le proxy
- Fournit des résultats d'état, d'avertissement et d'erreur

### 1.10 🔍 Aperçu du script PAC

- **Visualisation du script**: Voir le contenu du script PAC généré automatiquement
- **Liste des règles**: Affichage clair de toutes les règles de correspondance de proxy actives
- **Support de débogage**: Dépannage facile des problèmes de correspondance en mode automatique

### 1.11 🌙 Modes de thème

- **Mode Clair**: Pour une utilisation de jour
- **Mode Sombre**: Pour une utilisation de nuit
- **Basculement automatique**: Changer automatiquement de thème selon l'heure (configurable)

![](../public/img/promotion/1280-800-02.png)

### 1.12 ☁️ Stockage et synchronisation des données

#### 1.12.1 Stratégie de stockage

| Type de stockage | Contenu de stockage | Description |
|------------------|---------------------|-------------|
| **Stockage local (local)** | Liste des proxies, paramètres de thème, paramètres de langue, configuration de synchronisation | Toujours activé, assurant la disponibilité hors ligne et la persistance des données |
| **Synchronisation cloud (sync)** | Données de configuration complètes (stockage par morceaux) | Optionnel, utilise le stockage par morceaux pour contourner les limites de quota |

#### 1.12.2 Méthodes de synchronisation

##### 1.12.2.1 Synchronisation native du navigateur (Native Sync)
- Utilise l'API `chrome.storage.sync` (Chrome) ou `browser.storage.sync` (Firefox)
- Synchronisation automatique via le compte Chrome/Firefox
- Convient à la synchronisation multi-appareils avec le même compte navigateur
- **Stockage par morceaux**: Les données de configuration sont automatiquement divisées en morceaux (7KB par morceau) pour contourner la limite de quota de 8KB par élément
- **Intégrité des données**: Utilise des sommes de contrôle pour assurer l'intégrité des données de synchronisation
- **Opérations atomiques**: L'opération Push efface les anciennes données avant d'écrire les nouvelles pour assurer la cohérence
- **Affichage du quota**: Affichage en temps réel du quota utilisé/total (100KB) et du nombre de morceaux

##### 1.12.2.2 Synchronisation GitHub Gist
- Synchronisation de configuration entre navigateurs et appareils via GitHub Gist
- Nécessite la configuration d'un Personal Access Token GitHub
- Prise en charge du push/pull manuel ou de la synchronisation automatique
- Le contenu de la configuration est chiffré, les informations sensibles sont automatiquement effacées lors de l'exportation

| Élément de configuration | Description |
|--------------------------|-------------|
| **Clé d'accès** | GitHub Personal Access Token (doit avoir les permissions gist) |
| **Nom de fichier** | Nom de fichier dans Gist, par défaut `proxy_assistant_config.json` |
| **ID Gist** | Reconnaissance et sauvegarde automatiques, aucune saisie manuelle requise |

#### 1.12.3 Opérations de synchronisation

| Opération | Description |
|-----------|-------------|
| **Push** | Charger la configuration locale vers le cloud/Gist |
| **Pull** | Télécharger la configuration depuis le cloud/Gist vers local |
| **Tester la connexion** | Vérifier la validité du Gist Token et l'état de la configuration |

#### 1.12.4 Importation/Exportation

- **Exporter la configuration**: Générer un fichier JSON contenant toutes les informations de proxy, paramètres de thème, paramètres de langue, etc.
- **Importer la configuration**: Prise en charge de la restauration de la configuration depuis un fichier JSON
- **Sécurité des données**: Le fichier d'exportation efface automatiquement les informations sensibles (Token, mot de passe)
- **Compatibilité de format**: Prise en charge de l'importation de fichiers de configuration des anciennes versions

### 1.13 🌍 Prise en charge multilingue

Cette extension prend en charge les langues suivantes :

| Langue | Code | État |
|--------|------|------|
| 简体中文 | zh-CN | ✅ Pris en charge |
| 繁體中文 | zh-TW | ✅ Pris en charge |
| English | en | ✅ Pris en charge |
| 日本語 | ja | ✅ Pris en charge |
| Français | fr | ✅ Pris en charge |
| Deutsch | de | ✅ Pris en charge |
| Español | es | ✅ Pris en charge |
| Português | pt | ✅ Pris en charge |
| Русский | ru | ✅ Pris en charge |
| 한국어 | ko | ✅ Pris en charge |

![](../public/img/promotion/1280-800-04.png)

## 2. 📷 Interface de configuration

![](../public/img/demo.png)

## 3. 📁 Structure du projet

```
ProxyAssistant/
├── conf/                     # Exemple de configuration
│   └── demo.json             # Fichier de configuration example
├── readme/                   # Documentation multilingue
│   ├── README-zh-TW.md       # Chinois traditionnel
│   ├── README-en.md          # Anglais
│   ├── README-ja.md          # Japonais
│   ├── README-fr.md          # Français
│   ├── README-de.md          # Allemand
│   ├── README-es.md          # Espagnol
│   ├── README-pt.md          # Portugais
│   ├── README-ru.md          # Russe
│   └── README-ko.md          # Coréen
├── src/                      # Code source
│   ├── manifest_chrome.json  # Configuration de l'extension Chrome (Manifest V3)
│   ├── manifest_firefox.json # Configuration de l'extension Firefox
│   ├── main.html             # Page de paramètres
│   ├── popup.html            # Page popup
│   ├── _locales/             # Ressources d'internationalisation
│   ├── js/
│   │   ├── main.js           # Logique principale de la page de paramètres
│   │   ├── popup.js          # Logique principale du popup
│   │   ├── worker.js         # Service en arrière-plan (Chrome: Service Worker)
│   │   ├── i18n.js           # Prise en charge de l'internationalisation
│   │   ├── storage.js        # Module de gestion du stockage
│   │   ├── proxy.js          # Module de gestion du proxy
│   │   ├── scenarios.js      # Module de gestion des scénarios
│   │   ├── sync.js           # Module de synchronisation des données
│   │   ├── subscription.js   # Module d'abonnement
│   │   ├── theme.js          # Module de changement de thème
│   │   ├── detection.js      # Module de détection proxy
│   │   ├── validator.js      # Module de validation des données
│   │   ├── language.js       # Module de sélection de langue
│   │   ├── utils.js          # Module d'utilitaires
│   │   ├── config.js         # Module de constantes de configuration
│   │   ├── version.js        # Module de gestion de version
│   │   └── jquery.js         # Bibliothèque jQuery
│   ├── css/
│   │   ├── main.css          # Styles de la page de paramètres (y compris les composants communs)
│   │   ├── popup.css         # Styles du popup
│   │   ├── theme.css         # Styles du thème
│   │   ├── tabs.css          # Styles des onglets
│   │   └── eye-button.css    # Styles du bouton d'affichage du mot de passe
│   └── images/               # Ressources d'images
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
├── public/                   # Ressources publiques
│   └── img/                  # Images de démonstration et promotionnelles
├── tests/                    # Tests
│   ├── jest.config.js        # Configuration Jest
│   ├── setup.js              # Configuration de l'environnement de test
│   ├── __mocks__/            # Fichiers Mock
│   │   └── chrome.js         # Chrome API Mock
│   ├── unit/                 # Tests unitaires
│   ├── integration/          # Tests d'intégration
│   └── e2e/                  # Tests de bout en bout
├── script/                   # Scripts de construction
│   └── build.sh              # Script de construction de l'extension
├── release/                  # Notes de version
│   └── *.md                  # Journaux de mise à jour des versions
├── doc/                      # Répertoire de documentation
├── build/                    # Répertoire de sortie de construction
├── package.json              # Dépendances du projet
├── package-lock.json         # Verrouillage des versions des dépendances
├── Makefile                  # Entrée de commande de construction
├── jest.config.js            # Configuration Jest (pointe vers tests/jest.config.js)
├── AGENTS.md                 # Guide de développement
└── LICENSE                   # Licence MIT
```

## 4. 🚀 Démarrage rapide

### 4.1 Installation de l'extension

#### 4.1.1 Chrome

**Méthode 1 (Recommandée)**: Installer depuis le Chrome Web Store
1. Ouvrez Chrome et accédez au [Chrome Web Store](https://chrome.google.com/webstore)
2. Recherchez "Assistant Proxy"
3. Cliquez sur "Ajouter à Chrome"

**Méthode 2**: Installation locale
- **Option A (Utilisation du code source)**: Téléchargez le code source, renommez `src/manifest_chrome.json` en `manifest.json`, puis chargez le répertoire `src`
- **Option B (Utilisation du package)**:
  1. Accédez à la page [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases)
  2. Téléchargez le fichier `proxy-assistant-chrome-x.x.x.zip`
  3. Extrayez le fichier ZIP téléchargé dans un répertoire任意
  4. Ouvrez Chrome et accédez à `chrome://extensions/`
  5. Activez le **"Mode développeur"** en haut à droite
  6. Cliquez sur le bouton **"Charger l'extension décompressée"** en haut à gauche
  7. Sélectionnez le dossier extrait à l'étape 3
  8. L'extension apparaîtra dans la liste des extensions après une installation réussie

#### 4.1.2 Firefox

**Méthode 1 (Recommandée)**: Installer depuis les modules complémentaires Firefox
1. Ouvrez Firefox et accédez aux [Modules complémentaires Firefox](https://addons.mozilla.org/)
2. Recherchez "Assistant Proxy"
3. Cliquez sur "Ajouter à Firefox"

**Méthode 2**: Installation locale
1. Téléchargez le package d'extension Firefox (fichier `.xpi`) depuis le répertoire release
2. Ouvrez Firefox et accédez à `about:addons`
3. Cliquez sur **l'icône d'engrenage** → **Installer depuis un fichier**
4. Sélectionnez le fichier `.xpi` téléchargé

#### 4.1.3 Microsoft Edge

Le navigateur Edge est basé sur le noyau Chromium et peut installer directement les extensions Chrome.

**Méthode 1 (Recommandée)**: Installer depuis le Chrome Web Store
1. Ouvrez Edge et accédez à `edge://extensions/`
2. Dans la section "Trouver de nouvelles extensions", cliquez sur "Obtenir des extensions depuis Chrome Web Store", accédez au [Chrome Web Store](https://chrome.google.com/webstore)
3. Recherchez "Assistant Proxy"
4. Cliquez sur "Obtenir" puis "Ajouter à Microsoft Edge"

**Méthode 2**: Installation locale
1. Accédez à la page [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases)
2. Téléchargez le fichier `proxy-assistant-chrome-x.x.x.zip`
3. Extrayez le fichier ZIP téléchargé dans un répertoire任意
4. Ouvrez Edge et accédez à `edge://extensions/`
5. Activez le **"Mode développeur"** en bas à gauche
6. Cliquez sur le bouton **"Sélectionner le répertoire décompressé"**
7. Sélectionnez le dossier extrait à l'étape 3
8. L'extension apparaîtra dans la liste des extensions après une installation réussie

### 4.2 Ajout d'un proxy

1. Cliquez sur l'icône de l'extension pour ouvrir le popup
2. Cliquez sur le bouton **"Paramètres"** pour ouvrir la page de paramètres
3. Cliquez sur le bouton **"Ajouter un proxy"** pour ajouter un nouveau proxy
4. Remplissez les informations du proxy :
   - Nom du proxy
   - Type de protocole (HTTP/HTTPS/SOCKS4/SOCKS5)
   - Adresse du proxy (IP ou domaine)
   - Numéro de port
   - (Optionnel) Nom d'utilisateur et mot de passe
   - (Optionnel) Configuration des règles d'URL
5. Cliquez sur le bouton **"Enregistrer"**

### 4.3 Utilisation des proxies

**Mode Manuel**:
1. Sélectionnez le mode **"Manuel"** dans le popup
2. Sélectionnez un proxy dans la liste
3. Le statut "Connecté" indique qu'il est actif

**Mode Automatique**:
1. Sélectionnez le mode **"Automatique"** dans le popup
2. Configurez les règles d'URL pour chaque proxy dans la page de paramètres
3. Les proxies sont automatiquement sélectionnés selon le site web que vous consultez

## 5. 🛠️ Guide de développement

### 5.1 Environnement de développement

**Prérequis**:
- Node.js >= 14
- npm >= 6
- Navigateur Chrome / Firefox (pour les tests)
- web-ext (pour construire le XPI Firefox, optionnel)

**Installer les dépendances**:
```bash
make test_init
# ou
npm install
```

### 5.2 Commandes de test

| Commande | Description |
|----------|-------------|
| `make test` | Exécuter tous les tests (unitaire + intégration + e2e) |
| `make test_nocache` | Exécuter les tests sans cache |
| `make test_unit` | Exécuter uniquement les tests unitaires |
| `make test_integration` | Exécuter uniquement les tests d'intégration |
| `make test_e2e` | Exécuter uniquement les tests e2e |
| `make test_clean` | Nettoyer le cache de test et les fichiers de couverture |

**Utilisation directe de npm**:
```bash
npm test                    # Exécuter tous les tests
npm run test:unit           # Exécuter uniquement les tests unitaires
npm run test:integration    # Exécuter uniquement les tests d'intégration
npm run test:e2e            # Exécuter uniquement les tests e2e
npm run test:watch          # Exécuter les tests en mode watch
npm run test:coverage       # Exécuter les tests et générer un rapport de couverture
```

### 5.3 Commandes de construction

| Commande | Description |
|----------|-------------|
| `make build` | Construire les extensions Chrome et Firefox |
| `make clean` | Nettoyer les artefacts de construction |
| `make test_clean` | Nettoyer le cache de test et les fichiers de couverture |

**Spécifier la version**:
```bash
make build VERSION=dev
# ou
./script/build.sh dev
```

**Artefacts de construction**:
```
build/
├── ProxyAssistant_{VERSION}_chrome.zip      # Package d'installation Chrome
├── ProxyAssistant_{VERSION}_chrome.tar.gz   # Package source Chrome
├── ProxyAssistant_{VERSION}_firefox.zip     # Package d'installation Firefox
├── ProxyAssistant_{VERSION}_firefox.tar.gz  # Package source Firefox
└── ProxyAssistant_{VERSION}_firefox.xpi     # Package d'extension officiel Firefox
```

### 5.4 Développement local

**Installation locale Chrome**:
1. Renommer `src/manifest_chrome.json` en `manifest.json`
2. Ouvrir Chrome, accéder à `chrome://extensions/`
3. Activer le **"Mode développeur"**
4. Cliquer sur **"Charger l'extension décompressée"**
5. Sélectionner le répertoire `src`

**Installation locale Firefox**:
1. Utiliser `make build` pour générer le fichier XPI
2. Ouvrir Firefox, accéder à `about:addons`
3. Cliquer sur **l'icône d'engrenage** → **Installer depuis un fichier**
4. Sélectionner le fichier `.xpi` généré

### 5.5 Style de code

- **Indentation**: 2 espaces
- **Guillemets**: Guillemets simples
- **Nommage**: camelCase, les constantes utilisent UPPER_SNAKE_CASE
- **Point-virgule**: Utilisation cohérente

Pour les spécifications détaillées, veuillez consulter [AGENTS.md](../AGENTS.md)

## 6. 📖 Documentation détaillée

### 6.1 Syntaxe des règles d'URL

Prise en charge des règles de correspondance suivantes :

```
# Correspondance exacte
google.com

# Correspondance de sous-domaine
.google.com
www.google.com

# Correspondance avec joker
*.google.com
*.twitter.com

# Adresse IP
192.168.1.1
10.0.0.0/8
```

### 6.2 Politique de repli

En mode automatique, lorsque la connexion proxy échoue :

| Politique | Description |
|-----------|-------------|
| **Connexion directe (DIRECT)** | Contourner le proxy, se connecter directement au site cible |
| **Refus de connexion (REJECT)** | Refuser la demande |

### 6.3 Mode automatique avec script PAC

Le mode automatique utilise les scripts PAC (Proxy Auto-Config) :
- Sélectionne automatiquement le proxy selon l'URL actuelle
- Correspond dans l'ordre de la liste proxy, retourne le premier proxy correspondant
- Prise en charge de la politique de repli
- Restaure automatiquement la dernière configuration au démarrage du navigateur

### 6.4 Raccourcis

| Action | Méthode |
|--------|---------|
| Déplier/Replier la carte proxy | Cliquer sur l'en-tête de la carte |
| Déplier/Replier toutes les cartes | Cliquer sur le bouton "Tout déplier/replier" |
| Réorganiser par glisser-déposer | Faire glisser la poignée sur l'en-tête de la carte |
| Afficher/Masquer le mot de passe | Cliquer sur l'icône'œil du champ mot de passe |
| Activer/Désactiver un seul proxy | Utiliser l'interrupteur sur la carte |
| Tester un seul proxy | Cliquer sur le bouton "Test de connexion" |
| Tester tous les proxies | Cliquer sur le bouton "Tout tester" |
| Fermer rapidement le popup | Appuyer sur la touche `ESC` sur la page |

### 6.5 Importation/Exportation de la configuration

1. **Exporter la configuration**: Cliquez sur "Exporter la configuration" pour télécharger un fichier JSON
2. **Importer la configuration**: Cliquez sur "Importer la configuration" et sélectionnez un fichier JSON pour restaurer

La configuration inclut :
- Toutes les informations de proxy
- Paramètres du thème
- Heures du mode nuit
- Paramètres de langue
- État de la synchronisation

### 6.6 Détection de l'état du proxy

Cliquez sur le bouton "Détecter l'effet du proxy" pour :
- Afficher le mode proxy actuel du navigateur
- Vérifier si l'extension contrôle correctement le proxy
- Détecter si d'autres extensions ont pris le contrôle
- Obtenir un diagnostic et des suggestions

## 7. 🔧 Architecture technique

### 7.1 Manifest V3

- Chrome utilise la spécification Manifest V3
- Service Worker remplace les pages d'arrière-plan
- Firefox utilise background scripts + onRequest API
- Prend en charge le stockage de synchronisation natif du navigateur et la synchronisation GitHub Gist

### 7.2 Modules principaux

| Module | Fichier | Description |
|--------|---------|-------------|
| **Principal** | main.js | Logique de la page de paramètres, gestion des scénarios, proxy CRUD, tri par glisser-déposer, import/export, détection proxy |
| **Popup** | popup.js | Interaction avec l'interface du popup, affichage de l'état du proxy, basculement rapide du proxy, affichage de correspondance automatique |
| **Arrière-plan** | worker.js | Gestion de la configuration du proxy, génération du script PAC, gestion de l'authentification, test du proxy, mise à jour automatique de l'abonnement, surveillance des changements de stockage |
| **Stockage** | storage.js | Gestion du stockage local/cloud, synchronisation par morceaux, validation des données, import/export de configuration |
| **i18n** | i18n.js | Prise en charge multilingue, changement en temps réel, chargement dynamique des traductions |
| **Thème** | theme.js | Basculement entre thème clair/sombre, changement automatique selon l'heure |
| **Scénarios** | scenarios.js | Support multi-scénarios, basculement de scénario, renommer/supprimer/trier des scénarios |
| **Synchronisation** | sync.js | Synchronisation native du navigateur, synchronisation GitHub Gist |
| **Abonnement** | subscription.js | Analyse d'abonnement proxy (AutoProxy/SwitchyLegacy/SwitchyOmega/PAC), mise à jour automatique |
| **Proxy** | proxy.js | Rendu de la liste de proxies, édition, test, tri par glisser-déposer |
| **Détection** | detection.js | Détection de l'état du proxy, détection du contrôle de l'extension, détection des conflits |
| **Validateur** | validator.js | Validation du format IP/domaine/port/règle |
| **Utilitaires** | utils.js | Fonctions utilitaires communes, assistants d'opérations DOM |
| **Langue** | language.js | Gestion de l'interaction du menu déroulant de langue |
| **Configuration** | config.js | Constantes de configuration par défaut, gestion de la configuration système |

### 7.3 Stockage des données

- `chrome.storage.local`: Stockage local (toujours utilisé)
- `chrome.storage.sync`: Stockage de synchronisation cloud (optionnel)
- `chrome.storage.session`: Stockage de session (informations d'authentification, cache d'état)
- Suit le principe du local-first, résout les problèmes de quota de synchronisation
- Stockage par morceaux (7KB par morceau) contourne la limite de quota de 8KB

### 7.4 Version du format de configuration

| Version | Description |
|---------|-------------|
| v1 | Format initial |
| v2 | Ajout du support des scénarios |
| v3 | Ajout du support d'abonnement |
| v4 | Statut de désactivation de proxy unifié, utilisation d'IDs uniques, inversion des règles d'abonnement |

### 7.5 Compatibilité des navigateurs

| Fonctionnalité | Chrome | Firefox |
|----------------|--------|---------|
| Mode Manuel | ✅ | ✅ |
| Mode Automatique | ✅ | ✅ |
| Authentification Proxy | ✅ | ✅ |
| Test Proxy | ✅ | ✅ |
| Changement de Thème | ✅ | ✅ |
| Synchronisation | ✅ | ✅ |
| Détection Proxy | ✅ | ✅ |
| Abonnement | ✅ | ✅ |

### 7.6 Technologies principales d'implémentation

- **JavaScript natif + jQuery**: Sans dépendance de framework, léger
- **Manifest V3**: Chrome utilise Service Worker, Firefox utilise background scripts
- **Script PAC**: Script de configuration automatique du proxy généré dynamiquement en mode automatique
- **Authentification proxy**: Utilise l'API `webRequestAuthProvider` pour traiter les demandes d'authentification
- **Synchronisation par morceaux**: Algorithme de chunking personnalisé pour résoudre les limites de quota Chrome storage.sync
- **Analyse d'abonnement**: Prise en charge de l'analyse et conversion automatiques de plusieurs formats d'abonnement

## 8. 📝 Cas d'utilisation

### 8.1 Scénario 1: Basculement entre plusieurs proxies

- Configurer différents proxies pour différents environnements réseau
- Utiliser le proxy d'entreprise pour le réseau professionnel
- Utiliser le proxy VPN pour le réseau domestique
- Basculement rapide en un clic

### 8.2 Scénario 2: Routage intelligent

- Connexion directe pour les sites nationaux
- Certains sites via le proxy
- Sélection automatique basée sur le domaine

### 8.3 Scénario 3: Test du pool de proxies

- Importer plusieurs proxies
- Tester la latence en lot
- Sélectionner le proxy optimal

### 8.4 Scénario 4: Partage d'équipe

- Exporter le fichier de configuration
- Partager avec les membres de l'équipe
- Configuration de proxy unifiée

## 9. ⚠️ Remarques importantes

1. **Description des permissions**: L'extension nécessite les permissions suivantes :
   - `proxy`: Gérer les paramètres proxy
   - `storage`: Stocker les configurations
   - `webRequest` / `webRequestAuthProvider`: Gérer les demandes d'authentification
   - `<all_urls>`: Accéder à toutes les URL de sites web

2. **Conflits avec d'autres extensions**: En cas de conflits proxy, veuillez désactiver les autres extensions de type proxy/VPN

3. **Sécurité**: Les identifiants sont stockés localement dans le navigateur, veuillez assurer la sécurité de votre appareil

4. **Exigences réseau**: Assurez-vous que le serveur proxy est accessible

5. **Limitation Firefox**: Version minimale requise pour Firefox : 142.0

## 10. 📄 Politique de confidentialité

[Politique de confidentialité](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 11. 📄 Licence

MIT License - Voir le fichier [LICENSE](../LICENSE) pour plus de détails

## 12. 🤝 Contribution

Les rapports d'issues et les pull requests sont les bienvenus !

## 13. 📧 Contact

Pour des questions ou suggestions, veuillez soumettre vos commentaires via GitHub Issues.

---

<div align="center">

**Si ce projet vous aide, pensez à lui donner une Star ⭐ !**

</div>
