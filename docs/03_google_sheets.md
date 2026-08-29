# 03 — Google Sheets: Estructura y Reglas

## Archivo principal
```
Nombre:  testeo  (renombrar a "Control_Escolar_2026-2027" para producción)
Link:    https://docs.google.com/spreadsheets/d/1jAPfaac3miW8izCGrq1rosCntdjAMw3TMKLCxHYtSzI/edit
```

---

## Estructura de cada pestaña

Cada grupo tiene su propia pestaña nombrada exactamente como su código (`1A`, `1B`, ... `6B`). Actualmente se operan 12 grupos: A y B de primero a sexto.

```
Fila 1 │ [Logo de la escuela - imagen insertada]
Fila 2 │ ESCUELA PRIMARIA GRAL ELPIDIO G VELÁZQUEZ / CCT: 10DPR0519X
Fila 3 │ SECTOR 13 / ZONA 109
Fila 4 │ (espacio)
Fila 5 │ ENCABEZADOS DE COLUMNAS  ← HEADER_ROW = 5
═══════╪════════════════════════════════════════════════════════
Fila 6+│ DATOS DE LOS ALUMNOS  (el sistema escribe aquí)
```

> La variable `HEADER_ROW = 5` en el Apps Script le dice al sistema: *"Los encabezados están en la fila 5, los datos empiezan en la fila 6"*.

---

## Las 20 columnas de alumnos (en orden exacto)

| Col | Nombre en Sheet | Campo en el sistema | ¿Visible en panel? |
|-----|-----------------|--------------------|--------------------|
| A | NO. | posición de fila | Sistema |
| B | GRADO | `grado` | Panel |
| C | GRUPO | `grupo` | Panel |
| D | FOLIO | `folio` | Ambos |
| E | NOMBRE DEL ALUMNO | `nombre` | Ambos |
| F | BARRERA DE APRENDIZAJE | `barreraAprendizaje` | Ambos |
| G | FECHA DE NACIMIENTO | `fechaNacimiento` | Ambos |
| H | CURP ALUMNO | `curpAlumno` | Ambos |
| I | GENERO | `genero` | Ambos |
| J | BECA | `beca` | Ambos |
| K | PESO | `peso` | Ambos |
| L | ESTATURA | `estatura` | Ambos |
| M | TALLA | `talla` | Ambos |
| N | NOMBRE TUTOR | `tutor` | Ambos |
| O | TELEFONO | `telefono` | Ambos |
| P | CURP TUTOR | `curpTutor` | Ambos |
| Q | CORREO | `correo` | Ambos |
| R | DOMICILIO | `domicilio` | Ambos |
| S | NIVEL DE ESTUDIO | `nivelEstudio` | Ambos |
| T | OCUPACIÓN | `ocupacion` | Ambos |

---

## Reglas que NUNCA se deben romper

### ❌ No mover, insertar ni eliminar filas arriba de los datos
El sistema asume que `HEADER_ROW = 5` es fijo. Si se inserta una fila en medio del encabezado visual, todos los datos se desplazan y el sistema empieza a leer basura.

### ❌ No editar manualmente NO., GRADO (col B) o GRUPO (col C)
Esos campos identifican la posición y pertenencia del alumno. El panel los asigna según la hoja y el usuario; cambiar grupo o grado puede hacer que el alumno aparezca en otro grupo o quede fuera de los filtros.

### ✅ Recomendación de operación
Los maestros no deben editar el Sheet. Deben usar el panel, que conserva el formato y envía los cambios por Apps Script. La directora puede consultar el Sheet oficial y editarlo solo como tarea administrativa controlada.

---

## Pestañas actuales
```
1A · 1B
2A · 2B
3A · 3B
4A · 4B
5A · 5B
6A · 6B
```

Si se agrega un grado nuevo, también hay que actualizar el Apps Script y `app.js`. Ver [02_roles.md — Cómo agregar un grupo nuevo](./02_roles.md).

---

## Ver el Sheet e imprimir desde el panel

## Hojas formateadas de asistencia (V10)

Cada grupo debe tener una hoja formateada con el nombre exacto `ASISTENCIA (1A)`, `ASISTENCIA (1B)`, hasta `ASISTENCIA (6B)`. La plantilla usa la fila 6 para las iniciales de los días, la fila 7 para los números del mes, la fila 8 en adelante para los alumnos y la columna B para sus nombres.

El panel registra `✓` o `X` por alumno y fecha. Apps Script no crea las plantillas visibles: si la hoja del grupo no existe, devuelve un aviso. Las fechas futuras no se pueden capturar y el historial mensual se consulta en una sola petición optimizada.

La fuente histórica son las hojas técnicas mensuales instaladas en V9 y conservadas por V10. Las correcciones deben hacerse desde el panel; la matriz visible puede regenerarse. Las capturas hechas sin internet se conservan localmente hasta sincronizarse.

> El cambio de mes ya está resuelto técnicamente. Sigue pendiente comprobarlo con operación real al cruzar agosto → septiembre → agosto.

### Estructura histórica instalada desde V9

V9 evita crear 120 matrices visibles por ciclo. Mantiene las 12 hojas institucionales anteriores y crea una partición técnica oculta por mes para todos los grupos:

```text
_ASISTENCIA_DATOS_2026_08
_ASISTENCIA_DATOS_2026_09
_ASISTENCIA_DATOS_2026_10
...
```

Cada registro técnico contiene fecha, grupo, alumno, estado, nota, usuario y actualización. El panel consulta estas particiones; la matriz visible se limpia y regenera para el mes que se está capturando. La migración está instalada y la API pública confirmó `historical-events-v1`.

Para corregir una marca en V9 se usa el panel: seleccionar la otra opción cambia ✓ por X o viceversa; pulsar nuevamente la opción que ya está seleccionada la limpia y devuelve al alumno a estado pendiente. No se debe borrar directamente la celda de la matriz visible.

### Extensión técnica activa en V11

V11 conserva exactamente las 20 columnas oficiales visibles `A:T` y utiliza metadatos ocultos en `U:AA`: `ALUMNO_ID`, `ESTATUS`, `CICLO_ESCOLAR`, `FECHA_ALTA_SISTEMA`, `FECHA_ESTATUS`, `ACTUALIZADO_EN` y `ACTUALIZADO_POR`. Además relaciona cada alumno con `_INSCRIPCIONES` y `_MOVIMIENTOS_ALUMNO`.

Estas columnas no deben borrarse ni usarse para captura manual. `ESTATUS` sí existe en `V`, pero se cambia desde el panel mediante Alta, Baja, Reingreso, Transferencia o Egreso para que la inscripción y el movimiento correspondiente se actualicen juntos. La instalación está descrita en [12_inscripciones_y_movimientos_v11.md](./12_inscripciones_y_movimientos_v11.md).

| Acción | Cómo hacerlo | Resultado |
|--------|-------------|-----------|
| Ver Sheet en vivo | La directora abre el link del Drive | Ve los datos en tiempo real con el diseño oficial (logo, colores) |
| Imprimir con membrete | Desde el Sheet: Archivo → Imprimir | Hoja con formato de la escuela |
| Imprimir padrón desde el panel | Pestaña "Alumnos" → "Imprimir padrón" | Copia impresa de los datos completos del grupo |
| Imprimir asistencia | Pestaña "Asistencia" o "Historial mensual" | Lista diaria o matriz mensual |
| Ver en el panel | Pestaña "Todos los Alumnos" | Tabla interactiva con filtros y búsqueda |

> El panel no descarga archivos Excel. Así se evita que circulen copias desconectadas del registro oficial.

---

## Permisos de acceso al archivo

| Persona | Permiso en Drive | Por qué |
|---------|-----------------|---------|
| Desarrollador (tú) | Editor | Crear pestañas, ajustar formato, publicar Apps Script |
| Directora | Editor o Lector | Para auditar y ver el Sheet directamente si lo necesita |
| Maestros | ❌ Sin acceso | Solo usan el panel web. No necesitan ver el Sheet. |
