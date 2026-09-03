# 06 — Referencias y Configuración

## URLs de Producción Actuales

```
Panel web:
https://asistpanel.vercel.app/

Repositorio:
https://github.com/Angeliteh/escuelas_flujo_estadistica

Base actual de `main`:
`b8eae64` — Actualiza la hoja de ruta posterior a V11

Google Sheet:
https://docs.google.com/spreadsheets/d/1jAPfaac3miW8izCGrq1rosCntdjAMw3TMKLCxHYtSzI/edit

Apps Script (API):
https://script.google.com/macros/s/AKfycbyFPxVLK2RpUPC91Y1JRfowXAf5aKThAk8ERFjgkNLf-jc1uEdzIoIU73mSJzLYJNC3Sw/exec

Prueba rápida de la API (ping):
https://script.google.com/macros/s/AKfycbyFPxVLK2RpUPC91Y1JRfowXAf5aKThAk8ERFjgkNLf-jc1uEdzIoIU73mSJzLYJNC3Sw/exec?action=ping
```

---

## Archivos del Proyecto

```
TESTEOAMIGAMAMA/
├── index.html          ← Estructura HTML (login, vistas, modales)
├── styles.css          ← Estilos (glassmorphism, responsive, animaciones)
├── app.js              ← Toda la lógica JS (auth, API, render e impresión)
├── AppsScript_V11.gs   ← Backend V11.1 preparado; publicar junto con el panel
└── docs/
    ├── README.md       ← Índice de documentación (este archivo)
    ├── 01_arquitectura.md
    ├── 02_roles.md
    ├── 03_google_sheets.md
    ├── 04_apps_script.md  ← Archivo histórico V9; no usar para publicar
    ├── 05_deuda_tecnica.md
    ├── 06_referencias.md
    ├── 07_estado_actual.md
    ├── 08_handoff_y_escalabilidad.md  ← Documento principal de continuidad
    ├── 09_respaldos_y_restauracion.md ← Instalación y recuperación de copias
    ├── 10_identidad_alumnos_v10.md    ← Migración a identidad permanente
    ├── 11_modelo_control_escolar_y_movimientos.md
    ├── 12_inscripciones_y_movimientos_v11.md
    ├── 13_contrato_operativo.md          ← Reglas obligatorias
    ├── 14_piloto_y_adopcion.md
    └── 15_acceso_seguro.md               ← Instalación de cuentas y pruebas
```

---

## Accesos

Las credenciales no se almacenan en archivos del proyecto. La lista privada de usuarios se instala en Apps Script siguiendo [15_acceso_seguro.md](./15_acceso_seguro.md). Este repositorio sólo conserva perfiles visuales sin contraseñas; el servidor decide rol y grupo en cada operación.

---

## Dependencias externas (CDN, sin instalación)

| Librería | Versión | Para qué |
|----------|---------|----------|
| [Chart.js](https://www.chartjs.org/) | 4.x | Gráficas del Dashboard de la directora |
| [Font Awesome](https://fontawesome.com/) | 6.x | Iconografía |
| [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter) | — | Tipografía |

Todas se cargan desde CDN en `index.html`. No hay `package.json` ni `node_modules`. El proyecto no requiere build.

---

## Configuración del Google Sheet

| Variable | Valor actual | Dónde se configura |
|----------|-------------|-------------------|
| `HEADER_ROW` | `5` | Apps Script (línea 5) |
| `TABS` | `['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B']` | Apps Script |
| `GROUPS_LIST` | Igual que `TABS` | `app.js` (inicio del archivo) |
| `API_URL` | La URL larga del Script | `app.js` (inicio del archivo) |

> V11.1 conserva respaldos e historial mensual, añade identidad permanente, inscripciones, movimientos y acceso validado por servidor. Los 21 IDs heredados inválidos encontrados en `2A` ya fueron reparados; la auditoría final confirmó 272 de 272 IDs válidos. El acceso no queda activo hasta ejecutar la instalación y pruebas de [15_acceso_seguro.md](./15_acceso_seguro.md).

---

## Datos de la Escuela

| Campo | Valor |
|-------|-------|
| Nombre | Escuela Primaria Gral. Elpidio G. Velázquez |
| CCT | 10DPR0519X |
| Sector | 13 |
| Zona | 109 |
| Ciclo Escolar | 2026-2027 |
