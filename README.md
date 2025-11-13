# Backend API

Simple Express server providing health endpoints for the portfolio.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The server listens on port `3000` by default. Override by setting the `PORT` environment variable.

## Configuration

Create a `.env` file alongside `package.json` and populate the following keys:

```
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/
MONGO_DB_NAME=portfolio
JWT_SECRET=change-me
CORS_ORIGIN=http://localhost:5173
```

Restart the dev server after changing environment variables.

## Production

```bash
npm start
```

Available routes:

- `GET /` — returns a JSON payload confirming the server is running plus database status.
- `GET /health` — provides service health (`healthy`/`degraded`) and MongoDB connection status.

