export function isUniqueViolation(error) {
  return error?.code === "23505" || /duplicate key|23505/i.test(String(error?.message || ""));
}

export function isExclusionViolation(error) {
  return error?.code === "23P01" || /exclusion|23P01/i.test(String(error?.message || ""));
}
