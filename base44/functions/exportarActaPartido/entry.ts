import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'arbitro')) {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { matchId } = await req.json();
    if (!matchId) return Response.json({ error: 'matchId requerido' }, { status: 400 });

    const match = await base44.asServiceRole.entities.Match.get(matchId);
    if (!match) return Response.json({ error: 'Partido no encontrado' }, { status: 404 });

    // Intentar obtener el acta si existe
    const reports = await base44.asServiceRole.entities.MatchReport.filter({ match_id: matchId });
    const report = reports[0] || null;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // ── CABECERA ──────────────────────────────────────────────────────────────
    doc.setFillColor(74, 29, 122);
    doc.rect(0, 0, pageW, 32, 'F');
    doc.setTextColor(245, 197, 24);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTA DE PARTIDO', pageW / 2, 13, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz', pageW / 2, 21, { align: 'center' });
    doc.text(`Liga: ${match.league_name || '—'}`, pageW / 2, 28, { align: 'center' });

    // ── DATOS DEL PARTIDO ─────────────────────────────────────────────────────
    doc.setTextColor(0, 0, 0);
    let y = 44;

    const matchDate = match.match_date
      ? new Date(match.match_date).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`${match.home_team_name || '—'} vs ${match.away_team_name || '—'}`, pageW / 2, y, { align: 'center' });
    y += 8;

    // Marcador destacado
    doc.setFillColor(245, 197, 24);
    doc.roundedRect(pageW / 2 - 24, y, 48, 14, 3, 3, 'F');
    doc.setFontSize(16);
    doc.setTextColor(74, 29, 122);
    const scoreText = (match.status === 'finalizado' || match.status === 'en_juego')
      ? `${match.home_score ?? '—'} - ${match.away_score ?? '—'}`
      : 'vs';
    doc.text(scoreText, pageW / 2, y + 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 22;

    // Línea separadora
    doc.setDrawColor(74, 29, 122);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const infoLines = [
      ['Fecha y hora:', matchDate],
      ['Jornada/Ronda:', match.round || '—'],
      ['Instalación:', match.venue || '—'],
      ['Árbitro:', report?.referee || match.referee || '—'],
      ['Estado:', match.status === 'finalizado' ? 'Finalizado' : match.status === 'programado' ? 'Programado' : match.status || '—'],
    ];
    infoLines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, y);
      y += 7;
    });

    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    // ── INCIDENCIAS ───────────────────────────────────────────────────────────
    if (report?.incidents?.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(74, 29, 122);
      doc.rect(14, y - 5, pageW - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('INCIDENCIAS', 16, y);
      doc.setTextColor(0, 0, 0);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const tipoMap = {
        gol: 'GOL', tarjeta_amarilla: 'T. Amarilla', tarjeta_roja: 'T. Roja',
        doble_amarilla: 'Doble Amarilla', lesion: 'Lesión', sustitucion: 'Sustitución',
        penalti: 'Penalti', otro: 'Otro',
      };
      report.incidents.forEach(inc => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(`min. ${inc.minute || '?'}`, 16, y);
        doc.setFont('helvetica', 'bold');
        doc.text(tipoMap[inc.type] || inc.type, 34, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${inc.player_name || '—'}`, 75, y);
        doc.text(`(${inc.team_name || '—'})`, 130, y);
        y += 6;
        if (inc.description) {
          doc.setTextColor(100, 100, 100);
          doc.text(`   → ${inc.description}`, 16, y);
          doc.setTextColor(0, 0, 0);
          y += 5;
        }
      });
      y += 5;
    }

    // ── SANCIONES ─────────────────────────────────────────────────────────────
    if (report?.sanctions?.length > 0) {
      if (y > 245) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(180, 0, 0);
      doc.rect(14, y - 5, pageW - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('SANCIONES', 16, y);
      doc.setTextColor(0, 0, 0);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const reasonMap = {
        tarjeta_roja: 'T.Roja directa', doble_amarilla: 'Doble amarilla',
        acumulacion_amarillas: 'Acum. amarillas', conducta_antideportiva: 'Conducta antidep.', otro: 'Otro',
      };
      report.sanctions.forEach(s => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text(s.player_name || '—', 16, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`(${s.team_name || '—'})`, 70, y);
        doc.text(reasonMap[s.reason] || s.reason || '—', 115, y);
        doc.text(`${s.matches_suspended || 1} partido(s)`, 165, y);
        y += 6;
      });
      y += 5;
    }

    // ── OBSERVACIONES ─────────────────────────────────────────────────────────
    if (report?.general_notes) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setFillColor(100, 100, 100);
      doc.rect(14, y - 5, pageW - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('OBSERVACIONES DEL ÁRBITRO', 16, y);
      doc.setTextColor(0, 0, 0);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(report.general_notes, pageW - 28);
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 14, y);
        y += 5;
      });
      y += 4;
    }

    // ── ESPACIO FIRMAS ────────────────────────────────────────────────────────
    // Asegurarnos de que las firmas caben en la página
    if (y > 210) { doc.addPage(); y = 20; }

    y += 6;
    doc.setDrawColor(74, 29, 122);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(74, 29, 122);
    doc.text('FIRMAS Y CONFORMIDAD', pageW / 2, y, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 12;

    const colW = (pageW - 28) / 3;
    const boxH = 35;
    const boxY = y;
    const labels = ['Equipo Local', 'Árbitro', 'Equipo Visitante'];
    const sublabels = [
      match.home_team_name || 'Equipo Local',
      report?.referee || match.referee || 'Árbitro',
      match.away_team_name || 'Equipo Visitante',
    ];

    labels.forEach((label, i) => {
      const x = 14 + i * colW;
      // Caja de firma
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.setFillColor(252, 252, 252);
      doc.rect(x, boxY, colW - 4, boxH, 'FD');

      // Etiqueta superior
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(74, 29, 122);
      doc.text(label, x + (colW - 4) / 2, boxY + 6, { align: 'center' });

      // Línea de firma dentro de la caja
      doc.setDrawColor(180, 180, 180);
      doc.line(x + 6, boxY + 28, x + colW - 10, boxY + 28);

      // Nombre debajo de la línea
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(sublabels[i], x + (colW - 4) / 2, boxY + 33, { align: 'center' });
    });

    doc.setTextColor(0, 0, 0);
    y = boxY + boxH + 14;

    // DNI / nombre del firmante
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Nombre y DNI del firmante:', 14, y);
    doc.setDrawColor(180, 180, 180);
    doc.line(70, y, pageW / 2 - 5, y);
    doc.text('Nombre y DNI del firmante:', pageW / 2 + 5, y);
    doc.line(pageW / 2 + 55, y, pageW - 14, y);
    y += 10;

    // Fecha y lugar
    doc.text('Fecha y lugar:', 14, y);
    doc.line(45, y, pageW - 14, y);
    y += 12;

    // Pie legal
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Documento generado por el sistema de gestión deportiva del Ayuntamiento de Torrejón de Ardoz.', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.text('Las firmas en este documento tienen carácter oficial para los trámites administrativos de la Concejalía de Deportes.', pageW / 2, y, { align: 'center' });

    // ── FOOTER con estado ─────────────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Estado acta: ${report ? (report.status === 'firmado' ? '✅ FIRMADO' : '📝 BORRADOR') : '⬜ SIN ACTA'} · Generado el ${new Date().toLocaleDateString('es-ES')}`,
      pageW - 14, pageH - 6, { align: 'right' }
    );

    const pdfBytes = doc.output('arraybuffer');
    const homeName = (match.home_team_name || 'local').replace(/\s/g, '_');
    const awayName = (match.away_team_name || 'visitante').replace(/\s/g, '_');
    const dateStr = match.match_date ? new Date(match.match_date).toISOString().slice(0, 10) : 'fecha';

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=acta_${homeName}_vs_${awayName}_${dateStr}.pdf`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});