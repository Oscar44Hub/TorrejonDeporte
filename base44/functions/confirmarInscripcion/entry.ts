import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Endpoint público — confirma el token y activa el registro
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { token, tipo, id } = body;

    if (!token || !tipo || !id) {
      return Response.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    // Tipos permitidos
    const allowedTypes = ['Player', 'Delegate', 'Referee'];
    if (!allowedTypes.includes(tipo)) {
      return Response.json({ error: 'Tipo de entidad no válido' }, { status: 400 });
    }

    // Buscar el registro
    const records = await base44.asServiceRole.entities[tipo].filter({ id });
    if (!records || records.length === 0) {
      return Response.json({ error: 'Registro no encontrado' }, { status: 404 });
    }

    const record = records[0];

    // Verificar token
    if (record.confirmation_token !== token) {
      return Response.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }

    // Ya confirmado
    if (record.confirmed) {
      return Response.json({ success: true, already_confirmed: true, name: record.full_name });
    }

    // Marcar como confirmado
    const updateData = { confirmed: true, confirmation_token: null };

    // Si es delegado, activar también el status
    if (tipo === 'Delegate') {
      updateData.status = 'activo';
    }

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