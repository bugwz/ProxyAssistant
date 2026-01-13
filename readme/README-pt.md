<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Assistente de Proxy

</div>

<div align="center">

[![Extensão Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Extensão Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilíngue](https://img.shields.io/badge/Multilíngue-yellow)](README-pt.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [**Português**](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

Uma poderosa extensão de gerenciamento de proxy para navegador que suporta Chrome e Firefox, facilitando a configuração e alternância de proxies de rede.

</div>

![](../public/img/promotion/1400-560-big.jpeg)

## ✨ Funcionalidades

### 🔌 Suporte a múltiplos protocolos de proxy
- **HTTP** - Proxy HTTP tradicional
- **HTTPS** - Proxy HTTPS seguro
- **SOCKS5** - Proxy SOCKS5 com suporte TCP/UDP
- **SOCKS4** - Compatibilidade com proxy SOCKS4 legado

### 🌐 Suporte a múltiplos navegadores
- **Chrome** - Usando Manifest V3 + Service Worker
- **Firefox** - Usando onRequest API para interceptação de proxy

### 🔄 Três modos de proxy

| Modo | Descrição |
|------|-----------|
| **Desativar** | Desativar proxy, usar conexão de rede padrão do sistema |
| **Manual** | Selecionar manualmente um proxy da lista |
| **Automático** | Selecionar automaticamente o proxy correspondente com base nas regras de URL (modo PAC) |

| ![](../public/img/demo-popup-01.png) | ![](../public/img/demo-popup-02.png) | ![](../public/img/demo-popup-03.png) |
|:---:|:---:|:---:|
| Modo Desativado | Modo Manual | Modo Automático |

### 📋 Configuração flexível de regras de URL

- **Endereços que ignoram o proxy** (`bypass_urls`): Domínios/IPs de conexão direta no modo manual
- **Endereços que usam o proxy** (`include_urls`): Domínios que requerem acesso proxy no modo automático
- **Estratégia de fallback**: No modo automático, escolher conexão direta ou rejeição quando a conexão falha
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

### 🏃 Detecção de estado do proxy

- Detectar a configuração atual do proxy do navegador
- Verificar se a extensão controlou com sucesso o proxy
- Identificar outras extensões que controlam o proxy
- Fornecer três resultados: estado, advertência, erro

### 🌙 Modos de tema

- **Modo Claro**: Para uso diurno
- **Modo Escuro**: Para uso noturno
- **Alternância automática**: Alternar tema automaticamente com base no horário (período configurável)

| ![Modo Claro](../public/img/demo-light.png) | ![Modo Escuro](../public/img/demo-night.png) |
|:---:|:---:|
| Modo Claro | Modo Escuro |

### ☁️ Armazenamento e sincronização de dados

- **Armazenamento local primeiro**: A configuração do proxy sempre é salva no armazenamento local
- **Sincronização em nuvem**: Opcionalmente habilitar sincronização com conta Chrome/Firefox
- **Mesclagem inteligente**: Mesclar automaticamente dados locais e remotos quando há anomalias na sincronização
- **Importar/Exportar**: Suporte a backup e restauração de configuração em formato JSON

### 🌍 Suporte a múltiplos idiomas

Esta extensão suporta os seguintes idiomas:

| Idioma | Código | Estado |
|--------|--------|--------|
| 简体中文 | zh-CN | ✅ Suportado |
| 繁體中文 | zh-TW | ✅ Suportado |
| English | en | ✅ Suportado |
| 日本語 | ja | ✅ Suportado |
| Français | fr | ✅ Suportado |
| Deutsch | de | ✅ Suportado |
| Español | es | ✅ Suportado |
| Português | pt | ✅ Suportado |
| Русский | ru | ✅ Suportado |
| 한국어 | ko | ✅ Suportado |

## 📷 Interface de configuração

![](../public/img/demo.png)

## 📁 Estrutura do projeto

```
ProxyAssistant/
├── readme/                    # Documentação multilíngue
│   ├── README-zh-CN.md       # Chinês simplificado
│   ├── README-zh-TW.md       # Chinês tradicional
│   ├── README-en.md          # Inglês
│   └── ...
├── src/                       # Código fonte
│   ├── manifest_chrome.json  # Configuração extensão Chrome
│   ├── manifest_firefox.json # Configuração extensão Firefox
│   ├── main.html             # Página de configuração
│   ├── popup.html            # Página popup
│   ├── js/
│   │   ├── worker.js         # Serviço em segundo plano (Chrome: Service Worker)
│   │   ├── popup.js          # Lógica principal do popup
│   │   ├── main.js           # Lógica principal da página de configuração
│   │   ├── i18n.js           # Suporte à internacionalização
│   │   └── jquery.js         # Biblioteca jQuery
│   ├── css/
│   │   ├── main.css          # Estilos da página de configuração
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
│       └── promotion/        # Imagens promocionais
└── public/                   # Recursos públicos
```

## 🚀 Início rápido

### Instalação da extensão

**Chrome:**

Método 1 (Recomendado): Instalar da loja oficial do Chrome
1. Abrir Chrome, visitar [Chrome Web Store](https://chrome.google.com/webstore)
2. Buscar "Assistente de Proxy"
3. Clicar em "Adicionar ao Chrome"

Método 2: Instalação local
- **Opção A (usar código fonte)**: Baixar código fonte, renomear `src/manifest_chrome.json` para `manifest.json`, then carregar o diretório `src`
- **Opção B (usar pacote)**: Baixar o pacote de instalação do Chrome (arquivo `.zip`) do diretório `release`, extrair e carregar o diretório correspondente

**Firefox:**

Método 1 (Recomendado): Instalar dos extras oficiais do Firefox
1. Abrir Firefox, visitar [Extras do Firefox](https://addons.mozilla.org/)
2. Buscar "Assistente de Proxy"
3. Clicar em "Adicionar ao Firefox"

Método 2: Instalação local
1. Baixar o pacote de instalação do Firefox (arquivo `.xpi`) do diretório `release`
2. Abrir Firefox, visitar `about:addons`
3. Clicar em **ícone de engrenagem** → **Instalar extra a partir do arquivo**
4. Selecionar o arquivo `.xpi` baixado

### Adicionar um proxy

1. Clicar no ícone da extensão para abrir o popup
2. Clicar no botão **"Configurações"** para abrir a página de configurações
3. Clicar no botão **"Novo proxy"** para adicionar um novo proxy
4. Preencher as informações do proxy:
   - Nome do proxy
   - Tipo de protocolo (HTTP/HTTPS/SOCKS4/SOCKS5)
   - Endereço do proxy (IP ou domínio)
   - Porta
   - (Opcional) Nome de usuário e senha
   - (Opcional) Configuração de regras URL
5. Clicar no botão **"Salvar"**

### Usar proxies

**Modo Manual**:
1. Selecionar **"Manual"** no popup
2. Selecionar o proxy da lista
3. O status "Conectado" indica que está ativo

**Modo Automático**:
1. Selecionar **"Automático"** no popup
2. Configurar regras URL para cada proxy na página de configurações
3. O proxy é selecionado automaticamente com base no site visitado

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

### Estratégia de fallback

No modo automático, quando a conexão do proxy falha:

| Estratégia | Descrição |
|------------|-----------|
| **Conexão direta (DIRECT)** | Ignorar proxy, conectar diretamente ao site de destino |
| **Rejeitar conexão (REJECT)** | Rejeitar a solicitação |

### Modo automático com script PAC

O modo automático usa scripts PAC (Proxy Auto-Config):
- Selecionar automaticamente o proxy com base na URL atual
- Corresponder em ordem de lista de proxies, retornar o primeiro proxy correspondente
- Suporta estratégia de fallback
- Restaurar automaticamente a última configuração ao iniciar o navegador

### Operações de atalho

| Operação | Método |
|----------|--------|
| Expandir/recolher cartão proxy | Clicar no cabeçalho do cartão |
| Expandir/recolher todos os cartões | Clicar no botão "Expandir/recolher tudo" |
| Reordenar proxy arrastando | Arrastar a alça no cabeçalho do cartão |
| Mostrar/esconder senha | Clicar no ícone de olho à direita do campo de senha |
| Habilitar/desabilitar proxy individualmente | Toggle no cartão |
| Testar proxy individual | Clicar no botão "Testar conexão" |
| Testar todos os proxies | Clicar no botão "Testar tudo" |

### Importar/exportar configuração

1. **Exportar configuração**: Clicar em "Exportar configuração" para baixar arquivo JSON
2. **Importar configuração**: Clicar em "Importar configuração" e selecionar arquivo JSON para restaurar

A configuração inclui:
- Todas as informações do proxy
- Configurações de tema
- Período do modo noturno
- Configuração de idioma
- Estado do interruptor de sincronização

### Detecção de estado do proxy

Clicar no botão "Detectar efeito do proxy" pode:
- Ver o modo atual do proxy do navegador
- Verificar se a extensão controlou com sucesso o proxy
- Detectar se outras extensões ocuparam o controle
- Obter diagnóstico e sugestões de problemas

## 🔧 Arquitetura técnica

### Manifest V3

- Chrome usa especificação Manifest V3
- Service Worker substitui páginas de segundo plano
- Firefox usa background scripts + onRequest API

### Módulos principais

1. **worker.js (Chrome)**:
   - Gerenciamento de configuração do proxy
   - Geração de script PAC
   - Tratamento de autenticação
   - Lógica de teste de proxy
   - Escuta de mudanças de armazenamento

2. **popup.js**:
   - Interação com interface do popup
   - Exibição de estado do proxy
   - Alternância rápida de proxy
   - Exibição de correspondência automática

3. **main.js**:
   - Lógica da página de configurações
   - Gerenciamento de proxies (CRUD)
   - Ordenação por arrastar e soltar
   - Importar/Exportar
   - Função de detecção de proxy

4. **i18n.js**:
   - Suporte a múltiplos idiomas
   - Alternância de idioma em tempo real

### Armazenamento de dados

- `chrome.storage.local`: Armazenamento local (sempre usado)
- `chrome.storage.sync`: Armazenamento de sincronização em nuvem (opcional)
- Princípio local first, resolve problema de cota de sincronização

### Compatibilidade de navegador

| Função | Chrome | Firefox |
|--------|--------|---------|
| Modo Manual | ✅ | ✅ |
| Modo Automático | ✅ | ✅ |
| Autenticação proxy | ✅ | ✅ |
| Teste proxy | ✅ | ✅ |
| Alternância de tema | ✅ | ✅ |
| Sincronização de dados | ✅ | ✅ |
| Detecção proxy | ✅ | ✅ |

## 📝 Casos de uso

### Cenário 1: Alternância entre múltiplos proxies

- Configurar diferentes proxies para diferentes ambientes de rede
- Usar proxy da empresa para rede do escritório
- Usar proxy científico para rede doméstica
- Alternância rápida com um clique

### Cenário 2: Roteamento inteligente

- Sites nacionais conexão direta
- Sites específicos através de proxy
- Seleção automática com base no domínio

### Cenário 3: Teste de pool de proxies

- Importar múltiplos proxies
- Testar latência em lote
- Selecionar proxy ideal para usar

### Cenário 4: Compartilhamento em equipe

- Exportar arquivo de configuração
- Compartilhar com membros da equipe
- Configuração de proxy unificada

## ⚠️ Observações importantes

1. **Descrição de permissões**: A extensão requer as seguintes permissões:
   - `proxy`: Gerenciar configurações de proxy
   - `storage`: Armazenar configurações
   - `webRequest` / `webRequestAuthProvider`: Manipular solicitações de autenticação
   - `<all_urls>`: Acessar todas as URLs de sites

2. **Conflitos com outras extensões**: Se houver conflitos de proxy, desativar outras extensões proxy/VPN

3. **Segurança**: As credenciais são armazenadas localmente no navegador, por favor garantir a segurança do dispositivo

4. **Requisitos de rede**: Garantir que o servidor proxy esteja acessível normalmente

5. **Restrição de Firefox**: A versão mínima do Firefox necessária é 142.0

## 📄 Licença

MIT License - Ver arquivo [LICENSE](../LICENSE) para detalhes

## 🤝 Contribuição

Relatórios de issues e pull requests são bem-vindos!

## 📧 Contato

Para perguntas ou sugestões, por favor enviar comentários através do GitHub Issues.

---

<div align="center">

**Se este projeto foi útil para você, considere dar um Star ⭐ para apoiar!**

</div>
