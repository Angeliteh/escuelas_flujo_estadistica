# 15 — Acceso seguro por sesión, rol y grupo

> Estado: V11.1 está preparado en este repositorio. No se considera activo en producción hasta copiar el backend, configurar las cuentas, publicar Apps Script, desplegar el panel y completar las pruebas de esta guía.

## Qué protege

El panel ya no guarda contraseñas ni permisos reales. Apps Script conserva la configuración privada, crea sesiones temporales de ocho horas y valida cada petición.

| Cuenta | Puede consultar | Puede modificar |
|---|---|---|
| Dirección | Todos los grupos, bajas/inactivos y personal | Alumnos, bajas y reingresos de toda la escuela |
| Docente de un grupo | Sólo su grupo y su asistencia | Sólo alumnos y asistencia de su grupo |
| Sin sesión | Ningún dato escolar | Nada |

El estado del alumno se muestra en su ficha. `ACTIVO` aparece en grupo y asistencia; `BAJA` se conserva en **Bajas e inactivos** y deja de aparecer en listas activas. No se necesita repetir una columna `Estado` en las tablas activas, porque allí todos necesariamente están activos.

## Instalación inicial

Haz el cambio fuera de horario escolar. Publicar primero el backend y luego el panel deja una ventana breve sin acceso, pero evita que un navegador antiguo siga solicitando datos sin sesión.

1. Haz y verifica un respaldo conforme a [09_respaldos_y_restauracion.md](./09_respaldos_y_restauracion.md).
2. Copia completo [AppsScript_V11.gs](../AppsScript_V11.gs) en el proyecto vinculado al Sheet y guarda. Aún no publiques.
3. En **Configuración del proyecto → Propiedades de secuencia de comandos**, crea temporalmente `ACCESS_CONTROL_SEED_V11`. Su valor debe ser un arreglo JSON como el siguiente. Sustituye todos los valores de ejemplo antes de pegarlo y usa contraseñas distintas de al menos 12 caracteres.

```json
[
  {
    "username": "DIRECCION",
    "password": "REEMPLAZAR-POR-CLAVE-LARGA-1",
    "role": "director",
    "name": "Subdirección"
  },
  {
    "username": "DOCENTE_1A",
    "password": "REEMPLAZAR-POR-CLAVE-LARGA-2",
    "role": "teacher",
    "group": "1A",
    "name": "Docente de 1A"
  }
]
```

4. Desde el editor de Apps Script ejecuta `setupAccessControlV11` con la cuenta propietaria. Acepta los permisos si Google los solicita.
5. Ejecuta `getAccessControlStatusV11`. Debe devolver `ready: true`, una lista de usuarios sin contraseñas y al menos una cuenta activa con rol `director`.
6. Confirma en propiedades que `ACCESS_CONTROL_SEED_V11` ya no existe. El backend sólo conserva hashes y una clave interna privada; no recupera ni muestra las contraseñas.
7. Publica una **nueva versión** de la Web App de Apps Script con la misma URL `/exec` y el acceso configurado para los usuarios previstos.
8. Despliega juntos `app.js`, `index.html`, `styles.css` y `sw.js` en Vercel. La caché del panel cambia a V3 para forzar la actualización de la interfaz.

Si se cambia la lista de cuentas, repite pasos 3 a 6. Esto invalida todas las sesiones existentes, que es intencional.

## Operación cotidiana

- Entrega a la subdirectora su usuario y contraseña por un canal privado, no en una hoja compartida.
- Crea una cuenta por persona y grupo; no reutilices la cuenta de Dirección ni una clave de docente.
- Para retirar acceso, usa una entrada con `"enabled": false` y ejecuta otra vez `setupAccessControlV11`.
- Para cambiar contraseña, vuelve a incluir esa cuenta en la propiedad temporal con su contraseña nueva y ejecuta la función. Después verifica que la propiedad temporal se borró.
- La copia temporal de alumnos y asistencia vive sólo durante la sesión actual de la pestaña. Al cerrar sesión, vencer la sesión o cerrar la pestaña, se borra; por eso no se conserva información escolar para el siguiente usuario del equipo.

## Prueba de entrega obligatoria

Haz estas pruebas con una cuenta de Dirección y una de docente. No uses datos inventados en el Sheet oficial si no son necesarios.

1. Abrir el enlace en una ventana privada: debe mostrar inicio de sesión y ningún alumno.
2. Intentar una contraseña incorrecta: debe fallar sin indicar si el usuario existe. Cinco intentos fallidos de una cuenta conocida bloquean temporalmente esa cuenta durante 15 minutos.
3. Iniciar con Dirección: debe poder ver todos los grupos, abrir una ficha y ver **Dar de baja** y **Bajas e inactivos**.
4. Iniciar con un docente de `1A`: debe ver sólo `1A`; probar que no aparezcan alumnos, asistencia ni datos de `1B`.
5. Como docente, editar o guardar asistencia de su propio grupo: debe funcionar.
6. Como docente, intentar usar una URL o una petición modificada para `1B`: debe responder sin datos con `FORBIDDEN`.
7. Cerrar sesión, recargar y comprobar que no se ven datos guardados localmente.
8. Ejecutar baja y reingreso controlados desde Dirección. Confirmar que la ficha indica el estado y que el alumno pasa de la lista activa a **Bajas e inactivos**, y vuelve al reingresar.

## Límites y siguiente mejora

Esta capa es adecuada para el piloto: valida del lado servidor, restringe por rol/grupo y evita credenciales públicas. La sesión viaja en la petición porque una Web App de Apps Script no permite establecer desde este flujo una cookie `HttpOnly`; por eso debe usarse sólo sobre HTTPS, no compartirse y mantener la sesión corta. El bloqueo por intentos fallidos reduce intentos repetidos, pero no reemplaza un límite por IP ni una identidad centralizada.

Para varias escuelas, usuarios numerosos, recuperación de contraseña, auditoría formal o requisitos institucionales, el siguiente paso es una identidad centralizada y una base de datos con auditoría. No se debe simular eso agregando cuentas o contraseñas a `app.js` o al Sheet.
