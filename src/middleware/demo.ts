import type { Request, Response, NextFunction } from "express";
import { traceEvent } from "./trace";

export function demoAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Mutamos el request
  const fakeUser = { id: 42, role: "admin", name: "Ramiro" };
  (req as any).user = fakeUser;
  
  // Registramos la mutación en el trace
  traceEvent(req, "auth", { message: "User injected", user: fakeUser });
  
  next();
}

export function demoLocaleMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Mutamos el request con un valor
  const locale = (req.headers["accept-language"] as string) || "es";
  (req as any).locale = locale;
  
  // Registramos la mutación
  traceEvent(req, "locale", { locale });
  
  next();
}