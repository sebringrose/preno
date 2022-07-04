import { RequestContext, Handler } from "../server.ts"

export type CacheItem = { key: string, value: Response, dob: number }
export type CacheOptions = { lifetime: number, debug: boolean }

/**
 * Peko's internal Response cacher. 
 * @param options: { lifetime: number } - lifetime defaults to Infinity
 * @returns memoizeHandler: (handler: Handler) => memoizedHandler
 */
export const createResponseCache = (options?: Partial<CacheOptions>) => {
  let cache: Array<CacheItem> = []
  const lifetime = options && options.lifetime 
    ? options.lifetime 
    : Infinity

  const getLatestCacheItem = (key: string) => {
    // return first valid item if found
    const validItems = cache.filter(item => item.key == key && Date.now() < item.dob + lifetime)
    if (validItems.length) return validItems[validItems.length - 1]
    return undefined
  }

  const updateCache = async (key: string, value: Response) => await new Promise((resolve: (value: void) => void) => {
    // remove matching then push new
    cache = cache.filter((item) => item.key !== key)
    cache.push({ key, value, dob: Date.now() })

    return resolve()
  })

  const memoizeHandler = (fcn: Handler) => {
    return async (ctx: RequestContext) => {
      const key = `${ctx.request.url}-${JSON.stringify(ctx.data)}`

      const latest = getLatestCacheItem(key)
      if (latest) {
        // ETag match triggers 304
        const ifNoneMatch = ctx.request.headers.get("if-none-match")
        const ETag = latest.value.headers.get("ETag")
        if (ETag && ifNoneMatch?.includes(ETag)) {
          return new Response(null, {
            headers: latest.value.headers,
            status: 304
          })
        }

        // else respond 200 clone of response - one-use original lives in cache
        return latest.value.clone()
      }

      // calc new value then update cache asynchronously to not block process before return
      const response = await fcn(ctx)
      updateCache(key, response)

      return response.clone()
    }
  }

  return memoizeHandler
}