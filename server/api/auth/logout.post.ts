import { defineEventHandler, setCookie } from 'h3'

export default defineEventHandler(async event => {
	setCookie(event, 'auth.token', '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 0,
	})

	return { success: true }
})
