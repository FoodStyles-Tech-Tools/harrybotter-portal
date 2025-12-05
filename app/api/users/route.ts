import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { User } from '@/types';

export async function GET() {
  try {
    const data = await supabaseRequest('users', {
      params: 'select=id,name,email',
    });
    
    const users: User[] = data
      .map((row: any) => ({ 
        id: row.id,
        name: row.name, 
        email: row.email,
        avatar_url: row.avatar_url,
        role: row.role,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))
      .filter((user: User) => user.name);

    // Add cache headers: 10 minutes cache for users (data changes infrequently)
    return NextResponse.json(users, {
      headers: {
        'Cache-Control': 'public, s-maxage=600',
      },
    });
  } catch (error: any) {
    console.error('Error in getUsers:', error);
    return NextResponse.json([], { status: 500 });
  }
}

