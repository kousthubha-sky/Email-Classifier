export interface ClassificationResult {
  category: 'important' | 'promotional' | 'social' | 'marketing' | 'spam' | 'general';
  confidence: number;
  reasoning: string;
}

export class OpenAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  // Basic sleep helper with Promise
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Classify a single email with retry/backoff for transient errors (e.g., rate limits).
  // If the OpenAI API reports insufficient_quota, surface that immediately (no retries).
  async classifyEmail(email: {
    subject: string;
    from: string;
    body: string;
    snippet: string;
  }): Promise<ClassificationResult> {
    const prompt = `
Classify the following email into one of these categories:
- important: Personal or work-related emails requiring immediate attention
- promotional: Sales, discounts, marketing campaigns
- social: Social networks, friends, family
- marketing: Marketing newsletters, notifications
- spam: Unwanted or unsolicited emails
- general: If none of the above match

Email Details:
From: ${email.from}
Subject: ${email.subject}
Content: ${email.body || email.snippet}

Respond with JSON only:
{
  "category": "chosen_category",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}
`;

    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an email classification expert. Always respond with valid JSON.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 200,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error('OpenAI returned no content in choices');
          }
          return JSON.parse(content) as ClassificationResult;
        }

        // Non-OK: parse body if possible for structured error info
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        // If the error explicitly indicates insufficient quota, bail out immediately
        const errType = errorData?.error?.type || errorData?.type || errorData?.error?.code;
        if (errType === 'insufficient_quota' || errType === 'insufficient_quota_error') {
          throw new Error(
            `OpenAI insufficient quota: ${JSON.stringify(errorData)}. Check your OpenAI billing/plan.`
          );
        }

        // If 429 (rate limit), we can retry (respect Retry-After header if present)
        if (response.status === 429 && attempt < maxAttempts) {
          const retryAfter = response.headers.get('retry-after');
          let waitMs = 1000 * Math.pow(2, attempt - 1); // exponential backoff base
          if (retryAfter) {
            const parsed = Number(retryAfter);
            if (!Number.isNaN(parsed)) {
              waitMs = parsed * 1000;
            }
          }
          // add small jitter
          waitMs += Math.floor(Math.random() * 300);
          console.warn(`Rate limited by OpenAI. Waiting ${waitMs}ms before retry (attempt ${attempt}).`);
          await this.sleep(waitMs);
          continue; // try again
        }

        // For other 5xx server errors we may retry as well
        if (response.status >= 500 && response.status < 600 && attempt < maxAttempts) {
          const waitMs = 1000 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 300);
          console.warn(`OpenAI server error ${response.status}. Retrying after ${waitMs}ms (attempt ${attempt}).`);
          await this.sleep(waitMs);
          continue;
        }

        // Otherwise, throw with details
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      } catch (error) {
        // If we've exhausted attempts, rethrow. Otherwise, attempt loop will retry.
        const isLast = attempt === maxAttempts;
        console.error(`Attempt ${attempt} failed for classifyEmail:`, error);
        if (isLast) {
          throw error;
        }
        // Small backoff before the next attempt (in case fetch itself failed)
        const waitMs = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
        await this.sleep(waitMs);
      }
    }

    // Shouldn't reach here, but satisfy TS
    throw new Error('Failed to classify email after retries');
  }

  async classifyMultipleEmails(emails: Array<{subject: string; from: string; body: string; snippet: string}>): Promise<Array<ClassificationResult & {emailId: string}>> {
    // Process emails sequentially to avoid rate limits
    const results = [];
    
    for (let i = 0; i < emails.length; i++) {
      try {
        const result = await this.classifyEmail(emails[i]);
        results.push({
          ...result,
          emailId: emails[i].subject + emails[i].from, // Simple ID
        });
        
        // Add delay to avoid rate limiting
        if (i < emails.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Increased to 500ms
        }
      } catch (error) {
        console.error(`Failed to classify email ${i}:`, error);
        // Add fallback classification
        results.push({
          category: 'general' as ClassificationResult['category'],
          confidence: 0.5,
          reasoning: 'Classification failed, using general as fallback',
          emailId: emails[i].subject + emails[i].from,
        });
      }
    }
    
    return results;
  }
}