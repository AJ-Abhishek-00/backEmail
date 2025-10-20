import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CATEGORIES = [
  'Interested',
  'Meeting Booked',
  'Not Interested',
  'Spam',
  'Out of Office',
];

const CATEGORIZATION_PROMPT = `You are an email categorization AI. Analyze the following email and categorize it into one of these categories:

1. Interested - The sender shows interest in the product/service, asks questions, or wants to learn more
2. Meeting Booked - The email confirms or proposes a specific meeting time/date
3. Not Interested - The sender explicitly declines, opts out, or shows no interest
4. Spam - Irrelevant marketing, phishing attempts, or automated spam
5. Out of Office - Automated out-of-office or vacation reply

Respond ONLY with a JSON object in this format:
{"category": "one of the categories above", "confidence": 0.0-1.0, "reasoning": "brief explanation"}`;

export async function categorizeEmail(subject: string, bodyText: string): Promise<{
  category: string;
  confidence: number;
  reasoning?: string;
}> {
  try {
    const emailContent = `Subject: ${subject}\n\nBody: ${bodyText.substring(0, 1000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: CATEGORIZATION_PROMPT },
        { role: 'user', content: emailContent },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { category: 'Spam', confidence: 0.5 };
    }

    const result = JSON.parse(content);

    if (CATEGORIES.includes(result.category)) {
      return {
        category: result.category,
        confidence: result.confidence || 0.8,
        reasoning: result.reasoning,
      };
    }

    return { category: 'Spam', confidence: 0.5 };
  } catch (error) {
    console.error('Error categorizing email:', error);
    return { category: 'Spam', confidence: 0.5 };
  }
}

export async function generateEmailEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function generateSuggestedReply(
  emailContent: string,
  productContext: string,
  meetingLink?: string
): Promise<string> {
  try {
    const systemPrompt = `You are an AI assistant helping to generate professional email replies.

Context about our product/service:
${productContext}

${meetingLink ? `Meeting booking link: ${meetingLink}` : ''}

Generate a professional, friendly, and concise reply to the email. If the sender shows interest and a meeting link is provided, include it naturally in the response.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a reply to this email:\n\n${emailContent}` },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || 'Thank you for your email. We will get back to you soon.';
  } catch (error) {
    console.error('Error generating suggested reply:', error);
    throw error;
  }
}
