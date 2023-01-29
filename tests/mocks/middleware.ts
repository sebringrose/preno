import { Server, Middleware, Handler, RequestContext } from "../../server.ts"
import { _format } from "std/path/_util.ts"

export const testMiddleware1: Middleware = async (ctx, next) => {
  const start = Date.now()
  ctx.state.middleware1 = { start }
  await new Promise(res => setTimeout(res, 1))
  const res = await next()
  const end = Date.now()
  ctx.state.middleware1 = { start, end, res }
}

export const testMiddleware2: Middleware = async (ctx, next) => {
  const start = Date.now()
  ctx.state.middleware2 = { start }
  await new Promise(res => setTimeout(res, 1))
  const res = await next()
  const end = Date.now()
  ctx.state.middleware2 = { start, end, res }
}

export const testMiddleware3: Middleware = async (ctx, next) => {
  const start = Date.now()
  ctx.state.middleware3 = { start }
  await new Promise(res => setTimeout(res, 1))
  const res = await next()
  const end = Date.now()
  ctx.state.middleware3 = { start, end, res }
}

export const testHandler: Handler = async (ctx: RequestContext) => {
  await new Promise(res => setTimeout(res, 1))
  return new Response(JSON.stringify({ ...ctx.state, createdAt: Date.now() }))
}

export const server = new Server()