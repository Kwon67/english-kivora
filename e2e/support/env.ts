export interface E2EEnv {
  adminLogin: string
  adminPassword: string
  memberLogin: string
  memberPassword: string
  memberUsername: string
}

export function getE2EEnv(): E2EEnv {
  const env = {
    adminLogin: process.env.E2E_ADMIN_LOGIN,
    adminPassword: process.env.E2E_ADMIN_PASSWORD,
    memberLogin: process.env.E2E_MEMBER_LOGIN,
    memberPassword: process.env.E2E_MEMBER_PASSWORD,
    memberUsername: process.env.E2E_MEMBER_USERNAME,
  }

  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Missing E2E environment variables: ${missing.join(', ')}. See e2e/README.md.`
    )
  }

  return {
    adminLogin: env.adminLogin!,
    adminPassword: env.adminPassword!,
    memberLogin: env.memberLogin!,
    memberPassword: env.memberPassword!,
    memberUsername: env.memberUsername!,
  }
}
