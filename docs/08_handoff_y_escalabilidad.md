# 08 — Handoff, estado real y hoja de ruta

> Documento principal para retomar el proyecto en una sesión futura.
>
> Última actualización: 28 de agosto de 2026.

## 1. Resumen en una frase

Control de Asistencia es un panel web para que maestros y administración gestionen alumnos y asistencia sin editar directamente el Google Sheet oficial; actualmente opera una escuela y está preparado para estabilizarse antes de convertirse en una plataforma multi escuela.

## 2. Estado real actual

### Producción

- Sitio: https://asistpanel.vercel.app/
- Repositorio: https://github.com/Angeliteh/escuelas_flujo_estadistica
- Rama activa: main
- Último commit funcional verificado: 43a73bf (optimización V7 de asistencia mensual)
- Despliegue: Vercel conectado al repositorio; cada push a main genera una nueva implementación.

### Escuela activa

- Nombre: Escuela Primaria Gral. Elpidio G. Velázquez
- CCT: 10DPR0519X
- Sector: 13
- Zona: 109
- Ciclo escolar: 2026-2027
- Alcance actual: una sola escuela y sus grupos 1A a 6B.

### Backend y datos

- Fuente operativa actual: un Google Sheet central.
- API actual: Google Apps Script publicado como Web App.
- URL de API:
  https://script.google.com/macros/s/AKfycbyFPxVLK2RpUPC91Y1JRfowXAf5aKThAk8ERFjgkNLf-jc1uEdzIoIU73mSJzLYJNC3Sw/exec
- Versión activa del Apps Script: V7.
- V7 fue verificado el 28 de agosto de 2026:
  - ping respondió HTTP 200.
  - getAttendanceMonth respondió success=true.
  - ASISTENCIA (2B), agosto de 2026, devolvió 21 días en una sola petición.
  - La respuesta indicó mode=formatted-monthly-sheet.

Comprobación mínima de continuidad para futuras sesiones:

```text
POST API_URL
{ "action": "ping" }

POST API_URL
{ "action": "getAttendanceMonth", "group": "2B", "month": "2026-08" }
```

La segunda respuesta debe tener `success: true`, `sheetName: "ASISTENCIA (2B)"`, `mode: "formatted-monthly-sheet"` y un arreglo de 21 fechas hábiles para agosto de 2026. Si devuelve `Acción no válida`, el despliegue de Apps Script no corresponde a V7.

### Estructura actual del Sheet

- Pestañas maestras de alumnos: 1A, 1B, 2A, 2B, 3A, 3B, 4A, 4B, 5A, 5B, 6A y 6B.
- Pestañas mensuales de asistencia esperadas: ASISTENCIA (1A) hasta ASISTENCIA (6B).
- Pestaña PERSONAL: consulta administrativa; la aplicación la mantiene en modo solo lectura.
- Los maestros no deben tener acceso de edición al Sheet.

## 3. Funciones ya implementadas

### Alumnos

- Login por usuario.
- Maestro limitado a su grupo.
- Administración puede consultar todos los grupos.
- Alta, edición y baja de alumnos desde el panel.
- Los campos del alumno son opcionales para permitir captura progresiva.
- Folio integrado en formulario, tablas, guardado e impresión.
- Filtros, búsqueda, estadísticas e impresión de padrón.
- Los cambios del panel se escriben en la hoja maestra mediante Apps Script.

### Asistencia

- El maestro captura únicamente su grupo.
- Registro diario por fecha.
- Solo dos estados oficiales: ✓ Asistió y X No asistió.
- No se permiten fechas futuras.
- Historial mensual con días hábiles.
- Impresión de lista diaria y matriz mensual.
- La matriz mensual usa la hoja oficial existente; el script no crea una hoja genérica.
- La vista mensual V7 se consulta en una sola petición.
- Si una marca se elimina directamente en Sheets, el panel la elimina de su caché al volver a sincronizar en línea.
- Las capturas locales pendientes se conservan hasta sincronizarse.

### Administración

- Dashboard general.
- Consulta global de alumnos.
- Consulta mensual de asistencia por grupo en modo solo lectura.
- Personal en modo solo lectura.
- Impresión de padrones y asistencia.
- Nombre actual mostrado: Norma Patricia Ortiz Cabrera.
- La llave interna de acceso continúa siendo directora para no romper el login.

## 4. Decisiones operativas vigentes

1. El panel es la herramienta normal de trabajo.
2. El Google Sheet es la fuente oficial operativa y respaldo manual, no la interfaz diaria de los maestros.
3. No se ofrecen descargas de Excel desde el panel para evitar copias desconectadas.
4. Se imprime desde el panel cuando se necesita una lista o padrón físico.
5. La asistencia se mantiene separada del catálogo de alumnos porque un alumno puede tener muchos registros por fecha.
6. La hoja mensual conserva el formato institucional para auditoría e impresión.
7. En asistencia, una celda vacía significa pendiente; ✓ significa asistió y X significa no asistió.
8. No se deben guardar anotaciones informales dentro del nombre del alumno. Las barreras, observaciones y situaciones administrativas deben tener campos propios.

## 5. Modelo actual y sus límites

### Catálogo de alumnos

La hoja maestra tiene 20 columnas:

NO., GRADO, GRUPO, FOLIO, NOMBRE, BARRERA DE APRENDIZAJE, FECHA DE NACIMIENTO, CURP, GÉNERO, BECA, PESO, ESTATURA, TALLA, TUTOR, TELÉFONO, CURP DEL TUTOR, CORREO, DOMICILIO, NIVEL DE ESTUDIO y OCUPACIÓN.

El rowId actual identifica la fila física de Sheets. Sirve para editar la fila actual, pero no es una identidad histórica estable. No debe usarse como clave definitiva si se reordenan filas o se migra la información.

### Asistencia

Hoy la asistencia se escribe en una matriz mensual con nombres en filas y fechas en columnas. Es adecuada para el formato que necesita la escuela, pero no es el modelo ideal para análisis histórico.

El modelo futuro debe tener un registro por evento:

fecha, escuelaId, cicloId, grupoId, alumnoId, estado, observación, usuarioId, creadoEn, actualizadoEn.

La matriz mensual debe ser una vista o reporte generado desde esos eventos, no la única fuente de información.

### Identidad y cambios

Actualmente el grupo se deriva de la pestaña y parte del ID contiene la fila. En la siguiente fase cada alumno debe tener un alumnoId permanente, además de:

- escuelaId
- cicloEscolarId
- grado y grupo actuales
- estatus
- fecha de alta
- fecha de baja o transferencia
- historial de cambios

## 6. Rendimiento actual

### Problema detectado y solución aplicada

El método anterior consultaba cada día hábil por separado. En una medición real, cinco consultas iguales tardaron entre 4.5 y 10.4 segundos cada una.

V7 agregó getAttendanceMonth, que lee encabezados, nombres y marcas de todo el mes en una sola ejecución. Tres pruebas reales devolvieron 21 días en aproximadamente 2.2, 2.4 y 3.4 segundos.

También se cambió la lectura de alumnos de asistencia para consultar solo la pestaña del grupo, en vez de leer las 12 pestañas en cada petición.

### Expectativa correcta

Apps Script puede tener arranques en frío y variación propia de la red. V7 reduce drásticamente las peticiones y la variabilidad, pero no garantiza tiempo cero. Si la escuela crece mucho, la asistencia y los catálogos deben migrar a un backend de base de datos.

## 7. Riesgos que todavía existen

### Seguridad

- Las contraseñas están en app.js y son visibles para quien inspeccione el navegador.
- La URL de Apps Script es pública y no tiene autenticación real por usuario.
- El frontend oculta opciones por rol, pero el control de seguridad no debe depender solo del navegador.

Esto es aceptable únicamente para una prueba interna controlada. Antes de operar varias escuelas o datos sensibles se necesita autenticación real, autorización en servidor, tokens y registro de auditoría.

### Integridad y auditoría

- No existe todavía un historial formal de quién cambió cada campo.
- El Sheet puede ser modificado manualmente por alguien con permisos.
- No existe un respaldo automático independiente ya configurado.
- localStorage ayuda ante una falla temporal, pero no reemplaza una base de datos ni un sistema de sincronización con resolución de conflictos.

### Operación

- Los cambios de alumnos hechos por otra persona no aparecen hasta recargar o volver a consultar.
- La asistencia offline depende del navegador y dispositivo donde se capturó.
- Personal sigue siendo consulta; antes de habilitar edición hay que confirmar el flujo administrativo.
- Todavía no existen módulos de calificaciones, documentos, expedientes, constancias ni eventos de altas y bajas.

## 8. Orden recomendado para escalar

### Fase 0 — Entrega controlada de esta escuela

1. Probar los 12 grupos con el usuario de cada maestro.
2. Confirmar que cada grupo tiene su pestaña maestra y su pestaña mensual.
3. Probar alta, edición, folio, impresión, asistencia diaria e historial.
4. Definir quién puede corregir asistencia pasada.
5. Configurar respaldos manuales antes de que comiencen a capturar datos reales.
6. Entregar la URL a la subdirectora y capacitarla con un flujo corto.

### Fase 1 — Estabilizar el modelo de datos

1. Crear IDs permanentes de escuela, ciclo, grupo y alumno.
2. Separar catálogo actual de historial de inscripciones.
3. Modelar altas, bajas, transferencias y cambios de grupo como eventos.
4. Definir catálogos controlados para género, beca, estatus y tipos de documento.
5. Crear una hoja o tabla de auditoría con usuario, acción, fecha, entidad y valores anteriores/nuevos.
6. Crear respaldos automáticos versionados y probar restauración.

### Fase 2 — Backend real

Migrar gradualmente la fuente primaria a PostgreSQL, Supabase, Neon u otra base de datos administrada cuando se requiera:

- múltiples escuelas;
- varios usuarios editando al mismo tiempo;
- permisos reales por escuela, grupo y módulo;
- historial de cambios;
- consultas entre tablas;
- reportes complejos;
- documentos relacionados;
- control de concurrencia y recuperación.

Google Sheets puede continuar como exportación, reporte e interfaz de auditoría de administración, pero no debe ser la base primaria de largo plazo.

### Fase 3 — Módulos escolares

El modelo debe prepararse para:

- ficha completa del alumno;
- contactos y tutores;
- historial de grupos e inscripciones;
- altas, bajas y transferencias;
- asistencia y puntualidad;
- calificaciones por ciclo, grado, materia, periodo y evaluación;
- observaciones académicas;
- barreras de aprendizaje y apoyos;
- expedientes y documentos;
- constancias, boletas y fichas imprimibles;
- reportes por alumno, grupo, grado, ciclo y escuela;
- dashboard de indicadores;
- almacenamiento de archivos con permisos;
- exportaciones oficiales controladas.

## 9. Multi escuela

No se debe duplicar el proyecto manualmente por escuela. El diseño futuro debe manejar una sola aplicación con aislamiento lógico:

- escuelaId en todas las entidades;
- usuarios relacionados con una o varias escuelas;
- permisos por escuela y grupo;
- ciclos escolares separados;
- configuración institucional por escuela;
- folios y claves sin colisiones;
- reportes filtrados por escuela;
- respaldo y restauración por escuela;
- almacenamiento de documentos separado por escuela.

La primera escuela sirve como piloto para validar el flujo, no como modelo definitivo de seguridad multi tenant.

## 10. Preguntas que deben resolverse con la escuela

Antes de cerrar el modelo definitivo hay que confirmar:

- ¿Qué significa exactamente el folio y quién lo asigna?
- ¿El grado y grupo cambian durante el ciclo?
- ¿Una baja conserva al alumno visible en el grupo anterior?
- ¿Qué estados de asistencia oficiales necesitan además de asistió/no asistió?
- ¿Una celda vacía es pendiente, no aplica o ausencia no capturada?
- ¿Quién puede corregir una asistencia de días pasados?
- ¿Qué documentos integran el expediente?
- ¿Qué campos son obligatorios al inscribir y cuáles pueden completarse después?
- ¿Qué reportes necesitan por día, semana, mes, bimestre y ciclo?
- ¿Qué información puede ver cada maestro y qué debe quedar solo para administración?

## 11. Cómo iniciar la próxima sesión

La próxima sesión debe comenzar leyendo este documento y verificando:

1. git status y el último commit.
2. La respuesta de ping de Apps Script.
3. La respuesta de getAttendanceMonth para un grupo.
4. El estado de producción en Vercel.
5. El objetivo de la fase en curso.

No cambiar la estructura de Sheets ni iniciar una migración de base de datos hasta definir los IDs permanentes, el historial y los permisos.
