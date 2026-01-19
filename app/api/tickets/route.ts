import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { Ticket, TicketSubmissionPayload } from '@/types';
import { generateETag, checkETag } from '@/lib/etag';

export async function GET(request: Request) {
  try {
    const projectsData = await supabaseRequest('projects', {
      params: 'select=id,name',
    });
    const projectMap = projectsData.reduce((map: Record<string, string>, p: any) => {
      map[p.id] = p.name;
      return map;
    }, {});

    const usersData = await supabaseRequest('users', {
      params: 'select=id,name,avatar_url',
    });
    const userMap = usersData.reduce((map: Record<string, { name: string; avatar: string }>, u: any) => {
      map[u.id] = { name: u.name, avatar: u.avatar_url };
      return map;
    }, {});

    // Only fetch necessary fields instead of select=* to reduce bandwidth
    const ticketsData = await supabaseRequest('tickets', {
      params: 'select=id,display_id,title,description,project_id,requested_by_id,assignee_id,priority,type,status,created_at,assigned_at,started_at,completed_at,updated_at,links,meta,department_id,due_date&order=created_at.desc',
    });

    // Helper function to convert database enum values to display format
    const formatPriority = (dbValue: string): 'Urgent' | 'High' | 'Medium' | 'Low' => {
      const lower = dbValue?.toLowerCase() || 'medium';
      if (lower === 'urgent') return 'Urgent';
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      if (lower === 'low') return 'Low';
      return 'Medium';
    };

    const formatType = (dbValue: string): 'Request' | 'Bug' | 'Task' => {
      const lower = dbValue?.toLowerCase() || 'request';
      if (lower === 'request') return 'Request';
      if (lower === 'bug') return 'Bug';
      if (lower === 'task') return 'Task';
      return 'Request';
    };

    const formatStatus = (dbValue: string): 'Open' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rejected' | 'On Hold' | 'Blocked' => {
      const lower = dbValue?.toLowerCase() || 'open';
      if (lower === 'open') return 'Open';
      if (lower === 'in_progress' || lower === 'in progress') return 'In Progress';
      if (lower === 'completed') return 'Completed';
      if (lower === 'cancelled' || lower === 'canceled') return 'Cancelled';
      if (lower === 'rejected') return 'Rejected';
      if (lower === 'on_hold' || lower === 'on hold') return 'On Hold';
      if (lower === 'blocked') return 'Blocked';
      return 'Open';
    };

    // OPTIMIZED: Minimize payload - remove description, duplicate fields, meta
    // Description is only needed in detail view, not list view
    const allTickets: Ticket[] = ticketsData.map((t: any) => {
      // Extract relevant link from links jsonb field
      let relevantLink: string | undefined;
      if (t.links && typeof t.links === 'object') {
        const linksArray = Array.isArray(t.links) ? t.links : Object.values(t.links);
        relevantLink = linksArray
          .filter((link: any) => typeof link === 'string' && link.trim())
          .join('\n');
      } else if (typeof t.links === 'string') {
        relevantLink = t.links;
      }

      return {
        id: t.id,
        display_id: t.display_id,
        title: t.title || '',
        projectName: t.project_id ? projectMap[t.project_id] : 'No Project',
        project_id: t.project_id,
        requestedBy: t.requested_by_id ? userMap[t.requested_by_id]?.name || '' : '',
        requested_by_id: t.requested_by_id,
        reporterAvatar: t.requested_by_id ? userMap[t.requested_by_id]?.avatar || '' : '',
        priority: formatPriority(t.priority),
        type: formatType(t.type),
        status: formatStatus(t.status),
        assignee: t.assignee_id ? userMap[t.assignee_id]?.name || '' : '',
        assignee_id: t.assignee_id,
        // REMOVED: description (only needed in detail view, saves bandwidth)
        description: t.description || '', // Keep for compatibility but could be removed
        created_at: t.created_at,
        // REMOVED: duplicate fields (createdAt, assignedAt, completedAt)
        // REMOVED: meta (not displayed in list view)
        relevantLink,
        due_date: t.due_date || null,
      };
    });

    // Generate ETag for conditional requests (304 Not Modified)
    const etag = generateETag(allTickets);
    const clientETag = request.headers.get('if-none-match');

    // If client has same data, return 304 (no body, saves bandwidth)
    if (checkETag(clientETag, etag)) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
        },
      });
    }

    // OPTIMIZED: Increased cache from 60s to 600s (10 minutes)
    // Added longer stale-while-revalidate (30 minutes)
    // Vercel automatically compresses responses with gzip/brotli
    return NextResponse.json(allTickets, {
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
      },
    });
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

    // Get all display_ids to find the max numeric value
    // We can't rely on text sorting since "HRB-1000" < "HRB-999" in text comparison
    const allDisplayIds = await supabaseRequest('tickets', {
      params: 'select=display_id&order=created_at.desc&limit=1000',
    });
    
    let nextDisplayId = 1;
    if (allDisplayIds && allDisplayIds.length > 0) {
      // Extract all numeric values from display_ids
      const numericIds: number[] = allDisplayIds
        .map((ticket: any) => {
          if (!ticket.display_id) return null;
          const match = String(ticket.display_id).match(/HRB-(\d+)/i);
          return match && match[1] ? parseInt(match[1], 10) : null;
        })
        .filter((id: number | null): id is number => id !== null && !isNaN(id));
      
      if (numericIds.length > 0) {
        const maxId = Math.max(...numericIds);
        nextDisplayId = maxId + 1;
      }
    }

    // Get requester ID from users table
    let requestedById: string | null = null;
    if (payload.requester) {
      try {
        const requesterData = await supabaseRequest('users', {
          params: `select=id&name=eq.${encodeURIComponent(payload.requester)}`,
        });
        if (requesterData && requesterData.length > 0) {
          requestedById = requesterData[0].id;
        }
      } catch (e) {
        console.error('Could not find requester ID', e);
      }
    }

    const ticketsToInsert = [];
    const nowISO = new Date().toISOString();

    // Helper function to convert display format to database enum values
    const toDbPriority = (displayValue: string): string => {
      const lower = displayValue?.toLowerCase() || 'medium';
      if (lower === 'urgent') return 'urgent';
      if (lower === 'high') return 'high';
      if (lower === 'medium') return 'medium';
      if (lower === 'low') return 'low';
      return 'medium';
    };

    const toDbType = (displayValue: string): string => {
      const lower = displayValue?.toLowerCase() || 'request';
      if (lower === 'request') return 'request';
      if (lower === 'bug') return 'bug';
      if (lower === 'task') return 'task';
      return 'request';
    };

    for (const ticket of payload.tickets) {
      // Build links jsonb field from url
      const links = ticket.url ? [ticket.url] : [];
      const dueDate = ticket.expectedDoneDate?.trim() ? ticket.expectedDoneDate : null;

      const dataToStore: any = {
        title: ticket.title,
        description: ticket.description,
        requested_by_id: requestedById,
        priority: toDbPriority(ticket.priority), // Convert to lowercase enum value
        type: toDbType(ticket.type), // Convert to lowercase enum value
        status: 'open', // Assuming status is also lowercase
        created_at: nowISO,
        project_id: payload.projectId || null,
        assignee_id: payload.assignee || null,
        assigned_at: payload.assignee ? nowISO : null,
        display_id: `HRB-${nextDisplayId}`,
        links: links,
        due_date: dueDate,
      };
      ticketsToInsert.push(dataToStore);
      nextDisplayId++;
    }

    const insertedTickets = await supabaseRequest('tickets', {
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
            const userData = await supabaseRequest('users', {
              params: `select=discord_id&id=eq.${payload.assignee}`,
            });
            if (userData && userData.length > 0 && userData[0].discord_id) {
              assigneeDiscordId = userData[0].discord_id;
              contentMessage = `Hi <@${assigneeDiscordId}>, a new ticket has been assigned to you.`;
            }
          } catch (e) {
            console.error('Could not fetch discord_id for assignee', e);
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
          const ticketDisplayId = ticket.display_id || `HRB-${ticket.id}`;
          const ticketUrl = `${webAppUrl}/tickets/${ticketDisplayId.toLowerCase()}`;
          const ticketLink = `[**[${ticketDisplayId}] - ${ticket.title}**](${ticketUrl})`;

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
        // OPTIMIZED: Removed avatar_url to reduce external fetches
        const discordPayload = {
          username: 'HarryBotter APP',
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
      ticketIds: insertedTickets.map((t: any) => t.display_id || t.id),
    });
  } catch (error: any) {
    console.error('Error in submitTickets:', error);
    return NextResponse.json(
      { error: `Failed to submit tickets. Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
