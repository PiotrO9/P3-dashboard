import { useRuntimeConfig } from '#imports'
import { createError, defineEventHandler, getCookie, readBody } from 'h3'

export default defineEventHandler(async event => {
	const config = useRuntimeConfig()
	const token = getCookie(event, 'auth.token')
	const pathParam = event.context.params?.path as string[] | string
	const segments = Array.isArray(pathParam) ? pathParam : [pathParam]
	const targetPath = '/' + segments.join('/')

	const method = event.method || 'GET'

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	}
	if (token) headers.Authorization = `Bearer ${token}`

	let body: any = undefined
	if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		body = await readBody(event)
	}

	try {
		const response = await $fetch<any>(`${config.public.apiBase}${targetPath}`, {
			method: method as any,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		})
		return response
	} catch (err: any) {
		throw createError({
			statusCode: err?.statusCode || err?.response?.status || 500,
			statusMessage: err?.statusMessage || err?.data?.message || 'Proxy request failed',
		})
	}
})
