# 06 — Referencias y Configuración

## URLs de Producción Actuales

```
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
└── docs/
    ├── README.md       ← Índice de documentación (este archivo)
    ├── 01_arquitectura.md
    ├── 02_roles.md
    ├── 03_google_sheets.md
    ├── 04_apps_script.md  ← Código completo del Apps Script
    ├── 05_deuda_tecnica.md
    └── 06_referencias.md  ← Estás aquí
```

---

## Credenciales de Desarrollo

> Estas son las credenciales del prototipo. Para producción, cambiarlas en el objeto `USERS` de `app.js`.

| Usuario | Contraseña | Rol | Nombre |
|---------|------------|-----|--------|
| `directora` | `director2025` | Subdirectora / administración | Norma Patricia Ortiz Cabrera |
| `1A` | `maestro2025` | Maestro | Mtro. Carlos Mendoza |
| `1B` | `maestro2025` | Maestro | Mtra. Ana López |
| `1C` | `maestro2025` | Maestro | Mtro. Roberto Sánchez |
| `1D` | `maestro2025` | Maestro | Mtra. Patricia Ruiz |
| `2A` | `maestro2025` | Maestro | Mtro. José García |
| `2B` | `maestro2025` | Maestro | Mtra. Carmen Torres |
| `2C` | `maestro2025` | Maestro | Mtro. Fernando Díaz |
| `2D` | `maestro2025` | Maestro | Mtra. Sofía Morales |
| `3A` | `maestro2025` | Maestro | Mtro. Alejandro Reyes |
| `3B` | `maestro2025` | Maestro | Mtra. Gabriela Flores |
| `3C` | `maestro2025` | Maestro | Mtro. Miguel Herrera |
| `3D` | `maestro2025` | Maestro | Mtra. Valeria Castro |

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
| `TABS` | `['1A','1B',...,'3D']` | Apps Script (línea 8) |
| `GROUPS_LIST` | Igual que `TABS` | `app.js` (aproximadamente línea 50) |
| `API_URL` | La URL larga del Script | `app.js` (línea ~130) |

---

## Datos de la Escuela

| Campo | Valor |
|-------|-------|
| Nombre | Escuela Primaria Gral. Elpidio G. Velázquez |
| CCT | 10DPR0519X |
| Sector | 13 |
| Zona | 109 |
| Ciclo Escolar | 2026-2027 |
