import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { delegateEmail, delegateName, playerName, teamName, leagueName, reason, matchesSuspended, matchDate } = await req.json();

    const reasonLabels = {
      tarjeta_roja: 'Tarjeta roja directa',
      doble_amarilla: 'Doble tarjeta amarilla',
      acumulacion_amarillas: 'Acumulación de tarjetas amarillas',
      conducta_antideportiva: 'Conducta antideportiva',
      otro: 'Otro motivo',
    };

    const reasonLabel = reasonLabels[reason] || reason;

    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4a1d7a; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f5c518; margin: 0; font-size: 22px;">⚖️ Notificación de Sanción</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
          <p>Estimado/a <strong>${delegateName}</strong>,</p>
          <p>Le informamos que se ha registrado una sanción para un jugador de su equipo:</p>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280; width: 40%;">Jugador:</td><td style="padding: 6px 0; font-weight: bold;">${playerName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Equipo:</td><td style="padding: 6px 0;">${teamName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Liga:</td><td style="padding: 6px 0;">${leagueName}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Motivo:</td><td style="padding: 6px 0;">${reasonLabel}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Partidos sancionado:</td><td style="padding: 6px 0; color: #dc2626; font-weight: bold;">${matchesSuspended} partido(s)</td></tr>
              ${matchDate ? `<tr><td style="padding: 6px 0; color: #6b7280;">Partido del:</td><td style="padding: 6px 0;">${matchDate}</td></tr>` : ''}
            </table>
          </div>

          <p style="color: #6b7280; font-size: 13px;">Si tiene alguna consulta o desea presentar un recurso, póngase en contacto con la Concejalía de Deportes.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
        </div>
      </div>
    `;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: delegateEmail,
      subject: `⚖️ Sanción registrada: ${playerName} — ${matchesSuspended} partido(s) — ${leagueName}`,
      body,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});