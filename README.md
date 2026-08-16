# Next.js AI Starter Kit

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0"/>
  <img src="https://img.shields.io/badge/next.js-14.0+-black.svg" alt="Next.js 14.0+"/>
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License"/>
  <img src="https://img.shields.io/badge/openai-edge-1.2+-green.svg" alt="OpenAI Edge 1.2+"/>
</p>

A cutting-edge Next.js starter kit with AI chat integration. Features OpenAI streaming responses, Edge Runtime support, and a modern React architecture for building intelligent conversational interfaces.

## What's Included

- Next.js 14 App Router with API routes
- OpenAI Edge streaming chat completion
- Streaming text response with AI SDK
- Edge Runtime for low-latency responses
- TypeScript API route implementation
- ESLint + Prettier code quality
- Jest + React Testing Library
- Docker multi-stage build with health checks
- CI/CD pipeline via GitHub Actions

## Features

- **AI Chat**: OpenAI GPT-4 streaming chat integration
- **Edge Runtime**: Deploy on Vercel Edge for global low latency
- **Streaming Responses**: Real-time token-by-token streaming
- **TypeScript**: Type-safe API routes and components
- **Modern Stack**: Next.js 14, React 18, AI SDK 2.0
- **Responsive UI**: Built-in chat interface components
- **Code Quality**: ESLint + Prettier enforced standards
- **Dockerized**: Multi-stage Dockerfile with HEALTHCHECK
- **CI/CD Ready**: GitHub Actions workflow

## Quick Start

### Prerequisites

- Node.js 20 or higher
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/amanhammadK/next-js-ai-starter-kit.git
cd next-js-ai-starter-kit

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
# Run test suite
npm test
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
next-js-ai-starter-kit/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── src/
│   └── app/
│       └── api/
│           └── chat/
│               └── route.ts    # Chat completion API route
├── __tests__/
│   └── index.test.js           # Test suite
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier configuration
├── Dockerfile                 # Multi-stage Docker build
├── eslint.config.js           # ESLint configuration
├── jest.config.js             # Jest configuration
├── package.json               # Project dependencies
└── README.md                  # This file
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for chat completion | Yes |
| `NEXT_PUBLIC_APP_URL` | Public URL of the application | No |

### API Configuration

The chat API route at `src/app/api/chat/route.ts` uses:

- OpenAI GPT-4 model (configurable)
- Edge Runtime for streaming
- OpenAIStream for response streaming

## Deployment

### Docker

```bash
# Build the image
docker build -t next-js-ai-starter .

# Run the container
docker run -p 3000:3000 --env-file .env next-js-ai-starter
```

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

The Edge Runtime is fully compatible with Vercel Edge Functions.

## Development Guide

### Customizing the AI Model

In `src/app/api/chat/route.ts`, change the model parameter:

```typescript
const response = await openai.createChatCompletion({
    model: "gpt-4-turbo",  // Or "gpt-3.5-turbo"
    stream: true,
    messages
});
```

### Adding System Prompts

```typescript
const messages = [
    { role: "system", content: "You are a helpful assistant." },
    ...userMessages
];
```

### Code Style

- ESLint with Next.js and Prettier configs
- TypeScript for API routes
- Run `npm run lint` before committing

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with Next.js and ❤️
</p>