import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth.handlers'
import { frameworkHandlers } from './handlers/frameworks.handlers'
import { ragHandlers } from './handlers/rag.handlers'
import { orgHandlers } from './handlers/orgs.handlers'
import { dashboardHandlers } from './handlers/dashboard.handlers'

export const server = setupServer(
  ...authHandlers,
  ...frameworkHandlers,
  ...ragHandlers,
  ...orgHandlers,
  ...dashboardHandlers
)
