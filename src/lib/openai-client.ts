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

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
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

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return JSON.parse(content) as ClassificationResult;
    } catch (error) {
      console.error('OpenAI classification error:', error);
      throw error;
    }
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
          await new Promise(resolve => setTimeout(resolve, 200));
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