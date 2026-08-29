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

## Versión vigente y siguiente instalación

- **Producción vigente:** V10, con respaldos e historial mensual técnico funcionando. La auditoría previa a V11 detectó y permitió reparar 21 IDs heredados inválidos en `2A`; la verificación final confirmó 272 de 272 IDs válidos.
- **Siguiente candidata:** [AppsScript_V11.gs](../AppsScript_V11.gs), ya instalada en los datos reales con 272 inscripciones y 272 movimientos; pendiente únicamente de publicar la Web App.
- **Procedimiento exacto de V11:** [12_inscripciones_y_movimientos_v11.md](./12_inscripciones_y_movimientos_v11.md).

V10 fue migrada y publicada el 28 de agosto de 2026. El `ping` confirmó `studentIdentityReady: true` y `attendanceHistoryReady: true`.

---

## Código completo archivado de V9

El bloque siguiente conserva la referencia histórica de V9. Para la próxima actualización no copies este bloque: utiliza el archivo V11 indicado arriba y sigue su procedimiento exacto.

```javascript
// ==============================================================================
// SCRIPT PARA GOOGLE SHEETS - CONTROL ESCOLAR V9 (RESPALDOS + HISTORIAL MENSUAL SEGURO)
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
const ATTENDANCE_HISTORY_PREFIX = '_ASISTENCIA_DATOS_';
const ATTENDANCE_HISTORY_HEADERS = [
  'REGISTRO_ID', 'FECHA', 'GRUPO', 'ALUMNO_ID', 'NOMBRE',
  'ESTADO', 'NOTA', 'USUARIO', 'ACTUALIZADO_EN', 'ORIGEN'
];
const ATTENDANCE_HISTORY_READY_PROPERTY = 'ATTENDANCE_HISTORY_READY_V1';
// Mes que existe en las matrices actuales al instalar V9 por primera vez.
const ATTENDANCE_MIGRATION_MONTH = '2026-08';

// RESPALDOS. Estas funciones no se exponen en doGet/doPost: solamente las
// ejecuta la cuenta propietaria desde Apps Script o mediante el activador.
const BACKUP_FOLDER_NAME = 'Respaldos Control Asistencia';
const BACKUP_NAME_PREFIX = 'Control asistencia — RESPALDO — ';
const BACKUP_RETENTION = 30;
const BACKUP_TIMEZONE = 'America/Mexico_City';
const BACKUP_TRIGGER_HANDLER = 'runNightlyBackup';
const BACKUP_SOURCE_ID_PROPERTY = 'BACKUP_SOURCE_SPREADSHEET_ID';
const BACKUP_FOLDER_ID_PROPERTY = 'BACKUP_FOLDER_ID';
const BACKUP_LAST_SUCCESS_PROPERTY = 'BACKUP_LAST_SUCCESS_AT';

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
  const historyReady = attendanceHistoryIsReady_();
  return {
    success: true,
    mode: 'formatted-monthly-sheet',
    sheetPattern: 'ASISTENCIA (GRUPO)',
    storage: historyReady ? 'historical-events-v1' : 'formatted-monthly-sheet',
    historyReady,
    message: historyReady
      ? 'La asistencia conserva cada mes por fecha y regenera las hojas ASISTENCIA (GRUPO).'
      : 'Historial V9 pendiente de instalación; se mantiene compatibilidad de lectura con V7.'
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

function getAttendanceFromFormatted_(params) {
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

function getAttendanceMonthFromFormatted_(params) {
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

function saveAttendanceToFormatted_(records) {
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
// ASISTENCIA HISTÓRICA V9
// =====================================================
// V9 conserva un archivo técnico por mes, por ejemplo:
// _ASISTENCIA_DATOS_2026_08. Las matrices ASISTENCIA (1A), etc. continúan
// existiendo como formato visible, pero se regeneran desde estos registros.
function attendanceHistoryIsReady_() {
  return PropertiesService.getScriptProperties()
    .getProperty(ATTENDANCE_HISTORY_READY_PROPERTY) === 'true';
}

function normalizeAttendanceMonth_(month) {
  const value = String(month || '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return '';
  const monthNumber = Number(match[2]);
  return monthNumber >= 1 && monthNumber <= 12 ? value : '';
}

function attendanceHistorySheetName_(month) {
  const normalizedMonth = normalizeAttendanceMonth_(month);
  return normalizedMonth ? ATTENDANCE_HISTORY_PREFIX + normalizedMonth.replace('-', '_') : '';
}

function getAttendanceHistorySheet_(month) {
  const sheetName = attendanceHistorySheetName_(month);
  return sheetName
    ? SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
    : null;
}

function ensureAttendanceHistorySheet_(month) {
  const sheetName = attendanceHistorySheetName_(month);
  if (!sheetName) throw new Error('Mes histórico no válido: ' + month);
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, ATTENDANCE_HISTORY_HEADERS.length)
      .setValues([ATTENDANCE_HISTORY_HEADERS]);
    sheet.setFrozenRows(1);
  }
  if (!sheet.isSheetHidden()) sheet.hideSheet();
  return sheet;
}

function attendanceHistoryRecordId_(record) {
  return [
    String(record.group || '').trim().toUpperCase(),
    String(record.date || '').trim(),
    String(record.studentId || '').trim()
  ].join('|');
}

function attendanceHistoryRowToRecord_(row) {
  return {
    id: String(row[0] || ''),
    date: String(row[1] || ''),
    group: String(row[2] || '').trim().toUpperCase(),
    studentId: String(row[3] || ''),
    studentName: String(row[4] || ''),
    status: attendanceStatusFromValue(row[5]) || '',
    note: String(row[6] || ''),
    usuario: String(row[7] || ''),
    updatedAt: String(row[8] || ''),
    source: String(row[9] || '')
  };
}

function attendanceHistoryRecordToRow_(record) {
  return [
    attendanceHistoryRecordId_(record),
    String(record.date || ''),
    String(record.group || '').trim().toUpperCase(),
    String(record.studentId || ''),
    String(record.studentName || ''),
    String(record.status || ''),
    String(record.note || '').slice(0, 180),
    String(record.usuario || ''),
    String(record.updatedAt || ''),
    String(record.source || '')
  ];
}

function getAttendanceHistoryRecords_(month, group) {
  const sheet = getAttendanceHistorySheet_(month);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const normalizedGroup = String(group || '').trim().toUpperCase();
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, ATTENDANCE_HISTORY_HEADERS.length)
    .getDisplayValues()
    .map(attendanceHistoryRowToRecord_)
    .filter(record => record.id && (!normalizedGroup || record.group === normalizedGroup));
}

function writeAttendanceHistoryRecords_(records, source) {
  const recordsByMonth = {};
  (records || []).forEach(record => {
    const parsed = parseAttendanceDate(record.date);
    if (!parsed) throw new Error('Fecha de asistencia no válida: ' + record.date);
    const month = parsed.date.slice(0, 7);
    if (!recordsByMonth[month]) recordsByMonth[month] = [];
    recordsByMonth[month].push(record);
  });

  let changed = 0;
  Object.keys(recordsByMonth).forEach(month => {
    const sheet = ensureAttendanceHistorySheet_(month);
    const existing = getAttendanceHistoryRecords_(month);
    const byId = {};
    existing.forEach(record => { byId[record.id] = record; });

    recordsByMonth[month].forEach(input => {
      const group = String(input.group || '').trim().toUpperCase();
      const studentId = String(input.studentId || '').trim();
      if (!TABS.includes(group) || !studentId) {
        throw new Error('Grupo y alumno son obligatorios para guardar asistencia');
      }
      const id = attendanceHistoryRecordId_(input);
      const status = attendanceStatusFromValue(input.status);
      if (status === null) throw new Error('La asistencia sólo acepta ✓, X o vacío');
      if (!status) {
        if (byId[id]) {
          delete byId[id];
          changed++;
        }
        return;
      }
      byId[id] = {
        ...input,
        id,
        group,
        studentId,
        status,
        updatedAt: String(input.updatedAt || new Date().toISOString()),
        source: String(source || input.source || 'panel')
      };
      changed++;
    });

    const nextRecords = Object.values(byId).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.group).localeCompare(String(b.group)) ||
      String(a.studentName).localeCompare(String(b.studentName))
    );
    const rowsToClear = Math.max(sheet.getLastRow() - 1, nextRecords.length, 1);
    sheet.getRange(2, 1, rowsToClear, ATTENDANCE_HISTORY_HEADERS.length).clearContent();
    if (nextRecords.length) {
      sheet.getRange(2, 1, nextRecords.length, ATTENDANCE_HISTORY_HEADERS.length)
        .setValues(nextRecords.map(attendanceHistoryRecordToRow_));
    }
  });
  return changed;
}

function getAttendance(params) {
  if (!attendanceHistoryIsReady_()) return getAttendanceFromFormatted_(params);
  const date = String(params.date || '').trim();
  const group = String(params.group || '').trim().toUpperCase();
  const parsed = parseAttendanceDate(date);
  if (!parsed || !TABS.includes(group)) {
    return { success: false, error: 'Fecha y grupo son obligatorios' };
  }
  if (date > attendanceToday()) return { success: false, error: 'No se permiten fechas futuras' };
  const access = getAttendanceSheet(group);
  if (!access.success) return access;
  const data = getAttendanceHistoryRecords_(date.slice(0, 7), group)
    .filter(record => record.date === date)
    .map(record => ({ ...record, status: attendanceStatusFromValue(record.status) }));
  return {
    success: true,
    data,
    sheetName: access.sheetName,
    mode: 'formatted-monthly-sheet',
    storage: 'historical-events-v1'
  };
}

function getAttendanceMonth(params) {
  if (!attendanceHistoryIsReady_()) return getAttendanceMonthFromFormatted_(params);
  const month = normalizeAttendanceMonth_(params.month);
  const group = String(params.group || '').trim().toUpperCase();
  const currentMonth = attendanceToday().slice(0, 7);
  if (!month || !TABS.includes(group)) {
    return { success: false, error: 'Mes y grupo son obligatorios' };
  }
  if (month > currentMonth) return { success: false, error: 'No se permiten meses futuros' };
  const access = getAttendanceSheet(group);
  if (!access.success) return access;

  const records = getAttendanceHistoryRecords_(month, group);
  const byDate = {};
  records.forEach(record => {
    if (!byDate[record.date]) byDate[record.date] = [];
    byDate[record.date].push(record);
  });
  const data = getAttendanceMonthSlots(month + '-01').map(slot => ({
    date: slot.date,
    records: slot.date <= attendanceToday() ? (byDate[slot.date] || []) : []
  }));
  return {
    success: true,
    data,
    sheetName: access.sheetName,
    mode: 'formatted-monthly-sheet',
    storage: 'historical-events-v1'
  };
}

function renderAttendanceHistoryMonth_(group, month) {
  const access = getAttendanceSheet(group);
  if (!access.success) return access;
  const students = getAttendanceGroupStudents(group);
  const capacity = ATTENDANCE_LAST_STUDENT_ROW - ATTENDANCE_FIRST_STUDENT_ROW + 1;
  if (students.length > capacity) {
    return { success: false, error: access.sheetName + ' sólo tiene espacio para ' + capacity + ' alumnos' };
  }
  const header = writeAttendanceMonthHeader(access.sheet, month + '-01');
  if (!header.success) return header;

  const slots = header.slots;
  const width = slots[slots.length - 1].column - ATTENDANCE_FIRST_DAY_COLUMN + 1;
  access.sheet.getRange(ATTENDANCE_FIRST_STUDENT_ROW, ATTENDANCE_NAME_COLUMN, capacity, 1).clearContent();
  access.sheet.getRange(ATTENDANCE_FIRST_STUDENT_ROW, ATTENDANCE_FIRST_DAY_COLUMN, capacity, width).clearContent();
  if (students.length) {
    access.sheet.getRange(ATTENDANCE_FIRST_STUDENT_ROW, ATTENDANCE_NAME_COLUMN, students.length, 1)
      .setValues(students.map(student => [String(student.nombre || '')]));
  }

  const rowByStudentId = {};
  const rowByName = {};
  students.forEach((student, index) => {
    rowByStudentId[String(student.id || '')] = index;
    rowByName[normalizeAttendanceText(student.nombre)] = index;
  });
  const slotByDate = {};
  slots.forEach(slot => { slotByDate[slot.date] = slot; });
  const marks = Array.from({ length: capacity }, () => Array(width).fill(''));
  const historyRecords = getAttendanceHistoryRecords_(month, group);
  historyRecords.forEach(record => {
    const slot = slotByDate[record.date];
    const rowIndex = rowByStudentId[record.studentId] !== undefined
      ? rowByStudentId[record.studentId]
      : rowByName[normalizeAttendanceText(record.studentName)];
    if (!slot || rowIndex === undefined) return;
    marks[rowIndex][slot.column - ATTENDANCE_FIRST_DAY_COLUMN] = attendanceMark(record.status);
  });
  access.sheet.getRange(ATTENDANCE_FIRST_STUDENT_ROW, ATTENDANCE_FIRST_DAY_COLUMN, capacity, width)
    .setValues(marks);
  return { success: true, sheetName: access.sheetName, month, records: historyRecords.length };
}

function saveAttendance(records) {
  if (!attendanceHistoryIsReady_()) return saveAttendanceToFormatted_(records);
  if (!Array.isArray(records) || !records.length) {
    return { success: false, error: 'No hay registros de asistencia para guardar' };
  }
  const firstDate = String(records[0].date || '').trim();
  const firstGroup = String(records[0].group || '').trim().toUpperCase();
  const parsed = parseAttendanceDate(firstDate);
  if (!parsed || !TABS.includes(firstGroup)) return { success: false, error: 'Fecha y grupo son obligatorios' };
  if (firstDate > attendanceToday()) return { success: false, error: 'No se pueden guardar fechas futuras' };
  if (records.some(record =>
    String(record.date || '').trim() !== firstDate ||
    String(record.group || '').trim().toUpperCase() !== firstGroup
  )) {
    return { success: false, error: 'Sólo se puede guardar un grupo y una fecha por operación' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const updated = writeAttendanceHistoryRecords_(records, 'panel');
    const rendered = renderAttendanceHistoryMonth_(firstGroup, firstDate.slice(0, 7));
    if (!rendered.success) return rendered;
    return {
      success: true,
      updated,
      sheetName: rendered.sheetName,
      mode: 'formatted-monthly-sheet',
      storage: 'historical-events-v1',
      message: 'Asistencia guardada con historial mensual'
    };
  } finally {
    lock.releaseLock();
  }
}

function readFormattedAttendanceMonthForMigration_(month) {
  const migrated = [];
  TABS.forEach(group => {
    const access = getAttendanceSheet(group);
    if (!access.success) return;
    const slots = getAttendanceMonthSlots(month + '-01');
    const names = getAttendanceSheetNames(access.sheet);
    const students = getAttendanceGroupStudents(group);
    const studentsByName = {};
    students.forEach(student => {
      const name = normalizeAttendanceText(student.nombre);
      if (name && !studentsByName[name]) studentsByName[name] = student;
    });
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
    slots.forEach((slot, slotIndex) => {
      const column = columns[slotIndex];
      if (column === null) return;
      const markIndex = column - ATTENDANCE_FIRST_DAY_COLUMN;
      names.forEach((name, index) => {
        const status = attendanceStatusFromValue(marks[index][markIndex]);
        if (!name || !status) return;
        const student = studentsByName[name];
        migrated.push({
          date: slot.date,
          group,
          studentId: student ? String(student.id) : name,
          studentName: student ? String(student.nombre || '') : name,
          status,
          note: '',
          usuario: 'MIGRACION_V9',
          updatedAt: new Date().toISOString()
        });
      });
    });
  });
  return migrated;
}

// Ejecutar UNA VEZ antes de publicar V9. Es idempotente: si ya terminó,
// devuelve el estado y no vuelve a importar una matriz que después haya cambiado.
function setupAttendanceHistoryV9() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (attendanceHistoryIsReady_()) return getAttendanceHistoryStatus();
    const migrated = readFormattedAttendanceMonthForMigration_(ATTENDANCE_MIGRATION_MONTH);
    ensureAttendanceHistorySheet_(ATTENDANCE_MIGRATION_MONTH);
    if (migrated.length) writeAttendanceHistoryRecords_(migrated, 'migration-v9');
    PropertiesService.getScriptProperties()
      .setProperty(ATTENDANCE_HISTORY_READY_PROPERTY, 'true');
    const result = {
      success: true,
      ready: true,
      migrationMonth: ATTENDANCE_MIGRATION_MONTH,
      migratedRecords: migrated.length,
      message: 'Historial mensual V9 instalado'
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function getAttendanceHistoryStatus() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const months = spreadsheet.getSheets()
    .map(sheet => sheet.getName())
    .filter(name => name.indexOf(ATTENDANCE_HISTORY_PREFIX) === 0)
    .sort();
  const result = {
    success: true,
    ready: attendanceHistoryIsReady_(),
    migrationMonth: ATTENDANCE_MIGRATION_MONTH,
    monthSheets: months
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// =====================================================
// RESPALDOS COMPLETOS EN DRIVE
// =====================================================
// Ejecutar setupBackups() UNA SOLA VEZ desde el editor de Apps Script con la
// cuenta propietaria. Crea la carpeta privada, el respaldo inicial y un
// activador nocturno. Los snapshots incluyen todas las hojas y su formato.
function setupBackups() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Abre este script desde el Google Sheet antes de instalar los respaldos.');
  }

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(BACKUP_SOURCE_ID_PROPERTY, spreadsheet.getId());
  const folder = getOrCreateBackupFolder_();

  const existingTriggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === BACKUP_TRIGGER_HANDLER);
  existingTriggers.slice(1).forEach(trigger => ScriptApp.deleteTrigger(trigger));
  if (!existingTriggers.length) {
    ScriptApp.newTrigger(BACKUP_TRIGGER_HANDLER)
      .timeBased()
      .atHour(2)
      .everyDays(1)
      .inTimezone(BACKUP_TIMEZONE)
      .create();
  }

  const initialBackup = createBackupSnapshot_('INICIAL');
  const result = {
    success: true,
    folderId: folder.getId(),
    folderName: folder.getName(),
    initialBackup,
    retention: BACKUP_RETENTION,
    schedule: 'Diario alrededor de las 02:00 (' + BACKUP_TIMEZONE + ')'
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function runNightlyBackup() {
  return createBackupSnapshot_('NOCTURNO');
}

function createManualBackup() {
  return createBackupSnapshot_('MANUAL');
}

function getBackupStatus() {
  const properties = PropertiesService.getScriptProperties();
  const folder = getOrCreateBackupFolder_();
  const backups = listManagedBackups_(folder);
  const result = {
    success: true,
    sourceSpreadsheetId: properties.getProperty(BACKUP_SOURCE_ID_PROPERTY) || '',
    folderId: folder.getId(),
    folderName: folder.getName(),
    retention: BACKUP_RETENTION,
    totalManagedBackups: backups.length,
    lastSuccessAt: properties.getProperty(BACKUP_LAST_SUCCESS_PROPERTY) || '',
    latest: backups.slice(0, 5).map(file => ({
      id: file.getId(),
      name: file.getName(),
      createdAt: file.getDateCreated().toISOString()
    }))
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function disableAutomaticBackups() {
  const triggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === BACKUP_TRIGGER_HANDLER);
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  const result = { success: true, deletedTriggers: triggers.length };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function createBackupSnapshot_(label) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const properties = PropertiesService.getScriptProperties();
    let sourceId = properties.getProperty(BACKUP_SOURCE_ID_PROPERTY);
    if (!sourceId) {
      const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!activeSpreadsheet) {
        throw new Error('Respaldos no instalados. Ejecuta setupBackups() primero.');
      }
      sourceId = activeSpreadsheet.getId();
      properties.setProperty(BACKUP_SOURCE_ID_PROPERTY, sourceId);
    }

    const folder = getOrCreateBackupFolder_();
    const sourceFile = DriveApp.getFileById(sourceId);
    const safeLabel = String(label || 'MANUAL')
      .toUpperCase()
      .replace(/[^A-Z0-9ÁÉÍÓÚÜÑ_-]/g, '_')
      .slice(0, 30);
    const timestamp = Utilities.formatDate(new Date(), BACKUP_TIMEZONE, 'yyyy-MM-dd_HHmmss');
    const copy = sourceFile.makeCopy(BACKUP_NAME_PREFIX + safeLabel + ' — ' + timestamp, folder);
    const deletedOldCopies = enforceBackupRetention_(folder);
    const completedAt = new Date().toISOString();
    properties.setProperty(BACKUP_LAST_SUCCESS_PROPERTY, completedAt);

    const result = {
      success: true,
      id: copy.getId(),
      name: copy.getName(),
      createdAt: completedAt,
      deletedOldCopies
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateBackupFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty(BACKUP_FOLDER_ID_PROPERTY);
  if (folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      if (!folder.isTrashed()) return folder;
    } catch (error) {
      console.warn('La carpeta de respaldos anterior ya no está disponible: ' + error.message);
    }
  }

  const folder = DriveApp.createFolder(BACKUP_FOLDER_NAME);
  properties.setProperty(BACKUP_FOLDER_ID_PROPERTY, folder.getId());
  return folder;
}

function listManagedBackups_(folder) {
  const files = folder.getFiles();
  const backups = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf(BACKUP_NAME_PREFIX) === 0 && !file.isTrashed()) {
      backups.push(file);
    }
  }
  return backups.sort((a, b) => b.getDateCreated().getTime() - a.getDateCreated().getTime());
}

function enforceBackupRetention_(folder) {
  const backups = listManagedBackups_(folder);
  const expired = backups.slice(BACKUP_RETENTION);
  expired.forEach(file => file.setTrashed(true));
  return expired.length;
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

---

## Instalar el historial mensual V9 (antes de publicar V9)

V9 mantiene el contrato que ya usa el panel, pero cambia la fuente histórica. Conserva las 12 hojas visibles `ASISTENCIA (GRUPO)` y crea una hoja técnica oculta por mes para toda la escuela: `_ASISTENCIA_DATOS_2026_08`, `_ASISTENCIA_DATOS_2026_09`, etc.

Orden obligatorio:

1. Crear o confirmar primero el respaldo inicial.
2. Pegar y **guardar** V9 en el editor, sin publicar todavía la nueva versión web.
3. Ejecutar manualmente `setupAttendanceHistoryV9`.
4. Confirmar en el registro `ready: true` y revisar que exista `_ASISTENCIA_DATOS_2026_08` como hoja oculta.
5. Ejecutar `getAttendanceHistoryStatus` y confirmar el mes de migración.
6. Publicar V9 como nueva versión conservando la URL `/exec`.
7. Probar un registro de agosto, uno de septiembre y volver a consultar agosto.

La instalación es idempotente: después de completarse no vuelve a importar automáticamente la matriz visible de agosto. A partir de V9, las correcciones de asistencia deben hacerse desde el panel. Las hojas `ASISTENCIA (GRUPO)` son formatos regenerables para revisión e impresión, no la única fuente histórica.

---

## Instalar los respaldos (una sola vez)

V9 conserva las funciones de respaldo introducidas en V8. Si todavía no se ejecutó la instalación:

1. En el selector de funciones del editor elige `setupBackups`.
2. Pulsa **Ejecutar** con la cuenta propietaria del Sheet.
3. Autoriza acceso a Google Sheets y Google Drive.
4. Abre **Ejecuciones** y confirma que terminó correctamente.
5. Ejecuta `getBackupStatus` y revisa en el registro que exista al menos el snapshot `INICIAL`.
6. Publica una **nueva versión** de la implementación web para que el código documentado y el publicado queden alineados. La URL `/exec` se conserva.

La instalación crea en Mi unidad la carpeta privada `Respaldos Control Asistencia`, hace una copia completa inmediata y programa otra cada noche alrededor de las 02:00, hora de Ciudad de México. Conserva las 30 copias administradas más recientes; las antiguas se envían a la papelera y siguen siendo recuperables mientras Drive no la vacíe.

No se agregó una acción de respaldo a la API pública. Esto evita que cualquier persona que conozca la URL `/exec` pueda generar copias o consultar sus identificadores.

Para una copia extraordinaria antes de una operación delicada, ejecuta `createManualBackup`. Para detener solamente el activador nocturno, ejecuta `disableAutomaticBackups`.

El procedimiento completo de comprobación y restauración está en [09_respaldos_y_restauracion.md](./09_respaldos_y_restauracion.md).
