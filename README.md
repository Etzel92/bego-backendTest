# bego-backendTest · NestJS + MongoDB

API REST en **NestJS (TypeScript)** con **MongoDB (Mongoose)**.  
Dominios: **Users**, **Trucks**, **Locations**, **Orders**.  
Autenticación con **JWT** (Bearer). Validaciones con `class-validator`.  
Pruebas de funcionamiento realizadas en **Swagger** disponible en `/docs`.

> **Objetivo de la prueba:** que un usuario pueda **crear órdenes** vinculadas a **un truck**, **origen (pickup)** y **destino (dropoff)** y **completar sus estatus** mediante un **endpoint dedicado** para cambio de estatus. Además, CRUD por cada dominio, validación de modelos antes de insertar, **JWT en todos los servicios**, ramas por dominio con merge a `main`, y **compartir `.env`**.

---

## Requisitos

- Node.js **v18+**  
- MongoDB **6+** (local o remoto)  
- **Google Places API Key** para `Locations`

---

## Variables de entorno (`.env`)

> Como se solicitó, se comparte el archivo **`.env`**. Sin embargo no se incluyo el API KEY. Pero se indica claramente donde debe adjuntarse.


Ejemplo de `.env` 

GOOGLE_PLACES_API_KEY=__SET_BY_REVIEWER__

---

## Instalación y ejecución

```bash
# 1) Instalar dependencias
npm install

# 2) Levantar la API en desarrollo
npm run start:dev
# ó producción
npm run build && npm run start:prod
```

- API base: `http://localhost:3000`  
- Swagger UI: `http://localhost:3000/docs`

---

## Autenticación (JWT)

- **POST** `/auth/signup` — Registro con **email** y **password**.  
  - `name` es **opcional**: si no se envía, se **deriva del email** (ej. `rodrigo.lopez@test.com → "Rodrigo Lopez"`).
- **POST** `/auth/login` — Devuelve `access_token` (JWT).
- **Bearer obligatorio** en todos los endpoints de negocio.

> **Bearer obligatorio** Borrar `JWT_SECRET` invalida tokens antiguos (pedirá login nuevamente).

---

## Dominios y Endpoints

> De Igual manera, como se indicó, las rutas de Users/Trucks/Locations/Orders están protegidas con **JWT**.

### Auth
- `POST /auth/signup` — Crear usuario (email + password; name opcional).
- `POST /auth/login` — Login, retorna `access_token`.

### Users (CRUD)
- `GET /users` — Listar (paginado simple opcional).
- `GET /users/:id` — Detalle.
- `POST /users` — Crear (opcional; también existe `/auth/signup`).
- `PATCH /users/:id` — Actualizar (email único; si cambia password se re-hashea).
- `DELETE /users/:id` — Eliminar.  
**Notas:** Email **único**, password **hasheado** y **no** se expone en respuestas.

### Trucks (CRUD)
- `GET /trucks`
- `GET /trucks/:id`
- `POST /trucks`
- `PATCH /trucks/:id`
- `DELETE /trucks/:id`

### Locations (CRUD)
- `GET /locations`
- `GET /locations/:id`
- `POST /locations` — Crea una ubicación (por `place_id` u otros campos según tu DTO).
- `PATCH /locations/:id`
- `DELETE /locations/:id`  

### Orders (CRUD + status + aggregation)
- `POST /orders` — **Crear orden**.  
  - El `user` **NO** viene en el body: se toma del **JWT**.  
  - Unicamente se debe llenar el json con los siguientes datos:
    ```json
    { "truck": "<truckId>", "pickup": "<locationId>", "dropoff": "<locationId>" }
    ```
  - Se agregaron diversas formas de consultar los registros de las ordenes:
- `GET /orders` — Listar **paginado** con filtros.
- `GET /orders/:id` — Detalle (con `?expand=true` hace `populate`).
- `PATCH /orders/:id` — Actualiza **solo** `truck/pickup/dropoff` (no cambia `status` ni `user`).
- `PATCH /orders/:id/status` — **Endpoint dedicado de cambio de estatus**  
  - Flujo permitido: `created → in_transit → completed`.  
- `DELETE /orders/:id` — Eliminar.
- `GET /orders/stats/status` — Aggregation con conteo por estatus (admin: global; usuario: solo sus órdenes).

---

## Reglas importantes

- **Permisos**:  
  - Sólo puede ver/actualizar/eliminar **sus** órdenes.  
- **Validación**:  
  - `ValidationPipe` con `whitelist: true` y `forbidNonWhitelisted: true`.  
- **Cambio de estatus**:  
  - Únicamente vía `PATCH /orders/:id/status`.  
  - Secuencia obligatoria: `created → in_transit → completed` (saltos inválidos causaran un error 400).

---


## Enfoque, decisiones técnicas y flujo de trabajo (Git)

- **Arquitectura modular:** NestJS + Mongoose, un módulo por dominio (**Users**, **Trucks**, **Locations**, **Orders**) con sus esquemas, DTOs, controladores y servicios, se trabajo dividiendo cada dominio en una rama — `feat/users`, `feat/trucks`, `feat/locations`, `feat/orders` — y fui haciendo pull request con merge a `main` al cerrar cada parte.
- **Validaciones limpias:** DTOs con `class-validator` y `ValidationPipe` global (`whitelist` y `forbidNonWhitelisted`) para rechazar ruido y dar errores claros.
- **Auth y permisos:** JWT (Bearer) en todos los endpoints. Cada usuario ve/modifica **solo sus** órdenes.
- **Órdenes con reglas claras:** endpoint dedicado `PATCH /orders/:id/status` con el flujo `created → in_transit → completed`. Si alguien manda `"in transit"` (con espacio o guion), lo normalizo a `in_transit`.
- **Token robusto:** helper `getUserId()` que funciona igual si `req.user` trae `sub` o `_id`, para evitar desfases entre creación y lectura.
- **Métricas sencillas:** `GET /orders/stats/status` con un aggregation para contar órdenes por estatus (global si eres admin; propio si eres usuario normal).
- **Pruebas:** con Swagger en `/docs` para probar rápido.---


## Prueba rápida (Swagger)

1. **Auth**  
   - `POST /auth/signup` con email y password (el `name` es opcional; se deriva del email).  
   - `POST /auth/login` → copia el `access_token` y presiona **Authorize** en `/docs`.

2. **Datos base**  
   - Crea 1 **Truck** y 2 **Locations**.

3. **Órdenes**  
   - `POST /orders` con `{ "truck": "<idTruck>", "pickup": "<idPickup>", "dropoff": "<idDropoff>" }`.  
   - `GET /orders?expand=true` → debe listar solo las órdenes del usuario logueado.  
   - `PATCH /orders/:id/status` → `{ "status": "in_transit" }` y luego `{ "status": "completed" }`.  
   - `GET /orders/stats/status` → devuelve el conteo por estatus del usuario.
