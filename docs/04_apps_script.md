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

## Código completo (V3 — alumnos 19 columnas + personal 17 columnas)

```javascript
// ==============================================================================
// SCRIPT PARA GOOGLE SHEETS - CONTROL ESCOLAR V3 (ALUMNOS 19 COL + PERSONAL 17 COL)
// ==============================================================================

const HEADER_ROW = 5;
const TABS = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'];

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    // ALUMNOS
    if (action === 'getStudents') return respond(getStudents());
    if (action === 'saveStudent') return respond(saveStudent(params.data));
    if (action === 'deleteStudent') return respond(deleteStudent(params.grupo, params.id));
    // PERSONAL
    if (action === 'getStaff') return respond(getStaff());
    if (action === 'saveStaff') return respond(saveStaff(params.data));
    if (action === 'deleteStaff') return respond(deleteStaff(params.id));

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

// =====================================================
// ALUMNOS (19 Columnas)
// =====================================================
function getStudents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let allStudents = [];
  TABS.forEach(tabName => {
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow <= HEADER_ROW) return;
    const data = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, 19).getValues();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row[3]) continue; // ignorar filas sin nombre
      allStudents.push(rowToObject(row, i + HEADER_ROW + 1, tabName));
    }
  });
  return { success: true, data: allStudents };
}

function saveStudent(student) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gradoNum = String(student.grado).charAt(0);
  const hojaNombre = (student.grupo.length === 1 && gradoNum) ? (gradoNum + student.grupo) : student.grupo;
  if (!TABS.includes(hojaNombre)) return { success: false, error: 'Grupo no válido: ' + hojaNombre };
  let sheet = ss.getSheetByName(hojaNombre);
  if (!sheet) return { success: false, error: 'La hoja no existe: ' + hojaNombre };

  if (student.rowId) {
    const rowData = objectToRow(student, student.rowId - HEADER_ROW);
    sheet.getRange(student.rowId, 1, 1, rowData.length).setValues([rowData]);
  } else {
    const lastRow = sheet.getLastRow();
    const insertRow = Math.max(lastRow + 1, HEADER_ROW + 1);
    const rowData = objectToRow(student, insertRow - HEADER_ROW);
    sheet.getRange(insertRow, 1, 1, rowData.length).setValues([rowData]);
  }
  return { success: true, message: 'Guardado' };
}

function deleteStudent(grupo, rowId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(grupo);
  if (!sheet) return { success: false, error: 'Hoja no encontrada' };
  if (!rowId || rowId <= HEADER_ROW) return { success: false, error: 'Fila inválida' };
  sheet.getRange(rowId, 1, 1, 19).clearContent();
  return { success: true, message: 'Eliminado' };
}

function objectToRow(s, num) {
  return [
    num, s.grado, s.grupo, s.nombre, s.barreraAprendizaje, s.fechaNacimiento,
    s.curpAlumno, s.genero, s.beca, s.peso, s.estatura, s.talla, s.tutor,
    s.telefono, s.curpTutor, s.correo, s.domicilio, s.nivelEstudio, s.ocupacion
  ];
}

function rowToObject(row, rowIndex, tabName) {
  return {
    rowId: rowIndex,
    id: tabName + '-' + rowIndex,
    grado: row[1],
    grupo: row[2] || tabName,
    nombre: row[3],
    barreraAprendizaje: row[4],
    fechaNacimiento: formatDate(row[5]),
    curpAlumno: row[6],
    genero: row[7],
    beca: row[8],
    peso: row[9],
    estatura: row[10],
    talla: row[11],
    tutor: row[12],
    telefono: row[13],
    curpTutor: row[14],
    correo: row[15],
    domicilio: row[16],
    nivelEstudio: row[17],
    ocupacion: row[18]
  };
}

// =====================================================
// PERSONAL (17 Columnas)
// =====================================================
function getStaff() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PERSONAL');
  if (!sheet) return { success: false, error: 'Hoja PERSONAL no encontrada' };

  let allStaff = [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= HEADER_ROW) return { success: true, data: [] };

  const data = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, 17).getValues();
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row[1] && !row[2]) continue; // ignorar filas sin nombre ni función
    allStaff.push(rowToStaffObject(row, i + HEADER_ROW + 1));
  }
  return { success: true, data: allStaff };
}

function saveStaff(staff) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PERSONAL');
  if (!sheet) return { success: false, error: 'Hoja PERSONAL no encontrada' };

  if (staff.rowId) {
    const rowData = staffObjectToRow(staff, staff.rowId - HEADER_ROW);
    sheet.getRange(staff.rowId, 1, 1, rowData.length).setValues([rowData]);
  } else {
    const lastRow = sheet.getLastRow();
    const insertRow = Math.max(lastRow + 1, HEADER_ROW + 1);
    const rowData = staffObjectToRow(staff, insertRow - HEADER_ROW);
    sheet.getRange(insertRow, 1, 1, rowData.length).setValues([rowData]);
  }
  return { success: true, message: 'Guardado' };
}

function deleteStaff(rowId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PERSONAL');
  if (!sheet) return { success: false, error: 'Hoja PERSONAL no encontrada' };
  if (!rowId || rowId <= HEADER_ROW) return { success: false, error: 'Fila inválida' };
  sheet.getRange(rowId, 1, 1, 17).clearContent();
  return { success: true, message: 'Eliminado' };
}

function staffObjectToRow(s, num) {
  return [
    num, s.nombre, s.funcion, s.numAlumnos, s.clavePresupuestal, s.rfc,
    s.curp, s.celular, s.telCasa, s.correo, s.fechaIngreso,
    s.anosServicio, s.domicilio, s.telAdicional, s.perfilEstudios,
    s.baseInterino, s.situacionLaboral
  ];
}

function rowToStaffObject(row, rowIndex) {
  return {
    rowId: rowIndex,
    id: 'staff-' + rowIndex,
    nombre: row[1],
    funcion: row[2],
    numAlumnos: row[3],
    clavePresupuestal: row[4],
    rfc: row[5],
    curp: row[6],
    celular: row[7],
    telCasa: row[8],
    correo: row[9],
    fechaIngreso: formatDate(row[10]),
    anosServicio: row[11],
    domicilio: row[12],
    telAdicional: row[13],
    perfilEstudios: row[14],
    baseInterino: row[15],
    situacionLaboral: row[16]
  };
}

// =====================================================
// UTILS
// =====================================================
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
