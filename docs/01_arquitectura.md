# 01 — Arquitectura del Sistema

## Visión general

El sistema es una aplicación web con interfaz estática (HTML + CSS + JS), una función ligera en Vercel y **Google Sheets como fuente operativa de datos**. Google Apps Script aplica las reglas y se comunica con Sheets y Drive.

```
┌─────────────────────────────────────────────────────────────────┐
│                   PANEL WEB  (index.html)                       │
│                                                                 │
│   ┌───────────────┐       ┌────────────────────────────────┐   │
│   │ Vista Maestro │       │       Vista Directora           │   │
│   │  (solo su     │       │ Dashboard + Todos + Personal    │   │
│   │   grupo)      │       │                                 │   │
│   └──────┬────────┘       └───────────────┬────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ POST /api/control
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│              VERCEL FUNCTION  (api/control.js)                   │
│  Reenvía peticiones desde servidor y evita bloqueos de privacidad │
│  del navegador hacia la redirección temporal de Google.           │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ POST autenticado
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│          GOOGLE APPS SCRIPT  (el "backend")                      │
│  Web App detrás de la ruta de Vercel                             │
│                                                                  │
│  doPost() → sesión, alumnos, asistencia, bajas y personal       │
│  Propiedades → cuentas, claves internas, sesiones y estado       │
│  Activador → respaldo nocturno en Drive                          │
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
1. Maestro llena el formulario en el panel.
2. `app.js` manda la sesión y los datos a `/api/control`.
3. Vercel la reenvía a Apps Script; el navegador no sigue la redirección temporal de Google.
4. Apps Script valida que la sesión pertenezca a ese maestro y a su grupo.
5. Determina la hoja, escribe la fila, asigna `ALUMNO_ID` y estado `ACTIVO`.
6. Crea la inscripción del ciclo vigente y agrega el movimiento `ALTA`.
7. Devuelve un resultado JSON; el panel actualiza la tabla o muestra un error.
```

## Flujo: cargar datos al abrir sesión

```
1. La persona escribe usuario y contraseña en el panel.
2. Apps Script valida la cuenta, crea una sesión temporal de ocho horas y entrega en esa misma respuesta el padrón autorizado.
3. El panel conserva una copia temporal sólo durante la pestaña abierta y renderiza la vista autorizada.
4. Al recargar con sesión vigente, muestra primero esa copia autorizada y actualiza el padrón en segundo plano.
5. Si no existe copia temporal, muestra “Recuperando tu información” hasta completar la consulta autenticada.
```

---

## Asistencia y consultas mensuales

V10 conserva el almacenamiento histórico instalado en V9. Cada mes tiene una hoja técnica oculta `_ASISTENCIA_DATOS_AAAA_MM`; `getAttendanceMonth` consulta el mes completo en una petición y regenera la matriz institucional visible del grupo.

Las hojas `ASISTENCIA (1A)` hasta `ASISTENCIA (6B)` son formatos de consulta e impresión, no la única fuente histórica. Cambiar de mes no sobrescribe el anterior.

## Limitación conocida: sin tiempo real

El panel carga datos una sola vez al iniciar sesión. Si otro maestro agrega un alumno mientras tienes el panel abierto, **no verás ese cambio hasta refrescar la página**. Esto es intencional para el prototipo. Ver [05_deuda_tecnica.md](./05_deuda_tecnica.md) para la solución.

---

## Panel, Sheet oficial e impresión

El panel es la única herramienta de trabajo para maestros y directora durante la captura normal. Google Sheets se conserva como fuente operativa y permite revisión administrativa e historial de versiones, pero no sustituye un respaldo independiente ni una bitácora formal. Los maestros no tienen que abrirlo ni modificarlo.

| Necesidad | Lugar | Resultado |
|---|---|---|
| Capturar o corregir alumnos | Panel → Alumnos | Actualiza la fuente oficial mediante la API |
| Imprimir datos de inscripción | Panel → Alumnos → Imprimir padrón | Padrón con los campos completos, encabezado y filas del grupo |
| Capturar asistencia | Panel → Asistencia | Registro diario del grupo asignado |
| Consultar o imprimir historial | Panel → Historial mensual | Matriz mensual sin crear archivos Excel adicionales |
| Auditoría o revisión del formato original | Google Sheets | Archivo oficial en vivo, con su diseño y membrete |

Se retiró la descarga de Excel del panel para evitar copias desactualizadas o archivos paralelos.

---

## Modelo de datos vigente

V11 utiliza identidad permanente, estado, ciclo y metadatos ocultos `U:AA` junto con `_INSCRIPCIONES`, `_MOVIMIENTOS_ALUMNO` y asistencia histórica por fecha.

Las reglas obligatorias están en [13_contrato_operativo.md](./13_contrato_operativo.md); el modelo rector y el camino de migración están en [11_modelo_control_escolar_y_movimientos.md](./11_modelo_control_escolar_y_movimientos.md).
