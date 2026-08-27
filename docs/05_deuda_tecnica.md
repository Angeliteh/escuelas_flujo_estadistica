# 05 — Deuda Técnica y Próximos Pasos

Esto documenta las limitaciones actuales del sistema y qué se necesitaría para resolverlas si el proyecto evoluciona.

---

## 🔴 Crítico (si va a producción real con datos sensibles)

### Seguridad: contraseñas en texto plano
**Problema:** Las contraseñas están escritas directamente en `app.js`. Cualquiera que abra las DevTools del navegador (F12 → Sources → app.js) las ve.

**Impacto:** Un maestro técnico podría ver las credenciales de la directora o de otros maestros.

**Solución posible:**
- Autenticación con Google OAuth2 ("Iniciar sesión con Google")
- O mover el login a un backend real (Firebase Authentication, por ejemplo)
- Para un contexto escolar con datos no ultra-sensibles, la solución actual puede ser aceptable si la app no se hospeda públicamente

---

### El Apps Script corre con permisos de "cualquier persona"
**Problema:** La URL del Apps Script es pública. Cualquiera que conozca la URL puede leer todos los datos de la escuela.

**Solución posible:** Agregar un token secreto en cada petición que el panel envíe y que el Apps Script valide antes de responder.

```javascript
// En app.js, agregar a cada fetch:
body: JSON.stringify({ action: 'getStudents', token: 'MI_TOKEN_SECRETO' })

// En Apps Script, verificar:
if (params.token !== 'MI_TOKEN_SECRETO') return respond({ error: 'No autorizado' }, 403);
```

Esto no es seguridad perfecta pero es 10x mejor que nada para este contexto.

---

## 🟡 Importante (afecta la experiencia de uso)

### Sin sincronización en tiempo real
**Problema:** Si el maestro 1A agrega un alumno mientras la directora tiene el panel abierto, la directora no verá ese alumno hasta que recargue la página.

**Solución simple (polling):** Agregar en `app.js`:
```javascript
// Recargar datos cada 60 segundos si hay sesión activa
setInterval(async () => {
  if (currentUser) {
    await fetchAllStudents();
    if (currentUser.role === 'director') renderDirectorTable();
    else renderTeacherTable();
  }
}, 60000);
```

### El panel se abre como archivo local (`file:///`)
**Problema:** Esto causa advertencias de "Tracking Prevention" en Edge/Chrome y puede limitar algunas funciones del navegador.

**Solución:** Subir los 3 archivos a **GitHub Pages** (gratis):
1. Crear repositorio en GitHub
2. Subir `index.html`, `styles.css`, `app.js` y la carpeta `docs/`
3. Activar GitHub Pages en Settings → Pages
4. URL resultante: `https://tu-usuario.github.io/control-escolar/`

Los maestros y la directora accederían a esa URL desde cualquier dispositivo, sin necesidad de instalar nada.

---

## 🟢 Mejoras deseables (para el futuro del ciclo escolar)

### Seguimiento de estado de alumnos a lo largo del ciclo
**Necesidad expresada:** Los datos se usarán para marcar bajas, inscripciones, cambios de grupo, etc.

**Columnas a agregar en el Sheet y el formulario:**
- `STATUS` — Activo / Baja / Transferido / Egresado
- `FECHA_STATUS` — Cuándo cambió el estado
- `OBSERVACIONES` — Notas libres

### Historial de cambios
**Necesidad:** Saber quién modificó qué y cuándo.

**Solución:** Agregar en el Apps Script un registro automático en una hoja separada llamada `HISTORIAL` cada vez que se guarda o elimina un alumno.

### Exportación con formato oficial (logo + membrete)
**Necesidad:** El Excel exportado desde el panel no tiene el logo de la escuela.

**Solución:** Usar la librería **ExcelJS** (más potente que SheetJS) o generar el archivo directamente desde el Apps Script para que herede el formato del Sheet.

### Asistencia por período
**Necesidad futura posible:** Marcar asistencia diaria o por período.

**Consideración:** Esto sería un sistema completamente diferente al de registro de alumnos. Requeriría un diseño propio.

### Vista de impresión del maestro
**Necesidad:** Los maestros podrían necesitar imprimir su lista con el encabezado de la escuela.

**Solución más simple:** Agregar un botón "Ver en Google Sheets" que abra directamente la pestaña de su grupo (`https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID_DE_1A}`). La directora les daría acceso de solo lectura a su pestaña específica.

---

## Cambios que requieren actualizar el Apps Script

Cada vez que se cambia la estructura de columnas en el Sheet, se deben actualizar **en conjunto**:

| Qué cambió | Dónde actualizar |
|------------|-----------------|
| Agregar columna | `objectToRow()`, `rowToObject()` en Apps Script + formulario HTML + `saveStudent()` en app.js |
| Cambiar `HEADER_ROW` | Solo en Apps Script (variable `const HEADER_ROW`) |
| Agregar grupo nuevo | Array `TABS` en Apps Script + `GROUPS_LIST` y `USERS` en app.js |
| Cambiar URL del Script | Solo `API_URL` en app.js |

Siempre publicar **nueva versión** después de cambiar el Apps Script.
