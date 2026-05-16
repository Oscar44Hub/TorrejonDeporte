import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Soporte para llamada manual o desde automatización entity
    let entity_type = body.entity_type || body.args?.entity_type;
    let entity_id = body.entity_id;
    let entity_data = body.entity_data;

    if (!entity_type && body.event?.entity_name) entity_type = body.event.entity_name;
    if (!entity_id && body.event?.entity_id) entity_id = body.event.entity_id;
    if (!entity_data && body.data) entity_data = body.data;

    if (!entity_type || !entity_id) {
      return Response.json({ error: 'Faltan parámetros entity_type y entity_id' }, { status: 400 });
    }

    const baseUrl = 'https://torrejondeporte.base44.app';
    const token = generateToken();

    // Actualizar token en la entidad
    await base44.asServiceRole.entities[entity_type].update(entity_id, {
      confirmation_token: token,
      confirmed: false,
    });

    const data = entity_data || {};
    const email = data.email;
    const name = data.full_name || email;

    if (!email) {
      return Response.json({ success: true, message: 'Sin email, no se envía confirmación' });
    }

    // Datos de contexto
    const teamName = data.team_name || data.club_name || '';
    const leagueName = data.league_name || '';
    const season = data.season || '';

    const acceptUrl = `${baseUrl}/confirmar?token=${token}&tipo=${entity_type}&id=${entity_id}&accion=aceptar`;
    const rejectUrl = `${baseUrl}/confirmar?token=${token}&tipo=${entity_type}&id=${entity_id}&accion=rechazar`;

    // Construir líneas de contexto
    const equipoLine = teamName ? `el equipo: <strong>${teamName}</strong>` : 'el equipo asignado';
    const ligaLine = leagueName ? `de la liga: <strong>${leagueName}</strong>` : '';
    const temporadaLine = season ? `para la temporada <strong>${season}</strong>` : '';
    const contextParts = [equipoLine, ligaLine, temporadaLine].filter(Boolean).join(', ');

    const userEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4a1d7a; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f5c518; margin: 0; font-size: 22px;">🏆 Confirmación de inscripción</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz</p>
        </div>
        <div style="background: #fff; padding: 28px; border: 1px solid #e5e7eb; border-top: 0;">

          <p style="font-size: 15px; color: #111827;">Estimado/a <strong>${name}</strong>,</p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Debe confirmar o rechazar su inscripción en ${contextParts}.
            Una vez acepte la inscripción podrá ser seleccionado para participar con su equipo en la competición asignada.
          </p>

          <p style="font-size: 15px; color: #374151; line-height: 1.6;">
            Si rechaza la inscripción será borrado del equipo y de la aplicación.
          </p>

          <div style="text-align: center; margin: 36px 0 20px;">
            <a href="${acceptUrl}"
              style="background: #16a34a; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; letter-spacing: 0.5px;">
              ✅ ACEPTAR INSCRIPCIÓN
            </a>
          </div>

          <div style="text-align: center; margin: 0 0 36px;">
            <a href="${rejectUrl}"
              style="background: #dc2626; color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; letter-spacing: 0.5px;">
              ❌ RECHAZAR INSCRIPCIÓN
            </a>
          </div>

          <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 6px; padding: 14px; margin-top: 8px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              ⚠️ En caso de fallar a la hora de elegir la opción, póngase en contacto con su Delegado que resolverá la incidencia.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes</p>
          <p style="font-size: 12px; color: #9ca3af;">Para cualquier consulta puede contactar con nosotros en <a href="mailto:info@torrejondeporte.es" style="color: #4a1d7a;">info@torrejondeporte.es</a></p>
        </div>
      </div>
    `;

    // Email de aviso al admin
    const typeLabels = { Player: 'jugador', Delegate: 'delegado', Referee: 'árbitro' };
    const roleLabel = typeLabels[entity_type] || 'miembro';

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminEmail = admins[0]?.email;

    const emailsToSend = [
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'TorrejónDeporte',
        to: email,
        subject: `🏆 Confirme su inscripción en TorrejónDeporte`,
        body: userEmailBody,
      }),
    ];

    if (adminEmail) {
      emailsToSend.push(
        base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'TorrejónDeporte',
          to: adminEmail,
          subject: `🔔 Nuevo ${roleLabel} registrado: ${name}`,
          body: `<p>Se ha registrado un nuevo <strong>${roleLabel}</strong>: <strong>${name}</strong> (${email}). Se ha enviado email de confirmación.</p>`,
        })
      );
    }

    await Promise.all(emailsToSend);

    return Response.json({ success: true, sent_to: email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});