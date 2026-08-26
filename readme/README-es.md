<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" alt="Asistente de Proxy">

# Asistente de Proxy

[![Extensión de Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk)
[![Extensión de Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingüe](https://img.shields.io/badge/Multilingüe-yellow)](README-es.md)

Gestor de proxy para Chrome, Firefox y Edge

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [**Español**](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

Asistente de Proxy administra proxies HTTP, HTTPS, SOCKS4 y SOCKS5 dentro del navegador. Ofrece los modos desactivado, manual y automático, y reúne nodos, escenarios, reglas de enrutamiento, suscripciones, sincronización y diagnóstico en una sola página de ajustes.

Chrome, Firefox y Edge usan Manifest V3. Edge utiliza el mismo paquete Chromium que Chrome. El proyecto está desarrollado con JavaScript nativo, jQuery y las API de extensiones del navegador.

![Ajustes](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260826132015/assets/screenshots/main/settings.png)

## Funciones

### Nodos proxy y modos de funcionamiento

- Administrar nodos HTTP, HTTPS, SOCKS4 y SOCKS5.
- Configurar dirección, puerto, nombre de usuario, contraseña, color y estado activo.
- Cambiar entre los modos desactivado, manual y automático desde la ventana de la extensión.
- Usar el nodo seleccionado y definir direcciones de exclusión en modo manual.
- Generar un script PAC desde las direcciones proxy de cada nodo en modo automático, con conexión directa o rechazo como alternativa.
- Probar un nodo o todos los nodos y mostrar latencia o fallo.

### Escenarios proxy

- Guardar los nodos de distintos entornos de red en escenarios separados.
- Cambiar el escenario actual desde los ajustes o la ventana de la extensión.
- Añadir, renombrar, eliminar y ordenar escenarios, y mover nodos entre ellos.
- Definir un proxy predeterminado y activación automática por día y franja horaria.

### Suscripciones de reglas

- Gestionar de forma centralizada suscripciones compartidas por varios nodos.
- Admitir AutoProxy, Switchy Legacy, Switchy Omega y PAC.
- Ver contenido original, resultado analizado, reglas proxy y reglas directas.
- Invertir reglas y actualizar manualmente o cada 1 minuto, 6 horas, 12 horas, 1 día o 5 días.
- Ejecutar las actualizaciones de suscripciones en segundo plano.

### Configuración, sincronización y diagnóstico

- Importar y exportar JSON, con opción de incluir suscripciones y caché.
- Enviar o descargar configuración entre dispositivos mediante la sincronización nativa del navegador.
- Enviar o descargar configuración mediante GitHub Gist, con sincronización programada.
- Dividir la sincronización nativa en bloques de 7 KB y mostrar el uso de cuota.
- Comprobar control del proxy, estado PAC y posibles conflictos con otras extensiones.
- Filtrar, actualizar, copiar y borrar registros de ejecución por nivel.

### Ajustes de interfaz

- Usar temas claro, oscuro o cambio automático por horario.
- Editar colores de un tema personalizado mediante JSON.
- Usar chino simplificado, chino tradicional, inglés, japonés, francés, alemán, español, portugués, ruso o coreano.
> Los campos de autenticación SOCKS5 están desactivados porque la API de proxy de Chrome no admite nombre de usuario y contraseña para SOCKS5.

![Tema claro](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260826132015/assets/screenshots/main/theme-light.png)

![Tema oscuro](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260826132015/assets/screenshots/main/theme-dark.png)

## Instalación

### Instalar desde un paquete publicado

Los usuarios normales pueden instalar directamente desde una tienda de extensiones:

- [Chrome Web Store](https://chromewebstore.google.com/detail/%E4%BB%A3%E7%90%86%E5%8A%A9%E6%89%8B/mfemgikpcpndehimgkjghpcofjcgdhdk), para Chrome y Edge cuando se permiten extensiones de Chrome.
- [Firefox Add-ons](https://addons.mozilla.org/zh-CN/firefox/addon/proxyassistant), para Firefox.

También puedes descargar el paquete correspondiente desde [GitHub Releases](https://github.com/bugwz/ProxyAssistant/releases):

- Chrome, Edge y otros navegadores Chromium usan `ProxyAssistant_<versión>_chrome.zip`.
- Las compilaciones de Firefox incluyen `ProxyAssistant_<versión>_firefox.zip` y `ProxyAssistant_<versión>_firefox.xpi`.

Para Chrome o Edge, descomprime el ZIP, activa el modo de desarrollador en la página de extensiones y carga la carpeta. El proceso de publicación genera el XPI de Firefox como artefacto de compilación; su instalación directa depende de la política de firma de Firefox. Por ello, los usuarios normales deberían preferir Firefox Add-ons.

### Compilar desde el código fuente

El repositorio mantiene Manifest separados para Chrome y Firefox. Se recomienda generar primero la carpeta o el paquete del navegador correspondiente para no editar directamente `src/manifest.json`.

```bash
npm ci
make build VERSION=dev
```

Para Chrome o Edge, descomprime `build/ProxyAssistant_dev_chrome.zip`. Para desarrollar en Firefox, descomprime su ZIP, abre `about:debugging`, elige “Este Firefox” y “Cargar complemento temporal”, y selecciona `manifest.json`. La generación del XPI requiere `web-ext`. Sin `web-ext` se siguen generando los archivos ZIP y TAR.GZ de Firefox, pero se omite el XPI.

## Uso básico

1. Abre Asistente de Proxy desde la barra del navegador.
2. Añade un nodo con protocolo, dirección y puerto en los ajustes.
3. Añade credenciales y reglas cuando sea necesario.
4. Elige el modo desactivado, manual o automático.
5. Selecciona un nodo en modo manual o deja que el script PAC enrute las solicitudes en modo automático.

Configuraciones habituales:

- Usar siempre un proxy: selecciona el modo manual y el nodo deseado.
- Usar proxy en sitios concretos: añádelos a las direcciones que usan proxy y selecciona el modo automático.
- Mantener sitios concretos con conexión directa: añádelos a las exclusiones o usa reglas directas de una suscripción.
- Separar oficina, casa y otros entornos: crea escenarios distintos y cámbialos desde la ventana.

## Datos y permisos

La extensión solicita estos permisos:

| Permission | Uso |
| --- | --- |
| `proxy` | Leer y cambiar la configuración proxy del navegador |
| `storage` | Guardar configuración local y usar la sincronización nativa |
| `webRequest`, `webRequestAuthProvider` | Responder a solicitudes de autenticación del proxy |
| `alarms` | Programar suscripciones, escenarios y sincronización |
| `<all_urls>` | Generar reglas para solicitudes web y leer el sitio actual |


La configuración se guarda de forma predeterminada en `chrome.storage.local`. Los nombres de usuario y contraseñas de proxy forman parte de la configuración y se incluyen en los archivos exportados y en los datos que se envían mediante sincronización. El token de GitHub y el ID de Gist se excluyen. Protege los archivos exportados y revisa tus requisitos de seguridad antes de activar la sincronización.

Al descargar datos remotos se sustituye la configuración funcional local, pero se conservan las credenciales y la programación de sincronización locales. Exporta una copia de seguridad cuando sea necesario.

[Política de privacidad](https://sites.google.com/view/proxy-assistant/privacy-policy)

## Desarrollo

### Requisitos

- Node.js 20, igual que GitHub Actions
- npm
- Chrome, Firefox o Edge para pruebas en el navegador
- `web-ext`, solo para generar el XPI de Firefox

Instalar dependencias:

```bash
npm ci
```

### Pruebas

```bash
npm test                    # Todas las pruebas Jest
npm run test:unit           # Pruebas unitarias
npm run test:integration    # Pruebas de integración
npm run test:e2e            # Pruebas de extremo a extremo
npm run test:watch          # Modo de observación
npm run test:coverage       # Pruebas de cobertura
```

Entradas disponibles del Makefile:

```bash
make test
make test_unit
make test_integration
make test_e2e
make test_nocache
```

### Compilación

```bash
make build VERSION=dev
```

El script limpia `build/`, selecciona el Manifest de cada navegador y genera:

```text
build/
├── ProxyAssistant_dev_chrome.zip
├── ProxyAssistant_dev_chrome.tar.gz
├── ProxyAssistant_dev_firefox.zip
├── ProxyAssistant_dev_firefox.tar.gz
└── ProxyAssistant_dev_firefox.xpi
```

El último archivo no se genera sin `web-ext`.

### Estructura del proyecto

```text
ProxyAssistant/
├── src/
│   ├── _locales/             # Recursos de idioma del navegador
│   ├── css/                  # Estilos de ajustes y ventana
│   ├── images/               # Iconos de la extensión
│   ├── js/                   # Lógica de páginas, proxy, almacenamiento, sincronización y fondo
│   ├── main.html             # Página de ajustes
│   ├── popup.html            # Ventana de la extensión
│   ├── manifest_chrome.json  # Chrome Manifest V3
│   └── manifest_firefox.json # Firefox Manifest V3
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── script/build.sh           # Script de empaquetado de Chrome y Firefox
├── readme/                   # README en otros idiomas
├── release/                  # Notas de cada publicación
├── Makefile
└── package.json
```

Módulos principales:

| Archivo | Responsabilidad |
| --- | --- |
| `src/js/worker.js` | Aplicar proxy, generar PAC, autenticación, tareas y mensajes |
| `src/js/main.js` | Inicializar ajustes y coordinar módulos |
| `src/js/popup.js` | Cambiar modos, escenarios y nodos en la ventana |
| `src/js/proxy.js` | Formularios, listas y pruebas de nodos |
| `src/js/scenarios.js` | Escenarios y reglas horarias |
| `src/js/subscription.js` | Gestión, análisis y programación de suscripciones |
| `src/js/config.js` | Formato, migración, importación y exportación |
| `src/js/storage.js` | Caché local y persistencia |
| `src/js/sync.js` | Sincronización nativa y GitHub Gist |
| `src/js/detection.js` | Diagnóstico del control proxy y PAC |

Consulta [AGENTS.md](../AGENTS.md) para las reglas de código y pruebas.

## Notas sobre navegadores

- Chrome usa un Service Worker Manifest V3.
- Firefox usa un background script Manifest V3; el Manifest actual requiere Firefox 142 o posterior.
- Edge usa el paquete de Chrome, desde Chrome Web Store o como carpeta descomprimida. Los Manifest dedicados y objetivos automatizados siguen siendo Chrome y Firefox.
- Varias extensiones proxy o VPN activas pueden competir por el control; usa la página de estado para diagnosticar.

## Comentarios y contribuciones

Informa de problemas y sugerencias en [GitHub Issues](https://github.com/bugwz/ProxyAssistant/issues). Ejecuta las pruebas relacionadas y verifica el proxy en Chrome, Firefox y Edge cuando sea posible.

## Licencia

Este proyecto usa la [licencia MIT](../LICENSE).
