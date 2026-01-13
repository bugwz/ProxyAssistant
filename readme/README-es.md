<div align="center">

<img src="../src/images/logo-128.png" width="80" height="80" align="center">

# Asistente de Proxy

</div>

<div align="center">

[![Extensión de Chrome](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Multilingüe](https://img.shields.io/badge/Multilingüe-yellow)](README-es.md)

</div>

<div align="center">

[简体中文](../README.md) | [繁體中文](README-zh-TW.md) | [English](README-en.md) | [日本語](README-ja.md) | [Français](README-fr.md) | [Deutsch](README-de.md) | [**Español**](README-es.md) | [Português](README-pt.md) | [Русский](README-ru.md) | [한국어](README-ko.md)

</div>

<div align="center">

Una potente extensión de Chrome para gestión de proxies que te ayuda a configurar y cambiar fácilmente entre diferentes proxies de red.

</div>

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260113112155/assets/store/promotional/marquee-1632x656.jpeg)

## ✨ Características

### 🔌 Soporte de múltiples protocolos proxy
- **HTTP** - Proxy HTTP tradicional
- **HTTPS** - Proxy HTTPS seguro
- **SOCKS5** - Proxy SOCKS5 con soporte TCP/UDP
- **SOCKS4** - Compatibilidad con proxy SOCKS4 legacy

### 🔄 Tres modos de proxy

| Modo | Descripción |
|------|-------------|
| **Desactivar** | Desactivar proxy, usar conexión de red predeterminada del sistema |
| **Manual** | Seleccionar manualmente un proxy de la lista |
| **Automático** | Seleccionar automáticamente el proxy correspondiente según reglas de URL (modo PAC) |

| ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260113112155/assets/screenshots/popup/disabled.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260113112155/assets/screenshots/popup/manual.png) | ![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260113112155/assets/screenshots/popup/auto.png) |
|:---:|:---:|:---:|
| Modo Desactivado | Modo Manual | Modo Automático |

### 📋 Configuración flexible de reglas URL

- **Direcciones que omiten el proxy** (`bypass_urls`): Dominios/IPs de conexión directa
- **Direcciones que usan el proxy** (`include_urls`): Dominios que requieren acceso proxy
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

### 🌙 Modos de tema

- **Modo Claro**: Para uso diurno
- **Modo Oscuro**: Para uso nocturno
- **Cambio automático**: Cambiar tema automáticamente según la hora

| ![Modo Claro](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260113112155/assets/screenshots/main/theme-light.png) | ![Modo Oscuro](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260113112155/assets/screenshots/main/theme-dark.png) |
|:---:|:---:|
| Modo Claro | Modo Oscuro |

### ☁️ Sincronización de datos

- **Sincronización con Google**: Sincronizar configuraciones de proxy entre dispositivos
- **Almacenamiento local**: Opción para guardar solo localmente

### 🌍 Soporte multilingüe

Esta extensión soporta 5 idiomas:

| Idioma | Código | Estado |
|--------|--------|--------|
| 简体中文 | zh-CN | ✅ Soportado |
| 繁體中文 | zh-TW | ✅ Soportado |
| English | en | ✅ Soportado |
| 日本語 | ja | ✅ Soportado |
| Français | fr | ✅ Soportado |

## 📷 Interfaz de configuración

![](https://raw.githubusercontent.com/bugwz/ProxyAssistant-assets/refs/heads/20260113112155/assets/screenshots/main/settings.png)

## 📁 Estructura del proyecto

```
ProxyAssistant/
├──                     # Documentación multilingüe
│   ├── README-zh-CN.md       # Chino simplificado
│   ├── README-zh-TW.md       # Chino tradicional
│   ├── README-en.md          # Inglés
│   └── ...
├── src/                       # Código fuente
│   ├── manifest.json         # Configuración de extensión Chrome
│   ├── main.html             # Página de configuración
│   ├── popup.html            # Página emergente
│   ├── js/
│   │   ├── main.js           # Lógica principal de página de configuración
│   │   ├── popup.js          # Lógica principal del popup
│   │   ├── service-worker.js # Servicio en segundo plano (lógica principal del proxy)
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

## 🚀 Inicio rápido

### Instalación de la extensión

1. Abre Chrome y navega a `chrome://extensions/`
2. Activa el **"Modo de desarrollador"** en la esquina superior derecha
3. Haz clic en **"Cargar extensión sin empaquetar"**
4. Selecciona la carpeta `ProxyAssistant/src` 

### Añadir un proxy

1. Haz clic en el icono de la extensión para abrir el popup
2. Haz clic en el botón **"Configuración"** para abrir la página de configuración
3. Haz clic en el botón **"Nuevo"** para añadir un nuevo proxy
4. Rellena la información del proxy:
   - Nombre del proxy
   - Tipo de protocolo (HTTP/HTTPS/SOCKS5)
   - Dirección del proxy (IP o dominio)
   - Número de puerto
   - (Opcional) Nombre de usuario y contraseña
5. Haz clic en el botón **"Guardar"**

### Usar proxies

**Modo Manual**:
1. Selecciona el modo **"Manual"** en el popup
2. Selecciona un proxy de la lista
3. El estado "Conectado" indica que está activo

**Modo Automático**:
1. Selecciona el modo **"Automático"** en el popup
2. Configura reglas de URL para cada proxy en la página de configuración
3. Los proxies se seleccionan automáticamente según el sitio web que visites

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

### Modo automático con script PAC

El modo automático usa scripts PAC (Proxy Auto-Config):
- Selecciona automáticamente el proxy según la URL actual
- Soporta políticas de respaldo (conexión directa o rechazo)
- Restaura automáticamente la última configuración al inicio del navegador

### Atajos de teclado

| Acción | Método |
|--------|--------|
| Expandir/colapsar tarjeta proxy | Clic en el encabezado de la tarjeta |
| Expandir/colapsar todas las tarjetas | Clic en botón "Expandir todo" |
| Reordenar proxy arrastrando | Arrastrar el mango en el encabezado de la tarjeta |
| Mostrar/ocultar contraseña | Clic en el icono de ojo en el campo de contraseña |
| Probar proxy individual | Clic en botón "Probar" |
| Probar todos los proxies | Clic en botón "Probar todo" |

### Importar/exportar configuración

1. **Exportar configuración**: Clic en "Exportar configuración" para descargar archivo JSON
2. **Importar configuración**: Clic en "Importar configuración" y seleccionar archivo JSON para restaurar

La configuración incluye:
- Toda la información del proxy
- Configuraciones de tema
- Configuraciones de sincronización

## 🔧 Arquitectura técnica

### Manifest V3

- Usa especificación Chrome Extension Manifest V3
- Service Worker reemplaza páginas de fondo
- Arquitectura más segura y eficiente

### Módulos principales

1. **service-worker.js**:
   - Gestión de configuración de proxy
   - Generación de script PAC
   - Manejo de autenticación
   - Lógica de prueba de proxy

2. **popup.js**:
   - Interacción con interfaz del popup
   - Visualización de estado del proxy
   - Cambio rápido de proxy

3. **main.js**:
   - Lógica de página de configuración
   - Gestión de proxies (CRUD)
   - Ordenación arrastrar y soltar
   - Importar/Exportar

4. **i18n.js**:
   - Soporte multilingüe
   - Cambio de idioma en tiempo real

### Almacenamiento de datos

- `chrome.storage.local`: Almacenamiento local
- `chrome.storage.sync`: Almacenamiento de sincronización en la nube
- Manejo automático de cuota de almacenamiento

## 📝 Casos de uso

### Escenario 1: Cambio entre múltiples proxies

- Configurar diferentes proxies para diferentes entornos de red
- Usar proxy de empresa para red de oficina
- Usar proxy VPN para red doméstica
- Cambio rápido con un clic

### Escenario 2: Enrutamiento inteligente

- Sitios web nacionales conexión directa
- Sitios web específicos a través de proxy
- Selección automática basada en dominio

### Escenario 3: Prueba de grupo de proxies

- Importar múltiples proxies
- Probar latencia en lote
- Seleccionar proxy óptimo

### Escenario 4: Compartición en equipo

- Exportar archivo de configuración
- Compartir con miembros del equipo
- Configuración de proxy unificada

## ⚠️ Notas importantes

1. **Descripción de permisos**: La extensión requiere los siguientes permisos:
   - `proxy`: Gestionar configuraciones de proxy
   - `storage`: Almacenar configuraciones
   - `webRequest`: Manejar solicitudes de autenticación
   - `<all_urls>`: Acceder a todas las URLs de sitios web

2. **Conflictos con otras extensiones**: Si experimentas conflictos de proxy, desactiva otras extensiones de proxy

3. **Seguridad**: Las credenciales se almacenan localmente en el navegador, por favor asegúrate de la seguridad de tu dispositivo

4. **Requisitos de red**: Asegúrate de que el servidor proxy sea accesible

## 📄 Licencia

MIT License - Ver archivo [LICENSE](../LICENSE) para detalles

## 🤝 Contribución

¡Informes de issues y pull requests son bienvenidos!

## 📧 Contacto

Para preguntas o sugerencias, por favor envía comentarios a través de GitHub Issues.
