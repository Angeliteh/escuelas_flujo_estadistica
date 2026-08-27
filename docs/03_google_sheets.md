# 03 — Google Sheets: Estructura y Reglas

## Archivo principal
```
Nombre:  testeo  (renombrar a "Control_Escolar_2026-2027" para producción)
Link:    https://docs.google.com/spreadsheets/d/1jAPfaac3miW8izCGrq1rosCntdjAMw3TMKLCxHYtSzI/edit
```

---

## Estructura de cada pestaña

Cada grupo tiene su propia pestaña nombrada exactamente como su código (`1A`, `1B`, ... `3D`).

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

## Las 17 columnas (en orden exacto)

| Col | Nombre en Sheet | Campo en el sistema | ¿Visible en panel? |
|-----|-----------------|--------------------|--------------------|
| A | GRADO | `grado` | ✅ Directora |
| B | GRUPO | `grupo` | ✅ Ambos |
| C | NOMBRE DEL ALUMNO | `nombre` | ✅ Ambos |
| D | FECHA DE NACIMIENTO | `fechaNacimiento` | ✅ Ambos |
| E | CURP ALUMNO | `curpAlumno` | ✅ Ambos |
| F | GENERO | `genero` | ✅ Ambos |
| G | BECA | `beca` | ✅ Ambos |
| H | PESO | `peso` | ✅ Ambos |
| I | ESTATURA | `estatura` | ✅ Ambos |
| J | TALLA | `talla` | ✅ Ambos |
| K | NOMBRE TUTOR | `tutor` | ✅ Ambos |
| L | TELEFONO | `telefono` | ✅ Ambos |
| M | CURP TUTOR | `curpTutor` | ✅ Ambos |
| N | CORREO | `correo` | ✅ Ambos |
| O | DOMICILIO | `domicilio` | ✅ Ambos |
| P | NIVEL DE ESTUDIO | `nivelEstudio` | ✅ Ambos |
| Q | OCUPACIÓN | `ocupacion` | ✅ Ambos (en sección Tutor) |

---

## Reglas que NUNCA se deben romper

### ❌ No mover, insertar ni eliminar filas arriba de los datos
El sistema asume que `HEADER_ROW = 5` es fijo. Si se inserta una fila en medio del encabezado visual, todos los datos se desplazan y el sistema empieza a leer basura.

### ❌ No editar manualmente GRADO (col A) o GRUPO (col B)
Si se cambia el valor de GRUPO de `A` a `1A` (o cualquier otra cosa), ese alumno "desaparece" de su grupo en el panel porque el sistema busca exactamente la letra `A`.

### ✅ SÍ puedes editar cualquier otro campo directamente en el Sheet
Nombre, CURP, teléfono, domicilio, etc. Los cambios se reflejarán en el panel la próxima vez que alguien recargue la página.

---

## Pestañas actuales
```
1A · 1B · 1C · 1D
2A · 2B · 2C · 2D
3A · 3B · 3C · 3D
```

Si se agrega un grado nuevo, también hay que actualizar el Apps Script y `app.js`. Ver [02_roles.md — Cómo agregar un grupo nuevo](./02_roles.md).

---

## Ver el Sheet vs. exportar Excel

| Acción | Cómo hacerlo | Resultado |
|--------|-------------|-----------|
| Ver Sheet en vivo | La directora abre el link del Drive | Ve los datos en tiempo real con el diseño oficial (logo, colores) |
| Imprimir con membrete | Desde el Sheet: Archivo → Imprimir | Hoja con formato de la escuela |
| Exportar desde el panel | Botón "Exportar Excel" | Archivo `.xlsx` sin diseño, solo datos tabulares limpios |
| Ver en el panel | Pestaña "Todos los Alumnos" | Tabla interactiva con filtros y búsqueda |

---

## Permisos de acceso al archivo

| Persona | Permiso en Drive | Por qué |
|---------|-----------------|---------|
| Desarrollador (tú) | Editor | Crear pestañas, ajustar formato, publicar Apps Script |
| Directora | Editor o Lector | Para auditar y ver el Sheet directamente si lo necesita |
| Maestros | ❌ Sin acceso | Solo usan el panel web. No necesitan ver el Sheet. |
