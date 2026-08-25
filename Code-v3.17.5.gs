/**
 * Investment Dashboard Backend
 * Frontend: GitHub Pages
 * Storage: Google Sheets + Google Drive backups
 *
 * FIRST RUN
 * 1. Run setupSystem() once from the Apps Script editor.
 * 2. Read the temporary admin password from the execution log.
 * 3. Deploy as Web app: Execute as Me; Who has access: Anyone.
 * 4. Put the /exec URL into frontend/config.js.
 */

let RUNTIME_DB = null;
let RUNTIME_RESPONSE_MODE = 'JSON';
let RUNTIME_RESPONSE_REQUEST_ID = '';
let RUNTIME_RELAY_CALLBACK = '';

const APP = Object.freeze({
  NAME: 'Investment Dashboard',
  VERSION: '3.17.5',
  SESSION_HOURS: 12,
  SESSION_IDLE_MINUTES: 5,
  PASSWORD_HASH_ROUNDS: 400,
  BACKUP_KEEP_COUNT: 30,
  SHEETS: Object.freeze({
    USERS: 'Users',
    SESSIONS: 'Sessions',
    HOLDINGS: 'Holdings',
    WATCHLIST: 'Watchlist',
    QUOTES: 'Quotes',
    SETTINGS: 'Settings',
    AUDIT: 'AuditLog',
    TRANSACTIONS: 'Transactions',
    PERFORMANCE: 'Performance',
    DIARY: 'Diary',
    MONTHLY_DIARY: 'MonthlyDiary',
    MONTH_STATUS: 'MonthlyStatus',
    STICKY_NOTES: 'StickyNotes',
    DAILY_QUOTES: 'DailyQuotes',
    CUSTOM_COLUMNS: 'CustomColumns',
    CUSTOM_VALUES: 'CustomValues',
    SIP_PLANS: 'SIPPlans',
    SIP_EVENTS: 'SIPEvents',
    EXPENSES: 'Expenses',
    EXPENSE_PLANS: 'ExpensePlans',
    RECURRING_EXPENSES: 'RecurringExpenses',
    EXPENSE_CATEGORIES: 'ExpenseCategories'
  }),
  HEADERS: Object.freeze({
    Users: ['Username','DisplayName','Role','PasswordSalt','PasswordHash','Active','CreatedAt','UpdatedAt','LastLogin'],
    Sessions: ['TokenHash','Username','ExpiresAt','CreatedAt','LastSeen'],
    Holdings: ['Id','Username','Type','AssetName','Code','Exchange','Units','InvestedAmount','ManualPrice','BuyDate','Notes','Active','CreatedAt','UpdatedAt','Owner','SourceCode','MonthlyContribution','AnnualInterestRate','BalanceAsOfDate'],
    Watchlist: ['Id','Username','Type','AssetName','Code','Exchange','TargetPrice','ManualPrice','Priority','Notes','Active','CreatedAt','UpdatedAt','SourceCompany','SnapshotPrice','SnapshotChange','SnapshotChangePct','DayHigh','DayLow','Volume','High52','Low52','MarketCap','SalesGrowth','ProfitGrowth','Valuation','MoatRemark','FinalRemark','Perf1M','Perf1Y','Perf3Y','Perf5Y','Perf10Y','SourceSheet'],
    Quotes: ['Key','Type','Code','Exchange','AssetName','Price','PriceDate','Source','UpdatedAt'],
    Settings: ['Key','Value'],
    AuditLog: ['Timestamp','Username','Action','Details'],
    Transactions: ['Id','Username','Owner','AssetType','AMC','ProductCode','SchemeName','TradeDate','TransactionType','Amount','Units','Price','Broker','Source','Fingerprint','CreatedAt'],
    Performance: ['Key','Type','Code','Exchange','OneD','OneW','OneM','SixM','OneY','ThreeY','FiveY','TenY','UpdatedAt'],
    Diary: ['Id','Username','EntryDate','Title','EntryText','Active','CreatedAt','UpdatedAt'],
    MonthlyDiary: ['Id','Username','MonthKey','EntryType','Title','EntryText','Status','CompletedAt','Active','CreatedAt','UpdatedAt'],
    MonthlyStatus: ['Id','Username','MonthKey','Status','CompletedAt','Active','CreatedAt','UpdatedAt'],
    StickyNotes: ['Id','Username','NoteType','Title','NoteText','DueDate','Status','Active','CreatedAt','UpdatedAt','CompletedAt'],
    DailyQuotes: ['Id','QuoteText','Author','Active','CreatedBy','CreatedAt','UpdatedAt'],
    CustomColumns: ['Id','Username','Section','ColumnKey','Label','DataType','SortOrder','Active','CreatedAt','UpdatedAt'],
    CustomValues: ['Id','Username','Section','RecordId','ColumnKey','Value','UpdatedAt'],
    SIPPlans: ['Id','Username','Owner','AssetType','AssetName','Code','Amount','Frequency','SIPDay','StartDate','EndDate','StepUpPct','ExpectedReturnPct','Status','Notes','Active','CreatedAt','UpdatedAt'],
    SIPEvents: ['Id','Username','PlanId','DueDate','Amount','Status','InvestedDate','Notes','Active','CreatedAt','UpdatedAt'],
    Expenses: ['Id','Username','Amount','DateSpent','PaidTo','DebitedFrom','Reason','Category','Notes','SourceType','SourceId','Active','CreatedAt','UpdatedAt'],
    ExpensePlans: ['Id','Username','Amount','PlannedDate','PaidTo','DebitedFrom','Reason','Category','Notes','Status','Active','CreatedAt','UpdatedAt','PaidExpenseId','PaidAt'],
    RecurringExpenses: ['Id','Username','Name','Amount','PaidTo','DebitedFrom','Reason','Category','Notes','Frequency','NextDueDate','EndDate','Status','Active','CreatedAt','UpdatedAt','LastPaidDate','LastExpenseId'],
    ExpenseCategories: ['Id','Username','Name','Color','Active','CreatedAt','UpdatedAt']
  })
});

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (String(p.app || '') === '1') {
    return HtmlService.createTemplateFromFile('IndexApp')
      .evaluate()
      .setTitle('My Finance')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  if (String(p.action || '') === 'pollResult') {
    return pollResultOutput_(p);
  }
  return jsonOutput_({ ok: true, app: APP.NAME, version: APP.VERSION, message: 'Backend is running.' });
}

/** Includes an Apps Script HTML file inside the native same-origin app. */
function includeFile_(name) {
  return HtmlService.createHtmlOutputFromFile(String(name || '')).getContent();
}

/** Same-origin bridge used by google.script.run in the native app. */
function nativeApi(request) {
  try {
    const result = processApiRequest_(request || {});
    // google.script.run cannot return Date objects; normalise everything to
    // the same JSON-safe shape used by the GitHub transport.
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    const safe = normalizeError_(error);
    return { ok: false, code: safe.code, message: safe.message };
  }
}

function safeJsonpCallback_(value) {
  const name = cleanText_(value, 100);
  if (!/^[A-Za-z_$][A-Za-z0-9_$]{0,80}$/.test(name)) {
    throw appError_('BAD_CALLBACK', 'Invalid JSONP callback.');
  }
  return name;
}

function safeAsyncRequestId_(value) {
  const id = cleanText_(value, 140);
  if (!/^mfreq_[A-Za-z0-9_-]{16,130}$/.test(id)) {
    throw appError_('BAD_REQUEST_ID', 'Invalid backend request ID.');
  }
  return id;
}

function asyncCache_() {
  return CacheService.getScriptCache();
}

function asyncKey_(requestId, suffix) {
  return 'MFA_' + requestId + '_' + suffix;
}

function storeAsyncResult_(requestId, result) {
  const id = safeAsyncRequestId_(requestId);
  const raw = JSON.stringify({
    __myfinanceAsyncResult: true,
    requestId: id,
    payload: result
  });

  // Keep each CacheService entry comfortably below the per-key size limit.
  const chunkChars = 30000;
  const chunks = [];
  for (let i = 0; i < raw.length; i += chunkChars) {
    chunks.push(raw.slice(i, i + chunkChars));
  }
  if (chunks.length > 80) {
    throw appError_('RESPONSE_TOO_LARGE', 'Backend response is too large.');
  }

  const cache = asyncCache_();
  const ttl = 180;
  cache.put(asyncKey_(id, 'meta'), String(chunks.length), ttl);
  chunks.forEach((part, i) => cache.put(asyncKey_(id, 'c' + i), part, ttl));
}

function readAsyncResult_(requestId) {
  const id = safeAsyncRequestId_(requestId);
  const cache = asyncCache_();
  const metaKey = asyncKey_(id, 'meta');
  const meta = cache.get(metaKey);

  if (meta == null) return null;

  const count = Number(meta);
  if (!Number.isInteger(count) || count < 1 || count > 80) {
    throw appError_('BAD_ASYNC_RESULT', 'Invalid backend result metadata.');
  }

  let raw = '';
  const keys = [metaKey];
  for (let i = 0; i < count; i++) {
    const key = asyncKey_(id, 'c' + i);
    keys.push(key);
    const part = cache.get(key);
    if (part == null) return null;
    raw += part;
  }

  // One-time response after a complete successful read.
  try { cache.removeAll(keys); } catch (ignore) {
    keys.forEach(k => { try { cache.remove(k); } catch (ignore2) {} });
  }

  return JSON.parse(raw);
}

function pollResultOutput_(params) {
  let callback = 'console.error';
  try {
    callback = safeJsonpCallback_(params.callback);
    const requestId = safeAsyncRequestId_(params.requestId);
    const result = readAsyncResult_(requestId);

    const envelope = result || {
      __myfinanceAsyncResult: true,
      requestId: requestId,
      ready: false
    };
    if (result) envelope.ready = true;

    const safe = JSON.stringify(envelope)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');

    return ContentService
      .createTextOutput(callback + '(' + safe + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } catch (error) {
    const safeErr = normalizeError_(error);
    const envelope = {
      __myfinanceAsyncResult: true,
      requestId: cleanText_(params && params.requestId, 140),
      ready: true,
      payload: { ok: false, code: safeErr.code, message: safeErr.message }
    };
    const safe = JSON.stringify(envelope).replace(/</g, '\\u003c');
    return ContentService
      .createTextOutput(callback + '(' + safe + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

function directAsyncResultOutput_(request, result) {
  const origin = String(request && request.clientOrigin || '');
  // The production SarNi frontend is the only origin allowed to receive a
  // direct response. Other origins continue through the polling fallback.
  if (origin !== 'https://saradasutar.github.io') {
    return HtmlService.createHtmlOutput('<!doctype html><html><body>OK</body></html>')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  const message = JSON.stringify({
    __myfinanceDirectResult: true,
    requestId: safeAsyncRequestId_(request.requestId),
    payload: result
  })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const target = JSON.stringify(origin);
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><body><script>window.top.postMessage(' + message + ',' + target + ');<\/script></body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


function processApiRequest_(request) {
  const action = cleanText_(request.action, 80);
  if (!action) return { ok: false, code: 'BAD_REQUEST', message: 'Missing action.' };
  if (action === 'status') return { ok: true, app: APP.NAME, version: APP.VERSION, message: 'Backend is running.' };
  // Never perform a schema migration inside the authentication request.
  if (action !== 'login' && PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')) ensureSchemaV12_();

  switch (action) {
      case 'login': return login_(request);
      case 'logout': return logout_(request);
      case 'touchSession': return touchSession_(request);
      case 'bootstrapCore': return bootstrapCore_(request);
      case 'bootstrap': return bootstrap_(request);
      case 'refreshPrices': return refreshPricesAction_(request);
      case 'saveHolding': return saveHolding_(request);
      case 'bulkImportHoldings': return bulkImportHoldings_(request);
      case 'bulkImportMfSnapshot': return bulkImportMfSnapshot_(request);
      case 'bulkImportMfTransactions': return bulkImportMfTransactions_(request);
      case 'bulkImportStockTransactions': return bulkImportStockTransactions_(request);
      case 'deleteHolding': return deleteHolding_(request);
      case 'saveWatchItem': return saveWatchItem_(request);
      case 'deleteWatchItem': return deleteWatchItem_(request);
      case 'saveSipPlan': return saveSipPlan_(request);
      case 'deleteSipPlan': return deleteSipPlan_(request);
      case 'setSipEvent': return setSipEvent_(request);
      case 'clearSipEvent': return clearSipEvent_(request);
      case 'saveExpense': return saveExpense_(request);
      case 'deleteExpense': return deleteExpense_(request);
      case 'saveExpensePlan': return saveExpensePlan_(request);
      case 'deleteExpensePlan': return deleteExpensePlan_(request);
      case 'saveRecurringExpense': return saveRecurringExpense_(request);
      case 'deleteRecurringExpense': return deleteRecurringExpense_(request);
      case 'markExpensePaid': return markExpensePaid_(request);
      case 'saveExpenseCategory': return saveExpenseCategory_(request);
      case 'deleteExpenseCategory': return deleteExpenseCategory_(request);
      case 'saveCustomColumn': return saveCustomColumn_(request);
      case 'deleteCustomColumn': return deleteCustomColumn_(request);
      case 'saveCustomValue': return saveCustomValue_(request);
      case 'saveDiaryEntry': return saveDiaryEntry_(request);
      case 'deleteDiaryEntry': return deleteDiaryEntry_(request);
      case 'saveStickyNote': return saveStickyNote_(request);
      case 'completeStickyNote': return completeStickyNote_(request);
      case 'deleteStickyNote': return deleteStickyNote_(request);
      case 'saveLifeQuote': return saveLifeQuote_(request);
      case 'deleteLifeQuote': return deleteLifeQuote_(request);
      case 'saveMonthlyItem': return saveMonthlyItem_(request);
      case 'deleteMonthlyItem': return deleteMonthlyItem_(request);
      case 'toggleMonthlyTarget': return toggleMonthlyTarget_(request);
      case 'setMonthStatus': return setMonthStatus_(request);
      case 'changePassword': return changePassword_(request);
      case 'adminListUsers': return adminListUsers_(request);
      case 'adminCreateUser': return adminCreateUser_(request);
      case 'adminUpdateUser': return adminUpdateUser_(request);
      case 'adminDeleteUser': return adminDeleteUser_(request);
      case 'adminResetPassword': return adminResetPassword_(request);
      case 'adminToggleUser': return adminToggleUser_(request);
      case 'backupNow': return backupNowAction_(request);
      case 'replaceMasterPortfolioData': return replaceMasterPortfolioData_(request);
      default: return { ok: false, code: 'UNKNOWN_ACTION', message: 'Unknown action.' };
    }
}

function doPost(e) {
  let request = {};
  try {
    request = parseRequest_(e);
    const transport = String(request.transport || '').toLowerCase();
    const result = processApiRequest_(request);

    if (transport === 'asyncpoll' || transport === 'hybrid') {
      storeAsyncResult_(request.requestId, result);
      if (transport === 'hybrid') return directAsyncResultOutput_(request, result);
      return HtmlService.createHtmlOutput('<!doctype html><html><body>OK</body></html>')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    return jsonOutput_(result);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    const safe = normalizeError_(error);
    const result = { ok: false, code: safe.code, message: safe.message };

    try {
      const transport = String(request.transport || '').toLowerCase();
      if ((transport === 'asyncpoll' || transport === 'hybrid') && request.requestId) {
        storeAsyncResult_(request.requestId, result);
        if (transport === 'hybrid') return directAsyncResultOutput_(request, result);
        return HtmlService.createHtmlOutput('<!doctype html><html><body>ERROR STORED</body></html>')
          .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      }
    } catch (storeError) {
      console.error(storeError && storeError.stack ? storeError.stack : storeError);
    }

    return jsonOutput_(result);
  }
}


/** Creates the database, Drive folders, administrator and time-driven triggers. */
function setupSystem() {
  const props = PropertiesService.getScriptProperties();
  let dataFolderId = props.getProperty('DATA_FOLDER_ID');
  let spreadsheetId = props.getProperty('SPREADSHEET_ID');
  let backupFolderId = props.getProperty('BACKUP_FOLDER_ID');

  let dataFolder;
  if (dataFolderId) {
    dataFolder = DriveApp.getFolderById(dataFolderId);
  } else {
    dataFolder = DriveApp.createFolder('Investment Dashboard Data');
    dataFolderId = dataFolder.getId();
    props.setProperty('DATA_FOLDER_ID', dataFolderId);
  }

  if (!spreadsheetId) {
    const spreadsheet = SpreadsheetApp.create('Investment Dashboard Database');
    spreadsheetId = spreadsheet.getId();
    DriveApp.getFileById(spreadsheetId).moveTo(dataFolder);
    props.setProperty('SPREADSHEET_ID', spreadsheetId);
  }

  if (!backupFolderId) {
    const backupFolder = dataFolder.createFolder('Backups');
    backupFolderId = backupFolder.getId();
    props.setProperty('BACKUP_FOLDER_ID', backupFolderId);
  }

  if (!props.getProperty('APP_SECRET')) props.setProperty('APP_SECRET', randomToken_());
  initializeSheets_();
  seedDailyQuotes_();
  props.setProperty('SCHEMA_VERSION', '12');
  const adminInfo = ensureInitialAdmin_();
  installTriggers_();
  setSetting_('AppVersion', APP.VERSION);
  setSetting_('SetupCompletedAt', isoNow_());

  console.log('SETUP COMPLETE');
  console.log('Spreadsheet: https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/edit');
  console.log('Drive data folder: https://drive.google.com/drive/folders/' + dataFolderId);
  if (adminInfo.created) {
    console.log('Temporary username: admin');
    console.log('Temporary password: ' + adminInfo.password);
    console.log('Sign in and change this password immediately.');
  } else {
    console.log('Administrator already exists. Run resetAdminPassword() if the password is unknown.');
  }
  return { spreadsheetId: spreadsheetId, dataFolderId: dataFolderId, backupFolderId: backupFolderId, adminCreated: adminInfo.created };
}

/** Generates a new temporary password for the admin account and writes it to the execution log. */
function resetAdminPassword() {
  assertConfigured_();
  const temporaryPassword = generateTemporaryPassword_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const user = findUser_('admin');
    if (!user) throw appError_('NOT_FOUND', 'Admin user was not found. Run setupSystem() first.');
    updateUserPasswordByRow_(user.row, temporaryPassword);
    invalidateUserSessions_('admin', '');
    audit_('admin', 'RESET_ADMIN_PASSWORD', 'Password reset from Apps Script editor');
  } finally { lock.releaseLock(); }
  console.log('Temporary username: admin');
  console.log('Temporary password: ' + temporaryPassword);
  console.log('Sign in and change this password immediately.');
  return temporaryPassword;
}

/** Trigger wrapper: updates all mutual-fund NAVs used by holdings/watchlists. */
function refreshMutualFundNav() {
  assertConfigured_();
  const nav = refreshMutualFundNav_(true);
  ensureAllPerformanceRows_();
  const performance = refreshMutualFundPerformance_(true);
  SpreadsheetApp.flush();
  return { nav: nav, performance: performance };
}

/** Trigger wrapper: creates a JSON backup in Drive. */
function backupData() {
  assertConfigured_();
  return createBackup_('scheduled');
}

function login_(request) {
  assertConfigured_();
  const username = normalizeUsername_(request.username);
  const password = String(request.password || '');
  if (!username || !password) throw appError_('INVALID_LOGIN', 'Enter a valid username and password.');
  enforceLoginRateLimit_(username);

  const user = findUser_(username);
  if (!user || !toBoolean_(user.Active) || !verifyPassword_(password, user.PasswordSalt, user.PasswordHash)) {
    recordLoginFailure_(username);
    throw appError_('INVALID_LOGIN', 'Incorrect username or password.');
  }
  clearLoginFailures_(username);
  const fastLogin = toBoolean_(request.fastLogin);
  if (!fastLogin) cleanupExpiredSessions_();

  const token = randomToken_() + randomToken_();
  const tokenHash = hashToken_(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + APP.SESSION_HOURS * 60 * 60 * 1000);
  sheet_(APP.SHEETS.SESSIONS).appendRow([tokenHash, username, expiresAt, now, now]);
  cacheSession_(tokenHash, { username: username, role: String(user.Role || 'USER'), displayName: String(user.DisplayName || username), expiresAt: expiresAt.toISOString(), lastSeen: now.toISOString(), persistedAt: now.toISOString() });
  if (!fastLogin) {
    sheet_(APP.SHEETS.USERS).getRange(user.row, headerIndex_(APP.SHEETS.USERS, 'LastLogin')).setValue(now);
    audit_(username, 'LOGIN', 'Successful login');
  }

  const publicUser = {
    username: username,
    displayName: String(user.DisplayName || username),
    role: String(user.Role || 'USER')
  };

  // Fast login returns authentication immediately. Portfolio reads and any
  // market-data work happen after the dashboard is already visible.
  if (fastLogin) {
    return {
      ok: true,
      token: token,
      user: publicUser,
      fastLogin: true,
      backendVersion: APP.VERSION
    };
  }

  const data = buildDashboard_(username);
  return { ok: true, token: token, user: data.user, data: data };
}

function logout_(request) {
  const session = requireAuth_(request.token);
  deleteSessionByHash_(session.tokenHash);
  CacheService.getScriptCache().remove('session_' + session.tokenHash);
  audit_(session.username, 'LOGOUT', 'User logged out');
  return { ok: true };
}

function touchSession_(request) {
  const session = requireAuth_(request.token);
  return { ok: true, idleTimeoutMinutes: APP.SESSION_IDLE_MINUTES, username: session.username };
}

function bootstrap_(request) {
  const session = requireAuth_(request.token);
  // Never delay normal login/bootstrap with an external NAV repair. The
  // explicit refreshPrices action owns market-data refresh work.
  return { ok: true, data: buildDashboard_(session.username) };
}

function bootstrapCore_(request) {
  const session = requireAuth_(request.token);
  return { ok: true, data: buildPortfolioCore_(session.username, { forceShared: toBoolean_(request.forceSharedRecovery) }) };
}

function refreshPricesAction_(request) {
  const session = requireAuth_(request.token);
  const mfNav = refreshMutualFundNav_(true);
  ensureAllPerformanceRows_();
  const mfPerformance = refreshMutualFundPerformance_(true);
  SpreadsheetApp.flush();
  Utilities.sleep(500);
  audit_(session.username, 'REFRESH_PRICES',
    'Manual price/performance refresh · MF NAV ' + mfNav.updated + '/' + mfNav.tracked +
    ' · MF performance ' + mfPerformance.updated + '/' + mfPerformance.tracked);
  return {
    ok: true,
    refreshReport: { mfNav: mfNav, mfPerformance: mfPerformance },
    data: buildDashboard_(session.username)
  };
}

function saveHolding_(request) {
  const session = requireAuth_(request.token);
  const input = validateHolding_(request.holding || {});
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(APP.SHEETS.HOLDINGS);
    const existing = input.id ? findRecordById_(APP.SHEETS.HOLDINGS, input.id) : null;
    if (existing && String(existing.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot edit another user’s investment.');
    const now = new Date();
    const id = existing ? String(existing.Id) : newId_('H');
    const createdAt = existing ? existing.CreatedAt : now;
    const row = [id, session.username, input.type, input.assetName, input.code, input.exchange, input.units, input.investedAmount,
      input.manualPrice === null ? '' : input.manualPrice, input.buyDate || '', input.notes, true, createdAt, now, input.owner, input.sourceCode || '',
      input.monthlyContribution || '', input.annualInterestRate === null ? '' : input.annualInterestRate, input.balanceAsOfDate || ''];
    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    ensureQuote_(input.type, input.code, input.exchange, input.assetName);
    ensurePerformanceRow_(input.type, input.code, input.exchange);
    audit_(session.username, existing ? 'UPDATE_HOLDING' : 'CREATE_HOLDING', input.owner + ': ' + input.assetName + ' (' + input.code + ')');
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return { ok: true, data: buildDashboard_(session.username) };
}


function bulkImportHoldings_(request) {
  const session = requireAuth_(request.token);
  const rawItems = Array.isArray(request.holdings) ? request.holdings : [];
  if (!rawItems.length) throw appError_('VALIDATION_ERROR', 'No investment rows were received.');
  if (rawItems.length > 2000) throw appError_('VALIDATION_ERROR', 'A maximum of 2,000 holdings can be imported at one time.');

  const inputs = [];
  const errors = [];
  rawItems.forEach(function (item, index) {
    try {
      const copy = Object.assign({}, item || {});
      copy.id = '';
      inputs.push(validateHolding_(copy));
    } catch (error) {
      errors.push('Row ' + (index + 2) + ': ' + normalizeError_(error).message);
    }
  });
  if (errors.length) {
    const preview = errors.slice(0, 8).join(' | ');
    const more = errors.length > 8 ? ' | Plus ' + (errors.length - 8) + ' more error(s).' : '';
    throw appError_('VALIDATION_ERROR', preview + more);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_(APP.SHEETS.HOLDINGS);
    const now = new Date();
    const existing = readObjects_(APP.SHEETS.HOLDINGS);
    let imported = 0;
    inputs.forEach(function (input) {
      const match = existing.find(function (row) {
        return String(row.Username) === session.username && toBoolean_(row.Active) &&
          normalizeOwner_(row.Owner || '') === normalizeOwner_(input.owner) &&
          String(row.Type || '').toUpperCase() === input.type &&
          String(row.Code || '').toUpperCase() === input.code &&
          String(row.Exchange || '').toUpperCase() === input.exchange;
      });
      const id = match ? String(match.Id) : newId_('H');
      const createdAt = match ? match.CreatedAt : now;
      const row = [id, session.username, input.type, input.assetName, input.code, input.exchange,
        input.units, input.investedAmount, input.manualPrice === null ? '' : input.manualPrice,
        input.buyDate || '', input.notes, true, createdAt, now, input.owner, input.sourceCode || '',
        input.monthlyContribution || '', input.annualInterestRate === null ? '' : input.annualInterestRate, input.balanceAsOfDate || ''];
      if (match) sh.getRange(match.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
      imported++;
    });
    ensureQuotesBatch_(inputs);
    inputs.forEach(function (input) { ensurePerformanceRow_(input.type, input.code, input.exchange); });
    audit_(session.username, 'BULK_IMPORT_HOLDINGS', String(imported) + ' holdings imported/updated');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, imported: inputs.length, data: buildDashboard_(session.username) };
}


function bulkImportMfSnapshot_(request) {
  const session = requireAuth_(request.token);
  const rawItems = Array.isArray(request.mfHoldings) ? request.mfHoldings : [];
  if (!rawItems.length) throw appError_('VALIDATION_ERROR', 'No mutual-fund holding rows were received.');
  if (rawItems.length > 500) throw appError_('VALIDATION_ERROR', 'A maximum of 500 mutual-fund holdings can be imported at one time.');

  const universe = fetchAmfiUniverse_();
  if (!universe.length) throw appError_('PRICE_SERVICE_ERROR', 'Could not load the AMFI scheme list. Please try again.');

  const inputs = [];
  const errors = [];

  rawItems.forEach(function (raw, index) {
    try {
      const owner = cleanOwner_(raw.owner || raw.investorName || 'Portfolio');
      const schemeName = cleanText_(raw.schemeName || raw.assetName || '', 160);
      const isin = cleanText_(raw.isin || '', 30).toUpperCase().replace(/\s+/g, '');
      const units = finiteNumberOrNull_(raw.units);
      const investedAmount = finiteNumberOrNull_(raw.investedAmount);
      const notes = cleanText_(raw.notes || '', 500);

      if (!schemeName) throw appError_('VALIDATION_ERROR', 'Scheme Name is required.');
      if (!/^[A-Z0-9]{12}$/.test(isin)) throw appError_('VALIDATION_ERROR', 'A valid 12-character ISIN is required.');
      if (units === null || units <= 0) throw appError_('VALIDATION_ERROR', 'Units Held must be greater than zero.');
      if (investedAmount === null || investedAmount < 0) throw appError_('VALIDATION_ERROR', 'Invested Amount must be zero or more.');

      let mapped = resolveAmfiByIsin_(isin, universe);
      if (!mapped) mapped = resolveAmfiScheme_('', schemeName, universe);
      if (!mapped || !mapped.code) throw appError_('VALIDATION_ERROR', 'ISIN could not be mapped to an AMFI scheme code.');

      inputs.push({
        owner: owner,
        schemeName: schemeName,
        isin: isin,
        units: units,
        investedAmount: investedAmount,
        notes: notes,
        mapped: mapped
      });
    } catch (error) {
      errors.push('Row ' + (index + 2) + ': ' + normalizeError_(error).message);
    }
  });

  if (errors.length) {
    const preview = errors.slice(0, 8).join(' | ');
    const more = errors.length > 8 ? ' | Plus ' + (errors.length - 8) + ' more error(s).' : '';
    throw appError_('VALIDATION_ERROR', preview + more);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_(APP.SHEETS.HOLDINGS);
    const existing = readObjects_(APP.SHEETS.HOLDINGS);
    const now = new Date();

    inputs.forEach(function (input) {
      const code = String(input.mapped.code || '').trim();
      const match = existing.find(function (row) {
        return String(row.Username) === session.username && toBoolean_(row.Active) &&
          normalizeOwner_(row.Owner || '') === normalizeOwner_(input.owner) &&
          String(row.Type || '').toUpperCase() === 'MF' &&
          String(row.Code || '').trim() === code;
      });

      const id = match ? String(match.Id) : newId_('H');
      const createdAt = match ? match.CreatedAt : now;
      const note = input.notes || 'Imported MF current holding snapshot';
      const row = [
        id, session.username, 'MF', input.schemeName, code, '',
        input.units, input.investedAmount, '', '', note, true,
        createdAt, now, input.owner, input.isin
      ];

      if (match) sh.getRange(match.row, 1, 1, row.length).setValues([row]);
      else sh.appendRow(row);

      setMfQuoteFromUniverse_(input.mapped);
      ensurePerformanceRow_('MF', code, '');
    });

    audit_(session.username, 'IMPORT_MF_SNAPSHOT', inputs.length + ' MF current holdings imported via ISIN mapping');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, imported: inputs.length, mapped: inputs.length, data: buildDashboard_(session.username) };
}

function deleteHolding_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id, 100);
  if (!id) throw appError_('BAD_REQUEST', 'Missing investment ID.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const record = findRecordById_(APP.SHEETS.HOLDINGS, id);
    if (!record || String(record.Username) !== session.username) throw appError_('NOT_FOUND', 'Investment not found.');
    const sh = sheet_(APP.SHEETS.HOLDINGS);
    sh.getRange(record.row, headerIndex_(APP.SHEETS.HOLDINGS, 'Active')).setValue(false);
    sh.getRange(record.row, headerIndex_(APP.SHEETS.HOLDINGS, 'UpdatedAt')).setValue(new Date());
    audit_(session.username, 'DELETE_HOLDING', String(record.AssetName));
  } finally { lock.releaseLock(); }
  return { ok: true, data: buildDashboard_(session.username) };
}

function saveWatchItem_(request) {
  const session = requireAuth_(request.token);
  const input = validateWatchItem_(request.item || {});
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(APP.SHEETS.WATCHLIST);
    const existing = input.id ? findRecordById_(APP.SHEETS.WATCHLIST, input.id) : null;
    if (existing && String(existing.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot edit another user’s watchlist.');
    const now = new Date();
    const id = existing ? String(existing.Id) : newId_('W');
    const createdAt = existing ? existing.CreatedAt : now;
    const row = [id, session.username, input.type, input.assetName, input.code, input.exchange,
      input.targetPrice === null ? '' : input.targetPrice, input.manualPrice === null ? '' : input.manualPrice,
      input.priority, input.notes, true, createdAt, now];
    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    ensureQuote_(input.type, input.code, input.exchange, input.assetName);
    audit_(session.username, existing ? 'UPDATE_WATCHLIST' : 'CREATE_WATCHLIST', input.assetName + ' (' + input.code + ')');
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return { ok: true, data: buildDashboard_(session.username) };
}

function deleteWatchItem_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id, 100);
  if (!id) throw appError_('BAD_REQUEST', 'Missing watchlist ID.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const record = findRecordById_(APP.SHEETS.WATCHLIST, id);
    if (!record || String(record.Username) !== session.username) throw appError_('NOT_FOUND', 'Watchlist item not found.');
    const sh = sheet_(APP.SHEETS.WATCHLIST);
    sh.getRange(record.row, headerIndex_(APP.SHEETS.WATCHLIST, 'Active')).setValue(false);
    sh.getRange(record.row, headerIndex_(APP.SHEETS.WATCHLIST, 'UpdatedAt')).setValue(new Date());
    audit_(session.username, 'DELETE_WATCHLIST', String(record.AssetName));
  } finally { lock.releaseLock(); }
  return { ok: true, data: buildDashboard_(session.username) };
}


function saveLifeQuote_(request) {
  const session = requireAuth_(request.token);
  const raw = request.quote || {};
  const id = cleanText_(raw.id || '', 80);
  const text = cleanText_(raw.text || '', 500);
  const author = cleanText_(raw.author || '', 120);
  if (!text) throw appError_('VALIDATION_ERROR', 'Quote text is required.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const existing = id ? findRecordById_(APP.SHEETS.DAILY_QUOTES, id) : null;
    const user = findUser_(session.username);
    const isAdmin = user && String(user.Role || '').toUpperCase() === 'ADMIN';
    if (existing && String(existing.CreatedBy || '') !== session.username && !isAdmin) {
      throw appError_('FORBIDDEN', 'Only the creator or administrator can edit this quote.');
    }

    const now = new Date();
    const rowId = existing ? String(existing.Id) : newId_('Q');
    const createdBy = existing ? String(existing.CreatedBy || session.username) : session.username;
    const createdAt = existing ? existing.CreatedAt : now;
    const row = [rowId, text, author, true, createdBy, createdAt, now];
    const sh = sheet_(APP.SHEETS.DAILY_QUOTES);
    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    audit_(session.username, existing ? 'UPDATE_LIFE_QUOTE' : 'CREATE_LIFE_QUOTE', text.slice(0, 120));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { ok: true, data: buildDashboard_(session.username) };
}

function deleteLifeQuote_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id || '', 80);
  if (!id) throw appError_('VALIDATION_ERROR', 'Quote ID is required.');
  const record = findRecordById_(APP.SHEETS.DAILY_QUOTES, id);
  if (!record || !toBoolean_(record.Active)) throw appError_('NOT_FOUND', 'Quote was not found.');
  const user = findUser_(session.username);
  const isAdmin = user && String(user.Role || '').toUpperCase() === 'ADMIN';
  if (String(record.CreatedBy || '') !== session.username && !isAdmin) {
    throw appError_('FORBIDDEN', 'Only the creator or administrator can delete this quote.');
  }

  const sh = sheet_(APP.SHEETS.DAILY_QUOTES);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.DAILY_QUOTES, 'Active')).setValue(false);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.DAILY_QUOTES, 'UpdatedAt')).setValue(new Date());
  audit_(session.username, 'DELETE_LIFE_QUOTE', String(record.QuoteText || '').slice(0, 120));
  SpreadsheetApp.flush();
  return { ok: true, data: buildDashboard_(session.username) };
}

function seedDailyQuotes_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('DAILY_QUOTES_SEEDED') === '1') return;
  const sh = sheet_(APP.SHEETS.DAILY_QUOTES);
  if (sh.getLastRow() <= 1) {
    const now = new Date();
    const defaults = [
      ['Small, steady steps can quietly change the direction of a life.','My Finance'],
      ['A good day is built from a few good choices made with attention.','My Finance'],
      ['Progress becomes visible when patience is allowed to work.','My Finance'],
      ['Protect your peace, but keep enough courage for the next challenge.','My Finance'],
      ['Time spent with purpose grows into a life with meaning.','My Finance'],
      ['The next chapter improves when today receives your full attention.','My Finance'],
      ['A clear mind and a consistent habit can outperform a hurried plan.','My Finance'],
      ['Life becomes lighter when priorities become clearer.','My Finance'],
      ['Measure the day not only by results, but by the quality of your effort.','My Finance'],
      ['Keep learning; experience becomes more valuable when reflection follows it.','My Finance'],
      ['A meaningful goal should guide your calendar, not merely occupy your thoughts.','My Finance'],
      ['Good decisions compound, just as surely as money does.','My Finance']
    ];
    const rows = defaults.map(function (q) { return [newId_('Q'), q[0], q[1], true, 'system', now, now]; });
    sh.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  props.setProperty('DAILY_QUOTES_SEEDED', '1');
}

function saveStickyNote_(request) {
  const session = requireAuth_(request.token);
  const raw = request.note || {};
  const id = cleanText_(raw.id || '', 80);
  const noteType = cleanText_(raw.noteType || 'TARGET', 20).toUpperCase();
  const title = cleanText_(raw.title || '', 120);
  const text = cleanText_(raw.text || '', 1000);
  const dueDate = cleanText_(raw.dueDate || '', 20);

  if (!['TARGET','REMINDER'].includes(noteType)) throw appError_('VALIDATION_ERROR', 'Choose Target or Reminder.');
  if (!title) throw appError_('VALIDATION_ERROR', 'Sticky note title is required.');
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw appError_('VALIDATION_ERROR', 'Choose a valid due date.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_(APP.SHEETS.STICKY_NOTES);
    const existing = id ? findRecordById_(APP.SHEETS.STICKY_NOTES, id) : null;
    if (existing && String(existing.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot edit another user’s sticky note.');

    const now = new Date();
    const rowId = existing ? String(existing.Id) : newId_('SN');
    const createdAt = existing ? existing.CreatedAt : now;
    const row = [rowId, session.username, noteType, title, text, dueDate, 'OPEN', true, createdAt, now, ''];

    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    audit_(session.username, existing ? 'UPDATE_STICKY_NOTE' : 'CREATE_STICKY_NOTE', noteType + ' · ' + title);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, data: buildDashboard_(session.username) };
}

function completeStickyNote_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id || '', 80);
  if (!id) throw appError_('VALIDATION_ERROR', 'Sticky note ID is required.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const record = findRecordById_(APP.SHEETS.STICKY_NOTES, id);
    if (!record || !toBoolean_(record.Active)) throw appError_('NOT_FOUND', 'Sticky note was not found.');
    if (String(record.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot complete another user’s sticky note.');

    const now = new Date();
    const today = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyy-MM-dd');
    const type = String(record.NoteType || 'REMINDER').toUpperCase();
    const title = String(record.Title || '').trim();
    const details = String(record.NoteText || '').trim();
    const due = serializeDateOnly_(record.DueDate);

    // Save completed sticky directly to Daily Diary.
    const diaryTitle = '✓ Completed ' + (type === 'TARGET' ? 'Target' : 'Reminder') + ': ' + title;
    let diaryText = 'Completed from Dashboard Sticky Note.';
    if (details) diaryText += '\n\n' + details;
    if (due) diaryText += '\n\nDue date: ' + due;
    diaryText += '\nCompleted on: ' + today;

    const diarySh = sheet_(APP.SHEETS.DIARY);
    diarySh.appendRow([newId_('D'), session.username, today, diaryTitle, diaryText, true, now, now]);

    const sh = sheet_(APP.SHEETS.STICKY_NOTES);
    sh.getRange(record.row, headerIndex_(APP.SHEETS.STICKY_NOTES, 'Status')).setValue('COMPLETED');
    sh.getRange(record.row, headerIndex_(APP.SHEETS.STICKY_NOTES, 'Active')).setValue(false);
    sh.getRange(record.row, headerIndex_(APP.SHEETS.STICKY_NOTES, 'UpdatedAt')).setValue(now);
    sh.getRange(record.row, headerIndex_(APP.SHEETS.STICKY_NOTES, 'CompletedAt')).setValue(now);

    audit_(session.username, 'COMPLETE_STICKY_NOTE', type + ' · ' + title + ' · saved to Diary');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, data: buildDashboard_(session.username) };
}

function deleteStickyNote_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id || '', 80);
  if (!id) throw appError_('VALIDATION_ERROR', 'Sticky note ID is required.');

  const record = findRecordById_(APP.SHEETS.STICKY_NOTES, id);
  if (!record || !toBoolean_(record.Active)) throw appError_('NOT_FOUND', 'Sticky note was not found.');
  if (String(record.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot delete another user’s sticky note.');

  const sh = sheet_(APP.SHEETS.STICKY_NOTES);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.STICKY_NOTES, 'Active')).setValue(false);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.STICKY_NOTES, 'UpdatedAt')).setValue(new Date());
  audit_(session.username, 'DELETE_STICKY_NOTE', String(record.Title || ''));
  SpreadsheetApp.flush();

  return { ok: true, data: buildDashboard_(session.username) };
}



function validateSipPlan_(raw) {
  raw = raw || {};
  const id = cleanText_(raw.id || '', 80);
  const owner = cleanText_(raw.owner || '', 120);
  const assetType = cleanText_(raw.assetType || 'MF', 20).toUpperCase();
  const assetName = cleanText_(raw.assetName || '', 180);
  const code = cleanText_(raw.code || '', 80).toUpperCase();
  const amount = Number(raw.amount);
  const frequency = cleanText_(raw.frequency || 'MONTHLY', 20).toUpperCase();
  const sipDay = Math.floor(Number(raw.sipDay));
  const startDate = cleanText_(raw.startDate || '', 20);
  const endDate = cleanText_(raw.endDate || '', 20);
  const stepUpPct = Number(raw.stepUpPct || 0);
  const expectedReturnPct = Number(raw.expectedReturnPct || 0);
  const status = cleanText_(raw.status || 'ACTIVE', 20).toUpperCase();
  const notes = cleanText_(raw.notes || '', 800);

  if (!owner) throw appError_('VALIDATION_ERROR', 'Choose an investor.');
  if (!['MF','ETF','STOCK','OTHER'].includes(assetType)) throw appError_('VALIDATION_ERROR', 'Choose a valid investment type.');
  if (!assetName) throw appError_('VALIDATION_ERROR', 'Asset / Scheme name is required.');
  if (!Number.isFinite(amount) || amount <= 0) throw appError_('VALIDATION_ERROR', 'SIP amount must be greater than zero.');
  if (!['MONTHLY','QUARTERLY'].includes(frequency)) throw appError_('VALIDATION_ERROR', 'SIP frequency must be Monthly or Quarterly.');
  if (!Number.isInteger(sipDay) || sipDay < 1 || sipDay > 28) throw appError_('VALIDATION_ERROR', 'SIP day must be between 1 and 28.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw appError_('VALIDATION_ERROR', 'Choose a valid SIP start date.');
  if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw appError_('VALIDATION_ERROR', 'Choose a valid SIP end date.');
  if (endDate && endDate < startDate) throw appError_('VALIDATION_ERROR', 'SIP end date cannot be before start date.');
  if (!Number.isFinite(stepUpPct) || stepUpPct < 0 || stepUpPct > 100) throw appError_('VALIDATION_ERROR', 'Annual step-up must be between 0% and 100%.');
  if (!Number.isFinite(expectedReturnPct) || expectedReturnPct < -50 || expectedReturnPct > 100) throw appError_('VALIDATION_ERROR', 'Expected return must be between -50% and 100%.');
  if (!['ACTIVE','PAUSED','STOPPED'].includes(status)) throw appError_('VALIDATION_ERROR', 'Choose a valid SIP status.');

  return { id:id, owner:owner, assetType:assetType, assetName:assetName, code:code, amount:amount,
    frequency:frequency, sipDay:sipDay, startDate:startDate, endDate:endDate, stepUpPct:stepUpPct,
    expectedReturnPct:expectedReturnPct, status:status, notes:notes };
}

function saveSipPlan_(request) {
  const session = requireAuth_(request.token);
  const input = validateSipPlan_(request.plan || {});
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_(APP.SHEETS.SIP_PLANS);
    const existing = input.id ? findRecordById_(APP.SHEETS.SIP_PLANS, input.id) : null;
    if (existing && String(existing.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot edit another user’s SIP plan.');

    const now = new Date();
    const id = existing ? String(existing.Id) : newId_('SIP');
    const createdAt = existing ? existing.CreatedAt : now;
    const row = [id, session.username, input.owner, input.assetType, input.assetName, input.code, input.amount,
      input.frequency, input.sipDay, input.startDate, input.endDate || '', input.stepUpPct, input.expectedReturnPct,
      input.status, input.notes, true, createdAt, now];

    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    audit_(session.username, existing ? 'UPDATE_SIP_PLAN' : 'CREATE_SIP_PLAN',
      input.owner + ' · ' + input.assetName + ' · ' + input.frequency + ' · ' + input.amount);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { ok:true, data:buildDashboard_(session.username) };
}

function deleteSipPlan_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id || '', 80);
  if (!id) throw appError_('VALIDATION_ERROR', 'SIP plan ID is required.');
  const record = findRecordById_(APP.SHEETS.SIP_PLANS, id);
  if (!record || !toBoolean_(record.Active)) throw appError_('NOT_FOUND', 'SIP plan was not found.');
  if (String(record.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot delete another user’s SIP plan.');

  const sh = sheet_(APP.SHEETS.SIP_PLANS);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.SIP_PLANS, 'Active')).setValue(false);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.SIP_PLANS, 'UpdatedAt')).setValue(new Date());
  audit_(session.username, 'DELETE_SIP_PLAN', String(record.AssetName || ''));
  SpreadsheetApp.flush();
  return { ok:true, data:buildDashboard_(session.username) };
}

function setSipEvent_(request) {
  const session = requireAuth_(request.token);
  const raw = request.event || {};
  const planId = cleanText_(raw.planId || '', 80);
  const dueDate = cleanText_(raw.dueDate || '', 20);
  const status = cleanText_(raw.status || 'INVESTED', 20).toUpperCase();
  const amount = Number(raw.amount);
  const investedDate = cleanText_(raw.investedDate || '', 20);
  const notes = cleanText_(raw.notes || '', 500);

  if (!planId) throw appError_('VALIDATION_ERROR', 'SIP plan ID is required.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw appError_('VALIDATION_ERROR', 'Choose a valid SIP due date.');
  if (!['INVESTED','SKIPPED'].includes(status)) throw appError_('VALIDATION_ERROR', 'SIP event must be Invested or Skipped.');
  if (!Number.isFinite(amount) || amount <= 0) throw appError_('VALIDATION_ERROR', 'SIP event amount must be greater than zero.');
  if (investedDate && !/^\d{4}-\d{2}-\d{2}$/.test(investedDate)) throw appError_('VALIDATION_ERROR', 'Choose a valid invested date.');

  const plan = findRecordById_(APP.SHEETS.SIP_PLANS, planId);
  if (!plan || !toBoolean_(plan.Active)) throw appError_('NOT_FOUND', 'SIP plan was not found.');
  if (String(plan.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot update another user’s SIP plan.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const rows = readObjects_(APP.SHEETS.SIP_EVENTS);
    const existing = rows.find(function(r) {
      return String(r.Username) === session.username &&
        String(r.PlanId) === planId &&
        serializeDateOnly_(r.DueDate) === dueDate &&
        toBoolean_(r.Active);
    });
    const sh = sheet_(APP.SHEETS.SIP_EVENTS);
    const now = new Date();
    const id = existing ? String(existing.Id) : newId_('SIPE');
    const createdAt = existing ? existing.CreatedAt : now;
    const row = [id, session.username, planId, dueDate, amount, status,
      status === 'INVESTED' ? (investedDate || Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyy-MM-dd')) : '',
      notes, true, createdAt, now];
    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    audit_(session.username, 'SET_SIP_EVENT', String(plan.AssetName || '') + ' · ' + dueDate + ' · ' + status);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok:true, data:buildDashboard_(session.username) };
}

function clearSipEvent_(request) {
  const session = requireAuth_(request.token);
  const planId = cleanText_(request.planId || '', 80);
  const dueDate = cleanText_(request.dueDate || '', 20);
  if (!planId || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw appError_('VALIDATION_ERROR', 'SIP plan and due date are required.');

  const rows = readObjects_(APP.SHEETS.SIP_EVENTS);
  const existing = rows.find(function(r) {
    return String(r.Username) === session.username &&
      String(r.PlanId) === planId &&
      serializeDateOnly_(r.DueDate) === dueDate &&
      toBoolean_(r.Active);
  });
  if (existing) {
    const sh = sheet_(APP.SHEETS.SIP_EVENTS);
    sh.getRange(existing.row, headerIndex_(APP.SHEETS.SIP_EVENTS, 'Active')).setValue(false);
    sh.getRange(existing.row, headerIndex_(APP.SHEETS.SIP_EVENTS, 'UpdatedAt')).setValue(new Date());
    audit_(session.username, 'CLEAR_SIP_EVENT', planId + ' · ' + dueDate);
    SpreadsheetApp.flush();
  }
  return { ok:true, data:buildDashboard_(session.username) };
}


function validateExpenseCategoryName_(value) {
  const name = cleanText_(value || '', 80).replace(/\s+/g, ' ').trim();
  if (!name) throw appError_('VALIDATION_ERROR', 'Expense category name is required.');
  return name;
}
function validateExpenseBase_(raw) {
  raw = raw || {};
  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw appError_('VALIDATION_ERROR', 'Amount must be greater than zero.');
  const reason = cleanText_(raw.reason || '', 220);
  if (!reason) throw appError_('VALIDATION_ERROR', 'Reason is required.');
  const category = validateExpenseCategoryName_(raw.category || 'Other');
  return { id: cleanText_(raw.id || '',80), amount: amount, paidTo: cleanText_(raw.paidTo || '',140), debitedFrom: cleanText_(raw.debitedFrom || '',120), reason: reason, category: category, notes: cleanText_(raw.notes || '',1000) };
}
function ensureExpenseCategoryExists_(username, name) {
  const exists = readObjects_(APP.SHEETS.EXPENSE_CATEGORIES).some(function(r){return String(r.Username)===username && toBoolean_(r.Active) && String(r.Name).toLowerCase()===String(name).toLowerCase();});
  if (!exists) throw appError_('VALIDATION_ERROR', 'Expense category "' + name + '" does not exist. Add it in Category Manager first.');
}
function saveExpense_(request) {
  const session=requireAuth_(request.token), input=validateExpenseBase_(request.record||{}), dateSpent=cleanText_((request.record||{}).dateSpent||'',20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateSpent)) throw appError_('VALIDATION_ERROR','Choose a valid date spent.');
  ensureExpenseCategoryExists_(session.username,input.category);
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try{const sh=sheet_(APP.SHEETS.EXPENSES), existing=input.id?findRecordById_(APP.SHEETS.EXPENSES,input.id):null;if(existing&&String(existing.Username)!==session.username)throw appError_('FORBIDDEN','You cannot edit another user’s expense.');const now=new Date(),id=existing?String(existing.Id):newId_('EXP'),created=existing?existing.CreatedAt:now;const sourceType=existing?String(existing.SourceType||'MANUAL'):'MANUAL',sourceId=existing?String(existing.SourceId||''):'';const row=[id,session.username,input.amount,dateSpent,input.paidTo,input.debitedFrom,input.reason,input.category,input.notes,sourceType,sourceId,true,created,now];if(existing)sh.getRange(existing.row,1,1,row.length).setValues([row]);else sh.appendRow(row);audit_(session.username,existing?'UPDATE_EXPENSE':'CREATE_EXPENSE',input.category+' · '+input.reason+' · '+input.amount);SpreadsheetApp.flush();}finally{lock.releaseLock();}
  return {ok:true,data:buildDashboard_(session.username)};
}
function deleteExpense_(request){const session=requireAuth_(request.token),id=cleanText_(request.id||'',80),r=findRecordById_(APP.SHEETS.EXPENSES,id);if(!r||!toBoolean_(r.Active))throw appError_('NOT_FOUND','Expense not found.');if(String(r.Username)!==session.username)throw appError_('FORBIDDEN','You cannot delete another user’s expense.');const sh=sheet_(APP.SHEETS.EXPENSES);sh.getRange(r.row,headerIndex_(APP.SHEETS.EXPENSES,'Active')).setValue(false);sh.getRange(r.row,headerIndex_(APP.SHEETS.EXPENSES,'UpdatedAt')).setValue(new Date());audit_(session.username,'DELETE_EXPENSE',String(r.Reason||''));SpreadsheetApp.flush();return {ok:true,data:buildDashboard_(session.username)};}
function saveExpensePlan_(request){
  const session=requireAuth_(request.token),input=validateExpenseBase_(request.record||{}),date=cleanText_((request.record||{}).plannedDate||'',20);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw appError_('VALIDATION_ERROR','Choose a valid planned date.');ensureExpenseCategoryExists_(session.username,input.category);
  const lock=LockService.getScriptLock();lock.waitLock(30000);try{const sh=sheet_(APP.SHEETS.EXPENSE_PLANS),ex=input.id?findRecordById_(APP.SHEETS.EXPENSE_PLANS,input.id):null;if(ex&&String(ex.Username)!==session.username)throw appError_('FORBIDDEN','You cannot edit another user’s plan.');const now=new Date(),id=ex?String(ex.Id):newId_('EXPP'),created=ex?ex.CreatedAt:now,status=ex?String(ex.Status||'PLANNED'):'PLANNED';if(status==='PAID')throw appError_('VALIDATION_ERROR','A paid plan cannot be edited. Edit the Actual Expense instead.');const row=[id,session.username,input.amount,date,input.paidTo,input.debitedFrom,input.reason,input.category,input.notes,status,true,created,now,ex?String(ex.PaidExpenseId||''):'',ex?ex.PaidAt:''];if(ex)sh.getRange(ex.row,1,1,row.length).setValues([row]);else sh.appendRow(row);audit_(session.username,ex?'UPDATE_EXPENSE_PLAN':'CREATE_EXPENSE_PLAN',input.category+' · '+input.reason);SpreadsheetApp.flush();}finally{lock.releaseLock();}return {ok:true,data:buildDashboard_(session.username)};
}
function deleteExpensePlan_(request){const session=requireAuth_(request.token),id=cleanText_(request.id||'',80),r=findRecordById_(APP.SHEETS.EXPENSE_PLANS,id);if(!r||!toBoolean_(r.Active))throw appError_('NOT_FOUND','Preplanned expense not found.');if(String(r.Username)!==session.username)throw appError_('FORBIDDEN','You cannot delete another user’s plan.');if(String(r.Status||'PLANNED').toUpperCase()==='PAID')throw appError_('VALIDATION_ERROR','Paid plan history is retained. Delete/edit the linked Actual Expense instead.');const sh=sheet_(APP.SHEETS.EXPENSE_PLANS);sh.getRange(r.row,headerIndex_(APP.SHEETS.EXPENSE_PLANS,'Active')).setValue(false);sh.getRange(r.row,headerIndex_(APP.SHEETS.EXPENSE_PLANS,'UpdatedAt')).setValue(new Date());audit_(session.username,'DELETE_EXPENSE_PLAN',String(r.Reason||''));SpreadsheetApp.flush();return {ok:true,data:buildDashboard_(session.username)};}
function validateRecurringExpense_(raw){const b=validateExpenseBase_(raw),name=cleanText_(raw.name||'',140),frequency=cleanText_(raw.frequency||'MONTHLY',30).toUpperCase(),next=cleanText_(raw.nextDueDate||'',20),end=cleanText_(raw.endDate||'',20),status=cleanText_(raw.status||'ACTIVE',20).toUpperCase();if(!name)throw appError_('VALIDATION_ERROR','Regular payment name is required.');if(!['MONTHLY','QUARTERLY','HALF_YEARLY','YEARLY'].includes(frequency))throw appError_('VALIDATION_ERROR','Choose a valid frequency.');if(!/^\d{4}-\d{2}-\d{2}$/.test(next))throw appError_('VALIDATION_ERROR','Choose a valid next due date.');if(end&&!/^\d{4}-\d{2}-\d{2}$/.test(end))throw appError_('VALIDATION_ERROR','Choose a valid end date.');if(end&&end<next)throw appError_('VALIDATION_ERROR','End date cannot be before next due date.');if(!['ACTIVE','PAUSED','STOPPED'].includes(status))throw appError_('VALIDATION_ERROR','Choose a valid status.');return Object.assign(b,{name:name,frequency:frequency,nextDueDate:next,endDate:end,status:status});}
function saveRecurringExpense_(request){const session=requireAuth_(request.token),input=validateRecurringExpense_(request.record||{});ensureExpenseCategoryExists_(session.username,input.category);const lock=LockService.getScriptLock();lock.waitLock(30000);try{const sh=sheet_(APP.SHEETS.RECURRING_EXPENSES),ex=input.id?findRecordById_(APP.SHEETS.RECURRING_EXPENSES,input.id):null;if(ex&&String(ex.Username)!==session.username)throw appError_('FORBIDDEN','You cannot edit another user’s regular payment.');const now=new Date(),id=ex?String(ex.Id):newId_('EXPR'),created=ex?ex.CreatedAt:now;const row=[id,session.username,input.name,input.amount,input.paidTo,input.debitedFrom,input.reason,input.category,input.notes,input.frequency,input.nextDueDate,input.endDate,input.status,true,created,now,ex?ex.LastPaidDate:'',ex?String(ex.LastExpenseId||''):''];if(ex)sh.getRange(ex.row,1,1,row.length).setValues([row]);else sh.appendRow(row);audit_(session.username,ex?'UPDATE_RECURRING_EXPENSE':'CREATE_RECURRING_EXPENSE',input.name+' · '+input.amount);SpreadsheetApp.flush();}finally{lock.releaseLock();}return {ok:true,data:buildDashboard_(session.username)};}
function deleteRecurringExpense_(request){const session=requireAuth_(request.token),id=cleanText_(request.id||'',80),r=findRecordById_(APP.SHEETS.RECURRING_EXPENSES,id);if(!r||!toBoolean_(r.Active))throw appError_('NOT_FOUND','Regular payment not found.');if(String(r.Username)!==session.username)throw appError_('FORBIDDEN','You cannot delete another user’s regular payment.');const sh=sheet_(APP.SHEETS.RECURRING_EXPENSES);sh.getRange(r.row,headerIndex_(APP.SHEETS.RECURRING_EXPENSES,'Active')).setValue(false);sh.getRange(r.row,headerIndex_(APP.SHEETS.RECURRING_EXPENSES,'UpdatedAt')).setValue(new Date());audit_(session.username,'DELETE_RECURRING_EXPENSE',String(r.Name||''));SpreadsheetApp.flush();return {ok:true,data:buildDashboard_(session.username)};}
function expenseIsoDate_(value){const s=String(value||'');const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);}
function nextRecurringDue_(iso,frequency){const d=expenseIsoDate_(iso);if(!d)return iso;const months={MONTHLY:1,QUARTERLY:3,HALF_YEARLY:6,YEARLY:12}[String(frequency||'MONTHLY').toUpperCase()]||1;const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+months);d.setDate(Math.min(day,28));return Utilities.formatDate(d,Session.getScriptTimeZone()||'Asia/Kolkata','yyyy-MM-dd');}
function markExpensePaid_(request){
  const session=requireAuth_(request.token),sourceType=cleanText_(request.sourceType||'',20).toUpperCase(),sourceId=cleanText_(request.sourceId||'',80),amount=Number(request.amount),datePaid=cleanText_(request.datePaid||'',20);if(!['PLAN','REGULAR'].includes(sourceType))throw appError_('VALIDATION_ERROR','Invalid payment source.');if(!Number.isFinite(amount)||amount<=0)throw appError_('VALIDATION_ERROR','Actual amount must be greater than zero.');if(!/^\d{4}-\d{2}-\d{2}$/.test(datePaid))throw appError_('VALIDATION_ERROR','Choose a valid paid date.');
  const sheetName=sourceType==='PLAN'?APP.SHEETS.EXPENSE_PLANS:APP.SHEETS.RECURRING_EXPENSES,source=findRecordById_(sheetName,sourceId);if(!source||!toBoolean_(source.Active))throw appError_('NOT_FOUND','Source expense was not found.');if(String(source.Username)!==session.username)throw appError_('FORBIDDEN','You cannot update another user’s expense.');if(sourceType==='PLAN'&&String(source.Status||'PLANNED').toUpperCase()==='PAID')throw appError_('VALIDATION_ERROR','This planned expense is already marked paid.');
  const category=String(source.Category||'Other');ensureExpenseCategoryExists_(session.username,category);const paidTo=cleanText_(request.paidTo||source.PaidTo||source.Name||'',140),account=cleanText_(request.debitedFrom||source.DebitedFrom||'',120),extra=cleanText_(request.notes||'',600),reason=String(source.Reason||source.Name||'Regular payment'),notes=[String(source.Notes||''),extra].filter(Boolean).join(' · ').slice(0,1000);
  const lock=LockService.getScriptLock();lock.waitLock(30000);let expenseId='';try{const exSh=sheet_(APP.SHEETS.EXPENSES),now=new Date();expenseId=newId_('EXP');exSh.appendRow([expenseId,session.username,amount,datePaid,paidTo,account,reason,category,notes,sourceType,sourceId,true,now,now]);const srcSh=sheet_(sheetName);if(sourceType==='PLAN'){srcSh.getRange(source.row,headerIndex_(sheetName,'Status')).setValue('PAID');srcSh.getRange(source.row,headerIndex_(sheetName,'PaidExpenseId')).setValue(expenseId);srcSh.getRange(source.row,headerIndex_(sheetName,'PaidAt')).setValue(now);srcSh.getRange(source.row,headerIndex_(sheetName,'UpdatedAt')).setValue(now);}else{let next=nextRecurringDue_(serializeDateOnly_(source.NextDueDate),source.Frequency),status=String(source.Status||'ACTIVE').toUpperCase();const end=serializeDateOnly_(source.EndDate);if(end&&next>end)status='STOPPED';srcSh.getRange(source.row,headerIndex_(sheetName,'NextDueDate')).setValue(next);srcSh.getRange(source.row,headerIndex_(sheetName,'Status')).setValue(status);srcSh.getRange(source.row,headerIndex_(sheetName,'LastPaidDate')).setValue(datePaid);srcSh.getRange(source.row,headerIndex_(sheetName,'LastExpenseId')).setValue(expenseId);srcSh.getRange(source.row,headerIndex_(sheetName,'UpdatedAt')).setValue(now);}audit_(session.username,'MARK_EXPENSE_PAID',sourceType+' · '+sourceId+' · '+amount);SpreadsheetApp.flush();}finally{lock.releaseLock();}return {ok:true,expenseId:expenseId,data:buildDashboard_(session.username)};
}
function defaultExpenseCategories_(){return [['Household','BLUE'],['Food','ORANGE'],['Utilities','TEAL'],['Travel','PURPLE'],['Medical','PINK'],['Insurance','GREEN'],['Tax','GOLD'],['Shopping','PURPLE'],['Education','BLUE'],['Entertainment','PINK'],['Other','GREY']];}
function ensureDefaultExpenseCategories_(username){let rows=readObjects_(APP.SHEETS.EXPENSE_CATEGORIES).filter(function(r){return String(r.Username)===username&&toBoolean_(r.Active);});if(rows.length)return;const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return;try{rows=readObjects_(APP.SHEETS.EXPENSE_CATEGORIES).filter(function(r){return String(r.Username)===username&&toBoolean_(r.Active);});if(rows.length)return;const sh=sheet_(APP.SHEETS.EXPENSE_CATEGORIES),now=new Date();defaultExpenseCategories_().forEach(function(x){sh.appendRow([newId_('EXPC'),username,x[0],x[1],true,now,now]);});SpreadsheetApp.flush();}finally{lock.releaseLock();}}
function cascadeExpenseCategoryRename_(username,oldName,newName){[APP.SHEETS.EXPENSES,APP.SHEETS.EXPENSE_PLANS,APP.SHEETS.RECURRING_EXPENSES].forEach(function(name){const sh=sheet_(name),rows=readObjects_(name),col=headerIndex_(name,'Category');rows.forEach(function(r){if(String(r.Username)===username&&toBoolean_(r.Active)&&String(r.Category)===oldName)sh.getRange(r.row,col).setValue(newName);});});}
function saveExpenseCategory_(request){const session=requireAuth_(request.token),raw=request.category||{},id=cleanText_(raw.id||'',80),name=validateExpenseCategoryName_(raw.name),color=cleanText_(raw.color||'BLUE',20).toUpperCase();if(!['BLUE','GREEN','PURPLE','ORANGE','PINK','TEAL','GOLD','GREY'].includes(color))throw appError_('VALIDATION_ERROR','Choose a valid category colour.');const dup=readObjects_(APP.SHEETS.EXPENSE_CATEGORIES).find(function(r){return String(r.Username)===session.username&&toBoolean_(r.Active)&&String(r.Name).toLowerCase()===name.toLowerCase()&&String(r.Id)!==id;});if(dup)throw appError_('VALIDATION_ERROR','That expense category already exists.');const lock=LockService.getScriptLock();lock.waitLock(30000);try{const sh=sheet_(APP.SHEETS.EXPENSE_CATEGORIES),ex=id?findRecordById_(APP.SHEETS.EXPENSE_CATEGORIES,id):null;if(ex&&String(ex.Username)!==session.username)throw appError_('FORBIDDEN','You cannot edit another user’s category.');const now=new Date(),newId=ex?String(ex.Id):newId_('EXPC'),created=ex?ex.CreatedAt:now,old=ex?String(ex.Name||''):'';const row=[newId,session.username,name,color,true,created,now];if(ex)sh.getRange(ex.row,1,1,row.length).setValues([row]);else sh.appendRow(row);if(ex&&old&&old!==name)cascadeExpenseCategoryRename_(session.username,old,name);audit_(session.username,ex?'UPDATE_EXPENSE_CATEGORY':'CREATE_EXPENSE_CATEGORY',name);SpreadsheetApp.flush();}finally{lock.releaseLock();}return {ok:true,data:buildDashboard_(session.username)};}
function deleteExpenseCategory_(request){const session=requireAuth_(request.token),id=cleanText_(request.id||'',80),r=findRecordById_(APP.SHEETS.EXPENSE_CATEGORIES,id);if(!r||!toBoolean_(r.Active))throw appError_('NOT_FOUND','Expense category not found.');if(String(r.Username)!==session.username)throw appError_('FORBIDDEN','You cannot delete another user’s category.');const name=String(r.Name||''),used=[APP.SHEETS.EXPENSES,APP.SHEETS.EXPENSE_PLANS,APP.SHEETS.RECURRING_EXPENSES].some(function(sheetName){return readObjects_(sheetName).some(function(x){return String(x.Username)===session.username&&toBoolean_(x.Active)&&String(x.Category)===name;});});if(used)throw appError_('VALIDATION_ERROR','Category is in use. Rename it, or move/delete its expense records before deleting it.');const sh=sheet_(APP.SHEETS.EXPENSE_CATEGORIES);sh.getRange(r.row,headerIndex_(APP.SHEETS.EXPENSE_CATEGORIES,'Active')).setValue(false);sh.getRange(r.row,headerIndex_(APP.SHEETS.EXPENSE_CATEGORIES,'UpdatedAt')).setValue(new Date());audit_(session.username,'DELETE_EXPENSE_CATEGORY',name);SpreadsheetApp.flush();return {ok:true,data:buildDashboard_(session.username)};}

function normalizeCustomSection_(value) {
  const section = cleanText_(value, 20).toUpperCase();
  if (!['HOLDINGS','WATCHLIST'].includes(section)) throw appError_('VALIDATION_ERROR', 'Column section must be Holdings or Watchlist.');
  return section;
}

function normalizeCustomKey_(value, label) {
  let key = cleanText_(value, 60).replace(/[^A-Za-z0-9_]/g, '');
  if (!key) {
    key = cleanText_(label, 60).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
  if (!key) key = 'CustomField';
  if (/^[0-9]/.test(key)) key = 'Field_' + key;
  return key.slice(0, 60);
}

function normalizeCustomType_(value) {
  const type = cleanText_(value, 20).toUpperCase() || 'TEXT';
  if (!['TEXT','NUMBER','CURRENCY','PERCENT','DATE'].includes(type)) throw appError_('VALIDATION_ERROR', 'Unsupported custom column type.');
  return type;
}

function customColumnForUser_(username, section, keyOrId) {
  const rows = readObjects_(APP.SHEETS.CUSTOM_COLUMNS);
  return rows.find(function (row) {
    return String(row.Username) === username &&
      String(row.Section || '').toUpperCase() === section &&
      toBoolean_(row.Active) &&
      (String(row.Id) === String(keyOrId) || String(row.ColumnKey) === String(keyOrId));
  }) || null;
}

function saveCustomColumn_(request) {
  const session = requireAuth_(request.token);
  const input = request.column || {};
  const section = normalizeCustomSection_(input.section);
  const label = cleanText_(input.label, 80);
  if (!label) throw appError_('VALIDATION_ERROR', 'Enter a column name.');
  const dataType = normalizeCustomType_(input.dataType);
  const columnKey = normalizeCustomKey_(input.columnKey, label);
  const sortOrder = Math.max(1, Math.min(999, Number(input.sortOrder) || 100));

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const rows = readObjects_(APP.SHEETS.CUSTOM_COLUMNS);
    const existing = input.id ? rows.find(function (r) {
      return String(r.Id) === String(input.id) && String(r.Username) === session.username;
    }) : null;

    const duplicate = rows.find(function (r) {
      return String(r.Username) === session.username &&
        String(r.Section || '').toUpperCase() === section &&
        toBoolean_(r.Active) &&
        String(r.ColumnKey || '').toLowerCase() === columnKey.toLowerCase() &&
        (!existing || String(r.Id) !== String(existing.Id));
    });
    if (duplicate) throw appError_('VALIDATION_ERROR', 'That parameter key is already used in this table.');

    const activeCount = rows.filter(function (r) {
      return String(r.Username) === session.username &&
        String(r.Section || '').toUpperCase() === section &&
        toBoolean_(r.Active) &&
        (!existing || String(r.Id) !== String(existing.Id));
    }).length;
    if (!existing && activeCount >= 20) throw appError_('VALIDATION_ERROR', 'A maximum of 20 custom columns is supported per table.');

    const sh = sheet_(APP.SHEETS.CUSTOM_COLUMNS);
    const now = new Date();
    const id = existing ? String(existing.Id) : newId_('CC');
    const createdAt = existing ? existing.CreatedAt : now;
    const finalColumnKey = existing ? String(existing.ColumnKey || columnKey) : columnKey;
    const row = [id, session.username, section, finalColumnKey, label, dataType, sortOrder, true, createdAt, now];
    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    audit_(session.username, existing ? 'UPDATE_CUSTOM_COLUMN' : 'CREATE_CUSTOM_COLUMN', section + ': ' + label + ' [' + columnKey + ']');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { ok: true, data: buildDashboard_(session.username) };
}

function deleteCustomColumn_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id, 100);
  if (!id) throw appError_('VALIDATION_ERROR', 'Missing custom column id.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const col = readObjects_(APP.SHEETS.CUSTOM_COLUMNS).find(function (r) {
      return String(r.Id) === id && String(r.Username) === session.username && toBoolean_(r.Active);
    });
    if (!col) throw appError_('NOT_FOUND', 'Custom column not found.');

    const sh = sheet_(APP.SHEETS.CUSTOM_COLUMNS);
    sh.getRange(col.row, headerIndex_(APP.SHEETS.CUSTOM_COLUMNS, 'Active')).setValue(false);
    sh.getRange(col.row, headerIndex_(APP.SHEETS.CUSTOM_COLUMNS, 'UpdatedAt')).setValue(new Date());

    const valuesSh = sheet_(APP.SHEETS.CUSTOM_VALUES);
    const values = readObjects_(APP.SHEETS.CUSTOM_VALUES)
      .filter(function (r) {
        return String(r.Username) === session.username &&
          String(r.Section || '').toUpperCase() === String(col.Section || '').toUpperCase() &&
          String(r.ColumnKey) === String(col.ColumnKey);
      })
      .sort(function (a,b) { return b.row - a.row; });
    values.forEach(function (r) { valuesSh.deleteRow(r.row); });

    audit_(session.username, 'DELETE_CUSTOM_COLUMN', String(col.Section) + ': ' + String(col.Label));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { ok: true, data: buildDashboard_(session.username) };
}

function saveCustomValue_(request) {
  const session = requireAuth_(request.token);
  const section = normalizeCustomSection_(request.section);
  const recordId = cleanText_(request.recordId, 120);
  const columnKey = cleanText_(request.columnKey, 60);
  if (!recordId || !columnKey) throw appError_('VALIDATION_ERROR', 'Missing row or column reference.');

  const col = customColumnForUser_(session.username, section, columnKey);
  if (!col) throw appError_('NOT_FOUND', 'Custom column not found.');

  const sourceSheet = section === 'HOLDINGS' ? APP.SHEETS.HOLDINGS : APP.SHEETS.WATCHLIST;
  const record = findRecordById_(sourceSheet, recordId);
  if (!record || String(record.Username) !== session.username || !toBoolean_(record.Active)) throw appError_('FORBIDDEN', 'This row is not available.');

  let value = cleanText_(request.value, 2000);
  const type = String(col.DataType || 'TEXT').toUpperCase();
  if (value) {
    if (['NUMBER','CURRENCY','PERCENT'].includes(type)) {
      const n = Number(String(value).replace(/,/g, ''));
      if (!isFinite(n)) throw appError_('VALIDATION_ERROR', 'Enter a valid numeric value.');
      value = String(n);
    } else if (type === 'DATE') {
      value = validateDateOnly_(value);
    }
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const rows = readObjects_(APP.SHEETS.CUSTOM_VALUES);
    const existing = rows.find(function (r) {
      return String(r.Username) === session.username &&
        String(r.Section || '').toUpperCase() === section &&
        String(r.RecordId) === recordId &&
        String(r.ColumnKey) === columnKey;
    });
    const sh = sheet_(APP.SHEETS.CUSTOM_VALUES);

    if (!value) {
      if (existing) sh.deleteRow(existing.row);
    } else {
      const now = new Date();
      const id = existing ? String(existing.Id) : newId_('CV');
      const row = [id, session.username, section, recordId, columnKey, value, now];
      if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    }
    audit_(session.username, 'SAVE_CUSTOM_VALUE', section + ': ' + columnKey + ' for ' + recordId);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { ok: true, data: buildDashboard_(session.username) };
}

function saveDiaryEntry_(request) {
  const session = requireAuth_(request.token);
  const raw = request.entry || {};
  const id = cleanText_(raw.id || '', 80);
  const entryDate = cleanText_(raw.entryDate || '', 20);
  const title = cleanText_(raw.title || '', 120);
  const text = cleanText_(raw.text || '', 5000);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) throw appError_('VALIDATION_ERROR', 'Choose a valid diary date.');
  if (!text) throw appError_('VALIDATION_ERROR', 'Diary entry cannot be blank.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_(APP.SHEETS.DIARY);
    const existing = id ? findRecordById_(APP.SHEETS.DIARY, id) : null;
    if (existing && String(existing.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot edit another user’s diary entry.');

    const now = new Date();
    const rowId = existing ? String(existing.Id) : newId_('D');
    const createdAt = existing ? existing.CreatedAt : now;
    const row = [rowId, session.username, entryDate, title, text, true, createdAt, now];

    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    audit_(session.username, existing ? 'UPDATE_DIARY' : 'CREATE_DIARY', entryDate + (title ? ' · ' + title : ''));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, data: buildDashboard_(session.username) };
}

function deleteDiaryEntry_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id || '', 80);
  if (!id) throw appError_('VALIDATION_ERROR', 'Diary entry ID is required.');

  const record = findRecordById_(APP.SHEETS.DIARY, id);
  if (!record || !toBoolean_(record.Active)) throw appError_('NOT_FOUND', 'Diary entry was not found.');
  if (String(record.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot delete another user’s diary entry.');

  const sh = sheet_(APP.SHEETS.DIARY);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.DIARY, 'Active')).setValue(false);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.DIARY, 'UpdatedAt')).setValue(new Date());
  audit_(session.username, 'DELETE_DIARY', String(record.EntryDate || ''));
  SpreadsheetApp.flush();

  return { ok: true, data: buildDashboard_(session.username) };
}


function saveMonthlyItem_(request) {
  const session = requireAuth_(request.token);
  const raw = request.item || {};
  const id = cleanText_(raw.id || '', 80);
  const monthKey = cleanText_(raw.monthKey || '', 20);
  const entryType = cleanText_(raw.entryType || 'DIARY', 30).toUpperCase();
  const title = cleanText_(raw.title || '', 140);
  const text = cleanText_(raw.text || '', 5000);

  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw appError_('VALIDATION_ERROR', 'Choose a valid month.');
  if (!['DIARY','PLAN','EXPERIENCE','TARGET'].includes(entryType)) throw appError_('VALIDATION_ERROR', 'Choose a valid monthly item type.');
  if (!text) throw appError_('VALIDATION_ERROR', 'Monthly details cannot be blank.');

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = sheet_(APP.SHEETS.MONTHLY_DIARY);
    const existing = id ? findRecordById_(APP.SHEETS.MONTHLY_DIARY, id) : null;
    if (existing && String(existing.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot edit another user’s monthly item.');

    const now = new Date();
    const rowId = existing ? String(existing.Id) : newId_('M');
    const createdAt = existing ? existing.CreatedAt : now;
    let status = entryType === 'TARGET' ? 'OPEN' : 'SAVED';
    let completedAt = '';
    if (existing && String(existing.EntryType || '').toUpperCase() === 'TARGET' && entryType === 'TARGET') {
      status = String(existing.Status || 'OPEN').toUpperCase();
      completedAt = existing.CompletedAt || '';
    }
    if (entryType !== 'TARGET') {
      status = 'SAVED';
      completedAt = '';
    }

    const row = [rowId, session.username, monthKey, entryType, title, text, status, completedAt, true, createdAt, now];
    if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    audit_(session.username, existing ? 'UPDATE_MONTHLY_ITEM' : 'CREATE_MONTHLY_ITEM', monthKey + ' · ' + entryType + (title ? ' · ' + title : ''));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return { ok: true, data: buildDashboard_(session.username) };
}

function deleteMonthlyItem_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id || '', 80);
  if (!id) throw appError_('VALIDATION_ERROR', 'Monthly item ID is required.');
  const record = findRecordById_(APP.SHEETS.MONTHLY_DIARY, id);
  if (!record || !toBoolean_(record.Active)) throw appError_('NOT_FOUND', 'Monthly item was not found.');
  if (String(record.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot delete another user’s monthly item.');

  const sh = sheet_(APP.SHEETS.MONTHLY_DIARY);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.MONTHLY_DIARY, 'Active')).setValue(false);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.MONTHLY_DIARY, 'UpdatedAt')).setValue(new Date());
  audit_(session.username, 'DELETE_MONTHLY_ITEM', String(record.MonthKey || '') + ' · ' + String(record.EntryType || ''));
  SpreadsheetApp.flush();
  return { ok: true, data: buildDashboard_(session.username) };
}

function toggleMonthlyTarget_(request) {
  const session = requireAuth_(request.token);
  const id = cleanText_(request.id || '', 80);
  const completed = Boolean(request.completed);
  const record = findRecordById_(APP.SHEETS.MONTHLY_DIARY, id);
  if (!record || !toBoolean_(record.Active)) throw appError_('NOT_FOUND', 'Target was not found.');
  if (String(record.Username) !== session.username) throw appError_('FORBIDDEN', 'You cannot change another user’s target.');
  if (String(record.EntryType || '').toUpperCase() !== 'TARGET') throw appError_('VALIDATION_ERROR', 'This monthly item is not a target.');

  const sh = sheet_(APP.SHEETS.MONTHLY_DIARY);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.MONTHLY_DIARY, 'Status')).setValue(completed ? 'COMPLETED' : 'OPEN');
  sh.getRange(record.row, headerIndex_(APP.SHEETS.MONTHLY_DIARY, 'CompletedAt')).setValue(completed ? new Date() : '');
  sh.getRange(record.row, headerIndex_(APP.SHEETS.MONTHLY_DIARY, 'UpdatedAt')).setValue(new Date());
  audit_(session.username, completed ? 'COMPLETE_MONTHLY_TARGET' : 'REOPEN_MONTHLY_TARGET', String(record.MonthKey || '') + ' · ' + String(record.Title || ''));
  SpreadsheetApp.flush();
  return { ok: true, data: buildDashboard_(session.username) };
}

function setMonthStatus_(request) {
  const session = requireAuth_(request.token);
  const monthKey = cleanText_(request.monthKey || '', 20);
  const completed = Boolean(request.completed);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) throw appError_('VALIDATION_ERROR', 'Choose a valid month.');

  if (completed) {
    const targets = readObjects_(APP.SHEETS.MONTHLY_DIARY).filter(function(row) {
      return String(row.Username) === session.username &&
        toBoolean_(row.Active) &&
        String(row.MonthKey || '') === monthKey &&
        String(row.EntryType || '').toUpperCase() === 'TARGET';
    });
    const openTargets = targets.filter(function(row) { return String(row.Status || '').toUpperCase() !== 'COMPLETED'; });
    if (openTargets.length) throw appError_('VALIDATION_ERROR', 'Complete all monthly targets before completing the month.');
  }

  const existing = readObjects_(APP.SHEETS.MONTH_STATUS).find(function(row) {
    return String(row.Username) === session.username && toBoolean_(row.Active) && String(row.MonthKey || '') === monthKey;
  });
  const sh = sheet_(APP.SHEETS.MONTH_STATUS);
  const now = new Date();
  const rowId = existing ? String(existing.Id) : newId_('MS');
  const createdAt = existing ? existing.CreatedAt : now;
  const row = [rowId, session.username, monthKey, completed ? 'COMPLETED' : 'OPEN', completed ? now : '', true, createdAt, now];

  if (existing) sh.getRange(existing.row, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);

  audit_(session.username, completed ? 'COMPLETE_MONTH' : 'REOPEN_MONTH', monthKey);
  SpreadsheetApp.flush();
  return { ok: true, data: buildDashboard_(session.username) };
}

function changePassword_(request) {
  const session = requireAuth_(request.token);
  const currentPassword = String(request.currentPassword || '');
  const newPassword = String(request.newPassword || '');
  validateStrongPassword_(newPassword);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const user = findUser_(session.username);
    if (!user || !verifyPassword_(currentPassword, user.PasswordSalt, user.PasswordHash)) throw appError_('INVALID_PASSWORD', 'Current password is incorrect.');
    updateUserPasswordByRow_(user.row, newPassword);
    invalidateUserSessions_(session.username, session.tokenHash);
    audit_(session.username, 'CHANGE_PASSWORD', 'Password changed');
  } finally { lock.releaseLock(); }
  return { ok: true };
}

function adminListUsers_(request) {
  requireRole_(request.token, 'ADMIN');
  return { ok: true, users: listPublicUsers_() };
}

function countActiveAdmins_() {
  return readObjects_(APP.SHEETS.USERS).filter(function(row) {
    return String(row.Role || '').toUpperCase() === 'ADMIN' && toBoolean_(row.Active);
  }).length;
}

function adminCreateUser_(request) {
  const session = requireRole_(request.token, 'ADMIN');
  const username = normalizeUsername_(request.username);
  const displayName = cleanText_(request.displayName, 100);
  const role = String(request.role || 'USER').toUpperCase();
  let password = String(request.password || '');

  if (!/^[a-z0-9._-]{3,60}$/.test(username)) {
    throw appError_('VALIDATION_ERROR', 'Username must be 3–60 characters using letters, numbers, dot, underscore or hyphen.');
  }
  if (!displayName) throw appError_('VALIDATION_ERROR', 'Display name is required.');
  if (!['USER','ADMIN'].includes(role)) throw appError_('VALIDATION_ERROR', 'Invalid role.');

  // If the admin leaves the temporary password blank, create a strong one automatically.
  let generatedPassword = false;
  if (!password) {
    password = generateTemporaryPassword_();
    generatedPassword = true;
  }
  validateStrongPassword_(password);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (findUser_(username)) throw appError_('ALREADY_EXISTS', 'That username already exists.');
    const salt = randomToken_();
    const hash = hashPassword_(password, salt);
    const now = new Date();

    // Match the Users sheet header exactly:
    // Username, DisplayName, Role, PasswordSalt, PasswordHash, Active, CreatedAt, UpdatedAt, LastLogin
    sheet_(APP.SHEETS.USERS).appendRow([
      username, displayName, role, salt, hash, true, now, now, ''
    ]);

    audit_(session.username, 'CREATE_USER', username + ' (' + role + ')');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    user: {
      username: username,
      displayName: displayName,
      role: role,
      active: true
    },
    temporaryPassword: generatedPassword ? password : '',
    users: listPublicUsers_()
  };
}

function adminUpdateUser_(request) {
  const session = requireRole_(request.token, 'ADMIN');
  const username = normalizeUsername_(request.username);
  const displayName = cleanText_(request.displayName, 100);
  const role = String(request.role || 'USER').toUpperCase();
  const active = typeof request.active === 'undefined' ? true : toBoolean_(request.active);

  if (!username) throw appError_('VALIDATION_ERROR', 'Username is required.');
  if (!displayName) throw appError_('VALIDATION_ERROR', 'Display name is required.');
  if (!['USER','ADMIN'].includes(role)) throw appError_('VALIDATION_ERROR', 'Invalid role.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const user = findUser_(username);
    if (!user) throw appError_('NOT_FOUND', 'User not found.');

    const oldRole = String(user.Role || 'USER').toUpperCase();
    const oldActive = toBoolean_(user.Active);

    if (username === session.username) {
      if (!active) throw appError_('VALIDATION_ERROR', 'You cannot disable your own account.');
      if (role !== 'ADMIN') throw appError_('VALIDATION_ERROR', 'You cannot remove your own administrator role.');
    }

    // Never allow the last active administrator to be demoted or disabled.
    if (oldRole === 'ADMIN' && oldActive && (role !== 'ADMIN' || !active) && countActiveAdmins_() <= 1) {
      throw appError_('VALIDATION_ERROR', 'At least one active administrator account must remain.');
    }

    const sh = sheet_(APP.SHEETS.USERS);
    sh.getRange(user.row, headerIndex_(APP.SHEETS.USERS, 'DisplayName')).setValue(displayName);
    sh.getRange(user.row, headerIndex_(APP.SHEETS.USERS, 'Role')).setValue(role);
    sh.getRange(user.row, headerIndex_(APP.SHEETS.USERS, 'Active')).setValue(active);
    sh.getRange(user.row, headerIndex_(APP.SHEETS.USERS, 'UpdatedAt')).setValue(new Date());

    if (!active || role !== oldRole) invalidateUserSessions_(username, username === session.username ? session.tokenHash : '');
    audit_(session.username, 'UPDATE_USER', username + ' · ' + role + ' · ' + (active ? 'active' : 'disabled'));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, users: listPublicUsers_() };
}

function adminDeleteUser_(request) {
  const session = requireRole_(request.token, 'ADMIN');
  const username = normalizeUsername_(request.username);

  if (!username) throw appError_('VALIDATION_ERROR', 'Username is required.');
  if (username === session.username) throw appError_('VALIDATION_ERROR', 'You cannot delete the account you are currently using.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const user = findUser_(username);
    if (!user) throw appError_('NOT_FOUND', 'User not found.');

    const role = String(user.Role || 'USER').toUpperCase();
    const active = toBoolean_(user.Active);
    if (role === 'ADMIN' && active && countActiveAdmins_() <= 1) {
      throw appError_('VALIDATION_ERROR', 'The last active administrator cannot be deleted.');
    }

    // Delete the login account and sessions only.
    // Portfolio/diary records are intentionally retained to avoid accidental data loss.
    invalidateUserSessions_(username, '');
    sheet_(APP.SHEETS.USERS).deleteRow(user.row);
    audit_(session.username, 'DELETE_USER', username + ' · account removed; portfolio data retained');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, users: listPublicUsers_() };
}

function adminResetPassword_(request) {
  const session = requireRole_(request.token, 'ADMIN');
  const username = normalizeUsername_(request.username);
  const password = String(request.password || '');
  validateStrongPassword_(password);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const user = findUser_(username);
    if (!user) throw appError_('NOT_FOUND', 'User not found.');
    updateUserPasswordByRow_(user.row, password);
    invalidateUserSessions_(username, username === session.username ? session.tokenHash : '');
    audit_(session.username, 'RESET_USER_PASSWORD', username);
  } finally { lock.releaseLock(); }
  return { ok: true };
}

function adminToggleUser_(request) {
  const session = requireRole_(request.token, 'ADMIN');
  const username = normalizeUsername_(request.username);
  const active = toBoolean_(request.active);
  if (username === session.username && !active) throw appError_('VALIDATION_ERROR', 'You cannot disable your own account.');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const user = findUser_(username);
    if (!user) throw appError_('NOT_FOUND', 'User not found.');
    const sh = sheet_(APP.SHEETS.USERS);
    sh.getRange(user.row, headerIndex_(APP.SHEETS.USERS, 'Active')).setValue(active);
    sh.getRange(user.row, headerIndex_(APP.SHEETS.USERS, 'UpdatedAt')).setValue(new Date());
    if (!active) invalidateUserSessions_(username, '');
    audit_(session.username, active ? 'ENABLE_USER' : 'DISABLE_USER', username);
  } finally { lock.releaseLock(); }
  return { ok: true };
}


function masterPortfolioV155_() {
  return { version:'2026-08-21-v1', source:'Family_Portfolio_stock nm Tracker.xlsx', holdings:[{"owner":"Niharika","type":"STOCK","assetName":"DMART","code":"DMART","exchange":"NSE","units":20.0,"investedAmount":78477.0,"sourceCode":"","sourcePerf":{"d1":-1.27,"w1":-3.697044335,"m1":-2.2647169099999997,"m6":1.679972954,"y1":-16.66702189,"y3":9.554764773,"y5":6.428036747,"y10":null}},{"owner":"Niharika","type":"STOCK","assetName":"HDFCBANK","code":"HDFCBANK","exchange":"NSE","units":70.0,"investedAmount":53962.748,"sourceCode":"","sourcePerf":{"d1":0.54,"w1":0.27510316370000004,"m1":-3.206532563,"m6":-21.069727150000002,"y1":-26.777822420000003,"y3":-7.878941050000001,"y5":-4.368358914,"y10":133.0115707}},{"owner":"Niharika","type":"STOCK","assetName":"ITC","code":"ITC","exchange":"NSE","units":351.0,"investedAmount":86642.2089,"sourceCode":"","sourcePerf":{"d1":-0.77,"w1":-3.109273904,"m1":-4.006410256000001,"m6":-17.16349109,"y1":-33.534705949999996,"y3":-40.66042928,"y5":30.65923413,"y10":7.219570406000001}},{"owner":"Niharika","type":"STOCK","assetName":"PIDILITIND","code":"PIDILITIND","exchange":"NSE","units":30.0,"investedAmount":35407.851,"sourceCode":"","sourcePerf":{"d1":-0.8999999999999999,"w1":-2.83520378,"m1":2.26283725,"m6":11.07359892,"y1":6.85287431,"y3":31.900733669999997,"y5":47.71247699,"y10":367.88782069999996}},{"owner":"Niharika","type":"STOCK","assetName":"RELIANCE","code":"RELIANCE","exchange":"NSE","units":2.0,"investedAmount":2072.5904,"sourceCode":"","sourcePerf":{"d1":0.06,"w1":0.3053435115,"m1":1.97113146,"m6":-7.983193277,"y1":-7.776530039,"y3":4.310550131,"y5":21.533879650000003,"y10":425.09590790000004}},{"owner":"Niharika","type":"STOCK","assetName":"TATAPOWER","code":"TATAPOWER","exchange":"NSE","units":120.0,"investedAmount":28885.956,"sourceCode":"","sourcePerf":{"d1":-0.06999999999999999,"w1":-1.8453082060000001,"m1":-0.9377889314,"m6":-1.120632828,"y1":-3.3629686899999998,"y3":54.00410678000001,"y5":200.120048,"y10":401.33689840000005}},{"owner":"Niharika","type":"STOCK","assetName":"TITAN","code":"TITAN","exchange":"NSE","units":27.0,"investedAmount":69497.5005,"sourceCode":"","sourcePerf":{"d1":0.22999999999999998,"w1":0.4687314584,"m1":7.816877494000001,"m6":18.89203548,"y1":40.47230595,"y3":65.16777214,"y5":171.6015719,"y10":1148.8998159999999}},{"owner":"Niharika","type":"STOCK","assetName":"UNITDSPR","code":"UNITDSPR","exchange":"NSE","units":50.0,"investedAmount":52676.75,"sourceCode":"","sourcePerf":{"d1":0.7799999999999999,"w1":1.3020833330000001,"m1":10.81042587,"m6":9.817206578,"y1":16.37995512,"y3":null,"y5":null,"y10":null}},{"owner":"Niharika","type":"ETF","assetName":"GOLDBEES","code":"GOLDBEES","exchange":"NSE","units":1123.0,"investedAmount":102613.5635,"sourceCode":"","sourcePerf":{"d1":1.97,"w1":5.026772157,"m1":10.30720161,"m6":1.092307692,"y1":59.20048455,"y3":163.36673349999998,"y5":220.45842480000002,"y10":361.4466292}},{"owner":"Niharika","type":"ETF","assetName":"JUNIORBEES","code":"JUNIORBEES","exchange":"NSE","units":5.0,"investedAmount":3732.5,"sourceCode":"","sourcePerf":{"d1":-0.12,"w1":-0.7006598086,"m1":2.891189184,"m6":7.000413514999999,"y1":9.928737837,"y3":70.53596105,"y5":95.05641475,"y10":252.34560309999998}},{"owner":"Niharika","type":"ETF","assetName":"MAFANG","code":"MAFANG","exchange":"NSE","units":82.0,"investedAmount":14118.063,"sourceCode":"","sourcePerf":{"d1":0.67,"w1":-0.2941318289,"m1":5.354868294,"m6":34.71887419,"y1":32.3392,"y3":234.21690640000003,"y5":301.7485914,"y10":null}},{"owner":"Niharika","type":"ETF","assetName":"MON100","code":"MON100","exchange":"NSE","units":75.0,"investedAmount":17869.1625,"sourceCode":"","sourcePerf":{"d1":-0.15,"w1":-0.6283824414,"m1":2.185876824,"m6":44.12611198,"y1":63.50549124,"y3":173.1036192,"y5":197.247954,"y10":987.2039474}},{"owner":"Niharika","type":"ETF","assetName":"NIFTYBEES","code":"NIFTYBEES","exchange":"NSE","units":120.0,"investedAmount":28691.112,"sourceCode":"","sourcePerf":{"d1":0.1,"w1":-0.5424824861,"m1":1.273046532,"m6":-4.685832328999999,"y1":-2.197413976,"y3":29.709975170000003,"y5":55.44076362,"y10":215.0921921}},{"owner":"Niharika","type":"MF","assetName":"Franklin India Small Cap Fund - Direct Plan Growth","isin":"INF090I01IQ4","code":"118525","exchange":"","units":10.623,"investedAmount":521.25,"sourceCode":"INF090I01IQ4","sourcePerf":{"d1":0.0,"w1":0.42336424149999996,"m1":2.677851874,"m6":12.21769893,"y1":7.460028802,"y3":54.165303200000004,"y5":134.54908350000002,"y10":330.8178793},"snapshotNav":207.5415,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"ICICI Prudential Large Cap Fund - Direct Plan Growth","isin":"INF109K016L0","code":"120586","exchange":"","units":2443.156,"investedAmount":100000.0,"sourceCode":"INF109K016L0","sourcePerf":{"d1":0.0,"w1":-0.6597394029,"m1":1.192876344,"m6":-3.6319999999999997,"y1":-1.7695506810000001,"y3":43.90156493,"y5":85.75173477,"y10":268.6046512},"snapshotNav":120.79,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"Mirae Asset Large and Midcap Fund - Direct Plan","isin":"INF769K01BI1","code":"118834","exchange":"","units":2355.793,"investedAmount":153000.0,"sourceCode":"INF769K01BI1","sourcePerf":{"d1":0.0,"w1":-0.48222087040000006,"m1":2.041880957,"m6":2.715753425,"y1":6.441195259000001,"y3":48.6199891,"y5":81.36539547,"y10":378.30640020000004},"snapshotNav":180.685,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"Mirae Asset Large Cap Fund - Direct Plan","isin":"INF769K01AX2","code":"118825","exchange":"","units":2654.613,"investedAmount":125000.0,"sourceCode":"INF769K01AX2","sourcePerf":{"d1":0.0,"w1":-0.8669451166,"m1":1.619388424,"m6":-1.192076379,"y1":0.2384384618,"y3":34.37757884,"y5":60.454267650000006,"y10":244.3834663},"snapshotNav":129.275,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"Nippon India Growth Mid Cap Fund - Growth Plan Growth Option","isin":"INF204K01323","code":"100377","exchange":"","units":3.054,"investedAmount":6000.0,"sourceCode":"INF204K01323","sourcePerf":{"d1":0.0,"w1":-0.15203880120000002,"m1":2.5482194529999997,"m6":6.234044588,"y1":9.380026801000001,"y3":73.38009934,"y5":143.944586,"y10":422.0971824},"snapshotNav":4572.563,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"Nippon India Small Cap Fund - Growth Plan Growth Option","isin":"INF204K01HY3","code":"113177","exchange":"","units":213.383,"investedAmount":20000.0,"sourceCode":"INF204K01HY3","sourcePerf":{"d1":0.0,"w1":0.45642871259999995,"m1":3.9042409719999998,"m6":14.23663276,"y1":9.811934094,"y3":57.96336889,"y5":149.67694410000001,"y10":549.0146151},"snapshotNav":186.235,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"Parag Parikh Flexi Cap Fund - Direct Plan Growth","isin":"INF879O01027","code":"122639","exchange":"","units":1865.091,"investedAmount":80000.0,"sourceCode":"INF879O01027","sourcePerf":{"d1":0.0,"w1":-1.292709476,"m1":0.1238019479,"m6":-2.616703558,"y1":-1.958061049,"y3":49.0774312,"y5":87.39286816,"y10":390.0164605},"snapshotNav":90.7427,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"SBI Gold Fund - Direct Plan Growth","isin":"INF200K01RP8","code":"119788","exchange":"","units":440.886,"investedAmount":20000.0,"sourceCode":"INF200K01RP8","sourcePerf":{"d1":0.0,"w1":1.020593658,"m1":5.982036635,"m6":-0.9619505489000001,"y1":53.091343189999996,"y3":153.9813812,"y5":209.55728269999997,"y10":347.45216819999996},"snapshotNav":47.6215,"snapshotNavDate":"2026-08-20"},{"owner":"Niharika","type":"MF","assetName":"Sundaram Large and Mid Cap Fund - Direct Growth","isin":"INF903J01PR9","code":"119566","exchange":"","units":1595.11,"investedAmount":50000.0,"sourceCode":"INF903J01PR9","sourcePerf":{"d1":0.0,"w1":-0.04374283642,"m1":6.173589818,"m6":9.307129731,"y1":12.2029393,"y3":59.9138962,"y5":95.76349302,"y10":337.4894478},"snapshotNav":108.864,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"ICICI Prudential Large Cap Fund - Direct Plan Growth","isin":"INF109K016L0","code":"120586","exchange":"","units":747.069,"investedAmount":84000.0,"sourceCode":"INF109K016L0","sourcePerf":{"d1":0.0,"w1":-0.6597394029,"m1":1.192876344,"m6":-3.6319999999999997,"y1":-1.7695506810000001,"y3":43.90156493,"y5":85.75173477,"y10":268.6046512},"snapshotNav":120.79,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"ICICI Prudential Large Cap Fund - Growth (Regular)","isin":"INF109K01BL4","code":"108466","exchange":"","units":1191.012,"investedAmount":115000.0,"sourceCode":"INF109K01BL4","sourcePerf":{"d1":0.0,"w1":-0.6558571689,"m1":1.159447176,"m6":-3.869546056,"y1":-2.284741511,"y3":41.52608357,"y5":80.47327486,"y10":244.25505049999998},"snapshotNav":109.35,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Mirae Asset ELSS Tax Saver Fund - Direct Plan","isin":"INF769K01DM9","code":"135781","exchange":"","units":14040.68,"investedAmount":370000.0,"sourceCode":"INF769K01DM9","sourcePerf":{"d1":0.0,"w1":-0.6206388122,"m1":1.8752855990000001,"m6":1.481118367,"y1":4.448969295,"y3":48.58248744,"y5":83.03388171,"y10":393.4451349},"snapshotNav":58.135,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Mirae Asset Healthcare Fund - Direct Plan","isin":"INF769K01ED6","code":"143783","exchange":"","units":2832.178,"investedAmount":66000.0,"sourceCode":"INF769K01ED6","sourcePerf":{"d1":0.0,"w1":0.2603559493,"m1":2.643566129,"m6":20.29559866,"y1":19.071463180000002,"y3":85.57865208999999,"y5":112.97618560000001,"y10":0.0},"snapshotNav":51.386,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Mirae Asset Large and Midcap Fund - Regular Plan","isin":"INF769K01101","code":"112932","exchange":"","units":746.103,"investedAmount":56508.38,"sourceCode":"INF769K01101","sourcePerf":{"d1":0.0,"w1":-0.4921494928,"m1":1.97357827,"m6":2.252837037,"y1":5.470207323,"y3":44.54954667,"y5":72.93680703,"y10":336.201576},"snapshotNav":158.946,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Mirae Asset Large Cap Fund - Direct Plan","isin":"INF769K01AX2","code":"118825","exchange":"","units":2055.807,"investedAmount":182000.0,"sourceCode":"INF769K01AX2","sourcePerf":{"d1":0.0,"w1":-0.8669451166,"m1":1.619388424,"m6":-1.192076379,"y1":0.2384384618,"y3":34.37757884,"y5":60.454267650000006,"y10":244.3834663},"snapshotNav":129.275,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Motilal Oswal Large Cap Fund - Direct Plan Growth","isin":"INF247L01CE3","code":"152354","exchange":"","units":10299.844,"investedAmount":144000.0,"sourceCode":"INF247L01CE3","sourcePerf":{"d1":0.0,"w1":-0.1516252107,"m1":1.378377024,"m6":-0.8446087907000001,"y1":-1.040742009,"y3":0.0,"y5":0.0,"y10":0.0},"snapshotNav":null,"snapshotNavDate":""},{"owner":"Sarada","type":"MF","assetName":"Motilal Oswal Midcap Fund - Direct Plan Growth","isin":"INF247L01445","code":"127042","exchange":"","units":1066.697,"investedAmount":120000.0,"sourceCode":"INF247L01445","sourcePerf":{"d1":0.0,"w1":-0.2221546003,"m1":5.586960328,"m6":13.76096522,"y1":0.5627722314,"y3":79.57817398,"y5":189.6923467,"y10":426.38472199999995},"snapshotNav":null,"snapshotNavDate":""},{"owner":"Sarada","type":"MF","assetName":"Motilal Oswal Small Cap Fund - Direct Plan Growth","isin":"INF247L01BY3","code":"152237","exchange":"","units":6023.66,"investedAmount":84000.0,"sourceCode":"INF247L01BY3","sourcePerf":{"d1":0.0,"w1":0.6922470614,"m1":4.432768007,"m6":26.78187454,"y1":24.23294293,"y3":0.0,"y5":0.0,"y10":0.0},"snapshotNav":null,"snapshotNavDate":""},{"owner":"Sarada","type":"MF","assetName":"Nippon India Large Cap Fund - Direct Growth Plan Growth Option","isin":"INF204K01XI3","code":"118632","exchange":"","units":1282.284,"investedAmount":120000.0,"sourceCode":"INF204K01XI3","sourcePerf":{"d1":0.0,"w1":-0.7666415336,"m1":1.107595727,"m6":-2.903724369,"y1":-1.479246165,"y3":43.39814051,"y5":103.6546127,"y10":291.6248762},"snapshotNav":101.6201,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Parag Parikh Flexi Cap Fund - Direct Plan Growth","isin":"INF879O01027","code":"122639","exchange":"","units":11266.35,"investedAmount":624663.11,"sourceCode":"INF879O01027","sourcePerf":{"d1":0.0,"w1":-1.292709476,"m1":0.1238019479,"m6":-2.616703558,"y1":-1.958061049,"y3":49.0774312,"y5":87.39286816,"y10":390.0164605},"snapshotNav":90.7427,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Parag Parikh Liquid Fund - Direct Plan Growth","isin":"INF879O01068","code":"143269","exchange":"","units":7.339,"investedAmount":10000.0,"sourceCode":"INF879O01068","sourcePerf":{"d1":0.0,"w1":0.07932824964,"m1":0.48718058109999995,"m6":3.267574535,"y1":6.328726578,"y3":21.4492983,"y5":33.93777973,"y10":0.0},"snapshotNav":1564.4899,"snapshotNavDate":"2026-08-20"},{"owner":"Sarada","type":"MF","assetName":"Tata Digital India Fund - Direct Plan Growth","isin":"INF277K01Z77","code":"135800","exchange":"","units":2946.765,"investedAmount":110000.0,"sourceCode":"INF277K01Z77","sourcePerf":{"d1":0.0,"w1":-2.363179392,"m1":4.559040649,"m6":0.21419380059999998,"y1":-9.815561981,"y3":23.70059287,"y5":29.9585724,"y10":405.1013392},"snapshotNav":49.8762,"snapshotNavDate":"2026-08-20"}], watchlist:[{"type":"STOCK","assetName":"Reliance Industries Ltd","code":"RELIANCE","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Reliance Industries Ltd","snapshotPrice":1314.0,"snapshotChange":0.8,"snapshotChangePct":0.06,"dayHigh":1316.0,"dayLow":1308.0,"volume":5434871.0,"high52":1611.8,"low52":1249.8,"marketCap":1777655.412,"salesGrowth":"10%, -2%, 16%, 8%","profitGrowth":"10%, 12%, 11%, 9%","valuation":"23.8","moatRemark":"Scale, Ecosystem, Cost Advantage","finalRemark":"","perf1M":0.7900590626999999,"perf1Y":-7.776530039,"perf3Y":4.285714286,"perf5Y":21.533879650000003,"perf10Y":424.3625045,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"Tata Consultancy Services Ltd","code":"TCS","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Tata Consultancy Services Ltd","snapshotPrice":2295.0,"snapshotChange":-3.0,"snapshotChangePct":-0.13,"dayHigh":2307.2,"dayLow":2263.3,"volume":2066749.0,"high52":3350.0,"low52":1976.8,"marketCap":831559.3356,"salesGrowth":"8%, 6%, 10%, 9%","profitGrowth":"10%, 8%, 9%, 11%","valuation":"16.67","moatRemark":"Switching Costs, Brand Reputation, Scale","finalRemark":"","perf1M":3.327180226,"perf1Y":-26.029781470000003,"perf3Y":-32.53274146,"perf5Y":-36.90548194,"perf10Y":80.09181151,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"Infosys Ltd","code":"INFY","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Infosys Ltd","snapshotPrice":1119.0,"snapshotChange":-11.0,"snapshotChangePct":-0.97,"dayHigh":1133.5,"dayLow":1118.0,"volume":6094967.0,"high52":1728.0,"low52":982.4,"marketCap":4878.066875,"salesGrowth":"11% (10Y)","profitGrowth":"10% (10Y)","valuation":"15.12","moatRemark":"Switching Costs, Brand Reputation","finalRemark":"","perf1M":4.2384722870000004,"perf1Y":-25.220529270000004,"perf3Y":-20.378539919999998,"perf5Y":-35.643422,"perf10Y":120.3927284,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"HDFC Bank Ltd","code":"HDFCBANK","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"HDFC Bank Ltd","snapshotPrice":729.0,"snapshotChange":3.95,"snapshotChangePct":0.54,"dayHigh":732.8,"dayLow":726.6,"volume":26029811.0,"high52":1020.5,"low52":715.1,"marketCap":11804.39117,"salesGrowth":"16.3% (10Y Median)","profitGrowth":"18.9% (5Y)","valuation":"14.24","moatRemark":"Low-Cost CASA, Scale, Switching Costs","finalRemark":"","perf1M":-4.261606146,"perf1Y":-26.777822420000003,"perf3Y":-8.273041837000001,"perf5Y":-4.368358914,"perf10Y":133.2202956,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"Refex Industries Ltd","code":"REFEX","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Refex Industries Ltd","snapshotPrice":294.0,"snapshotChange":0.4,"snapshotChangePct":0.14,"dayHigh":296.3,"dayLow":293.05,"volume":133646.0,"high52":415.0,"low52":188.0,"marketCap":4034.25036,"salesGrowth":"29%, 40% (5Y, 10Y)","profitGrowth":"25%, 35% (5Y, 10Y)","valuation":"15.33","moatRemark":"Niche Operations, Limited Moat","finalRemark":"","perf1M":-3.8587311970000004,"perf1Y":-21.33779264,"perf3Y":106.3447501,"perf5Y":1013.2146909999999,"perf10Y":10788.88889,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"Dmart","code":"DMART","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Dmart","snapshotPrice":3909.9,"snapshotChange":-50.1,"snapshotChangePct":-1.27,"dayHigh":3990.0,"dayLow":3866.4,"volume":417784.0,"high52":4949.5,"low52":3529.0,"marketCap":254293.847,"salesGrowth":"25.3% (10Y Median)","profitGrowth":"20% (5Y)","valuation":"83.36","moatRemark":"Cost Advantage (EDLP), Scale","finalRemark":"","perf1M":-1.6525807430000001,"perf1Y":-16.66702189,"perf3Y":10.20943146,"perf5Y":6.428036747,"perf10Y":null,"sourceSheet":"Stocks"}},{"type":"ETF","assetName":"GoldBees","code":"GOLDBEES","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"GoldBees","snapshotPrice":131.42,"snapshotChange":2.54,"snapshotChangePct":1.97,"dayHigh":131.93,"dayLow":129.82,"volume":46291317.0,"high52":148.14,"low52":80.02,"marketCap":"#N/A","salesGrowth":"N/A","profitGrowth":"N/A","valuation":"#N/A","moatRemark":"N/A","finalRemark":"","perf1M":11.62830205,"perf1Y":59.20048455,"perf3Y":164.5330113,"perf5Y":220.45842480000002,"perf10Y":360.3152364,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"ITC","code":"ITC","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"ITC","snapshotPrice":269.55,"snapshotChange":-2.1,"snapshotChangePct":-0.77,"dayHigh":271.6,"dayLow":269.0,"volume":8312928.0,"high52":427.0,"low52":265.0,"marketCap":337641.7343,"salesGrowth":"9.87% (5Y)","profitGrowth":"10% (5Y)","valuation":"17.02","moatRemark":"Strong Brands, Distribution Network, Monopoly-like Cigarette Business","finalRemark":"","perf1M":-4.074733096,"perf1Y":-33.534705949999996,"perf3Y":-39.80571684,"perf5Y":30.65923413,"perf10Y":6.0802833530000004,"sourceSheet":"Stocks"}},{"type":"ETF","assetName":"Junior Bees","code":"JUNIORBEES","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Junior Bees","snapshotPrice":802.15,"snapshotChange":-0.96,"snapshotChangePct":-0.12,"dayHigh":805.39,"dayLow":799.09,"volume":277039.0,"high52":823.97,"low52":632.34,"marketCap":"#N/A","salesGrowth":"N/A","profitGrowth":"N/A","valuation":"#N/A","moatRemark":"N/A","finalRemark":"","perf1M":2.258965108,"perf1Y":9.928737837,"perf3Y":72.07611121000001,"perf5Y":95.05641475,"perf10Y":250.23796009999998,"sourceSheet":"Stocks"}},{"type":"ETF","assetName":"Mafang","code":"MAFANG","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Mafang","snapshotPrice":206.78,"snapshotChange":1.38,"snapshotChangePct":0.67,"dayHigh":206.78,"dayLow":206.78,"volume":71981.0,"high52":211.42,"low52":149.74,"marketCap":"#N/A","salesGrowth":"N/A","profitGrowth":"N/A","valuation":"#N/A","moatRemark":"N/A","finalRemark":"","perf1M":6.166247369,"perf1Y":32.3392,"perf3Y":240.15463069999998,"perf5Y":301.7485914,"perf10Y":null,"sourceSheet":"Stocks"}},{"type":"ETF","assetName":"Mon100","code":"MON100","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Mon100","snapshotPrice":330.51,"snapshotChange":-0.48,"snapshotChangePct":-0.15,"dayHigh":330.51,"dayLow":330.0,"volume":346898.0,"high52":342.55,"low52":200.21,"marketCap":"#N/A","salesGrowth":"N/A","profitGrowth":"N/A","valuation":"#N/A","moatRemark":"N/A","finalRemark":"","perf1M":2.385304049,"perf1Y":63.50549124,"perf3Y":175.6317238,"perf5Y":197.247954,"perf10Y":1000.966023,"sourceSheet":"Stocks"}},{"type":"ETF","assetName":"Niftbees","code":"NIFTYBEES","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Niftbees","snapshotPrice":276.84,"snapshotChange":0.27,"snapshotChangePct":0.1,"dayHigh":277.38,"dayLow":276.12,"volume":4364104.0,"high52":302.25,"low52":251.7,"marketCap":"#N/A","salesGrowth":"N/A","profitGrowth":"N/A","valuation":"#N/A","moatRemark":"N/A","finalRemark":"","perf1M":0.6215243703,"perf1Y":-2.197413976,"perf3Y":29.66744731,"perf5Y":55.44076362,"perf10Y":215.2716092,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"Pidilight","code":"PIDILITIND","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Pidilight","snapshotPrice":1645.0,"snapshotChange":-15.0,"snapshotChangePct":-0.9,"dayHigh":1664.4,"dayLow":1644.1,"volume":732973.0,"high52":1707.5,"low52":1259.0,"marketCap":83711.14618,"salesGrowth":"11%, 7%, 15%, 11%","profitGrowth":"15%, 10%, 14%, 12%","valuation":"63.35","moatRemark":"Strong Brand (Fevicol), Unmatched Distribution","finalRemark":"","perf1M":3.374599384,"perf1Y":6.85287431,"perf3Y":32.30066432,"perf5Y":47.71247699,"perf10Y":366.07168149999995,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"Tatapower","code":"TATAPOWER","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"Tatapower","snapshotPrice":375.0,"snapshotChange":-0.25,"snapshotChangePct":-0.07,"dayHigh":377.75,"dayLow":373.05,"volume":4141292.0,"high52":464.9,"low52":342.5,"marketCap":119777.2844,"salesGrowth":"8% (10Y)","profitGrowth":"11% (5Y)","valuation":"31.07","moatRemark":"Regulated Returns, Integrated Power Ecosystem","finalRemark":"","perf1M":-1.690916241,"perf1Y":-3.3629686899999998,"perf3Y":56.6743263,"perf5Y":200.120048,"perf10Y":386.69695,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"titan","code":"TITAN","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"titan","snapshotPrice":5079.9,"snapshotChange":11.9,"snapshotChangePct":0.23,"dayHigh":5090.4,"dayLow":5011.0,"volume":352381.0,"high52":5168.0,"low52":3303.1,"marketCap":450745.7666,"salesGrowth":"41%, 27%, 30%, 21%","profitGrowth":"30%, 25%, 20%, 15%","valuation":"78.3","moatRemark":"Strong Brand Trust (Tanishq), Distribution Network","finalRemark":"","perf1M":8.343464073,"perf1Y":40.47230595,"perf3Y":65.02290225,"perf5Y":171.6015719,"perf10Y":1160.677503,"sourceSheet":"Stocks"}},{"type":"STOCK","assetName":"unitdspr","code":"UNITDSPR","exchange":"NSE","priority":"MEDIUM","source":{"companyName":"unitdspr","snapshotPrice":1556.0,"snapshotChange":12.0,"snapshotChangePct":0.78,"dayHigh":1563.4,"dayLow":1527.0,"volume":831704.0,"high52":1563.4,"low52":1210.8,"marketCap":113047.2716,"salesGrowth":"9%, 4% (5Y, 10Y)","profitGrowth":"34.5% (5Y)","valuation":"#N/A","moatRemark":"Strong Brands, Regulatory Barriers to Entry","finalRemark":"","perf1M":11.8780558,"perf1Y":16.37995512,"perf3Y":null,"perf5Y":null,"perf10Y":null,"sourceSheet":"Stocks"}},{"type":"MF","assetName":"HDFC Small Cap Fund - Direct Plan - Growth Option","code":"130503","exchange":"","priority":"MEDIUM","source":{"companyName":"HDFC Small Cap Fund - Direct Plan - Growth Option","snapshotPrice":161.266,"snapshotChange":null,"snapshotChangePct":null,"dayHigh":null,"dayLow":null,"volume":null,"high52":null,"low52":null,"marketCap":"","salesGrowth":"","profitGrowth":"","valuation":"","moatRemark":"ISIN INF179KA1RW5","finalRemark":"NAV date 2026-08-20","perf1M":null,"perf1Y":null,"perf3Y":null,"perf5Y":null,"perf10Y":null,"sourceSheet":"Mutual Funds"}}] };
}

function deleteRowsForUsername_(sheetName, username) {
  const sh=sheet_(sheetName);
  const values=sh.getDataRange().getValues();
  const headers=values[0]||[];
  const idx=headers.indexOf('Username');
  if(idx<0)return 0;
  let deleted=0;
  for(let r=values.length-1;r>=1;r--){
    if(String(values[r][idx]||'')===String(username)){sh.deleteRow(r+1);deleted++;}
  }
  return deleted;
}

function replaceRowsForUsernameBatch_(sheetName, username, replacementRows) {
  const sh = sheet_(sheetName);
  const headers = APP.HEADERS[sheetName];
  if (!headers) throw appError_('CONFIG_ERROR', 'No header definition for sheet: ' + sheetName);

  const lastRow = sh.getLastRow();
  const lastCol = headers.length;
  const existing = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  const usernameCol = headers.indexOf('Username');
  if (usernameCol < 0) throw appError_('CONFIG_ERROR', 'Username column missing in sheet: ' + sheetName);

  const kept = [];
  let removed = 0;

  existing.forEach(function(row) {
    const hasData = row.some(function(cell) { return cell !== ''; });
    if (!hasData) return;
    if (String(row[usernameCol] || '') === String(username)) {
      removed++;
      return;
    }
    const normalized = row.slice(0, lastCol);
    while (normalized.length < lastCol) normalized.push('');
    kept.push(normalized);
  });

  const replacement = (replacementRows || []).map(function(row) {
    const normalized = row.slice(0, lastCol);
    while (normalized.length < lastCol) normalized.push('');
    return normalized;
  });

  const finalRows = kept.concat(replacement);
  const clearRows = Math.max(lastRow - 1, finalRows.length);

  if (clearRows > 0) sh.getRange(2, 1, clearRows, lastCol).clearContent();
  if (finalRows.length) sh.getRange(2, 1, finalRows.length, lastCol).setValues(finalRows);

  return { removed: removed, added: replacement.length, kept: kept.length };
}


function upsertPerformanceSnapshot_(type,code,exchange,perf) {
  type=String(type||'').toUpperCase();code=String(code||'').toUpperCase();exchange=String(exchange||'').toUpperCase();
  if(!['STOCK','ETF','MF'].includes(type)||!code)return;
  ensurePerformanceRow_(type,code,exchange);
  if(type!=='MF'||!perf)return;
  const key=quoteKey_(type,code,exchange);
  const rec=findRecordByField_(APP.SHEETS.PERFORMANCE,'Key',key);
  if(!rec)return;
  const vals=[perf.d1,perf.w1,perf.m1,perf.m6,perf.y1,perf.y3,perf.y5,perf.y10].map(function(v){return v===null||typeof v==='undefined'||v===''?'':Number(v);});
  const sh=sheet_(APP.SHEETS.PERFORMANCE);
  sh.getRange(rec.row,5,1,8).setValues([vals]);
  sh.getRange(rec.row,13).setValue(new Date());
}

function replaceMasterPortfolioData_(request) {
  const session = requireAuth_(request.token);
  const master = masterPortfolioV155_();
  const now = new Date();

  const holdingRows = master.holdings.map(function(h) {
    return [
      newId_('H'), session.username, String(h.type || '').toUpperCase(), h.assetName,
      String(h.code || '').toUpperCase(), String(h.exchange || '').toUpperCase(),
      Number(h.units || 0), Number(h.investedAmount || 0),
      '', '', '', true, now, now, h.owner, String(h.sourceCode || '')
    ];
  });

  const watchRows = master.watchlist.map(function(w) {
    const s = w.source || {};
    return [
      newId_('W'), session.username, String(w.type || '').toUpperCase(), w.assetName,
      String(w.code || '').toUpperCase(), String(w.exchange || '').toUpperCase(),
      '', '', w.priority || 'MEDIUM', '', true, now, now,
      s.companyName || '',
      s.snapshotPrice == null ? '' : Number(s.snapshotPrice),
      s.snapshotChange == null ? '' : Number(s.snapshotChange),
      s.snapshotChangePct == null ? '' : Number(s.snapshotChangePct),
      s.dayHigh == null ? '' : Number(s.dayHigh),
      s.dayLow == null ? '' : Number(s.dayLow),
      s.volume == null ? '' : Number(s.volume),
      s.high52 == null ? '' : Number(s.high52),
      s.low52 == null ? '' : Number(s.low52),
      s.marketCap == null ? '' : s.marketCap,
      s.salesGrowth || '', s.profitGrowth || '', s.valuation || '',
      s.moatRemark || '', s.finalRemark || '',
      s.perf1M == null ? '' : Number(s.perf1M),
      s.perf1Y == null ? '' : Number(s.perf1Y),
      s.perf3Y == null ? '' : Number(s.perf3Y),
      s.perf5Y == null ? '' : Number(s.perf5Y),
      s.perf10Y == null ? '' : Number(s.perf10Y),
      s.sourceSheet || ''
    ];
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  let holdingResult, watchResult, txResult;
  try {
    // Batch rewrite instead of deleteRow() hundreds/thousands of times.
    holdingResult = replaceRowsForUsernameBatch_(APP.SHEETS.HOLDINGS, session.username, holdingRows);
    watchResult = replaceRowsForUsernameBatch_(APP.SHEETS.WATCHLIST, session.username, watchRows);
    txResult = replaceRowsForUsernameBatch_(APP.SHEETS.TRANSACTIONS, session.username, []);

    setSetting_('MasterPortfolioVersion_' + session.username, master.version);
    setSetting_('MasterPortfolioAppliedAt_' + session.username, now.toISOString());
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  // Fast quote-row setup only. Do not run AMFI/network refresh inside replacement.
  // Prices/performance refresh normally afterwards through Refresh / auto-update.
  try {
    const quoteItems = master.holdings.concat(master.watchlist).map(function(item) {
      return {
        type: item.type,
        code: item.code,
        exchange: item.exchange,
        assetName: item.assetName
      };
    });
    ensureQuotesBatch_(quoteItems);
    SpreadsheetApp.flush();
  } catch (quoteError) {
    console.warn('Quote setup after master replace: ' + quoteError);
  }

  audit_(
    session.username,
    'REPLACE_MASTER_PORTFOLIO_FAST',
    'holdings=' + holdingRows.length +
    '; watchlist=' + watchRows.length +
    '; removedHoldings=' + holdingResult.removed +
    '; removedWatch=' + watchResult.removed +
    '; removedTransactions=' + txResult.removed
  );

  const data = buildDashboard_(session.username);

  if (data.holdings.length !== master.holdings.length || data.watchlist.length !== master.watchlist.length) {
    throw appError_(
      'MASTER_REPLACE_VERIFY_FAILED',
      'Replacement finished but verification failed. Expected ' +
      master.holdings.length + ' holdings / ' + master.watchlist.length +
      ' watchlist items; found ' + data.holdings.length + ' / ' + data.watchlist.length + '.'
    );
  }

  return {
    ok: true,
    source: master.source,
    masterVersion: master.version,
    importedHoldings: master.holdings.length,
    importedWatchlist: master.watchlist.length,
    removedHoldings: holdingResult.removed,
    removedWatchlist: watchResult.removed,
    removedTransactions: txResult.removed,
    data: data,
    note: 'Master data replaced. Live price/performance refresh runs separately.'
  };
}

function backupNowAction_(request) {
  const session = requireRole_(request.token, 'ADMIN');
  const result = createBackup_('manual-' + session.username);
  audit_(session.username, 'BACKUP_NOW', result.fileName);
  return { ok: true, backup: result };
}


function transactionSide_(row) {
  const t = String((row && (row.TransactionType || row.transactionType)) || '').toUpperCase();
  const units = finiteNumberOrNull_(row && (row.Units !== undefined ? row.Units : row.units));
  if (/(SELL|SALE|REDEMPTION|SWITCH[\s_-]*OUT|STP[\s_-]*OUT|WITHDRAW)/.test(t)) return 'SELL';
  if (/(BUY|PURCHASE|SIP|SYSTEMATIC|SWITCH[\s_-]*IN|STP[\s_-]*IN|REINVEST)/.test(t)) return 'BUY';
  if (units !== null && units < 0) return 'SELL';
  if (units !== null && units > 0) return 'BUY';
  return 'OTHER';
}

function transactionClientHistory_(rows) {
  const sorted = rows.slice().sort(function(a,b) {
    const d = String(a.TradeDate || '').localeCompare(String(b.TradeDate || ''));
    if (d !== 0) return d;
    return String(a.CreatedAt || '').localeCompare(String(b.CreatedAt || ''));
  });

  const lotsByKey = {};
  const resultById = {};

  sorted.forEach(function(row) {
    const owner = cleanOwner_(row.Owner || '');
    const assetType = String(row.AssetType || 'MF').toUpperCase();
    const code = String(row.ProductCode || '').toUpperCase();
    const key = normalizeOwner_(owner) + '|' + assetType + '|' + code;
    if (!lotsByKey[key]) lotsByKey[key] = [];

    const side = transactionSide_(row);
    const rawUnits = finiteNumberOrNull_(row.Units);
    const qty = rawUnits === null ? null : Math.abs(rawUnits);
    const rawPrice = finiteNumberOrNull_(row.Price);
    let price = rawPrice === null ? null : Math.abs(rawPrice);
    const rawAmount = finiteNumberOrNull_(row.Amount);
    let amount = rawAmount === null ? null : Math.abs(rawAmount);

    if ((price === null || price === 0) && qty && amount) price = amount / qty;
    if ((amount === null || amount === 0) && qty && price) amount = qty * price;

    let realizedPnl = null;
    let holdingDays = null;

    if (side === 'BUY' && qty && qty > 0) {
      lotsByKey[key].push({
        qty: qty,
        unitCost: price !== null ? price : (amount !== null ? amount / qty : 0),
        date: serializeDateOnly_(row.TradeDate)
      });
    } else if (side === 'SELL' && qty && qty > 0) {
      let remaining = qty;
      let consumed = 0;
      let costBasis = 0;
      let weightedDays = 0;
      const saleDate = new Date(serializeDateOnly_(row.TradeDate) + 'T00:00:00');

      while (remaining > 0.00000001 && lotsByKey[key].length) {
        const lot = lotsByKey[key][0];
        const take = Math.min(remaining, lot.qty);
        costBasis += take * Number(lot.unitCost || 0);
        consumed += take;

        const buyDate = new Date(String(lot.date || '') + 'T00:00:00');
        if (!Number.isNaN(saleDate.getTime()) && !Number.isNaN(buyDate.getTime())) {
          weightedDays += take * Math.max(0, Math.round((saleDate - buyDate) / 86400000));
        }

        lot.qty -= take;
        remaining -= take;
        if (lot.qty <= 0.00000001) lotsByKey[key].shift();
      }

      if (consumed > 0) {
        const proceeds = price !== null ? consumed * price : (amount !== null && qty ? amount * (consumed / qty) : null);
        if (proceeds !== null) realizedPnl = round_(proceeds - costBasis, 2);
        holdingDays = Math.round(weightedDays / consumed);
      }
    }

    resultById[String(row.Id || '')] = {
      id: String(row.Id || ''),
      owner: owner,
      assetType: assetType,
      assetName: String(row.SchemeName || row.ProductCode || ''),
      code: code,
      tradeDate: serializeDateOnly_(row.TradeDate),
      side: side,
      transactionType: String(row.TransactionType || ''),
      amount: amount === null ? null : round_(amount, 2),
      units: qty,
      price: price,
      broker: String(row.Broker || ''),
      source: String(row.Source || ''),
      realizedPnl: realizedPnl,
      holdingDays: holdingDays
    };
  });

  return sorted.slice().reverse().map(function(row) {
    return resultById[String(row.Id || '')];
  }).filter(Boolean);
}

function transactionStats_(rows) {
  const buys = [], sells = [];
  (rows || []).forEach(function(row) {
    const side = transactionSide_(row);
    const d = serializeDateOnly_(row.TradeDate);
    if (!d) return;
    if (side === 'BUY') buys.push(d);
    else if (side === 'SELL') sells.push(d);
  });

  const uniq = function(items) {
    const seen = {};
    return items.filter(function(x) {
      if (!x || seen[x]) return false;
      seen[x] = true;
      return true;
    }).sort();
  };

  const purchaseDates = uniq(buys);
  const saleDates = uniq(sells);

  const analysed = transactionClientHistory_(rows || []);
  const saleRows = analysed.filter(function(x) { return x && x.side === 'SELL'; });
  const realisedRows = saleRows.filter(function(x) {
    return x.realizedPnl !== null && typeof x.realizedPnl !== 'undefined' && isFinite(Number(x.realizedPnl));
  });
  const realisedComplete = saleRows.length === 0 || realisedRows.length === saleRows.length;
  const realisedPnl = realisedComplete
    ? round_(realisedRows.reduce(function(sum, x) { return sum + Number(x.realizedPnl || 0); }, 0), 2)
    : null;

  return {
    transactionCount: (rows || []).length,
    buyCount: buys.length,
    saleCount: sells.length,
    firstPurchaseDate: purchaseDates.length ? purchaseDates[0] : '',
    latestPurchaseDate: purchaseDates.length ? purchaseDates[purchaseDates.length - 1] : '',
    latestSaleDate: saleDates.length ? saleDates[saleDates.length - 1] : '',
    purchaseDates: purchaseDates,
    saleDates: saleDates,
    realizedPnl: realisedPnl,
    realizedPnlComplete: realisedComplete
  };
}

function sharedHoldingSnapshotBase_(username) {
  return 'HoldingSnapshot_' + sha256Hex_(normalizeUsername_(username)).slice(0, 18);
}

function sharedHoldingKey_(holding) {
  const h = holding || {};
  return String(h.id || [h.owner, h.type, h.sourceCode || h.code, h.exchange].join('|')).toUpperCase();
}

function sharedHoldingHealth_(holdings) {
  const rows = Array.isArray(holdings) ? holdings : [];
  const priceable = rows.filter(function(h) {
    return ['MF','STOCK','ETF'].includes(String(h.type || '').toUpperCase()) && Number(h.units || 0) > 0;
  });
  const valued = priceable.filter(function(h) {
    return Number(h.currentPrice || 0) > 0 || Number(h.currentValue || 0) > 0;
  }).length;
  return { total: rows.length, priceable: priceable.length, valued: valued };
}

function readSharedHoldingSnapshot_(username) {
  try {
    const props = PropertiesService.getScriptProperties();
    const base = sharedHoldingSnapshotBase_(username);
    const meta = JSON.parse(props.getProperty(base + '_META') || 'null');
    if (!meta || !Number(meta.chunks) || Number(meta.chunks) > 40) return null;
    let raw = '';
    for (let i = 0; i < Number(meta.chunks); i++) {
      const part = props.getProperty(base + '_' + i);
      if (part === null) return null;
      raw += part;
    }
    if (meta.hash && sha256Hex_(raw) !== String(meta.hash)) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.holdings)) return null;
    return {
      holdings: parsed.holdings,
      savedAt: String(meta.savedAt || ''),
      health: sharedHoldingHealth_(parsed.holdings)
    };
  } catch (error) {
    console.warn('Shared holding snapshot read failed:', error);
    return null;
  }
}

function writeSharedHoldingSnapshot_(username, holdings) {
  const rows = Array.isArray(holdings) ? holdings : [];
  const nextHealth = sharedHoldingHealth_(rows);
  if (!rows.length || !nextHealth.valued) return false;
  try {
    const props = PropertiesService.getScriptProperties();
    const base = sharedHoldingSnapshotBase_(username);
    const oldMeta = JSON.parse(props.getProperty(base + '_META') || 'null');
    const oldValued = Number(oldMeta && oldMeta.valued || 0);
    // A short-lived quote or sheet failure must never replace a stronger copy.
    if (oldValued > nextHealth.valued) return false;
    const raw = JSON.stringify({ holdings: rows });
    if (raw.length > 240000) return false;
    const hash = sha256Hex_(raw);
    if (oldMeta && String(oldMeta.hash || '') === hash) return true;
    const size = 7000;
    const chunks = Math.ceil(raw.length / size);
    if (!chunks || chunks > 40) return false;
    const updates = {};
    for (let i = 0; i < chunks; i++) updates[base + '_' + i] = raw.slice(i * size, (i + 1) * size);
    updates[base + '_META'] = JSON.stringify({
      chunks: chunks,
      hash: hash,
      savedAt: isoNow_(),
      valued: nextHealth.valued,
      total: nextHealth.total
    });
    props.setProperties(updates, false);
    const oldChunks = Number(oldMeta && oldMeta.chunks || 0);
    for (let i = chunks; i < oldChunks; i++) props.deleteProperty(base + '_' + i);
    return true;
  } catch (error) {
    console.warn('Shared holding snapshot write failed:', error);
    return false;
  }
}

function recoverHoldingsFromSharedSnapshot_(username, incoming, options) {
  const rows = Array.isArray(incoming) ? incoming : [];
  const saved = readSharedHoldingSnapshot_(username);
  if (!rows.length) {
    if (!saved || !saved.holdings.length) return rows;
    return saved.holdings.map(function(source) {
      const h = Object.assign({}, source);
      h.sharedValueRecovery = true;
      h.priceSource = 'Shared last verified value';
      return h;
    });
  }

  const byKey = {};
  (saved && saved.holdings || []).forEach(function(h) { byKey[sharedHoldingKey_(h)] = h; });
  const merged = rows.map(function(source) {
    const h = Object.assign({}, source);
    if (Number(h.currentPrice || 0) > 0 || Number(h.currentValue || 0) > 0) return h;
    const previous = byKey[sharedHoldingKey_(h)];
    if (!previous) return h;
    const units = Number(h.units || 0);
    const savedUnits = Number(previous.units || 0);
    const price = Number(previous.currentPrice || 0);
    const value = Number(previous.currentValue || 0);
    if (price > 0) {
      h.currentPrice = price;
      h.currentValue = units > 0 ? round_(units * price, 2) : (value > 0 ? value : null);
    } else if (value > 0 && (!units || !savedUnits || Math.abs(units - savedUnits) < 0.00000001)) {
      h.currentValue = value;
      h.currentPrice = units > 0 ? value / units : null;
    }
    if (Number(h.currentPrice || 0) > 0 || Number(h.currentValue || 0) > 0) {
      h.gainLoss = h.currentValue === null ? null : round_(Number(h.currentValue) - Number(h.investedAmount || 0), 2);
      h.returnPct = h.gainLoss === null || Number(h.investedAmount || 0) <= 0
        ? null
        : round_(Number(h.gainLoss) / Number(h.investedAmount) * 100, 4);
      h.sharedValueRecovery = true;
      h.priceSource = 'Shared last verified value';
      h.priceDate = previous.priceDate || saved.savedAt || h.priceDate || '';
    }
    return h;
  });

  const mergedHealth = sharedHoldingHealth_(merged);
  const savedHealth = saved ? saved.health : { valued: 0 };
  if (mergedHealth.valued >= Number(savedHealth.valued || 0)) writeSharedHoldingSnapshot_(username, merged);
  return merged;
}

function buildPortfolioCore_(username, options) {
  const userRecord = findUser_(username);
  if (!userRecord || !toBoolean_(userRecord.Active)) throw appError_('AUTH_REQUIRED', 'User is not active.');

  const quoteMap = readQuoteMap_();
  const txMap = {};

  const defaultOwner = String(userRecord.DisplayName || username);
  const liveHoldings = readObjects_(APP.SHEETS.HOLDINGS)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function (row) {
      const item = holdingForClient_(row, quoteMap, {}, txMap, defaultOwner);
      // The fast core intentionally skips transaction history. Do not present
      // a temporary zero as realised or total P/L while full details load.
      item.xirr = null;
      item.realizedPnl = null;
      item.totalPnlToDate = null;
      item.transactionStats = {
        transactionCount: 0,
        buyCount: 0,
        saleCount: 0,
        purchaseDates: [],
        saleDates: [],
        realizedPnl: null,
        realizedPnlComplete: false,
        partial: true
      };
      return item;
    });
  const holdings = recoverHoldingsFromSharedSnapshot_(username, liveHoldings, options || {});

  const owners = {};
  holdings.forEach(function (h) { if (h.owner) owners[h.owner] = true; });

  const holdingHealth = sharedHoldingHealth_(holdings);
  return {
    partial: true,
    user: { username: username, displayName: defaultOwner, role: String(userRecord.Role || 'USER') },
    holdings: holdings,
    backendVersion: APP.VERSION,
    masterDataAppliedAt: getSettingValue_('MasterPortfolioAppliedAt_' + username),
    owners: Object.keys(owners).sort(),
    holdingRecovery: {
      shared: holdings.filter(function(h) { return Boolean(h.sharedValueRecovery); }).length,
      total: holdingHealth.total,
      valued: holdingHealth.valued
    },
    updatedAt: isoNow_(),
    priceNote: 'Fast portfolio check complete. Full dashboard details continue loading in the background.'
  };
}

function buildDashboard_(username) {
  const userRecord = findUser_(username);
  if (!userRecord || !toBoolean_(userRecord.Active)) throw appError_('AUTH_REQUIRED', 'User is not active.');
  const quoteMap = readQuoteMap_();
  const performanceMap = readPerformanceMap_();
  const txRows = readObjects_(APP.SHEETS.TRANSACTIONS).filter(function (row) { return String(row.Username) === username; });
  const txMap = {};
  txRows.forEach(function (row) {
    addTransactionAliasesToMap_(txMap, row);
  });
  const transactionHistory = transactionClientHistory_(txRows);
  const defaultOwner = String(userRecord.DisplayName || username);
  const liveHoldings = readObjects_(APP.SHEETS.HOLDINGS)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function (row) { return holdingForClient_(row, quoteMap, performanceMap, txMap, defaultOwner); });
  const holdings = recoverHoldingsFromSharedSnapshot_(username, liveHoldings, {});
  const watchlist = readObjects_(APP.SHEETS.WATCHLIST)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function (row) { return watchForClient_(row, quoteMap); });
  const sipPlans = readObjects_(APP.SHEETS.SIP_PLANS)
    .filter(function(row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function(row) {
      return {
        id: String(row.Id || ''),
        owner: String(row.Owner || defaultOwner),
        assetType: String(row.AssetType || 'MF').toUpperCase(),
        assetName: String(row.AssetName || ''),
        code: String(row.Code || ''),
        amount: Number(row.Amount) || 0,
        frequency: String(row.Frequency || 'MONTHLY').toUpperCase(),
        sipDay: Number(row.SIPDay) || 1,
        startDate: serializeDateOnly_(row.StartDate),
        endDate: serializeDateOnly_(row.EndDate),
        stepUpPct: Number(row.StepUpPct) || 0,
        expectedReturnPct: Number(row.ExpectedReturnPct) || 0,
        status: String(row.Status || 'ACTIVE').toUpperCase(),
        notes: String(row.Notes || ''),
        createdAt: serializeValue_(row.CreatedAt),
        updatedAt: serializeValue_(row.UpdatedAt)
      };
    })
    .sort(function(a,b) {
      const s = String(a.status).localeCompare(String(b.status));
      return s !== 0 ? s : String(a.assetName).localeCompare(String(b.assetName));
    });
  const sipEvents = readObjects_(APP.SHEETS.SIP_EVENTS)
    .filter(function(row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function(row) {
      return {
        id: String(row.Id || ''),
        planId: String(row.PlanId || ''),
        dueDate: serializeDateOnly_(row.DueDate),
        amount: Number(row.Amount) || 0,
        status: String(row.Status || 'INVESTED').toUpperCase(),
        investedDate: serializeDateOnly_(row.InvestedDate),
        notes: String(row.Notes || ''),
        updatedAt: serializeValue_(row.UpdatedAt)
      };
    });
  ensureDefaultExpenseCategories_(username);
  const expenses = readObjects_(APP.SHEETS.EXPENSES)
    .filter(function(row){return String(row.Username)===username&&toBoolean_(row.Active);})
    .map(function(row){return {id:String(row.Id||''),amount:Number(row.Amount)||0,dateSpent:serializeDateOnly_(row.DateSpent),paidTo:String(row.PaidTo||''),debitedFrom:String(row.DebitedFrom||''),reason:String(row.Reason||''),category:String(row.Category||''),notes:String(row.Notes||''),sourceType:String(row.SourceType||'MANUAL'),sourceId:String(row.SourceId||''),createdAt:serializeValue_(row.CreatedAt),updatedAt:serializeValue_(row.UpdatedAt)};})
    .sort(function(a,b){return String(b.dateSpent).localeCompare(String(a.dateSpent))||String(b.updatedAt).localeCompare(String(a.updatedAt));});
  const expensePlans = readObjects_(APP.SHEETS.EXPENSE_PLANS)
    .filter(function(row){return String(row.Username)===username&&toBoolean_(row.Active);})
    .map(function(row){return {id:String(row.Id||''),amount:Number(row.Amount)||0,plannedDate:serializeDateOnly_(row.PlannedDate),paidTo:String(row.PaidTo||''),debitedFrom:String(row.DebitedFrom||''),reason:String(row.Reason||''),category:String(row.Category||''),notes:String(row.Notes||''),status:String(row.Status||'PLANNED').toUpperCase(),paidExpenseId:String(row.PaidExpenseId||''),paidAt:serializeValue_(row.PaidAt),createdAt:serializeValue_(row.CreatedAt),updatedAt:serializeValue_(row.UpdatedAt)};})
    .sort(function(a,b){return String(b.plannedDate).localeCompare(String(a.plannedDate));});
  const recurringExpenses = readObjects_(APP.SHEETS.RECURRING_EXPENSES)
    .filter(function(row){return String(row.Username)===username&&toBoolean_(row.Active);})
    .map(function(row){return {id:String(row.Id||''),name:String(row.Name||''),amount:Number(row.Amount)||0,paidTo:String(row.PaidTo||''),debitedFrom:String(row.DebitedFrom||''),reason:String(row.Reason||''),category:String(row.Category||''),notes:String(row.Notes||''),frequency:String(row.Frequency||'MONTHLY').toUpperCase(),nextDueDate:serializeDateOnly_(row.NextDueDate),endDate:serializeDateOnly_(row.EndDate),status:String(row.Status||'ACTIVE').toUpperCase(),lastPaidDate:serializeDateOnly_(row.LastPaidDate),lastExpenseId:String(row.LastExpenseId||''),createdAt:serializeValue_(row.CreatedAt),updatedAt:serializeValue_(row.UpdatedAt)};})
    .sort(function(a,b){return String(a.nextDueDate).localeCompare(String(b.nextDueDate));});
  const expenseCategories = readObjects_(APP.SHEETS.EXPENSE_CATEGORIES)
    .filter(function(row){return String(row.Username)===username&&toBoolean_(row.Active);})
    .map(function(row){return {id:String(row.Id||''),name:String(row.Name||''),color:String(row.Color||'BLUE').toUpperCase(),createdAt:serializeValue_(row.CreatedAt),updatedAt:serializeValue_(row.UpdatedAt)};})
    .sort(function(a,b){return a.name.localeCompare(b.name);});
  const lifeQuotes = readObjects_(APP.SHEETS.DAILY_QUOTES)
    .filter(function (row) { return toBoolean_(row.Active); })
    .map(function (row) {
      return {
        id: String(row.Id || ''),
        text: String(row.QuoteText || ''),
        author: String(row.Author || ''),
        createdBy: String(row.CreatedBy || ''),
        updatedAt: serializeValue_(row.UpdatedAt)
      };
    });
  const stickyNotes = readObjects_(APP.SHEETS.STICKY_NOTES)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active) && String(row.Status || 'OPEN').toUpperCase() === 'OPEN'; })
    .map(function (row) {
      return {
        id: String(row.Id || ''),
        noteType: String(row.NoteType || 'REMINDER').toUpperCase(),
        title: String(row.Title || ''),
        text: String(row.NoteText || ''),
        dueDate: serializeDateOnly_(row.DueDate),
        status: String(row.Status || 'OPEN').toUpperCase(),
        createdAt: serializeValue_(row.CreatedAt),
        updatedAt: serializeValue_(row.UpdatedAt)
      };
    });
  const diary = readObjects_(APP.SHEETS.DIARY)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function (row) {
      return {
        id: String(row.Id || ''),
        entryDate: serializeDateOnly_(row.EntryDate),
        title: String(row.Title || ''),
        text: String(row.EntryText || ''),
        createdAt: serializeValue_(row.CreatedAt),
        updatedAt: serializeValue_(row.UpdatedAt)
      };
    })
    .sort(function (a,b) {
      const d = String(b.entryDate || '').localeCompare(String(a.entryDate || ''));
      return d !== 0 ? d : String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  const monthlyDiary = readObjects_(APP.SHEETS.MONTHLY_DIARY)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function (row) {
      return {
        id: String(row.Id || ''),
        monthKey: String(row.MonthKey || ''),
        entryType: String(row.EntryType || 'DIARY').toUpperCase(),
        title: String(row.Title || ''),
        text: String(row.EntryText || ''),
        status: String(row.Status || '').toUpperCase(),
        completedAt: serializeValue_(row.CompletedAt),
        createdAt: serializeValue_(row.CreatedAt),
        updatedAt: serializeValue_(row.UpdatedAt)
      };
    })
    .sort(function (a,b) {
      const m = String(b.monthKey || '').localeCompare(String(a.monthKey || ''));
      return m !== 0 ? m : String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  const monthStatus = readObjects_(APP.SHEETS.MONTH_STATUS)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active); })
    .map(function (row) {
      return {
        id: String(row.Id || ''),
        monthKey: String(row.MonthKey || ''),
        status: String(row.Status || 'OPEN').toUpperCase(),
        completedAt: serializeValue_(row.CompletedAt),
        updatedAt: serializeValue_(row.UpdatedAt)
      };
    })
    .sort(function (a,b) { return String(b.monthKey || '').localeCompare(String(a.monthKey || '')); });
  const customColumns = readObjects_(APP.SHEETS.CUSTOM_COLUMNS)
    .filter(function (row) { return String(row.Username) === username && toBoolean_(row.Active) && ['HOLDINGS','WATCHLIST'].includes(String(row.Section || '').toUpperCase()); })
    .map(function (row) {
      return {
        id: String(row.Id || ''),
        section: String(row.Section || '').toUpperCase(),
        columnKey: String(row.ColumnKey || ''),
        label: String(row.Label || ''),
        dataType: String(row.DataType || 'TEXT').toUpperCase(),
        sortOrder: Number(row.SortOrder) || 100
      };
    })
    .sort(function (a,b) {
      const s = a.section.localeCompare(b.section);
      return s !== 0 ? s : (a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
    });
  const activeColumnKeys = {};
  customColumns.forEach(function (c) { activeColumnKeys[c.section + '|' + c.columnKey] = true; });
  const customValues = readObjects_(APP.SHEETS.CUSTOM_VALUES)
    .filter(function (row) {
      return String(row.Username) === username &&
        activeColumnKeys[String(row.Section || '').toUpperCase() + '|' + String(row.ColumnKey || '')];
    })
    .map(function (row) {
      return {
        section: String(row.Section || '').toUpperCase(),
        recordId: String(row.RecordId || ''),
        columnKey: String(row.ColumnKey || ''),
        value: serializeValue_(row.Value)
      };
    });
  const summary = summarize_(holdings, watchlist);
  const holdingHealth = sharedHoldingHealth_(holdings);
  const owners = {};
  holdings.forEach(function (h) { if (h.owner) owners[h.owner] = true; });
  sipPlans.forEach(function (p) { if (p.owner) owners[p.owner] = true; });
  txRows.forEach(function (t) { if (t.Owner) owners[String(t.Owner)] = true; });
  return {
    user: { username: username, displayName: defaultOwner, role: String(userRecord.Role || 'USER') },
    holdings: holdings,
    transactions: transactionHistory,
    watchlist: watchlist,
    sipPlans: sipPlans,
    sipEvents: sipEvents,
    expenses: expenses,
    expensePlans: expensePlans,
    recurringExpenses: recurringExpenses,
    expenseCategories: expenseCategories,
    stickyNotes: stickyNotes,
    lifeQuotes: lifeQuotes,
    customColumns: customColumns,
    customValues: customValues,
    diary: diary,
    monthlyDiary: monthlyDiary,
    monthStatus: monthStatus,
    backendVersion: APP.VERSION,
    masterDataVersion: getSettingValue_('MasterPortfolioVersion_' + username),
    masterDataAppliedAt: getSettingValue_('MasterPortfolioAppliedAt_' + username),
    summary: summary,
    owners: Object.keys(owners).sort(),
    holdingRecovery: {
      shared: holdings.filter(function(h) { return Boolean(h.sharedValueRecovery); }).length,
      total: holdingHealth.total,
      valued: holdingHealth.valued
    },
    updatedAt: isoNow_(),
    priceNote: 'Stocks/ETFs use Google Finance and may be delayed. Mutual-fund NAVs are end-of-day values.'
  };
}

function gpfProjection_(presentBalance, monthlyContribution, annualRate, months) {
  let balance = Math.max(0, Number(presentBalance || 0));
  const contribution = Math.max(0, Number(monthlyContribution || 0));
  const rate = Math.max(0, Number(annualRate || 0)) / 1200;
  const count = Math.max(0, Math.min(120, Number(months || 12)));
  for (let i = 0; i < count; i++) balance = balance * (1 + rate) + contribution;
  const contributed = contribution * count;
  return {
    months: count,
    contributions: round_(contributed, 2),
    estimatedInterest: round_(balance - Number(presentBalance || 0) - contributed, 2),
    projectedBalance: round_(balance, 2)
  };
}

function holdingForClient_(row, quoteMap, performanceMap, txMap, defaultOwner) {
  const type = String(row.Type || '').toUpperCase();
  const code = String(row.Code || '').toUpperCase();
  const exchange = String(row.Exchange || '').toUpperCase();
  const owner = cleanOwner_(row.Owner || defaultOwner);
  const sourceCode = String(row.SourceCode || '');
  const manualPrice = finiteNumberOrNull_(row.ManualPrice);
  const quote = quoteMap[quoteKey_(type, code, exchange)] || null;
  const rawQuotePrice = quote ? finiteNumberOrNull_(quote.Price) : null;
  const usableQuotePrice = type === 'MF' && rawQuotePrice !== null && rawQuotePrice <= 0 ? null : rawQuotePrice;
  const currentPrice = manualPrice !== null ? manualPrice : usableQuotePrice;
  const units = finiteNumberOrZero_(row.Units);
  const investedAmount = finiteNumberOrZero_(row.InvestedAmount);
  const currentValue = currentPrice === null ? null : round_(units * currentPrice, 2);
  const gainLoss = type === 'GPF' || currentValue === null ? null : round_(currentValue - investedAmount, 2);
  const returnPct = gainLoss === null || investedAmount <= 0 ? null : round_(gainLoss / investedAmount * 100, 4);
  const monthlyContribution = type === 'GPF' ? finiteNumberOrZero_(row.MonthlyContribution) : 0;
  const annualInterestRate = type === 'GPF' ? finiteNumberOrZero_(row.AnnualInterestRate) : null;
  const gpfProjection = type === 'GPF'
    ? gpfProjection_(currentValue || 0, monthlyContribution, annualInterestRate, 12)
    : null;
  const perf = performanceMap[quoteKey_(type, code, exchange)] || {};
  let xirr = null;
  if (type === 'MF' && sourceCode && currentValue !== null) {
    xirr = calculateHoldingXirr_(txMap[transactionGroupKey_(owner, sourceCode)] || [], currentValue);
  }
  const relatedTransactions = lookupHoldingTransactions_(txMap, owner, type, sourceCode || code);
  const transactionStats = transactionStats_(relatedTransactions);
  const realizedPnl = transactionStats.realizedPnl;
  const totalPnlToDate = gainLoss === null || realizedPnl === null
    ? null
    : round_(gainLoss + realizedPnl, 2);
  return {
    id: String(row.Id), owner: owner, type: type, assetName: String(row.AssetName || ''), code: code, sourceCode: sourceCode, exchange: exchange,
    units: units, investedAmount: investedAmount, manualPrice: manualPrice, buyDate: serializeDateOnly_(row.BuyDate), notes: String(row.Notes || ''),
    transactionStats: transactionStats,
    realizedPnl: realizedPnl,
    totalPnlToDate: totalPnlToDate,
    currentPrice: currentPrice, currentValue: currentValue, gainLoss: gainLoss, returnPct: returnPct, xirr: xirr,
    monthlyContribution: monthlyContribution,
    annualInterestRate: annualInterestRate,
    balanceAsOfDate: type === 'GPF' ? serializeDateOnly_(row.BalanceAsOfDate) : '',
    gpfProjection: gpfProjection,
    performance: {
      d1: finiteNumberOrNull_(perf.OneD), w1: finiteNumberOrNull_(perf.OneW), m1: finiteNumberOrNull_(perf.OneM),
      m6: finiteNumberOrNull_(perf.SixM), y1: finiteNumberOrNull_(perf.OneY), y3: finiteNumberOrNull_(perf.ThreeY),
      y5: finiteNumberOrNull_(perf.FiveY), y10: finiteNumberOrNull_(perf.TenY)
    },
    manualOverride: manualPrice !== null,
    priceSource: manualPrice !== null ? 'Manual override' : quote ? String(quote.Source || '') : 'Pending',
    priceDate: quote ? serializeValue_(quote.PriceDate) : ''
  };
}

function watchForClient_(row, quoteMap) {
  const type = String(row.Type || '').toUpperCase();
  const code = String(row.Code || '').toUpperCase();
  const exchange = String(row.Exchange || '').toUpperCase();
  const manualPrice = finiteNumberOrNull_(row.ManualPrice);
  const quote = quoteMap[quoteKey_(type, code, exchange)] || null;
  const rawQuotePrice = quote ? finiteNumberOrNull_(quote.Price) : null;
  const usableQuotePrice = type === 'MF' && rawQuotePrice !== null && rawQuotePrice <= 0 ? null : rawQuotePrice;
  const currentPrice = manualPrice !== null ? manualPrice : usableQuotePrice;
  const targetPrice = finiteNumberOrNull_(row.TargetPrice);
  const distancePct = currentPrice === null || targetPrice === null || targetPrice <= 0 ? null : round_((currentPrice - targetPrice) / targetPrice * 100, 4);
  return {
    id: String(row.Id), type: type, assetName: String(row.AssetName || ''), code: code, exchange: exchange,
    targetPrice: targetPrice, manualPrice: manualPrice, currentPrice: currentPrice, distancePct: distancePct,
    priority: String(row.Priority || 'MEDIUM'), notes: String(row.Notes || ''),
    sourceDetails: {
      companyName: String(row.SourceCompany || ''), snapshotPrice: finiteNumberOrNull_(row.SnapshotPrice),
      snapshotChange: finiteNumberOrNull_(row.SnapshotChange), snapshotChangePct: finiteNumberOrNull_(row.SnapshotChangePct),
      dayHigh: finiteNumberOrNull_(row.DayHigh), dayLow: finiteNumberOrNull_(row.DayLow), volume: finiteNumberOrNull_(row.Volume),
      high52: finiteNumberOrNull_(row.High52), low52: finiteNumberOrNull_(row.Low52), marketCap: String(row.MarketCap || ''),
      salesGrowth: String(row.SalesGrowth || ''), profitGrowth: String(row.ProfitGrowth || ''), valuation: String(row.Valuation || ''),
      moatRemark: String(row.MoatRemark || ''), finalRemark: String(row.FinalRemark || ''),
      perf1M: finiteNumberOrNull_(row.Perf1M), perf1Y: finiteNumberOrNull_(row.Perf1Y), perf3Y: finiteNumberOrNull_(row.Perf3Y),
      perf5Y: finiteNumberOrNull_(row.Perf5Y), perf10Y: finiteNumberOrNull_(row.Perf10Y), sourceSheet: String(row.SourceSheet || '')
    },
    manualOverride: manualPrice !== null,
    priceSource: manualPrice !== null ? 'Manual override' : quote ? String(quote.Source || '') : 'Pending',
    priceDate: quote ? serializeValue_(quote.PriceDate) : ''
  };
}

function summarize_(holdings, watchlist) {
  let investedValue = 0, pricedInvested = 0, currentValue = 0, pricedCount = 0;
  const allocation = {};
  holdings.forEach(function (item) {
    investedValue += item.investedAmount || 0;
    if (item.currentValue !== null) {
      currentValue += item.currentValue;
      pricedInvested += item.investedAmount || 0;
      pricedCount++;
    }
    const allocationValue = item.currentValue !== null ? item.currentValue : item.investedAmount;
    allocation[item.type] = (allocation[item.type] || 0) + allocationValue;
  });
  const gainLoss = currentValue - pricedInvested;
  const returnPct = pricedInvested > 0 ? gainLoss / pricedInvested * 100 : 0;
  const allocationTotal = Object.keys(allocation).reduce(function (sum, key) { return sum + allocation[key]; }, 0);
  const allocationRows = Object.keys(allocation).map(function (type) {
    return { type: type, value: round_(allocation[type], 2), percent: allocationTotal ? round_(allocation[type] / allocationTotal * 100, 2) : 0 };
  }).sort(function (a,b) { return b.value - a.value; });
  const nearTargetCount = watchlist.filter(function (item) { return item.distancePct !== null && item.distancePct <= 5; }).length;
  return {
    investedValue: round_(investedValue, 2), currentValue: round_(currentValue, 2), gainLoss: round_(gainLoss, 2), returnPct: round_(returnPct, 4),
    assetCount: holdings.length, pricedCount: pricedCount, watchCount: watchlist.length, nearTargetCount: nearTargetCount, allocation: allocationRows
  };
}


function validMfQuotePrice_(value) {
  const n = finiteNumberOrNull_(value);
  return n !== null && n > 0 ? n : null;
}

function mfQuoteNeedsRepair_(target, quoteMap) {
  const code = String(target.code || '').trim();
  const quote = quoteMap[quoteKey_('MF', code, '')] || null;
  if (!quote) return true;
  if (validMfQuotePrice_(quote.Price) === null) return true;
  if (!quote.PriceDate) return true;
  return false;
}

function setMfQuoteDirect_(code, assetName, nav, navDate, source) {
  code = String(code || '').trim();
  nav = Number(nav);
  if (!code || !isFinite(nav) || nav <= 0) return false;

  ensureQuote_('MF', code, '', assetName || '');
  const key = quoteKey_('MF', code, '');
  const record = findRecordByField_(APP.SHEETS.QUOTES, 'Key', key);
  if (!record) return false;

  sheet_(APP.SHEETS.QUOTES)
    .getRange(record.row, headerIndex_(APP.SHEETS.QUOTES, 'AssetName'), 1, 5)
    .setValues([[
      assetName || record.AssetName || '',
      nav,
      navDate || '',
      source || 'AMFI',
      new Date()
    ]]);

  return true;
}

function latestMfapiNav_(code) {
  code = String(code || '').trim();
  if (!/^\d+$/.test(code)) return null;

  const response = UrlFetchApp.fetch(
    'https://api.mfapi.in/mf/' + encodeURIComponent(code),
    { muteHttpExceptions: true, followRedirects: true }
  );
  if (!response || response.getResponseCode() !== 200) return null;

  const payload = JSON.parse(response.getContentText('UTF-8'));
  const data = Array.isArray(payload.data) ? payload.data : [];
  let latest = null;

  data.forEach(function (x) {
    const nav = Number(x.nav);
    const date = parseMfApiDate_(x.date);
    if (!date || !isFinite(nav) || nav <= 0) return;
    if (!latest || date.getTime() > latest.date.getTime()) {
      latest = { nav: nav, date: date };
    }
  });

  if (!latest) return null;

  const meta = payload.meta || {};
  return {
    code: code,
    name: String(meta.scheme_name || meta.schemeName || ''),
    nav: latest.nav,
    date: Utilities.formatDate(
      latest.date,
      Session.getScriptTimeZone() || 'Asia/Kolkata',
      'dd-MMM-yyyy'
    )
  };
}

function activeMfQuoteHealth_() {
  const targets = activeMutualFundTargets_();
  const quoteMap = readQuoteMap_();
  const bad = [];

  targets.forEach(function (target) {
    if (mfQuoteNeedsRepair_(target, quoteMap)) {
      bad.push({
        code: String(target.code || ''),
        assetName: String(target.assetName || '')
      });
    }
  });

  return {
    tracked: targets.length,
    missing: bad.length,
    bad: bad
  };
}

function repairMissingMfQuotesFromMfapi_(targets) {
  const quoteMap = readQuoteMap_();
  const seen = {};
  const needed = [];

  (targets || []).forEach(function (target) {
    const code = String(target.code || '').trim();
    if (!/^\d+$/.test(code) || seen[code]) return;
    if (!mfQuoteNeedsRepair_(target, quoteMap)) return;
    seen[code] = true;
    needed.push(target);
  });

  let repaired = 0;
  const failed = [];

  needed.forEach(function (target) {
    const code = String(target.code || '').trim();
    try {
      const item = latestMfapiNav_(code);
      if (!item || !item.nav) {
        failed.push(code);
        return;
      }

      if (setMfQuoteDirect_(
        code,
        item.name || target.assetName,
        item.nav,
        item.date,
        'MFAPI fallback'
      )) {
        repaired++;
      } else {
        failed.push(code);
      }
    } catch (error) {
      failed.push(code);
      console.warn('MFAPI NAV fallback failed for ' + code + ': ' + error);
    }
  });

  return {
    attempted: needed.length,
    repaired: repaired,
    failed: failed
  };
}

function autoRepairMfNavIfNeeded_() {
  const before = activeMfQuoteHealth_();
  if (!before.missing) return { ran: false, before: before };

  const cache = CacheService.getScriptCache();
  const cacheKey = 'mf_auto_repair_v3153';
  if (cache.get(cacheKey)) {
    return { ran: false, throttled: true, before: before };
  }
  cache.put(cacheKey, '1', 300);

  try {
    const nav = refreshMutualFundNav_(true);
    SpreadsheetApp.flush();

    const after = activeMfQuoteHealth_();
    return {
      ran: true,
      before: before,
      nav: nav,
      after: after
    };
  } catch (error) {
    console.warn('Automatic MF NAV repair failed: ' + error);
    return {
      ran: true,
      before: before,
      error: String(error)
    };
  }
}

function activeMutualFundTargets_() {
  const out = [];

  readObjects_(APP.SHEETS.HOLDINGS)
    .filter(function (r) { return toBoolean_(r.Active) && String(r.Type || '').toUpperCase() === 'MF'; })
    .forEach(function (r) {
      out.push({
        sheetName: APP.SHEETS.HOLDINGS,
        row: r.row,
        code: String(r.Code || '').trim(),
        assetName: String(r.AssetName || '').trim(),
        sourceCode: String(r.SourceCode || '').trim().toUpperCase()
      });
    });

  readObjects_(APP.SHEETS.WATCHLIST)
    .filter(function (r) { return toBoolean_(r.Active) && String(r.Type || '').toUpperCase() === 'MF'; })
    .forEach(function (r) {
      out.push({
        sheetName: APP.SHEETS.WATCHLIST,
        row: r.row,
        code: String(r.Code || '').trim(),
        assetName: String(r.AssetName || '').trim(),
        sourceCode: ''
      });
    });

  return out;
}

function looksLikeIsin_(value) {
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i.test(String(value || '').trim());
}

function amfiUniverseIndexes_(universe) {
  const byCode = {};
  const byIsin = {};
  const byName = {};

  (universe || []).forEach(function (item) {
    if (item.code) byCode[String(item.code)] = item;
    [item.isin1, item.isin2].forEach(function (isin) {
      const key = String(isin || '').trim().toUpperCase();
      if (key) byIsin[key] = item;
    });

    const nameKey = normalizeSchemeName_(item.name || '');
    if (nameKey && !byName[nameKey]) byName[nameKey] = item;
  });

  return { byCode: byCode, byIsin: byIsin, byName: byName };
}

function resolveActiveMfTarget_(target, universe, indexes) {
  const code = String(target.code || '').trim();
  const sourceCode = String(target.sourceCode || '').trim().toUpperCase();

  if (code && indexes.byCode[code]) return indexes.byCode[code];
  if (sourceCode && indexes.byCode[sourceCode]) return indexes.byCode[sourceCode];

  if (looksLikeIsin_(code) && indexes.byIsin[code.toUpperCase()]) return indexes.byIsin[code.toUpperCase()];
  if (looksLikeIsin_(sourceCode) && indexes.byIsin[sourceCode]) return indexes.byIsin[sourceCode];

  const exactName = indexes.byName[normalizeSchemeName_(target.assetName || '')];
  if (exactName) return exactName;

  // Name-based fallback is useful when an old AMFI code has been phased out.
  return resolveAmfiScheme_('', String(target.assetName || ''), universe);
}

function updateActiveMfCode_(target, mappedCode) {
  const newCode = String(mappedCode || '').trim();
  const oldCode = String(target.code || '').trim();
  if (!newCode || newCode === oldCode) return false;

  const sh = sheet_(target.sheetName);
  sh.getRange(target.row, headerIndex_(target.sheetName, 'Code')).setValue(newCode);
  sh.getRange(target.row, headerIndex_(target.sheetName, 'UpdatedAt')).setValue(new Date());
  return true;
}

function refreshMutualFundNav_(force) {
  const targets = activeMutualFundTargets_();
  if (!targets.length) {
    return { tracked: 0, updated: 0, remapped: 0, missing: [], message: 'No active mutual funds in Holdings or Watchlist.' };
  }

  if (!force) {
    const last = getSettingValue_('LastMfNavRefresh');
    const t = last ? new Date(last).getTime() : 0;
    if (t && Date.now() - t < 5 * 60 * 60 * 1000) {
      return { tracked: targets.length, updated: 0, remapped: 0, missing: [], message: 'NAV data is recent.' };
    }
  }

  const universe = fetchAmfiUniverse_(true);
  if (!universe.length) throw appError_('PRICE_SERVICE_ERROR', 'AMFI NAV service did not return scheme data.');

  const indexes = amfiUniverseIndexes_(universe);
  const resolvedByCode = {};
  const missing = [];
  let remapped = 0;

  targets.forEach(function (target) {
    const mapped = resolveActiveMfTarget_(target, universe, indexes);
    if (!mapped || !mapped.code || mapped.nav === null || typeof mapped.nav === 'undefined') {
      missing.push(target.assetName || target.code || 'Unknown MF');
      return;
    }

    if (updateActiveMfCode_(target, mapped.code)) remapped++;
    resolvedByCode[String(mapped.code)] = mapped;
  });

  const resolvedCodes = Object.keys(resolvedByCode);
  resolvedCodes.forEach(function (code) {
    const item = resolvedByCode[code];
    setMfQuoteFromUniverse_(item);
    ensurePerformanceRow_('MF', code, '');
  });

  const now = new Date();
  setSetting_('LastMfNavRefresh', now.toISOString());
  setSetting_('LastMfNavRefreshReport', JSON.stringify({
    at: now.toISOString(),
    tracked: targets.length,
    updated: resolvedCodes.length,
    remapped: remapped,
    missing: missing.slice(0, 50)
  }));

  SpreadsheetApp.flush();

  // Second path: if a fund is still zero/missing after AMFI, pull the same
  // AMFI scheme code from MFAPI and write the latest NAV directly.
  const fallback = repairMissingMfQuotesFromMfapi_(targets);
  SpreadsheetApp.flush();

  const finalHealth = activeMfQuoteHealth_();
  return {
    tracked: targets.length,
    updated: resolvedCodes.length,
    remapped: remapped,
    missing: missing,
    fallbackRepaired: fallback.repaired,
    fallbackFailed: fallback.failed,
    remainingMissing: finalHealth.missing,
    message: resolvedCodes.length + '/' + targets.length + ' active MF rows resolved from AMFI' +
      (fallback.repaired ? ' · ' + fallback.repaired + ' repaired by MFAPI fallback' : '') + '.'
  };
}

function ensureQuote_(type, code, exchange, assetName) {
  type = String(type || '').toUpperCase();
  code = String(code || '').toUpperCase();
  exchange = String(exchange || '').toUpperCase();
  if (!['STOCK','ETF','MF'].includes(type)) return;
  const key = quoteKey_(type, code, exchange);
  const existing = findRecordByField_(APP.SHEETS.QUOTES, 'Key', key);
  const sh = sheet_(APP.SHEETS.QUOTES);
  if (existing) {
    sh.getRange(existing.row, headerIndex_(APP.SHEETS.QUOTES, 'AssetName')).setValue(assetName);
    return;
  }
  sh.appendRow([key, type, code, exchange, assetName, '', '', type === 'MF' ? 'AMFI' : 'GOOGLEFINANCE', '']);
  const row = sh.getLastRow();
  if (type === 'STOCK' || type === 'ETF') {
    const formula = '=IFERROR(GOOGLEFINANCE(D' + row + '&":"&C' + row + ',"price"),"")';
    sh.getRange(row, headerIndex_(APP.SHEETS.QUOTES, 'Price')).setFormula(formula);
    sh.getRange(row, headerIndex_(APP.SHEETS.QUOTES, 'PriceDate')).setFormula('=IF(F' + row + '="","",NOW())');
    sh.getRange(row, headerIndex_(APP.SHEETS.QUOTES, 'UpdatedAt')).setFormula('=IF(F' + row + '="","",NOW())');
  }
}


function ensureQuotesBatch_(items) {
  const quoteSheet = sheet_(APP.SHEETS.QUOTES);
  const existingRows = readObjects_(APP.SHEETS.QUOTES);
  const existingKeys = {};
  existingRows.forEach(function (row) { existingKeys[String(row.Key)] = true; });

  const missing = [];
  const queued = {};
  items.forEach(function (item) {
    const type = String(item.type || '').toUpperCase();
    if (!['STOCK','ETF','MF'].includes(type)) return;
    const code = String(item.code || '').toUpperCase();
    const exchange = String(item.exchange || '').toUpperCase();
    const key = quoteKey_(type, code, exchange);
    if (existingKeys[key] || queued[key]) return;
    queued[key] = true;
    missing.push({
      key: key,
      type: type,
      code: code,
      exchange: exchange,
      assetName: item.assetName
    });
  });

  if (!missing.length) return;

  const startRow = quoteSheet.getLastRow() + 1;
  const values = missing.map(function (item) {
    return [
      item.key, item.type, item.code, item.exchange, item.assetName,
      '', '', item.type === 'MF' ? 'AMFI' : 'GOOGLEFINANCE', ''
    ];
  });
  quoteSheet.getRange(startRow, 1, values.length, values[0].length).setValues(values);

  const priceFormulas = [];
  const dateFormulas = [];
  const updatedFormulas = [];
  missing.forEach(function (item) {
    if (item.type === 'STOCK' || item.type === 'ETF') {
      priceFormulas.push(['=IFERROR(GOOGLEFINANCE(RC[-2]&":"&RC[-3],"price"),"")']);
      dateFormulas.push(['=IF(RC[-1]="","",NOW())']);
      updatedFormulas.push(['=IF(RC[-3]="","",NOW())']);
    } else {
      priceFormulas.push(['']);
      dateFormulas.push(['']);
      updatedFormulas.push(['']);
    }
  });

  quoteSheet.getRange(startRow, headerIndex_(APP.SHEETS.QUOTES, 'Price'), missing.length, 1).setFormulasR1C1(priceFormulas);
  quoteSheet.getRange(startRow, headerIndex_(APP.SHEETS.QUOTES, 'PriceDate'), missing.length, 1).setFormulasR1C1(dateFormulas);
  quoteSheet.getRange(startRow, headerIndex_(APP.SHEETS.QUOTES, 'UpdatedAt'), missing.length, 1).setFormulasR1C1(updatedFormulas);
}

function readQuoteMap_() {
  const map = {};
  readObjects_(APP.SHEETS.QUOTES).forEach(function (row) { map[String(row.Key)] = row; });
  return map;
}

function validateHolding_(input) {
  const type = String(input.type || '').toUpperCase();
  const assetName = cleanText_(input.assetName, 160);
  const isGpf = type === 'GPF';
  const code = isGpf ? 'GPF' : cleanCode_(input.code);
  const exchange = ['MF','OTHER','GPF'].includes(type) ? '' : cleanCode_(input.exchange || 'NSE');
  const units = isGpf ? 1 : finiteNumberOrNull_(input.units);
  const presentBalance = finiteNumberOrNull_(input.presentBalance);
  const investedAmount = isGpf && presentBalance !== null ? presentBalance : finiteNumberOrNull_(input.investedAmount);
  const rawManualPrice = isGpf && presentBalance !== null ? presentBalance : input.manualPrice;
  const manualPrice = rawManualPrice === null || rawManualPrice === '' || typeof rawManualPrice === 'undefined' ? null : finiteNumberOrNull_(rawManualPrice);
  const monthlyContribution = isGpf ? finiteNumberOrNull_(input.monthlyContribution) : null;
  const annualInterestRate = isGpf ? finiteNumberOrNull_(input.annualInterestRate) : null;
  const balanceAsOfDate = isGpf ? validateDateOnly_(input.balanceAsOfDate) : '';
  const owner = cleanOwner_(input.owner || input.investorName || 'Portfolio');
  const sourceCode = cleanText_(input.sourceCode || '', 80).toUpperCase();
  if (!['STOCK','ETF','MF','OTHER','GPF'].includes(type)) throw appError_('VALIDATION_ERROR', 'Invalid asset type.');
  if (!assetName || !code) throw appError_('VALIDATION_ERROR', 'Asset name and code are required.');
  if (units === null || units <= 0) throw appError_('VALIDATION_ERROR', 'Units must be greater than zero.');
  if (investedAmount === null || investedAmount < 0) throw appError_('VALIDATION_ERROR', 'Invested amount must be zero or more.');
  if (manualPrice !== null && manualPrice < 0) throw appError_('VALIDATION_ERROR', 'Manual price cannot be negative.');
  if (isGpf && (presentBalance === null || presentBalance < 0)) throw appError_('VALIDATION_ERROR', 'GPF present balance must be zero or more.');
  if (isGpf && (monthlyContribution === null || monthlyContribution < 0)) throw appError_('VALIDATION_ERROR', 'GPF monthly contribution must be zero or more.');
  if (isGpf && (annualInterestRate === null || annualInterestRate < 0 || annualInterestRate > 100)) throw appError_('VALIDATION_ERROR', 'Enter a valid GPF annual interest rate.');
  return { id: cleanText_(input.id, 100), owner: owner, sourceCode: sourceCode, type: type, assetName: assetName, code: code, exchange: exchange, units: units,
    investedAmount: investedAmount, manualPrice: manualPrice, buyDate: validateDateOnly_(input.buyDate), notes: cleanText_(input.notes, 500),
    monthlyContribution: monthlyContribution, annualInterestRate: annualInterestRate, balanceAsOfDate: balanceAsOfDate };
}

function validateWatchItem_(input) {
  const type = String(input.type || '').toUpperCase();
  const assetName = cleanText_(input.assetName, 160);
  const code = cleanCode_(input.code);
  const exchange = ['MF','OTHER'].includes(type) ? '' : cleanCode_(input.exchange || 'NSE');
  const targetPrice = input.targetPrice === null || input.targetPrice === '' || typeof input.targetPrice === 'undefined' ? null : finiteNumberOrNull_(input.targetPrice);
  const manualPrice = input.manualPrice === null || input.manualPrice === '' || typeof input.manualPrice === 'undefined' ? null : finiteNumberOrNull_(input.manualPrice);
  const priority = String(input.priority || 'MEDIUM').toUpperCase();
  if (!['STOCK','ETF','MF','OTHER'].includes(type)) throw appError_('VALIDATION_ERROR', 'Invalid asset type.');
  if (!assetName || !code) throw appError_('VALIDATION_ERROR', 'Asset name and code are required.');
  if (targetPrice !== null && targetPrice < 0) throw appError_('VALIDATION_ERROR', 'Target price cannot be negative.');
  if (manualPrice !== null && manualPrice < 0) throw appError_('VALIDATION_ERROR', 'Manual price cannot be negative.');
  if (!['HIGH','MEDIUM','LOW'].includes(priority)) throw appError_('VALIDATION_ERROR', 'Invalid priority.');
  return { id: cleanText_(input.id, 100), type: type, assetName: assetName, code: code, exchange: exchange,
    targetPrice: targetPrice, manualPrice: manualPrice, priority: priority, notes: cleanText_(input.notes, 500) };
}


/** Import MF transaction statements without retaining PAN or folio numbers. */
function bulkImportMfTransactions_(request) {
  const session = requireAuth_(request.token);
  const raw = Array.isArray(request.transactions) ? request.transactions : [];
  if (!raw.length) throw appError_('VALIDATION_ERROR', 'No mutual-fund transaction rows were received.');
  if (raw.length > 5000) throw appError_('VALIDATION_ERROR', 'A maximum of 5,000 transaction rows can be imported at one time.');

  const parsed = [];
  const errors = [];
  raw.forEach(function (item, index) {
    try { parsed.push(validateMfTransaction_(item)); }
    catch (error) { errors.push('Row ' + (index + 2) + ': ' + normalizeError_(error).message); }
  });
  if (errors.length) throw appError_('VALIDATION_ERROR', errors.slice(0, 8).join(' | ') + (errors.length > 8 ? ' | Plus ' + (errors.length - 8) + ' more.' : ''));

  const occurrence = {};
  parsed.forEach(function (tx) {
    const base = transactionFingerprintBase_(tx);
    occurrence[base] = (occurrence[base] || 0) + 1;
    tx.fingerprint = sha256Hex_(base + '|#' + occurrence[base]);
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let inserted = 0, skipped = 0;
  try {
    const sh = sheet_(APP.SHEETS.TRANSACTIONS);
    const existing = {};
    readObjects_(APP.SHEETS.TRANSACTIONS).filter(function (r) { return String(r.Username) === session.username; }).forEach(function (r) { existing[String(r.Fingerprint)] = true; });
    const now = new Date();
    const rows = [];
    parsed.forEach(function (tx) {
      if (existing[tx.fingerprint]) { skipped++; return; }
      rows.push([newId_('T'), session.username, tx.owner, 'MF', tx.amc, tx.productCode, tx.schemeName, tx.tradeDate,
        tx.transactionType, tx.amount, tx.units === null ? '' : tx.units, tx.price === null ? '' : tx.price,
        tx.broker, tx.source || 'MF Statement', tx.fingerprint, now]);
      existing[tx.fingerprint] = true;
      inserted++;
    });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    rebuildMfHoldingsFromTransactions_(session.username);
    ensureAllPerformanceRows_();
    refreshMutualFundNav_(true);
    audit_(session.username, 'IMPORT_MF_TRANSACTIONS', inserted + ' new rows, ' + skipped + ' duplicate rows skipped');
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return { ok: true, imported: inserted, skipped: skipped, data: buildDashboard_(session.username) };
}


function bulkImportStockTransactions_(request) {
  const session = requireAuth_(request.token);
  const raw = Array.isArray(request.transactions) ? request.transactions : [];
  if (!raw.length) throw appError_('VALIDATION_ERROR', 'No stock/ETF trade rows were received.');
  if (raw.length > 10000) throw appError_('VALIDATION_ERROR', 'A maximum of 10,000 stock/ETF trades can be imported at one time.');

  const parsed = [];
  const errors = [];
  raw.forEach(function(item, index) {
    try {
      const owner = cleanOwner_(item.owner || '');
      const assetType = String(item.assetType || item.type || 'STOCK').toUpperCase() === 'ETF' ? 'ETF' : 'STOCK';
      const code = cleanText_(item.code || item.productCode || item.symbol || '', 80).toUpperCase();
      const assetName = cleanText_(item.assetName || item.schemeName || code, 220);
      const tradeDate = validateDateOnly_(item.tradeDate || item.date || '');
      const side = String(item.side || item.transactionType || '').toUpperCase();
      const units = finiteNumberOrNull_(item.units);
      const price = finiteNumberOrNull_(item.price);
      let amount = finiteNumberOrNull_(item.amount);
      const broker = cleanText_(item.broker || 'Tradebook', 180);

      if (!owner) throw appError_('VALIDATION_ERROR', 'Investor name is required.');
      if (!code) throw appError_('VALIDATION_ERROR', 'Stock/ETF symbol is required.');
      if (!tradeDate) throw appError_('VALIDATION_ERROR', 'Trade date is required.');
      if (!['BUY','SELL'].includes(side)) throw appError_('VALIDATION_ERROR', 'Trade type must be BUY or SELL.');
      if (units === null || Math.abs(units) <= 0) throw appError_('VALIDATION_ERROR', 'Quantity is required.');
      if (price === null || Math.abs(price) < 0) throw appError_('VALIDATION_ERROR', 'Price is required.');
      if (amount === null) amount = Math.abs(units * price);

      parsed.push({
        owner: owner, assetType: assetType, productCode: code, schemeName: assetName,
        tradeDate: tradeDate, transactionType: side, amount: Math.abs(amount),
        units: Math.abs(units), price: Math.abs(price), broker: broker
      });
    } catch (error) {
      errors.push('Row ' + (index + 2) + ': ' + normalizeError_(error).message);
    }
  });

  if (errors.length) {
    throw appError_('VALIDATION_ERROR', errors.slice(0, 8).join(' | ') + (errors.length > 8 ? ' | Plus ' + (errors.length - 8) + ' more.' : ''));
  }

  const occurrence = {};
  parsed.forEach(function(tx) {
    const base = [
      normalizeOwner_(tx.owner), tx.assetType, tx.productCode, tx.tradeDate, tx.transactionType,
      round_(tx.amount || 0, 4), round_(tx.units || 0, 6), round_(tx.price || 0, 6)
    ].join('|');
    occurrence[base] = (occurrence[base] || 0) + 1;
    tx.fingerprint = sha256Hex_(base + '|#' + occurrence[base]);
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let inserted = 0, skipped = 0;
  try {
    const sh = sheet_(APP.SHEETS.TRANSACTIONS);
    const existing = {};
    readObjects_(APP.SHEETS.TRANSACTIONS)
      .filter(function(r) { return String(r.Username) === session.username; })
      .forEach(function(r) { existing[String(r.Fingerprint)] = true; });

    const now = new Date();
    const rows = [];
    parsed.forEach(function(tx) {
      if (existing[tx.fingerprint]) { skipped++; return; }
      rows.push([
        newId_('T'), session.username, tx.owner, tx.assetType, '', tx.productCode, tx.schemeName,
        tx.tradeDate, tx.transactionType, tx.amount, tx.units, tx.price, tx.broker,
        'Stock Tradebook', tx.fingerprint, now
      ]);
      existing[tx.fingerprint] = true;
      inserted++;
    });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, APP.HEADERS.Transactions.length).setValues(rows);
    audit_(session.username, 'IMPORT_STOCK_TRANSACTIONS', inserted + ' stock/ETF trades imported; ' + skipped + ' skipped');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  return { ok: true, imported: inserted, skipped: skipped, data: buildDashboard_(session.username) };
}

function validateMfTransaction_(input) {
  const owner = cleanOwner_(input.owner || input.investorName || '');
  const amc = cleanText_(input.amc || input.mfName || '', 160);
  const productCode = cleanText_(input.productCode || '', 80).toUpperCase();
  const schemeName = cleanText_(input.schemeName || input.assetName || '', 220);
  const tradeDate = validateDateOnly_(input.tradeDate || input.date || '');
  const transactionType = cleanText_(input.transactionType || '', 120);
  const amount = finiteNumberOrNull_(input.amount);
  const units = finiteNumberOrNull_(input.units);
  const price = finiteNumberOrNull_(input.price);
  const broker = cleanText_(input.broker || '', 180);
  if (!owner) throw appError_('VALIDATION_ERROR', 'Investor name is required.');
  if (!productCode || !schemeName) throw appError_('VALIDATION_ERROR', 'Product code and scheme name are required.');
  if (!tradeDate) throw appError_('VALIDATION_ERROR', 'Trade date is required.');
  if (!transactionType) throw appError_('VALIDATION_ERROR', 'Transaction type is required.');
  if (amount === null && units === null) throw appError_('VALIDATION_ERROR', 'Amount or units must be present.');
  return { owner: owner, amc: amc, productCode: productCode, schemeName: schemeName, tradeDate: tradeDate,
    transactionType: transactionType, amount: amount === null ? 0 : amount, units: units, price: price, broker: broker, source: 'MF Statement' };
}

function transactionFingerprintBase_(tx) {
  return [normalizeOwner_(tx.owner), tx.productCode, tx.tradeDate, normalizeTextKey_(tx.transactionType),
    round_(tx.amount || 0, 4), tx.units === null ? '' : round_(tx.units, 6), tx.price === null ? '' : round_(tx.price, 6), normalizeTextKey_(tx.schemeName)].join('|');
}


function transactionCodeAliases_(assetType, value) {
  const type = String(assetType || '').toUpperCase();
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return [];
  const out = [raw];

  if (type === 'STOCK' || type === 'ETF') {
    let x = raw
      .replace(/^(NSE|BSE|BOM)\s*:\s*/i, '')
      .replace(/\.(NS|BO)$/i, '')
      .replace(/[-_.](EQ|BE|BZ|BL|SM|ST)$/i, '')
      .trim();
    if (x && out.indexOf(x) < 0) out.push(x);

    const colon = raw.indexOf(':');
    if (colon > -1) {
      const tail = raw.slice(colon + 1).trim()
        .replace(/\.(NS|BO)$/i, '')
        .replace(/[-_.](EQ|BE|BZ|BL|SM|ST)$/i, '');
      if (tail && out.indexOf(tail) < 0) out.push(tail);
    }
  }
  return out;
}

function addTransactionAliasesToMap_(map, row) {
  const owner = row.Owner;
  const type = String(row.AssetType || '').toUpperCase();
  transactionCodeAliases_(type, row.ProductCode).forEach(function(code) {
    const key = transactionGroupKey_(owner, code);
    if (!map[key]) map[key] = [];
    map[key].push(row);
  });
}

function lookupHoldingTransactions_(map, owner, type, code) {
  const seen = {};
  const out = [];
  transactionCodeAliases_(type, code).forEach(function(alias) {
    const rows = map[transactionGroupKey_(owner, alias)] || [];
    rows.forEach(function(row) {
      const rowType = String(row.AssetType || '').toUpperCase();
      if (type && rowType && rowType !== String(type).toUpperCase()) return;
      const id = String(row.Id || '') || [
        serializeDateOnly_(row.TradeDate),
        String(row.ProductCode || ''),
        String(row.TransactionType || ''),
        String(row.Units || '')
      ].join('|');
      if (seen[id]) return;
      seen[id] = true;
      out.push(row);
    });
  });
  return out;
}

function transactionGroupKey_(owner, productCode) { return normalizeOwner_(owner) + '|' + String(productCode || '').toUpperCase(); }

function rebuildMfHoldingsFromTransactions_(username) {
  const all = readObjects_(APP.SHEETS.TRANSACTIONS).filter(function (row) { return String(row.Username) === username && String(row.AssetType || '').toUpperCase() === 'MF'; });
  const groups = {};
  all.forEach(function (row) {
    const key = transactionGroupKey_(row.Owner, row.ProductCode);
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });
  const amfiUniverse = fetchAmfiUniverse_();
  const sh = sheet_(APP.SHEETS.HOLDINGS);
  const existing = readObjects_(APP.SHEETS.HOLDINGS);
  const statementExisting = existing.filter(function (row) { return String(row.Username) === username && String(row.Type).toUpperCase() === 'MF' && String(row.SourceCode || ''); });
  statementExisting.forEach(function (row) {
    sh.getRange(row.row, headerIndex_(APP.SHEETS.HOLDINGS, 'Active')).setValue(false);
  });
  const now = new Date();
  Object.keys(groups).forEach(function (key) {
    const txs = groups[key].slice().sort(function (a,b) { return new Date(a.TradeDate).getTime() - new Date(b.TradeDate).getTime(); });
    const first = txs[0];
    const calc = fifoCurrentCost_(txs);
    if (calc.units <= 0.000001) return;
    const mapped = resolveAmfiScheme_(String(first.AMC || ''), String(first.SchemeName || ''), amfiUniverse);
    const code = mapped ? mapped.code : String(first.ProductCode || '').toUpperCase();
    const assetName = mapped && mapped.name ? mapped.name : String(first.SchemeName || 'Mutual Fund');
    const sourceCode = String(first.ProductCode || '').toUpperCase();
    const owner = cleanOwner_(first.Owner);
    const note = mapped ? ('Statement code: ' + sourceCode + ' · AMFI auto-match ' + Math.round(mapped.score * 100) + '%') : ('Statement code: ' + sourceCode + ' · AMFI mapping pending');
    const match = statementExisting.find(function (row) { return normalizeOwner_(row.Owner) === normalizeOwner_(owner) && String(row.SourceCode || '').toUpperCase() === sourceCode; });
    const id = match ? String(match.Id) : newId_('H');
    const createdAt = match ? match.CreatedAt : now;
    const row = [id, username, 'MF', assetName, code, '', round_(calc.units, 6), round_(calc.cost, 2), '', '', note, true, createdAt, now, owner, sourceCode];
    if (match) sh.getRange(match.row, 1, 1, row.length).setValues([row]); else sh.appendRow(row);
    ensureQuote_('MF', code, '', assetName);
    ensurePerformanceRow_('MF', code, '');
  });
}

function fifoCurrentCost_(rows) {
  const net = {};
  rows.forEach(function (row) {
    const units = finiteNumberOrNull_(row.Units);
    const amount = finiteNumberOrNull_(row.Amount);
    if (units === null || Math.abs(units) < 0.0000001) return;
    const price = finiteNumberOrNull_(row.Price);
    const key = serializeDateOnly_(row.TradeDate) + '|' + normalizeTextKey_(row.TransactionType) + '|' + (price === null ? '' : round_(price, 6));
    if (!net[key]) net[key] = { date: row.TradeDate, units: 0, amount: 0 };
    net[key].units += units;
    net[key].amount += amount === null ? 0 : amount;
  });
  const items = Object.keys(net).map(function (k) { return net[k]; }).sort(function (a,b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); });
  const lots = [];
  items.forEach(function (item) {
    let qty = item.units;
    if (Math.abs(qty) < 0.000001) return;
    if (qty > 0) {
      const cost = item.amount > 0 ? item.amount : Math.abs(item.amount);
      lots.push({ units: qty, cost: cost });
      return;
    }
    let sellQty = Math.abs(qty);
    while (sellQty > 0.000001 && lots.length) {
      const lot = lots[0];
      const take = Math.min(sellQty, lot.units);
      const ratio = lot.units > 0 ? take / lot.units : 1;
      lot.cost -= lot.cost * ratio;
      lot.units -= take;
      sellQty -= take;
      if (lot.units <= 0.000001) lots.shift();
    }
  });
  return lots.reduce(function (acc, lot) { acc.units += lot.units; acc.cost += lot.cost; return acc; }, { units: 0, cost: 0 });
}

function fetchAmfiUniverse_(force) {
  const cache = CacheService.getScriptCache();
  const cached = force ? null : cache.get('amfi_universe_v32');
  if (cached) { try { return JSON.parse(cached); } catch (ignore) {} }

  const response = UrlFetchApp.fetch('https://portal.amfiindia.com/spages/NAVAll.txt?t=' + Date.now(), {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (response.getResponseCode() !== 200) return [];

  const out = [];
  response.getContentText('UTF-8').split(/\r?\n/).forEach(function (line) {
    const p = line.split(';');
    if (p.length < 6 || !/^\d+$/.test(String(p[0] || '').trim())) return;
    const nav = Number(p[4]);
    out.push({
      code: String(p[0]).trim(),
      isin1: String(p[1] || '').trim().toUpperCase(),
      isin2: String(p[2] || '').trim().toUpperCase(),
      name: String(p[3] || '').trim(),
      nav: isFinite(nav) ? nav : null,
      date: String(p[5] || '').trim()
    });
  });

  try { cache.put('amfi_universe_v32', JSON.stringify(out), 21600); } catch (ignore) {}
  return out;
}


function resolveAmfiByIsin_(isin, universe) {
  const key = String(isin || '').trim().toUpperCase();
  if (!key || !universe || !universe.length) return null;
  for (let i = 0; i < universe.length; i++) {
    const item = universe[i];
    if (String(item.isin1 || '').toUpperCase() === key || String(item.isin2 || '').toUpperCase() === key) return item;
  }
  return null;
}

function setMfQuoteFromUniverse_(item) {
  if (!item || !item.code) return;
  ensureQuote_('MF', item.code, '', item.name || '');
  const key = quoteKey_('MF', item.code, '');
  const record = findRecordByField_(APP.SHEETS.QUOTES, 'Key', key);
  if (!record) return;
  const sh = sheet_(APP.SHEETS.QUOTES);
  sh.getRange(record.row, headerIndex_(APP.SHEETS.QUOTES, 'AssetName'), 1, 5).setValues([[
    item.name || record.AssetName || '',
    item.nav === null || typeof item.nav === 'undefined' ? '' : item.nav,
    item.date || '',
    'AMFI',
    new Date()
  ]]);
}

function resolveAmfiScheme_(amc, scheme, universe) {
  const target = normalizeSchemeName_(scheme);
  if (!target || !universe || !universe.length) return null;
  const targetTokens = importantSchemeTokens_(target);
  const wantsDirect = /\b(dir|direct|dp)\b/i.test(scheme);
  const wantsRegular = /\b(reg|regular|rp)\b/i.test(scheme);
  const wantsGrowth = /\b(growth|\bg\b)/i.test(scheme);
  const amcTokens = importantSchemeTokens_(normalizeSchemeName_(amc));
  let best = null;
  universe.forEach(function (item) {
    const name = normalizeSchemeName_(item.name);
    if (!name) return;
    const isDirect = /\bdirect\b/.test(name);
    const isRegular = /\bregular\b/.test(name) || !isDirect;
    if (wantsDirect && !isDirect) return;
    if (wantsRegular && !isRegular) return;
    if (wantsGrowth && !/\bgrowth\b/.test(name)) return;
    const tokens = importantSchemeTokens_(name);
    let overlap = 0;
    targetTokens.forEach(function (t) { if (tokens.indexOf(t) >= 0) overlap++; });
    const denom = Math.max(1, targetTokens.length);
    let score = overlap / denom;
    if (amcTokens.some(function (t) { return name.indexOf(t) >= 0; })) score += 0.12;
    if (target.indexOf(name) >= 0 || name.indexOf(target) >= 0) score += 0.15;
    if (!best || score > best.score) best = { code: item.code, name: item.name, score: Math.min(1, score) };
  });
  return best && best.score >= 0.58 ? best : null;
}

function normalizeSchemeName_(value) {
  return String(value || '').toLowerCase().replace(/\(formerly[^)]*\)/g, ' ').replace(/erstwhile/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\bdp\b/g, 'direct plan').replace(/\bdir\b/g, 'direct').replace(/\brp\b/g, 'regular plan').replace(/\breg\b/g, 'regular').replace(/\bpl\b/g, 'plan').replace(/\bgr\b/g, 'growth').replace(/\bg\b/g, 'growth').replace(/\blf\b/g, 'liquid fund');
}
function importantSchemeTokens_(value) {
  const stop = { fund:1, mutual:1, plan:1, scheme:1, india:1, the:1, of:1, and:1, formerly:1, erstwhile:1, option:1 };
  return String(value || '').split(/\s+/).filter(function (t) { return t.length > 1 && !stop[t]; });
}
function normalizeTextKey_(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim(); }

function ensureSchemaV12_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SCHEMA_VERSION') === '12') return;
  initializeSheets_();
  seedDailyQuotes_();
  props.setProperty('SCHEMA_VERSION', '12');
}

function ensureAllPerformanceRows_() {
  [APP.SHEETS.HOLDINGS, APP.SHEETS.WATCHLIST].forEach(function (sheetName) {
    readObjects_(sheetName).filter(function (r) { return toBoolean_(r.Active); }).forEach(function (r) {
      ensurePerformanceRow_(String(r.Type || ''), String(r.Code || ''), String(r.Exchange || ''));
    });
  });
}

function ensurePerformanceRow_(type, code, exchange) {
  type = String(type || '').toUpperCase(); code = String(code || '').toUpperCase(); exchange = String(exchange || '').toUpperCase();
  if (!['STOCK','ETF','MF'].includes(type) || !code) return;
  const key = quoteKey_(type, code, exchange);
  const existing = findRecordByField_(APP.SHEETS.PERFORMANCE, 'Key', key);
  if (existing) return;
  const sh = sheet_(APP.SHEETS.PERFORMANCE);
  sh.appendRow([key, type, code, exchange, '', '', '', '', '', '', '', '', '']);
  const row = sh.getLastRow();
  if (type === 'STOCK' || type === 'ETF') setStockPerformanceFormulas_(sh, row);
}

function setStockPerformanceFormulas_(sh, row) {
  const ticker = '$D' + row + '&":"&$C' + row;
  const current = 'GOOGLEFINANCE(' + ticker + ',"price")';
  function formula(target) {
    return '=IFERROR((' + current + '/INDEX(GOOGLEFINANCE(' + ticker + ',"close",' + target + ',' + target + '+10),2,2)-1)*100,"")';
  }
  const formulas = [
    formula('WORKDAY(TODAY(),-1)'), formula('TODAY()-7'), formula('EDATE(TODAY(),-1)'), formula('EDATE(TODAY(),-6)'),
    formula('EDATE(TODAY(),-12)'), formula('EDATE(TODAY(),-36)'), formula('EDATE(TODAY(),-60)'), formula('EDATE(TODAY(),-120)')
  ];
  sh.getRange(row, 5, 1, 8).setFormulas([formulas]);
  sh.getRange(row, 13).setFormula('=NOW()');
}

function readPerformanceMap_() {
  const map = {};
  readObjects_(APP.SHEETS.PERFORMANCE).forEach(function (r) { map[String(r.Key)] = r; });
  return map;
}

function activeMfCodes_() {
  const codes = {};
  [APP.SHEETS.HOLDINGS, APP.SHEETS.WATCHLIST].forEach(function (sheetName) {
    readObjects_(sheetName)
      .filter(function (r) { return toBoolean_(r.Active) && String(r.Type || '').toUpperCase() === 'MF'; })
      .forEach(function (r) {
        const code = String(r.Code || '').trim();
        if (/^\d+$/.test(code)) codes[code] = true;
      });
  });
  return codes;
}

function refreshMutualFundPerformance_(force) {
  const sh = sheet_(APP.SHEETS.PERFORMANCE);
  const activeCodes = activeMfCodes_();
  const rows = readObjects_(APP.SHEETS.PERFORMANCE).filter(function (r) {
    const code = String(r.Code || '').trim();
    return String(r.Type || '').toUpperCase() === 'MF' && /^\d+$/.test(code) && activeCodes[code];
  });

  if (!rows.length) return { tracked: 0, updated: 0, failed: [] };

  let updated = 0;
  const failed = [];
  const chunkSize = 50;

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const requests = chunk.map(function (r) {
      return {
        url: 'https://api.mfapi.in/mf/' + encodeURIComponent(String(r.Code)),
        muteHttpExceptions: true,
        followRedirects: true
      };
    });

    let responses = [];
    try {
      responses = UrlFetchApp.fetchAll(requests);
    } catch (error) {
      chunk.forEach(function (r) { failed.push(String(r.Code)); });
      console.warn('MF performance batch fetch failed: ' + error);
      continue;
    }

    chunk.forEach(function (r, index) {
      try {
        const response = responses[index];
        if (!response || response.getResponseCode() !== 200) {
          failed.push(String(r.Code));
          return;
        }

        const payload = JSON.parse(response.getContentText('UTF-8'));
        const data = Array.isArray(payload.data) ? payload.data : [];
        if (data.length < 2) {
          failed.push(String(r.Code));
          return;
        }

        const series = data
          .map(function (x) { return { date: parseMfApiDate_(x.date), nav: Number(x.nav) }; })
          .filter(function (x) { return x.date && isFinite(x.nav); })
          .sort(function (a,b) { return a.date.getTime() - b.date.getTime(); });

        if (series.length < 2) {
          failed.push(String(r.Code));
          return;
        }

        const latest = series[series.length - 1];
        const prev = series[series.length - 2];
        const vals = [
          round_((latest.nav / prev.nav - 1) * 100, 4),
          retFromDate_(latest.date, series, 7, 'days'),
          retFromDate_(latest.date, series, 1, 'months'),
          retFromDate_(latest.date, series, 6, 'months'),
          retFromDate_(latest.date, series, 1, 'years'),
          retFromDate_(latest.date, series, 3, 'years'),
          retFromDate_(latest.date, series, 5, 'years'),
          retFromDate_(latest.date, series, 10, 'years')
        ];

        sh.getRange(r.row, 5, 1, 9).setValues([[
          vals[0], vals[1], vals[2], vals[3], vals[4], vals[5], vals[6], vals[7], new Date()
        ]]);
        updated++;
      } catch (error) {
        failed.push(String(r.Code));
        console.warn('MF performance failed for ' + r.Code + ': ' + error);
      }
    });
  }

  return {
    tracked: rows.length,
    updated: updated,
    failed: [...new Set(failed)]
  };
}

function retFromDate_(latestDate, series, amount, unit) {
  const d = new Date(latestDate.getTime());
  if (unit === 'days') d.setDate(d.getDate() - amount);
  else if (unit === 'months') d.setMonth(d.getMonth() - amount);
  else if (unit === 'years') d.setFullYear(d.getFullYear() - amount);
  const old = navOnOrBefore_(series, d);
  const latest = series[series.length - 1];
  return old ? round_((latest.nav / old.nav - 1) * 100, 4) : '';
}
function navOnOrBefore_(series, target) {
  let lo = 0, hi = series.length - 1, ans = null;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (series[mid].date.getTime() <= target.getTime()) { ans = series[mid]; lo = mid + 1; } else hi = mid - 1;
  }
  return ans;
}
function parseMfApiDate_(value) {
  const m = String(value || '').match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
}

function calculateHoldingXirr_(rows, currentValue) {
  if (!rows || !rows.length || currentValue <= 0) return null;
  const flows = [];
  rows.forEach(function (r) {
    const amount = finiteNumberOrNull_(r.Amount);
    if (amount === null || Math.abs(amount) < 0.01) return;
    const type = normalizeTextKey_(r.TransactionType);
    let cash = null;
    if (/redemption|redeem|switch out/.test(type)) cash = Math.abs(amount);
    else if (/purchase|sip|systematic|switch in/.test(type)) cash = -amount;
    if (cash !== null && isFinite(cash) && Math.abs(cash) > 0.01) flows.push({ date: new Date(r.TradeDate), amount: cash });
  });
  flows.push({ date: new Date(), amount: currentValue });
  if (!flows.some(function (f) { return f.amount < 0; }) || !flows.some(function (f) { return f.amount > 0; })) return null;
  const base = flows[0].date.getTime();
  function npv(rate) {
    return flows.reduce(function (sum, f) { const years = (f.date.getTime() - base) / 31557600000; return sum + f.amount / Math.pow(1 + rate, years); }, 0);
  }
  let low = -0.9999, high = 10;
  let fl = npv(low), fh = npv(high);
  let tries = 0;
  while (fl * fh > 0 && tries < 6) { high *= 2; fh = npv(high); tries++; }
  if (!isFinite(fl) || !isFinite(fh) || fl * fh > 0) return null;
  for (let i = 0; i < 90; i++) { const mid = (low + high) / 2; const fm = npv(mid); if (Math.abs(fm) < 0.0001) return round_(mid * 100, 4); if (fl * fm <= 0) { high = mid; fh = fm; } else { low = mid; fl = fm; } }
  return round_(((low + high) / 2) * 100, 4);
}

function cleanOwner_(value) {
  const text = cleanText_(value, 100).replace(/\s+/g, ' ');
  if (!text) return 'Portfolio';
  return text.toLowerCase().split(' ').map(function (w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : ''; }).join(' ');
}
function normalizeOwner_(value) { return cleanOwner_(value).toLowerCase(); }

function requireRole_(token, role) {
  const session = requireAuth_(token);
  if (session.role !== role) throw appError_('FORBIDDEN', 'Administrator access is required.');
  return session;
}

function requireAuth_(token) {
  assertConfigured_();
  token = String(token || '');
  if (!token) throw appError_('AUTH_REQUIRED', 'Please sign in.');

  const tokenHash = hashToken_(token);
  const cache = CacheService.getScriptCache();
  const now = new Date();
  const idleMs = APP.SESSION_IDLE_MINUTES * 60 * 1000;
  const cached = cache.get('session_' + tokenHash);

  if (cached) {
    try {
      const data = JSON.parse(cached);
      const expiresMs = new Date(data.expiresAt).getTime();
      const lastSeenMs = new Date(data.lastSeen || 0).getTime();
      if (expiresMs > now.getTime() && lastSeenMs && now.getTime() - lastSeenMs < idleMs) {
        // Cache entries are created only after a verified login. Trusting the
        // server-side cache removes a sheet lookup and write from every API
        // request, which is especially important on mobile connections.
        const persistedMs = new Date(data.persistedAt || 0).getTime();
        if (!persistedMs || now.getTime() - persistedMs >= 120000) {
          const record = findRecordByField_(APP.SHEETS.SESSIONS, 'TokenHash', tokenHash);
          if (!record) {
            cache.remove('session_' + tokenHash);
            throw appError_('AUTH_REQUIRED', 'Please sign in.');
          }
          sheet_(APP.SHEETS.SESSIONS).getRange(record.row, headerIndex_(APP.SHEETS.SESSIONS, 'LastSeen')).setValue(now);
          data.persistedAt = now.toISOString();
        }
        data.lastSeen = now.toISOString();
        cacheSession_(tokenHash, data);
        return { tokenHash: tokenHash, username: data.username, role: data.role, displayName: data.displayName };
      }
    } catch (e) {
      if (e && (e.code === 'AUTH_REQUIRED' || e.code === 'SESSION_EXPIRED')) throw e;
    }
    cache.remove('session_' + tokenHash);
  }

  const sessionRow = findRecordByField_(APP.SHEETS.SESSIONS, 'TokenHash', tokenHash);
  if (!sessionRow) throw appError_('AUTH_REQUIRED', 'Please sign in.');

  const expires = sessionRow.ExpiresAt instanceof Date ? sessionRow.ExpiresAt : new Date(sessionRow.ExpiresAt);
  const lastSeen = sessionRow.LastSeen instanceof Date ? sessionRow.LastSeen : new Date(sessionRow.LastSeen || 0);

  if (!expires || isNaN(expires.getTime()) || expires.getTime() <= now.getTime()) {
    deleteSessionByHash_(tokenHash);
    throw appError_('SESSION_EXPIRED', 'Your session has expired.');
  }
  if (!lastSeen || isNaN(lastSeen.getTime()) || now.getTime() - lastSeen.getTime() >= idleMs) {
    deleteSessionByHash_(tokenHash);
    cache.remove('session_' + tokenHash);
    throw appError_('SESSION_EXPIRED', 'Your session expired after 5 minutes of inactivity.');
  }

  const user = findUser_(String(sessionRow.Username));
  if (!user || !toBoolean_(user.Active)) throw appError_('AUTH_REQUIRED', 'This user is not active.');

  sheet_(APP.SHEETS.SESSIONS).getRange(sessionRow.row, headerIndex_(APP.SHEETS.SESSIONS, 'LastSeen')).setValue(now);
  const data = {
    username: String(user.Username),
    role: String(user.Role || 'USER'),
    displayName: String(user.DisplayName || user.Username),
    expiresAt: expires.toISOString(),
    lastSeen: now.toISOString(),
    persistedAt: now.toISOString()
  };
  cacheSession_(tokenHash, data);
  return { tokenHash: tokenHash, username: data.username, role: data.role, displayName: data.displayName };
}

function cacheSession_(tokenHash, data) {
  const absoluteSeconds = Math.max(60, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
  const idleSeconds = Math.max(60, APP.SESSION_IDLE_MINUTES * 60);
  const seconds = Math.max(60, Math.min(absoluteSeconds, idleSeconds));
  CacheService.getScriptCache().put('session_' + tokenHash, JSON.stringify(data), seconds);
}

function deleteSessionByHash_(tokenHash) {
  const record = findRecordByField_(APP.SHEETS.SESSIONS, 'TokenHash', tokenHash);
  if (record) sheet_(APP.SHEETS.SESSIONS).deleteRow(record.row);
}

function invalidateUserSessions_(username, keepTokenHash) {
  const sh = sheet_(APP.SHEETS.SESSIONS);
  const values = sh.getDataRange().getValues();
  for (let r = values.length - 1; r >= 1; r--) {
    const tokenHash = String(values[r][0] || '');
    const rowUsername = String(values[r][1] || '');
    if (rowUsername === username && tokenHash !== keepTokenHash) {
      CacheService.getScriptCache().remove('session_' + tokenHash);
      sh.deleteRow(r + 1);
    }
  }
}

function cleanupExpiredSessions_() {
  const sh = sheet_(APP.SHEETS.SESSIONS);
  const values = sh.getDataRange().getValues();
  const now = Date.now();
  const idleMs = APP.SESSION_IDLE_MINUTES * 60 * 1000;
  for (let r = values.length - 1; r >= 1; r--) {
    const expires = values[r][2] instanceof Date ? values[r][2].getTime() : new Date(values[r][2] || 0).getTime();
    const lastSeen = values[r][4] instanceof Date ? values[r][4].getTime() : new Date(values[r][4] || 0).getTime();
    if (!expires || expires <= now || !lastSeen || now - lastSeen >= idleMs) {
      CacheService.getScriptCache().remove('session_' + String(values[r][0] || ''));
      sh.deleteRow(r + 1);
    }
  }
}

function listPublicUsers_() {
  return readObjects_(APP.SHEETS.USERS).map(function (row) {
    return { username: String(row.Username), displayName: String(row.DisplayName || row.Username), role: String(row.Role || 'USER'),
      active: toBoolean_(row.Active), createdAt: serializeValue_(row.CreatedAt), lastLogin: serializeValue_(row.LastLogin) };
  });
}

function ensureInitialAdmin_() {
  if (findUser_('admin')) return { created: false };
  const password = generateTemporaryPassword_();
  const salt = randomToken_();
  const hash = hashPassword_(password, salt);
  const now = new Date();
  sheet_(APP.SHEETS.USERS).appendRow(['admin', 'Administrator', 'ADMIN', salt, hash, true, now, now, '']);
  return { created: true, password: password };
}

function updateUserPasswordByRow_(row, password) {
  const salt = randomToken_();
  const hash = hashPassword_(password, salt);
  const sh = sheet_(APP.SHEETS.USERS);
  sh.getRange(row, headerIndex_(APP.SHEETS.USERS, 'PasswordSalt')).setValue(salt);
  sh.getRange(row, headerIndex_(APP.SHEETS.USERS, 'PasswordHash')).setValue(hash);
  sh.getRange(row, headerIndex_(APP.SHEETS.USERS, 'UpdatedAt')).setValue(new Date());
}

function validateStrongPassword_(password) {
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw appError_('WEAK_PASSWORD', 'Password must have at least 10 characters, including upper-case, lower-case, number and symbol.');
  }
}

function hashPassword_(password, salt) {
  const secret = PropertiesService.getScriptProperties().getProperty('APP_SECRET') || '';
  let value = salt + '|' + password + '|' + secret;
  for (let i = 0; i < APP.PASSWORD_HASH_ROUNDS; i++) value = sha256Hex_(value + '|' + i);
  return value;
}

function verifyPassword_(password, salt, expectedHash) {
  return constantTimeEqual_(hashPassword_(password, String(salt || '')), String(expectedHash || ''));
}

function hashToken_(token) { return sha256Hex_(String(token || '') + '|' + (PropertiesService.getScriptProperties().getProperty('APP_SECRET') || '')); }

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { const v = b < 0 ? b + 256 : b; return ('0' + v.toString(16)).slice(-2); }).join('');
}

function constantTimeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function enforceLoginRateLimit_(username) {
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('login_fail_' + username) || 0);
  if (count >= 7) throw appError_('RATE_LIMITED', 'Too many failed sign-in attempts. Try again after 15 minutes.');
}
function recordLoginFailure_(username) {
  const cache = CacheService.getScriptCache();
  const key = 'login_fail_' + username;
  cache.put(key, String(Number(cache.get(key) || 0) + 1), 900);
}
function clearLoginFailures_(username) { CacheService.getScriptCache().remove('login_fail_' + username); }

function createBackup_(reason) {
  const props = PropertiesService.getScriptProperties();
  const folder = DriveApp.getFolderById(props.getProperty('BACKUP_FOLDER_ID'));
  const db = db_();
  const payload = {
    app: APP.NAME, version: APP.VERSION, createdAt: isoNow_(), reason: reason,
    sheets: {}
  };
  db.getSheets().forEach(function (sh) { payload.sheets[sh.getName()] = sh.getDataRange().getDisplayValues(); });
  const fileName = 'investment-dashboard-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyyMMdd-HHmmss') + '.json';
  folder.createFile(fileName, JSON.stringify(payload), MimeType.PLAIN_TEXT);
  pruneBackups_(folder);
  setSetting_('LastBackupAt', isoNow_());
  return { fileName: fileName, folderId: folder.getId() };
}

function pruneBackups_(folder) {
  const files = [];
  const iterator = folder.getFiles();
  while (iterator.hasNext()) files.push(iterator.next());
  files.sort(function (a,b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  files.slice(APP.BACKUP_KEEP_COUNT).forEach(function (file) { file.setTrashed(true); });
}

function installTriggers_() {
  const handlers = ['refreshMutualFundNav','backupData'];
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (handlers.includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('refreshMutualFundNav').timeBased().everyHours(6).create();
  ScriptApp.newTrigger('backupData').timeBased().everyDays(1).atHour(2).create();
}

function initializeSheets_() {
  const db = db_();
  const defaultSheet = db.getSheetByName('Sheet1');
  Object.keys(APP.HEADERS).forEach(function (name) {
    let sh = db.getSheetByName(name);
    if (!sh) sh = db.insertSheet(name);
    const headers = APP.HEADERS[name];
    if (sh.getMaxColumns() < headers.length) sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#eaf0ff').setFontColor('#304a95');
    if (sh.getMaxColumns() > headers.length) sh.deleteColumns(headers.length + 1, sh.getMaxColumns() - headers.length);
  });
  if (defaultSheet && !APP.HEADERS.Sheet1) db.deleteSheet(defaultSheet);
  formatSheets_();
}

function formatSheets_() {
  const db = db_();
  [APP.SHEETS.HOLDINGS, APP.SHEETS.WATCHLIST, APP.SHEETS.QUOTES, APP.SHEETS.TRANSACTIONS, APP.SHEETS.PERFORMANCE, APP.SHEETS.DIARY, APP.SHEETS.MONTHLY_DIARY, APP.SHEETS.MONTH_STATUS, APP.SHEETS.STICKY_NOTES, APP.SHEETS.DAILY_QUOTES, APP.SHEETS.CUSTOM_COLUMNS, APP.SHEETS.CUSTOM_VALUES, APP.SHEETS.SIP_PLANS, APP.SHEETS.SIP_EVENTS, APP.SHEETS.EXPENSES, APP.SHEETS.EXPENSE_PLANS, APP.SHEETS.RECURRING_EXPENSES, APP.SHEETS.EXPENSE_CATEGORIES].forEach(function (name) {
    const sh = db.getSheetByName(name);
    if (sh) sh.autoResizeColumns(1, sh.getLastColumn());
  });
  const holding = db.getSheetByName(APP.SHEETS.HOLDINGS);
  if (holding) {
    holding.getRange('G:G').setNumberFormat('0.000000');
    holding.getRange('H:I').setNumberFormat('₹#,##0.00');
    holding.getRange('Q:Q').setNumberFormat('₹#,##0.00');
    holding.getRange('R:R').setNumberFormat('0.00"%"');
  }
  const watch = db.getSheetByName(APP.SHEETS.WATCHLIST);
  if (watch) watch.getRange('G:H').setNumberFormat('₹#,##0.00');
  const sipPlans = db.getSheetByName(APP.SHEETS.SIP_PLANS);
  if (sipPlans) {
    sipPlans.getRange('G:G').setNumberFormat('₹#,##0.00');
    sipPlans.getRange('L:M').setNumberFormat('0.0"%"');
  }
  const sipEvents = db.getSheetByName(APP.SHEETS.SIP_EVENTS);
  if (sipEvents) sipEvents.getRange('E:E').setNumberFormat('₹#,##0.00');
  const expenses = db.getSheetByName(APP.SHEETS.EXPENSES);
  if (expenses) expenses.getRange('C:C').setNumberFormat('₹#,##0.00');
  const expensePlans = db.getSheetByName(APP.SHEETS.EXPENSE_PLANS);
  if (expensePlans) expensePlans.getRange('C:C').setNumberFormat('₹#,##0.00');
  const recurringExpenses = db.getSheetByName(APP.SHEETS.RECURRING_EXPENSES);
  if (recurringExpenses) recurringExpenses.getRange('D:D').setNumberFormat('₹#,##0.00');
  const quotes = db.getSheetByName(APP.SHEETS.QUOTES);
  if (quotes) quotes.getRange('F:F').setNumberFormat('₹#,##0.0000');
}

function getSettingValue_(key) {
  const record=findRecordByField_(APP.SHEETS.SETTINGS,'Key',key);
  return record?String(record.Value||''):'';
}

function setSetting_(key, value) {
  const existing = findRecordByField_(APP.SHEETS.SETTINGS, 'Key', key);
  const sh = sheet_(APP.SHEETS.SETTINGS);
  if (existing) sh.getRange(existing.row, 2).setValue(value); else sh.appendRow([key, value]);
}

function audit_(username, action, details) {
  try { sheet_(APP.SHEETS.AUDIT).appendRow([new Date(), username, action, cleanText_(details, 500)]); } catch (error) { console.warn('Audit write failed: ' + error); }
}

function db_() {
  assertConfigured_();
  if (!RUNTIME_DB) RUNTIME_DB = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
  return RUNTIME_DB;
}
function sheet_(name) {
  const sh = db_().getSheetByName(name);
  if (!sh) throw appError_('CONFIG_ERROR', 'Missing sheet: ' + name + '. Run setupSystem().');
  return sh;
}
function assertConfigured_() {
  if (!PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')) throw appError_('NOT_CONFIGURED', 'Run setupSystem() in Apps Script first.');
}

function readObjects_(sheetName) {
  const sh = sheet_(sheetName);
  const range = sh.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(function (row) { return row.some(function (cell) { return cell !== ''; }); }).map(function (row, index) {
    const object = { row: index + 2 };
    headers.forEach(function (header, col) { object[header] = row[col]; });
    return object;
  });
}

function findRecordById_(sheetName, id) { return findRecordByField_(sheetName, 'Id', id); }
function findRecordByField_(sheetName, field, value) {
  const rows = readObjects_(sheetName);
  for (let i = 0; i < rows.length; i++) if (String(rows[i][field]) === String(value)) return rows[i];
  return null;
}
function findUser_(username) { return findRecordByField_(APP.SHEETS.USERS, 'Username', normalizeUsername_(username)); }
function headerIndex_(sheetName, header) {
  const headers = APP.HEADERS[sheetName];
  const index = headers.indexOf(header);
  if (index < 0) throw appError_('CONFIG_ERROR', 'Unknown column ' + header + ' in ' + sheetName + '.');
  return index + 1;
}

function parseRequest_(e) {
  if (!e) return {};
  const raw = e.postData && e.postData.contents ? e.postData.contents : '';
  if (raw) {
    try { return JSON.parse(raw); } catch (ignore) { /* form post or other transport */ }
  }
  const params = e.parameter || {};
  if (params.payload) {
    try { return JSON.parse(String(params.payload)); } catch (ignorePayload) { /* fall through */ }
  }
  return params;
}
function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function appError_(code, message) { const error = new Error(message); error.appCode = code; return error; }
function normalizeError_(error) {
  if (error && error.appCode) return { code: error.appCode, message: error.message };
  return { code: 'SERVER_ERROR', message: 'The server could not complete the request. Check Apps Script Executions for details.' };
}

function cleanText_(value, maxLength) { return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength || 500); }
function cleanCode_(value) { return cleanText_(value, 40).toUpperCase().replace(/[^A-Z0-9._-]/g, ''); }
function normalizeUsername_(value) { return cleanText_(value, 60).toLowerCase(); }
function newId_(prefix) { return prefix + '-' + Utilities.getUuid(); }
function randomToken_() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }
function generateTemporaryPassword_() { return 'Inv@' + Utilities.getUuid().replace(/-/g, '').slice(0, 10) + '9aA'; }
function isoNow_() { return new Date().toISOString(); }
function round_(value, digits) { const factor = Math.pow(10, digits || 0); return Math.round((value + Number.EPSILON) * factor) / factor; }
function finiteNumberOrNull_(value) { if (value === '' || value === null || typeof value === 'undefined') return null; const n = Number(value); return isFinite(n) ? n : null; }
function finiteNumberOrZero_(value) { const n = finiteNumberOrNull_(value); return n === null ? 0 : n; }
function toBoolean_(value) { return value === true || String(value).toLowerCase() === 'true' || Number(value) === 1; }
function quoteKey_(type, code, exchange) { return [String(type).toUpperCase(), String(exchange || '').toUpperCase(), String(code).toUpperCase()].join('|'); }
function validateDateOnly_(value) { const text = cleanText_(value, 10); if (!text) return ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw appError_('VALIDATION_ERROR', 'Invalid purchase date.'); return text; }
function serializeDateOnly_(value) {
  if (!value) return '';
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyy-MM-dd');
  return String(value).slice(0, 10);
}
function serializeValue_(value) { return value instanceof Date && !isNaN(value.getTime()) ? value.toISOString() : (value == null ? '' : String(value)); }
