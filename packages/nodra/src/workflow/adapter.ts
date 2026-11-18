/**
 * DocType Workflow Adapter
 *
 * Maps inline DocType workflow metadata to the existing workflow engine.
 * Registration and execution remain the responsibility of the workflow engine.
 */

import type {
  DocTypeDefinition,
  DocTypeWorkflow,
} from "../core/doctype/schema";
import type { WorkflowDefinition } from "./types";

/**
 * Convert a DocType's inline workflow metadata into an engine definition.
 *
 * Returns undefined when the DocType has no workflow.
 */
export function toWorkflowDefinition(
  doctype: DocTypeDefinition,
): WorkflowDefinition | undefined {
  const workflow: DocTypeWorkflow | undefined = doctype.workflow;

  if (!workflow) {
    return undefined;
  }

  return {
    name: `${doctype.name} Workflow`,
    document_type: doctype.name,
    is_active: true,
    workflow_state_field: workflow.state_field,
    states: workflow.states.map((state) => ({
      state: state.state,
      ...(state.doc_status !== undefined && {
        doc_status: state.doc_status,
      }),
      ...(state.is_initial !== undefined && {
        is_initial: state.is_initial,
      }),
      ...(state.is_final !== undefined && {
        is_final: state.is_final,
      }),
      ...(state.color !== undefined && {
        color: state.color,
      }),
    })),
    transitions: workflow.transitions.map((transition) => ({
      from_state: transition.from,
      to_state: transition.to,
      action: transition.action,
      allowed_roles: transition.roles ?? [],
    })),
  };
}
