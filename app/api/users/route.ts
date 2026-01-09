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

    // OPTIMIZED: Increased cache from 10 minutes to 1 hour (users rarely change)
    return NextResponse.json(users, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    console.error('Error in getUsers:', error);
    return NextResponse.json([], { status: 500 });
  }
}

