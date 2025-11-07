import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-nano'; // Fastest and cheapest model

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const { description } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an Ops & QA developer whose responsibility is to review task requests from team members and convert each free-form description into a clear task title and a concise description.

Requirements:
1. Output MUST be valid JSON only — no extra commentary, no backticks, no explanation.
2. Output fields:
   {
     "taskName": <string>,
     "description": <string>,
     "url": <string>
   }
3. taskName rules:
   - 5–8 words maximum.
   - Use an action + object format (verb first) e.g., "Refactor Auth Token Handler".
   - Remove filler words, make it specific and actionable.
   - Keep technical accuracy and professional tone.
4. description rules:
   - 1–3 short sentences (max ~30–40 words).
   - Expand the taskName just enough to include scope, key files/components affected, and expected outcome or acceptance criteria when obvious.
   - Avoid vague language; include one clear deliverable or goal.
5. If the input includes environment, priority, or steps, reflect those concisely in the description.
6. If information is missing, make a conservative, reasonable assumption and note it concisely in parentheses (e.g., "(assume backend API)"). Do not ask follow-up questions.
7. If there's a url input, extract it and include it in the "url" field

Output: JSON with "taskName", "description", and "url" fields. If no URL is found in the input, set "url" to an empty string.
`;

    const client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Use Responses API with structured JSON schema output
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'task_description',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              taskName: {
                type: 'string',
                description: 'The name/title of the task. 5-8 words maximum, action verb first format.',
              },
              description: {
                type: 'string',
                description: 'A brief description of what the task entails. 1-3 sentences, 30-40 words max.',
              },
              url: {
                type: 'string',
                description: 'URL from the input if present',
              },
            },
            required: ['taskName', 'description', 'url'],
            additionalProperties: false,
          },
        },
        verbosity: 'low',
      },
      reasoning: {
        effort: 'low',
        summary: null,
      },
      tools: [],
      store: true,
      include: [
        'reasoning.encrypted_content',
        'web_search_call.action.sources',
      ],
    });

    // Extract the output from structured JSON schema response
    // With structured output, the response should already be valid JSON
    let parsed: { taskName: string; description: string; url: string };
    
    try {
      // Try to get output_text first (for structured output)
      const outputText = response.output_text?.trim();
      
      if (outputText) {
        // Parse the JSON response
        parsed = JSON.parse(outputText);
      } else {
        // Fallback: try to extract from output array
        const output = response.output;
        if (output && output.length > 0) {
          const firstOutput = output[0];
          // Check if it's a message type with content
          if ('content' in firstOutput && Array.isArray(firstOutput.content)) {
            const textItem = firstOutput.content.find((item: any) => item.type === 'output_text');
            if (textItem && 'text' in textItem) {
              parsed = JSON.parse(textItem.text);
            } else {
              throw new Error('No text content in response');
            }
          } else {
            throw new Error('Unexpected response format');
          }
        } else {
          throw new Error('No output in response');
        }
      }
      
      // Validate the response structure
      if (!parsed.taskName || !parsed.description || parsed.url === undefined) {
        return NextResponse.json(
          { error: 'Invalid response format from OpenAI' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        taskName: parsed.taskName,
        description: parsed.description,
        url: parsed.url || '',
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', response);
      return NextResponse.json(
        { error: 'Failed to parse OpenAI response' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in rephrase API:', error);
    return NextResponse.json(
      { error: `Failed to rephrase description: ${error.message}` },
      { status: 500 }
    );
  }
}

