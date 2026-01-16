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

Une extension puissante de gestion de proxy pour Chrome et Firefox, permettant de configurer et de basculer facilement entre différents proxies réseau.

</div>

![](../public/img/promotion/1400-560.png)

## ✨ Fonctionnalités

### 🔌 Prise en charge de plusieurs protocoles proxy
- **HTTP** - Proxy HTTP traditionnel
- **HTTPS** - Proxy HTTPS sécurisé
- **SOCKS5** - Proxy SOCKS5 avec support TCP/UDP
- **SOCKS4** - Compatibilité proxy SOCKS4 legacy

### 🌐 Prise en charge multi-navigateurs
- **Chrome** - Utilise Manifest V3 + Service Worker
- **Firefox** - Utilise l'API onRequest pour l'interception proxy

### 🔄 Trois modes proxy

| Mode | Description |
|------|-------------|
| **Désactiver** | Désactiver le proxy, utiliser la connexion réseau par défaut du système |
| **Manuel** | Sélectionner manuellement un proxy depuis la liste |
| **Automatique** | Sélectionner automatiquement le proxy correspondant selon les règles d'URL (mode PAC) |

| ![](../public/img/demo-popup-01.png) | ![](../public/img/demo-popup-02.png) | ![](../public/img/demo-popup-03.png) |
|:---:|:---:|:---:|
| Mode Désactivé | Mode Manuel | Mode Automatique |

### 📋 Configuration flexible des règles d'URL

- **Adresses bypassant le proxy** (`bypass_urls`): Domaines/IP de connexion directe en mode manuel
- **Adresses utilisant le proxy** (`include_urls`): Domaines nécessitant un accès proxy en mode automatique
- **Politique de repli**: Choisir la connexion directe ou le refus en cas d'échec en mode automatique
- Prise en charge du joker `*` et de la correspondance de domaine
- Convient aux scénarios où différents sites web utilisent différents proxies

### 🔐 Prise en charge de l'authentification proxy

- Authentification par nom d'utilisateur/mot de passe
- Traitement automatique des demandes d'authentification du serveur proxy
- Stockage sécurisé des identifiants

### 🧪 Fonctionnalités de test de proxy

- **Test de connexion**: Vérifier la disponibilité du proxy
- **Mesure de latence**: Tester le temps de réponse du proxy
- **Test en lot**: Tester tous les proxies en un clic
- **Indicateurs de couleur**: Vert(<500ms) / Orange(≥500ms) / Rouge(Echec)

### 🏃 Détection de l'état du proxy

- Détecter les paramètres proxy actuels du navigateur
- Vérifier si l'extension contrôle correctement le proxy
- Identifier si d'autres extensions contrôlent le proxy
- Fournit des résultats d'état, d'avertissement et d'erreur

### 🔍 Aperçu du script PAC

- **Visualisation du script**: Voir le contenu du script PAC généré automatiquement
- **Liste des règles**: Affichage clair de toutes les règles de correspondance de proxy actives
- **Support de débogage**: Dépannage facile des problèmes de correspondance en mode automatique

### 🌙 Modes de thème

- **Mode Clair**: Pour une utilisation de jour
- **Mode Sombre**: Pour une utilisation de nuit
- **Basculement automatique**: Changer automatiquement de thème selon l'heure (configurable)

| ![Mode Clair](../public/img/demo-light.png) | ![Mode Sombre](../public/img/demo-night.png) |
|:---:|:---:|
| Mode Clair | Mode Sombre |

### ☁️ Stockage et synchronisation des données

- **Stockage local prioritaire**: Les configurations proxy sont toujours enregistrées dans le stockage local
- **Synchronisation cloud**: Synchronisation de compte Chrome/Firefox (optionnel)
- **Fusion intelligente**: Fusion automatique des données locales et distantes en cas d'erreur de synchronisation
- **Importation/Exportation**: Sauvegarde et restauration de la configuration au format JSON

### 🌍 Prise en charge multilingue

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

## 📷 Interface de configuration

![](../public/img/demo.png)

## 📁 Structure du projet

```
ProxyAssistant/
├── readme/                    # Documentation multilingue
│   ├── README-zh-CN.md       # Chinois simplifié
│   ├── README-zh-TW.md       # Chinois traditionnel
│   ├── README-en.md          # Anglais
│   └── ...
├── src/                       # Code source
│   ├── manifest_chrome.json  # Configuration de l'extension Chrome
│   ├── manifest_firefox.json # Configuration de l'extension Firefox
│   ├── main.html             # Page de paramètres
│   ├── popup.html            # Page popup
│   ├── js/
│   │   ├── worker.js         # Service en arrière-plan (Chrome: Service Worker)
│   │   ├── popup.js          # Logique principale du popup
│   │   ├── main.js           # Logique principale de la page de paramètres
│   │   ├── i18n.js           # Prise en charge de l'internationalisation
│   │   └── jquery.js         # Bibliothèque jQuery
│   ├── css/
│   │   ├── main.css          # Styles de la page de paramètres (y compris les composants communs)
│   │   ├── popup.css         # Styles du popup
│   │   ├── theme.css         # Styles du thème
│   │   └── eye-button.css    # Styles du bouton d'affichage du mot de passe
│   └── images/               # Ressources d'images
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
└── public/                   # Ressources publiques
    └── img/                  # Images de démonstration et promotionnelles
```

## 🚀 Démarrage rapide

### Installation de l'extension

**Chrome:**

Méthode 1 (Recommandée): Installer depuis le Chrome Web Store
1. Ouvrez Chrome et accédez au [Chrome Web Store](https://chrome.google.com/webstore)
2. Recherchez "Assistant Proxy"
3. Cliquez sur "Ajouter à Chrome"

Méthode 2: Installation locale
- **Option A (Utilisation du code source)**: Téléchargez le code source, renommez `src/manifest_chrome.json` en `manifest.json`, puis chargez le répertoire `src`
- **Option B (Utilisation du package)**: Téléchargez le package d'extension Chrome (`.zip`) depuis le répertoire release, extrayez et chargez le répertoire

**Firefox:**

Méthode 1 (Recommandée): Installer depuis les modules complémentaires Firefox
1. Ouvrez Firefox et accédez aux [Modules complémentaires Firefox](https://addons.mozilla.org/)
2. Recherchez "Assistant Proxy"
3. Cliquez sur "Ajouter à Firefox"

Méthode 2: Installation locale
1. Téléchargez le package d'extension Firefox (`.xpi`) depuis le répertoire release
2. Ouvrez Firefox et accédez à `about:addons`
3. Cliquez sur **l'icône d'engrenage** → **Installer depuis un fichier**
4. Sélectionnez le fichier `.xpi` téléchargé

### Ajout d'un proxy

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

### Utilisation des proxies

**Mode Manuel**:
1. Sélectionnez le mode **"Manuel"** dans le popup
2. Sélectionnez un proxy dans la liste
3. Le statut "Connecté" indique qu'il est actif

**Mode Automatique**:
1. Sélectionnez le mode **"Automatique"** dans le popup
2. Configurez les règles d'URL pour chaque proxy dans la page de paramètres
3. Les proxies sont automatiquement sélectionnés selon le site web que vous consultez

## 📖 Documentation détaillée

### Syntaxe des règles d'URL

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

### Politique de repli

En mode automatique, lorsque la connexion proxy échoue :

| Politique | Description |
|-----------|-------------|
| **Connexion directe (DIRECT)** | Contourner le proxy, se connecter directement au site cible |
| **Refus de connexion (REJECT)** | Refuser la demande |

### Mode automatique avec script PAC

Le mode automatique utilise les scripts PAC (Proxy Auto-Config) :
- Sélectionne automatiquement le proxy selon l'URL actuelle
- Correspond dans l'ordre de la liste proxy, retourne le premier proxy correspondant
- Prise en charge de la politique de repli
- Restaure automatiquement la dernière configuration au démarrage du navigateur

### Raccourcis

| Action | Méthode |
|--------|---------|
| Déplier/Replier la carte proxy | Cliquer sur l'en-tête de la carte |
| Déplier/Replier toutes les cartes | Cliquer sur le bouton "Tout déplier/replier" |
| Réorganiser par glisser-déposer | Faire glisser la poignée sur l'en-tête de la carte |
| Afficher/Masquer le mot de passe | Cliquer sur l'icône'œil du champ mot de passe |
| Activer/Désactiver un seul proxy | Utiliser l'interrupteur sur la carte |
| Tester un seul proxy | Cliquer sur le bouton "Test de connexion" |
| Tester tous les proxies | Cliquer sur le bouton "Tout tester" |

### Importation/Exportation de la configuration

1. **Exporter la configuration**: Cliquez sur "Exporter la configuration" pour télécharger un fichier JSON
2. **Importer la configuration**: Cliquez sur "Importer la configuration" et sélectionnez un fichier JSON pour restaurer

La configuration inclut :
- Toutes les informations de proxy
- Paramètres du thème
- Heures du mode nuit
- Paramètres de langue
- État de la synchronisation

### Détection de l'état du proxy

Cliquez sur le bouton "Détecter l'effet du proxy" pour :
- Afficher le mode proxy actuel du navigateur
- Vérifier si l'extension contrôle correctement le proxy
- Détecter si d'autres extensions ont pris le contrôle
- Obtenir un diagnostic et des suggestions

## 🔧 Architecture technique

### Manifest V3

- Chrome utilise la spécification Manifest V3
- Service Worker remplace les pages d'arrière-plan
- Firefox utilise background scripts + onRequest API

### Modules principaux

1. **worker.js (Chrome)**:
   - Gestion de la configuration du proxy
   - Génération du script PAC
   - Gestion de l'authentification
   - Logique de test du proxy
   - Surveillance des changements de stockage

2. **popup.js**:
   - Interaction avec l'interface du popup
   - Affichage de l'état du proxy
   - Basculement rapide du proxy
   - Affichage de correspondance automatique

3. **main.js**:
   - Logique de la page de paramètres
   - Gestion des proxies (CRUD)
   - Réorganisation par glisser-déposer
   - Importation/Exportation
   - Fonction de détection proxy

4. **i18n.js**:
   - Prise en charge multilingue
   - Changement de langue en temps réel

### Stockage des données

- `chrome.storage.local`: Stockage local (toujours utilisé)
- `chrome.storage.sync`: Stockage de synchronisation cloud (optionnel)
- Suit le principe du local-first, résout les problèmes de quota de synchronisation

### Compatibilité des navigateurs

| Fonctionnalité | Chrome | Firefox |
|----------------|--------|---------|
| Mode Manuel | ✅ | ✅ |
| Mode Automatique | ✅ | ✅ |
| Authentification Proxy | ✅ | ✅ |
| Test Proxy | ✅ | ✅ |
| Changement de Thème | ✅ | ✅ |
| Synchronisation | ✅ | ✅ |
| Détection Proxy | ✅ | ✅ |

## 📝 Cas d'utilisation

### Scénario 1: Basculement entre plusieurs proxies

- Configurer différents proxies pour différents environnements réseau
- Utiliser le proxy d'entreprise pour le réseau professionnel
- Utiliser le proxy VPN pour le réseau domestique
- Basculement rapide en un clic

### Scénario 2: Routage intelligent

- Connexion directe pour les sites nationaux
- Certains sites via le proxy
- Sélection automatique basée sur le domaine

### Scénario 3: Test du pool de proxies

- Importer plusieurs proxies
- Tester la latence en lot
- Sélectionner le proxy optimal

### Scénario 4: Partage d'équipe

- Exporter le fichier de configuration
- Partager avec les membres de l'équipe
- Configuration de proxy unifiée

## ⚠️ Remarques importantes

1. **Description des permissions**: L'extension nécessite les permissions suivantes :
   - `proxy`: Gérer les paramètres proxy
   - `storage`: Stocker les configurations
   - `webRequest` / `webRequestAuthProvider`: Gérer les demandes d'authentification
   - `<all_urls>`: Accéder à toutes les URL de sites web

2. **Conflits avec d'autres extensions**: En cas de conflits proxy, veuillez désactiver les autres extensions de type proxy/VPN

3. **Sécurité**: Les identifiants sont stockés localement dans le navigateur, veuillez assurer la sécurité de votre appareil

4. **Exigences réseau**: Assurez-vous que le serveur proxy est accessible

5. **Limitation Firefox**: Version minimale requise pour Firefox : 142.0

## 📄 Politique de confidentialité

[Politique de confidentialité](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 📄 Licence

MIT License - Voir le fichier [LICENSE](../LICENSE) pour plus de détails

## 🤝 Contribution

Les rapports d'issues et les pull requests sont les bienvenus !

## 📧 Contact

Pour des questions ou suggestions, veuillez soumettre vos commentaires via GitHub Issues.

---

<div align="center">

**Si ce projet vous aide, pensez à lui donner une Star ⭐ !**

</div>
