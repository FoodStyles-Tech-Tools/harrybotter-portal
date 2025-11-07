import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { Project } from '@/types';

export async function GET() {
  try {
    const projects = await supabaseRequest('project', {
      params: 'select=id,projectName',
    });
    
    const result: Project[] = projects
      .map((p: any) => ({ id: p.id, name: p.projectName }))
      .filter((p: Project) => p.id && p.name);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in getProjects:', error);
    return NextResponse.json([], { status: 500 });
  }
}

