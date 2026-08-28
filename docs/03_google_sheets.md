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

## Hojas formateadas de asistencia (comportamiento publicado V7/V8)

Cada grupo debe tener una hoja formateada con el nombre exacto `ASISTENCIA (1A)`, `ASISTENCIA (1B)`, hasta `ASISTENCIA (6B)`. La plantilla usa la fila 6 para las iniciales de los días, la fila 7 para los números del mes, la fila 8 en adelante para los alumnos y la columna B para sus nombres.

El panel solamente escribe `✓` o `X` en la celda correspondiente al alumno y al día. El Apps Script V7 no crea una pestaña nueva: si la hoja del grupo no existe, devuelve un aviso y no escribe nada. Las fechas futuras no se pueden capturar. El historial mensual se consulta con una sola petición optimizada.

En el comportamiento V7/V8, cuando el panel consulta una fecha con internet, la hoja mensual es la fuente de verdad: si una marca se borra directamente en Sheets, desaparecerá del panel al actualizar o volver a consultar ese día. Las capturas hechas sin internet se conservan localmente hasta sincronizarse. Después de activar V9, la fuente histórica pasa a las hojas técnicas mensuales y las correcciones deben hacerse desde el panel.

> **Limitación crítica antes de septiembre de 2026:** el nombre de estas hojas no contiene mes ni año y V7 vuelve a escribir sus encabezados. No se debe iniciar la captura de un mes nuevo hasta migrar agosto a un almacenamiento histórico por fecha y verificar que ambos meses se consultan por separado. Un respaldo completo protege ante accidentes, pero no convierte por sí solo estas matrices en historial consultable.

### Estructura local preparada para V9

V9 evita crear 120 matrices visibles por ciclo. Mantiene las 12 hojas institucionales anteriores y crea una partición técnica oculta por mes para todos los grupos:

```text
_ASISTENCIA_DATOS_2026_08
_ASISTENCIA_DATOS_2026_09
_ASISTENCIA_DATOS_2026_10
...
```

Cada registro técnico contiene fecha, grupo, alumno, estado, nota, usuario y actualización. El panel consulta estas particiones; la matriz visible se limpia y regenera para el mes que se está capturando. La versión local ya superó una simulación agosto → septiembre → agosto, pero no debe considerarse producción hasta ejecutar la migración y la prueba controlada en el Sheet real.

Para corregir una marca en V9 se usa el panel: seleccionar la otra opción cambia ✓ por X o viceversa; pulsar nuevamente la opción que ya está seleccionada la limpia y devuelve al alumno a estado pendiente. No se debe borrar directamente la celda de la matriz visible.

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
