// ==============================================================================
// SCRIPT PARA GOOGLE SHEETS - CONTROL ESCOLAR V11 (INSCRIPCIONES + MOVIMIENTOS)
// ==============================================================================

const HEADER_ROW = 5;
const TABS = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'];
const STUDENT_VISIBLE_COLUMNS = 20;
const STUDENT_META_START_COLUMN = 21;
const STUDENT_META_HEADERS = [
  'ALUMNO_ID', 'ESTATUS', 'CICLO_ESCOLAR', 'FECHA_ALTA_SISTEMA',
  'FECHA_ESTATUS', 'ACTUALIZADO_EN', 'ACTUALIZADO_POR'
];
const STUDENT_TOTAL_COLUMNS = STUDENT_VISIBLE_COLUMNS + STUDENT_META_HEADERS.length;
const STUDENT_IDENTITY_READY_PROPERTY = 'STUDENT_IDENTITY_READY_V1';
const CURRENT_SCHOOL_CYCLE = '2026-2027';
const STUDENT_ACTIVE_STATUS = 'ACTIVO';
const STUDENT_ALLOWED_STATUSES = ['ACTIVO', 'BAJA', 'TRANSFERIDO', 'EGRESADO'];
const SCHOOL_ID = '10DPR0519X';
const ENROLLMENTS_SHEET_NAME = '_INSCRIPCIONES';
const ENROLLMENT_HEADERS = [
  'INSCRIPCION_ID', 'ALUMNO_ID', 'CICLO_ESCOLAR', 'GRADO', 'GRUPO',
  'GRUPO_ID', 'ESTATUS', 'FECHA_INICIO', 'FECHA_FIN', 'MOTIVO_FIN',
  'ACTUALIZADO_EN', 'ACTUALIZADO_POR', 'ORIGEN', 'ESCUELA_ID'
];
const STUDENT_MOVEMENTS_SHEET_NAME = '_MOVIMIENTOS_ALUMNO';
const STUDENT_MOVEMENT_HEADERS = [
  'MOVIMIENTO_ID', 'ALUMNO_ID', 'INSCRIPCION_ID', 'TIPO', 'FECHA_EFECTIVA',
  'CICLO_ORIGEN', 'GRUPO_ORIGEN', 'CICLO_DESTINO', 'GRUPO_DESTINO',
  'ESTATUS_RESULTANTE', 'MOTIVO', 'OBSERVACION', 'USUARIO', 'CREADO_EN',
  'ORIGEN', 'ESCUELA_ID'
];
const ENROLLMENT_HISTORY_READY_PROPERTY = 'ENROLLMENT_HISTORY_READY_V1';
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
    if (action === 'getStudents') return respond(getStudents(params));
    if (action === 'saveStudent') return respond(saveStudent(params.data));
    if (action === 'deleteStudent') return respond(deleteStudent(
      params.grupo,
      params.alumnoId || params.id,
      params.rowId || params.id,
      params.usuario
    ));
    if (action === 'setStudentStatus') return respond(setStudentStatus(params));
    if (action === 'getInactiveStudents') return respond(getInactiveStudents());
    if (action === 'reactivateStudent') return respond(reactivateStudent(params));
    if (action === 'getStudentLifecycle') return respond(getStudentLifecycle(params));
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
    return respond({
      status: 'ok',
      version: 'V11',
      studentIdentityReady: studentIdentityIsReady_(),
      enrollmentHistoryReady: enrollmentHistoryIsReady_(),
      attendanceHistoryReady: attendanceHistoryIsReady_(),
      message: 'API funcionando'
    });
  }
  return respond(getStudents());
}

// =====================================================
// ALUMNOS (20 columnas visibles + metadatos ocultos V10)
// =====================================================
function getStudents(options) {
  const includeInactive = Boolean(options && options.includeInactive);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let allStudents = [];
  TABS.forEach(tabName => {
    allStudents = allStudents.concat(getStudentsForGroup(tabName, includeInactive));
  });
  return {
    success: true,
    data: allStudents,
    version: 'V11',
    identityReady: studentIdentityIsReady_(),
    enrollmentHistoryReady: enrollmentHistoryIsReady_(),
    cycle: CURRENT_SCHOOL_CYCLE
  };
}

function getStudentsForGroup(group, includeInactive) {
  const normalizedGroup = String(group || '').trim().toUpperCase();
  if (!TABS.includes(normalizedGroup)) return [];

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(normalizedGroup);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= HEADER_ROW) return [];

  const availableColumns = Math.min(STUDENT_TOTAL_COLUMNS, sheet.getMaxColumns());
  const data = sheet.getRange(HEADER_ROW + 1, 1, lastRow - HEADER_ROW, availableColumns).getValues();
  const students = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row[4]) continue;
    const student = rowToObject(row, i + HEADER_ROW + 1, normalizedGroup);
    if (!includeInactive && student.estatus !== STUDENT_ACTIVE_STATUS) continue;
    students.push(student);
  }
  return students;
}

function studentIdentityIsReady_() {
  return PropertiesService.getScriptProperties().getProperty(STUDENT_IDENTITY_READY_PROPERTY) === 'true';
}

function generateStudentId_() {
  return 'ALU-' + Utilities.getUuid().replace(/-/g, '').toUpperCase();
}

function normalizeStudentStatus_(status) {
  const normalized = String(status || STUDENT_ACTIVE_STATUS).trim().toUpperCase();
  return STUDENT_ALLOWED_STATUSES.includes(normalized) ? normalized : STUDENT_ACTIVE_STATUS;
}

function ensureStudentMetadataColumns_(sheet) {
  if (sheet.getMaxColumns() < STUDENT_TOTAL_COLUMNS) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), STUDENT_TOTAL_COLUMNS - sheet.getMaxColumns());
  }
  const existingHeaders = sheet
    .getRange(HEADER_ROW, STUDENT_META_START_COLUMN, 1, STUDENT_META_HEADERS.length)
    .getDisplayValues()[0];
  const needsSetup = STUDENT_META_HEADERS.some((header, index) => existingHeaders[index] !== header);
  if (needsSetup) {
    sheet.getRange(HEADER_ROW, STUDENT_META_START_COLUMN, 1, STUDENT_META_HEADERS.length)
      .setValues([STUDENT_META_HEADERS]);
    const statusValidation = SpreadsheetApp.newDataValidation()
      .requireValueInList(STUDENT_ALLOWED_STATUSES, true)
      .setAllowInvalid(false)
      .build();
    const validationHeight = Math.max(sheet.getMaxRows() - HEADER_ROW, 1);
    sheet.getRange(HEADER_ROW + 1, STUDENT_META_START_COLUMN + 1, validationHeight, 1)
      .setDataValidation(statusValidation);
  }
  sheet.hideColumns(STUDENT_META_START_COLUMN, STUDENT_META_HEADERS.length);
}

function findStudentRowById_(sheet, alumnoId) {
  const normalizedId = String(alumnoId || '').trim();
  if (!normalizedId || sheet.getLastRow() <= HEADER_ROW || sheet.getMaxColumns() < STUDENT_META_START_COLUMN) return null;
  const values = sheet
    .getRange(HEADER_ROW + 1, STUDENT_META_START_COLUMN, sheet.getLastRow() - HEADER_ROW, 1)
    .getDisplayValues();
  const index = values.findIndex(row => String(row[0] || '').trim() === normalizedId);
  return index >= 0 ? HEADER_ROW + 1 + index : null;
}

function resolveStudentRow_(sheet, alumnoId, rowId) {
  const normalizedId = String(alumnoId || '').trim();
  const byId = findStudentRowById_(sheet, normalizedId);
  if (byId) return byId;
  // Si ya existe una identidad permanente, nunca caer a una fila posiblemente
  // obsoleta: es preferible rechazar la operación que modificar a otro alumno.
  if (normalizedId.indexOf('ALU-') === 0) return null;
  const numericRow = Number(rowId);
  if (numericRow > HEADER_ROW && numericRow <= sheet.getLastRow()) return numericRow;
  return null;
}

function saveStudent(student) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gradoNum = String(student.grado || '').charAt(0);
    const grupo = String(student.grupo || '').trim().toUpperCase();
    const hojaNombre = String(student.grupoId || ((grupo.length === 1 && gradoNum) ? gradoNum + grupo : grupo)).toUpperCase();
    if (!TABS.includes(hojaNombre)) return { success: false, error: 'Grupo no válido: ' + hojaNombre };
    const sheet = ss.getSheetByName(hojaNombre);
    if (!sheet) return { success: false, error: 'La hoja no existe: ' + hojaNombre };
    ensureStudentMetadataColumns_(sheet);

    const candidateId = String(student.alumnoId || student.id || '').trim();
    const requestedId = candidateId.indexOf('ALU-') === 0 ? candidateId : '';
    let targetRow = resolveStudentRow_(sheet, requestedId, student.rowId);
    const isNew = !targetRow;
    if (isNew) targetRow = Math.max(sheet.getLastRow() + 1, HEADER_ROW + 1);

    const existingRow = isNew
      ? Array(STUDENT_TOTAL_COLUMNS).fill('')
      : sheet.getRange(targetRow, 1, 1, STUDENT_TOTAL_COLUMNS).getValues()[0];
    const now = new Date().toISOString();
    const metadata = {
      alumnoId: String(existingRow[20] || requestedId || generateStudentId_()),
      estatus: normalizeStudentStatus_(existingRow[21] || student.estatus),
      cicloEscolar: String(existingRow[22] || student.cicloEscolar || CURRENT_SCHOOL_CYCLE),
      fechaAltaSistema: existingRow[23] || now,
      fechaEstatus: existingRow[24] || now,
      actualizadoEn: now,
      actualizadoPor: String(student.actualizadoPor || student.usuario || '')
    };
    const rowData = objectToRow(student, targetRow - HEADER_ROW, metadata);
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    const savedStudent = rowToObject(rowData, targetRow, hojaNombre);
    return {
      success: true,
      message: isNew ? 'Alumno registrado' : 'Alumno actualizado',
      data: savedStudent
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteStudent(grupo, alumnoId, rowId, usuario) {
  return setStudentStatus({
    grupo,
    alumnoId,
    rowId,
    estatus: 'BAJA',
    usuario
  });
}

function setStudentStatus(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const group = String(params.grupo || '').trim().toUpperCase();
    if (!TABS.includes(group)) return { success: false, error: 'Grupo no válido' };
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(group);
    if (!sheet) return { success: false, error: 'Hoja no encontrada' };
    ensureStudentMetadataColumns_(sheet);
    const row = resolveStudentRow_(sheet, params.alumnoId || params.id, params.rowId);
    if (!row) return { success: false, error: 'Alumno no encontrado' };

    const status = normalizeStudentStatus_(params.estatus);
    const now = new Date().toISOString();
    const existingMetadata = sheet
      .getRange(row, STUDENT_META_START_COLUMN, 1, STUDENT_META_HEADERS.length)
      .getValues()[0];
    const previousStatus = normalizeStudentStatus_(existingMetadata[1]);
    if (!existingMetadata[0]) existingMetadata[0] = generateStudentId_();
    existingMetadata[1] = status;
    existingMetadata[2] = existingMetadata[2] || CURRENT_SCHOOL_CYCLE;
    existingMetadata[3] = existingMetadata[3] || now;
    existingMetadata[4] = now;
    existingMetadata[5] = now;
    existingMetadata[6] = String(params.usuario || '');
    sheet.getRange(row, STUDENT_META_START_COLUMN, 1, STUDENT_META_HEADERS.length)
      .setValues([existingMetadata]);
    if (enrollmentHistoryIsReady_() && previousStatus !== status) {
      recordStudentStatusMovementV11_({
        alumnoId: String(existingMetadata[0]),
        cycle: String(existingMetadata[2] || CURRENT_SCHOOL_CYCLE),
        group,
        previousStatus,
        status,
        effectiveDate: params.fechaEfectiva,
        reason: params.motivo,
        observation: params.observacion,
        user: params.usuario
      });
    }
    return {
      success: true,
      message: status === 'BAJA' ? 'Alumno dado de baja; sus datos se conservaron' : 'Estatus actualizado',
      alumnoId: String(existingMetadata[0]),
      estatus: status
    };
  } finally {
    lock.releaseLock();
  }
}

function objectToRow(s, num, metadata) {
  const meta = metadata || {};
  return [
    num, s.grado, s.grupo, s.folio, s.nombre, s.barreraAprendizaje,
    s.fechaNacimiento, s.curpAlumno, s.genero, s.beca, s.peso, s.estatura,
    s.talla, s.tutor, s.telefono, s.curpTutor, s.correo, s.domicilio,
    s.nivelEstudio, s.ocupacion,
    meta.alumnoId || s.alumnoId || '',
    normalizeStudentStatus_(meta.estatus || s.estatus),
    meta.cicloEscolar || s.cicloEscolar || CURRENT_SCHOOL_CYCLE,
    meta.fechaAltaSistema || s.fechaAltaSistema || '',
    meta.fechaEstatus || s.fechaEstatus || '',
    meta.actualizadoEn || s.actualizadoEn || '',
    meta.actualizadoPor || s.actualizadoPor || ''
  ];
}

function rowToObject(row, rowIndex, tabName) {
  const alumnoId = String(row[20] || '').trim();
  return {
    rowId: rowIndex,
    id: alumnoId || tabName + '-' + rowIndex,
    alumnoId,
    grupoId: tabName,
    grado: row[1],
    grupo: row[2] || tabName.slice(-1),
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
    ocupacion: row[19],
    estatus: normalizeStudentStatus_(row[21]),
    cicloEscolar: String(row[22] || CURRENT_SCHOOL_CYCLE),
    fechaAltaSistema: formatDateTime_(row[23]),
    fechaEstatus: formatDateTime_(row[24]),
    actualizadoEn: formatDateTime_(row[25]),
    actualizadoPor: String(row[26] || '')
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
    const belongsToGroup = String(student.grupoId || '').toUpperCase() === group ||
      id.indexOf(`${group}-`) === 0;
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
// IDENTIDAD PERMANENTE DE ALUMNOS V10
// =====================================================
// Ejecutar UNA VEZ antes de publicar la implementación V10. Es idempotente.
// Añade metadatos ocultos después de las 20 columnas oficiales, asigna un ID
// permanente a cada alumno activo y actualiza los IDs históricos de asistencia.
function setupStudentIdentityV10() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (studentIdentityIsReady_()) return getStudentIdentityStatus();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date().toISOString();
    const legacyIdMap = {};
    const nameIdMap = {};
    let migratedStudents = 0;

    TABS.forEach(group => {
      const sheet = spreadsheet.getSheetByName(group);
      if (!sheet) return;
      ensureStudentMetadataColumns_(sheet);
      const lastRow = sheet.getLastRow();
      if (lastRow <= HEADER_ROW) return;

      const height = lastRow - HEADER_ROW;
      const visibleRows = sheet
        .getRange(HEADER_ROW + 1, 1, height, STUDENT_VISIBLE_COLUMNS)
        .getValues();
      const metadataRows = sheet
        .getRange(HEADER_ROW + 1, STUDENT_META_START_COLUMN, height, STUDENT_META_HEADERS.length)
        .getValues();

      visibleRows.forEach((row, index) => {
        if (!row[4]) return;
        const sheetRow = HEADER_ROW + 1 + index;
        const metadata = metadataRows[index];
        const alumnoId = String(metadata[0] || generateStudentId_());
        if (!metadata[0]) migratedStudents++;
        metadata[0] = alumnoId;
        metadata[1] = normalizeStudentStatus_(metadata[1]);
        metadata[2] = metadata[2] || CURRENT_SCHOOL_CYCLE;
        metadata[3] = metadata[3] || now;
        metadata[4] = metadata[4] || now;
        metadata[5] = metadata[5] || now;
        metadata[6] = metadata[6] || 'MIGRACION_V10';

        legacyIdMap[`${group}-${sheetRow}`] = alumnoId;
        const nameKey = `${group}|${normalizeAttendanceText(row[4])}`;
        if (nameIdMap[nameKey] && nameIdMap[nameKey] !== alumnoId) {
          nameIdMap[nameKey] = null;
        } else if (nameIdMap[nameKey] !== null) {
          nameIdMap[nameKey] = alumnoId;
        }
      });

      sheet
        .getRange(HEADER_ROW + 1, STUDENT_META_START_COLUMN, height, STUDENT_META_HEADERS.length)
        .setValues(metadataRows);
    });

    const migratedAttendanceRecords = migrateAttendanceStudentIdsV10_(legacyIdMap, nameIdMap);
    PropertiesService.getScriptProperties().setProperty(STUDENT_IDENTITY_READY_PROPERTY, 'true');
    const result = {
      success: true,
      ready: true,
      version: 'V11',
      cycle: CURRENT_SCHOOL_CYCLE,
      migratedStudents,
      migratedAttendanceRecords,
      message: 'Identidad permanente V10 instalada'
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function migrateAttendanceStudentIdsV10_(legacyIdMap, nameIdMap) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let changed = 0;
  spreadsheet.getSheets()
    .filter(sheet => sheet.getName().indexOf(ATTENDANCE_HISTORY_PREFIX) === 0)
    .forEach(sheet => {
      if (sheet.getLastRow() <= 1) return;
      const height = sheet.getLastRow() - 1;
      const rows = sheet
        .getRange(2, 1, height, ATTENDANCE_HISTORY_HEADERS.length)
        .getValues();
      let sheetChanged = false;
      rows.forEach(row => {
        const group = String(row[2] || '').trim().toUpperCase();
        const currentId = String(row[3] || '').trim();
        if (!TABS.includes(group) || currentId.indexOf('ALU-') === 0) return;
        const nameKey = `${group}|${normalizeAttendanceText(row[4])}`;
        const nextId = legacyIdMap[`${group}|${currentId}`] || legacyIdMap[currentId] || nameIdMap[nameKey];
        if (!nextId) return;
        row[3] = nextId;
        row[0] = [group, formatDate(row[1]), nextId].join('|');
        row[9] = String(row[9] || 'migration-v10');
        changed++;
        sheetChanged = true;
      });
      if (sheetChanged) {
        sheet.getRange(2, 1, height, ATTENDANCE_HISTORY_HEADERS.length).setValues(rows);
      }
    });
  return changed;
}

function getStudentIdentityStatus() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let totalStudents = 0;
  let permanentIds = 0;
  let inactiveStudents = 0;
  const seenIds = {};
  const duplicateIds = [];
  const groups = {};
  TABS.forEach(group => {
    const sheet = spreadsheet.getSheetByName(group);
    if (!sheet || sheet.getLastRow() <= HEADER_ROW) {
      groups[group] = { students: 0, permanentIds: 0, inactive: 0 };
      return;
    }
    const height = sheet.getLastRow() - HEADER_ROW;
    const names = sheet.getRange(HEADER_ROW + 1, 5, height, 1).getDisplayValues();
    const metadata = sheet.getMaxColumns() >= STUDENT_TOTAL_COLUMNS
      ? sheet.getRange(HEADER_ROW + 1, STUDENT_META_START_COLUMN, height, 2).getDisplayValues()
      : Array(height).fill(['', '']);
    const summary = { students: 0, permanentIds: 0, inactive: 0 };
    names.forEach((row, index) => {
      if (!row[0]) return;
      summary.students++;
      const alumnoId = String(metadata[index][0] || '').trim();
      if (alumnoId.indexOf('ALU-') === 0) {
        summary.permanentIds++;
        if (seenIds[alumnoId] && duplicateIds.indexOf(alumnoId) === -1) duplicateIds.push(alumnoId);
        seenIds[alumnoId] = true;
      }
      if (normalizeStudentStatus_(metadata[index][1]) !== STUDENT_ACTIVE_STATUS) summary.inactive++;
    });
    groups[group] = summary;
    totalStudents += summary.students;
    permanentIds += summary.permanentIds;
    inactiveStudents += summary.inactive;
  });
  const result = {
    success: true,
    ready: studentIdentityIsReady_(),
    version: 'V11',
    cycle: CURRENT_SCHOOL_CYCLE,
    totalStudents,
    permanentIds,
    inactiveStudents,
    duplicateIds,
    groups
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// =====================================================
// INSCRIPCIONES Y MOVIMIENTOS V11
// =====================================================
function enrollmentHistoryIsReady_() {
  return PropertiesService.getScriptProperties().getProperty(ENROLLMENT_HISTORY_READY_PROPERTY) === 'true';
}

function isPermanentStudentIdV11_(value) {
  return /^ALU-[A-F0-9]{32}$/.test(String(value || '').trim().toUpperCase());
}

function analyzeStudentIdentityV11() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const seenIds = {};
  const issues = [];
  let students = 0;
  TABS.forEach(group => {
    const sheet = spreadsheet.getSheetByName(group);
    if (!sheet || sheet.getLastRow() <= HEADER_ROW) return;
    const height = sheet.getLastRow() - HEADER_ROW;
    const rows = sheet.getRange(HEADER_ROW + 1, 1, height, STUDENT_TOTAL_COLUMNS).getDisplayValues();
    rows.forEach((row, index) => {
      if (!row[4]) return;
      students++;
      const alumnoId = String(row[20] || '').trim();
      const issue = { tab: group, row: HEADER_ROW + 1 + index, name: String(row[4]), alumnoId };
      if (!isPermanentStudentIdV11_(alumnoId)) {
        issue.reason = 'ALUMNO_ID faltante o inválido';
        issues.push(issue);
      } else if (seenIds[alumnoId]) {
        issue.reason = 'ALUMNO_ID duplicado';
        issues.push(issue);
      } else {
        seenIds[alumnoId] = true;
      }
    });
  });
  const result = {
    success: issues.length === 0,
    ready: issues.length === 0,
    version: 'V11',
    students,
    validPermanentIds: students - issues.length,
    issueCount: issues.length,
    issues: issues.slice(0, 100)
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function repairInvalidStudentIdsV11() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (enrollmentHistoryIsReady_()) {
      return {
        success: false,
        version: 'V11',
        error: 'La reparación se detuvo porque el historial de inscripciones ya está instalado'
      };
    }
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const seenIds = {};
    const legacyIdMap = {};
    const nameIdMap = {};
    let repairedStudents = 0;
    TABS.forEach(group => {
      const sheet = spreadsheet.getSheetByName(group);
      if (!sheet || sheet.getLastRow() <= HEADER_ROW) return;
      ensureStudentMetadataColumns_(sheet);
      const height = sheet.getLastRow() - HEADER_ROW;
      const visibleRows = sheet.getRange(HEADER_ROW + 1, 1, height, STUDENT_VISIBLE_COLUMNS).getValues();
      const metadataRows = sheet
        .getRange(HEADER_ROW + 1, STUDENT_META_START_COLUMN, height, STUDENT_META_HEADERS.length).getValues();
      let sheetChanged = false;
      visibleRows.forEach((row, index) => {
        if (!row[4]) return;
        const sheetRow = HEADER_ROW + 1 + index;
        const metadata = metadataRows[index];
        const previousId = String(metadata[0] || '').trim();
        let alumnoId = previousId;
        if (!isPermanentStudentIdV11_(alumnoId) || seenIds[alumnoId]) {
          alumnoId = generateStudentId_();
          metadata[0] = alumnoId;
          metadata[5] = new Date().toISOString();
          metadata[6] = 'REPARACION_IDENTIDAD_V11';
          repairedStudents++;
          sheetChanged = true;
        }
        seenIds[alumnoId] = true;
        legacyIdMap[`${group}-${sheetRow}`] = alumnoId;
        if (previousId) legacyIdMap[`${group}|${previousId}`] = alumnoId;
        const nameKey = `${group}|${normalizeAttendanceText(row[4])}`;
        if (nameIdMap[nameKey] && nameIdMap[nameKey] !== alumnoId) nameIdMap[nameKey] = null;
        else if (nameIdMap[nameKey] !== null) nameIdMap[nameKey] = alumnoId;
      });
      if (sheetChanged) {
        sheet.getRange(HEADER_ROW + 1, STUDENT_META_START_COLUMN, height, STUDENT_META_HEADERS.length)
          .setValues(metadataRows);
      }
    });
    const migratedAttendanceRecords = migrateAttendanceStudentIdsV10_(legacyIdMap, nameIdMap);
    const analysis = analyzeStudentIdentityV11();
    const result = {
      success: analysis.ready,
      ready: analysis.ready,
      version: 'V11',
      repairedStudents,
      migratedAttendanceRecords,
      totalStudents: analysis.students,
      permanentIds: analysis.validPermanentIds,
      remainingIssues: analysis.issueCount,
      message: analysis.ready ? 'Identidad permanente reparada y verificada' : 'La reparación terminó con incidencias pendientes'
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function ensureTechnicalDataSheetV11_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }
  const existing = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  const hasHeader = existing.some(value => String(value || '').trim());
  if (hasHeader && headers.some((header, index) => existing[index] !== header)) {
    throw new Error('La hoja técnica ' + sheetName + ' existe con encabezados incompatibles');
  }
  if (!hasHeader) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  if (!sheet.isSheetHidden()) sheet.hideSheet();
  return sheet;
}

function normalizeGradeV11_(value) {
  const match = String(value || '').trim().match(/[1-6]/);
  return match ? match[0] : '';
}

function normalizeGroupLetterV11_(value) {
  const match = String(value || '').trim().toUpperCase().match(/[AB]/);
  return match ? match[0] : '';
}

function schoolDateV11_(value) {
  if (!value) return attendanceToday();
  if (typeof value === 'string') {
    const match = /^\d{4}-\d{2}-\d{2}/.exec(value.trim());
    if (match) return match[0];
  }
  try { return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
  catch (error) { return attendanceToday(); }
}

function deterministicEnrollmentIdV11_(alumnoId, cycle) {
  return 'INS-' + String(cycle || '').replace(/[^0-9]/g, '') + '-' + String(alumnoId || '').replace(/^ALU-/, '');
}

function analyzeEnrollmentMigrationV11() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const issues = [];
  const seenIds = {};
  let students = 0;

  TABS.forEach(tabName => {
    const sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet || sheet.getLastRow() <= HEADER_ROW) return;
    const height = sheet.getLastRow() - HEADER_ROW;
    const rows = sheet.getRange(HEADER_ROW + 1, 1, height, STUDENT_TOTAL_COLUMNS).getValues();
    rows.forEach((row, index) => {
      if (!row[4]) return;
      students++;
      const sheetRow = HEADER_ROW + 1 + index;
      const alumnoId = String(row[20] || '').trim();
      const grade = normalizeGradeV11_(row[1]);
      const letter = normalizeGroupLetterV11_(row[2]);
      const visibleGroup = grade && letter ? grade + letter : '';
      if (!isPermanentStudentIdV11_(alumnoId)) {
        issues.push({ tab: tabName, row: sheetRow, name: String(row[4]), reason: 'ALUMNO_ID faltante o inválido' });
      } else if (seenIds[alumnoId]) {
        issues.push({ tab: tabName, row: sheetRow, name: String(row[4]), reason: 'ALUMNO_ID duplicado', alumnoId });
      } else {
        seenIds[alumnoId] = true;
      }
      if (!visibleGroup) {
        issues.push({ tab: tabName, row: sheetRow, name: String(row[4]), reason: 'GRADO/GRUPO incompleto' });
      } else if (visibleGroup !== tabName) {
        issues.push({
          tab: tabName,
          row: sheetRow,
          name: String(row[4]),
          reason: 'GRADO/GRUPO no coincide con la pestaña',
          visibleGroup
        });
      }
    });
  });

  const result = {
    success: issues.length === 0,
    readyToMigrate: issues.length === 0,
    version: 'V11',
    students,
    issueCount: issues.length,
    issues: issues.slice(0, 100)
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function setupEnrollmentHistoryV11() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (enrollmentHistoryIsReady_()) return getEnrollmentHistoryStatusV11();
    const analysis = analyzeEnrollmentMigrationV11();
    if (!analysis.readyToMigrate) {
      return {
        success: false,
        ready: false,
        version: 'V11',
        error: 'La migración se detuvo sin escribir datos porque hay inconsistencias de grado, grupo o identidad',
        issueCount: analysis.issueCount,
        issues: analysis.issues
      };
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const enrollmentsSheet = ensureTechnicalDataSheetV11_(ENROLLMENTS_SHEET_NAME, ENROLLMENT_HEADERS);
    const movementsSheet = ensureTechnicalDataSheetV11_(STUDENT_MOVEMENTS_SHEET_NAME, STUDENT_MOVEMENT_HEADERS);
    const existingEnrollmentRows = enrollmentsSheet.getLastRow() > 1
      ? enrollmentsSheet.getRange(2, 1, enrollmentsSheet.getLastRow() - 1, ENROLLMENT_HEADERS.length).getValues()
      : [];
    const existingMovementRows = movementsSheet.getLastRow() > 1
      ? movementsSheet.getRange(2, 1, movementsSheet.getLastRow() - 1, STUDENT_MOVEMENT_HEADERS.length).getValues()
      : [];
    const enrollmentKeys = {};
    existingEnrollmentRows.forEach(row => {
      enrollmentKeys[String(row[1]) + '|' + String(row[2])] = String(row[0]);
    });
    const initialMovementKeys = {};
    existingMovementRows.forEach(row => {
      if (String(row[3]) === 'MIGRACION_INICIAL') {
        initialMovementKeys[String(row[1]) + '|' + String(row[7] || row[5])] = true;
      }
    });

    const now = new Date().toISOString();
    const enrollmentRows = [];
    const movementRows = [];
    TABS.forEach(tabName => {
      const sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet || sheet.getLastRow() <= HEADER_ROW) return;
      const height = sheet.getLastRow() - HEADER_ROW;
      const rows = sheet.getRange(HEADER_ROW + 1, 1, height, STUDENT_TOTAL_COLUMNS).getValues();
      rows.forEach(row => {
        if (!row[4]) return;
        const alumnoId = String(row[20]);
        const cycle = String(row[22] || CURRENT_SCHOOL_CYCLE);
        const key = alumnoId + '|' + cycle;
        const enrollmentId = enrollmentKeys[key] || deterministicEnrollmentIdV11_(alumnoId, cycle);
        const grade = normalizeGradeV11_(row[1]);
        const letter = normalizeGroupLetterV11_(row[2]);
        const groupId = grade + letter;
        const status = normalizeStudentStatus_(row[21]);
        const startDate = schoolDateV11_(row[23]);
        if (!enrollmentKeys[key]) {
          enrollmentRows.push([
            enrollmentId, alumnoId, cycle, grade, letter, groupId, status,
            startDate, status === STUDENT_ACTIVE_STATUS ? '' : schoolDateV11_(row[24]),
            status === STUDENT_ACTIVE_STATUS ? '' : 'MIGRACION V10', now,
            'MIGRACION_V11', 'migration-v11', SCHOOL_ID
          ]);
          enrollmentKeys[key] = enrollmentId;
        }
        if (!initialMovementKeys[key]) {
          movementRows.push([
            'MOV-' + Utilities.getUuid().replace(/-/g, '').toUpperCase(),
            alumnoId, enrollmentId, 'MIGRACION_INICIAL', startDate,
            '', '', cycle, groupId, status, 'Migración del estado vigente V10', '',
            'MIGRACION_V11', now, 'migration-v11', SCHOOL_ID
          ]);
          initialMovementKeys[key] = true;
        }
      });
    });

    if (enrollmentRows.length) {
      enrollmentsSheet.getRange(enrollmentsSheet.getLastRow() + 1, 1, enrollmentRows.length, ENROLLMENT_HEADERS.length)
        .setValues(enrollmentRows);
    }
    if (movementRows.length) {
      movementsSheet.getRange(movementsSheet.getLastRow() + 1, 1, movementRows.length, STUDENT_MOVEMENT_HEADERS.length)
        .setValues(movementRows);
    }
    PropertiesService.getScriptProperties().setProperty(ENROLLMENT_HISTORY_READY_PROPERTY, 'true');
    const result = {
      success: true,
      ready: true,
      version: 'V11',
      cycle: CURRENT_SCHOOL_CYCLE,
      createdEnrollments: enrollmentRows.length,
      createdMovements: movementRows.length,
      message: 'Inscripciones y movimientos V11 instalados'
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function getEnrollmentHistoryStatusV11() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const enrollmentsSheet = spreadsheet.getSheetByName(ENROLLMENTS_SHEET_NAME);
  const movementsSheet = spreadsheet.getSheetByName(STUDENT_MOVEMENTS_SHEET_NAME);
  const enrollmentRows = enrollmentsSheet && enrollmentsSheet.getLastRow() > 1
    ? enrollmentsSheet.getRange(2, 1, enrollmentsSheet.getLastRow() - 1, ENROLLMENT_HEADERS.length).getDisplayValues()
    : [];
  const movementRows = movementsSheet && movementsSheet.getLastRow() > 1
    ? movementsSheet.getRange(2, 1, movementsSheet.getLastRow() - 1, STUDENT_MOVEMENT_HEADERS.length).getDisplayValues()
    : [];
  const activeKeys = {};
  const duplicateActiveEnrollments = [];
  let activeEnrollments = 0;
  enrollmentRows.forEach(row => {
    if (normalizeStudentStatus_(row[6]) !== STUDENT_ACTIVE_STATUS) return;
    activeEnrollments++;
    const key = String(row[1]) + '|' + String(row[2]);
    if (activeKeys[key] && duplicateActiveEnrollments.indexOf(key) === -1) duplicateActiveEnrollments.push(key);
    activeKeys[key] = true;
  });
  const result = {
    success: true,
    ready: enrollmentHistoryIsReady_(),
    version: 'V11',
    cycle: CURRENT_SCHOOL_CYCLE,
    enrollments: enrollmentRows.length,
    activeEnrollments,
    movements: movementRows.length,
    duplicateActiveEnrollments
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function enrollmentRowToObjectV11_(row) {
  return {
    enrollmentId: String(row[0]),
    alumnoId: String(row[1]),
    cicloEscolar: String(row[2]),
    grado: String(row[3]),
    grupo: String(row[4]),
    grupoId: String(row[5]),
    estatus: normalizeStudentStatus_(row[6]),
    fechaInicio: row[7] ? schoolDateV11_(row[7]) : '',
    fechaFin: row[8] ? schoolDateV11_(row[8]) : '',
    motivoFin: String(row[9] || ''),
    actualizadoEn: formatDateTime_(row[10]),
    actualizadoPor: String(row[11] || '')
  };
}

function movementRowToObjectV11_(row) {
  return {
    movementId: String(row[0]),
    alumnoId: String(row[1]),
    enrollmentId: String(row[2]),
    tipo: String(row[3]),
    fechaEfectiva: row[4] ? schoolDateV11_(row[4]) : '',
    cicloOrigen: String(row[5] || ''),
    grupoOrigen: String(row[6] || ''),
    cicloDestino: String(row[7] || ''),
    grupoDestino: String(row[8] || ''),
    estatusResultante: normalizeStudentStatus_(row[9]),
    motivo: String(row[10] || ''),
    observacion: String(row[11] || ''),
    usuario: String(row[12] || ''),
    creadoEn: formatDateTime_(row[13])
  };
}

function getStudentLifecycle(params) {
  const alumnoId = String(params.alumnoId || params.id || '').trim();
  if (alumnoId.indexOf('ALU-') !== 0) return { success: false, error: 'ALUMNO_ID inválido' };
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const enrollmentsSheet = spreadsheet.getSheetByName(ENROLLMENTS_SHEET_NAME);
  const movementsSheet = spreadsheet.getSheetByName(STUDENT_MOVEMENTS_SHEET_NAME);
  const enrollments = enrollmentsSheet && enrollmentsSheet.getLastRow() > 1
    ? enrollmentsSheet.getRange(2, 1, enrollmentsSheet.getLastRow() - 1, ENROLLMENT_HEADERS.length)
      .getValues().filter(row => String(row[1]) === alumnoId).map(enrollmentRowToObjectV11_)
    : [];
  const movements = movementsSheet && movementsSheet.getLastRow() > 1
    ? movementsSheet.getRange(2, 1, movementsSheet.getLastRow() - 1, STUDENT_MOVEMENT_HEADERS.length)
      .getValues().filter(row => String(row[1]) === alumnoId).map(movementRowToObjectV11_)
    : [];
  movements.sort((a, b) => String(b.fechaEfectiva).localeCompare(String(a.fechaEfectiva)) ||
    String(b.creadoEn).localeCompare(String(a.creadoEn)));
  return { success: true, alumnoId, enrollments, movements, version: 'V11' };
}

function getInactiveStudents() {
  const all = getStudents({ includeInactive: true }).data;
  return {
    success: true,
    data: all.filter(student => student.estatus !== STUDENT_ACTIVE_STATUS),
    version: 'V11',
    enrollmentHistoryReady: enrollmentHistoryIsReady_()
  };
}

function reactivateStudent(params) {
  return setStudentStatus({
    grupo: params.grupo,
    alumnoId: params.alumnoId || params.id,
    rowId: params.rowId,
    estatus: STUDENT_ACTIVE_STATUS,
    fechaEfectiva: params.fechaEfectiva,
    motivo: params.motivo || 'REACTIVACION',
    observacion: params.observacion,
    usuario: params.usuario
  });
}

function recordStudentStatusMovementV11_(event) {
  const enrollmentsSheet = ensureTechnicalDataSheetV11_(ENROLLMENTS_SHEET_NAME, ENROLLMENT_HEADERS);
  const movementsSheet = ensureTechnicalDataSheetV11_(STUDENT_MOVEMENTS_SHEET_NAME, STUDENT_MOVEMENT_HEADERS);
  const rows = enrollmentsSheet.getLastRow() > 1
    ? enrollmentsSheet.getRange(2, 1, enrollmentsSheet.getLastRow() - 1, ENROLLMENT_HEADERS.length).getValues()
    : [];
  let index = rows.findIndex(row => String(row[1]) === event.alumnoId && String(row[2]) === event.cycle);
  const effectiveDate = schoolDateV11_(event.effectiveDate);
  const now = new Date().toISOString();
  let enrollmentId;
  if (index === -1) {
    enrollmentId = deterministicEnrollmentIdV11_(event.alumnoId, event.cycle);
    const grade = normalizeGradeV11_(event.group);
    const letter = normalizeGroupLetterV11_(event.group);
    const row = [
      enrollmentId, event.alumnoId, event.cycle, grade, letter, event.group,
      event.status, event.status === STUDENT_ACTIVE_STATUS ? effectiveDate : '',
      event.status === STUDENT_ACTIVE_STATUS ? '' : effectiveDate,
      event.status === STUDENT_ACTIVE_STATUS ? '' : String(event.reason || ''),
      now, String(event.user || ''), 'panel-v11', SCHOOL_ID
    ];
    enrollmentsSheet.getRange(enrollmentsSheet.getLastRow() + 1, 1, 1, ENROLLMENT_HEADERS.length).setValues([row]);
  } else {
    const row = rows[index];
    enrollmentId = String(row[0]);
    row[6] = event.status;
    row[8] = event.status === STUDENT_ACTIVE_STATUS ? '' : effectiveDate;
    row[9] = event.status === STUDENT_ACTIVE_STATUS ? '' : String(event.reason || '');
    row[10] = now;
    row[11] = String(event.user || '');
    enrollmentsSheet.getRange(index + 2, 1, 1, ENROLLMENT_HEADERS.length).setValues([row]);
  }
  const movementType = event.status === STUDENT_ACTIVE_STATUS
    ? 'REINGRESO'
    : ({ TRANSFERIDO: 'TRANSFERENCIA', EGRESADO: 'EGRESO' }[event.status] || event.status);
  const movementRow = [[
    'MOV-' + Utilities.getUuid().replace(/-/g, '').toUpperCase(),
    event.alumnoId, enrollmentId, movementType, effectiveDate,
    event.cycle, event.group, event.cycle, event.group, event.status,
    String(event.reason || ''), String(event.observation || ''), String(event.user || ''),
    now, 'panel-v11', SCHOOL_ID
  ]];
  movementsSheet.getRange(movementsSheet.getLastRow() + 1, 1, 1, STUDENT_MOVEMENT_HEADERS.length)
    .setValues(movementRow);
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

function formatDateTime_(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  try { return new Date(value).toISOString(); }
  catch (error) { return String(value || ''); }
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
