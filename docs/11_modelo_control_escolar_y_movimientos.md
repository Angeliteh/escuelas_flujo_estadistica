# 11 — Modelo de control escolar, movimientos y evolución de datos

> Decisión vigente desde el 28 de agosto de 2026. Este documento define el modelo que debe guiar las siguientes versiones; las pantallas se construyen después de respetar estas reglas.

## 1. Principio central

Un alumno no es una fila ni pertenece para siempre a una pestaña. Es una persona con identidad permanente. Lo que cambia a lo largo del tiempo es su inscripción, grupo, estado y ciclo escolar.

```text
ALUMNO (identidad permanente)
│
├── tutores y contactos
├── expediente y documentos
└── INSCRIPCIONES (una por ciclo)
     │
     ├── grupo y docente
     ├── estado durante el ciclo
     ├── MOVIMIENTOS
     ├── ASISTENCIAS
     ├── EVALUACIONES
     └── documentos emitidos
```

El `ALUMNO_ID` creado en V10 nunca debe cambiar, aunque el alumno cambie de grupo, sea dado de baja, reingrese, avance de grado o se migre a una base de datos.

## 2. Procesos escolares que debe representar el sistema

El control escolar de educación básica contempla, como mínimo, inscripción, reinscripción, acreditación, promoción, regularización y certificación. La autoridad educativa local puede solicitar formatos y reglas adicionales, por lo que los catálogos deben ser configurables y no depender de textos dispersos en el código.

Flujo general:

```text
PREINSCRIPCIÓN/ALTA
        ↓
INSCRIPCIÓN EN UN CICLO Y GRUPO
        ↓
ACTIVO ──→ CAMBIO DE GRUPO
  │              │
  ├──→ BAJA ──→ REINGRESO
  ├──→ TRANSFERENCIA
  └──→ CIERRE DE CICLO
             ├── PROMOVIDO → reinscripción siguiente ciclo
             ├── NO PROMOVIDO → reinscripción mismo grado
             └── EGRESADO
```

Un cambio no debe borrar el anterior. Cada movimiento se agrega al historial y actualiza la situación vigente.

## 3. Entidades mínimas

### `ALUMNOS`

Una fila por persona: `alumnoId`, datos personales, fecha de alta al sistema y estado general. Los datos que no cambian por ciclo viven aquí.

### `INSCRIPCIONES`

Una fila por alumno y ciclo:

```text
inscripcionId · alumnoId · cicloEscolar · grado · grupoId · estado
fechaInicio · fechaFin · motivoFin · actualizadoEn · actualizadoPor
```

No debe existir más de una inscripción activa para el mismo alumno dentro del mismo ciclo, salvo una excepción administrativa explícita.

En la operación normal, **Agregar alumno** equivale a darlo de alta en el ciclo y grupo seleccionados: crea la identidad permanente, una inscripción `ACTIVO` y un movimiento `ALTA`. El estado se muestra en el panel, pero no se captura como un campo libre; las transiciones se realizan mediante acciones controladas para conservar fecha, motivo e historial.

### `MOVIMIENTOS_ALUMNO`

Bitácora de eventos que no se sobrescribe:

```text
movimientoId · alumnoId · inscripcionId · tipo · fechaEfectiva
grupoOrigen · grupoDestino · estadoResultante · motivo · observacion
usuario · creadoEn
```

Tipos iniciales: `ALTA`, `REINSCRIPCION`, `CAMBIO_GRUPO`, `BAJA`, `TRANSFERENCIA`, `REINGRESO`, `PROMOCION`, `NO_PROMOCION`, `EGRESO` y `CORRECCION`.

### `GRUPOS`

Identifica ciclo, grado, letra, docente responsable, capacidad y estado. `1A` por sí solo no es identidad histórica suficiente; el grupo real es la combinación escuela + ciclo + grado + letra.

### `ASISTENCIA`

Ya existe como evento mensual técnico:

```text
fecha · grupo · alumnoId · estado · nota · usuario · actualizadoEn
```

Debe conservar el grupo y la inscripción que eran válidos en la fecha registrada.

### `DOCUMENTOS`

Registra metadatos, no el archivo dentro de una celda:

```text
documentoId · alumnoId · inscripcionId · tipo · ciclo · driveFileId
fechaRecepcion · estado · observacion · actualizadoPor
```

Los archivos se almacenarán en Drive con permisos controlados.

### `AUDITORIA`

Registro append-only de usuario, acción, entidad, ID, fecha y valores anteriores/nuevos. El historial de versiones de Sheets ayuda a recuperar archivos, pero no sustituye esta bitácora funcional.

## 4. Papel de Google Sheets

Para una escuela con unos cientos de alumnos, Sheets puede continuar como fuente operativa mientras se mantengan lecturas/escrituras por lotes, pocos usuarios simultáneos y reportes moderados.

Sheets no elimina el backend: Apps Script sigue siendo la API que valida y ejecuta operaciones.

### Arquitectura actual

```text
Panel web → Apps Script → Google Sheets
                         (fuente principal y formato administrativo)
```

### Arquitectura futura si se necesita una base de datos

```text
Panel web → API segura → base de datos
                            │
                            ├── exportación XLSX
                            └── Sheets administrativos regenerables
```

La escuela no perderá Excel/Sheets. Cuando exista una base de datos, las hojas cambiarán de fuente primaria a reporte, exportación y herramienta administrativa controlada.

## 5. Límites y señales de migración

Google Sheets admite hasta 10 millones de celdas por archivo. Apps Script tiene cuotas y un límite general de seis minutos por ejecución. El rendimiento suele deteriorarse antes del límite físico si hay muchas fórmulas, llamadas celda por celda o usuarios concurrentes.

No se migrará solamente por alcanzar cierto número de alumnos. Se evaluará migración cuando aparezca alguna de estas señales:

- más de una escuela;
- permisos detallados por escuela, grupo o módulo;
- muchos usuarios escribiendo simultáneamente;
- expedientes, calificaciones y documentos relacionados;
- auditoría formal y restauración por registro;
- consultas históricas o estadísticas complejas;
- errores frecuentes por cuotas o tiempos de ejecución;
- integraciones con otros sistemas;
- necesidad de autenticación y autorización centralizadas.

La seguridad puede obligar a migrar antes que el volumen. El sistema trata información de menores, CURP, domicilios y tutores; debe aplicarse minimización, finalidad explícita, control de acceso, respaldos y aviso de privacidad.

Fuentes técnicas y normativas de referencia:

- [Límite de archivos de Google Sheets](https://support.google.com/drive/answer/37603)
- [Cuotas de Google Apps Script](https://developers.google.com/apps-script/guides/services/quotas)
- [Buenas prácticas de Apps Script](https://developers.google.com/apps-script/guides/support/best-practices)
- [Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados](https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPDPPSO.pdf)

## 6. Migración futura sin pérdida de datos

1. Conservar un snapshot completo e inmutable del Sheet.
2. Exportar cada entidad técnica con sus IDs permanentes.
3. Importar a la base de datos sin regenerar IDs.
4. Verificar totales, IDs únicos, inscripciones, movimientos y asistencias por mes.
5. Comparar muestras completas de alumnos y expedientes.
6. Mantener temporalmente lectura paralela entre ambas fuentes.
7. Cambiar el panel a la nueva API.
8. Conservar el Sheet anterior como archivo histórico de solo lectura.
9. Generar nuevos archivos Sheets/XLSX desde la base de datos.

## 7. Estructura progresiva dentro del Sheet

Las pestañas visibles `1A` a `6B` y `ASISTENCIA (GRUPO)` deben conservarse porque son formatos familiares. Las siguientes versiones añadirán tablas técnicas ocultas:

```text
_INSCRIPCIONES
_MOVIMIENTOS_ALUMNO
_AUDITORIA
_DOCUMENTOS                 (cuando se confirme el expediente)
_ASISTENCIA_DATOS_AAAA_MM   (ya instalada)
```

No se duplicará todavía el catálogo personal completo en `_ALUMNOS`: V10 mantiene esos datos en las pestañas de grupo con `ALUMNO_ID`. Se hará una normalización adicional solamente cuando el flujo de inscripciones esté probado.

## 8. Alcance de una entrega escolar útil

### Núcleo obligatorio

- alumnos e identidad permanente;
- inscripción por ciclo;
- alta, baja, transferencia, reingreso y cambio de grupo;
- cierre de ciclo, promoción, repetición y egreso;
- grupos, docentes y padrones;
- asistencia diaria/mensual;
- ficha e impresión;
- historial de movimientos;
- auditoría básica;
- respaldos y procedimiento de recuperación;
- exportación administrativa controlada a Sheets/XLSX;
- permisos y acceso suficientemente seguros.

### Extensiones posteriores según la escuela

- múltiples tutores;
- documentos digitales;
- credenciales y constancias;
- calificaciones y boletas;
- apoyos y observaciones académicas;
- integraciones oficiales;
- operación multi escuela.

## 9. Orden de construcción acordado

1. Consulta de alumnos inactivos y reactivación.
2. Tabla técnica de inscripciones del ciclo actual.
3. Bitácora de movimientos.
4. Baja, reingreso y transferencia mediante eventos.
5. Cambio de grupo seguro.
6. Cierre/promoción de ciclo con vista previa y confirmación.
7. Auditoría de cambios.
8. Exportación administrativa a Excel/Sheets.
9. Definición del expediente con la escuela.
10. Seguridad y autenticación antes de ampliar usuarios o escuelas.

Cada incremento debe ser compatible con el anterior, idempotente en su instalación, respaldado y probado primero sin reemplazar datos oficiales.
