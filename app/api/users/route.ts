import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { User } from '@/types';

export async function GET() {
  try {
    const data = await supabaseRequest('member', {
      params: 'select=clockify_name,email',
    });
    
    const users: User[] = data
      .map((row: any) => ({ name: row.clockify_name, email: row.email }))
      .filter((user: User) => user.name);

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error in getUsers:', error);
    return NextResponse.json([], { status: 500 });
  }
}

