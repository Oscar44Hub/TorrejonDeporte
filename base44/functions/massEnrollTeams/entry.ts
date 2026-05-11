import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
    }

    const { fileUrl, season } = await req.json();

    if (!fileUrl || !season) {
      return Response.json({ error: 'Se requiere fileUrl y season' }, { status: 400 });
    }

    // Extraer datos del Excel
    const extraction = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                DEPORTE: { type: 'string' },
                CATEGORÍA: { type: 'string' },
                'EQUIPO/CLUB': { type: 'string' },
              },
            },
          },
        },
      },
    });

    if (extraction.status !== 'success' || !extraction.output) {
      return Response.json({ error: 'Error al leer el archivo Excel', details: extraction.details }, { status: 400 });
    }

    const rows = Array.isArray(extraction.output) ? extraction.output : (extraction.output.rows || []);

    // Cargar todas las ligas de la temporada
    const leagues = await base44.asServiceRole.entities.League.filter({ season });

    const results = {
      enrolled: [],
      skipped_league_not_found: [],
      skipped_already_exists: [],
      errors: [],
    };

    // Cargar todos los equipos existentes para detectar duplicados
    const existingTeams = await base44.asServiceRole.entities.Team.list();
    const existingSet = new Set(existingTeams.map(t => `${t.league_id}::${t.name?.trim().toUpperCase()}`));

    for (const row of rows) {
      const deporte = (row['DEPORTE'] || row.DEPORTE || '').trim().toUpperCase();
      const categoria = (row['CATEGORÍA'] || row.CATEGORIA || '').trim();
      const clubName = (row['EQUIPO/CLUB'] || '').trim();

      if (!deporte || !categoria || !clubName) continue;

      // Buscar liga coincidente (sport_name y category)
      const league = leagues.find(l =>
        l.sport_name?.trim().toUpperCase() === deporte &&
        l.category?.trim().toLowerCase() === categoria.toLowerCase()
      );

      if (!league) {
        results.skipped_league_not_found.push({ deporte, categoria, club: clubName });
        continue;
      }

      const key = `${league.id}::${clubName.toUpperCase()}`;
      if (existingSet.has(key)) {
        results.skipped_already_exists.push({ club: clubName, liga: league.name });
        continue;
      }

      try {
        await base44.asServiceRole.entities.Team.create({
          name: clubName,
          league_id: league.id,
          league_name: league.name,
          sport_name: league.sport_name,
          delegate_name: 'Pendiente',
          delegate_email: `pendiente_${clubName.toLowerCase().replace(/\s+/g, '_')}@torrejón.es`,
          status: 'pendiente',
        });
        existingSet.add(key);
        results.enrolled.push({ club: clubName, liga: league.name, deporte, categoria });
      } catch (e) {
        results.errors.push({ club: clubName, error: e.message });
      }
    }

    return Response.json({
      success: true,
      summary: {
        total_rows: rows.length,
        enrolled: results.enrolled.length,
        skipped_league_not_found: results.skipped_league_not_found.length,
        skipped_already_exists: results.skipped_already_exists.length,
        errors: results.errors.length,
      },
      details: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});