import { SpanKind, SpanStatusCode, context, trace } from '@opentelemetry/api';
import { Request, Response, Router } from 'express';
import Logger from '../../../Logger';
import Tracing from '../../../Tracing';
import { formatError } from '../../../Utils';
import { errorResponse } from '../../Utils';

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
   *       properties:
   *         error:
   *           type: string
   *           required: true
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
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: formatError(e),
        });
        span.setAttribute('code', 400);
        errorResponse(this.logger, req, res, e, 400);
      } finally {
        span.end();
      }
    };
  };
}

export default RouterBase;
