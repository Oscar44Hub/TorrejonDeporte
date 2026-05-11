import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Play, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function InscripcionMasiva() {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [season, setSeason] = useState('2025-2026');
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [activeDetail, setActiveDetail] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResults(null);
  };

  const handleRun = async () => {
    if (!file) { toast({ title: 'Selecciona un archivo Excel primero', variant: 'destructive' }); return; }
    if (!season.trim()) { toast({ title: 'Indica la temporada', variant: 'destructive' }); return; }

    setUploading(true);
    let fileUrl;
    try {
      const uploaded = await base44.integrations.Core.UploadFile({ file });
      fileUrl = uploaded.file_url;
    } catch (e) {
      toast({ title: 'Error al subir el archivo', description: e.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    setUploading(false);
    setRunning(true);

    try {
      const res = await base44.functions.invoke('massEnrollTeams', { fileUrl, season: season.trim() });
      setResults(res.data);
      toast({ title: '¡Proceso completado!', description: `${res.data.summary?.enrolled} equipos inscritos correctamente.` });
    } catch (e) {
      toast({ title: 'Error en la inscripción masiva', description: e.message, variant: 'destructive' });
    }
    setRunning(false);
  };

  const summary = results?.summary;
  const details = results?.details;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-oswald font-bold text-3xl">Inscripción Masiva de Equipos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sube el Excel con columnas DEPORTE, CATEGORÍA y EQUIPO/CLUB para inscribir equipos en sus ligas automáticamente.
        </p>
      </div>

      {/* Aviso previo */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Importante:</strong> Las ligas deben estar creadas previamente en el sistema con los campos <strong>sport_name</strong> (DEPORTE) y <strong>category</strong> (CATEGORÍA) coincidentes con los valores del Excel, y con la <strong>temporada</strong> indicada abajo.
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        {/* Temporada */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Temporada *</label>
          <input
            type="text"
            value={season}
            onChange={e => setSeason(e.target.value)}
            placeholder="Ej: 2025-2026"
            className="border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring w-48"
          />
        </div>

        {/* Archivo */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Archivo Excel (.xlsx) *</label>
          <label className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
            <FileSpreadsheet className={`w-8 h-8 flex-shrink-0 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
            <div>
              {file ? (
                <>
                  <p className="text-sm font-medium text-primary">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB — Haz clic para cambiar</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Seleccionar archivo Excel</p>
                  <p className="text-xs text-muted-foreground">Columnas requeridas: DEPORTE, CATEGORÍA, EQUIPO/CLUB</p>
                </>
              )}
            </div>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Botón */}
        <button
          onClick={handleRun}
          disabled={uploading || running || !file}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo archivo...</> :
           running  ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando equipos...</> :
                      <><Play className="w-4 h-4" /> Iniciar inscripción masiva</>}
        </button>
      </div>

      {/* Resultados */}
      {results && summary && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={CheckCircle2} color="emerald" label="Inscritos" value={summary.enrolled} onClick={() => setActiveDetail(activeDetail === 'enrolled' ? null : 'enrolled')} />
            <StatCard icon={AlertTriangle} color="amber" label="Liga no encontrada" value={summary.skipped_league_not_found} onClick={() => setActiveDetail(activeDetail === 'notfound' ? null : 'notfound')} />
            <StatCard icon={XCircle} color="blue" label="Ya existían" value={summary.skipped_already_exists} onClick={() => setActiveDetail(activeDetail === 'exists' ? null : 'exists')} />
            <StatCard icon={XCircle} color="red" label="Errores" value={summary.errors} onClick={() => setActiveDetail(activeDetail === 'errors' ? null : 'errors')} />
          </div>

          {/* Detalle expandible */}
          {activeDetail === 'enrolled' && details?.enrolled?.length > 0 && (
            <DetailTable title="✅ Equipos inscritos" rows={details.enrolled.map(r => `${r.club} → ${r.liga}`)} />
          )}
          {activeDetail === 'notfound' && details?.skipped_league_not_found?.length > 0 && (
            <DetailTable title="⚠️ Liga no encontrada" rows={details.skipped_league_not_found.map(r => `${r.club} (${r.deporte} / ${r.categoria})`)} />
          )}
          {activeDetail === 'exists' && details?.skipped_already_exists?.length > 0 && (
            <DetailTable title="ℹ️ Ya existían" rows={details.skipped_already_exists.map(r => `${r.club} → ${r.liga}`)} />
          )}
          {activeDetail === 'errors' && details?.errors?.length > 0 && (
            <DetailTable title="❌ Errores" rows={details.errors.map(r => `${r.club}: ${r.error}`)} />
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value, onClick }) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <button onClick={onClick} className={`border rounded-xl p-4 text-left transition-all hover:shadow-md ${colors[color]}`}>
      <Icon className="w-5 h-5 mb-1 opacity-70" />
      <p className="text-2xl font-oswald font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
      {value > 0 && <p className="text-xs opacity-60 mt-0.5">Clic para ver</p>}
    </button>
  );
}

function DetailTable({ title, rows }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="max-h-60 overflow-y-auto space-y-1">
        {rows.map((r, i) => (
          <p key={i} className="text-xs text-muted-foreground border-b border-border/50 pb-1">{r}</p>
        ))}
      </div>
    </div>
  );
}