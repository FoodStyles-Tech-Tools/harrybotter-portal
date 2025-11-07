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
        requesterEmail: payload.requesterEmail,
        assigneeId: payload.assignee ? parseInt(String(payload.assignee), 10) : null,
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

    // Handle attachments (files would need to be uploaded separately via another API)
    // For now, we'll store URLs directly
    const ticketsToUpdate = [];
    for (const newTicket of insertedTickets) {
      const originalTicketPayload = payload.tickets.find(
        (p) => p.title === newTicket.title
      );
      if (!originalTicketPayload || !originalTicketPayload.attachments || originalTicketPayload.attachments.length === 0) continue;

      const attachmentUrls: string[] = [];
      originalTicketPayload.attachments.forEach((att) => {
        if (att.type === 'url') {
          attachmentUrls.push(att.data as string);
        } else if (att.type === 'file') {
          // File uploads would need to be handled separately
          // For now, we'll skip file attachments in the API route
        }
      });

      if (attachmentUrls.length > 0) {
        ticketsToUpdate.push({
          id: newTicket.id,
          relevantLink: attachmentUrls.join('\n'),
        });
      }
    }

    if (ticketsToUpdate.length > 0) {
      for (const ticketToUpdate of ticketsToUpdate) {
        await supabaseRequest('ticket', {
          method: 'PATCH',
          params: `id=eq.${ticketToUpdate.id}`,
          payload: { relevantLink: ticketToUpdate.relevantLink },
        });
      }
    }

    // Send Discord notification (would need to be done server-side)
    // This would require a separate API route or server action

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

