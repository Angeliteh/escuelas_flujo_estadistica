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
**Estado:** Resuelto para la operación actual. El sitio está publicado en Vercel y se debe compartir `https://asistpanel.vercel.app/`.

Abrir el HTML directamente sigue siendo útil para revisar la interfaz, pero no es el modo recomendado para capturar datos reales porque cada dispositivo tendría su propio caché local.

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

### Reportes impresos con formato oficial
**Necesidad:** Los trabajadores necesitan copias físicas para auditoría o referencia, pero no archivos Excel paralelos.

**Estado:** El panel imprime el padrón con los datos completos y genera listas diaria/mensual de asistencia. Google Sheets sigue disponible para auditoría de dirección.

### Asistencia por período
**Necesidad futura posible:** Marcar asistencia diaria o por período.

**Estado actual:** El panel incluye captura diaria por grupo con dos marcas: ✓ Asistió y X No asistió. También tiene vista mensual, impresión y almacenamiento local temporal.

**Estado publicado:** V8 reportado por el propietario, conservando el comportamiento V7 de asistencia. La asistencia se escribe en la hoja mensual existente del grupo (`ASISTENCIA (1A)`, `ASISTENCIA (2B)`, etc.) y el historial se obtiene en una sola consulta. V9 local ya separa el historial en una hoja técnica oculta por mes, pero aún requiere instalación y prueba en el Sheet real.

### Vista de impresión del maestro
**Estado:** Resuelto en el panel. El maestro puede imprimir padrón, lista diaria e historial mensual sin abrir Sheets ni crear copias de Excel.

---

## Respaldo y evolución de datos

Google Sheets funciona como fuente operativa para el tamaño actual, pero no debe ser el único respaldo. V8 fue actualizado por el propietario y contiene una copia completa inicial, respaldo automático nocturno y retención de 30 snapshots; todavía falta verificar que `setupBackups()` se ejecutó, que existe el snapshot inicial y que una restauración funciona. V9 local conserva estas funciones. Ver [09_respaldos_y_restauracion.md](./09_respaldos_y_restauracion.md).

Antes de construir validaciones entre filas o tablas, conviene agregar un identificador estable por alumno. El `rowId` actual representa la fila física de la hoja y puede cambiar si se reorganizan filas; no debe usarse como identidad histórica. También serán útiles `fechaCreacion`, `fechaActualizacion`, `actualizadoPor` y `estatus`.

Una base de datos como PostgreSQL/Neon o Supabase será recomendable cuando se necesite historial de cambios, permisos reales por usuario, concurrencia, auditoría o integraciones. No es necesario migrar antes de validar el flujo escolar actual; primero conviene estabilizar el modelo y automatizar respaldos.

### Asistencia: módulo separado

El Word de agosto de 2026 contiene una matriz mensual por grupo, con días y espacios para actividad, puntualidad, notas y asistencia. No debe convertirse en columnas dentro de la hoja maestra de alumnos. Debe existir una tabla o pestaña independiente de asistencia, relacionada por `alumnoId`, `grupo` y `fecha`, y el formato mensual debe generarse como vista de impresión.

---

## Cambios que requieren actualizar el Apps Script

Cada vez que se cambia la estructura de columnas en el Sheet, se deben actualizar **en conjunto**:

| Qué cambió | Dónde actualizar |
|------------|-----------------|
| Agregar columna | `objectToRow()`, `rowToObject()` y rangos de lectura/borrado en Apps Script + formulario HTML + `saveStudent()`/impresión en `app.js` |
| Cambiar `HEADER_ROW` | Solo en Apps Script (variable `const HEADER_ROW`) |
| Agregar grupo nuevo | Array `TABS` en Apps Script + `GROUPS_LIST` y `USERS` en app.js |
| Cambiar URL del Script | Solo `API_URL` en app.js |

Siempre publicar **nueva versión** después de cambiar el Apps Script.

Para el plan completo de estabilización, respaldo, migración a base de datos, módulos escolares y soporte multi escuela, consultar [08_handoff_y_escalabilidad.md](./08_handoff_y_escalabilidad.md).
