import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod';

import { config } from './config/index.js';
import { checkConnection } from './modules/prisma.js';
import { ZSignalMessagePayload } from './types/api.js';

export const server = fastify();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.get('/', async (_req, reply) => {
  reply.send({
    timestamp: new Date().getTime(),
    version: config.appVersion,
    databaseConnection: await checkConnection()
  });
});

server.withTypeProvider<ZodTypeProvider>().route({
  method: 'POST',
  url: '/debug/subscribe',
  schema: { body: ZSignalMessagePayload },
  async handler() {
    return true;
  }
});
