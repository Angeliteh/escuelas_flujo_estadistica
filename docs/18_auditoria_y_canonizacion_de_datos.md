# 18 — Auditoría y canonización de datos del padrón

> Auditoría realizada el 4 de septiembre de 2026 sobre la copia local `Control asistencia.xlsx`. Este documento no expone datos personales; registra estructura, calidad y decisiones de operación.

## Decisión principal

La fuente de verdad continúa siendo el conjunto de pestañas de grupo en Google Sheets. No se agregan ni desplazan columnas: el formato visible se mantiene en `A:T` y los metadatos técnicos en `U:AA`.

La captura cotidiana debe hacerse desde el panel. Sheets queda para consulta, respaldo y corrección técnica controlada, no para que cada docente invente formatos distintos.

## Resultado de la auditoría

| Aspecto | Resultado |
|---|---|
| Alumnos activos | 272 |
| Grupos con estructura esperada | 12 de 12 |
| Identificadores `ALUMNO_ID` faltantes o duplicados | 0 |
| Estado actual | todos `ACTIVO` |
| Barrera de aprendizaje con texto | 80; se conserva como campo libre protegido por el proceso escolar |
| Fechas de nacimiento con representación mezclada | 21 en texto y 58 como fechas reales |
| Género con variantes | 102 capturados usando 7 representaciones distintas |
| Beca con variantes | 77 capturadas usando programas, sí/no y variantes de escritura |
| Peso / estatura con unidades o formatos mezclados | 75 / 74 capturados |
| Talla con formato mezclado | números, valores decimales de Excel y un rango |
| Nivel de estudio / ocupación | 11 / 35 valores distintos tras eliminar diferencias de mayúsculas |

La estructura y la identidad de los alumnos están bien. El problema es de captura histórica: los mismos conceptos se escribieron con abreviaturas, mayúsculas, unidades y nombres distintos.

## Incidencia técnica encontrada

Sólo la pestaña `2A` contiene una validación dañada: el catálogo de `ESTATUS` se extendió accidentalmente a las columnas técnicas `U:AA` e incorporó metadatos. Esto explica flechas de lista en columnas que no son de captura.

La rutina `setupDataStandardizationV12()` repara ese rango y deja el catálogo de estado únicamente en la columna técnica correspondiente. No borra alumnos, asistencias, movimientos ni identificadores.

## Contrato de captura V12

| Campo | Regla de almacenamiento | Captura en panel |
|---|---|---|
| Barrera de aprendizaje | Texto libre | Texto libre; su contenido requiere manejo interno responsable. |
| Género | `Masculino`, `Femenino`, `No especificado` o vacío | Lista cerrada. |
| Beca | Vacío, `No`, `Pendiente de confirmar`, `Sí` o `Sí — programa` | Estado y programa opcional. “Pendiente” nunca cuenta como beca. |
| Peso | Número en kg, sin escribir `kg` | Campo numérico; el panel muestra la unidad. |
| Estatura | Número en cm, sin escribir `cm` | Campo numérico; entradas históricas de `1.37 m` pasan a `137`. |
| Talla | Tallas del catálogo, incluido `14-16` | Lista cerrada. |
| Nivel de estudio | Catálogo escolar; “Otro” permite especificar | Lista y campo excepcional. |
| Ocupación | Texto con sugerencias comunes | Se permite texto porque la diversidad real de ocupaciones no debe perderse. |

El tipo de beca no necesita una nueva columna: se guarda legiblemente en `BECA`, por ejemplo `Sí — Rita Cetina`. Esto conserva el formato del padrón, permite impresión y no desplaza los metadatos de identidad e historial.

## Qué hace la rutina controlada

`setupDataStandardizationV12()`:

1. Recorre los grupos sin crear ni borrar filas.
2. Convierte de forma segura género, beca, peso, estatura, talla y nivel de estudio.
3. Conserva vacíos como vacíos; no transforma la falta de información en un dato inventado.
4. Repara validaciones de captura, incluida la incidencia de `2A`.
5. Devuelve un reporte con alumnos revisados y modificados por grupo.
6. Puede ejecutarse de nuevo sin duplicar registros ni cambiar identificadores.

No clasifica automáticamente las ocupaciones detalladas: hacerlo sin acordar un catálogo institucional perdería matices. El panel ofrece sugerencias, pero permite escribir una ocupación nueva.

## Aplicación segura

1. Confirmar un respaldo manual reciente y conservarlo intacto.
2. Publicar la versión que contiene `AppsScript_V11.gs` actualizado y el panel actualizado en el mismo corte.
3. En el editor de Apps Script ejecutar una sola vez `setupDataStandardizationV12`.
4. Revisar el objeto de resultado: deben revisarse 272 alumnos y la suma de los grupos debe coincidir con el padrón.
5. Abrir una ficha que antes tuviera género, beca o medidas históricas y comprobar que se vea y edite correctamente.
6. Revisar que en `2A` ya no haya listas desplegables dentro de las columnas técnicas ocultas.
7. Crear una alta de prueba, editarla y confirmar que las listas y las impresiones muestran los valores canónicos.

Si la escuela desea un catálogo de ocupaciones obligatorio o más programas de beca, se añade mediante una decisión documentada; no se modifican datos existentes a mano ni se cambia el encabezado del Sheet.

