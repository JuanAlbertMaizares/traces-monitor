# 🔍 Request Inspector API

Un proyecto experimental construido con **Bun**, **Express**, **Drizzle ORM** y **PostgreSQL (Neon)**, diseñado para explorar, visualizar y entender el ciclo de vida de una petición HTTP en Express.

El objetivo principal no es la persistencia de datos, sino **el flujo de `req` y `res` a través de la pila de middlewares**, la mutación de estos objetos y el manejo centralizado de errores.

## 🚀 Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Framework HTTP:** [Express.js](https://expressjs.com/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Base de Datos:** PostgreSQL alojado en [Neon](https://neon.tech/) 

---

## 🧠 El Ciclo de Vida del Request (Core del Proyecto)

Express funciona como una **tubería secuencial** (pipeline). Cada petición entra por arriba y pasa por una serie de funciones `(req, res, next)` en un orden estricto. El orden de `app.use()` es la ley.

### 1. Entrada y Parseo Base
- `express.json()`: Atrapa el stream del body, lo parsea y lo inyecta en `req.body`. Si falla, corta el flujo con un error.
- `traceMiddleware`: Es el primer eslabón de nuestro flujo personalizado.

### 2. El Bus de Datos: Mutando el `Request` (`req`)
El objeto `req` es un objeto compartido que viaja por toda la pila. **No es inmutable**. 
Nuestro `traceMiddleware` inicializa un contexto en `req`:
- Genera un `traceId` único (`crypto.randomUUID()`) y lo adjunta a `req.traceId`.
- Inicializa un array en `req._traceEvents` para acumular el historial de mutaciones.
- Inyecta el header `X-Trace-Id` en el response temprano.

Luego, entran en juego los middlewares de dominio (en `src/middleware/demo.ts`):
- `demoAuthMiddleware`: Inyecta un usuario falso en `req.user` y registra un evento `auth` en `req._traceEvents`.
- `demoLocaleMiddleware`: Lee un header de idioma, lo inyecta en `req.locale` y registra un evento `locale`.

**Concepto clave:** Cualquier middleware o handler posterior (ej. tus rutas) puede leer `req.user`, `req.locale` o `req.traceId` sin necesidad de pasarlos como argumentos. El `req` es el estado compartido de la petición.

### 3. Procesamiento (Rutas)
Los routers (`health`, `traces`, `debug`) leen el estado acumulado en `req` y generan una respuesta llamando a `res.json()` o `res.send()`. 
Si ocurre un error síncrono o se llama a `next(err)`, Express salta **directamente** al Error Handler, ignorando el resto de las rutas normales.

### 4. Mutando el `Response` (`res`)
En `src/middleware/trace.ts`, interceptamos el método `res.json` original antes de que las rutas lo usen.
- Cuando una ruta llama a `res.json({ status: 'ok' })`, nuestra interceptación lo captura.
- Envuelve el body original: `{ data: { status: 'ok' }, meta: { traceId: '...' } }`.
- Llama al `res.json` original con el nuevo body envuelto.

### 5. El Hook de Cierre: `res.on('finish')`
Cuando el response se envía al cliente (los headers y el body salieron), se dispara el evento `finish`. 
- Es el **único** momento seguro para medir la duración total (`Date.now() - start`).
- En este punto, el cliente ya tiene su respuesta. Aprovechamos para hacer un `db.transaction` e insertar en PostgreSQL el `trace` (con su status y duración) y todos los eventos que acumulamos en `req._traceEvents` durante el viaje.
- *Nota técnica:* No se pueden mutar headers en el evento `finish` (como `X-Response-Time`) porque ya fueron enviados; hacerlo lanzaría un `ERR_HTTP_HEADERS_SENT`.

### 6. Manejo Centralizado de Errores
El `errorHandler` es un middleware especial de **4 argumentos** `(err, req, res, next)`.
- Captura cualquier `throw` o `next(err)` de la tubería.
- Registra el error como un evento en el trace actual.
- Devuelve un JSON estandarizado con el código de estado correcto (ej. 500).
- *Regla de oro:* Siempre debe registrarse al final de todos los `app.use()`.

---

## 🛠️ Instalación y Uso

### 1. Requisitos
- Bun instalado (`curl -fsSL https://bun.sh/install | bash`)
- Una base de datos PostgreSQL (recomendado: [Neon](https://neon.tech/))

### 2. Variables de Entorno
Creá un archivo `.env` en la raíz con tus credenciales de Neon:
```env
# URL con Pooling (para la app en runtime)
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require"

# URL directa (para las migraciones de Drizzle Kit)
DATABASE_URL_UNPOOLED="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require"