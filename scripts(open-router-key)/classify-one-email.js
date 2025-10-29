#!/usr/bin/env node
// One-off script to classify a single email using OpenAI Chat Completions
// Usage (Windows cmd):
//    set OPENAI_API_KEY=sk-... && node scripts\classify-one-email.js

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('ERROR: OPENROUTER_API_KEY environment variable is not set.\nSet it and re-run:');
  console.error('  on Windows (cmd): set OPENROUTER_API_KEY=sk-... && node scripts\\classify-one-email.js');
  console.error('\nGet a free key at: https://openrouter.ai/keys');
  process.exit(1);
}

const sampleEmails = [
  {
    type: 'important work',
    from: 'boss@company.com',
    subject: 'Urgent: Project Deadline Update',
    body: 'Team, we need to move up the deadline for the client presentation to next Tuesday. Please update your schedules accordingly.'
  },
  {
    type: 'promotional',
    from: 'marketing@store.com',
    subject: 'Flash Sale! 24 Hours Only',
    body: 'Don\'t miss out! Get 50% off all items in our winter collection. Use code WINTER50 at checkout.'
  },
  {
    type: 'social',
    from: 'jane.smith@gmail.com',
    subject: 'Birthday party this weekend!',
    body: 'Hey! Hope you can make it to my birthday celebration this Saturday at 7pm. Let me know if you\'re coming!'
  },
  {
    type: 'marketing',
    from: 'newsletter@techblog.com',
    subject: 'Weekly Tech Digest: AI Updates',
    body: 'This week in tech: Latest developments in AI, New programming languages on the rise, Top 10 developer tools for 2025'
  },
  {
    type: 'spam',
    from: 'prince@foreign.example',
    subject: 'URGENT: You have won $1,000,000!!!',
    body: 'Dear Sir/Madam, I am contacting you regarding your LOTTERY WINNING of $1,000,000. Please send your details to claim...'
  }
];

const classifyEmail = async (email) => {
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
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',  // Required by OpenRouter
        'X-Title': 'Email Classifier'  // Optional but recommended
      },
      body: JSON.stringify({
        model: 'mistralai/mixtral-8x7b-instruct',  // Free model
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
      return parsed;
    } catch (error) {
      console.log('API returned non-JSON content:');
      console.log(content);
      return null;
    }
  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
};

(async () => {
  if (typeof fetch !== 'function') {
    console.warn('Warning: global fetch is not available in this Node runtime. Node 18+ is recommended.');
  }

  console.log('Testing email classification with multiple email types...\n');

  for (const email of sampleEmails) {
    console.log(`\n=== Testing ${email.type} email ===`);
    console.log(`From: ${email.from}`);
    console.log(`Subject: ${email.subject}`);
    
    const result = await classifyEmail(email);
    if (result) {
      console.log('\nClassification result:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\nClassification failed');
    }
    
    // Add a small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();
