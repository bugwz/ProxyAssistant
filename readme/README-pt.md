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

Uma poderosa extensão de gerenciamento de proxy para navegador que suporta Chrome/Firefox/Edge e outros navegadores múltiplos, com gerenciamento de múltiplos cenários, facilitando a configuração e alternância de proxies de rede.

</div>

![](../public/img/promotion/1400-560.png)

## 1. ✨ Funcionalidades

### 1.1 🔌 Suporte a múltiplos protocolos de proxy
- **HTTP** - Proxy HTTP tradicional
- **HTTPS** - Proxy HTTPS seguro
- **SOCKS5** - Proxy SOCKS5 com suporte TCP/UDP
- **SOCKS4** - Compatibilidade com proxy SOCKS4 legado

### 1.2 🌐 Suporte a múltiplos navegadores
- **Chrome** - Usando Manifest V3 + Service Worker
- **Firefox** - Usando Manifest V3 + API `proxy.onRequest` para interceptação de solicitações de proxy
- **Edge** - Totalmente compatível com extensões do Chrome, baseado no kernel Chromium

### 1.3 🔄 Três modos de proxy

| Modo | Descrição |
|------|-----------|
| **Desativar** | Desativar proxy, usar conexão de rede padrão do sistema |
| **Manual** | Selecionar manualmente um proxy da lista |
| **Automático** | Selecionar automaticamente o proxy correspondente com base nas regras de URL (modo PAC) |

![](../public/img/promotion/1280-800-03.png)

### 1.4 🎬 Modo Cenário

- **Suporte Multi-cenário**: Criar diferentes conjuntos de configurações de proxy (ex: Empresa, Casa, Ambiente de Desenvolvimento)
- **Alternância Rápida**: Alternância com um clique de listas de proxy entre diferentes cenários
- **Gestão Flexível**: Suporte para adicionar, renomear, excluir e ordenar cenários
- **Migração de Proxy**: Suporte para mover proxies entre diferentes cenários
- **Aplicação automática**: Seleção e aplicação automáticas de proxy ao mudar de cenário no modo manual

### 1.5 📥 Função de assinatura de proxy

- **Suporte multi-formato**: Suporta formatos de assinatura AutoProxy, SwitchyLegacy, SwitchyOmega, PAC
- **Atualização automática**: Suporta atualização automática programada (1min/6h/12h/1dia)
- **Inversão de regras**: Suporta inversão de regras de correspondência e bypass de assinatura (modo lista branca/preta)
- **Visualização de regras**: Visualização rápida das regras de correspondência e bypass extraídas da assinatura
- **ID único**: Cada proxy e cenário tem um ID único para gestão precisa

### 1.6 📋 Configuração flexível de regras de URL

- **Endereços que ignoram o proxy** (`bypass_rules`): Domínios/IPs de conexão direta no modo manual
- **Endereços que usam o proxy** (`include_rules`): Domínios que requerem acesso proxy no modo automático
- **Estratégia de fallback**: No modo automático, escolher conexão direta ou rejeição quando a conexão falha
- Suporta curinga `*` e correspondência de domínio
- Adequado para cenários onde diferentes sites usam diferentes proxies

### 1.7 🔐 Suporte a autenticação de proxy

- Autenticação com nome de usuário/senha
- Tratamento automático de solicitações de autenticação do servidor proxy
- Armazenamento seguro de credenciais

### 1.8 🧪 Funcionalidades de teste de proxy

- **Teste de conexão**: Verificar disponibilidade do proxy
- **Medição de latência**: Testar tempo de resposta do proxy
- **Teste em lote**: Testar todos os proxies com um clique
- **Indicadores de cor**: Verde(<500ms) / Laranja(≥500ms) / Vermelho(Falhou)

### 1.9 🏃 Detecção de estado do proxy

- Detectar a configuração atual do proxy do navegador
- Verificar se a extensão controlou com sucesso o proxy
- Identificar outras extensões que controlam o proxy
- Fornecer três resultados: estado, advertência, erro

### 1.10 🔍 Visualização do Script PAC

- **Visualização do Script**: Ver o conteúdo do script PAC gerado automaticamente
- **Lista de Regras**: Exibição clara de todas as regras de correspondência de proxy ativas
- **Suporte a Depuração**: Solução fácil de problemas de correspondência no modo automático

### 1.11 🌙 Modos de tema

- **Modo Claro**: Para uso diurno
- **Modo Escuro**: Para uso noturno
- **Alternância automática**: Alternar tema automaticamente com base no horário (período configurável)

![](../public/img/promotion/1280-800-02.png)

### 1.12 ☁️ Armazenamento e sincronização de dados

#### 1.12.1 Estratégia de armazenamento

| Tipo de armazenamento | Conteúdo de armazenamento | Descrição |
|----------------------|---------------------------|-----------|
| **Armazenamento local (local)** | Lista de proxies, configurações de tema, configurações de idioma, configuração de sincronização | Sempre ativo, garantindo disponibilidade offline e persistência de dados |
| **Sincronização em nuvem (sync)** | Dados de configuração completos (armazenamento fragmentado) | Opcional, usa armazenamento fragmentado para contornar limites de cota |

#### 1.12.2 Métodos de sincronização

##### 1.12.2.1 Sincronização nativa do navegador (Native Sync)
- Usa a API `chrome.storage.sync` (Chrome) ou `browser.storage.sync` (Firefox)
- Sincronização automática através da conta Chrome/Firefox
- Adequado para sincronização multi-dispositivo com a mesma conta do navegador
- **Armazenamento fragmentado**: Os dados de configuração são automaticamente fragmentados (7KB por fragmento) para contornar o limite de cota de 8KB por item
- **Integridade de dados**: Usa somas de verificação para garantir a integridade dos dados de sincronização
- **Operações atômicas**: A operação Push limpa os dados antigos antes de escrever os novos para garantir consistência
- **Exibição de cota**: Exibição em tempo real da cota usada/total (100KB) e número de fragmentos

##### 1.12.2.2 Sincronização GitHub Gist
- Sincronização de configuração entre navegadores e dispositivos via GitHub Gist
- Requer configuração do GitHub Personal Access Token
- Suporta push/pull manual ou sincronização automática
- O conteúdo da configuração é armazenado criptografado, informações sensíveis são automaticamente removidas na exportação

| Item de configuração | Descrição |
|---------------------|-----------|
| **Chave de acesso** | GitHub Personal Access Token (requer permissão gist) |
| **Nome do arquivo** | Nome do arquivo no Gist, padrão `proxy_assistant_config.json` |
| **ID do Gist** | Reconhecimento e salvamento automático, nenhuma entrada manual necessária |

#### 1.12.3 Operações de sincronização

| Operação | Descrição |
|----------|-----------|
| **Push** | Carregar configuração local para a nuvem/Gist |
| **Pull** | Baixar configuração da nuvem/Gist para local |
| **Testar conexão** | Verificar a validade do Gist Token e o estado da configuração |

#### 1.12.4 Importar/Exportar

- **Exportar configuração**: Gerar arquivo JSON com todas as informações de proxy, configurações de tema, configurações de idioma, etc.
- **Importar configuração**: Suporte para restaurar configuração a partir de arquivo JSON
- **Segurança de dados**: O arquivo de exportação remove automaticamente informações sensíveis (Token, senha)
- **Compatibilidade de formato**: Suporta importação de arquivos de configuração de versões anteriores

### 1.13 🌍 Suporte a múltiplos idiomas

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

![](../public/img/promotion/1280-800-04.png)

## 2. 📷 Interface de configuração

![](../public/img/demo.png)

## 3. 📁 Estrutura do projeto

```
ProxyAssistant/
├── conf/                     # Configuração de exemplo
│   └── demo.json             # Arquivo de configuração de exemplo
├── readme/                   # Documentação multilíngue
│   ├── README-zh-TW.md       # Chinês tradicional
│   ├── README-en.md          # Inglês
│   ├── README-ja.md          # Japonês
│   ├── README-fr.md          # Francês
│   ├── README-de.md          # Alemão
│   ├── README-es.md          # Espanhol
│   ├── README-pt.md          # Português
│   ├── README-ru.md          # Russo
│   └── README-ko.md          # Coreano
├── src/                      # Código fonte
│   ├── manifest_chrome.json  # Configuração extensão Chrome (Manifest V3)
│   ├── manifest_firefox.json # Configuração extensão Firefox
│   ├── main.html             # Página de configuração
│   ├── popup.html            # Página popup
│   ├── _locales/             # Recursos de internacionalização
│   ├── js/
│   │   ├── main.js           # Lógica principal da página de configuração
│   │   ├── popup.js          # Lógica principal do popup
│   │   ├── worker.js         # Serviço em segundo plano (Chrome: Service Worker)
│   │   ├── i18n.js           # Suporte à internacionalização
│   │   ├── storage.js        # Módulo de gestão de armazenamento
│   │   ├── proxy.js          # Módulo de gestão de proxy
│   │   ├── scenarios.js      # Módulo de gestão de cenários
│   │   ├── sync.js           # Módulo de sincronização de dados
│   │   ├── subscription.js   # Módulo de função de assinatura
│   │   ├── theme.js          # Módulo de mudança de tema
│   │   ├── detection.js      # Módulo de detecção de proxy
│   │   ├── validator.js      # Módulo de validação de dados
│   │   ├── language.js       # Módulo de seleção de idioma
│   │   ├── utils.js          # Módulo de funções utilitárias
│   │   ├── config.js         # Módulo de constantes de configuração
│   │   ├── version.js        # Módulo de gestão de versões
│   │   └── jquery.js         # Biblioteca jQuery
│   ├── css/
│   │   ├── main.css          # Estilos da página de configuração (inclui componentes comuns)
│   │   ├── popup.css         # Estilos do popup
│   │   ├── theme.css         # Estilos de tema
│   │   ├── tabs.css          # Estilos de abas
│   │   └── eye-button.css    # Estilos do botão mostrar senha
│   └── images/               # Recursos de imagem
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       └── logo-128.png
├── public/                   # Recursos públicos
│   └── img/                  # Imagens promocionais e de demonstração
├── tests/                    # Testes
│   ├── jest.config.js        # Configuração do Jest
│   ├── setup.js              # Configuração do ambiente de teste
│   ├── __mocks__/            # Arquivos Mock
│   │   └── chrome.js         # Mock da API Chrome
│   ├── unit/                 # Testes unitários
│   ├── integration/          # Testes de integração
│   └── e2e/                  # Testes de ponta a ponta
├── script/                   # Scripts de compilação
│   └── build.sh              # Script de compilação da extensão
├── release/                  # Notas de lançamento
│   └── *.md                  # Logs de atualização de versão
├── doc/                      # Diretório de documentação
├── build/                    # Diretório de saída de compilação
├── package.json              # Dependências do projeto
├── package-lock.json         # Bloqueio de versões de dependências
├── Makefile                  # Entrada de comandos de compilação
├── jest.config.js            # Configuração do Jest (aponta para tests/jest.config.js)
├── AGENTS.md                 # Guia de desenvolvimento
└── LICENSE                   # Licença MIT
```

## 4. 🚀 Início rápido

### 4.1 Instalação da extensão

#### 4.1.1 Chrome

**Método 1 (Recomendado)**: Instalar da loja oficial do Chrome
1. Abrir Chrome, visitar [Chrome Web Store](https://chrome.google.com/webstore)
2. Buscar "Assistente de Proxy"
3. Clicar em "Adicionar ao Chrome"

**Método 2**: Instalação local
- **Opção A (usar código fonte)**: Baixar código fonte, renomear `src/manifest_chrome.json` para `manifest.json`, then carregar o diretório `src`
- **Opção B (usar pacote)**:
  1. Ir para a página [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases)
  2. Baixar o arquivo `proxy-assistant-chrome-x.x.x.zip`
  3. Extrair o arquivo ZIP baixado em um diretório任意
  4. Abrir Chrome, visitar `chrome://extensions/`
  5. Ativar o **"Modo de desenvolvedor"** no canto superior direito
  6. Clicar no botão **"Carregar extensão desempacotada"** no canto superior esquerdo
  7. Selecionar a pasta extraída no passo 3
  8. A extensão aparecerá na lista de extensões após uma instalação bem-sucedida

#### 4.1.2 Firefox

**Método 1 (Recomendado)**: Instalar dos extras oficiais do Firefox
1. Abrir Firefox, visitar [Extras do Firefox](https://addons.mozilla.org/)
2. Buscar "Assistente de Proxy"
3. Clicar em "Adicionar ao Firefox"

**Método 2**: Instalação local
1. Baixar o pacote de instalação do Firefox (arquivo `.xpi`) do diretório `release`
2. Abrir Firefox, visitar `about:addons`
3. Clicar em **ícone de engrenagem** → **Instalar extra a partir do arquivo**
4. Selecionar o arquivo `.xpi` baixado

#### 4.1.3 Microsoft Edge

O navegador Edge é baseado no núcleo Chromium e pode instalar extensões Chrome diretamente.

**Método 1 (Recomendado)**: Instalar da Chrome Web Store
1. Abrir Edge, visitar `edge://extensions/`
2. Na seção "Encontrar novas extensões", clicar em "Obter extensões da Chrome Web Store", visitar [Chrome Web Store](https://chrome.google.com/webstore)
3. Buscar "Assistente de Proxy"
4. Clicar em "Obter" e depois "Adicionar ao Microsoft Edge"

**Método 2**: Instalação local
1. Ir para a página [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases)
2. Baixar o arquivo `proxy-assistant-chrome-x.x.x.zip`
3. Extrair o arquivo ZIP baixado em um diretório任意
4. Abrir Edge, visitar `edge://extensions/`
5. Ativar o **"Modo de desenvolvedor"** no canto inferior esquerdo
6. Clicar no botão **"Selecionar diretório desempacotado"**
7. Selecionar a pasta extraída no passo 3
8. A extensão aparecerá na lista de extensões após uma instalação bem-sucedida

### 4.2 Adicionar um proxy

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

### 4.3 Usar proxies

**Modo Manual**:
1. Selecionar **"Manual"** no popup
2. Selecionar o proxy da lista
3. O status "Conectado" indica que está ativo

**Modo Automático**:
1. Selecionar **"Automático"** no popup
2. Configurar regras URL para cada proxy na página de configurações
3. O proxy é selecionado automaticamente com base no site visitado

## 5. 🛠️ Guia de Desenvolvimento

### 5.1 Ambiente de desenvolvimento

**Pré-requisitos**:
- Node.js >= 14
- npm >= 6
- Navegador Chrome / Firefox (para testes)
- web-ext (para construir XPI do Firefox, opcional)

**Instalar dependências**:
```bash
make test_init
# ou
npm install
```

### 5.2 Comandos de teste

| Comando | Descrição |
|---------|-----------|
| `make test` | Executar todos os testes (unitário + integração + e2e) |
| `make test_nocache` | Executar testes sem cache |
| `make test_unit` | Executar apenas testes unitários |
| `make test_integration` | Executar apenas testes de integração |
| `make test_e2e` | Executar apenas testes e2e |
| `make test_clean` | Limpar cache de testes e arquivos de cobertura |

**Uso direto do npm**:
```bash
npm test                    # Executar todos os testes
npm run test:unit           # Executar apenas testes unitários
npm run test:integration    # Executar apenas testes de integração
npm run test:e2e            # Executar apenas testes e2e
npm run test:watch          # Executar testes em modo watch
npm run test:coverage       # Executar testes e gerar relatório de cobertura
```

### 5.3 Comandos de compilação

| Comando | Descrição |
|---------|-----------|
| `make build` | Construir extensões Chrome e Firefox |
| `make clean` | Limpar artefatos de compilação |
| `make test_clean` | Limpar cache de testes e arquivos de cobertura |

**Especificar versão**:
```bash
make build VERSION=dev
# ou
./script/build.sh dev
```

**Artefatos de compilação**:
```
build/
├── ProxyAssistant_{VERSION}_chrome.zip      # Pacote de instalação Chrome
├── ProxyAssistant_{VERSION}_chrome.tar.gz   # Pacote fonte Chrome
├── ProxyAssistant_{VERSION}_firefox.zip     # Pacote de instalação Firefox
├── ProxyAssistant_{VERSION}_firefox.tar.gz  # Pacote fonte Firefox
└── ProxyAssistant_{VERSION}_firefox.xpi     # Pacote de extensão oficial Firefox
```

### 5.4 Desenvolvimento local

**Instalação local Chrome**:
1. Renomear `src/manifest_chrome.json` para `manifest.json`
2. Abrir Chrome, visitar `chrome://extensions/`
3. Ativar **"Modo de desenvolvedor"**
4. Clicar em **"Carregar extensão desempacotada"**
5. Selecionar diretório `src`

**Instalação local Firefox**:
1. Usar `make build` para gerar arquivo XPI
2. Abrir Firefox, visitar `about:addons`
3. Clicar em **ícone de engrenagem** → **Instalar extra a partir do arquivo**
4. Selecionar o arquivo `.xpi` gerado

### 5.5 Estilo de código

- **Indentação**: 2 espaços
- **Aspas**: Aspas simples
- **Nomes**: camelCase, constantes usam UPPER_SNAKE_CASE
- **Ponto e vírgula**: Uso consistente

Para especificações detalhadas, consulte [AGENTS.md](../AGENTS.md)

## 6. 📖 Documentação detalhada

### 6.1 Sintaxe de regras de URL

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

### 6.2 Estratégia de fallback

No modo automático, quando a conexão do proxy falha:

| Estratégia | Descrição |
|------------|-----------|
| **Conexão direta (DIRECT)** | Ignorar proxy, conectar diretamente ao site de destino |
| **Rejeitar conexão (REJECT)** | Rejeitar a solicitação |

### 6.3 Modo automático com script PAC

O modo automático usa scripts PAC (Proxy Auto-Config):
- Selecionar automaticamente o proxy com base na URL atual
- Corresponder em ordem de lista de proxies, retornar o primeiro proxy correspondente
- Suporta estratégia de fallback
- Restaurar automaticamente a última configuração ao iniciar o navegador

### 6.4 Operações de atalho

| Operação | Método |
|----------|--------|
| Expandir/recolher cartão proxy | Clicar no cabeçalho do cartão |
| Expandir/recolher todos os cartões | Clicar no botão "Expandir/recolher tudo" |
| Reordenar proxy arrastando | Arrastar a alça no cabeçalho do cartão |
| Mostrar/esconder senha | Clicar no ícone de olho à direita do campo de senha |
| Habilitar/deshabilitar proxy individualmente | Toggle no cartão |
| Testar proxy individual | Clicar no botão "Testar conexão" |
| Testar todos os proxies | Clicar no botão "Testar tudo" |
| Fechar popup rapidamente | Pressionar a tecla `ESC` na página |

### 6.5 Configuração importar/exportar

1. **Exportar configuração**: Clicar em "Exportar configuração" para baixar arquivo JSON
2. **Importar configuração**: Clicar em "Importar configuração" e selecionar arquivo JSON para restaurar

A configuração inclui:
- Todas as informações do proxy
- Configurações de tema
- Período do modo noturno
- Configuração de idioma
- Estado do interruptor de sincronização

### 6.6 Detecção de estado do proxy

Clicar no botão "Detectar efeito do proxy" pode:
- Ver o modo atual do proxy do navegador
- Verificar se a extensão controlou com sucesso o proxy
- Detectar se outras extensões ocuparam o controle
- Obter diagnóstico e sugestões de problemas

## 7. 🔧 Arquitetura técnica

### 7.1 Manifest V3

- Chrome usa especificação Manifest V3
- Service Worker substitui páginas de segundo plano
- Firefox usa background scripts + onRequest API
- Suporta armazenamento de sincronização nativa do navegador e sincronização GitHub Gist

### 7.2 Módulos principais

| Módulo | Arquivo | Descrição |
|--------|---------|-----------|
| **Principal** | main.js | Lógica da página de configurações, gestão de cenários, proxy CRUD, ordenação por arrastar, import/export, detecção de proxy |
| **Popup** | popup.js | Interação com interface do popup, exibição de estado do proxy, alternância rápida de proxy, exibição de correspondência automática |
| **Fundo** | worker.js | Gestão de configuração do proxy, geração de script PAC, tratamento de autenticação, teste de proxy, atualização automática de assinatura, monitoramento de mudanças de armazenamento |
| **Armazenamento** | storage.js | Gestão de armazenamento local/nuvem, sincronização fragmentada, validação de dados, import/export de configuração |
| **i18n** | i18n.js | Suporte a múltiplos idiomas, mudança em tempo real, carregamento dinâmico de traduções |
| **Tema** | theme.js | Mudança de tema claro/escuro, mudança automática baseada no horário |
| **Cenários** | scenarios.js | Suporte multi-cenário, mudança de cenário, renomear/excluir/ordenar cenários |
| **Sincronização** | sync.js | Sincronização nativa do navegador, sincronização GitHub Gist |
| **Assinatura** | subscription.js | Análise de assinatura proxy (AutoProxy/SwitchyLegacy/SwitchyOmega/PAC), atualização automática |
| **Proxy** | proxy.js | Renderização de lista de proxies, edição, teste, ordenação por arrastar |
| **Detecção** | detection.js | Detecção de estado do proxy, detecção de controle de extensão, detecção de conflitos |
| **Validação** | validator.js | Validação de formato IP/domínio/porta/regra |
| **Utilitários** | utils.js | Funções utilitárias comuns, auxiliares de operações DOM |
| **Idioma** | language.js | Tratamento de interação de menu suspenso de idioma |
| **Configuração** | config.js | Constantes de configuração padrão, gestão de configuração do sistema |

### 7.3 Armazenamento de dados

- `chrome.storage.local`: Armazenamento local (sempre usado)
- `chrome.storage.sync`: Armazenamento de sincronização em nuvem (opcional)
- `chrome.storage.session`: Armazenamento de sessão (informações de autenticação, cache de estado)
- Princípio local first, resolve problema de cota de sincronização
- Armazenamento fragmentado (7KB por fragmento) contorna limite de cota de 8KB

### 7.4 Versão do formato de configuração

| Versão | Descrição |
|--------|-----------|
| v1 | Formato inicial |
| v2 | Adicionado suporte a cenários |
| v3 | Adicionado suporte a assinatura |
| v4 | Estado de desativação de proxy unificado, uso de IDs únicos, inversão de regras de assinatura |

### 7.5 Compatibilidade de navegador

| Função | Chrome | Firefox |
|--------|--------|---------|
| Modo Manual | ✅ | ✅ |
| Modo Automático | ✅ | ✅ |
| Autenticação proxy | ✅ | ✅ |
| Teste proxy | ✅ | ✅ |
| Alternância de tema | ✅ | ✅ |
| Sincronização de dados | ✅ | ✅ |
| Detecção proxy | ✅ | ✅ |
| Assinatura | ✅ | ✅ |

### 7.6 Tecnologias principais de implementação

- **JavaScript nativo + jQuery**: Sem dependência de framework, leve
- **Manifest V3**: Chrome usa Service Worker, Firefox usa background scripts
- **Script PAC**: Script de configuração automática de proxy gerado dinamicamente no modo automático
- **Autenticação proxy**: Usa API `webRequestAuthProvider` para manipular solicitações de autenticação
- **Sincronização fragmentada**: Algoritmo de fragmentação personalizado para resolver limites de cota do Chrome storage.sync
- **Análise de assinatura**: Suporta análise e conversão automáticas de múltiplos formatos de assinatura

## 8. 📝 Casos de uso

### 8.1 Cenário 1: Alternância entre múltiplos proxies

- Configurar diferentes proxies para diferentes ambientes de rede
- Usar proxy da empresa para rede do escritório
- Usar proxy científico para rede doméstica
- Alternância rápida com um clique

### 8.2 Cenário 2: Roteamento inteligente

- Sites nacionais conexão direta
- Sites específicos através de proxy
- Seleção automática com base no domínio

### 8.3 Cenário 3: Teste de pool de proxies

- Importar múltiplos proxies
- Testar latência em lote
- Selecionar proxy ideal para usar

### 8.4 Cenário 4: Compartilhamento em equipe

- Exportar arquivo de configuração
- Compartilhar com membros da equipe
- Configuração de proxy unificada

## 9. ⚠️ Observações importantes

1. **Descrição de permissões**: A extensão requer as seguintes permissões:
   - `proxy`: Gerenciar configurações de proxy
   - `storage`: Armazenar configurações
   - `webRequest` / `webRequestAuthProvider`: Manipular solicitações de autenticação
   - `<all_urls>`: Acessar todas as URLs de sites

2. **Conflitos com outras extensões**: Se houver conflitos de proxy, desativar outras extensões proxy/VPN

3. **Segurança**: As credenciais são armazenadas localmente no navegador, por favor garantir a segurança do dispositivo

4. **Requisitos de rede**: Garantir que o servidor proxy esteja acessível normalmente

5. **Restrição de Firefox**: A versão mínima do Firefox necessária é 142.0

## 10. 📄 Política de Privacidade

[Política de Privacidade](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 11. 📄 Licença

MIT License - Ver arquivo [LICENSE](../LICENSE) para detalhes

## 12. 🤝 Contribuição

Relatórios de issues e pull requests são bem-vindos!

## 13. 📧 Contato

Para perguntas ou sugestões, por favor enviar comentários através do GitHub Issues.

---

<div align="center">

**Se este projeto foi útil para você, considere dar um Star ⭐ para apoiar!**

</div>
