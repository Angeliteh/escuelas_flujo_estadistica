# 14 — Piloto, adopción y evolución guiada

> Propósito: que la primera escuela pueda usar el sistema con confianza y que sus necesidades futuras se incorporen sin volver a desordenar los datos ni el Sheet oficial.

## 1. Qué se está entregando

No es un reemplazo brusco del formato escolar ni una promesa de tener hoy todos los módulos posibles. Es un **núcleo operativo** para una escuela:

```text
Panel sencillo para operar
        ↓
Apps Script valida y relaciona
        ↓
Google Sheet conserva el formato oficial y la consulta administrativa
```

El beneficio concreto es que maestros y dirección capturan la información en un solo flujo, con los mismos campos y reglas. El Sheet no desaparece: deja de ser la herramienta cotidiana de captura desordenada y se conserva como registro oficial, consulta e impresión.

## 2. Mensaje para presentar a la subdirectora

> “El sistema no les quita sus formatos ni sus datos. Les evita que cada persona cambie celdas, combine columnas o anote información de manera distinta. Los maestros trabajan sólo con su grupo; Dirección ve el conjunto. Cada alumno conserva la misma identidad aunque después cambie de situación, y la asistencia conserva su historial. Lo que aún no esté definido por la escuela no se improvisa: se acuerda y se agrega sobre esta base.”

No conviene venderlo como “control escolar total” todavía. La promesa correcta es: **un piloto útil y ordenado para alumnos y asistencia, listo para crecer con necesidades reales de la escuela.**

## 3. Demostración corta sugerida

1. Iniciar sesión como Dirección y mostrar el dashboard y los grupos.
2. Abrir un grupo: resumen, alumnos y asistencia mensual en el mismo contexto.
3. Abrir una ficha: primero lectura, después edición intencional e impresión.
4. Mostrar la captura diaria de asistencia desde el punto de vista de un maestro.
5. Explicar que el Sheet sigue disponible para consulta, pero que los maestros ya no necesitan editarlo.
6. Mostrar **Dar de baja** y **Bajas e inactivos** sólo como una operación controlada de Dirección.

La primera sesión debe terminar con una tarea simple para la subdirectora y un maestro: consultar un grupo, editar un dato permitido y capturar asistencia. No con una lista extensa de funciones futuras.

## 4. Reglas de adopción

- El panel es la herramienta diaria; el Sheet es consulta administrativa y formato oficial.
- Maestros no editan el Sheet ni las columnas técnicas.
- Dirección solicita una corrección excepcional; no cambia por su cuenta IDs, grupos, estados ni tablas técnicas.
- Una necesidad nueva no se resuelve agregando una columna improvisada. Primero se identifica si es un dato del alumno, una inscripción, un evento, un documento o un reporte.
- Las pruebas se hacen con un registro controlado; los respaldos se prueban sobre una copia aislada.

## 5. Cómo recibir necesidades futuras

Para cada solicitud de la escuela, registrar estas preguntas antes de programar:

| Pregunta | Ejemplo |
|---|---|
| ¿Qué problema operativo resuelve? | “Necesitamos saber por qué un alumno se cambió de grupo”. |
| ¿Quién lo consulta y quién lo modifica? | Dirección consulta y ejecuta; maestro sólo ve el resultado. |
| ¿Es un dato permanente, de un ciclo o un evento? | Un teléfono es del alumno; un grupo es de la inscripción; una baja es un evento. |
| ¿Qué historial debe conservarse? | Fecha, motivo, origen, destino y responsable. |
| ¿Qué reporte o formato necesita? | Padrón, constancia, reporte mensual o exportación. |
| ¿Qué regla debe impedir errores? | Un alumno no puede tener dos inscripciones activas en el mismo ciclo. |

Con esto se evita que un formato urgente termine creando datos duplicados o reglas contradictorias.

## 6. Límites honestos del piloto

V11.1 ya incorpora acceso validado por servidor, alumnos, altas, edición, asistencia, bajas/reingresos, impresión, identidad permanente, inscripciones y movimientos. Aún faltan transferencia, cambio de grupo, cierre de ciclo, calificaciones, expedientes y documentos. El control de acceso se considera activo sólo después de instalar y probar [15_acceso_seguro.md](./15_acceso_seguro.md).

El diseño ya está preparado para ellos porque las relaciones centrales existen. No se agregan hasta que la escuela defina el flujo, los responsables y el formato que necesita.

## 7. Próxima conversación con la escuela

Después de una o dos semanas de uso, pedir ejemplos reales, no listas abstractas: qué registro faltó, quién necesitó verlo, cuándo y qué decisión dependía de él. Esos ejemplos determinan el siguiente incremento; el orden técnico vigente está en [11_modelo_control_escolar_y_movimientos.md](./11_modelo_control_escolar_y_movimientos.md).
