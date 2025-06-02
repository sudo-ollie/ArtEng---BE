import { createClient as createManagementClient } from 'contentful-management'

export const managementClient = createManagementClient({
  accessToken: process.env.MANAGEMENT_KEY!,
})