/**
 * Removes `undefined` values before data is sent to Firestore.
 *
 * Firestore rejects undefined values, including nested fields. We keep class
 * instances (for example FieldValue/Timestamp) untouched and only recurse into
 * arrays and plain objects.
 */
export function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    const isPlainObject = prototype === Object.prototype || prototype === null;

    if (!isPlainObject) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefinedDeep(item)]),
    ) as T;
  }

  return value;
}
