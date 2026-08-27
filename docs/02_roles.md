# 02 — Roles, Permisos y Credenciales

## Resumen

| Rol | Accede al Panel | Accede al Sheet | Ve otros grupos |
|-----|----------------|-----------------|-----------------|
| Maestro | ✅ Solo su grupo | ❌ No | ❌ No |
| Directora | ✅ Todos los grupos | ✅ Sí | ✅ Sí |

---

## 👨‍🏫 Maestro

### Lo que VE
- Barra de estadísticas de su grupo: total alumnos, hombres, mujeres, con beca
- Tabla completa de **sus alumnos únicamente**
- Barra de búsqueda por nombre o CURP

### Lo que PUEDE hacer
- **Agregar alumno** — panel lateral con todos los campos (grado y grupo se asignan automáticamente)
- **Editar alumno** — clic en la fila → panel lateral con datos precargados → editar → Guardar
- **Eliminar alumno** — botón rojo en el panel lateral, con confirmación
- **Imprimir padrón** — desde la pestaña Alumnos, con los datos completos del grupo
- **Registrar e imprimir asistencia** — desde las pestañas Asistencia e Historial mensual

### Lo que NO puede hacer
- Ver alumnos de otros grupos
- Acceder al Google Sheet directamente
- Ver el Dashboard ni la tabla global de la directora

### Credenciales para pruebas

| Usuario | Contraseña | Grupo |
|---------|-----------|-------|
| `1A` | `maestro2025` | 1° Grado – Grupo A |
| `1B` | `maestro2025` | 1° Grado – Grupo B |
| `2A` | `maestro2025` | 2° Grado – Grupo A |
| `2B` | `maestro2025` | 2° Grado – Grupo B |
| `3A` | `maestro2025` | 3° Grado – Grupo A |
| `3B` | `maestro2025` | 3° Grado – Grupo B |
| `4A` | `maestro2025` | 4° Grado – Grupo A |
| `4B` | `maestro2025` | 4° Grado – Grupo B |
| `5A` | `maestro2025` | 5° Grado – Grupo A |
| `5B` | `maestro2025` | 5° Grado – Grupo B |
| `6A` | `maestro2025` | 6° Grado – Grupo A |
| `6B` | `maestro2025` | 6° Grado – Grupo B |

> **Contraseña real:** Para cambiar `maestro2025` a una real, editar en `app.js` el campo `password` de cada grupo en el objeto `USERS`.

---

## 🛡️ Subdirectora / administración

### Lo que VE (4 pestañas)

**Dashboard**
- 4 tarjetas: Total alumnos, Grupos activos, Con beca, % de becas
- Gráfica de dona: distribución por género (toda la escuela)
- Gráfica de barras: alumnos por grupo (12 grupos)
- Gráfica de barras apiladas: becas por grado
- Gráfica doble: peso y estatura promedio por grado

**Todos los Alumnos**
- Tabla completa con las **19 columnas** de cada alumno (equivalente a la hoja oficial)
- Filtros rápidos por **Grado** (botones 1° al 6°) y **Grupo** (botones A / B)
- Filtros por Género y Beca (dropdown)
- Búsqueda libre: nombre, CURP o tutor
- Clic en cualquier fila → Panel lateral de detalle (solo lectura)
- Botón **"Ver en Sheets"** → abre el Google Sheet en nueva pestaña para auditoría
- **Imprimir padrón** desde la pestaña Todos los Alumnos, con los datos completos
- **Asistencia mensual** en modo consulta; puede abrir el detalle de cada día sin editarlo

**Personal**
- Consulta de los 17 campos del registro de personal
- Búsqueda por nombre, función o RFC
- Modo **solo lectura**; por ahora no se agregan, editan ni eliminan registros desde la aplicación

### Lo que PUEDE hacer además
- Abrir el Google Sheet para imprimir con membrete
- Ver todos los datos exactamente como los ingresaron los maestros

La directora conserva la posibilidad de abrir el Sheet oficial porque es la fuente operativa, pero se recomienda no editarlo durante la captura normal para proteger el formato y la trazabilidad.

### Credenciales

```
Usuario:    directora
Contraseña: director2025
```

La cuenta administrativa corresponde a la subdirectora **Norma Patricia Ortiz Cabrera**. Se conserva la llave interna `directora` para no romper el acceso existente.

---

## Cómo cambiar nombres y contraseñas

Todas las credenciales están en `app.js`, objeto `USERS` (~línea 26):

```javascript
const USERS = {
  directora: {
    password: 'director2025',
    role: 'director',
    name: 'Norma Patricia Ortiz Cabrera'  // ← Nombre que aparece en pantalla
  },
  '1A': {
    password: 'maestro2025',            // ← Cambiar aquí
    role: 'teacher',
    group: '1A',
    name: 'Mtro. Carlos Mendoza (1A)'  // ← Nombre del maestro
  },
  // ... etc para cada grupo
};
```

Cambiar `password` y `name` según corresponda. **No cambiar** `role`, `group` ni las llaves (`'1A'`, `'directora'`).

> ⚠️ **Seguridad:** Las contraseñas son visibles en el código fuente del navegador (DevTools → app.js). Aceptable para prototipo interno; para producción real se necesita backend. Ver [05_deuda_tecnica.md](./05_deuda_tecnica.md).

---

## Cómo agregar un grupo nuevo (ej: 1C)

1. Crear pestaña `1C` en el Google Sheet con los mismos encabezados
2. En `app.js`, agregar `'1C'` al array `GROUPS_LIST`
3. En `app.js`, agregar en `USERS`:
   ```javascript
   '1C': { password: 'maestro2025', role: 'teacher', group: '1C', name: 'Mtra. Nombre Apellido (1C)' }
   ```
4. En el Apps Script, agregar `'1C'` al array `TABS` y republicar
