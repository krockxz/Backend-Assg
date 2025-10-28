# Bitespeed - Identity Reconciliation Service

A Node.js/TypeScript service that consolidates customer identities across multiple purchases using different contact information (email and phone numbers).

## Overview

The service helps Bitespeed maintain a unified view of customers who make purchases with different email addresses or phone numbers. It links contacts that share either an email or phone number, treating the oldest contact as "primary" and newer ones as "secondary".

## API Endpoint

### POST /identify

Consolidates customer identity information based on provided email and/or phone number.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phoneNumber": "string|number (optional)"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@email.com", "secondary@email.com"],
    "phoneNumbers": ["123456", "789012"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Features

- Identity reconciliation based on email or phone number matching
- Automatic linking of related contacts
- Primary/secondary contact hierarchy based on creation time
- Handles complex linking scenarios (multiple primary contacts becoming linked)
- SQLite database for persistence
- Input validation and error handling

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bitespeed-identity-reconciliation.git
cd bitespeed-identity-reconciliation
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Running Locally

1. Start the server:
```bash
npm start
```

The server will start on port 3001 (or PORT environment variable if set).

2. Test the health endpoint:
```bash
curl http://localhost:3001/health
```

## Development

Run in development mode with hot reload:
```bash
npm run dev
```

## Testing Examples

### Create a new contact:
```bash
curl -X POST http://localhost:3001/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
```

### Link to existing contact:
```bash
curl -X POST http://localhost:3001/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
```

## Database Schema

The service uses SQLite with a single `Contact` table:

```sql
CREATE TABLE Contact (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT NOT NULL CHECK(linkPrecedence IN ('primary', 'secondary')),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  deletedAt DATETIME,
  FOREIGN KEY (linkedId) REFERENCES Contact(id)
);
```

## Deployment

### Using Render.com

1. Create a free account on [Render](https://render.com/)
2. Connect your GitHub repository
3. Create a new "Web Service"
4. Set the following:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Free
5. Deploy!

Your service will be available at: `https://your-app-name.onrender.com`

### Using Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize project: `railway init`
4. Deploy: `railway up`

### Using Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`

## Environment Variables

- `PORT`: Server port (default: 3001)

## Live Endpoint

The service is deployed and available at: **https://bitespeed-identity-reconciliation.onrender.com/identify**

Example usage:
```bash
curl -X POST https://bitespeed-identity-reconciliation.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```