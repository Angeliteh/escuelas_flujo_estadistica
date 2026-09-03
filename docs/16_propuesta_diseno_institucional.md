# 16 — Propuesta de diseño: sistema escolar institucional y claro

> Estado: dirección aprobada y base visual aplicada el 3 de septiembre de 2026. No modifica flujos, datos ni permisos.

## Decisión recomendada

Adoptar la dirección **institucional moderna**: una herramienta escolar serena, clara y cálida. No debe parecer una plantilla de métricas corporativas ni un portal gubernamental pesado.

La prioridad es que una persona que apenas usa Excel entienda qué puede hacer, dónde está y qué información es importante en pocos segundos.

## Diagnóstico de la interfaz actual

La base ya tiene buenas piezas: tabla, fichas, grupos, asistencia, iconos y buena separación de pantallas. Lo que hoy la hace sentirse genérica es:

- fondo muy oscuro, brillos y degradados morados propios de una demo tecnológica;
- muchas tarjetas y colores de acento compitiendo entre sí;
- indicadores de acceso de prueba que restan confianza institucional;
- métricas y gráficos con más protagonismo visual que las tareas diarias;
- tablas correctas, pero con poco contexto sobre qué hacer después.

## Dirección visual elegida

### Paleta

| Uso | Color | Intención |
|---|---|---|
| Base | `#F6F7F4` | Fondo cálido, descansado y legible durante jornadas largas. |
| Superficie | `#FFFFFF` | Fichas, tablas y formularios como hojas de expediente. |
| Institucional | `#173B5C` | Encabezados, navegación y jerarquía principal. |
| Acción | `#1F6F78` | Guardar, continuar y acciones principales. |
| Éxito / Activo | `#277A5D` | Asistencia, alumno activo y confirmaciones. |
| Atención / Baja | `#A96518` | Bajas, pendientes y decisiones que requieren revisión. |
| Error | `#B53A3A` | Errores y acciones irreversibles. |

No se usan degradados en botones ni colores distintos por cada tarjeta. El color indica significado, no decoración.

### Tipografía y tono

- Mantener `Inter` para campos, tablas y números por legibilidad.
- Usar una serif sobria sólo en el nombre de la escuela o en encabezados especiales, si se decide después; no es necesaria para la primera iteración.
- Hablar con verbos claros: **Registrar asistencia**, **Abrir ficha**, **Dar de baja**, **Reingresar alumno**. Evitar etiquetas técnicas como “CRUD”, “dashboard” o “modal”.

### Iconos

Usar una familia coherente de iconos lineales y reservarlos para orientación:

| Concepto | Icono sugerido |
|---|---|
| Alumnos | `user-graduate` |
| Grupo | `users` |
| Asistencia | `calendar-check` |
| Ficha | `id-card` |
| Bajas | `user-minus` |
| Reingreso | `user-check` |
| Sheet / consulta | `table-cells-large` |

Los iconos no reemplazan texto en acciones importantes.

## Propuesta por pantalla

### 1. Inicio de sesión

```text
┌───────────────────────────────────────────────┐
│ [Escudo] Escuela Primaria …     Ciclo 2026-27 │
│                                               │
│        Acceso al control escolar               │
│        Usuario  [____________________]        │
│        Contraseña[____________________]        │
│        [ Iniciar sesión ]                      │
│                                               │
│  Acceso asignado por Dirección                 │
└───────────────────────────────────────────────┘
```

- Fondo claro con una banda institucional discreta, no orbes ni brillo.
- Escudo real y nombre de escuela visibles.
- Eliminar por completo accesos de prueba; ya corresponde con el acceso seguro V11.1.

### 2. Encabezado y navegación

```text
Escudo  Escuela Primaria … · Control escolar    2026-2027   [Nombre ▾]
        Inicio | Mi grupo | Alumnos | Asistencia | Historial
```

- Barra clara, fija y compacta.
- Una sección activa marcada con subrayado institucional, no con una tarjeta de color.
- Para docentes, usar “Mi grupo” en vez de un menú con términos administrativos.

### 3. Inicio del docente

```text
Buenos días, [Nombre]                         Grupo 1A
──────────────────────────────────────────────────────
Alumnos activos  28        Asistencia de hoy  Pendiente

¿Qué necesitas hacer?
[ Registrar asistencia ]  [ Ver alumnos ]  [ Buscar alumno ]

Avisos del grupo
• 2 fichas actualizadas hoy
• La asistencia de hoy aún no se ha guardado
```

Las acciones cotidianas van antes de gráficas. El resumen debe orientar, no decorar.

### 4. Dirección

```text
Control escolar                                    2026-2027
Alumnos activos  272 | Asistencia del día  91% | Bajas  3

Acciones de Dirección
[ Consultar grupos ] [ Ver alumnos ] [ Bajas e inactivos ]

Situación a revisar
• Grupo 2B: asistencia pendiente
• 3 alumnos dados de baja este ciclo
```

Las gráficas permanecen disponibles más abajo, bajo “Indicadores”, no como primera lectura.

### 5. Tablas y ficha

- Tabla sobre blanco, encabezado azul muy claro, primera columna con nombre destacado.
- Barra superior fija: búsqueda, filtros simples y un botón principal único.
- La ficha se presenta como **Expediente del alumno**. Arriba muestra nombre, grupo y estado.
- `ACTIVO` y `BAJA` incluyen siempre una frase explicativa. El estado no se repite en padrones activos porque sería redundante.
- Separar claramente acciones normales (editar/imprimir) de acciones administrativas (baja/reingreso).

## Lo que no cambiaría

- La navegación por grupos y el drawer/ficha central: ya resuelven bien el espacio.
- El flujo de asistencia diaria y mensual.
- Las tablas como fuente de consulta rápida.
- El uso del Sheet como formato operativo/auditable, sin exponerlo a docentes.

## Plan de implementación sugerido

1. **Fundación visual:** paleta, tipografía, botones, superficies, estados y eliminación de gradientes. Sin tocar lógica.
2. **Acceso y encabezados:** inicio de sesión institucional, encabezado y navegación claros.
3. **Jerarquía operativa:** rediseñar primero inicio del docente y dirección; después tablas y ficha.
4. **Pulido:** contraste, accesibilidad, móvil, carga, impresión y revisión con la subdirectora.

## Criterio para aceptar el diseño

El rediseño se acepta si una maestra puede responder sin ayuda:

1. “¿En qué grupo estoy?”
2. “¿Qué debo hacer para tomar asistencia?”
3. “¿Cómo abro la ficha de un alumno?”
4. “¿Cómo sé si guardé correctamente?”

Y si Dirección identifica al primer vistazo: alumnos activos, grupos con atención pendiente y dónde ver bajas.
