import type { ORM } from "./crud";
import type { Document } from "../core/document/document";

export interface WorkflowActionContext {
  orm: ORM;
  doc: Document;
  action: string;
  user: string;
  roles: string[];
}

export type WorkflowActionHandler = (
  context: WorkflowActionContext,
) => Promise<void>;

export type WorkflowActionHooks = Record<string, WorkflowActionHandler>;
