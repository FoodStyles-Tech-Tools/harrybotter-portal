import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/services/supabase';

interface AssetRow {
  id: string;
  name: string;
  description?: string | null;
  owner_id?: string | null;
  collaborator_ids?: string[] | null;
  production_url?: string | null;
  links?: string[] | null;
}

export async function GET() {
  try {
    const [assetsData, usersData] = await Promise.all([
      supabaseRequest('assets', {
        params: 'select=id,name,description,owner_id,collaborator_ids,production_url,links',
      }),
      supabaseRequest('users', {
        params: 'select=id,name',
      }),
    ]);

    const userNameById = new Map(
      (usersData || [])
        .filter((user: any) => user?.id && user?.name)
        .map((user: any) => [user.id, user.name])
    );

    const assets = (Array.isArray(assetsData) ? assetsData : []).map((row: AssetRow) => {
      const ownerName = row.owner_id ? userNameById.get(row.owner_id) ?? 'Unknown user' : null;
      const collaboratorIds = Array.isArray(row.collaborator_ids) ? row.collaborator_ids : [];
      const collaboratorNames = collaboratorIds.map((id) => {
        return userNameById.get(id) ?? 'Unknown user';
      });
      const sourceUrl = Array.isArray(row.links) ? row.links[0] ?? null : null;
      const productionUrl = row.production_url ?? null;

      return {
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        owner: ownerName,
        collaborators: collaboratorNames,
        source_url: sourceUrl,
        production_url: productionUrl,
        links: Array.isArray(row.links) ? row.links : null,
      };
    });

    return NextResponse.json(assets, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    });
  } catch (error: any) {
    console.error('Error in getAssets:', error);
    return NextResponse.json([], { status: 500 });
  }
}
