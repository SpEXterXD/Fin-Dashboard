export const swrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  errorRetryInterval: 8000,
  shouldRetryOnError: (err: unknown) => {
    const anyErr = err as { status?: number; code?: number | string } | undefined
    const status = anyErr?.status ?? anyErr?.code ?? 0
    return status !== 429
  },
}
