import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const [delegates, referees, players] = await Promise.all([
      base44.asServiceRole.entities.Delegate.filter({ confirmed: false }),
      base44.asServiceRole.entities.Referee.filter({ confirmed: false }),
      base44.asServiceRole.entities.Player.filter({ confirmed: false }),
    ]);

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES');
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(74, 29, 122);
    doc.rect(0, 0, pageW, 30, 'F');
    doc.setTextColor(245, 197, 24);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('TorrejónDeporte — Inscripciones Pendientes', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text(`Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz`, 14, 22);
    doc.text(`Generado: ${today}`, pageW - 14, 22, { align: 'right' });

    // Resumen
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total pendientes: ${delegates.length + referees.length + players.length}   |   Delegados: ${delegates.length}   |   Árbitros: ${referees.length}   |   Jugadores: ${players.length}`, 14, 40);

    let y = 50;

    const drawSection = (title, items, fields) => {
      if (items.length === 0) return;

      if (y > 260) { doc.addPage(); y = 15; }

      doc.setFillColor(240, 234, 250);
      doc.rect(10, y - 5, pageW - 20, 9, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(74, 29, 122);
      doc.text(title, 14, y + 1);
      doc.setTextColor(0, 0, 0);
      y += 8;

      // Column headers
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      let colX = 14;
      fields.forEach(f => { doc.text(f.header.toUpperCase(), colX, y); colX += f.width; });
      y += 5;

      doc.setDrawColor(200, 200, 200);
      doc.line(10, y, pageW - 10, y);
      y += 4;

      // Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      items.forEach((item, idx) => {
        if (y > 270) { doc.addPage(); y = 15; }
        if (idx % 2 === 0) {
          doc.setFillColor(252, 250, 255);
          doc.rect(10, y - 3, pageW - 20, 7, 'F');
        }

        const now = new Date();
        const created = new Date(item.created_date);
        const hoursOld = (now - created) / (1000 * 60 * 60);
        const daysOld = hoursOld / 24;

        // Aviso caducidad
        if (daysOld > 4) {
          doc.setTextColor(180, 0, 0);
          doc.text('⚠ CADUCADO', pageW - 24, y + 1, { align: 'right' });
          doc.setTextColor(0, 0, 0);
        } else if (daysOld > 2) {
          doc.setTextColor(200, 100, 0);
          doc.text('! 48h', pageW - 24, y + 1, { align: 'right' });
          doc.setTextColor(0, 0, 0);
        }

        colX = 14;
        fields.forEach(f => {
          const val = (item[f.key] || '—').toString().substring(0, Math.floor(f.width / 2.2));
          doc.text(val, colX, y + 1);
          colX += f.width;
        });

        y += 8;
      });

      y += 4;
    };

    const delegateFields = [
      { header: 'Nombre', key: 'full_name', width: 60 },
      { header: 'Email', key: 'email', width: 70 },
      { header: 'Club', key: 'club_name', width: 45 },
      { header: 'Alta', key: 'created_date', width: 30 },
    ];
    const refereeFields = [
      { header: 'Nombre', key: 'full_name', width: 70 },
      { header: 'Email', key: 'email', width: 80 },
      { header: 'Alta', key: 'created_date', width: 30 },
    ];
    const playerFields = [
      { header: 'Nombre', key: 'full_name', width: 55 },
      { header: 'Email', key: 'email', width: 65 },
      { header: 'Equipo', key: 'team_name', width: 45 },
      { header: 'Alta', key: 'created_date', width: 20 },
    ];

    drawSection(`Delegados sin confirmar (${delegates.length})`, delegates, delegateFields);
    drawSection(`Árbitros sin confirmar (${referees.length})`, referees, refereeFields);
    drawSection(`Jugadores sin confirmar (${players.length})`, players, playerFields);

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages} · Documento confidencial — solo para uso interno`, pageW / 2, 290, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=pendientes_confirmacion_${today.replace(/\//g, '-')}.pdf`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});