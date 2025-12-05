import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { TeamMember } from '@/types';

export async function GET() {
  try {
    // Get all users - we'll filter by role in code to ensure reliability
    // This avoids PostgREST query syntax issues with string values
    const allData = await supabaseRequest('users', {
      params: 'select=id,name,email,role,avatar_url,discord_id',
    });
    
    // Filter users by role = 'admin' OR role = 'member'
    const members: TeamMember[] = allData
      .map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar_url: row.avatar_url,
        role: row.role,
        discordId: row.discord_id, // Extract discord_id from users table
      }))
      .filter((member: TeamMember) => 
        member.name && 
        member.email && 
        (member.role === 'admin' || member.role === 'member')
      );

    // Add cache headers: 10 minutes cache for team members (data changes infrequently)
    return NextResponse.json(members, {
      headers: {
        'Cache-Control': 'public, s-maxage=600',
      },
    });
  } catch (error: any) {
    console.error('Error in getTeamMembers:', error);
    return NextResponse.json([], { status: 500 });
  }
}

