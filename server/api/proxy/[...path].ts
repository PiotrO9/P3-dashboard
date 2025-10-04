import { useRuntimeConfig } from '#imports'
import { createError, defineEventHandler, getCookie, readBody } from 'h3'

export default defineEventHandler(async function (event) {
	const config = useRuntimeConfig()
	const token = getCookie(event, 'auth.token')
	const pathParam = event.context.params?.path as string[] | string
	const segments = Array.isArray(pathParam) ? pathParam : [pathParam]
	const targetPath = '/' + segments.join('/')

	const method = event.method || 'GET'

	const headers: Record<string, string> = {}
	if (token) headers.Authorization = `Bearer ${token}`

	let body: any = undefined
	if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		body = await readBody(event)
	}

	try {
		if (body !== undefined) {
			headers['Content-Type'] = 'application/json'
		}
		const response = await $fetch<any>(`${config.public.apiBase}${targetPath}`, {
			method: method as any,
			headers,
			body: body !== undefined ? JSON.stringify(body) : undefined,
		})
		return response
	} catch (err: any) {
		throw createError({
			statusCode: err?.statusCode || err?.response?.status || 500,
			statusMessage: err?.statusMessage || err?.data?.message || 'Proxy request failed',
		})
	}
})
