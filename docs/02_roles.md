# 02 — Roles, permisos y responsabilidades

> Contrato funcional vigente desde V11. Las reglas inmutables del sistema están en [13_contrato_operativo.md](./13_contrato_operativo.md).

## Matriz vigente

| Capacidad | Maestro | Dirección / subdirección | Responsable técnico |
|---|---:|---:|---:|
| Entrar al panel | Sí | Sí | Sólo para soporte controlado |
| Ver alumnos | Sólo su grupo | Toda la escuela | Sólo cuando el soporte lo requiera |
| Inscribir alumno | Sí, únicamente en su grupo | Sí, eligiendo primero un grupo | No como operación cotidiana |
| Editar ficha | Sí, únicamente en su grupo | Sí, cualquier grupo | Sólo corrección técnica autorizada |
| Capturar/corregir asistencia | Sí, su grupo | Consulta; la captura ordinaria corresponde al maestro | Sólo soporte autorizado |
| Dar de baja o reactivar | No | Sí | Sólo reparación técnica autorizada |
| Transferir, cambiar grupo o egresar | No | Sí, cuando exista el flujo controlado | Sólo reparación técnica autorizada |
| Cerrar/promover ciclo | No | Sí, cuando exista el flujo controlado | Acompaña y valida la primera ejecución |
| Ver personal | No | Sí | Sólo soporte autorizado |
| Editar el Google Sheet | No | Evitar durante la operación normal | Sí, con respaldo y procedimiento |
| Publicar Apps Script / frontend | No | No | Sí |

## Maestro

El maestro trabaja exclusivamente con el grupo asignado a su usuario.

Puede:

- consultar resumen, padrón y fichas de su grupo;
- inscribir un alumno en su grupo;
- completar o corregir los datos de esos alumnos;
- registrar, corregir, consultar e imprimir asistencia;
- imprimir el padrón y las fichas disponibles.

Cuando pulsa **Inscribir alumno**, el sistema asigna grado y grupo desde su sesión y crea conjuntamente:

1. la fila oficial del alumno;
2. su `ALUMNO_ID` permanente;
3. la inscripción `ACTIVO` del ciclo vigente;
4. el movimiento `ALTA`.

El maestro no elige libremente el estado ni debe editar las columnas técnicas. Una baja, transferencia, reingreso, egreso o cambio de ciclo es una decisión administrativa de dirección.

## Dirección / subdirección

La cuenta interna `directora` representa actualmente a la subdirectora responsable. Puede:

- consultar dashboard, grupos, todos los alumnos, personal y asistencia mensual;
- abrir, editar e imprimir cualquier ficha;
- inscribir desde **Grupos → grupo seleccionado → Alumnos → Inscribir alumno**;
- dar de baja y consultar **Bajas e inactivos**;
- reactivar conservando identidad, inscripción y asistencia;
- auditar el Sheet y solicitar correcciones técnicas;
- operar en el futuro transferencia, cambio de grupo, promoción y egreso.

El estado escolar no es un campo de captura común. Dirección ejecuta acciones con fecha y motivo; Apps Script actualiza el estado vigente, la inscripción y la bitácora en conjunto.

## Responsable técnico

Administra código, despliegues, respaldos, analizadores y migraciones. No debe usar acceso técnico para sustituir la operación escolar ordinaria. Toda corrección directa requiere:

1. objetivo y registros exactos;
2. respaldo reciente;
3. preanálisis cuando exista;
4. verificación de totales y relaciones;
5. documentación del resultado.

## Acceso al Sheet

- Los maestros no reciben permiso directo al archivo.
- Dirección puede conservar acceso para consulta, impresión y auditoría, pero debe operar normalmente desde el panel.
- Las columnas `U:AA` y las hojas que comienzan con `_` son técnicas; ocultarlas evita accidentes, pero no constituye seguridad.
- Nadie debe cambiar manualmente `ALUMNO_ID`, `ESTATUS`, inscripciones, movimientos o asistencia histórica.

## Credenciales actuales de prueba

| Usuario | Contraseña | Alcance |
|---|---|---|
| `directora` | `director2025` | Toda la escuela |
| `1A` … `6B` | `maestro2025` | Grupo igual al usuario |

Estas credenciales están en `app.js` y son visibles desde el navegador. Sirven únicamente para operación interna controlada. Antes de una entrega con seguridad real se necesita autenticación y autorización en el backend; ocultar botones no sustituye ese control.

## Alta de un grupo nuevo

Agregar, por ejemplo, `1C` exige una sola modificación coordinada:

1. crear la pestaña oficial con la misma estructura;
2. agregar `1C` a `GROUPS_LIST` y al catálogo `USERS` del frontend;
3. agregar `1C` a `TABS` en Apps Script;
4. definir docente y permisos;
5. validar lectura, alta, asistencia e impresión;
6. desplegar conservando las URLs existentes.

No basta con crear una pestaña manualmente: grupo, usuario, API y documentación deben mantenerse alineados.
