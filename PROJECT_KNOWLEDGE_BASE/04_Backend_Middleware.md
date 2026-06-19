# Backend Middlewares

This document details the custom Express middlewares implemented in the Smart Tourist Safety System, located in `backend-api/middleware/`.

---

## 1. Authentication Middleware (`auth.js`)

### Purpose
To intercept incoming HTTP requests, extract and verify JSON Web Tokens (JWT), and control access to protected routes. It provides both standard authentication and role-based authorization (Admin).

### Location
`backend-api/middleware/auth.js`

### Implementation Details & Functions

#### A. `auth(req, res, next)`
- **Workflow:** 
  1. Extracts the `authorization` header from the incoming request.
  2. Splits the string to isolate the Bearer token (`authHeader.split(' ')[1]`).
  3. Returns `401 Unauthorized` if the token is missing.
  4. Returns `500 Server Error` if `JWT_SECRET` is not configured in the environment.
  5. Uses `jwt.verify()` to validate the token cryptographically.
  6. If invalid/expired, returns `403 Forbidden`.
  7. If valid, attaches the decoded payload (containing `userId`, `email`, and `role`) to `req.user` and calls `next()` to pass control to the route handler.

#### B. `adminAuth(req, res, next)`
- **Workflow:**
  1. Performs the same initial token extraction and verification as `auth()`.
  2. Instead of immediately calling `next()`, it executes an asynchronous database query: `User.findById(decoded.userId)`.
  3. Checks if the user still exists in the DB (returning `404` if deleted since the token was issued).
  4. Verifies `dbUser.role === 'admin'`. If not, returns `403 Forbidden`.
  5. Attaches `decoded` to `req.user` and calls `next()`.

### Security & Developer Notes
- `adminAuth` performs a live database lookup. While this slightly increases the latency of admin routes, it is a crucial security measure. It ensures that if an admin's privileges are revoked, their existing JWT immediately loses admin access, rather than waiting for the token to expire.

---

## 2. Global Error Handling (`errorHandler.js`)

### Purpose
To catch all unhandled exceptions, mongoose validation errors, and JWT errors that occur during the request lifecycle, formatting them into consistent, structured JSON responses.

### Location
`backend-api/middleware/errorHandler.js`

### Imports
- `ResponseHandler` (`../utils/responseHandler`): A utility class/object used to standardize the JSON output format.

### Implementation Details & Functions

#### A. `globalErrorHandler(err, req, res, next)`
Acts as the final catch-all middleware in the Express chain. It intercepts `err` and uses a series of `if` blocks to identify specific error types and map them to standard HTTP status codes:
1. **Mongoose `CastError`:** Triggered when an invalid ObjectId is passed in a URL parameter. Mapped to `404 Not Found`.
2. **Mongoose Duplicate Key (`code === 11000`):** Triggered when attempting to register an email that already exists. Mapped to `400 Bad Request`.
3. **Mongoose `ValidationError`:** Triggered when schema constraints fail. Maps the nested `err.errors` object into a clean array of `{ path, message }` objects. Handled by `ResponseHandler.validationError`.
4. **JWT `JsonWebTokenError`:** Mapped to `401 Unauthorized` with "Invalid token".
5. **JWT `TokenExpiredError`:** Mapped to `401 Unauthorized` with "Token expired".
6. **Rate Limiting (`statusCode === 429`):** Explicitly caught and mapped to "Too many requests".
7. **Fallback:** Anything else is logged to the console and returned as a `500 Internal Server Error`.

#### B. `notFoundHandler(req, res, next)`
- **Workflow:** If a request passes through all defined routes without matching, it hits this middleware. It dynamically generates a message `"Route [url] not found"` and returns a `404 Not Found` using the ResponseHandler.

### Developer Notes
- The separation of error handling into this middleware keeps the individual route controllers exceptionally clean. Route handlers can simply throw errors or pass them to `next(err)` without worrying about formatting the HTTP response.
