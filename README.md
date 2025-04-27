
# Bug Identification App

An AI-powered application that helps users identify insects and learn about them using Google's Gemini AI technology.

## Features

- Real-time bug identification using camera
- Upload photos from gallery
- Detailed species information
- Personal logbook to track discoveries
- Environmental impact insights
- Weather-based insect prediction
- AI-powered threat assessment

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Express.js, Node.js
- AI: Google Gemini AI
- Database: Drizzle ORM with Neon Database
- Authentication: Passport.js

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://0.0.0.0:5000`

## Project Structure

- `/client` - React frontend application
- `/server` - Express backend server
- `/shared` - Shared TypeScript types and schemas
- `/public` - Static assets and images

## Environment Variables

The following environment variables are required:
- `GEMINI_API_KEY` - Google Gemini AI API key
- `WEATHER_API_KEY` - Weather API key

Set these up in the Secrets tab of your Repl.

## Deployment

Deploy directly through Replit's deployment feature for instant publishing.
