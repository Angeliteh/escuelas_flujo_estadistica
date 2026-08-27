# 07 — Estado Actual del Proyecto

> Última actualización: 27 de agosto 2026  
> Objetivo: Panorama completo para terminar y entregar el sistema a prueba.

---

## ✅ Lo que ya está funcionando

### Panel del Maestro
- [x] Login con usuario/contraseña por grupo
- [x] Vista del grupo con estadísticas (total, H, M, becas)
- [x] Tabla de alumnos (solo los de su grupo)
- [x] Buscador por nombre/CURP
- [x] **Panel lateral unificado** — agregar, editar y ver datos de alumno (mismo componente)
- [x] Eliminación con modal de confirmación
- [x] Todo lo que se escribe se convierte a MAYÚSCULAS automáticamente
- [x] Exportar Excel de su grupo (XLSX local)
- [x] Logout

### Panel de la Directora
- [x] Login con usuario/contraseña de directora
- [x] Dashboard con 4 métricas clave y 4 gráficas (Chart.js)
- [x] **Pestaña "Todos los Alumnos"** con las 18 columnas completas (como el Excel)
- [x] **Filtros rápidos tipo píldora** para Grado (1° al 6°) y Grupo (A / B)
- [x] Filtros adicionales por Género y Beca (dropdown)
- [x] Búsqueda libre por nombre, CURP o tutor
- [x] Clic en fila → Panel lateral de solo lectura (todos los datos del alumno)
- [x] Botón "Ver en Sheets" → Google Sheet en vivo
- [x] Botón "Exportar Excel" (2 hojas: alumnos + resumen por grupo)
- [x] Logout

### Sincronización con Google Sheets
- [x] Los maestros registran datos → van al Sheet vía Apps Script
- [x] La directora lee del mismo Sheet → ve datos en tiempo real (al cargar/recargar)
- [x] El Sheet tiene el formato oficial con logo de la escuela

---

## 🟡 Pendiente / Por verificar antes de entregar

### Funcional
- [ ] **Verificar que el drawer de edición guarda correctamente** — probar ciclo completo: editar alumno → guardar → verificar en Sheet
- [ ] **Probar con datos reales** — limpiar datos de prueba (`localStorage.removeItem('students')`) y registrar 2-3 alumnos reales
- [ ] **Probar desde dispositivo móvil** — abrir `index.html` en el teléfono para ver si el layout responde bien

### Acceso para pruebas
- [ ] Decidir cómo van a acceder los maestros y la directora:

| Opción | Esfuerzo | Acceso |
|--------|---------|--------|
| **A) Archivo compartido por WhatsApp** | Muy bajo | Descargar el .html y abrirlo en el navegador |
| **B) Subir a GitHub Pages** | Bajo (30 min) | URL pública desde cualquier dispositivo |
| **C) Servidor local en tu PC** | Bajo | Solo quien esté en la misma red Wi-Fi |

> **Recomendado para pruebas: Opción B (GitHub Pages)**  
> Solo subes `index.html`, `styles.css` y `app.js` a un repositorio GitHub y activas Pages.  
> URL resultante: `https://tu-usuario.github.io/control-asistencia/`

### UX pendiente de revisión
- [ ] Revisar que el panel lateral del maestro funcione para **Agregar** (modo vacío) además de editar
- [ ] Verificar que al guardar desde el drawer se refresca la tabla del maestro correctamente

---

## 🔴 Limitaciones conocidas (no bloqueantes para pruebas)

| Limitación | Impacto | Solución futura |
|------------|---------|-----------------|
| Contraseñas en texto plano en app.js | Cualquier maestro técnico puede ver la de la directora | Autenticación real (Firebase, Google OAuth) |
| Apps Script URL pública | Alguien con la URL puede leer todos los datos | Agregar token secreto en cada petición |
| Sin sincronización automática | La directora necesita recargar para ver cambios de maestros | Polling cada 60 segundos |
| Archivo local (`file:///`) | Tracking Prevention warnings en Edge | Subir a GitHub Pages |

---

## 📋 Cómo dar acceso para pruebas (paso a paso)

### Opción A — Compartir el archivo
1. Copiar el `index.html`, `styles.css` y `app.js` en una carpeta ZIP
2. Compartir la carpeta por WhatsApp / Drive
3. El maestro descarga, abre el `.html` con doble clic
4. **Limitación:** cada quien tiene sus propios datos en localStorage (no comparten datos entre dispositivos)
> ⚠️ Esto no es útil para probar sincronización real. Es solo para revisar la interfaz.

### Opción B — GitHub Pages (recomendada)
1. Crear cuenta en [github.com](https://github.com) si no tienes
2. Crear repositorio nuevo (ej: `control-asistencia`)
3. Subir: `index.html`, `styles.css`, `app.js`
4. Ir a Settings → Pages → Source: `main` / `/ (root)` → Save
5. Esperar ~2 min, la URL estará en Settings → Pages
6. Compartir la URL con maestros y directora
> ✅ Todos acceden desde su celular/computadora al mismo panel. Los datos van al mismo Google Sheet.

---

## Historial de decisiones importantes

| Decisión | Por qué |
|----------|---------|
| Panel lateral unificado (eliminar modal flotante) | Redundancia: el modal central y el drawer hacían lo mismo |
| Eliminar pestaña "Por Grupo" | Redundante con los filtros de Grado/Grupo en "Todos los Alumnos" |
| Filtros tipo píldora en lugar de dropdowns | Más rápido, visual y moderno — 1 clic vs. expandir menú |
| Tabla de 18 columnas en la directora | La directora necesita ver TODOS los datos, no un resumen |
| Modo solo lectura en el drawer de directora | Misma interfaz, sin duplicar código |
| Todo en MAYÚSCULAS al escribir | Consistencia con el formato del Google Sheet |
