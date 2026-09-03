# 17 — Entender el sistema y Google Apps Script

Esta guía explica el sistema en lenguaje operativo: qué hace cada pieza, qué
puede crecer aquí y cuándo conviene cambiar de tecnología.

## Idea central

Google Apps Script es JavaScript que se ejecuta en la infraestructura de
Google, con los permisos de una cuenta autorizada. Puede modificar Sheets,
crear archivos en Drive, ejecutar tareas programadas y publicar una Web App.
En este proyecto desempeña el papel de backend ligero.

```text
Persona usuaria → Panel web → Vercel → Apps Script → Sheets / Drive
                                      ↘ Propiedades y activadores
```

| Componente | Qué hace en este sistema |
|---|---|
| Panel (`index.html`, `styles.css`, `app.js`) | Formularios, tablas y experiencia de Dirección/docentes. No conserva claves reales. |
| Vercel + `api/control.js` | Entrega el sitio y reenvía a Apps Script desde servidor para evitar bloqueos de privacidad del navegador. |
| Apps Script (`AppsScript_V11.gs`) | Valida sesión, rol y grupo; aplica reglas; lee/escribe datos y crea respaldos. |
| Google Sheets | Fuente operativa de alumnos, grupos, asistencia, inscripciones y formatos. |
| Google Drive | Guarda las copias completas nocturnas del Sheet. |
| Propiedades de secuencia de comandos | Cuentas, huellas de contraseña, sesiones, IDs de respaldo y estado de instalación. |
| Activador horario | Ejecuta el respaldo nocturno aunque nadie tenga abierto el panel. |

## Inicio de sesión y datos

1. La persona escribe usuario y contraseña en el panel.
2. El panel envía la solicitud a `/api/control`, su propia ruta en Vercel.
3. Vercel la pasa a Apps Script desde servidor.
4. Apps Script consulta su configuración privada, verifica la contraseña y crea una sesión temporal.
5. Devuelve rol y grupo: Dirección ve toda la escuela; un docente solo su grupo.
6. Cada operación posterior incluye esa sesión y Apps Script la vuelve a validar.

Ocultar un botón no es la protección. El servidor entrega solo lo autorizado.
El navegador conserva una copia temporal de la sesión mientras la pestaña está
abierta; las contraseñas no se guardan en `app.js`, Sheets ni el navegador.

Cuando se guarda asistencia o un alumno, Apps Script aplica las reglas y
modifica el Sheet oficial. El Sheet es la fuente de verdad, pero el personal
trabaja desde el panel para no alterar celdas, formatos o columnas técnicas.

El activador ejecuta `runNightlyBackup` de noche. Usa Drive para crear una
copia completa en `Respaldos Control Asistencia`. Es una copia independiente,
no una vista ni una sincronización. Ver [09_respaldos_y_restauracion.md](./09_respaldos_y_restauracion.md).

## Capacidades de Apps Script

Con autorización apropiada, Apps Script puede:

- Leer, normalizar y proteger flujos sobre Sheets.
- Crear carpetas, copiar archivos, generar respaldos y asignar permisos de Drive.
- Generar documentos o PDFs desde plantillas para constancias, reportes o credenciales.
- Enviar correos institucionales y recordatorios programados.
- Integrar Forms, Calendar, Gmail, Docs y servicios externos mediante API.
- Ejecutar cierres mensuales, validaciones, importaciones y reportes mediante activadores.

También puede ayudar a administrar archivos o carpetas compartidos, pero **no
convierte una cuenta en administradora universal**. El script solo actúa sobre
recursos a los que la cuenta ejecutora tiene permiso. Para una escuela conviene
una cuenta institucional o Unidad compartida; para permisos de organización,
varios Drives o muchas cuentas se necesita Google Workspace administrado y,
según el caso, API de Drive y controles de administración. Nunca automatizar
permisos masivos sin política y prueba en una carpeta aislada.

## Permisos que no se deben confundir

| Acceso | Lo que permite | Quién debería tenerlo |
|---|---|---|
| Cuenta del panel | Usar el sistema según su rol | Subdirección y docentes. |
| Editor del Sheet | Ver/alterar datos y formato directamente | Dirección y responsable técnico, no docentes. |
| Editor de Apps Script | Leer/modificar código, ejecutar funciones y publicar | Solo responsable técnico de confianza. Un script vinculado comparte acceso con su Sheet. |
| Administrador de Vercel | Publicar el sitio y cambiar su configuración | Responsable técnico. |

## Límites reales

Apps Script no es una base de datos ni un servidor de alta escala. Este piloto
funciona porque las operaciones son cortas, los datos caben con holgura en
Sheets y la concurrencia es baja.

- Una ejecución normal tiene un máximo de seis minutos.
- Google impone cuotas diarias por cuenta y servicio; varían entre cuentas personales y Workspace.
- Las propiedades privadas sirven para configuración y sesiones pequeñas, no para expedientes ni archivos.
- Los activadores sirven para tareas breves/programadas, no para procesos continuos o de gran volumen.
- No reemplaza identidad institucional completa, auditoría detallada, monitoreo empresarial ni permisos Drive muy granulares.

Las cifras vigentes se consultan en la [tabla oficial de cuotas de Apps Script](https://developers.google.com/apps-script/guides/services/quotas).

## Cuándo es la elección adecuada

Es una buena arquitectura para una escuela que necesita formularios, listas,
asistencia, reportes, reglas y respaldos sin pagar ni administrar servidores
propios. También es excelente para automatizaciones internas basadas en
formatos existentes de Sheets.

Se debe planear una base de datos y autenticación centralizada cuando haya
varias escuelas, muchos usuarios simultáneos, archivos pesados, recuperación
de contraseña, auditoría legal de cada cambio, permisos muy granulares o
integraciones institucionales permanentes.

No se desecha el trabajo al migrar: se conservan panel, reglas y modelo de
alumnos/inscripciones; cambia progresivamente dónde se guardan y validan los
datos.

## Regla práctica para futuras ideas

1. Captura o consulta escolar de volumen moderado: encaja aquí.
2. Documento, respaldo, correo o tarea programada de Google: Apps Script es buen candidato.
3. Permisos de toda una organización, varios Drives o cientos de usuarios: requiere diseño de Workspace y quizá API/base de datos adicional.
4. Datos sensibles de menores: primero se define rol, propósito, acceso, respaldo y auditoría; después se programa.

