import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { leagueId, leagueName, changeType, details } = await req.json();

    const statusLabels = {
      inscripcion: 'abierta para inscripciones',
      activa: 'activa — ¡la competición ha comenzado!',
      finalizada: 'finalizada',
      suspendida: 'suspendida',
    };

    // Obtener todos los delegados de equipos de esta liga
    const teams = await base44.asServiceRole.entities.Team.filter({ league_id: leagueId });
    const delegateEmails = [...new Set(teams.map(t => t.delegate_email).filter(Boolean))];

    if (delegateEmails.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No hay delegados en esta liga' });
    }

    const changeLabel = statusLabels[changeType] || changeType;

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4a1d7a; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f5c518; margin: 0; font-size: 22px;">🏆 Actualización de Liga</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
          <p>Le informamos de un cambio en la competición en la que participa su equipo:</p>
          <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 18px; font-weight: bold;">${leagueName}</p>
            <p style="margin: 0; color: #5b21b6; font-size: 15px;">Estado: <strong>${changeLabel}</strong></p>
            ${details ? `<p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">${details}</p>` : ''}
          </div>
          <p style="color: #6b7280; font-size: 13px;">Para más información, acceda a su panel de delegado o contacte con la Concejalía de Deportes.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
        </div>
      </div>
    `;

    await Promise.all(
      delegateEmails.map(email =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `🏆 ${leagueName} — Actualización de estado`,
          body,
        })
      )
    );

    return Response.json({ success: true, sent: delegateEmails.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});