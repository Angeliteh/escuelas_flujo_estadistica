# 09 — Respaldos y restauración

## Objetivo

Proteger el archivo operativo ante borrados accidentales, fórmulas o formatos dañados y cambios administrativos equivocados. Google Sheets continúa siendo la fuente oficial; las copias de Drive son puntos de restauración independientes y no se sincronizan con el original.

## Política introducida en V8 y conservada en V9/V10

| Elemento | Configuración |
|---|---|
| Copia inicial | Se crea al ejecutar `setupBackups()` |
| Frecuencia | Diaria, alrededor de las 02:00 |
| Zona horaria | `America/Mexico_City` |
| Contenido | Archivo completo: alumnos, personal, asistencia, formato y demás pestañas |
| Destino | Carpeta privada `Respaldos Control Asistencia` en Mi unidad del propietario |
| Retención | 30 snapshots administrados |
| Eliminación | Las copias que exceden la retención se mueven a la papelera |
| Acceso desde el panel | Ninguno; el panel público no puede crear ni enumerar respaldos |

Las copias nuevas consumen almacenamiento de la cuenta propietaria. Las copias que exceden la retención se mueven a la papelera para que todavía puedan recuperarse, pero continúan ocupando espacio hasta que Drive las elimine definitivamente o se vacíe la papelera. Durante el piloto se debe revisar periódicamente `drive.google.com/drive/quota` y ajustar `BACKUP_RETENTION` si fuera necesario.

## Instalación inicial

> **Estado:** completada correctamente el 28 de agosto de 2026. Se confirmó la carpeta `Respaldos Control Asistencia`, un snapshot `INICIAL`, retención de 30 y ejecución diaria alrededor de las 02:00 en `America/Mexico_City`.

1. Pegar el código vigente indicado en [04_apps_script.md](./04_apps_script.md) en el Apps Script vinculado al Sheet oficial. V9 y la candidata V10 conservan las funciones de respaldo de V8.
2. Guardar el proyecto.
3. Seleccionar `setupBackups` y pulsar **Ejecutar**.
4. Aceptar los permisos solicitados por Google para Sheets y Drive.
5. Confirmar una ejecución exitosa y abrir la carpeta creada en Mi unidad.
6. Verificar que exista una copia con nombre parecido a `Control asistencia — RESPALDO — INICIAL — 2026-08-28_...`.
7. Ejecutar `getBackupStatus` y confirmar `totalManagedBackups >= 1` y `lastSuccessAt` con fecha reciente.
8. En Apps Script, abrir **Activadores** y comprobar que `runNightlyBackup` tenga un activador basado en tiempo, diario.

Ejecutar `setupBackups` de nuevo no crea activadores duplicados, aunque sí genera un nuevo snapshot inicial. El activador corre con la cuenta que lo instaló; esa cuenta debe conservar acceso al archivo y espacio disponible en Drive.

## Comprobación periódica

Una vez por semana durante el piloto:

1. Ejecutar `getBackupStatus`.
2. Confirmar que `lastSuccessAt` corresponda a la noche anterior.
3. Abrir la copia más reciente y revisar al azar una hoja de alumnos y una de asistencia.
4. Revisar **Ejecuciones** en Apps Script si la fecha no avanzó.

No basta con ver que la carpeta existe: una restauración sólo es confiable si una copia reciente abre y contiene datos legibles.

## Restauración segura

### Caso A: se borraron o dañaron datos, pero el archivo oficial todavía abre

1. Detener temporalmente la captura en el panel.
2. Ejecutar `createManualBackup` para conservar también el estado dañado como evidencia.
3. Abrir el snapshot anterior al incidente y localizar las pestañas afectadas.
4. Preferir el historial de versiones de Sheets si el cambio es pequeño y se identifica con certeza.
5. Para una afectación amplia, copiar únicamente las hojas o rangos correctos del snapshot hacia el archivo oficial, conservando el ID del archivo original.
6. Comprobar alumnos, folios, personal y al menos una fecha de asistencia.
7. Consultar el panel con recarga forzada y confirmar que muestra el estado restaurado.
8. Ejecutar `createManualBackup` otra vez con el estado ya corregido y reanudar la captura.

Conservar el ID del archivo oficial evita cambiar `API_URL`, la implementación de Apps Script y los enlaces compartidos.

### Caso B: el archivo oficial fue enviado a la papelera

1. Restaurarlo desde la papelera de Drive.
2. Confirmar que conserva el mismo ID y abre correctamente.
3. Probar la URL `/exec?action=ping` y una consulta desde el panel.
4. Si faltan datos, aplicar el procedimiento del Caso A.

### Caso C: el original no puede recuperarse

1. Hacer una copia de trabajo del snapshot elegido; no editar el snapshot de respaldo.
2. Abrir su Apps Script vinculado y revisar permisos, activadores y código.
3. Publicar una nueva implementación web y actualizar `API_URL` en `app.js`, porque la implementación del archivo original no se reconecta automáticamente.
4. Actualizar el enlace de Sheet para la directora.
5. Ejecutar `setupBackups` desde el nuevo archivo oficial.
6. Verificar de punta a punta: alta/edición de alumno, consulta y guardado de asistencia, personal e impresión.

## Alcance y límites

- Los snapshots nocturnos permiten volver a un estado anterior, pero no indican quién cambió cada celda.
- El historial de versiones de Google ayuda a identificar editores manuales, pero no sustituye una bitácora funcional del panel.
- La cola local del navegador protege capturas pendientes frente a una caída de red; no es un respaldo del archivo oficial.
- Las copias viven en la cuenta de Drive que instaló el activador. Para protegerse también ante pérdida total de esa cuenta se necesita una política institucional adicional de propiedad compartida o exportación externa.
- Los cierres mensuales del ciclo no deben depender de la retención nocturna: un cierre de agosto, septiembre, etc. necesita conservarse aparte durante todo el ciclo escolar.
- La siguiente capa recomendada es una bitácora append-only con fecha, usuario, acción y valores anterior/nuevo. Debe diseñarse junto con autenticación real; las credenciales actuales del frontend no permiten atribución fuerte.
