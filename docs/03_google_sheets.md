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

## Las 19 columnas de alumnos (en orden exacto)

| Col | Nombre en Sheet | Campo en el sistema | ¿Visible en panel? |
|-----|-----------------|--------------------|--------------------|
| A | NO. | posición de fila | Sistema |
| B | GRADO | `grado` | Panel |
| C | GRUPO | `grupo` | Panel |
| D | NOMBRE DEL ALUMNO | `nombre` | Ambos |
| E | BARRERA DE APRENDIZAJE | `barreraAprendizaje` | Ambos |
| F | FECHA DE NACIMIENTO | `fechaNacimiento` | Ambos |
| G | CURP ALUMNO | `curpAlumno` | Ambos |
| H | GENERO | `genero` | Ambos |
| I | BECA | `beca` | Ambos |
| J | PESO | `peso` | Ambos |
| K | ESTATURA | `estatura` | Ambos |
| L | TALLA | `talla` | Ambos |
| M | NOMBRE TUTOR | `tutor` | Ambos |
| N | TELEFONO | `telefono` | Ambos |
| O | CURP TUTOR | `curpTutor` | Ambos |
| P | CORREO | `correo` | Ambos |
| Q | DOMICILIO | `domicilio` | Ambos |
| R | NIVEL DE ESTUDIO | `nivelEstudio` | Ambos |
| S | OCUPACIÓN | `ocupacion` | Ambos |

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

## Ver el Sheet vs. exportar Excel

## Hojas mensuales de asistencia

Cada grupo debe tener una hoja mensual formateada con el nombre exacto `ASISTENCIA (1A)`, `ASISTENCIA (1B)`, hasta `ASISTENCIA (6B)`. La plantilla usa la fila 6 para las iniciales de los días, la fila 7 para los números del mes, la fila 8 en adelante para los alumnos y la columna B para sus nombres.

El panel solamente escribe `✓` o `X` en la celda correspondiente al alumno y al día. El Apps Script V5 no crea una pestaña nueva: si la hoja del grupo no existe, devuelve un aviso y no escribe nada. Las fechas futuras no se pueden capturar.

| Acción | Cómo hacerlo | Resultado |
|--------|-------------|-----------|
| Ver Sheet en vivo | La directora abre el link del Drive | Ve los datos en tiempo real con el diseño oficial (logo, colores) |
| Imprimir con membrete | Desde el Sheet: Archivo → Imprimir | Hoja con formato de la escuela |
| Exportar desde el panel | Botón "Exportar Excel" | Archivo `.xlsx` sin diseño, solo datos tabulares limpios |
| Ver en el panel | Pestaña "Todos los Alumnos" | Tabla interactiva con filtros y búsqueda |

> Exportar desde el panel produce una copia tabular del momento. No conserva automáticamente toda la maquetación, combinaciones, logo y fórmulas del Sheet oficial.

---

## Permisos de acceso al archivo

| Persona | Permiso en Drive | Por qué |
|---------|-----------------|---------|
| Desarrollador (tú) | Editor | Crear pestañas, ajustar formato, publicar Apps Script |
| Directora | Editor o Lector | Para auditar y ver el Sheet directamente si lo necesita |
| Maestros | ❌ Sin acceso | Solo usan el panel web. No necesitan ver el Sheet. |
