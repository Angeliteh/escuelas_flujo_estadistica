# 07 — Estado Actual del Proyecto

> Última actualización: 28 de agosto 2026
> Objetivo: Panorama completo para operar la primera escuela y preparar la evolución del sistema.

---

## ✅ Lo que ya está funcionando

### Panel del Maestro
- [x] Login con usuario/contraseña por grupo
- [x] Pantalla inicial **Resumen** con identidad del grupo, docente, ciclo, estadísticas y accesos rápidos
- [x] Vista del grupo con estadísticas (total, H, M, becas)
- [x] Tabla de alumnos (solo los de su grupo)
- [x] Buscador por nombre/CURP
- [x] **Modal central unificado** — agregar, editar y ver datos de alumno con mayor espacio horizontal
- [x] Los alumnos existentes abren primero como **ficha de lectura**; la edición se habilita con una acción explícita
- [x] Impresión individual en formato A4 con información escolar, datos del alumno, tutor, contacto y espacio para fotografía
- [x] Inscripción automática en su grupo: crea identidad, inscripción activa y movimiento `ALTA`
- [x] Las bajas y reingresos quedan reservados a dirección
- [x] Todo lo que se escribe se convierte a MAYÚSCULAS automáticamente
- [x] Imprimir padrón del grupo con los datos completos
- [x] Pestaña **Asistencia** con captura diaria del grupo asignado
- [x] Dos marcas de asistencia: ✓ Asistió y X No asistió
- [x] Guardado local para continuar capturando si falla internet
- [x] Impresión de la lista del día desde el panel
- [x] Logout

### Panel de la Directora
- [x] Login con usuario/contraseña de directora
- [x] Dashboard con 4 métricas clave y 4 gráficas (Chart.js)
- [x] **Pestaña "Grupos"** con tarjetas para 1A a 6B, docente asignado y estadísticas por grupo
- [x] Cada tarjeta abre un modal de grupo con pestañas **Resumen**, **Alumnos** y **Asistencia mensual**
- [x] La asistencia mensual se consulta dentro del modal sin abandonar la pestaña Grupos
- [x] Estadísticas compatibles con variantes existentes del Sheet (`H`, `M`, hombre, mujer, SI y nombres de beca)
- [x] **Pestaña "Todos los Alumnos"** con las 20 columnas completas (como la hoja oficial)
- [x] **Filtros rápidos tipo píldora** para Grado (1° al 6°) y Grupo (A / B)
- [x] Filtros adicionales por Género y Beca (dropdown)
- [x] Búsqueda libre por nombre, CURP o tutor
- [x] Clic en fila → Ficha modal con lectura, edición e impresión controladas
- [x] Inscripción desde la pestaña Alumnos del grupo seleccionado
- [x] Baja lógica, consulta de inactivos y reactivación conservando historial
- [x] Botón "Ver en Sheets" → Google Sheet en vivo
- [x] Impresión del padrón desde la pestaña "Todos los Alumnos"
- [x] Pestaña "Personal" en modo solo lectura
- [x] Logout

### Sincronización con Google Sheets
- [x] Los maestros registran datos → van al Sheet vía Apps Script
- [x] La directora lee del mismo Sheet → ve datos en tiempo real (al cargar/recargar)
- [x] El Sheet tiene el formato oficial con logo de la escuela
- [x] Apps Script V11 publicado; conserva `historical-events-v1`, identidad, inscripciones y movimientos
- [x] Historial mensual optimizado a una sola consulta
- [x] El panel refleja marcas eliminadas directamente en Sheets al sincronizar en línea

---

## 🟡 Pendiente / Por verificar antes de entregar

### Funcional
- [x] **Resolver el cambio de agosto a septiembre** mediante el historial mensual V9.
- [x] Ejecutar la migración inicial de agosto; no había registros pendientes por migrar (`migratedRecords: 0`).
- [ ] Comprobar con uso real que consultar o imprimir agosto sigue funcionando después de iniciar septiembre.
- [x] V9 preparado localmente con una hoja técnica oculta por mes para todos los grupos.
- [x] Simulación local superada: agosto se conserva al guardar septiembre y borrar septiembre no afecta agosto.
- [x] `setupAttendanceHistoryV9()` ejecutado en el Sheet real y V9 publicado; API verificada con `historical-events-v1`.
- [x] Corrección desde el panel preparada: tocar de nuevo ✓ o X limpia la marca y la devuelve a pendiente.
- [ ] **Verificar que el drawer de edición guarda correctamente** — probar ciclo completo: editar alumno → guardar → verificar en Sheet
- [ ] **Probar un alta controlada** — confirmar fila, ID, inscripción `ACTIVO` y movimiento `ALTA`
- [ ] **Probar desde dispositivo móvil** — abrir `index.html` en el teléfono para ver si el layout responde bien
- [ ] Probar los 12 grupos y sus hojas mensuales de asistencia

### Acceso para pruebas
- [x] Sitio publicado en Vercel: `https://asistpanel.vercel.app/`
- [x] Frontend con fichas y modal de grupos verificado en producción desde el commit `cb86bff`.
- [x] V11 instalada y publicada con identidad permanente, inscripciones y movimientos.

| Opción | Esfuerzo | Acceso |
|--------|---------|--------|
| **A) Archivo compartido por WhatsApp** | Muy bajo | Descargar el .html y abrirlo en el navegador |
| **B) Vercel conectado al repositorio** | Bajo | URL pública desde cualquier dispositivo |
| **C) Servidor local en tu PC** | Bajo | Solo quien esté en la misma red Wi-Fi |

> **Actual:** el repositorio está conectado a Vercel. Cada push a `main` genera una nueva implementación.

### UX pendiente de revisión
- [x] Revisar que la ficha modal del maestro funcione para **Inscribir** (modo vacío) además de editar
- [x] Verificar que al guardar desde el drawer se refresca la tabla del maestro correctamente
- [x] Diseñar la primera vista diaria del módulo de asistencia a partir del formato Word
- [x] Preparar cola local para captura sin internet
- [x] Pegar y publicar V7 del Apps Script para usar las hojas mensuales `ASISTENCIA (GRUPO)` existentes y consultar el mes en una sola petición
- [x] Diseñar reporte mensual con la matriz imprimible del formato Word

---

## 🔴 Limitaciones conocidas (no bloqueantes para pruebas)

| Limitación | Impacto | Solución futura |
|------------|---------|-----------------|
| Contraseñas en texto plano en app.js | Cualquier maestro técnico puede ver la de la directora | Autenticación real (Firebase, Google OAuth) |
| Apps Script URL pública | Alguien con la URL puede leer todos los datos | Agregar token secreto en cada petición |
| Sin sincronización automática | La directora necesita recargar para ver cambios de maestros | Polling cada 60 segundos |
| Personal en blanco si la columna Nombre está vacía | La hoja oficial tiene funciones precargadas pero nombres pendientes | Capturar nombres en la columna B o ajustar la política de filas del Apps Script |
| Restauración todavía no ensayada | Las copias existen, pero falta demostrar su recuperación | Abrir o duplicar un respaldo de forma aislada, sin reemplazar el Sheet oficial |
| Matrices visibles regenerables | Una edición manual directa puede ser reemplazada por el historial técnico | Corregir asistencia desde el panel y mantener la matriz como reporte |
| Transferencia y cambio de grupo pendientes | Todavía no existe la acción administrativa completa con origen/destino | Construirla sobre inscripciones y movimientos antes de habilitarla |
| Datos escolares todavía concentrados en un Sheet | Limita historial, concurrencia, permisos y reportes complejos | Migrar gradualmente a una base de datos real |

---

## 📋 Cómo dar acceso para pruebas (paso a paso)

### Opción A — Compartir el archivo
1. Copiar el `index.html`, `styles.css` y `app.js` en una carpeta ZIP
2. Compartir la carpeta por WhatsApp / Drive
3. El maestro descarga, abre el `.html` con doble clic
4. **Limitación:** cada quien tiene sus propios datos en localStorage (no comparten datos entre dispositivos)
> ⚠️ Esto no es útil para probar sincronización real. Es solo para revisar la interfaz.

### Opción B — Vercel (actual)
1. Crear cuenta en [github.com](https://github.com) si no tienes
2. Crear repositorio nuevo (ej: `control-asistencia`)
3. Subir: `index.html`, `styles.css`, `app.js`
4. Hacer push a `main`; Vercel crea la implementación automáticamente
5. Abrir `https://asistpanel.vercel.app/`
6. Compartir la URL con maestros y directora
> ✅ Todos acceden desde su celular/computadora al mismo panel. Los datos van al mismo Google Sheet.

---

## Respaldo y restauración

- [x] Código V9 actualizado por el propietario con snapshot inicial, copias nocturnas y retención de 30 copias.
- [x] Procedimiento de verificación y restauración documentado.
- [x] `setupBackups()` ejecutado correctamente con la cuenta propietaria el 28 de agosto de 2026.
- [x] Snapshot `INICIAL` creado y activador `runNightlyBackup` programado alrededor de las 02:00.
- [ ] Hacer después una prueba no destructiva abriendo o duplicando un respaldo; nunca reemplazar el Sheet principal durante la prueba.

---

## Identidad V10 instalada

- [x] Código V10 publicado conserva respaldos e historial mensual V9.
- [x] Migración no destructiva diseñada para mantener intactas las columnas visibles `A:T`.
- [x] Frontend preparado para preferir `alumnoId` y seguir siendo compatible con V9.
- [x] `setupStudentIdentityV10` ejecutado: 253 alumnos recibieron ID durante esa ejecución.
- [x] API pública verificada: 272 alumnos activos y 0 inconsistencias de grado/grupo.
- [x] Auditoría estricta posterior detectó 21 valores heredados inválidos en `2A`; fueron reparados y la comprobación final confirmó 272 IDs permanentes válidos de 272 alumnos.
- [x] V10 publicada conservando la misma URL `/exec`.
- [x] El frontend cambia automáticamente “Eliminar” por “Dar de baja” cuando detecta V10 lista.
- [ ] Agregar la consulta y reactivación de alumnos inactivos después de confirmar V10.

### Fase siguiente acordada

- [x] Modelo de control escolar y criterios de migración definidos en [11_modelo_control_escolar_y_movimientos.md](./11_modelo_control_escolar_y_movimientos.md).
- [ ] Crear `_INSCRIPCIONES` para separar alumno, ciclo y grupo.
- [ ] Crear `_MOVIMIENTOS_ALUMNO` como historial append-only.
- [ ] Implementar consulta/reactivación de bajas.
- [ ] Implementar cambio de grupo y transferencia sin cambiar `ALUMNO_ID`.
- [ ] Implementar cierre de ciclo, promoción, repetición y egreso con vista previa.
- [ ] Añadir auditoría y exportación administrativa controlada.

### V11 instalada, publicada y verificada

- [x] Preanálisis bloquea inconsistencias antes de escribir.
- [x] Simulación idempotente de `_INSCRIPCIONES` y `_MOVIMIENTOS_ALUMNO` superada.
- [x] Simulación de baja y reingreso superada.
- [x] Panel administrativo de inactivos preparado y oculto mientras V11 no esté activa.
- [x] Ejecutar la auditoría y reparación de 21 IDs heredados en Apps Script real.
- [x] Ejecutar el preanálisis de inscripciones en Apps Script real: 272 alumnos y cero problemas.
- [x] Crear 272 inscripciones y 272 movimientos iniciales; 272 activas y cero duplicados.
- [x] Crear respaldo manual previo `Control asistencia — RESPALDO — MANUAL — 2026-08-28_192232`.
- [x] Publicar V11 conservando la misma URL `/exec`; `ping` y relación alumno → inscripción → movimiento verificados.

---

## Historial de decisiones importantes

| Decisión | Por qué |
|----------|---------|
| Modal central para la ficha del alumno | Los datos completos necesitan más ancho y una jerarquía de lectura más clara que el antiguo panel lateral |
| Pestaña "Grupos" como navegación, no como otro filtro | Las tarjetas dan contexto y abren un mini panel del grupo; "Todos los Alumnos" conserva los filtros para búsquedas globales |
| Modal con pestañas para cada grupo | Mantiene a dirección dentro de Grupos y reúne resumen, alumnos y asistencia sin duplicar pantallas completas |
| Ficha individual basada en los campos actuales | Entrega lectura e impresión inmediata sin duplicar registros ni cambiar todavía la estructura del Sheet |
| Filtros tipo píldora en lugar de dropdowns | Más rápido, visual y moderno — 1 clic vs. expandir menú |
| Tabla de 20 columnas en la directora | La directora necesita ver TODOS los datos, no un resumen |
| Ficha modal editable para dirección | Usa el mismo registro e identidad sin duplicar pantallas ni datos |
| Todo en MAYÚSCULAS al escribir | Consistencia con el formato del Google Sheet |
| Personal en modo solo lectura inicialmente | Evita modificar datos laborales hasta confirmar el proceso administrativo |
| Asistencia separada del catálogo de alumnos | Permite múltiples registros por alumno sin duplicar datos |
