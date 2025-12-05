import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';
import type { Project } from '@/types';

export async function GET() {
  try {
    const projects = await supabaseRequest('projects', {
      params: 'select=id,name,description,owner_id,status,created_at,updated_at,department_id,links,collaborator_ids',
    });
    
    const result: Project[] = projects
      .map((p: any) => ({ 
        id: p.id, 
        name: p.name,
        description: p.description,
        owner_id: p.owner_id,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        department_id: p.department_id,
        links: p.links,
        collaborator_ids: p.collaborator_ids,
      }))
      .filter((p: Project) => p.id && p.name);

    // Add cache headers: 10 minutes cache for projects (data changes infrequently)
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=600',
      },
    });
  } catch (error: any) {
    console.error('Error in getProjects:', error);
    return NextResponse.json([], { status: 500 });
  }
}

