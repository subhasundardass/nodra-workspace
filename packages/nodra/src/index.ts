/**
 * Nodra Framework
 * A metadata-driven web framework inspired by Frappe
 */

export const VERSION = "0.2.0";

// Document
export { Document } from "./core/document/document";

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
} from "./core/errors";

// Types
export type {
  DocTypeDefinition,
  FieldDefinition,
  PermissionRule,
  NamingRule,
} from "./core/doctype/schema";

export type { NodraConfig } from "./core/config";

// Events
export { EventEmitter, EVENT_PRIORITY_VALUES } from "./events";

export type {
  EventType,
  BaseEvent,
  EventHandler,
  EventPriority,
  DocumentEvent,
  UserEvent,
  SystemEvent,
} from "./events";

// Hooks
export { HookRegistryManager } from "./hooks";

export type {
  HooksConfig,
  DocEventsConfig,
  SchedulerEventsConfig,
  HookContext,
  DocHookHandler,
  BootHookHandler,
  ScheduledHookHandler,
  MethodOverrideHandler,
} from "./hooks";

// Workflow
export {
  WorkflowManager,
  WorkflowValidationError,
  WorkflowExecutor,
  WorkflowExecutionError,
} from "./workflow";

export type {
  WorkflowState,
  WorkflowTransition,
  WorkflowDefinition,
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowRegistry,
} from "./workflow";

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
} from "./jobs";

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
} from "./jobs";

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
} from "./files";

export type {
  FileStorage,
  FileUpload,
  FileMetadata,
  FileValidationConfig,
  FileStorageConfig,
  FileAttachment,
} from "./files";

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
} from "./reports";

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
} from "./reports";

// Views
// export {
//   ViewRegistry,
//   ViewResolver,
//   ViewService,
//   createDefaultView,
// } from "./core/view";

// export type {
//   ViewDefinition,
//   ViewType,
//   ListViewConfig,
//   FormViewConfig,
//   FormSection,
//   DetailViewConfig,
//   SearchViewConfig,
//   KanbanViewConfig,
// } from "./core/view";

// Resource API
export { ResourceAPI } from "./api/resource";

export type {
  ResourceListOptions,
  ResourceListResult,
  DocumentFactory,
} from "./api/resource";

// CLI
// Deliberately NOT re-exported here. `cli/index` side-effect-imports
// `main`, which parses `process.argv` and runs immediately — fine for
// the `nodra` bin, but importing it through this library barrel would run
// the CLI as a side effect of `import 'nodra'` anywhere else (e.g. inside
// an SSR app). Import CLI commands directly if you need them
// programmatically, e.g. `import { MigrateCommand } from 'nodra/cli/migrate'`.

// Apps
export {
  DefaultAppLoader,
  DefaultAppRegistry,
  DefaultAppInstaller,
  DependencyResolver,
} from "./apps";

export type {
  AppManifest,
  App,
  InstallOptions,
  UninstallOptions,
  AppLoader,
  AppInstaller,
  AppRegistry,
  DependencyResolution,
} from "./apps";

// API Methods
export {
  DefaultMethodRegistry,
  compose,
  authenticate,
  requireAuth,
  requireRoles,
  validateArgs,
  logging,
  hasRequiredRole,
  formatResult,
  methodErrorStatus,
} from "./api/method";

export type {
  MethodContext,
  MethodCallInit,
  MethodDefinition,
  MethodHandler,
  MethodMiddleware,
  MethodOptions,
  MethodRegistry,
  MethodRequest,
  MethodUser,
  ResolvedIdentity,
  ArgsSchema,
  MethodLogger,
} from "./api/method";

// Sessions
export {
  SessionManager,
  RedisSessionStore,
  MemorySessionStore,
  DEFAULT_SESSION_CONFIG,
  extractSessionToken,
  generateSessionToken,
  hashToken,
} from "./auth/session";

export type {
  Session,
  SessionSubject,
  SessionStore,
  SessionConfig,
} from "./auth/session";

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
} from "./auth/api-key";

export type {
  APIKeyConfig,
  APIKeyRecord,
  APIKeyPair,
  APIKeyStore,
} from "./auth/api-key";

// Permissions
export {
  hasPermission,
  assertPermission,
  getAccessibleDocTypes,
  hasAnyPermission,
} from "./permissions/permission";

export {
  hasFieldPermission,
  getVisibleFields,
  getEditableFields,
  filterDocumentByFieldPermissions,
  assertFieldPermission,
} from "./permissions/field-permission";

export {
  hasRowPermission,
  getRowPermissionFilter,
  applyRowPermissions,
  checkUserPermission,
} from "./permissions/row-permission";

export type { UserContext, PermissionAction } from "./permissions/permission";

export type { FieldPermissionRule } from "./permissions/field-permission";

export type {
  UserPermissionRule,
  RowPermissionContext,
} from "./permissions/row-permission";
