import type { Request, Response, NextFunction } from "express";
import { db, traces } from "../db";


 
export function traceMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Generamos un ID único y lo mutamos en el request.
  //    Cualquier middleware o handler posterior puede leer req.traceId.
  const traceId = crypto.randomUUID();
  (req as any).traceId = traceId;
  const start = Date.now();

  // 2. Escuchamos el evento "finish" del response.
  //    Se dispara cuando los headers y el body ya se enviaron al cliente.
  //    Es el único momento seguro para saber el status final y la duración.
  res.on("finish", () => {
    const durationMs = Date.now() - start;

    // 3. Insertamos el trace en Neon con Drizzle.
    //    No bloqueamos la respuesta: el "finish" ya ocurrió, el cliente ya tiene su data.
    db.insert(traces)
      .values({
        id: traceId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs,
        createdAt: new Date().toISOString(),
      })
      .catch((err) => {
        // Si falla la inserción, no rompemos la request (ya salió).
        console.error("[trace] error al persistir:", err);
      });
  });

  // 4. Pasamos al siguiente middleware. Sin esto, la request queda colgada.
  next();
}