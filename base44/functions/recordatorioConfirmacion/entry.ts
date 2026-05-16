import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Función llamada por automatización programada cada hora
// Envía recordatorio a quienes llevan >48h sin confirmar y no han recibido recordatorio aún
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const threshold48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const threshold4days = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const baseUrl = 'https://torrejondeporte.base44.app';

    // Obtener todos los no confirmados
    const [delegates, referees, players] = await Promise.all([
      base44.asServiceRole.entities.Delegate.filter({ confirmed: false }),
      base44.asServiceRole.entities.Referee.filter({ confirmed: false }),
      base44.asServiceRole.entities.Player.filter({ confirmed: false }),
    ]);

    const results = { delegates: 0, referees: 0, players: 0, expired: 0 };

    const processEntity = async (items, entityType, roleLabel, panelPath) => {
      for (const item of items) {
        if (!item.email || !item.confirmation_token) continue;
        const createdAt = new Date(item.created_date);

        // Expirado (>4 días): marcar como caducado si tiene confirmation_token
        const isExpired = createdAt < threshold4days;
        if (isExpired) {
          results.expired++;
          // Solo notificar una vez: si aún tiene token activo pero ha caducado
          if (!item.reminder_sent_expired) {
            await base44.asServiceRole.entities[entityType].update(item.id, {
              reminder_sent_expired: true,
            });
            await base44.asServiceRole.integrations.Core.SendEmail({
              from_name: 'TorrejónDeporte',
              to: item.email,
              subject: `⚠️ Tu enlace de confirmación ha caducado — TorrejónDeporte`,
              body: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #991b1b; padding: 24px; border-radius: 8px 8px 0 0;">
                    <h1 style="color: #fff; margin: 0; font-size: 20px;">⚠️ Enlace de confirmación caducado</h1>
                  </div>
                  <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
                    <p>Hola <strong>${item.full_name || item.email}</strong>,</p>
                    <p>Tu enlace de confirmación como <strong>${roleLabel}</strong> ha caducado (han pasado más de 4 días).</p>
                    <p>Por favor, contacta con la Concejalía de Deportes para que te reenvíen un nuevo enlace:</p>
                    <p style="font-weight: bold;">📧 deportes@ayto-torrejon.es</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #9ca3af;">Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
                  </div>
                </div>
              `,
            });
          }
          continue;
        }

        // Entre 48h y 4 días: enviar recordatorio (solo una vez)
        const isOlderThan48h = createdAt < threshold48h;
        if (isOlderThan48h && !item.reminder_sent) {
          const confirmUrl = `${baseUrl}/confirmar?token=${item.confirmation_token}&tipo=${entityType}&id=${item.id}`;
          await base44.asServiceRole.entities[entityType].update(item.id, {
            reminder_sent: true,
            reminder_sent_date: now.toISOString(),
          });
          await base44.asServiceRole.integrations.Core.SendEmail({
            from_name: 'TorrejónDeporte',
            to: item.email,
            subject: `🔔 Recuerda confirmar tu inscripción — TorrejónDeporte`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4a1d7a; padding: 24px; border-radius: 8px 8px 0 0;">
                  <h1 style="color: #f5c518; margin: 0; font-size: 20px;">🔔 Recuerda confirmar tu inscripción</h1>
                  <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
                </div>
                <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
                  <p>Hola <strong>${item.full_name || item.email}</strong>,</p>
                  <p>Te recordamos que aún no has confirmado tu inscripción como <strong>${roleLabel}</strong>.</p>
                  <p><strong>⚠️ Importante:</strong> Tu enlace caducará en 2 días. Si no confirmas antes, deberás contactar con la Concejalía para obtener uno nuevo.</p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${confirmUrl}" style="background: #4a1d7a; color: #f5c518; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      ✅ Confirmar mi inscripción
                    </a>
                  </div>
                  <p style="font-size: 12px; color: #6b7280;">O copia este enlace: ${confirmUrl}</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #9ca3af;">Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
                </div>
              </div>
            `,
          });

          if (entityType === 'Delegate') results.delegates++;
          else if (entityType === 'Referee') results.referees++;
          else if (entityType === 'Player') results.players++;
        }
      }
    };

    await processEntity(delegates, 'Delegate', 'delegado', '/mi-panel');
    await processEntity(referees, 'Referee', 'árbitro', '/arbitro/panel');
    await processEntity(players, 'Player', 'jugador', '/mi-panel');

    return Response.json({ success: true, reminders_sent: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});