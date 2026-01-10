<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Assistant Proxy

</div>

<div align="center">

[![Extension Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingue](https://img.shields.io/badge/Multilingue-yellow)](README-fr.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [**Français**](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

Une extension puissante de gestion de proxy pour Chrome qui vous permet de configurer et de basculer facilement entre différents proxies réseau.
</div>

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260110212231/assets/store/promotional/marquee-1632x656.jpeg)

## ✨ Fonctionnalités

### 🔌 Prise en charge de plusieurs protocoles proxy
- **HTTP** - Proxy HTTP traditionnel
- **HTTPS** - Proxy HTTPS sécurisé
- **SOCKS5** - Proxy SOCKS5 avec support TCP/UDP
- **SOCKS4** - Compatibilité proxy SOCKS4 legacy

### 🔄 Trois modes proxy

| Mode | Description |
|------|-------------|
| **Désactiver** | Désactiver le proxy, utiliser la connexion réseau par défaut du système |
| **Manuel** | Sélectionner manuellement un proxy depuis la liste |
| **Automatique** | Sélectionner automatiquement le proxy correspondant selon les règles d'URL (mode PAC) |

| ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260110212231/assets/screenshots/popup/disabled.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260110212231/assets/screenshots/popup/manual.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260110212231/assets/screenshots/popup/auto.png) |
|:---:|:---:|:---:|
| Mode Désactivé | Mode Manuel | Mode Automatique |

### 📋 Configuration flexible des règles d'URL

- **Adresses bypassant le proxy** (`bypass_urls`): Domaines/IP de connexion directe
- **Adresses utilisant le proxy** (`include_urls`): Domaines nécessitant un accès proxy
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

### 🌙 Modes de thème

- **Mode Clair**: Pour une utilisation de jour
- **Mode Sombre**: Pour une utilisation de nuit
- **Basculement automatique**: Changer automatiquement de thème selon l'heure

| ![Mode Clair](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260110212231/assets/screenshots/main/theme-light.png) | ![Mode Sombre](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260110212231/assets/screenshots/main/theme-dark.png) |
|:---:|:---:|
| Mode Clair | Mode Sombre |

### ☁️ Synchronisation des données

- **Synchronisation Google**: Synchroniser les configurations proxy entre plusieurs appareils
- **Stockage local**: Option de sauvegarde locale uniquement

### 🌍 Prise en charge multilingue

Cette extension prend en charge 5 langues :

| Langue | Code | État |
|--------|------|------|
| 简体中文 | zh-CN | ✅ Pris en charge |
| 繁體中文 | zh-TW | ✅ Pris en charge |
| English | en | ✅ Pris en charge |
| 日本語 | ja | ✅ Pris en charge |
| Français | fr | ✅ Pris en charge |

## 📷 Interface de configuration

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260110212231/assets/screenshots/main/settings.png)

## 📁 Structure du projet

```
ProxyAssistant/
├──                     # Documentation multilingue
│   ├── README-zh-CN.md       # Chinois simplifié
│   ├── README-zh-TW.md       # Chinois traditionnel
│   ├── README-en.md          # Anglais
│   └── ...
├── src/                       # Code source
│   ├── manifest.json         # Configuration de l'extension Chrome
│   ├── main.html             # Page de paramètres
│   ├── popup.html            # Page popup
│   ├── js/
│   │   ├── main.js           # Logique principale de la page de paramètres
│   │   ├── popup.js          # Logique principale du popup
│   │   ├── service-worker.js # Service en arrière-plan (logique principale du proxy)
│   │   ├── i18n.js           # Prise en charge de l'internationalisation
│   │   └── jquery.js         # Bibliothèque jQuery
│   ├── css/
│   │   ├── main.css          # Styles de la page de paramètres
│   │   ├── popup.css         # Styles du popup
│   │   ├── theme.css         # Styles du thème
│   │   ├── switch.css        # Styles du composant interrupteur
│   │   ├── delete-button.css # Styles du bouton de suppression
│   │   └── eye-button.css    # Styles du bouton d'affichage du mot de passe
│   └── images/               # Ressources d'images
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
└── public/                   # Ressources publiques
    └── ...
```

## 🚀 Démarrage rapide

### Installation de l'extension

1. Ouvrez Chrome et accédez à `chrome://extensions/`
2. Activez le **"Mode développeur"** en haut à droite
3. Cliquez sur **"Charger l'extension non empaquetée"**
4. Sélectionnez le dossier `ProxyAssistant/src` .

### Ajout d'un proxy

1. Cliquez sur l'icône de l'extension pour ouvrir le popup
2. Cliquez sur le bouton **"Paramètres"** pour ouvrir la page de paramètres
3. Cliquez sur le bouton **"Nouveau"** pour ajouter un nouveau proxy
4. Remplissez les informations du proxy :
   - Nom du proxy
   - Type de protocole (HTTP/HTTPS/SOCKS5)
   - Adresse du proxy (IP ou domaine)
   - Numéro de port
   - (Optionnel) Nom d'utilisateur et mot de passe
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

### Mode automatique avec script PAC

Le mode automatique utilise les scripts PAC (Proxy Auto-Config) :
- Sélectionne automatiquement le proxy selon l'URL actuelle
- Prise en charge des politiques de repli (connexion directe ou refus)
- Restaure automatiquement la dernière configuration au démarrage du navigateur

### Raccourcis

| Action | Méthode |
|--------|---------|
| Déplier/Replier la carte proxy | Cliquer sur l'en-tête de la carte |
| Déplier/Replier toutes les cartes | Cliquer sur le bouton "Tout déplier" |
| Réorganiser par glisser-déposer | Faire glisser la poignée sur l'en-tête de la carte |
| Afficher/Masquer le mot de passe | Cliquer sur l'icône'œil du champ mot de passe |
| Tester un seul proxy | Cliquer sur le bouton "Tester" |
| Tester tous les proxies | Cliquer sur le bouton "Tout tester" |

### Importation/Exportation de la configuration

1. **Exporter la configuration**: Cliquez sur "Exporter la configuration" pour télécharger un fichier JSON
2. **Importer la configuration**: Cliquez sur "Importer la configuration" et sélectionnez un fichier JSON pour restaurer

La configuration inclut :
- Toutes les informations de proxy
- Paramètres du thème
- Paramètres de synchronisation

## 🔧 Architecture technique

### Manifest V3

- Utilise la spécification Chrome Extension Manifest V3
- Service Worker remplace les pages d'arrière-plan
- Architecture plus sécurisée et efficace

### Modules principaux

1. **service-worker.js**:
   - Gestion de la configuration du proxy
   - Génération du script PAC
   - Gestion de l'authentification
   - Logique de test du proxy

2. **popup.js**:
   - Interaction avec l'interface du popup
   - Affichage de l'état du proxy
   - Basculement rapide du proxy

3. **main.js**:
   - Logique de la page de paramètres
   - Gestion des proxies (CRUD)
   - Réorganisation par glisser-déposer
   - Importation/Exportation

4. **i18n.js**:
   - Prise en charge multilingue
   - Changement de langue en temps réel

### Stockage des données

- `chrome.storage.local`: Stockage local
- `chrome.storage.sync`: Stockage de synchronisation cloud
- Gestion automatique du quota de stockage

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
   - `webRequest`: Gérer les demandes d'authentification
   - `<all_urls>`: Accéder à toutes les URL de sites web

2. **Conflits avec d'autres extensions**: En cas de conflits proxy, veuillez désactiver les autres extensions de type proxy

3. **Sécurité**: Les identifiants sont stockés localement dans le navigateur, veuillez assurer la sécurité de votre appareil

4. **Exigences réseau**: Assurez-vous que le serveur proxy est accessible

## 📄 Licence

MIT License - Voir le fichier [LICENSE](../LICENSE) pour plus de détails

## 🤝 Contribution

Les rapports d'issues et les pull requests sont les bienvenus !

## 📧 Contact

Pour des questions ou suggestions, veuillez soumettre vos commentaires via GitHub Issues.
