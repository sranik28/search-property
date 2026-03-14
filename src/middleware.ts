import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/admin/login',
  },
})

export const config = {
  // Protect all /admin routes except the login page
  matcher: ['/admin/:path((?!login).*)', '/admin'],
}
