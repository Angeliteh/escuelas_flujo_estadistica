# 05 — Deuda Técnica y Próximos Pasos

Esto documenta las limitaciones actuales del sistema y qué se necesitaría para resolverlas si el proyecto evoluciona.

---

## 🔴 Crítico (si va a producción real con datos sensibles)

### Seguridad: instalar el control de acceso V11.1
**Estado del código:** resuelto localmente. Las contraseñas dejaron de estar en `app.js`; Apps Script guarda hashes privados, emite sesiones temporales y valida rol y grupo en cada petición.

**Pendiente operativo:** publicar e instalar las cuentas sin copiar contraseñas al repositorio. Hasta completar [15_acceso_seguro.md](./15_acceso_seguro.md), la producción existente conserva su riesgo anterior.

---

### URL pública de Apps Script
**Estado del código:** V11.1 deja público únicamente `ping` sin datos sensibles. Cualquier consulta o modificación escolar exige una sesión válida; el servidor limita al docente a su grupo y a Dirección a sus operaciones administrativas.

**Límite futuro:** para múltiples escuelas, recuperación de contraseña, auditoría institucional o requisitos más estrictos se recomienda identidad centralizada y una base de datos con auditoría.

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
**Estado:** resuelto como base en V11 sin modificar el formato administrativo visible. Las columnas técnicas ocultas `U:AA` ya almacenan identidad, estatus, ciclo y fechas; `_INSCRIPCIONES` y `_MOVIMIENTOS_ALUMNO` conservan la relación histórica.

**Pendiente:** implementar Transferencia, Cambio de grupo, Promoción, No promoción y Egreso como acciones completas. No se debe agregar un selector libre de estado ni duplicar `ESTATUS` en las columnas visibles.

### Historial de cambios
**Necesidad:** Saber quién modificó qué y cuándo.

**Solución:** Agregar en el Apps Script un registro automático en una hoja separada llamada `HISTORIAL` cada vez que se guarda o elimina un alumno.

### Reportes impresos con formato oficial
**Necesidad:** Los trabajadores necesitan copias físicas para auditoría o referencia, pero no archivos Excel paralelos.

**Estado:** El panel imprime el padrón con los datos completos y genera listas diaria/mensual de asistencia. Google Sheets sigue disponible para auditoría de dirección.

### Asistencia por período
**Necesidad futura posible:** Marcar asistencia diaria o por período.

**Estado actual:** El panel incluye captura diaria por grupo con dos marcas: ✓ Asistió y X No asistió. También tiene vista mensual, impresión y almacenamiento local temporal.

**Estado publicado:** V9 usa una hoja técnica oculta por mes, conserva las matrices visibles por grupo como reportes y ya fue instalada y verificada en el Sheet real.

### Vista de impresión del maestro
**Estado:** Resuelto en el panel. El maestro puede imprimir padrón, lista diaria e historial mensual sin abrir Sheets ni crear copias de Excel.

---

## Respaldo y evolución de datos

Google Sheets funciona como fuente operativa para el tamaño actual, pero no debe ser el único respaldo. V9 tiene una copia completa inicial, respaldo automático nocturno y retención de 30 snapshots. La restauración no se probará sobre el archivo oficial; queda pendiente abrir o duplicar una copia de forma aislada. V10 conserva estas funciones. Ver [09_respaldos_y_restauracion.md](./09_respaldos_y_restauracion.md).

V11 conserva `alumnoId`, `estatus`, `cicloEscolar`, fechas de alta/actualización y usuario responsable sin modificar las 20 columnas visibles. La auditoría de V11 descubrió 21 valores heredados en `2A` que V10 había aceptado como ID; fueron reparados y la comprobación final confirmó 272 de 272 IDs válidos. El procedimiento y la incidencia están registrados en [12_inscripciones_y_movimientos_v11.md](./12_inscripciones_y_movimientos_v11.md).

Una base de datos como PostgreSQL/Neon o Supabase será recomendable cuando se necesiten varias escuelas, permisos reales, alta concurrencia, auditoría formal o integraciones. No es necesario migrar ahora: identidad, inscripciones y movimientos con IDs permanentes ya están implementados. Sheets continuará después como reporte/exportación aunque cambie la fuente primaria. Ver [11_modelo_control_escolar_y_movimientos.md](./11_modelo_control_escolar_y_movimientos.md).

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
