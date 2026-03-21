# Bamboost Frontend (Next.js)

This project uses Next.js App Router and is split into multiple pages:

- `/onboard` for splash and username onboarding
- `/home` for main menu challenge selection
- `/challenge/[slug]` for the coding workspace

## Requirements

- Node.js 20+

## Environment Variables

Create `.env.local` and set:

`GEMINI_API_KEY=your_api_key`

The Gemini key is consumed on server-side only through `src/app/api/hint/route.ts`.

## Run Locally

1. Install dependencies:
   `npm install`
2. Start development server:
   `npm run dev`
3. Open:
   `http://localhost:3000/onboard`

## Build

- Production build: `npm run build`
- Start production server: `npm run start`
