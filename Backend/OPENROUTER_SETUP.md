# OpenRouter AI Integration Setup Guide

## Overview
This guide explains how to set up OpenRouter as your AI provider for the Forge AI Fitness App. OpenRouter offers free-tier access to high-quality AI models, making it perfect for your fitness app's AI coach features.

## Why Choose OpenRouter?

### Free Tier Benefits:
- **20 requests/minute** limit
- **1,000 requests/day** per account
- **No credit card required** for signup
- Access to top-ranked models like Kimi K3 (highest-rated free model)

### Model selection:
Use OpenRouter's free-model router (`openrouter/free`) so the app does not pin itself to a model ID that may later be retired. You can configure a specific model ID if you verify it is currently listed in OpenRouter.

## Step-by-Step Setup

### Step 1: Get an OpenRouter API Key

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up (no credit card required)
3. Navigate to your API keys section
4. Create a new API key
5. Copy the key (it looks like `sk-or-v1-...`)

### Step 2: Configure Environment Variables

Copy the example file and update with your API key:

```bash
cd Backend
cp .env.example .env
```

Edit `.env` and set:

```env
# Enable AI features
AI_ENABLED=true

# Use OpenRouter as the provider
AI_PROVIDER=openrouter

# Your OpenRouter API key
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Step 3: Set Recommended Free Tier Values

```env
# Recommended model routing (free tier)
OPENROUTER_MODEL=openrouter/free
OPENROUTER_FALLBACK_MODEL=openrouter/free

# Free tier limits (20 RPM, 1000 RPD)
OPENROUTER_MAX_REQUESTS_PER_MINUTE=20
OPENROUTER_MAX_REQUESTS_PER_DAY=1000
OPENROUTER_MAX_INPUT_TOKENS_PER_MINUTE=60000
OPENROUTER_MAX_OUTPUT_TOKENS=1500

# Request timeout (30 seconds)
AI_REQUEST_TIMEOUT_MS=30000
```

### Step 4: Start the Server

```bash
npm run dev
```

The server should start and AI features will be enabled.

## Testing Your Setup

### Test Workout Generation
Make a POST request to:
```
POST /api/ai/workout/generate
```

With body:
```json
{
  "mode": "custom",
  "targetMuscles": ["chest", "shoulders"],
  "preferredEquipment": ["dumbbell"],
  "durationMinutes": 30
}
```

### Test Coach Insight Generation
Make a POST request to:
```
POST /api/ai/coach/insights
```

## Troubleshooting

### Error: "OPENROUTER_API_KEY is missing"
- Ensure your `.env` file is in the `Backend/` directory
- Double-check the API key copied from OpenRouter
- Restart the server after making changes

### Error: "AI service is unavailable"
This could be due to:
1. OpenRouter service outage - check [status.openrouter.ai](https://status.openrouter.ai)
2. Rate limit exceeded - wait a minute or upgrade to paid tier
3. Invalid API key - regenerate from OpenRouter dashboard

### Rate Limit Errors (429)
- Free tier allows 20 requests/minute
- Implement a cooldown in your frontend
- Consider upgrading to a paid OpenRouter plan for higher limits

## Switching Back to Gemini

If you want to use Gemini instead:

1. Get a Google AI Studio API key from [aistudio.google.com](https://aistudio.google.com)
2. Update your `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key-here
```

## Model Comparison for Fitness Coaching

| Model | Strengths | Free Tier |
|-------|-----------|-----------|
| Kimi K3 | Best overall quality, great JSON output | 2M chars/day |
| DeepSeek V3 | Good reasoning, code understanding | 100 requests/day |
| Gemini 2.0 | Google's model, good at instructions | 60 requests/day |

## Cost Management

OpenRouter's free tier provides generous limits:
- 1000 requests/day ≈ 33 requests/hour
- ~100 workout generations + insights per day

This should accommodate most users on a free plan. The app already includes:
- Trial period tracking
- Usage quotas per user
- Caching for common requests

## Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Available Models List](https://openrouter.ai/models)
- [API Reference](https://openrouter.ai/api-reference)
