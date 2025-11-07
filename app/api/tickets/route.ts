import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { Ticket, TicketSubmissionPayload } from '@/types';

export async function GET() {
  try {
    const projectsData = await supabaseRequest('project', {
      params: 'select=id,projectName',
    });
    const projectMap = projectsData.reduce((map: Record<number, string>, p: any) => {
      map[p.id] = p.projectName;
      return map;
    }, {});

    const usersData = await supabaseRequest('user', {
      params: 'select=id,name',
    });
    const userMap = usersData.reduce((map: Record<number, string>, u: any) => {
      map[u.id] = u.name;
      return map;
    }, {});

    const ticketsData = await supabaseRequest('ticket', {
      params: 'select=*&order=id.desc',
    });

    const allTickets: Ticket[] = ticketsData.map((t: any) => ({
      id: t.id,
      title: t.title || '',
      projectName: t.projectId ? projectMap[t.projectId] : 'No Project',
      requestedBy: t.requestedBy || '',
      priority: t.priority || 'Medium',
      type: t.type || 'Request',
      status: t.status || 'Open',
      assignee: t.assigneeId ? userMap[t.assigneeId] : '',
      description: t.description || '',
      createdAt: t.createdAt || '',
      assignedAt: t.assignedAt || '',
      completedAt: t.completedAt || '',
      relevantLink: t.relevantLink,
    }));

    return NextResponse.json(allTickets);
  } catch (error: any) {
    console.error('Error in getAllTickets:', error);
    return NextResponse.json(
      { error: `Failed to fetch ticket data. Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload: TicketSubmissionPayload = await request.json();

    // Get max ID
    const maxIdResponse = await supabaseRequest('ticket', {
      params: 'select=id&order=id.desc&limit=1',
    });
    
    let nextId = 1;
    if (maxIdResponse && maxIdResponse.length > 0 && maxIdResponse[0].id) {
      const maxId = parseInt(maxIdResponse[0].id, 10);
      if (!isNaN(maxId)) {
        nextId = maxId + 1;
      }
    }

    const ticketsToInsert = [];
    const nowISO = new Date().toISOString();

    for (const ticket of payload.tickets) {
      const dataToStore = {
        id: nextId,
        title: ticket.title,
        description: ticket.description,
        requestedBy: payload.requester,
        priority: ticket.priority,
        type: ticket.type,
        status: 'Open',
        createdAt: nowISO,
        projectId: payload.projectId,
        assigneeId: payload.assignee ? parseInt(String(payload.assignee), 10) : null,
        assignedAt: payload.assignee ? nowISO : null,
        relevantLink: ticket.url || null,
      };
      ticketsToInsert.push(dataToStore);
      nextId++;
    }

    const insertedTickets = await supabaseRequest('ticket', {
      method: 'POST',
      payload: ticketsToInsert,
    });

    if (!insertedTickets || insertedTickets.length === 0) {
      throw new Error('Failed to insert tickets or retrieve their new IDs.');
    }

    // Send Discord notification
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl) {
      try {
        const ticketCount = insertedTickets.length;
        const pluralS = ticketCount > 1 ? 's' : '';
        let assigneeDiscordId = null;
        let contentMessage = '';

        // Determine assignee and content ping
        if (payload.assignee) {
          try {
            const userData = await supabaseRequest('user', {
              params: `select=discordId&id=eq.${payload.assignee}`,
            });
            if (userData && userData.length > 0 && userData[0].discordId) {
              assigneeDiscordId = userData[0].discordId;
              contentMessage = `Hi <@${assigneeDiscordId}>, a new ticket has been assigned to you.`;
            }
          } catch (e) {
            console.error('Could not fetch discordId for assignee', e);
          }
        }

        if (!contentMessage && payload.assigneeName) {
          // Assignee was selected but not found in Discord, so mention by name
          contentMessage = `Hi ${payload.assigneeName}, a new ticket has been assigned to you.`;
        } else if (!contentMessage) {
          // No assignee, use default message
          contentMessage = `${payload.requester} created ${ticketCount} new ticket${pluralS}!`;
        }

        // Build the description for the embed
        const webAppUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://techtool-app.vercel.app';
        const description = insertedTickets.map((ticket: any) => {
          const ticketUrl = `${webAppUrl}/all-tickets?ticket=HRB-${ticket.id}`;
          const ticketLink = `[**[HRB-${ticket.id}] - ${ticket.title}**](${ticketUrl})`;

          const assigneeText = payload.assigneeName
            ? `Assignee: **${payload.assigneeName}**`
            : 'Assignee: Unassigned';

          const detailsText = `Type: ${ticket.type} | Priority: ${ticket.priority}`;

          return `${ticketLink}\n${assigneeText}\n${detailsText}`;
        }).join('\n\n');

        // Construct the embed object
        const embed = {
          author: {
            name: `${payload.requester} created ${ticketCount} new ticket${pluralS}!`,
          },
          description: description,
          color: 31415, // #007aff
          footer: {
            text: 'TechTool Notification System',
          },
          timestamp: new Date().toISOString(),
        };

        // Construct the final payload for Discord
        const discordPayload = {
          username: 'HarryBotter APP',
          avatar_url: 'https://drive.google.com/uc?export=download&id=1LE0v5c_VUERk5ZhW4laTa2S-A0pLcRnd',
          content: contentMessage,
          embeds: [embed],
        };

        // Send Discord notification
        const discordResponse = await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload),
        });

        if (!discordResponse.ok) {
          console.error('Failed to send Discord notification:', await discordResponse.text());
        }
      } catch (error: any) {
        console.error('Error sending Discord notification:', error);
        // Don't fail the request if Discord notification fails
      }
    }

    return NextResponse.json({
      message: `${insertedTickets.length} ticket(s) submitted successfully!`,
      ticketIds: insertedTickets.map((t: any) => t.id),
    });
  } catch (error: any) {
    console.error('Error in submitTickets:', error);
    return NextResponse.json(
      { error: `Failed to submit tickets. Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

