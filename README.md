# Real-Time Ride Dispatch Platform

A Node.js microservices backend for ride dispatch with JWT auth, Redis-backed real-time updates, and an NGINX gateway. The backend is tuned to run on a low-resource EC2 instance without Kafka while preserving the existing auth, ride, and socket APIs used by the deployed frontend.

## Features

- Ride dispatch flow: request, accept, track, and complete.
- JWT authentication with customer and driver roles.
- Real-time ride updates through Socket.IO and Redis Pub/Sub.
- Lightweight event wrapper in ride-service for future SQS integration.
- Idle notification service with health endpoint and MongoDB connectivity.
- NGINX gateway routing for `/api/auth`, `/api/rides`, and `/socket.io`.

## Architecture

Client -> NGINX Gateway -> Microservices

- Auth Service: JWT auth and role-based access.
- Ride Service: ride lifecycle, Socket.IO, Redis Pub/Sub, lightweight event publishing.
- Notification Service: MongoDB-backed service kept deployable for future event ingestion.

## Tech Stack

- Backend: Node.js, Express
- Database: MongoDB
- Real-time: Socket.IO, Redis
- Gateway: NGINX
- Deployment target: AWS EC2, Vercel frontend

## Local Setup

1. Install dependencies for each backend service:

```bash
cd services/auth-service && npm install
cd ../ride-service && npm install
cd ../notification-service && npm install
```

2. Start Redis:

```bash
docker run -d -p 6379:6379 redis
```

3. Start the backend services:

```bash
cd services/auth-service && npm run dev
cd ../ride-service && npm run dev
cd ../notification-service && npm run dev
```

4. Start the NGINX gateway and point it at the same EC2 host ports:

- Auth service on `127.0.0.1:5001`
- Ride service on `127.0.0.1:5002`
- Socket.IO on `127.0.0.1:5002`

## Environment Notes

Use service-level `.env` files based on the `.env.example` files.

- `CORS_ORIGIN=https://your-frontend.vercel.app`
- `REDIS_URL=redis://127.0.0.1:6379`
- `USE_SQS=false`
- `BASE_URL=http://<EC2_PUBLIC_IP>`

If `CORS_ORIGIN` is unset, auth-service and ride-service fall back to permissive CORS for initial bootstrap. If it is set, credentialed CORS is enabled for that origin.

## API Endpoints

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login`

Ride:
- `POST /api/rides`
- `POST /api/rides/accept`
- `POST /api/rides/status`
- `GET /api/rides/available`
- `GET /api/rides/my`
- `GET /api/rides/:rideId/location`

Notification:
- `GET /health`

## EC2 Deployment Notes

- Keep NGINX as the public backend entrypoint.
- Keep Redis on the same EC2 host unless you already use a managed Redis instance.
- Kafka is no longer required for backend startup.
- The deployed Vercel frontend should target the gateway base URL, for example `http://<EC2_PUBLIC_IP>`.
