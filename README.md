# 12306 Railway Booking System Backend

This is the backend service for the 12306 Railway Booking System, built with Node.js and Express.

## Prerequisites

- **Node.js**: v16.0.0 or higher recommended.
- **Redis**: Optional. Used for session and user data storage. If not available, the system falls back to an in-memory store (data will be lost on restart).

## Project Structure

- `backend/`: The main backend application code.
- `backend/database/`: Contains `custom_train_data.json` used for train search.
- `database/`: Root database folder containing reference data (GBK JSONs and SQLite DB).

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   # On Windows Command Prompt: copy .env.example .env
   ```

2. Edit `.env` to configure your environment (optional).
   - `PORT`: Server port (default: 3000)
   - `DB_PATH`: Path to SQLite DB (Note: Currently, the system uses an in-memory SQLite database for user data, so this path might not be actively used for persistence).
   - `JSON_DB_INMEMORY`: Set to `1` to force in-memory mode even if Redis is available.

## Running the Application

To start the server in production mode:

```bash
npm start
```

To start the server in development mode (with hot reload):

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Database Information

- **User Data**: Managed via `sql.js` (in-memory) or Redis (if configured).
- **Train Data**: The system reads train schedules from `backend/database/custom_train_data.json`.

## Testing

To run the test suite:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```
