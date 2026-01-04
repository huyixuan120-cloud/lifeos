import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';

export const maxDuration = 30;

// 1. Definiamo gli schemi PRIMA per evitare errori di serializzazione
const GetEventsSchema = z.object({
  date: z.string().describe("Date in YYYY-MM-DD format. If omitted, fetches upcoming events.").nullable().default(null as any),
});

const CreateEventSchema = z.object({
  title: z.string().describe("Title of the event"),
  start: z.string().describe("Start time (ISO 8601: YYYY-MM-DDTHH:mm:ss)"),
  end: z.string().describe("End time (ISO 8601: YYYY-MM-DDTHH:mm:ss)"),
  description: z.string().describe("Optional details").default(""),
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 2. Configurazione AI con gestione errori integrata
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages,
      maxSteps: 5, // Permette all'AI di usare i tool e poi risponderti
      system: "You are LifeOS, a helpful productivity assistant. Always confirm when an action is taken. Today's date is " + new Date().toISOString().split('T')[0],
      tools: {
        getCalendarEvents: tool({
          description: 'Get calendar events',
          parameters: GetEventsSchema,
          execute: async ({ date }) => {
            try {
              const supabase = await createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return "Error: User not authenticated";

              let query = supabase.from('events').select('*').eq('user_id', user.id);

              if (date && date !== null) {
                // Filtro semplice per la data specifica
                const startDay = `${date}T00:00:00`;
                const endDay = `${date}T23:59:59`;
                query = query.gte('start', startDay).lte('start', endDay);
              } else {
                // Altrimenti prendi i futuri
                query = query.gte('start', new Date().toISOString());
              }

              const { data, error } = await query.limit(10);
              if (error) throw error;
              if (!data || data.length === 0) return "No events found.";
              return JSON.stringify(data);
            } catch (err: any) {
              return `Database Error: ${err.message}`;
            }
          },
        }),
        createCalendarEvent: tool({
          description: 'Create a calendar event',
          parameters: CreateEventSchema,
          execute: async ({ title, start, end, description }) => {
            try {
              const supabase = await createClient();
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return "Error: User not authenticated";

              const { data, error } = await supabase.from('events').insert({
                user_id: user.id,
                title,
                start,
                end,
                description: description || '',
              }).select();

              if (error) throw error;
              return `Event created: ${JSON.stringify(data)}`;
            } catch (err: any) {
              return `Database Error: ${err.message}`;
            }
          },
        }),
      },
    });

    // 3. RESTITUIAMO SOLO TESTO PURO (Fix definitivo per "Thinking...")
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error: any) {
    // 4. Se il server esplode, lo diciamo al frontend invece di stare zitti
    console.error("SERVER CRASH:", error);
    return new Response(`🚨 SYSTEM ERROR: ${error.message}`, {
      status: 200, 
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}