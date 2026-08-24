<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="Assistente de Proxy">

# Assistente de Proxy

[![Extensão Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Extensão Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilíngue](https://img.shields.io/badge/Multilíngue-yellow)](README-pt.md)

Gestor de proxy para Chrome, Firefox e Edge

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [Español](README-es.md) | [**Português**](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

O Assistente de Proxy gere proxies HTTP, HTTPS, SOCKS4 e SOCKS5 dentro do navegador. Disponibiliza os modos desativado, manual e automático e reúne nós, cenários, regras de encaminhamento, subscrições, sincronização e diagnóstico numa única página de definições.

Chrome, Firefox e Edge utilizam Manifest V3. O Edge usa o mesmo pacote Chromium do Chrome. O projeto utiliza JavaScript nativo, jQuery e as APIs de extensões do navegador.

![Definições](../public/img/demo.png)

## Funcionalidades

### Nós proxy e modos de funcionamento

- Gerir nós HTTP, HTTPS, SOCKS4 e SOCKS5.
- Configurar endereço, porta, nome de utilizador, palavra-passe, cor e estado ativo.
- Alternar entre os modos desativado, manual e automático na janela da extensão.
- Usar o nó selecionado e definir endereços de exclusão no modo manual.
- Gerar um script PAC a partir dos endereços proxy de cada nó no modo automático, com ligação direta ou rejeição como alternativa.
- Testar um nó ou todos os nós e mostrar latência ou falha.

### Cenários proxy

- Guardar nós de diferentes ambientes de rede em cenários separados.
- Alterar o cenário atual nas definições ou na janela da extensão.
- Adicionar, renomear, eliminar e ordenar cenários e mover nós entre eles.
- Definir um proxy predefinido e ativação automática por dia e período horário.

### Subscrições de regras

- Gerir centralmente subscrições partilhadas por vários nós.
- Suportar AutoProxy, Switchy Legacy, Switchy Omega e PAC.
- Ver conteúdo original, resultado analisado, regras proxy e regras diretas.
- Inverter regras e atualizar manualmente ou a cada 1 minuto, 6 horas, 12 horas, 1 dia ou 5 dias.
- Executar atualizações de subscrições em segundo plano.

### Configuração, sincronização e diagnóstico

- Importar e exportar JSON, podendo incluir subscrições e cache.
- Enviar ou obter configuração entre dispositivos pela sincronização nativa do navegador.
- Enviar ou obter configuração pelo GitHub Gist, com sincronização agendada.
- Dividir a sincronização nativa em blocos de 7 KB e mostrar a utilização da quota.
- Verificar controlo do proxy, estado PAC e possíveis conflitos com outras extensões.
- Filtrar, atualizar, copiar e limpar registos de execução por nível.

### Definições da interface

- Usar temas claro, escuro ou mudança automática por horário.
- Editar cores de um tema personalizado através de JSON.
- Usar chinês simplificado, chinês tradicional, inglês, japonês, francês, alemão, espanhol, português, russo ou coreano.
> Os campos de autenticação SOCKS5 estão desativados porque a API de proxy do Chrome não suporta nome de utilizador e palavra-passe em SOCKS5.

![Tema claro](../public/img/demo-light.png)

![Tema escuro](../public/img/demo-night.png)

## Instalação

### Instalar a partir de um pacote publicado

Os utilizadores comuns podem instalar diretamente a partir de uma loja de extensões:

- [Chrome Web Store](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk), para Chrome e Edge quando extensões do Chrome são permitidas.
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant), para Firefox.

Também pode descarregar o pacote correspondente em [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases):

- Chrome, Edge e outros navegadores Chromium usam `ProxyAssistant_<versão>_chrome.zip`.
- As compilações Firefox incluem `ProxyAssistant_<versão>_firefox.zip` e `ProxyAssistant_<versão>_firefox.xpi`.

Para Chrome ou Edge, extraia o ZIP, ative o modo de programador na página de extensões e carregue a pasta. O processo de publicação gera o XPI do Firefox como artefacto de compilação; a instalação direta depende da política de assinatura do Firefox. Por isso, utilizadores comuns devem preferir Firefox Add-ons.

### Compilar a partir do código-fonte

O repositório mantém Manifest separados para Chrome e Firefox. Recomenda-se gerar primeiro a pasta ou o pacote do navegador correspondente para evitar editar diretamente `src/manifest.json`.

```bash
npm ci
make build VERSION=dev
```

Para Chrome ou Edge, extraia `build/ProxyAssistant_dev_chrome.zip`. Para desenvolver no Firefox, extraia o ZIP, abra `about:debugging`, escolha “Este Firefox” e “Carregar suplemento temporário” e selecione `manifest.json`. A criação do XPI requer `web-ext`. Sem `web-ext`, os ficheiros ZIP e TAR.GZ do Firefox continuam a ser gerados, mas o XPI é ignorado.

## Utilização básica

1. Abra o Assistente de Proxy na barra do navegador.
2. Adicione um nó com protocolo, endereço e porta nas definições.
3. Adicione credenciais e regras quando necessário.
4. Escolha o modo desativado, manual ou automático.
5. Selecione um nó no modo manual ou permita que o script PAC encaminhe os pedidos no modo automático.

Configurações comuns:

- Usar sempre um proxy: escolha o modo manual e o nó pretendido.
- Usar proxy em sites específicos: adicione-os aos endereços com proxy e escolha o modo automático.
- Manter sites específicos em ligação direta: adicione-os às exclusões ou use regras diretas de uma subscrição.
- Separar escritório, casa e outros ambientes: crie cenários e alterne-os na janela.

## Dados e permissões

A extensão solicita estas permissões:

| Permission | Finalidade |
| --- | --- |
| `proxy` | Ler e alterar as definições proxy do navegador |
| `storage` | Guardar configuração local e usar sincronização nativa |
| `webRequest`, `webRequestAuthProvider` | Responder a pedidos de autenticação do proxy |
| `alarms` | Agendar subscrições, cenários e sincronização |
| `<all_urls>` | Gerar regras para pedidos Web e ler o site atual |


A configuração é guardada por predefinição em `chrome.storage.local`. Os nomes de utilizador e palavras-passe dos proxies fazem parte da configuração e são incluídos nos ficheiros exportados e nos dados enviados pela sincronização. O token GitHub e o ID do Gist são excluídos. Proteja os ficheiros exportados e confirme os requisitos de segurança antes de ativar a sincronização.

Ao obter dados remotos, a configuração funcional local é substituída, mas as credenciais e os horários locais de sincronização são preservados. Exporte uma cópia de segurança quando necessário.

[Política de privacidade](https://sites.google.com/view/proxy-assistant/privacy-policy)

## Desenvolvimento

### Requisitos

- Node.js 20, como no GitHub Actions
- npm
- Chrome, Firefox ou Edge para testes no navegador
- `web-ext`, apenas para gerar o XPI do Firefox

Instalar dependências:

```bash
npm ci
```

### Testes

```bash
npm test                    # Todos os testes Jest
npm run test:unit           # Testes unitários
npm run test:integration    # Testes de integração
npm run test:e2e            # Testes de ponta a ponta
npm run test:watch          # Modo de observação
npm run test:coverage       # Testes de cobertura
```

Entradas Makefile disponíveis:

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### Compilação

```bash
make build VERSION=dev
```

O script limpa `build/`, seleciona o Manifest de cada navegador e gera:

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

O último ficheiro não é gerado sem `web-ext`.

### Estrutura do projeto

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # Recursos de idioma do navegador
│   ├── css/                  # Estilos das definições e janela
│   ├── images/               # Ícones da extensão
│   ├── js/                   # Lógica de páginas, proxy, armazenamento, sincronização e fundo
│   ├── main.html             # Página de definições
│   ├── popup.html            # Janela da extensão
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Script de empacotamento Chrome e Firefox
├── public/img/               # Imagens do README e lojas
├── readme/                   # README noutros idiomas
├── release/                  # Notas de cada publicação
├── Makefile
└── package.json
```

Módulos principais:

| Ficheiro | Responsabilidade |
| --- | --- |
| `src/js/worker.js` | Aplicar proxy, gerar PAC, autenticação, tarefas e mensagens |
| `src/js/main.js` | Inicializar definições e coordenar módulos |
| `src/js/popup.js` | Alterar modos, cenários e nós na janela |
| `src/js/proxy.js` | Formulários, listas e testes de nós |
| `src/js/scenarios.js` | Cenários e regras horárias |
| `src/js/subscription.js` | Gestão, análise e agendamento de subscrições |
| `src/js/config.js` | Formato, migração, importação e exportação |
| `src/js/storage.js` | Cache local e persistência |
| `src/js/sync.js` | Sincronização nativa e GitHub Gist |
| `src/js/detection.js` | Diagnóstico do controlo proxy e PAC |

Consulte [AGENTS.md](../AGENTS.md) para regras de código e testes.

## Notas sobre navegadores

- O Chrome usa um Service Worker Manifest V3.
- O Firefox usa um background script Manifest V3; o Manifest atual requer Firefox 142 ou posterior.
- O Edge usa o pacote do Chrome, pela Chrome Web Store ou pasta descomprimida. Os Manifest dedicados e alvos automatizados continuam a ser Chrome e Firefox.
- Várias extensões proxy ou VPN ativas podem competir pelo controlo; use a página de estado para diagnóstico.

## Comentários e contribuições

Comunique problemas e sugestões em [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues). Execute os testes relevantes e valide o proxy em Chrome, Firefox e Edge quando possível.

## Licença

Este projeto usa a [licença MIT](../LICENSE).
