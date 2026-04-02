import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import type { Request, Response, Router } from 'express';
import type Logger from '../../../Logger';
import Tracing from '../../../Tracing';
import { formatError } from '../../../Utils';
import { errorResponse, resolveErrorStatusCode } from '../../Utils';

abstract class RouterBase {
  public readonly path: string;

  protected constructor(
    protected readonly logger: Logger,
    path: string,
  ) {
    this.path = path;
  }

  /**
   * @openapi
   * components:
   *   schemas:
   *     ErrorResponse:
   *       type: object
   *       required: ["error"]
   *       properties:
   *         error:
   *           type: string
   *           description: Description of the error that caused the request to fail
   */
  public abstract getRouter: () => Router;

  protected handleError = (
    handler: (req: Request, res: Response) => void | Promise<void>,
  ) => {
    return async (req: Request, res: Response) => {
      const span = Tracing.tracer.startSpan('handler', {
        kind: SpanKind.CLIENT,
      });
      const ctx = trace.setSpan(context.active(), span);

      try {
        await context.with(ctx, handler, this, req, res);
      } catch (e) {
        const statusCode = resolveErrorStatusCode(e, 400);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: formatError(e),
        });
        span.setAttribute('code', statusCode);
        errorResponse(this.logger, req, res, e, statusCode);
      } finally {
        span.end();
      }
    };
  };
}

export default RouterBase;
