import { useRuntimeConfig } from '#imports'
import { createError, defineEventHandler, readBody, setCookie } from 'h3'

interface ExternalLoginResponse {
	token: string
	user: any
	message?: string
	success?: boolean
}

export default defineEventHandler(async event => {
	const body = await readBody<{ email: string; password: string }>(event)
	const config = useRuntimeConfig()

	try {
		const response = await $fetch<ExternalLoginResponse>(`${config.public.apiBase}/users/login`, {
			method: 'POST',
			body,
		})

		if (!response || !response.token || !response.user) {
			throw createError({ statusCode: 401, statusMessage: response?.message || 'Invalid credentials' })
		}

		setCookie(event, 'auth.token', response.token, {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			maxAge: 60 * 60 * 24 * 7,
		})

		return {
			success: true,
			user: response.user,
		}
	} catch (err: any) {
		throw createError({
			statusCode: err?.statusCode || err?.response?.status || 500,
			statusMessage: err?.statusMessage || err?.data?.message || 'Login failed',
		})
	}
})
