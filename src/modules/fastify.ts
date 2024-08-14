import Fastify, { FastifyBaseLogger } from 'fastify'
import { logger } from './logger.js'

export const fastify = Fastify({ logger: logger as FastifyBaseLogger })
