export async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("json")) throw new Error(fallbackMessage);
  try {
    return await response.json() as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}
