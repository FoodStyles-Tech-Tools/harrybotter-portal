import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { TeamMember } from '@/types';

export async function GET() {
  try {
    const data = await supabaseRequest('user', {
      params: 'select=id,name,email,discordId',
    });
    
    const members: TeamMember[] = data
      .map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        discordId: row.discordId,
      }))
      .filter((member: TeamMember) => member.name && member.email);

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    return NextResponse.json([], { status: 500 });
  }
}

