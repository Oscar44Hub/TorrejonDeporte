import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();

    // Puede venir de la automatización (entity event) o de una llamada manual
    const { event, data, old_data } = body;

    // Solo procesamos eventos de actualización
    if (event?.type !== 'update') {
      return Response.json({ success: true, message: 'No es un evento de actualización' });
    }

    const match = data;
    const oldMatch = old_data;

    if (!match || !oldMatch) {
      return Response.json({ success: true, message: 'Sin datos suficientes' });
    }

    // Detectar qué cambió: fecha o instalación
    const dateChanged = match.match_date !== oldMatch.match_date;
    const venueChanged = match.venue !== oldMatch.venue;

    if (!dateChanged && !venueChanged) {
      return Response.json({ success: true, message: 'Sin cambios relevantes en fecha/instalación' });
    }

    // Obtener equipos para sacar emails de delegados
    const [homeTeams, awayTeams] = await Promise.all([
      base44.asServiceRole.entities.Team.filter({ id: match.home_team_id }),
      base44.asServiceRole.entities.Team.filter({ id: match.away_team_id }),
    ]);

    const homeTeam = homeTeams[0];
    const awayTeam = awayTeams[0];

    const emails = [homeTeam?.delegate_email, awayTeam?.delegate_email].filter(Boolean);
    const uniqueEmails = [...new Set(emails)];

    if (uniqueEmails.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No hay delegados con email' });
    }

    // Formatear fecha
    const formatDate = (iso) => {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid'
      });
    };

    // Construir lista de cambios
    const changes = [];
    if (dateChanged) {
      changes.push(`
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151;">📅 Fecha</td>
          <td style="padding: 8px 12px; color: #ef4444; text-decoration: line-through;">${formatDate(oldMatch.match_date)}</td>
          <td style="padding: 8px 12px; color: #16a34a; font-weight: bold;">→ ${formatDate(match.match_date)}</td>
        </tr>
      `);
    }
    if (venueChanged) {
      changes.push(`
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #374151;">🏟️ Instalación</td>
          <td style="padding: 8px 12px; color: #ef4444; text-decoration: line-through;">${oldMatch.venue || '—'}</td>
          <td style="padding: 8px 12px; color: #16a34a; font-weight: bold;">→ ${match.venue || '—'}</td>
        </tr>
      `);
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4a1d7a; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f5c518; margin: 0; font-size: 22px;">⚽ Cambio en Partido</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
          <p style="margin: 0 0 16px;">Le informamos de que se han realizado cambios en el siguiente partido:</p>

          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #1f2937;">
              ${match.home_team_name} vs ${match.away_team_name}
            </p>
            <p style="margin: 6px 0 0; font-size: 13px; color: #6b7280;">${match.league_name || ''} · Jornada ${match.round || '—'}</p>
          </div>

          <h3 style="margin: 0 0 12px; font-size: 15px; color: #374151;">Cambios realizados:</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">Campo</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">Anterior</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">Nuevo</th>
              </tr>
            </thead>
            <tbody>
              ${changes.join('')}
            </tbody>
          </table>

          <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
            Para más información, acceda a su <strong>panel de delegado</strong> o contacte con la Concejalía de Deportes.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
        </div>
      </div>
    `;

    const subject = `⚽ Cambio de ${dateChanged && venueChanged ? 'fecha e instalación' : dateChanged ? 'fecha' : 'instalación'}: ${match.home_team_name} vs ${match.away_team_name}`;

    await Promise.all(
      uniqueEmails.map(email =>
        base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body: emailBody })
      )
    );

    return Response.json({ success: true, sent: uniqueEmails.length, dateChanged, venueChanged });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});