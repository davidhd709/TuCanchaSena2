import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    host: ArgumentsHost
  ) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.warn(`PrismaValidationError: ${exception.message.split('\n').pop()?.trim()}`);
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Datos inválidos para la operación',
      });
    }

    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | string | undefined) ?? 'campo único';
        return res.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `Ya existe un registro con ese ${Array.isArray(target) ? target.join(', ') : target}`,
        });
      }
      case 'P2025':
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Registro no encontrado',
        });
      case 'P2003':
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Violación de referencia: el recurso relacionado no existe',
        });
      default:
        this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Error de base de datos',
        });
    }
  }
}
