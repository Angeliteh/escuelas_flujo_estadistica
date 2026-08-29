# 12 — Instalación de inscripciones y movimientos V11

> Estado: identidad, inscripciones y movimientos instalados; **V11 publicada y verificada** en la Web App.

## Alcance de esta primera etapa

V11 conserva identidad V10, asistencia histórica y respaldos. Añade:

- `_INSCRIPCIONES`: una inscripción por alumno y ciclo;
- `_MOVIMIENTOS_ALUMNO`: historial append-only;
- preanálisis que impide migrar si grado, grupo, pestaña o ID no coinciden;
- registro automático de bajas y reingresos;
- API para consultar inactivos, reactivarlos y consultar el ciclo de vida;
- pantalla administrativa **Bajas e inactivos**, oculta mientras V11 no esté lista.
- alta automática: un alumno nuevo creado desde el panel recibe inscripción activa y movimiento `ALTA` en la misma operación.

Todavía no implementa cambio de grupo ni promoción masiva; esos procesos se construirán sobre estas tablas después de validar la primera etapa.

## Protección previa obligatoria

El problema detectado en `1A` demostró que la migración no debe confiar silenciosamente en el formato. V11 compara para cada alumno:

- `ALUMNO_ID` válido y único;
- columna `GRADO`;
- columna `GRUPO`;
- nombre de la pestaña real.

Si encuentra una diferencia, devuelve `readyToMigrate: false` y **no crea ni modifica tablas técnicas**.

## Instalación segura

1. Confirmar que existe una copia automática reciente. No restaurarla.
2. Copiar completo [AppsScript_V11.gs](../AppsScript_V11.gs) al editor y guardar, sin desplegar.
3. Ejecutar `analyzeStudentIdentityV11`. La auditoría remota previa detectó 21 IDs inválidos en `2A`, por lo que inicialmente debe confirmar `students: 272` e `issueCount: 21`.
4. Ejecutar `repairInvalidStudentIdsV11`. Sólo reemplaza IDs faltantes, inválidos o duplicados en la columna técnica `U`, marca la reparación en `Z:AA` y actualiza cualquier referencia histórica de asistencia asociada. No modifica las columnas visibles `A:T`.
5. Repetir `analyzeStudentIdentityV11` y exigir `students: 272`, `validPermanentIds: 272`, `issueCount: 0` y `issues: []`.
6. Ejecutar `analyzeEnrollmentMigrationV11`.
7. Exigir este resultado antes de continuar:

```json
{
  "success": true,
  "readyToMigrate": true,
  "version": "V11",
  "students": 272,
  "issueCount": 0,
  "issues": []
}
```

8. Si `issueCount` es mayor que cero, detenerse, corregir únicamente los datos señalados y repetir el análisis.
9. Ejecutar `setupEnrollmentHistoryV11`.
10. La primera ejecución debe crear aproximadamente una inscripción y un movimiento inicial por alumno.
11. Ejecutar `getEnrollmentHistoryStatusV11` y comprobar:
   - `ready: true`;
   - `enrollments` igual al total de alumnos con nombre;
   - `activeEnrollments` igual al total activo;
   - `duplicateActiveEnrollments: []`.
12. Publicar una nueva versión conservando la URL `/exec`.
13. Verificar el `ping`: debe indicar `version: "V11"`, identidad, historial de inscripciones e historial de asistencia listos.
14. Recargar el panel con `Ctrl + F5` y confirmar que dirección ve el botón **Bajas e inactivos**.

No es necesario volver a ejecutar `setupStudentIdentityV10` ni `setupAttendanceHistoryV9`.

> Incidencia real: la primera revisión intentó reescribir `U:AA` completo. Google alcanzó a aplicar 17 IDs y se detuvo al encontrar un valor heredado inválido en `V24`, dejando cuatro pendientes. La revisión selectiva escribió exclusivamente `U` y `Z:AA`, reparó los cuatro restantes y no tocó `V`. Resultado final: 272 alumnos, 272 IDs válidos, cero incidencias y cero referencias históricas que migrar.

## Resultado de la instalación real

El 28 de agosto de 2026 se completó la fase de datos:

- respaldo manual previo creado a las 19:22;
- preanálisis: 272 alumnos y cero incidencias;
- `createdEnrollments: 272`;
- `createdMovements: 272`;
- `activeEnrollments: 272`;
- `duplicateActiveEnrollments: []`.

Las hojas técnicas ya existen y la propiedad de preparación está activa. No debe repetirse la migración por rutina; la función es idempotente y queda reservada para recuperación o verificación técnica controlada.

La publicación se completó conservando la URL. La API confirmó las tres banderas de preparación y una consulta real devolvió una inscripción y un movimiento unidos al `ALUMNO_ID` del alumno seleccionado.

## Pruebas posteriores

1. Abrir **Bajas e inactivos** y confirmar que inicialmente esté vacío si no existen bajas.
2. No usar un alumno real para probar hasta elegir un registro controlado.
3. Con un registro de prueba, dar de baja y confirmar que:
   - desaparece del padrón activo;
   - aparece en inactivos;
   - conserva su fila y `ALUMNO_ID`;
   - genera movimiento `BAJA`.
4. Reactivarlo y confirmar que:
   - vuelve al grupo;
   - desaparece de inactivos;
   - genera movimiento `REINGRESO`;
   - conserva la misma identidad y asistencia.

## Validación local realizada

- sintaxis de Apps Script correcta;
- preanálisis acepta datos consistentes;
- preanálisis bloquea una discordancia `pestaña 1A / grado 3A`;
- instalación idempotente en simulación;
- alta inicial de inscripción y movimiento en simulación;
- transición `ACTIVO → BAJA → ACTIVO` conserva inscripción y genera `BAJA`/`REINGRESO`;
- estado público V10 previo a reparar: 272 alumnos, 251 IDs válidos, 21 IDs heredados inválidos en `2A`, 0 duplicados y 0 inconsistencias de grupo;
- reparación real: 17 IDs aplicados antes del bloqueo de `V24` y cuatro completados con la revisión selectiva;
- estado final: 272 alumnos, 272 IDs válidos, cero incidencias y `migratedAttendanceRecords: 0`.
