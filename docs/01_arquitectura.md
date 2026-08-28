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
│  doPost() → alumnos + asistencia + personal                    │
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
5. Apps Script escribe la fila en la hoja "1A" a partir de la fila 6
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

## Asistencia y consultas mensuales

La asistencia diaria se guarda en la hoja mensual formateada del grupo. La vista mensual del panel usa el endpoint V7 `getAttendanceMonth`, que lee todo el mes en una sola petición. Si V7 no está disponible, el frontend conserva temporalmente un método anterior compatible.

## Limitación conocida: sin tiempo real

El panel carga datos una sola vez al iniciar sesión. Si otro maestro agrega un alumno mientras tienes el panel abierto, **no verás ese cambio hasta refrescar la página**. Esto es intencional para el prototipo. Ver [05_deuda_tecnica.md](./05_deuda_tecnica.md) para la solución.

---

## Panel, Sheet oficial e impresión

El panel es la única herramienta de trabajo para maestros y directora durante la captura normal. Google Sheets se conserva como fuente operativa y como respaldo/auditoría, pero los maestros no tienen que abrirlo ni modificarlo.

| Necesidad | Lugar | Resultado |
|---|---|---|
| Capturar o corregir alumnos | Panel → Alumnos | Actualiza la fuente oficial mediante la API |
| Imprimir datos de inscripción | Panel → Alumnos → Imprimir padrón | Padrón con los campos completos, encabezado y filas del grupo |
| Capturar asistencia | Panel → Asistencia | Registro diario del grupo asignado |
| Consultar o imprimir historial | Panel → Historial mensual | Matriz mensual sin crear archivos Excel adicionales |
| Auditoría o revisión del formato original | Google Sheets | Archivo oficial en vivo, con su diseño y membrete |

Se retiró la descarga de Excel del panel para evitar copias desactualizadas o archivos paralelos.

---

## Modelo de datos para la siguiente fase

Las hojas actuales son el **catálogo maestro de alumnos**: una fila por alumno y 20 columnas, incluyendo el folio escolar. La asistencia está activa en matrices mensuales independientes para conservar el formato institucional; no debe agregarse como columnas dentro de las filas de alumnos.

Para análisis histórico, la siguiente fase debe añadir un modelo separado de eventos de asistencia, idealmente con registros como:

`fecha · grupo · alumnoId · estado · puntualidad · actividad · nota · usuario · fechaActualizacion`

Así se podrán generar después listas mensuales, estadísticas y validaciones sin duplicar los datos personales del alumno.
