/**
 * Nodra Framework
 * A metadata-driven web framework inspired by Frappe
 */

export const VERSION = '0.2.0';

// Document
export { Document } from './core/document/document.js';

// Errors
export {
  NodraError,
  ValidationError,
  MandatoryError,
  LinkValidationError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  DuplicateError,
  InvalidStateError,
  DatabaseError,
  AppError,
} from './core/errors.js';

// Types
export type {
  DocTypeDefinition,
  FieldDefinition,
  PermissionRule,
  NamingRule,
} from './core/doctype/schema.js';

export type { NodraConfig } from './core/config.js';

// Events
export { EventEmitter, EVENT_PRIORITY_VALUES } from './events/index.js';

export type {
  EventType,
  BaseEvent,
  EventHandler,
  EventPriority,
  DocumentEvent,
  UserEvent,
  SystemEvent,
} from './events/index.js';

// Hooks
export { HookRegistryManager } from './hooks/index.js';

export type {
  HooksConfig,
  DocEventsConfig,
  SchedulerEventsConfig,
  HookContext,
  DocHookHandler,
  BootHookHandler,
  ScheduledHookHandler,
  MethodOverrideHandler,
} from './hooks/index.js';

// Workflow
export {
  WorkflowManager,
  WorkflowValidationError,
  WorkflowExecutor,
  WorkflowExecutionError,
} from './workflow/index.js';

export type {
  WorkflowState,
  WorkflowTransition,
  WorkflowDefinition,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowRegistry,
} from './workflow/index.js';

// Background Jobs
export {
  PostgresJobQueue,
  JobQueueError,
  JobScheduler,
  JobWorker,
  CronParser,
  CronParseError,
  parseCronExpression,
  isCronTimeMatch,
  JOB_PRIORITY_VALUES,
} from './jobs/index.js';

export type {
  Job,
  JobStatus,
  JobPriority,
  JobHandler,
  JobQueue,
  JobQueueConfig,
  ScheduledJob,
  WorkerConfig,
  CronSchedule,
} from './jobs/index.js';

// Real-time WebSocket
// Not ported yet — src/realtime/ depended on @fastify/websocket and needs
// its own standalone `ws` process. See the migration README.

// File Management
export {
  LocalFileStorage,
  FileValidator,
  FileValidationError,
  sanitizeFilename,
  getFileExtension,
  formatFileSize,
  getMimeTypeFromExtension,
} from './files/index.js';

export type {
  FileStorage,
  FileUpload,
  FileMetadata,
  FileValidationConfig,
  FileStorageConfig,
  FileAttachment,
} from './files/index.js';

// Reporting
export {
  QueryReportExecutor,
  ScriptReportExecutor,
  DefaultReportExecutor,
  DefaultReportRegistry,
  formatColumnValue,
  createColumnFormatter,
  formatRow,
  formatRows,
} from './reports/index.js';

export type {
  ReportType,
  ColumnType,
  ReportColumn,
  ReportFilter,
  QueryReportDefinition,
  ScriptReportDefinition,
  ReportDefinition,
  ReportContext,
  ReportRow,
  ReportResult,
  ScriptReportFunction,
  ReportExecutor as IReportExecutor,
  ReportRegistry,
  ColumnFormatter,
  ExportFormat,
} from './reports/index.js';

// CLI
// Deliberately NOT re-exported here. `cli/index.ts` side-effect-imports
// `main.ts`, which parses `process.argv` and runs immediately — fine for
// the `nodra` bin, but importing it through this library barrel would run
// the CLI as a side effect of `import 'nodra'` anywhere else (e.g. inside
// an SSR app). Import CLI commands directly if you need them
// programmatically, e.g. `import { MigrateCommand } from 'nodra/cli/migrate.js'`.

// Apps
export {
  DefaultAppLoader,
  DefaultAppRegistry,
  DefaultAppInstaller,
  DependencyResolver,
} from './apps/index.js';

export type {
  AppManifest,
  App,
  InstallOptions,
  UninstallOptions,
  AppLoader,
  AppInstaller,
  AppRegistry,
  DependencyResolution,
} from './apps/index.js';

// API Methods
export { DefaultMethodRegistry, hasRequiredRole, formatResult } from './api/method.js';

export type { MethodDefinition, MethodRegistry } from './api/method.js';

// API Key Authentication
export {
  generateAPIKey,
  hashAPIKey,
  hashAPISecret,
  verifyAPIKey,
  revokeAPIKey,
  getAPIKeyPermissions,
  listUserAPIKeys,
  rotateAPIKey,
  DEFAULT_API_KEY_CONFIG,
} from './auth/api-key.js';

export type { APIKeyConfig, APIKeyRecord, APIKeyPair, APIKeyStore } from './auth/api-key.js';

// Permissions
export {
  hasPermission,
  assertPermission,
  getAccessibleDocTypes,
  hasAnyPermission,
} from './permissions/permission.js';

export {
  hasFieldPermission,
  getVisibleFields,
  getEditableFields,
  filterDocumentByFieldPermissions,
  assertFieldPermission,
} from './permissions/field-permission.js';

export {
  hasRowPermission,
  getRowPermissionFilter,
  applyRowPermissions,
  checkUserPermission,
} from './permissions/row-permission.js';

export type { UserContext, PermissionAction } from './permissions/permission.js';

export type { FieldPermissionRule } from './permissions/field-permission.js';

export type { UserPermissionRule, RowPermissionContext } from './permissions/row-permission.js';
