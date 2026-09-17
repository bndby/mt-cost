export function requiredApplicationId(
  name: string,
  value: string | undefined,
): string {
  const id = value?.trim() ?? "";
  if (!id) {
    throw new Error(`${name} is required`);
  }
  return id;
}
