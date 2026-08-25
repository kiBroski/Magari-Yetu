import { headers as nextHeaders } from 'next/headers'
import { getPayload } from './payload'

// Payload's auth cookie is validated via payload.auth({ headers }). This
// wraps that in the two shapes the rest of the app actually needs: "give me
// the current user or null" and "throw unless the user has one of these
// roles" — used at the top of every dashboard page and mutating API route.

export async function getCurrentUser() {
  const payload = await getPayload()
  const headersList = await nextHeaders()
  const { user } = await payload.auth({ headers: headersList })
  return user ?? null
}

export async function requireRole(...roles: string[]) {
  const user = await getCurrentUser()
  if (!user || !roles.includes(user.role)) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
