import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CirclePlus,
  Clock3,
  FilePenLine,
  GitBranch,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";

import { callMethod } from "@/lib/call-method";
import { formatTimestamp } from "@/lib/format";

type RecordValue = Record<string, unknown>;

type DocumentActivityProps = {
  doctype: string;
  name?: string;
};

type ActivityItem = {
  id: string;
  user: string;
  action: string;
  actionType: string;
  timestamp: string | null;
  sortTime: number | null;
  details: string[];
};

type DocTypeField = {
  fieldname: string;
  fieldtype: string;
  options?: string;
};

type DocTypeMeta = {
  fields?: DocTypeField[];
};

type LinkSearchResponse = {
  items?: Array<{ name: string; label: string }>;
};

const VISIBLE_CHANGES = 2;

const SYSTEM_FIELDS = new Set([
  "name",
  "doctype",
  "owner",
  "creation",
  "modified",
  "modified_by",
  "docstatus",
  "idx",
  "workflow_state",
  "workflowState",
  "reference_doctype",
  "reference_name",
]);

const CREATE_ACTIONS = new Set(["create", "created", "insert"]);
const DELETE_ACTIONS = new Set(["delete", "deleted"]);
const UPDATE_ACTIONS = new Set(["update", "updated"]);
const WORKFLOW_ACTIONS = new Set(["workflow", "transition"]);

function asRecord(value: unknown): RecordValue | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as RecordValue;
}

function formatFieldValue(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const normalized = value.trim();

    // Format numeric strings only; leave IDs and ordinary text unchanged.
    if (/^-?\d+(?:\.\d+)?$/.test(normalized)) {
      const number = Number(normalized);

      if (Number.isFinite(number)) {
        return new Intl.NumberFormat("en-IN", {
          maximumFractionDigits: 2,
        }).format(number);
      }
    }
  }

  return asText(value);
}

function asText(value: unknown): string {
  if (value == null || value === "") return "—";

  if (typeof value === "string") return value;

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const record = asRecord(value);

  if (record) {
    for (const key of [
      "full_name",
      "fullName",
      "label",
      "title",
      "name",
      "email",
    ]) {
      if (record[key] != null && record[key] !== "") {
        return asText(record[key]);
      }
    }
  }

  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function getDate(value: unknown): Date | null {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    !(value instanceof Date)
  ) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getTimestamp(record: RecordValue): unknown {
  const changes = asRecord(record.changes);
  const after = asRecord(record.after_data ?? record.afterData);

  return (
    record.created_at ??
    record.createdAt ??
    record.timestamp ??
    asRecord(changes?.creation)?.after ??
    after?.creation
  );
}

function normalizeAction(action: string): string {
  return action
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function describeAction(action: string): string {
  const descriptions: Record<string, string> = {
    create: "created this document",
    created: "created this document",
    insert: "created this document",
    update: "updated this document",
    updated: "updated this document",
    delete: "deleted this document",
    deleted: "deleted this document",
    submit: "submitted this document",
    submitted: "submitted this document",
    cancel: "cancelled this document",
    cancelled: "cancelled this document",
    amend: "amended this document",
    amended: "amended this document",
    workflow: "changed the workflow",
    transition: "changed the workflow state",
  };

  const normalized = normalizeAction(action);

  return (
    descriptions[normalized] ??
    `${normalized.replace(/_/g, " ") || "recorded"} this document`
  );
}

function readableFieldName(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function getActionStyle(action: string) {
  const value = normalizeAction(action);

  if (CREATE_ACTIONS.has(value)) {
    return {
      icon: CirclePlus,
      color: "text-emerald-600 dark:text-emerald-400",
      background: "bg-emerald-500/10",
    };
  }

  if (DELETE_ACTIONS.has(value)) {
    return {
      icon: Trash2,
      color: "text-destructive",
      background: "bg-destructive/10",
    };
  }

  if (["submit", "submitted"].includes(value)) {
    return {
      icon: Send,
      color: "text-blue-600 dark:text-blue-400",
      background: "bg-blue-500/10",
    };
  }

  if (WORKFLOW_ACTIONS.has(value)) {
    return {
      icon: GitBranch,
      color: "text-violet-600 dark:text-violet-400",
      background: "bg-violet-500/10",
    };
  }

  if (["cancel", "cancelled"].includes(value)) {
    return {
      icon: AlertCircle,
      color: "text-orange-600 dark:text-orange-400",
      background: "bg-orange-500/10",
    };
  }

  if (["amend", "amended"].includes(value)) {
    return {
      icon: CheckCircle2,
      color: "text-amber-600 dark:text-amber-400",
      background: "bg-amber-500/10",
    };
  }

  return {
    icon: FilePenLine,
    color: "text-primary",
    background: "bg-primary/10",
  };
}

function normalizeHistory(response: unknown): RecordValue[] {
  const wrapper = asRecord(response);

  const value = Array.isArray(response)
    ? response
    : wrapper
      ? [
          wrapper.activities,
          wrapper.data,
          wrapper.logs,
          wrapper.history,
          wrapper.items,
          wrapper.results,
        ].find(Array.isArray)
      : [];

  if (!Array.isArray(value)) return [];

  return value
    .map(asRecord)
    .filter((item): item is RecordValue => item !== null);
}

function getChanges(record: RecordValue): RecordValue | null {
  return asRecord(record.changes);
}

function getBefore(record: RecordValue): RecordValue | null {
  return asRecord(record.before_data ?? record.beforeData);
}

function getAfter(record: RecordValue): RecordValue | null {
  return asRecord(record.after_data ?? record.afterData);
}

type LinkLabels = Map<string, Map<string, string>>;

function displayValue(
  field: string,
  value: unknown,
  linkLabels: LinkLabels,
): string {
  if (value == null || value === "") return "—";

  // Preserve existing Link-field label resolution.
  const linkLabel = linkLabels.get(field)?.get(String(value));
  if (linkLabel) return linkLabel;

  // Format numeric values, including PostgreSQL NUMERIC strings.
  if (
    (typeof value === "number" ||
      (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim()))) &&
    Number.isFinite(Number(value))
  ) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  return asText(value);
}

function getFieldChanges(
  changes: RecordValue | null,
  linkLabels: LinkLabels,
): string[] {
  if (!changes) return [];

  return Object.entries(changes).flatMap(([field, raw]) => {
    if (SYSTEM_FIELDS.has(field)) return [];

    const change = asRecord(raw);
    if (!change) return [];

    const before = change.before;
    const after = change.after;

    if (sameValue(before, after)) return [];

    const label = readableFieldName(field);
    const next = displayValue(field, after, linkLabels);

    if (before == null || before === "") {
      return [`${label}: ${next}`];
    }

    const previous = displayValue(field, before, linkLabels);

    return [`${label}: ${previous} → ${next}`];
  });
}

function getDetails(record: RecordValue, linkLabels: LinkLabels): string[] {
  const action = normalizeAction(
    asText(record.action ?? record.operation ?? "activity"),
  );

  const before = getBefore(record);
  const after = getAfter(record);
  const changes = getChanges(record);

  if (CREATE_ACTIONS.has(action)) {
    const lotNo = asText(after?.lot_no ?? asRecord(changes?.lot_no)?.after);
    const bags = asText(after?.bags ?? asRecord(changes?.bags)?.after);
    const documentName = asText(after?.name ?? record.reference_name);

    const summary = [
      documentName !== "—" ? documentName : null,
      lotNo !== "—" ? `Lot ${lotNo}` : null,
      bags !== "—" ? `${bags} bags` : null,
    ].filter((item): item is string => item !== null);

    return [summary.join(" · ") || "Document created"];
  }

  if (DELETE_ACTIONS.has(action)) {
    return ["Document deleted"];
  }

  const workflowChange = asRecord(changes?.workflow_state);
  const oldState = before?.workflow_state ?? workflowChange?.before;
  const newState = after?.workflow_state ?? workflowChange?.after;

  if (
    oldState !== undefined &&
    newState !== undefined &&
    !sameValue(oldState, newState)
  ) {
    return [`Workflow: ${asText(oldState)} → ${asText(newState)}`];
  }

  const fieldChanges = getFieldChanges(changes, linkLabels);
  if (fieldChanges.length) return fieldChanges;

  if (before && after) {
    const fields = new Set([...Object.keys(before), ...Object.keys(after)]);

    const details: string[] = [];

    for (const field of fields) {
      if (SYSTEM_FIELDS.has(field)) continue;
      if (sameValue(before[field], after[field])) continue;

      const previous = displayValue(field, before[field], linkLabels);
      const next = displayValue(field, after[field], linkLabels);

      details.push(`${readableFieldName(field)}: ${previous} → ${next}`);
    }

    if (details.length) return details;
  }

  if (UPDATE_ACTIONS.has(action)) {
    return ["Document details were updated"];
  }

  if (WORKFLOW_ACTIONS.has(action)) {
    return ["Document workflow was changed"];
  }

  return ["Activity recorded"];
}

function normalizeActivity(
  record: RecordValue,
  index: number,
  linkLabels: LinkLabels,
): ActivityItem {
  const rawAction = asText(record.action ?? record.operation ?? "activity");
  const timestamp = getTimestamp(record);
  const date = getDate(timestamp);

  return {
    id: asText(record.name ?? record.id ?? `${rawAction}-${index}`),
    user:
      asText(
        record.user_full_name ??
          record.userFullName ??
          record.user ??
          record.owner ??
          record.created_by,
      ) === "—"
        ? "System"
        : asText(
            record.user_full_name ??
              record.userFullName ??
              record.user ??
              record.owner ??
              record.created_by,
          ),
    action: describeAction(rawAction),
    actionType: normalizeAction(rawAction),
    timestamp:
      typeof timestamp === "string" ||
      typeof timestamp === "number" ||
      timestamp instanceof Date
        ? formatTimestamp(timestamp) || null
        : null,
    sortTime: date?.getTime() ?? null,
    details: getDetails(record, linkLabels),
  };
}

/**
 * Resolves Link-field IDs using the target DocType's configured title_field.
 * Audit data remains unchanged; only the activity display values are enriched.
 */
async function resolveLinkLabels(
  doctype: string,
  records: RecordValue[],
): Promise<LinkLabels> {
  const labels: LinkLabels = new Map();

  try {
    const metaResult = await callMethod<{ doctype?: DocTypeMeta }>(
      "nodra.doctype.get",
      { name: doctype },
    );

    const linkFields = (metaResult.doctype?.fields ?? []).filter(
      (field) =>
        field.fieldtype.toLowerCase() === "link" &&
        typeof field.options === "string" &&
        field.options.trim() !== "",
    );

    const changesByField = new Map<string, Set<string>>();

    for (const record of records) {
      const changes = getChanges(record);
      const before = getBefore(record);
      const after = getAfter(record);

      for (const field of linkFields) {
        const values = changesByField.get(field.fieldname) ?? new Set<string>();

        const change = asRecord(changes?.[field.fieldname]);

        for (const value of [
          change?.before,
          change?.after,
          before?.[field.fieldname],
          after?.[field.fieldname],
        ]) {
          if (value != null && value !== "") {
            values.add(asText(value));
          }
        }

        changesByField.set(field.fieldname, values);
      }
    }

    await Promise.all(
      linkFields.map(async (field) => {
        const values = changesByField.get(field.fieldname);
        if (!values?.size || !field.options) return;

        const fieldLabels = new Map<string, string>();

        await Promise.all(
          [...values].map(async (name) => {
            try {
              const result = await callMethod<LinkSearchResponse>(
                "links.search",
                {
                  doctype: field.options,
                  query: "",
                  selectedName: name,
                  limit: 1,
                },
              );

              const item = result.items?.find(
                (candidate) => candidate.name === name,
              );

              if (item?.label) fieldLabels.set(name, item.label);
            } catch {
              // If a linked record is unavailable, keep displaying its ID.
            }
          }),
        );

        labels.set(field.fieldname, fieldLabels);
      }),
    );
  } catch {
    // Metadata lookup failure should not prevent activity from being displayed.
  }

  return labels;
}

function ActivityChanges({ details }: { details: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? details : details.slice(0, VISIBLE_CHANGES);
  const hasMore = details.length > VISIBLE_CHANGES;

  useEffect(() => {
    setExpanded(false);
  }, [details]);

  return (
    <div className="mt-1 space-y-1">
      {visible.map((detail, index) => {
        const separator = detail.indexOf(":");
        const field = separator >= 0 ? detail.slice(0, separator) : null;
        const value =
          separator >= 0 ? detail.slice(separator + 1).trim() : detail;
        const transition = value.indexOf(" → ");

        return (
          <p
            key={`${index}-${detail}`}
            className="break-words text-sm leading-5 text-muted-foreground"
          >
            {field && (
              <span className="font-medium text-foreground">{field}: </span>
            )}

            {transition >= 0 ? (
              <>
                <span className="line-through decoration-muted-foreground/60 opacity-60">
                  {value.slice(0, transition)}
                </span>
                <span className="mx-1">→</span>
                <span className="font-medium text-foreground">
                  {value.slice(transition + 3)}
                </span>
              </>
            ) : (
              value
            )}
          </p>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded
            ? "Show less"
            : `+${details.length - VISIBLE_CHANGES} more changes`}
        </button>
      )}
    </div>
  );
}

function EmptyActivity({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="px-3 py-6 text-center">
      <div className="mx-auto flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-48 text-xs leading-4 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function DocumentActivity({ doctype, name }: DocumentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const refresh = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadActivity() {
      if (!doctype || !name) {
        setActivities([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response: unknown = await callMethod(
          "document.get_audit_history",
          { doctype, name },
        );

        if (!active) return;

        const records = normalizeHistory(response);
        const linkLabels = await resolveLinkLabels(doctype, records);

        if (!active) return;

        const result = records
          .map((record, index) => normalizeActivity(record, index, linkLabels))
          .sort((a, b) => {
            if (a.sortTime == null && b.sortTime == null) return 0;
            if (a.sortTime == null) return 1;
            if (b.sortTime == null) return -1;
            return b.sortTime - a.sortTime;
          });

        setActivities(result);
      } catch (cause) {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load document activity.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadActivity();

    return () => {
      active = false;
    };
  }, [doctype, name, refreshVersion]);

  return (
    <aside className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card md:sticky md:top-4 md:col-span-1 md:h-fit md:self-start">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Activity className="size-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Activity</h2>
            <p className="text-xs text-muted-foreground">Document history</p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={!name || loading}
          aria-label="Refresh document activity"
          title="Refresh activity"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </header>

      {!name ? (
        <EmptyActivity
          icon={<Clock3 className="size-4" />}
          title="Save to start tracking"
          description="Activity appears after the document is saved."
        />
      ) : loading && activities.length === 0 ? (
        <div
          className="space-y-6 p-3"
          aria-label="Loading activity"
          role="status"
        >
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex gap-2">
              <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
          <span className="sr-only">Loading document activity…</span>
        </div>
      ) : error && activities.length === 0 ? (
        <div className="p-4 text-center" role="alert">
          <AlertCircle className="mx-auto size-5 text-destructive" />
          <p className="mt-2 text-sm font-medium">Unable to load activity</p>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {error}
          </p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 rounded-md border px-3 py-1.5 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Try again
          </button>
        </div>
      ) : activities.length === 0 ? (
        <EmptyActivity
          icon={<Activity className="size-4" />}
          title="No activity recorded"
          description="Document changes will appear here."
        />
      ) : (
        <div className="p-3" aria-busy={loading}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Recent events</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {activities.length}
            </span>
          </div>

          <ul>
            {activities.map((item, index) => {
              const style = getActionStyle(item.actionType);
              const Icon = style.icon;
              const isLast = index === activities.length - 1;

              return (
                <li key={item.id} className="relative flex gap-4">
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-3.5 top-7 w-px bg-border"
                    />
                  )}

                  <div
                    className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-2 ring-card ${style.background} ${style.color}`}
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                  </div>

                  <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="text-sm font-semibold text-foreground">
                        {item.user}
                      </span>
                      <time className="text-[10px] text-muted-foreground">
                        {item.timestamp ?? "Time unavailable"}
                      </time>
                    </div>

                    <p className="text-xs leading-4 text-muted-foreground">
                      {item.action}
                    </p>

                    <ActivityChanges details={item.details} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && activities.length > 0 && (
        <div
          className="border-t px-3 py-2 text-xs text-destructive"
          role="status"
        >
          Refresh failed: {error}
        </div>
      )}
    </aside>
  );
}

export default DocumentActivity;
