# 01 — Arquitectura del Sistema

## Visión general

El sistema es una **aplicación web estática** (3 archivos: HTML + CSS + JS) que usa **Google Sheets como base de datos** a través de **Google Apps Script** como intermediario (API).

```
┌─────────────────────────────────────────────────────────────────┐
│                   PANEL WEB  (index.html)                       │
│                                                                 │
│   ┌───────────────┐       ┌────────────────────────────────┐   │
│   │ Vista Maestro │       │       Vista Directora           │   │
│   │  (solo su     │       │  Dashboard + Todos + Por Grupo  │   │
│   │   grupo)      │       │                                 │   │
│   └──────┬────────┘       └───────────────┬────────────────┘   │
└──────────┼─────────────────────────────────┼────────────────────┘
           │  fetch() POST/GET               │
           ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│          GOOGLE APPS SCRIPT  (el "backend")                      │
│  URL: script.google.com/macros/s/AKfycbyFPx.../exec             │
│                                                                  │
│  doGet()  → lee todos los alumnos de las 12 pestañas            │
│  doPost() → guarda / actualiza / elimina un alumno              │
└──────────────────────────────────┬───────────────────────────────┘
                                   │  SpreadsheetApp
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│             GOOGLE SHEETS  (la "base de datos")                  │
│                                                                  │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ... ┌────┐                       │
│   │ 1A │ │ 1B │ │ 2A │ │ 2B │     │ 6B │   12 pestañas         │
│   └────┘ └────┘ └────┘ └────┘     └────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## ¿Por qué esta arquitectura?

| Alternativa | Por qué se descartó |
|-------------|---------------------|
| 12 archivos Google Sheets separados | La directora tendría que abrir 12 links. Imposible centralizar estadísticas. |
| Un Google Sheet con todos los maestros como editores | Google Sheets no permite restringir acceso por pestaña. Un maestro podría ver (y romper) el grupo de otro. |
| Base de datos real (Firebase, Supabase, MySQL) | Costo, complejidad y necesidad de servidor. Excesivo para este caso. |
| localStorage solamente | Los datos viven solo en el navegador de cada persona. Sin centralización real. |

**Decisión operativa:** Un solo Google Sheet + Apps Script + Web App. Los maestros capturan y consultan desde el panel, sin acceso al Sheet. La directora puede consultar el Sheet oficial cuando necesite auditar o imprimir.

---

## Flujo: agregar un alumno

```
1. Maestro llena el formulario en el panel
2. app.js inyecta automáticamente: grado = "1°", grupo = "A"
3. fetch POST → Apps Script con { action: "saveStudent", data: {...} }
4. Apps Script combina grado + grupo → determina hoja = "1A"
5. appendRow() escribe la fila en la hoja "1A" a partir de la fila 7
6. El panel actualiza la tabla de forma optimista
7. Si la API falla, el panel revierte el cambio y muestra un error
```

## Flujo: cargar datos al abrir sesión

```
1. init() → fetchAllStudents()
2. fetch GET → Apps Script
3. Apps Script lee las 12 hojas, fila por fila desde HEADER_ROW+1
4. Devuelve un JSON array con todos los alumnos
5. app.js procesa cada alumno: agrega grupoId (ej: "1" + "A" = "1A")
6. El panel renderiza la vista según el rol del usuario
```

---

## Limitación conocida: sin tiempo real

El panel carga datos una sola vez al iniciar sesión. Si otro maestro agrega un alumno mientras tienes el panel abierto, **no verás ese cambio hasta refrescar la página**. Esto es intencional para el prototipo. Ver [05_deuda_tecnica.md](./05_deuda_tecnica.md) para la solución.

---

## ¿Ver el Sheet en vivo vs. exportar Excel?

Son cosas completamente distintas:

| | Ver en Google Sheets | Exportar Excel (.xlsx) |
|---|---|---|
| **Qué es** | Abre el archivo real en el navegador | Descarga una foto estática de los datos |
| **¿En vivo?** | Sí, siempre actualizado | No, es un snapshot del momento |
| **¿Quién puede?** | Solo quien tenga acceso al Drive | Cualquiera desde el panel |
| **¿Tiene logo/diseño?** | Sí, el que configuraste en el Sheet | No (solo datos tabulares limpios) |
| **Uso ideal** | Auditoría, imprimir con membrete oficial | Reportes, análisis, enviar por correo |

El panel tiene un botón "Exportar Excel" para descargar datos tabulares. Ese archivo no sustituye al Sheet oficial ni conserva todo su diseño. La directora tiene además el enlace al Sheet real; el maestro puede imprimir la lista generada por el panel o descargar su Excel.

---

## Modelo de datos para la siguiente fase

Las hojas actuales son el **catálogo maestro de alumnos**: una fila por alumno y 19 columnas. La asistencia del Word no debe agregarse a esas filas, porque un mismo alumno tendrá muchos registros, uno por fecha.

La siguiente fase debe añadir un módulo separado de asistencia, idealmente con registros como:

`fecha · grupo · alumnoId · estado · puntualidad · actividad · nota · usuario · fechaActualizacion`

Así se podrán generar después listas mensuales, estadísticas y validaciones sin duplicar los datos personales del alumno.
