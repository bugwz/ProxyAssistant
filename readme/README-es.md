<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Asistente de Proxy

</div>

<div align="center">

[![Extensión de Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Extensión de Firefox](https://img.shields.io/badge/Firefox-Extension-orange?logo=firefox)](https://addons.mozilla.org/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingüe](https://img.shields.io/badge/Multilingüe-yellow)](README-es.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [**Español**](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

Una potente extensión de gestión de proxy para navegador que soporta Chrome y Firefox, facilitando la configuración y conmutación de proxies de red.

</div>

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/store/promotional/marquee-1632x656.jpeg)

## ✨ Características

### 🔌 Soporte de múltiples protocolos proxy
- **HTTP** - Proxy HTTP tradicional
- **HTTPS** - Proxy HTTPS seguro
- **SOCKS5** - Proxy SOCKS5 con soporte TCP/UDP
- **SOCKS4** - Compatibilidad con proxy SOCKS4 heredado

### 🌐 Soporte multi-navegador
- **Chrome** - Usando Manifest V3 + Service Worker
- **Firefox** - Usando onRequest API para interceptación de proxy

### 🔄 Tres modos de proxy

| Modo | Descripción |
|------|-------------|
| **Desactivar** | Desactivar proxy, usar conexión de red predeterminada del sistema |
| **Manual** | Seleccionar manualmente un proxy de la lista |
| **Automático** | Seleccionar automáticamente el proxy correspondiente según reglas de URL (modo PAC) |

| ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/popup/disabled.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/popup/manual.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/popup/auto.png) |
|:---:|:---:|:---:|
| Modo Desactivado | Modo Manual | Modo Automático |

### 📋 Configuración flexible de reglas URL

- **Direcciones que omiten el proxy** (`bypass_urls`): Dominios/IPs de conexión directa en modo manual
- **Direcciones que usan el proxy** (`include_urls`): Dominios que requieren acceso proxy en modo automático
- **Estrategia de fallback**: En modo automático, elegir conexión directa o rechazo cuando falla la conexión
- Soporta comodín `*` y coincidencia de dominio
- Ideal para escenarios donde diferentes sitios web usan diferentes proxies

### 🔐 Soporte de autenticación proxy

- Autenticación con nombre de usuario/contraseña
- Manejo automático de solicitudes de autenticación del servidor proxy
- Almacenamiento seguro de credenciales

### 🧪 Funciones de prueba de proxy

- **Prueba de conexión**: Verificar disponibilidad del proxy
- **Medición de latencia**: Probar tiempo de respuesta del proxy
- **Prueba en lote**: Probar todos los proxies con un clic
- **Indicadores de color**: Verde(<500ms) / Naranja(≥500ms) / Rojo(Fallido)

### 🏃 Detección de estado del proxy

- Detectar la configuración actual del proxy del navegador
- Verificar si la extensión controló exitosamente el proxy
- Identificar otras extensiones que controlan el proxy
- Proporcionar tres resultados: estado, advertencia, error

### 🌙 Modos de tema

- **Modo Claro**: Para uso diurno
- **Modo Oscuro**: Para uso nocturno
- **Cambio automático**: Cambiar tema automáticamente según la hora (horario configurable)

| ![Modo Claro](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/main/theme-light.png) | ![Modo Oscuro](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/main/theme-dark.png) |
|:---:|:---:|
| Modo Claro | Modo Oscuro |

### ☁️ Almacenamiento y sincronización de datos

- **Almacenamiento local primero**: La configuración del proxy siempre se guarda en almacenamiento local
- **Sincronización en la nube**: Opcionalmente habilitar sincronización con cuenta Chrome/Firefox
- **Fusión inteligente**: Fusionar automáticamente datos locales y remotos cuando hay anomalías en la sincronización
- **Importar/Exportar**: Soporte de respaldo y restauración de configuración en formato JSON

### 🌍 Soporte multilingüe

Esta extensión soporta los siguientes idiomas:

| Idioma | Código | Estado |
|--------|--------|--------|
| 简体中文 | zh-CN | ✅ Soportado |
| 繁體中文 | zh-TW | ✅ Soportado |
| English | en | ✅ Soportado |
| 日本語 | ja | ✅ Soportado |
| Français | fr | ✅ Soportado |
| Deutsch | de | ✅ Soportado |
| Español | es | ✅ Soportado |
| Português | pt | ✅ Soportado |
| Русский | ru | ✅ Soportado |
| 한국어 | ko | ✅ Soportado |

## 📷 Interfaz de configuración

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260115234633/assets/screenshots/main/settings.png)

## 📁 Estructura del proyecto

```
ProxyAssistant/
├── readme/                    # Documentación multilingüe
│   ├── README-zh-CN.md       # Chino simplificado
│   ├── README-zh-TW.md       # Chino tradicional
│   ├── README-en.md          # Inglés
│   └── ...
├── src/                       # Código fuente
│   ├── manifest_chrome.json  # Configuración extensión Chrome
│   ├── manifest_firefox.json # Configuración extensión Firefox
│   ├── main.html             # Página de configuración
│   ├── popup.html            # Página emergente
│   ├── js/
│   │   ├── worker.js         # Servicio en segundo plano (Chrome: Service Worker)
│   │   ├── popup.js          # Lógica principal del popup
│   │   ├── main.js           # Lógica principal de página de configuración
│   │   ├── i18n.js           # Soporte de internacionalización
│   │   └── jquery.js         # Biblioteca jQuery
│   ├── css/
│   │   ├── main.css          # Estilos de página de configuración
│   │   ├── popup.css         # Estilos del popup
│   │   ├── theme.css         # Estilos de tema
│   │   ├── switch.css        # Estilos de componente interruptor
│   │   ├── delete-button.css # Estilos de botón eliminar
│   │   └── eye-button.css    # Estilos de botón mostrar contraseña
│   └── images/               # Recursos de imágenes
│       ├── icon-16.png
│       ├── icon-32.png
│       ├── icon-48.png
│       ├── icon-128.png
│       ├── logo-128.png
│       └── promotion/        # Imágenes promocionales
└── public/                   # Recursos públicos
```

## 🚀 Inicio rápido

### Instalación de la extensión

**Chrome:**

Método 1 (Recomendado): Instalar desde la tienda oficial de Chrome
1. Abrir Chrome, visitar [Chrome Web Store](https://chrome.google.com/webstore)
2. Buscar "Asistente de Proxy"
3. Click en "Añadir a Chrome"

Método 2: Instalación local
- **Opción A (usar código fuente)**: Descargar código fuente, renombrar `src/manifest_chrome.json` a `manifest.json`, luego cargar el directorio `src`
- **Opción B (usar paquete)**: Descargar el paquete de instalación de Chrome (archivo `.zip`) del directorio `release`, descomprimir y cargar el directorio correspondiente

**Firefox:**

Método 1 (Recomendado): Instalar desde complementos oficiales de Firefox
1. Abrir Firefox, visitar [Complementos de Firefox](https://addons.mozilla.org/)
2. Buscar "Asistente de Proxy"
3. Click en "Añadir a Firefox"

Método 2: Instalación local
1. Descargar el paquete de instalación de Firefox (archivo `.xpi`) del directorio `release`
2. Abrir Firefox, visitar `about:addons`
3. Click en **ícono de engranaje** → **Instalar complemento desde archivo**
4. Seleccionar el archivo `.xpi` descargado

### Añadir un proxy

1. Click en el icono de la extensión para abrir el popup
2. Click en el botón **"Configuración"** para abrir la página de configuración
3. Click en el botón **"Nuevo proxy"** para añadir un nuevo proxy
4. Rellenar la información del proxy:
   - Nombre del proxy
   - Tipo de protocolo (HTTP/HTTPS/SOCKS4/SOCKS5)
   - Dirección del proxy (IP o dominio)
   - Puerto
   - (Opcional) Nombre de usuario y contraseña
   - (Opcional) Configuración de reglas URL
5. Click en el botón **"Guardar"**

### Usar proxies

**Modo Manual**:
1. Seleccionar **"Manual"** en el popup
2. Seleccionar el proxy de la lista
3. El estado "Conectado" indica que está activo

**Modo Automático**:
1. Seleccionar **"Automático"** en el popup
2. Configurar reglas URL para cada proxy en la página de configuración
3. El proxy se selecciona automáticamente según el sitio web visitado

## 📖 Documentación detallada

### Sintaxis de reglas URL

Soporta las siguientes reglas de coincidencia:

```
# Coincidencia exacta
google.com

# Coincidencia de subdominio
.google.com
www.google.com

# Coincidencia con comodín
*.google.com
*.twitter.com

# Dirección IP
192.168.1.1
10.0.0.0/8
```

### Estrategia de fallback

En modo automático, cuando la conexión del proxy falla:

| Estrategia | Descripción |
|------------|-------------|
| **Conexión directa (DIRECT)** | Omitir proxy, conectar directamente al sitio de destino |
| **Rechazar conexión (REJECT)** | Rechazar la solicitud |

### Modo automático con script PAC

El modo automático usa scripts PAC (Proxy Auto-Config):
- Seleccionar automáticamente el proxy según la URL actual
- Coincidir en orden de lista de proxies, devolver el primer proxy coincidente
- Soporta estrategia de fallback
- Restaurar automáticamente la última configuración al iniciar el navegador

### Atajos de operación

| Operación | Método |
|-----------|--------|
| Expandir/colapsar tarjeta proxy | Click en el encabezado de la tarjeta |
| Expandir/colapsar todas las tarjetas | Click en botón "Expandir/colapsar todo" |
| Reordenar proxy arrastrando | Arrastrar el mango en el encabezado de la tarjeta |
| Mostrar/ocultar contraseña | Click en el icono de ojo a la derecha del campo de contraseña |
| Habilitar/deshabilitar proxy individualmente | Toggle en la tarjeta |
| Probar proxy individual | Click en botón "Probar conexión" |
| Probar todos los proxies | Click en botón "Probar todo" |

### Importar/exportar configuración

1. **Exportar configuración**: Click en "Exportar configuración" para descargar archivo JSON
2. **Importar configuración**: Click en "Importar configuración" y seleccionar archivo JSON para restaurar

La configuración incluye:
- Toda la información del proxy
- Configuraciones de tema
- Horario de modo nocturno
- Configuración de idioma
- Estado de sincronización

### Detección de estado del proxy

Click en el botón "Detectar estado del proxy" puede:
- Ver el modo actual del proxy del navegador
- Verificar si la extensión controló exitosamente el proxy
- Detectar si otras extensiones ocuparon el control
- Obtener diagnóstico y sugerencias de problemas

## 🔧 Arquitectura técnica

### Manifest V3

- Chrome usa especificación Manifest V3
- Service Worker代替 páginas de fondo
- Firefox usa background scripts + onRequest API

### Módulos principales

1. **worker.js (Chrome)**:
   - Gestión de configuración de proxy
   - Generación de script PAC
   - Manejo de autenticación
   - Lógica de prueba de proxy
   - Escucha de cambios de almacenamiento

2. **popup.js**:
   - Interacción con interfaz del popup
   - Visualización de estado del proxy
   - Cambio rápido de proxy
   - Visualización de coincidencia automática

3. **main.js**:
   - Lógica de página de configuración
   - Gestión de proxies (CRUD)
   - Ordenación arrastrando
   - Importar/Exportar
   - Función de detección de proxy

4. **i18n.js**:
   - Soporte multilingüe
   - Cambio de idioma en tiempo real

### Almacenamiento de datos

- `chrome.storage.local`: Almacenamiento local (siempre usado)
- `chrome.storage.sync`: Almacenamiento de sincronización en la nube (opcional)
- Principio de local first, resuelve problema de cuota de sincronización

### Compatibilidad de navegador

| Función | Chrome | Firefox |
|---------|--------|---------|
| Modo Manual | ✅ | ✅ |
| Modo Automático | ✅ | ✅ |
| Autenticación proxy | ✅ | ✅ |
| Prueba proxy | ✅ | ✅ |
| Cambio de tema | ✅ | ✅ |
| Sincronización de datos | ✅ | ✅ |
| Detección proxy | ✅ | ✅ |

## 📝 Casos de uso

### Escenario 1: Cambio entre múltiples proxies

- Configurar diferentes proxies para diferentes entornos de red
- Usar proxy de empresa para red de oficina
- Usar proxy científico para red doméstica
- Cambio rápido con un clic

### Escenario 2: Enrutamiento inteligente

- Sitios web nacionales conexión directa
- Sitios específicos a través de proxy
- Selección automática basada en dominio

### Escenario 3: Prueba de pool de proxies

- Importar múltiples proxies
- Probar latencia en lote
- Seleccionar proxy óptimo para usar

### Escenario 4: Compartición en equipo

- Exportar archivo de configuración
- Compartir con miembros del equipo
- Configuración de proxy unificada

## ⚠️ Notas importantes

1. **Descripción de permisos**: La extensión requiere los siguientes permisos:
   - `proxy`: Gestionar configuraciones de proxy
   - `storage`: Almacenar configuraciones
   - `webRequest` / `webRequestAuthProvider`: Manejar solicitudes de autenticación
   - `<all_urls>`: Acceder a todas las URLs de sitios web

2. **Conflictos con otras extensiones**: Si hay conflictos de proxy, desactivar otras extensiones proxy/VPN

3. **Seguridad**: Las credenciales se almacenan localmente en el navegador, por favor asegurar la seguridad del dispositivo

4. **Requisitos de red**: Asegurarse de que el servidor proxy sea accesible normalmente

5. **Restricción de Firefox**: La versión mínima de Firefox requerida es 142.0

## 📄 Política de privacidad

[Política de privacidad](https://sites.google.com/view/proxy-assistant/privacy-policy)

## 📄 Licencia

MIT License - Ver archivo [LICENSE](../LICENSE) para detalles

## 🤝 Contribución

¡Informes de issues y pull requests son bienvenidos!

## 📧 Contacto

Para preguntas o sugerencias, por favor enviar comentarios a través de GitHub Issues.

---

<div align="center">

**Si este proyecto te ha sido útil, ¡agradeceríamos un Star ⭐ para apoyar!**

</div>
