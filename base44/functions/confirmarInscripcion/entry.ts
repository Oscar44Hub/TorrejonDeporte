import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { token, tipo, id, accion } = body;

    if (!token || !tipo || !id) {
      return Response.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const allowedTypes = ['Player', 'Referee', 'Delegate'];
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

    // Acción: RECHAZAR → status "baja", rejection_pending = true durante 1 mes
    if (accion === 'rechazar') {
      const rejectionExpiry = new Date();
      rejectionExpiry.setMonth(rejectionExpiry.getMonth() + 1);

      await base44.asServiceRole.entities[tipo].update(id, {
        rejection_pending: true,
        status: 'baja',
        rejection_expiry_date: rejectionExpiry.toISOString(),
        confirmation_token: null,
      });

      // Notificar al admin
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const adminEmail = admins[0]?.email;
      if (adminEmail) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: 'TorrejónDeporte Sistema',
          to: adminEmail,
          subject: `❌ ${record.full_name} ha rechazado su inscripción`,
          body: `<p><strong>${record.full_name}</strong> (${record.email}) ha rechazado su inscripción.</p><p>Ha sido marcado como <strong>baja</strong> durante 1 mes (hasta el ${rejectionExpiry.toLocaleDateString('es-ES')}).</p>`,
        });
      }

      return Response.json({
        success: true,
        rejected: true,
        name: record.full_name,
        tipo,
      });
    }

    // Acción: ACEPTAR → confirmed = true, status = "activo"
    await base44.asServiceRole.entities[tipo].update(id, {
      confirmed: true,
      status: 'activo',
      confirmation_token: null,
    });

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