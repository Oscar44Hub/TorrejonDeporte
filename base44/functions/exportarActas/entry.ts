import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { leagueId, leagueName } = await req.json();

    const reports = await base44.asServiceRole.entities.MatchReport.filter({ league_id: leagueId });

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    reports.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

    reports.forEach((report, idx) => {
      if (idx > 0) doc.addPage();

      // Header
      doc.setFillColor(74, 29, 122);
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setTextColor(245, 197, 24);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ACTA DE PARTIDO', pageW / 2, 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz', pageW / 2, 20, { align: 'center' });
      doc.text(leagueName, pageW / 2, 27, { align: 'center' });

      // Info partido
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const matchDate = report.match_date ? new Date(report.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
      doc.text(`${report.home_team_name} vs ${report.away_team_name}`, 14, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Fecha: ${matchDate}`, 14, 50);
      doc.text(`Árbitro: ${report.referee || 'No registrado'}`, 14, 57);
      if (report.venue) doc.text(`Instalación: ${report.venue}`, 14, 64);

      // Resultado
      doc.setFillColor(245, 197, 24);
      doc.rect(pageW / 2 - 20, 38, 40, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(74, 29, 122);
      doc.text(`${report.home_score ?? '—'} - ${report.away_score ?? '—'}`, pageW / 2, 51, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      let y = 75;

      // Incidencias
      if (report.incidents?.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('INCIDENCIAS', 14, y);
        y += 6;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, pageW - 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        report.incidents.forEach(inc => {
          if (y > 260) { doc.addPage(); y = 20; }
          const tipoMap = { gol: '⚽ Gol', tarjeta_amarilla: '🟨 T.Amarilla', tarjeta_roja: '🟥 T.Roja', doble_amarilla: '🟨🟥 Doble', lesion: '🏥 Lesión', sustitucion: '🔄 Sust.', penalti: '⚡ Penalti', otro: '📝 Otro' };
          const tipo = tipoMap[inc.type] || inc.type;
          const linea = `min.${inc.minute || '?'}  ${tipo}  ${inc.player_name || 'Sin jugador'}  (${inc.team_name || '—'})`;
          doc.text(linea, 16, y);
          if (inc.description) {
            y += 4;
            doc.setTextColor(100, 100, 100);
            doc.text(`  → ${inc.description}`, 18, y);
            doc.setTextColor(0, 0, 0);
          }
          y += 6;
        });
        y += 4;
      }

      // Sanciones
      if (report.sanctions?.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(180, 0, 0);
        doc.text('SANCIONES', 14, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, pageW - 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        report.sanctions.forEach(s => {
          if (y > 260) { doc.addPage(); y = 20; }
          const reasonMap = { tarjeta_roja: 'T.Roja directa', doble_amarilla: 'Doble amarilla', acumulacion_amarillas: 'Acum. amarillas', conducta_antideportiva: 'Conducta antidep.', otro: 'Otro' };
          const linea = `${s.player_name || '—'}  (${s.team_name || '—'})  —  ${reasonMap[s.reason] || s.reason}  —  ${s.matches_suspended || 1} partido(s)`;
          doc.text(linea, 16, y);
          y += 6;
        });
        y += 4;
      }

      // Notas
      if (report.general_notes) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('OBSERVACIONES', 14, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(report.general_notes, pageW - 28);
        lines.forEach(line => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, 14, y);
          y += 5;
        });
      }

      // Estado
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Estado: ${report.status === 'firmado' ? '✅ FIRMADO' : 'BORRADOR'}`, pageW - 14, 285, { align: 'right' });
    });

    if (reports.length === 0) {
      doc.setFontSize(14);
      doc.text('No hay actas registradas para esta liga.', 14, 50);
    }

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=actas_${(leagueName || 'liga').replace(/\s/g, '_')}.pdf`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});