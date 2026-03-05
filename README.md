# DeAIPro: Bittensor Intelligence Analytics Platform

A cutting-edge real-time analytics and intelligence dashboard for the Bittensor ecosystem. DeAIPro delivers live subnet metrics, tokenomics analysis, and market intelligence all powered by dynamic data fetches from the Bittensor SDK, TaoStats, and community sources.

## Features

- Live Subnet Analytics: Real-time metrics from 58+ active Bittensor subnets (emissions, valuations, performance scores)
- Market Intelligence: TAO price, market cap
- Curated News Feed: Aggregated news from TAO Daily, X/Twitter, and community sources
- Research & Education: In-depth lessons on Bittensor architecture, economics, and participation strategies
- Premium Access Control: Tiered authentication (public / authenticated / admin) with request-based access workflows
- MongoDB Persistence: Persistent caching across server restarts and multi-instance deployments
- Production-Ready: Rate limiting, structured logging, Sentry error tracking, and comprehensive test coverage

### Prerequisites

- Python 3.9+
- MongoDB Atlas account (or local MongoDB for development)
- Environment variables:

1. Firebase Authentication
2. Google Application Credentials
3. TaoStats API
4. Frontend CORS
5. Sentry DSN (For logging and tracking)

- Bittensor SDK Configuration (Optional - uses public subtensor if not set)

## Security Features

### Rate Limiting (SlowAPI)

- 100 requests / minute per IP address
- 1000 requests / day per authenticated user
- Graceful 429 responses with `Retry-After` header

### Input Validation

- Pydantic models for all request/response schemas
- Email validation on access requests
- SQL injection protected (no SQL queries)

### Logging & Monitoring

- Structured logging (structlog) with JSON output
- Error tracking (Sentry) for production issues
- All sensitive data (API keys, user IPs) sanitized before logging

### CORS & HTTPS

- CORS allowed for: `localhost:5173`, `de-ai-pro.vercel.app`
- HTTPS enforced in production
- Secure cookies (HttpOnly, SameSite=Lax)

## License

This project is licensed under the MIT License see [LICENSE](LICENSE) file for details.
