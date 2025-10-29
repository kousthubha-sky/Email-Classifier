#!/usr/bin/env node
// One-off script to classify a single email using OpenAI Chat Completions
// Usage (Windows cmd):
//    set OPENAI_API_KEY=sk-... && node scripts\classify-one-email.js

const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.NEXT_PUBLIC_OPENAI_KEY;

if (!apiKey) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set.\nSet it and re-run:');
  console.error('  on Windows (cmd): set OPENAI_API_KEY=sk-... && node scripts\\classify-one-email.js');
  process.exit(1);
}

const sampleEmail = {
  from: 'amazon-orders@amazon.com',
  subject: 'Your Amazon.com order #123-456789-0',
  snippet: 'Your order has been shipped.',
  body: 'Your order #123-456789-0 has been shipped and will arrive tomorrow.'
};

const prompt = `
Classify the following email into one of these categories:
- important: Personal or work-related emails requiring immediate attention
- promotional: Sales, discounts, marketing campaigns
- social: Social networks, friends, family
- marketing: Marketing newsletters, notifications
- spam: Unwanted or unsolicited emails
- general: If none of the above match

Email Details:
From: ${sampleEmail.from}
Subject: ${sampleEmail.subject}
Content: ${sampleEmail.body || sampleEmail.snippet}

Respond with JSON only:
{
  "category": "chosen_category",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}
`;

(async () => {
  if (typeof fetch !== 'function') {
    console.warn('Warning: global fetch is not available in this Node runtime. Node 18+ is recommended.');
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an email classification expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '<unreadable>');
      console.error(`OpenAI API error: ${res.status} ${res.statusText}\n${errBody}`);
      process.exit(2);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content returned from OpenAI:', JSON.stringify(data, null, 2));
      process.exit(3);
    }

    try {
      const parsed = JSON.parse(content);
      console.log('Classification result (parsed JSON):');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (err) {
      console.log('OpenAI returned non-JSON content:');
      console.log(content);
    }
  } catch (error) {
    console.error('Request failed:', error);
    process.exit(4);
  }
})();
