<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Assistente de Proxy

</div>

<div align="center">

[![Extensão Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilíngue](https://img.shields.io/badge/Suporta-vários-idiomas-yellow)](README-en.md)

</div>

<div align="center">

[简体中文](README.md) | [繁體中文](readme/README-zh-TW.md) | [English](readme/README-en.md) | [日本語](readme/README-ja.md) | [Français](readme/README-fr.md) | [Deutsch](readme/README-de.md) | [Español](readme/README-es.md) | [**Português**](readme/README-pt.md) | [Русский](readme/README-ru.md) | [한국어](readme/README-ko.md)

</div>

<div align="center">

Uma extensão poderosa de gerenciamento de proxy para Chrome que ajuda você a configurar e alternar facilmente entre diferentes proxies de rede.
</div>

![](src/images/promotion/1400-560-big.jpeg)

## ✨ Funcionalidades

### 🔌 Suporte a múltiplos protocolos de proxy
- **HTTP** - Proxy HTTP tradicional
- **HTTPS** - Proxy HTTPS seguro
- **SOCKS5** - Proxy SOCKS5 com suporte TCP/UDP
- **SOCKS4** - Compatibilidade com proxy SOCKS4 legado

### 🔄 Três modos de proxy

| Modo | Descrição |
|------|-----------|
| **Desativar** | Desativar proxy, usar conexão de rede padrão do sistema |
| **Manual** | Selecionar manualmente um proxy da lista |
| **Automático** | Selecionar automaticamente o proxy correspondente com base nas regras de URL (modo PAC) |

| ![](../src/images/demo-popup-01.png) | ![](../src/images/demo-popup-02.png) | ![](../src/images/demo-popup-03.png) |
|:---:|:---:|:---:|
| Modo Desativado | Modo Manual | Modo Automático |

### 📋 Configuração flexível de regras de URL

- **Endereços que ignoram o proxy** (`bypass_urls`): Domínios/IPs de conexão direta
- **Endereços que usam o proxy** (`include_urls`): Domínios que requerem acesso proxy
- Suporta curinga `*` e correspondência de domínio
- Adequado para cenários onde diferentes sites usam diferentes proxies

### 🔐 Suporte a autenticação de proxy

- Autenticação com nome de usuário/senha
- Tratamento automático de solicitações de autenticação do servidor proxy
- Armazenamento seguro de credenciais

### 🧪 Funcionalidades de teste de proxy

- **Teste de conexão**: Verificar disponibilidade do proxy
- **Medição de latência**: Testar tempo de resposta do proxy
- **Teste em lote**: Testar todos os proxies com um clique
- **Indicadores de cor**: Verde(<500ms) / Laranja(≥500ms) / Vermelho(Falhou)

### 🌙 Modos de tema

- **Modo Claro**: Para uso diurno
- **Modo Escuro**: Para uso noturno
- **Alternância automática**: Alternar tema automaticamente com base no horário

| ![Modo Claro](../src/images/demo-light.png) | ![Modo Escuro](../src/images/demo-night.png) |
|:---:|:---:|
| Modo Claro | Modo Escuro |

### ☁️ Sincronização de dados

- **Sincronização com Google**: Sincronizar configurações de proxy entre dispositivos
- **Armazenamento local**: Opção para salvar apenas localmente

### 🌍 Suporte a múltiplos idiomas

Esta extensão suporta 5 idiomas:

| Idioma | Código | Estado |
|--------|--------|--------|
| 简体中文 | zh-CN | ✅ Suportado |
| 繁體中文 | zh-TW | ✅ Suportado |
| English | en | ✅ Suportado |
| 日本語 | ja | ✅ Suportado |
| Français | fr | ✅ Suportado |

## 📷 Interface de configuração

![](src/images/demo.png)

## 📁 Estrutura do projeto

```
ProxyAssistant/
├── readme/                    # Documentação multilíngue
│   ├── README-zh-CN.md       # Chinês simplificado
│   ├── README-zh-TW.md       # Chinês tradicional
│   ├── README-en.md          # Inglês
│   └── ...
├── src/                       # Código fonte
│   ├── manifest.json         # Configuração da extensão Chrome
│   ├── main.html             # Página de configurações
│   ├── popup.html            # Página popup
│   ├── js/
│   │   ├── main.js           # Lógica principal da página de configurações
│   │   ├── popup.js          # Lógica principal do popup
│   │   ├── service-worker.js # Serviço em segundo plano (lógica principal do proxy)
│   │   ├── i18n.js           # Suporte à internacionalização
│   │   └── jquery.js         # Biblioteca jQuery
│   ├── css/
│   │   ├── main.css          # Estilos da página de configurações
│   │   ├── popup.css         # Estilos do popup
│   │   ├── theme.css         # Estilos de tema
│   │   ├── switch.css        # Estilos do componente interruptor
│   │   ├── delete-button.css # Estilos do botão excluir
│   │   └── eye-button.css    # Estilos do botão mostrar senha
│   └── images/               # Recursos de imagem
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
└── public/                   # Recursos públicos
    └── ...
```

## 🚀 Início rápido

### Instalação da extensão

1. Abra o Chrome e navegue até `chrome://extensions/`
2. Ative o **"Modo de desenvolvedor"** no canto superior direito
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `ProxyAssistant`

### Adicionar um proxy

1. Clique no ícone da extensão para abrir o popup
2. Clique no botão **"Configurações"** para abrir a página de configurações
3. Clique no botão **"Novo"** para adicionar um novo proxy
4. Preencha as informações do proxy:
   - Nome do proxy
   - Tipo de protocolo (HTTP/HTTPS/SOCKS5)
   - Endereço do proxy (IP ou domínio)
   - Número da porta
   - (Opcional) Nome de usuário e senha
5. Clique no botão **"Salvar"**

### Usar proxies

**Modo Manual**:
1. Selecione o modo **"Manual"** no popup
2. Selecione um proxy da lista
3. O status "Conectado" indica que está ativo

**Modo Automático**:
1. Selecione o modo **"Automático"** no popup
2. Configure regras de URL para cada proxy na página de configurações
3. Os proxies são selecionados automaticamente com base no site que você está visitando

## 📖 Documentação detalhada

### Sintaxe de regras de URL

Suporta as seguintes regras de correspondência:

```
# Correspondência exata
google.com

# Correspondência de subdomínio
.google.com
www.google.com

# Correspondência com curinga
*.google.com
*.twitter.com

# Endereço IP
192.168.1.1
10.0.0.0/8
```

### Modo automático com script PAC

O modo automático usa scripts PAC (Proxy Auto-Config):
- Seleciona automaticamente o proxy com base na URL atual
- Suporta políticas de fallback (conexão direta ou rejeição)
- Restaura automaticamente a última configuração ao iniciar o navegador

### Atalhos de teclado

| Ação | Método |
|------|--------|
| Expandir/colapsar cartão do proxy | Clicar no cabeçalho do cartão |
| Expandir/colapsar todos os cartões | Clicar no botão "Expandir tudo" |
| Reordenar proxy arrastando | Arrastar a alça no cabeçalho do cartão |
| Mostrar/esconder senha | Clicar no ícone de olho no campo de senha |
| Testar proxy individual | Clicar no botão "Testar" |
| Testar todos os proxies | Clicar no botão "Testar tudo" |

### Importar/exportar configuração

1. **Exportar configuração**: Clique em "Exportar configuração" para baixar um arquivo JSON
2. **Importar configuração**: Clique em "Importar configuração" e selecione um arquivo JSON para restaurar

A configuração inclui:
- Todas as informações de proxy
- Configurações de tema
- Configurações de sincronização

## 🔧 Arquitetura técnica

### Manifest V3

- Usa especificação Chrome Extension Manifest V3
- Service Worker substitui páginas de segundo plano
- Arquitetura mais segura e eficiente

### Módulos principais

1. **service-worker.js**:
   - Gerenciamento de configuração do proxy
   - Geração de script PAC
   - Tratamento de autenticação
   - Lógica de teste de proxy

2. **popup.js**:
   - Interação com interface do popup
   - Exibição de status do proxy
   - Alternância rápida de proxy

3. **main.js**:
   - Lógica da página de configurações
   - Gerenciamento de proxies (CRUD)
   - Ordenação por arrastar e soltar
   - Importar/Exportar

4. **i18n.js**:
   - Suporte a múltiplos idiomas
   - Alternância de idioma em tempo real

### Armazenamento de dados

- `chrome.storage.local`: Armazenamento local
- `chrome.storage.sync`: Armazenamento de sincronização em nuvem
- Tratamento automático de cota de armazenamento

## 📝 Casos de uso

### Cenário 1: Alternância entre múltiplos proxies

- Configurar diferentes proxies para diferentes ambientes de rede
- Usar proxy da empresa para rede do escritório
- Usar proxy VPN para rede doméstica
- Alternância rápida com um clique

### Cenário 2: Roteamento inteligente

- Sites nacionais conexão direta
- Sites específicos através de proxy
- Seleção automática com base no domínio

### Cenário 3: Teste de pool de proxies

- Importar múltiplos proxies
- Testar latência em lote
- Selecionar proxy ideal

### Cenário 4: Compartilhamento em equipe

- Exportar arquivo de configuração
- Compartilhar com membros da equipe
- Configuração de proxy unificada

## ⚠️ Observações importantes

1. **Descrição de permissões**: A extensão requer as seguintes permissões:
   - `proxy`: Gerenciar configurações de proxy
   - `storage`: Armazenar configurações
   - `webRequest`: Manipular solicitações de autenticação
   - `<all_urls>`: Acessar todas as URLs de sites

2. **Conflitos com outras extensões**: Se houver conflitos de proxy, desative outras extensões de proxy

3. **Segurança**: As credenciais são armazenadas localmente no navegador, certifique-se de que seu dispositivo está seguro

4. **Requisitos de rede**: Certifique-se de que o servidor proxy está acessível

## 📄 Licença

MIT License - Veja o arquivo [LICENSE](../LICENSE) para detalhes

## 🤝 Contribuição

Relatórios de issues e pull requests são bem-vindos!

## 📧 Contato

Para perguntas ou sugestões, envie comentários através do GitHub Issues.
