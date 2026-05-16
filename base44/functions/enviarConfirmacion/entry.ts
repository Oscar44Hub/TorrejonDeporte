import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Genera un token aleatorio seguro
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Llamada desde automatización entity onCreate — no requiere usuario autenticado (webhook interno)
// Pero validamos que venga con el payload correcto
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Soporte para llamada desde automatización entity (payload con event/data/args)
    // o llamada manual con entity_type/entity_id/entity_data
    let entity_type = body.entity_type || body.args?.entity_type;
    let entity_id = body.entity_id;
    let entity_data = body.entity_data;
    const app_base_url = body.app_base_url;

    // Si viene de automatización entity
    if (!entity_type && body.event?.entity_name) {
      entity_type = body.event.entity_name;
    }
    if (!entity_id && body.event?.entity_id) {
      entity_id = body.event.entity_id;
    }
    if (!entity_data && body.data) {
      entity_data = body.data;
    }

    if (!entity_type || !entity_id) {
      return Response.json({ error: 'Faltan parámetros entity_type y entity_id' }, { status: 400 });
    }

    const baseUrl = app_base_url || 'https://torrejondeporte.base44.app';
    const token = generateToken();

    // Actualizar el token en la entidad
    await base44.asServiceRole.entities[entity_type].update(entity_id, {
      confirmation_token: token,
      confirmed: false,
    });

    const data = entity_data || {};
    const email = data.email;
    const name = data.full_name;

    if (!email) {
      return Response.json({ success: true, message: 'Sin email, no se envía confirmación' });
    }

    const confirmUrl = `${baseUrl}/confirmar?token=${token}&tipo=${entity_type}&id=${entity_id}`;

    // Tipos de entidad para personalizar el mensaje
    const typeLabels = {
      Player: { role: 'jugador', panel: '/mi-panel', emoji: '⚽' },
      Delegate: { role: 'delegado', panel: '/mi-panel', emoji: '🏆' },
      Referee: { role: 'árbitro', panel: '/arbitro/panel', emoji: '🟨' },
    };
    const cfg = typeLabels[entity_type] || { role: 'miembro', panel: '/', emoji: '🏅' };

    const teamInfo = data.team_name ? `de <strong>${data.team_name}</strong>` : '';
    const clubInfo = data.club_name ? `de <strong>${data.club_name}</strong>` : '';
    const contextInfo = teamInfo || clubInfo;

    // Email al interesado
    const userEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4a1d7a; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f5c518; margin: 0; font-size: 22px;">${cfg.emoji} Confirma tu inscripción</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
        </div>
        <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
          <p>Hola <strong>${name || email}</strong>,</p>
          <p>Has sido registrado/a como <strong>${cfg.role}</strong> ${contextInfo} en el sistema deportivo del Ayuntamiento de Torrejón de Ardoz.</p>
          <p>Para confirmar tu inscripción y activar tu acceso, haz clic en el botón:</p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}"
              style="background: #4a1d7a; color: #f5c518; padding: 16px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              ✅ Confirmar mi inscripción
            </a>
          </div>

          <p style="font-size: 13px; color: #6b7280;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="font-size: 12px; color: #4a1d7a; word-break: break-all;">${confirmUrl}</p>

          <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #92400e;">
              ⚠️ <strong>Importante:</strong> Hasta que confirmes tu inscripción, no podrás participar en partidos ni aparecer en las clasificaciones.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Si no esperabas este email, puedes ignorarlo. Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
        </div>
      </div>
    `;

    // Email de aviso al admin
    const adminEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 18px;">🔔 Nuevo ${cfg.role} registrado</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Panel de Administración · TorrejónDeporte</p>
        </div>
        <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-top: 0;">
          <p>Se ha registrado un nuevo <strong>${cfg.role}</strong> en el sistema:</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 120px;">Nombre:</td><td style="padding: 6px 0; font-weight: bold;">${name || '—'}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Email:</td><td style="padding: 6px 0;">${email}</td></tr>
            ${contextInfo ? `<tr><td style="padding: 6px 0; color: #6b7280;">Equipo/Club:</td><td style="padding: 6px 0;">${data.team_name || data.club_name || '—'}</td></tr>` : ''}
            <tr><td style="padding: 6px 0; color: #6b7280;">Estado:</td><td style="padding: 6px 0;"><span style="color: #f59e0b;">⏳ Pendiente de confirmación</span></td></tr>
          </table>
          <div style="margin-top: 20px;">
            <a href="${baseUrl}/admin"
              style="background: #1e3a5f; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold;">
              Ver panel de administración
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">TorrejónDeporte · Notificación automática del sistema</p>
        </div>
      </div>
    `;

    // Obtener email del admin (primer admin del sistema)
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminEmail = admins[0]?.email;

    const emailsToSend = [
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'TorrejónDeporte',
        to: email,
        subject: `${cfg.emoji} Confirma tu inscripción como ${cfg.role} — TorrejónDeporte`,
        body: userEmailBody,
      }),
    ];

    if (adminEmail) {
      emailsToSend.push(
        base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'TorrejónDeporte Sistema',
          to: adminEmail,
          subject: `🔔 Nuevo ${cfg.role} registrado: ${name || email}`,
          body: adminEmailBody,
        })
      );
    }

    await Promise.all(emailsToSend);

    return Response.json({ success: true, sent_to: email, admin_notified: !!adminEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});