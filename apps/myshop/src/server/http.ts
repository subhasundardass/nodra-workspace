/**
 * Serialise a Document (or a plain object already shaped like one) to a
 * plain data object, safe to return from a server function. Server
 * functions serialize their return value automatically (no manual
 * Response/JSON wrapping needed, unlike the REST-route version this
 * replaced) — this only handles turning a `Document` instance itself into
 * plain data via its `getData()`.
 */
export function serialise(doc: unknown): Record<string, unknown> {
  if (
    doc &&
    typeof doc === 'object' &&
    'getData' in doc &&
    typeof (doc as { getData: unknown }).getData === 'function'
  ) {
    return (doc as { getData(): Record<string, unknown> }).getData();
  }
  return doc as Record<string, unknown>;
}
