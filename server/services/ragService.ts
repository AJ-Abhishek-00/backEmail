import { createClient } from '@supabase/supabase-js';
import { generateEmailEmbedding, generateSuggestedReply } from './aiService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function storeProductContext(
  userId: string,
  productName: string,
  description: string,
  outreachAgenda: string,
  meetingLink?: string,
  additionalContext?: string
) {
  try {
    const fullContext = `Product: ${productName}\n\nDescription: ${description}\n\nOutreach Agenda: ${outreachAgenda}\n\nAdditional Context: ${additionalContext || 'N/A'}`;

    const embedding = await generateEmailEmbedding(fullContext);

    const { data, error } = await supabase
      .from('product_context')
      .upsert({
        user_id: userId,
        product_name: productName,
        description,
        outreach_agenda: outreachAgenda,
        meeting_link: meetingLink,
        additional_context: additionalContext,
        embedding: JSON.stringify(embedding),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing product context:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in storeProductContext:', error);
    throw error;
  }
}

export async function getSuggestedReplyForEmail(
  emailId: string,
  userId: string
): Promise<string> {
  try {
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select(`
        *,
        email_accounts!inner(user_id)
      `)
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      throw new Error('Email not found');
    }

    if (email.email_accounts.user_id !== userId) {
      throw new Error('Unauthorized access to email');
    }

    const { data: contexts, error: contextError } = await supabase
      .from('product_context')
      .select('*')
      .eq('user_id', userId);

    if (contextError || !contexts || contexts.length === 0) {
      throw new Error('No product context found. Please set up your product context first.');
    }

    const context = contexts[0];

    const emailContent = `Subject: ${email.subject}\n\nFrom: ${email.from_name || email.from_address}\n\nBody: ${email.body_text}`;

    const productContext = `Product Name: ${context.product_name}
Description: ${context.description}
Outreach Agenda: ${context.outreach_agenda}
${context.additional_context ? `Additional Context: ${context.additional_context}` : ''}`;

    const suggestedReply = await generateSuggestedReply(
      emailContent,
      productContext,
      context.meeting_link
    );

    return suggestedReply;
  } catch (error) {
    console.error('Error generating suggested reply:', error);
    throw error;
  }
}

export async function searchSimilarEmails(emailContent: string, userId: string, limit = 5) {
  try {
    const embedding = await generateEmailEmbedding(emailContent);

    const { data, error } = await supabase.rpc('search_similar_emails', {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.7,
      match_count: limit,
      user_id: userId,
    });

    if (error) {
      console.error('Error searching similar emails:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchSimilarEmails:', error);
    return [];
  }
}
