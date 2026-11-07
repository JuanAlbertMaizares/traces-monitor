import type { Request, Response, NextFunction } from "express";
import { db, traces, traceEvents } from "../db";


// Helper para que otros middlewares registren eventos en el request
export function traceEvent(req: Request, kind: string, payload: any) {
  if (!(req as any)._traceEvents) {
    (req as any)._traceEvents = [];
  }
  (req as any)._traceEvents.push({ kind, payload });
}


export function traceMiddleware(req: Request, res: Response, next: NextFunction) {
  // 1. Generamos un ID único y lo mutamos en el request.
  //    Cualquier middleware o handler posterior puede leer req.traceId.
  const traceId = crypto.randomUUID();
  (req as any).traceId = traceId;
  (req as any)._traceEvents = []; // Inicializamos el acumulador
  const start = Date.now();

  // 2. Escuchamos el evento "finish" del response.
  //    Se dispara cuando los headers y el body ya se enviaron al cliente.
  //    Es el único momento seguro para saber el status final y la duración.
  res.on("finish", async() => {
    const durationMs = Date.now() - start;
    try {
      // Transacción para guardar el trace y sus eventos juntos
      await db.transaction(async (tx) => {
        await tx.insert(traces).values({
          id: traceId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs,
          createdAt: new Date().toISOString(),
        });

        const events = (req as any)._traceEvents || [];
        if (events.length > 0) {
          await tx.insert(traceEvents).values(
            events.map((e: any) => ({
              id: crypto.randomUUID(),
              traceId: traceId,
              kind: e.kind,
              payload: e.payload,
              createdAt: new Date().toISOString(),
            }))
          );
        }
      });
    } catch (err) {
      console.error("[trace] error al persistir:", err);
    }
    
  });

  // 4. Pasamos al siguiente middleware. Sin esto, la request queda colgada.
  next();
}