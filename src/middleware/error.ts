import type { Request, Response, NextFunction } from "express";
import { traceEvent } from "./trace";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Si los headers ya se enviaron, no podemos hacer nada, delegamos a Express
  if (res.headersSent) {
    return next(err);
  }

  // Registramos el error en el trace para que quede en la DB
  traceEvent(req, "error", { message: err.message, stack: err.stack });

  // Respondemos con un JSON estandarizado
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
}