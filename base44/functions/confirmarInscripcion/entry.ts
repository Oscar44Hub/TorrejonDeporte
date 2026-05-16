import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { token, tipo, id, accion } = body;

    if (!token || !tipo || !id) {
      return Response.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const allowedTypes = ['Player', 'Delegate', 'Referee'];
    if (!allowedTypes.includes(tipo)) {
      return Response.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities[tipo].filter({ id });
    if (!records || records.length === 0) {
      return Response.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const record = records[0];

    if (record.confirmation_token !== token) {
      return Response.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }

    // Si ya fue procesado
    if (record.confirmed) {
      return Response.json({ success: true, already_confirmed: true, name: record.full_name });
    }
    if (record.rejection_pending) {
      return Response.json({ success: true, already_rejected: true, name: record.full_name });
    }

    // Acción: RECHAZAR — marcar como rechazo pendiente (el delegado lo confirmará)
    if (accion === 'rechazar') {
      await base44.asServiceRole.entities[tipo].update(id, {
        rejection_pending: true,
        confirmation_token: null,
      });

      // Notificar al admin y/o delegado del equipo
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const adminEmail = admins[0]?.email;
      if (adminEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'TorrejónDeporte Sistema',
          to: adminEmail,
          subject: `❌ ${record.full_name} ha rechazado su inscripción`,
          body: `<p><strong>${record.full_name}</strong> (${record.email}) ha rechazado su inscripción. Por favor, confirme su eliminación desde el panel de administración.</p>`,
        });
      }

      return Response.json({
        success: true,
        rejected: true,
        name: record.full_name,
        tipo,
      });
    }

    // Acción: ACEPTAR (por defecto)
    const updateData = { confirmed: true, confirmation_token: null };
    if (tipo === 'Delegate') updateData.status = 'activo';

    await base44.asServiceRole.entities[tipo].update(id, updateData);

    return Response.json({
      success: true,
      already_confirmed: false,
      name: record.full_name,
      tipo,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});