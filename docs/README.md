# Control de Asistencia — Documentación

> **Escuela Primaria Gral. Elpidio G. Velázquez** · Ciclo 2026-2027

Índice de documentos del proyecto:

| Documento | Descripción |
|-----------|-------------|
| [01_arquitectura.md](./01_arquitectura.md) | Cómo funciona el sistema por dentro. Diagrama, flujo de datos, decisiones técnicas. |
| [02_roles.md](./02_roles.md) | Qué puede y qué no puede hacer cada usuario (Maestro, Dirección). |
| [03_google_sheets.md](./03_google_sheets.md) | Estructura del Sheet, reglas que no se deben romper, cómo configurar Apps Script. |
| [04_apps_script.md](./04_apps_script.md) | Archivo histórico del código V9 y notas de publicación. El backend vigente es `AppsScript_V11.gs`. |
| [05_deuda_tecnica.md](./05_deuda_tecnica.md) | Lo que falta, limitaciones actuales y próximos pasos si el sistema evoluciona. |
| [06_referencias.md](./06_referencias.md) | URLs, archivos del proyecto, links clave. |
| [07_estado_actual.md](./07_estado_actual.md) | **Panorama completo de lo que está listo, en prueba y pendiente.** |
| [08_handoff_y_escalabilidad.md](./08_handoff_y_escalabilidad.md) | **Documento principal para retomar el proyecto y planear su evolución a una plataforma multi escuela.** |
| [09_respaldos_y_restauracion.md](./09_respaldos_y_restauracion.md) | Instalación del snapshot inicial, copias nocturnas, retención, verificación y restauración. |
| [10_identidad_alumnos_v10.md](./10_identidad_alumnos_v10.md) | Migración no destructiva a IDs permanentes, estado y ciclo escolar. |
| [11_modelo_control_escolar_y_movimientos.md](./11_modelo_control_escolar_y_movimientos.md) | Modelo rector de inscripciones, movimientos, expedientes, Sheets y migración futura. |
| [12_inscripciones_y_movimientos_v11.md](./12_inscripciones_y_movimientos_v11.md) | Preanálisis, instalación y pruebas de inscripciones/movimientos V11. |
| [13_contrato_operativo.md](./13_contrato_operativo.md) | **Reglas obligatorias, roles y criterio para aceptar cambios futuros.** |
| [14_piloto_y_adopcion.md](./14_piloto_y_adopcion.md) | Guion de presentación, reglas de adopción y forma de incorporar necesidades futuras sin romper el modelo. |
| [15_acceso_seguro.md](./15_acceso_seguro.md) | Instalación, administración y verificación del acceso por sesión, rol y grupo. |
| [16_propuesta_diseno_institucional.md](./16_propuesta_diseno_institucional.md) | Dirección visual recomendada y plan de rediseño antes de modificar la interfaz. |
| [17_entender_el_sistema_y_apps_script.md](./17_entender_el_sistema_y_apps_script.md) | Guía conceptual: componentes, permisos, capacidades y límites de Apps Script. |
| [18_auditoria_y_canonizacion_de_datos.md](./18_auditoria_y_canonizacion_de_datos.md) | Auditoría del padrón, reglas de captura V12 y migración segura sin cambiar columnas. |

---

## Inicio rápido

```
Abrir el panel:    https://asistpanel.vercel.app/
Google Sheet:      https://docs.google.com/spreadsheets/d/1jAPfaac3miW8izCGrq1rosCntdjAMw3TMKLCxHYtSzI/edit
Ruta interna API:  https://asistpanel.vercel.app/api/control
```

> El panel en producción no debe usar claves de ejemplo. Antes de entregar accesos, instala la versión V11.1 y sigue [15_acceso_seguro.md](./15_acceso_seguro.md). No guardes ni compartas contraseñas en este repositorio.

> Para comprender el sistema antes de modificarlo, empezar por [17_entender_el_sistema_y_apps_script.md](./17_entender_el_sistema_y_apps_script.md). Para retomar o cambiarlo, leer después [13_contrato_operativo.md](./13_contrato_operativo.md), [15_acceso_seguro.md](./15_acceso_seguro.md), [08_handoff_y_escalabilidad.md](./08_handoff_y_escalabilidad.md), [14_piloto_y_adopcion.md](./14_piloto_y_adopcion.md) y [07_estado_actual.md](./07_estado_actual.md).
