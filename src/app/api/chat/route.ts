import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Helper function to generate mock calendar events
 * Used as fallback when Supabase is not configured or errors occur
 */
function getMockEvents(date?: string) {
  const today = new Date();
  const targetDate = date ? new Date(date) : today;

  return [
    {
      id: 'mock-1',
      title: 'Team Standup',
      start: new Date(targetDate.setHours(9, 0, 0)).toISOString(),
      end: new Date(targetDate.setHours(9, 30, 0)).toISOString(),
      description: 'Daily team sync',
      allDay: false,
    },
    {
      id: 'mock-2',
      title: 'LifeOS Development Session',
      start: new Date(targetDate.setHours(10, 0, 0)).toISOString(),
      end: new Date(targetDate.setHours(12, 0, 0)).toISOString(),
      description: 'Focus time for coding',
      allDay: false,
    },
    {
      id: 'mock-3',
      title: 'Lunch Break',
      start: new Date(targetDate.setHours(12, 30, 0)).toISOString(),
      end: new Date(targetDate.setHours(13, 30, 0)).toISOString(),
      description: null,
      allDay: false,
    },
  ];
}

/**
 * LifeOS AI Chat API Route
 *
 * Handles streaming chat completions using OpenAI via Vercel AI SDK.
 * The AI acts as LifeOS - a personal assistant for productivity and organization.
 *
 * Tool Calling:
 * - getCalendarEvents: Retrieves user's calendar events from Supabase
 */
export async function POST(req: Request) {
  console.log('🔥 HIT: /api/chat endpoint reached');
  console.log('📨 POST /api/chat - Request received');

  try {
    const { messages } = await req.json();
    console.log('💬 Messages received:', messages?.length || 0);

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('❌ FATAL: No OpenAI API Key found in environment');
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ OpenAI API key found');

    // SIMPLIFIED System prompt for LifeOS AI (NO TOOLS FOR DEBUGGING)
    const systemPrompt = `You are LifeOS, an intelligent personal assistant focused on productivity, organization, and life management.

Your capabilities include:
- Helping users plan their day and manage tasks
- Providing insights on time management and focus
- Suggesting strategies for achieving goals
- Organizing thoughts and ideas
- Offering motivation and accountability

Communication style:
- Be concise but helpful
- Use a friendly, professional tone
- Provide actionable advice
- Support the user's growth and productivity journey

Remember: You are an overlay assistant for the LifeOS productivity system.`;

    // Stream the AI response - SIMPLIFIED (NO TOOLS FOR DEBUGGING)
    console.log('🚀 Calling streamText with basic config (no tools)');
    const result = await streamText({
      model: openai('gpt-4o-mini'), // Using gpt-4o-mini for cost efficiency
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 1000,
      // TOOLS COMPLETELY REMOVED FOR DEBUGGING
    });

    console.log('✅ streamText completed successfully');
    console.log('📤 Returning streaming response to client');

    // Return the streaming response
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('❌ Error in chat API:', error);

    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check if it's an OpenAI API error
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error('Error cause:', error.cause);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
