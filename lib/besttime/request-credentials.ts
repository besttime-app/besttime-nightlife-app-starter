import type { NextRequest } from 'next/server'
import { normalizeBestTimeCredentials } from './credentials'

export const getBestTimeRequestCredentials = (request: NextRequest) =>
  normalizeBestTimeCredentials({
    privateKey: request.headers.get('x-besttime-api-key-private') || undefined,
    publicKey: request.headers.get('x-besttime-api-key-public') || undefined
  })
