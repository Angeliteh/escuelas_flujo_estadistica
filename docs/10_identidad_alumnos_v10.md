# 10 — Identidad permanente de alumnos (V10)

> Estado al 28 de agosto de 2026: código preparado y validado localmente; **todavía no instalado ni publicado** en el Apps Script oficial.

## Objetivo

V10 elimina la dependencia histórica de la fila física. Cada alumno recibe un `ALUMNO_ID` permanente y conserva su identidad aunque se ordenen filas, cambie de grupo o avance el ciclo escolar.

La instalación es no destructiva:

- no mueve filas;
- no modifica las 20 columnas oficiales visibles `A:T`;
- no crea copias de alumnos;
- añade siete columnas técnicas ocultas `U:AA`;
- convierte los identificadores antiguos de asistencia (`1A-6`, por ejemplo) al nuevo ID permanente.

## Metadatos técnicos ocultos

| Columna | Campo | Uso |
|---|---|---|
| U | `ALUMNO_ID` | Identidad permanente `ALU-...` |
| V | `ESTATUS` | `ACTIVO`, `BAJA`, `TRANSFERIDO` o `EGRESADO` |
| W | `CICLO_ESCOLAR` | Ciclo del registro, inicialmente `2026-2027` |
| X | `FECHA_ALTA_SISTEMA` | Primera incorporación al sistema |
| Y | `FECHA_ESTATUS` | Último cambio de estado |
| Z | `ACTUALIZADO_EN` | Última modificación |
| AA | `ACTUALIZADO_POR` | Usuario o proceso responsable |

Los alumnos activos siguen apareciendo normalmente. En V10, la acción de eliminar se convierte internamente en una baja lógica: el registro permanece en el Sheet y conserva su asistencia.

## Instalación segura

1. Confirma que existe el snapshot inicial o una copia automática reciente. No es necesario restaurarla.
2. Copia **todo** [AppsScript_V10.gs](../AppsScript_V10.gs) al proyecto de Apps Script y guarda. Todavía no publiques una nueva versión.
3. En el selector de funciones ejecuta `setupStudentIdentityV10` con la cuenta propietaria.
4. Autoriza si Google lo solicita y abre el registro de ejecución.
5. Debe responder `success: true`, `ready: true`, `version: "V10"` y mostrar los contadores migrados.
6. Ejecuta `getStudentIdentityStatus`.
7. Confirma que `ready` sea `true` y que `totalStudents` sea igual a `permanentIds`. `duplicateIds` debe ser `0`.
8. Ve a **Implementar → Gestionar implementaciones → lápiz → Nueva versión → Implementar**. Conserva la misma URL `/exec`.
9. Abre el `ping` de la API. Debe incluir `version: "V10"`, `studentIdentityReady: true` y conservar `attendanceHistoryReady: true`.
10. Recarga el panel, abre una ficha, edita un dato pequeño y confirma tanto el panel como el Sheet. Después registra o corrige una asistencia de prueba.

Cuando el panel detecta `version: "V10"` e `identityReady: true`, cambia automáticamente la acción visible de **Eliminar** a **Dar de baja** y explica que los datos se conservarán.

Ejemplo orientativo de la primera ejecución:

```json
{
  "success": true,
  "ready": true,
  "version": "V10",
  "migratedStudents": 303,
  "migratedAttendanceRecords": 0
}
```

Los números pueden ser distintos: dependen de los alumnos y registros existentes. Lo importante es el estado final reportado por `getStudentIdentityStatus`.

## Repetición y reversibilidad

`setupStudentIdentityV10` es idempotente: si se ejecuta otra vez, conserva los IDs ya asignados. Aun así, debe usarse como operación de instalación, no como tarea diaria.

Si algo falla antes de publicar, V9 continúa atendiendo el panel porque la implementación web activa todavía no cambió. Las columnas nuevas quedan al final y ocultas; V9 solo trabaja con `A:T` y no depende de ellas.

## Qué habilita después

Con esta base se puede implementar sin perder historia:

- cambio de grupo y ciclo;
- bajas, transferencias y egresos reversibles;
- consulta de alumnos inactivos;
- credenciales, constancias y calificaciones ligadas al mismo alumno;
- migración futura a una base de datos manteniendo los identificadores.
