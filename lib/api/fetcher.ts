export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json().catch(() => null)) as
    | ({ ok: false; error: string } | ({ ok: true } & T))
    | null;

  if (!res.ok || !json || !("ok" in json) || !json.ok) {
    const message =
      json && "error" in json ? json.error : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return json as T;
}
