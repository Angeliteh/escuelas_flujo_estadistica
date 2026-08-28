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

## Código completo (V7 — alumnos 20 columnas + personal 17 columnas + asistencia mensual optimizada)

```javascript
// ==============================================================================
// SCRIPT PARA GOOGLE SHEETS - CONTROL ESCOLAR V7 (ALUMNOS 20 COL + PERSONAL 17 COL + ASISTENCIA MENSUAL OPTIMIZADA)
// ==============================================================================

const HEADER_ROW = 5;
const TABS = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'];
// La asistencia se escribe en las hojas mensuales que ya prepara la escuela.
// El script nunca crea hojas de asistencia automáticamente.
const ATTENDANCE_SHEET_PREFIX = 'ASISTENCIA (';
const ATTENDANCE_WEEKDAY_ROW = 6;
const ATTENDANCE_DATE_ROW = 7;
const ATTENDANCE_FIRST_STUDENT_ROW = 8;
const ATTENDANCE_LAST_STUDENT_ROW = 37;
const ATTENDANCE_NAME_COLUMN = 2;
const ATTENDANCE_FIRST_DAY_COLUMN = 3;

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    // ALUMNOS
    if (action === 'getStudents') return respond(getStudents());
    if (action === 'saveStudent') return respond(saveStudent(params.data));
    if (action === 'deleteStudent') return respond(deleteStudent(params.grupo, params.id));
    // ASISTENCIA
    if (action === 'getAttendanceConfig') return respond(getAttendanceConfig(params));
    if (action === 'getAttendance') return respond(getAttendance(params));
    if (action === 'getAttendanceMonth') return respond(getAttendanceMonth(params));
    if (action === 'saveAttendance') return respond(saveAttendance(params.records || []));
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
// ALUMNOS (20 Columnas)
// =====================================================
function getStudents() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let allStudents = [];
  TABS.forEach(tabName => {
    const sheet = ss.getSheetByName(tabName);
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow <= HEADER_ROW) return;
    const data = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, 20).getValues();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row[4]) continue; // ignorar filas sin nombre
      allStudents.push(rowToObject(row, i + HEADER_ROW + 1, tabName));
    }
  });
  return { success: true, data: allStudents };
}

function getStudentsForGroup(group) {
  const normalizedGroup = String(group || '').trim().toUpperCase();
  if (!TABS.includes(normalizedGroup)) return [];

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(normalizedGroup);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= HEADER_ROW) return [];

  const data = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, 20).getValues();
  const students = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row[4]) continue;
    students.push(rowToObject(row, i + HEADER_ROW + 1, normalizedGroup));
  }
  return students;
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
  sheet.getRange(rowId, 1, 1, 20).clearContent();
  return { success: true, message: 'Eliminado' };
}

function objectToRow(s, num) {
  return [
    num, s.grado, s.grupo, s.folio, s.nombre, s.barreraAprendizaje,
    s.fechaNacimiento, s.curpAlumno, s.genero, s.beca, s.peso, s.estatura,
    s.talla, s.tutor, s.telefono, s.curpTutor, s.correo, s.domicilio,
    s.nivelEstudio, s.ocupacion
  ];
}

function rowToObject(row, rowIndex, tabName) {
  return {
    rowId: rowIndex,
    id: tabName + '-' + rowIndex,
    grado: row[1],
    grupo: row[2] || tabName,
    folio: row[3],
    nombre: row[4],
    barreraAprendizaje: row[5],
    fechaNacimiento: formatDate(row[6]),
    curpAlumno: row[7],
    genero: row[8],
    beca: row[9],
    peso: row[10],
    estatura: row[11],
    talla: row[12],
    tutor: row[13],
    telefono: row[14],
    curpTutor: row[15],
    correo: row[16],
    domicilio: row[17],
    nivelEstudio: row[18],
    ocupacion: row[19]
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
// ASISTENCIA MENSUAL (usa las hojas formateadas existentes)
// =====================================================
// Cada grupo debe tener una hoja llamada exactamente ASISTENCIA (1A),
// ASISTENCIA (1B), etc. El script no inserta, renombra ni elimina hojas.
// La plantilla usa: fila 6 = inicial del día, fila 7 = número del día,
// fila 8 en adelante = alumnos y columna B = nombre.
function attendanceSheetName(group) {
  const normalizedGroup = String(group || '').trim().toUpperCase();
  return TABS.includes(normalizedGroup) ? `${ATTENDANCE_SHEET_PREFIX}${normalizedGroup})` : '';
}

function getAttendanceSheet(group) {
  const sheetName = attendanceSheetName(group);
  if (!sheetName) return { success: false, error: 'Grupo no válido para asistencia' };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    return {
      success: false,
      error: `No existe la hoja "${sheetName}". Créala copiando la plantilla mensual antes de usar el panel.`
    };
  }
  return { success: true, sheet, sheetName };
}

function getAttendanceConfig() {
  return {
    success: true,
    mode: 'formatted-monthly-sheet',
    sheetPattern: 'ASISTENCIA (GRUPO)',
    message: 'La asistencia usa las hojas mensuales existentes; no se crean hojas automáticamente.'
  };
}

function normalizeAttendanceText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function parseAttendanceDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dateObject = new Date(year, month - 1, day, 12);
  if (dateObject.getFullYear() !== year || dateObject.getMonth() !== month - 1 || dateObject.getDate() !== day) return null;
  return { date: match[0], year, month, day, weekday: dateObject.getDay() };
}

function attendanceToday() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function attendanceWeekdayCode(weekday) {
  return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][weekday] || '';
}

function getAttendanceMonthSlots(date) {
  const parsed = parseAttendanceDate(date);
  if (!parsed) return [];
  const daysInMonth = new Date(parsed.year, parsed.month, 0).getDate();
  const slots = [];
  let column = ATTENDANCE_FIRST_DAY_COLUMN;
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObject = new Date(parsed.year, parsed.month - 1, day, 12);
    const weekday = dateObject.getDay();
    if (weekday === 0 || weekday === 6) continue;
    slots.push({
      date: `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      weekday: attendanceWeekdayCode(weekday),
      column
    });
    column++;
    if (weekday === 5) column++;
  }
  return slots;
}

function findAttendanceDateColumn(sheet, date) {
  const parsed = parseAttendanceDate(date);
  if (!parsed) return null;
  const width = Math.max(sheet.getMaxColumns() - ATTENDANCE_FIRST_DAY_COLUMN + 1, 1);
  const headers = sheet.getRange(ATTENDANCE_WEEKDAY_ROW, ATTENDANCE_FIRST_DAY_COLUMN, 2, width).getDisplayValues();
  const expectedWeekday = attendanceWeekdayCode(parsed.weekday);
  for (let index = 0; index < width; index++) {
    const weekday = normalizeAttendanceText(headers[0][index]);
    const day = Number(String(headers[1][index] || '').trim());
    if (day === parsed.day && weekday === expectedWeekday) return ATTENDANCE_FIRST_DAY_COLUMN + index;
  }
  return null;
}

function writeAttendanceMonthHeader(sheet, date) {
  const slots = getAttendanceMonthSlots(date);
  if (!slots.length) return { success: false, error: 'La fecha no es válida' };
  const lastColumn = slots[slots.length - 1].column;
  if (lastColumn > sheet.getMaxColumns()) {
    return { success: false, error: 'La plantilla mensual no tiene suficientes columnas para este mes' };
  }

  const width = lastColumn - ATTENDANCE_FIRST_DAY_COLUMN + 1;
  const weekdayRow = Array(width).fill('');
  const dateRow = Array(width).fill('');
  slots.forEach(slot => {
    const index = slot.column - ATTENDANCE_FIRST_DAY_COLUMN;
    weekdayRow[index] = slot.weekday;
    dateRow[index] = slot.day;
  });
  sheet.getRange(ATTENDANCE_WEEKDAY_ROW, ATTENDANCE_FIRST_DAY_COLUMN, 2, width).clearContent();
  sheet.getRange(ATTENDANCE_WEEKDAY_ROW, ATTENDANCE_FIRST_DAY_COLUMN, 2, width).setValues([weekdayRow, dateRow]);
  return { success: true, slots };
}

function getAttendanceGroupStudents(group) {
  const students = getStudentsForGroup(group);
  const seen = {};
  return students.filter(student => {
    const id = String(student.id || '');
    const belongsToGroup = id.indexOf(`${group}-`) === 0 || normalizeAttendanceText(student.grupo) === group;
    if (!belongsToGroup || !id || seen[id]) return false;
    seen[id] = true;
    return true;
  });
}

function getAttendanceSheetNames(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), ATTENDANCE_LAST_STUDENT_ROW);
  const height = lastRow - ATTENDANCE_FIRST_STUDENT_ROW + 1;
  return sheet.getRange(ATTENDANCE_FIRST_STUDENT_ROW, ATTENDANCE_NAME_COLUMN, height, 1)
    .getDisplayValues()
    .map(row => normalizeAttendanceText(row[0]));
}

function attendanceStatusFromValue(value) {
  const normalized = normalizeAttendanceText(value);
  if (['PRESENT', 'PRESENTE', 'ASISTIO', '✓', '✔'].includes(normalized)) return 'present';
  if (['ABSENT', 'FALTA', 'NO ASISTIO', 'X', '✕', '✗'].includes(normalized)) return 'absent';
  if (!normalized) return '';
  return null;
}

function attendanceMark(status) {
  if (status === 'present') return '✓';
  if (status === 'absent') return 'X';
  return '';
}

function resolveAttendanceStudentRow(names, students, record) {
  const studentId = String(record.studentId || '').trim();
  const student = students.find(item => String(item.id || '') === studentId);
  const studentName = normalizeAttendanceText(record.studentName || (student && student.nombre));
  if (!studentName) return null;

  const exactIndex = names.indexOf(studentName);
  if (exactIndex >= 0) return { row: ATTENDANCE_FIRST_STUDENT_ROW + exactIndex, name: studentName, needsName: false };

  const studentIndex = students.findIndex(item => String(item.id || '') === studentId);
  if (studentIndex >= 0 && !names[studentIndex]) {
    return { row: ATTENDANCE_FIRST_STUDENT_ROW + studentIndex, name: studentName, needsName: true };
  }
  return null;
}

function getAttendance(params) {
  const date = String(params.date || '').trim();
  const group = String(params.group || '').trim().toUpperCase();
  const parsed = parseAttendanceDate(date);
  if (!parsed || !group) return { success: false, error: 'Fecha y grupo son obligatorios' };
  if (date > attendanceToday()) return { success: false, error: 'No se permiten fechas futuras' };

  const access = getAttendanceSheet(group);
  if (!access.success) return access;
  const column = findAttendanceDateColumn(access.sheet, date);
  if (!column) return { success: true, data: [], sheetName: access.sheetName, warning: 'La fecha todavía no está colocada en la plantilla mensual' };

  const names = getAttendanceSheetNames(access.sheet);
  const marks = access.sheet.getRange(ATTENDANCE_FIRST_STUDENT_ROW, column, names.length, 1).getDisplayValues();
  const students = getAttendanceGroupStudents(group);
  const data = [];
  names.forEach((name, index) => {
    const status = attendanceStatusFromValue(marks[index][0]);
    if (!name || !status) return;
    const student = students.find(item => normalizeAttendanceText(item.nombre) === name);
    data.push({
      id: `${group}|${date}|${student ? student.id : name}`,
      date,
      group,
      studentId: student ? String(student.id) : name,
      studentName: student ? String(student.nombre || '') : name,
      status,
      note: '',
      usuario: '',
      updatedAt: ''
    });
  });
  return { success: true, data, sheetName: access.sheetName };
}

function getAttendanceMonth(params) {
  const month = String(params.month || '').trim();
  const group = String(params.group || '').trim().toUpperCase();
  const currentMonth = attendanceToday().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month) || !group) {
    return { success: false, error: 'Mes y grupo son obligatorios' };
  }
  if (month > currentMonth) return { success: false, error: 'No se permiten meses futuros' };

  const access = getAttendanceSheet(group);
  if (!access.success) return access;

  const slots = getAttendanceMonthSlots(`${month}-01`);
  if (!slots.length) return { success: false, error: 'Mes no válido' };

  const headerWidth = Math.max(access.sheet.getMaxColumns() - ATTENDANCE_FIRST_DAY_COLUMN + 1, 1);
  const headers = access.sheet
    .getRange(ATTENDANCE_WEEKDAY_ROW, ATTENDANCE_FIRST_DAY_COLUMN, 2, headerWidth)
    .getDisplayValues();
  const columns = slots.map(slot => {
    for (let index = 0; index < headerWidth; index++) {
      const weekday = normalizeAttendanceText(headers[0][index]);
      const day = Number(String(headers[1][index] || '').trim());
      if (day === slot.day && weekday === slot.weekday) {
        return ATTENDANCE_FIRST_DAY_COLUMN + index;
      }
    }
    return null;
  });

  const names = getAttendanceSheetNames(access.sheet);
  const students = getAttendanceGroupStudents(group);
  const studentsByName = {};
  students.forEach(student => {
    const name = normalizeAttendanceText(student.nombre);
    if (name && !studentsByName[name]) studentsByName[name] = student;
  });

  const validColumns = columns.filter(column => column !== null);
  const lastColumn = validColumns.length ? Math.max.apply(null, validColumns) : null;
  const marks = lastColumn
    ? access.sheet.getRange(
        ATTENDANCE_FIRST_STUDENT_ROW,
        ATTENDANCE_FIRST_DAY_COLUMN,
        names.length,
        lastColumn - ATTENDANCE_FIRST_DAY_COLUMN + 1
      ).getDisplayValues()
    : [];

  const data = slots.map((slot, slotIndex) => {
    const records = [];
    const column = columns[slotIndex];
    if (column !== null && slot.date <= attendanceToday()) {
      const markIndex = column - ATTENDANCE_FIRST_DAY_COLUMN;
      names.forEach((name, rowIndex) => {
        const status = attendanceStatusFromValue(marks[rowIndex][markIndex]);
        if (!name || !status) return;
        const student = studentsByName[name];
        records.push({
          id: `${group}|${slot.date}|${student ? student.id : name}`,
          date: slot.date,
          group,
          studentId: student ? String(student.id) : name,
          studentName: student ? String(student.nombre || '') : name,
          status,
          note: '',
          usuario: '',
          updatedAt: ''
        });
      });
    }
    return { date: slot.date, records };
  });

  return {
    success: true,
    data,
    sheetName: access.sheetName,
    mode: 'formatted-monthly-sheet'
  };
}

function saveAttendance(records) {
  if (!Array.isArray(records) || !records.length) {
    return { success: false, error: 'No hay registros de asistencia para guardar' };
  }

  const firstDate = String(records[0].date || '').trim();
  const firstGroup = String(records[0].group || '').trim().toUpperCase();
  const parsed = parseAttendanceDate(firstDate);
  if (!parsed || !firstGroup) return { success: false, error: 'Fecha y grupo son obligatorios' };
  if (firstDate > attendanceToday()) return { success: false, error: 'No se pueden guardar fechas futuras' };
  if (records.some(record => String(record.date || '').trim() !== firstDate || String(record.group || '').trim().toUpperCase() !== firstGroup)) {
    return { success: false, error: 'Solo se puede guardar un grupo y una fecha por operación' };
  }

  const access = getAttendanceSheet(firstGroup);
  if (!access.success) return access;
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const header = writeAttendanceMonthHeader(access.sheet, firstDate);
    if (!header.success) return header;
    const column = findAttendanceDateColumn(access.sheet, firstDate);
    if (!column) return { success: false, error: 'No se pudo ubicar la columna de la fecha en la plantilla' };

    const names = getAttendanceSheetNames(access.sheet);
    const students = getAttendanceGroupStudents(firstGroup);
    const operations = [];
    const missingStudents = [];
    records.forEach(record => {
      const status = attendanceStatusFromValue(record.status);
      if (status === null) throw new Error('La asistencia solo acepta ✓ o X');
      const resolved = resolveAttendanceStudentRow(names, students, record);
      if (!resolved) {
        missingStudents.push(String(record.studentName || record.studentId || 'alumno sin nombre'));
        return;
      }
      operations.push({ ...resolved, status, marker: attendanceMark(status) });
    });
    if (missingStudents.length) {
      return { success: false, error: `No se encontraron en ${access.sheetName}: ${missingStudents.slice(0, 5).join(', ')}` };
    }

    let updated = 0;
    operations.forEach(operation => {
      if (operation.needsName) access.sheet.getRange(operation.row, ATTENDANCE_NAME_COLUMN).setValue(operation.name);
      const cell = access.sheet.getRange(operation.row, column);
      const currentMarker = attendanceMark(attendanceStatusFromValue(cell.getDisplayValue()));
      if (currentMarker !== operation.marker) {
        cell.setValue(operation.marker);
        updated++;
      }
    });
    return { success: true, updated, sheetName: access.sheetName, mode: 'formatted-monthly-sheet', message: 'Asistencia guardada en la hoja mensual' };
  } finally {
    lock.releaseLock();
  }
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
