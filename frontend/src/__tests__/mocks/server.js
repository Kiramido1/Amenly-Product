import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth.handlers'
import { frameworkHandlers } from './handlers/frameworks.handlers'
import { ragHandlers } from './handlers/rag.handlers'

export const server = setupServer(
  ...authHandlers,
  ...frameworkHandlers,
  ...ragHandlers
)
