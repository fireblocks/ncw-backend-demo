export function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error &&
    "name" in error &&
    error?.name === "AbortError"
  );
}
