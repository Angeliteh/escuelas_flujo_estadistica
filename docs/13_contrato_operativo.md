# 13 — Contrato operativo del sistema

> Este es el punto de referencia obligatorio para cualquier cambio futuro. Si una solicitud contradice este contrato, primero se decide y documenta la nueva regla; después se modifica el código.

## 1. Fuente de verdad documental

El orden de autoridad es:

1. este contrato operativo;
2. [11_modelo_control_escolar_y_movimientos.md](./11_modelo_control_escolar_y_movimientos.md), para datos e historia;
3. [08_handoff_y_escalabilidad.md](./08_handoff_y_escalabilidad.md), para estado operativo y hoja de ruta;
4. [02_roles.md](./02_roles.md), para permisos funcionales;
5. [01_arquitectura.md](./01_arquitectura.md), para componentes y conexiones;
6. [07_estado_actual.md](./07_estado_actual.md), para checklist de pruebas;
7. [14_piloto_y_adopcion.md](./14_piloto_y_adopcion.md), para adopción y captura de necesidades nuevas.
8. [15_acceso_seguro.md](./15_acceso_seguro.md), para instalación y prueba de accesos.
9. [18_auditoria_y_canonizacion_de_datos.md](./18_auditoria_y_canonizacion_de_datos.md), para las reglas de calidad y captura del padrón.

Los bocetos, mensajes y pantallas pueden evolucionar; estas reglas sólo cambian mediante una decisión explícita registrada en documentación y código.

## 2. Reglas que no deben romperse

1. `ALUMNO_ID` identifica a la persona y nunca cambia.
2. Agregar un alumno desde el panel significa inscribirlo `ACTIVO` en el ciclo y grupo elegidos y registrar `ALTA`.
3. Sólo puede existir una inscripción activa por alumno y ciclo en esta escuela.
4. Baja, reingreso, transferencia, cambio de grupo, promoción y egreso se realizan mediante acciones; nunca escribiendo libremente el estado.
5. Todo cambio de situación agrega un movimiento; los movimientos no se sobrescriben ni eliminan.
6. Una baja no elimina la fila, identidad, asistencia, inscripción histórica ni expediente.
7. La asistencia se relaciona por `ALUMNO_ID`, fecha y grupo, no por número de fila.
8. Las columnas visibles `A:T` conservan el formato administrativo; `U:AA` y las hojas `_...` son técnicas.
9. Maestros operan sólo su grupo. Dirección tiene alcance escolar y controla cambios de situación.
10. Ninguna migración se publica sin respaldo, preanálisis, totales esperados y prueba posterior.
11. Las instalaciones deben ser idempotentes: repetirlas no crea duplicados.
12. Sheets sigue siendo la fuente operativa actual, pero Apps Script es el backend que valida y relaciona los datos.
13. Los valores canónicos de ficha se capturan desde el panel; un dato no confirmado permanece vacío o pendiente, nunca se infiere.

## 3. Contrato de una inscripción

Una inscripción válida siempre conserva esta relación:

```text
ALUMNO_ID
  └── INSCRIPCION_ID + ciclo + grupo + estado
        ├── movimientos
        ├── asistencias
        ├── futuras evaluaciones
        └── futuros documentos
```

### Alta

```text
Inscribir alumno
→ crear/preservar ALUMNO_ID
→ crear inscripción ACTIVO
→ agregar movimiento ALTA
```

### Baja

```text
Dar de baja
→ conservar alumno
→ cambiar estado vigente a BAJA
→ cerrar inscripción con fecha/motivo
→ agregar movimiento BAJA
→ retirar del padrón activo
```

### Reingreso

```text
Reactivar
→ conservar ALUMNO_ID
→ reactivar inscripción
→ agregar movimiento REINGRESO
→ devolver al padrón activo
```

Transferencia, cambio de grupo y cierre de ciclo deberán respetar el mismo patrón antes de habilitarse en la interfaz.

## 4. Contrato de roles

- Maestro: consulta, inscripción, edición de ficha y asistencia únicamente en su grupo.
- Dirección: visión escolar, inscripciones en cualquier grupo y control de bajas/reingresos; después, transferencias y ciclos.
- Responsable técnico: infraestructura y correcciones controladas, no operación cotidiana.

V11.1 autentica sesiones en Apps Script y comprueba rol y grupo en cada operación. No se entregan cuentas hasta instalar y validar [15_acceso_seguro.md](./15_acceso_seguro.md); ocultar botones nunca es la fuente de autorización.

## 5. Criterio de terminado para cambios futuros

Una funcionalidad no se considera terminada hasta cumplir, según corresponda:

- interfaz por rol;
- validación en Apps Script;
- relación mediante IDs permanentes;
- movimiento o auditoría cuando cambia estado;
- compatibilidad con datos existentes;
- prueba de éxito y de rechazo;
- respaldo/migración segura si modifica estructura;
- documentación actualizada en el mismo cambio;
- despliegue y verificación pública.
- si el proceso escolar aún no está definido, una decisión documentada antes de crear campos, columnas o acciones.

## 6. Estado base confirmado

Al establecer este contrato:

- V11 está publicada;
- existen 272 alumnos activos;
- existen 272 IDs permanentes válidos;
- existen 272 inscripciones activas;
- existen 272 movimientos iniciales;
- no hay IDs ni inscripciones activas duplicadas;
- respaldos automáticos y manuales están habilitados;
- altas, edición, asistencia, historial e impresión fueron validados en uso del piloto por la persona responsable;
- Baja → Reingreso y restauración aislada de respaldo permanecen como pruebas operativas pendientes.
