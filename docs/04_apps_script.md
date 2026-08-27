# 04 — Apps Script: Código y Publicación

## ¿Qué es esto?

Google Apps Script es un servicio de Google que permite ejecutar código JavaScript dentro del ecosistema de Google (Sheets, Drive, etc). En este proyecto actúa como el "backend" o API: recibe peticiones del panel web, lee/escribe en el Google Sheet y devuelve JSON.

---

## Dónde está

Dentro del Google Sheet: **Extensiones → Apps Script**

URL de la implementación activa:
```
https://script.google.com/macros/s/AKfycbyFPxVLK2RpUPC91Y1JRfowXAf5aKThAk8ERFjgkNLf-jc1uEdzIoIU73mSJzLYJNC3Sw/exec
```

> **IMPORTANTE:** Si eliminas y recreas la implementación, esta URL cambia. Debes actualizar `API_URL` en `app.js`.

---

## Código completo (V2 — con Ocupación, 18 columnas)

```javascript
// ==============================================================================
// SCRIPT PARA GOOGLE SHEETS - CONTROL ESCOLAR V2
// ==============================================================================

// Fila donde están los encabezados de columnas (ID_INTERNO, GRADO, etc.)
// Las filas 1 a (HEADER_ROW-1) son el diseño visual (logo, título, etc.)
const HEADER_ROW = 5;

// Nombres exactos de las pestañas. Deben coincidir al 100% con los tabs del Sheet.
const TABS = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'];

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    if (action === 'getStudents') return respond(getStudents());
    if (action === 'saveStudent') return respond(saveStudent(params.data));
    if (action === 'deleteStudent') return respond(deleteStudent(params.grupo, params.id));
    return respond({ error: 'Acción no válida' }, 400);
  } catch (error) {
    return respond({ error: error.message }, 500);
  }
}

function doGet(e) {
  if (e.parameter && e.parameter.action === 'ping') {
    return respond({ status: 'ok', message: 'API funcionando' });
  }
  return respond(getStudents());
}

// Lee todos los alumnos de todas las hojas
function getStudents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let allStudents = [];
  TABS.forEach(tabName => {
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow <= HEADER_ROW) return;
    // Leer 18 columnas empezando desde la 1 (A hasta R)
    const data = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, 18).getValues();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row[3]) continue; // ignorar filas sin nombre (ahora el nombre es row[3])
      allStudents.push(rowToObject(row, i + HEADER_ROW + 1, tabName));
    }
  });
  return { success: true, data: allStudents };
}

// Guarda o actualiza un alumno
function saveStudent(student) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gradoNum = String(student.grado).charAt(0);
  const hojaNombre = (student.grupo.length === 1 && gradoNum) ? (gradoNum + student.grupo) : student.grupo;
  if (!TABS.includes(hojaNombre)) return { success: false, error: 'Grupo no válido: ' + hojaNombre };
  let sheet = ss.getSheetByName(hojaNombre);
  if (!sheet) return { success: false, error: 'La hoja no existe: ' + hojaNombre };
  
  if (student.rowId) {
    // Actualización
    const rowData = objectToRow(student, student.rowId - HEADER_ROW);
    sheet.getRange(student.rowId, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Nuevo alumno
    const lastRow = sheet.getLastRow();
    const insertRow = Math.max(lastRow + 1, HEADER_ROW + 1);
    const rowData = objectToRow(student, insertRow - HEADER_ROW);
    sheet.getRange(insertRow, 1, 1, rowData.length).setValues([rowData]);
  }
  return { success: true, message: 'Guardado' };
}

// Elimina el contenido de una fila (no borra la fila)
function deleteStudent(grupo, rowId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(grupo);
  if (!sheet) return { success: false, error: 'Hoja no encontrada: ' + grupo };
  if (!rowId || rowId <= HEADER_ROW) return { success: false, error: 'Fila inválida' };
  sheet.getRange(rowId, 1, 1, 18).clearContent();
  return { success: true, message: 'Eliminado' };
}

// Convierte objeto JS → array de 18 valores para escribir en el Sheet (CON NÚMERO DE LISTA)
function objectToRow(s, num) {
  return [
    num, s.grado, s.grupo, s.nombre, s.fechaNacimiento, s.curpAlumno,
    s.genero, s.beca, s.peso, s.estatura, s.talla, s.tutor,
    s.telefono, s.curpTutor, s.correo, s.domicilio, s.nivelEstudio, s.ocupacion
  ];
}

// Convierte una fila del Sheet → objeto JS para el panel
function rowToObject(row, rowIndex, tabName) {
  return {
    rowId: rowIndex,
    id: tabName + '-' + rowIndex, // ID dinámico generado al vuelo
    grado: row[1],
    grupo: row[2] || tabName,
    nombre: row[3],
    fechaNacimiento: formatDate(row[4]),
    curpAlumno: row[5],
    genero: row[6],
    beca: row[7],
    peso: row[8],
    estatura: row[9],
    talla: row[10],
    tutor: row[11],
    telefono: row[12],
    curpTutor: row[13],
    correo: row[14],
    domicilio: row[15],
    nivelEstudio: row[16],
    ocupacion: row[17]
  };
}

function formatDate(dateObj) {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') return dateObj;
  try {
    const d = new Date(dateObj);
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  } catch (e) { return ''; }
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
```

---

## Cómo publicar una nueva versión

Cuando modificas el código, debes publicar una nueva versión. **La URL no cambia.**

1. En el editor de Apps Script → clic en **Implementar** (arriba a la derecha)
2. Seleccionar **Gestionar implementaciones**
3. Hacer clic en el ícono del **lápiz** (editar)
4. En "Versión" → seleccionar **Nueva versión**
5. Clic en **Implementar**

---

## Cómo probar que la API funciona

Abre en el navegador:
```
https://script.google.com/macros/s/AKfycbyFPxVLK2RpUPC91Y1JRfowXAf5aKThAk8ERFjgkNLf-jc1uEdzIoIU73mSJzLYJNC3Sw/exec?action=ping
```

Debe responder:
```json
{ "status": "ok", "message": "API funcionando" }
```

Si no responde o da error 403, puede ser que necesites volver a publicar o reautorizar el script.
