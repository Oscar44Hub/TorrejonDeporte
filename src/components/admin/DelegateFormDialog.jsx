import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Shield } from 'lucide-react';

const EMPTY = {
  full_name: '', dni: '', email: '', phone: '', club_name: '',
  address: '', birth_date: '', photo_url: '', dni_image_url: '',
  status: 'pendiente', lopd_consent: false, notes: '',
};

export default function DelegateFormDialog({ open, onOpenChange, delegate, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDni, setUploadingDni] = useState(false);

  useEffect(() => {
    setForm(delegate ? { ...EMPTY, ...delegate } : EMPTY);
  }, [delegate, open]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const uploadFile = async (file, field, setUploading) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(field, file_url);
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!form.full_name.trim() || !form.dni.trim() || !form.email.trim() || !form.club_name.trim()) return;
    if (!form.lopd_consent) {
      alert('Es obligatorio el consentimiento LOPD para registrar al delegado.');
      return;
    }
    const data = { ...form };
    if (form.lopd_consent && !delegate?.lopd_consent_date) {
      data.lopd_consent_date = new Date().toISOString();
    }
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{delegate ? 'Editar delegado' : 'Registrar nuevo delegado'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Aviso LOPD */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Los datos personales recogidos serán tratados conforme al RGPD (UE) 2016/679 y la LOPDGDD,
              con finalidad exclusiva de gestión deportiva municipal. El responsable del tratamiento es el
              Ayuntamiento de Torrejón de Ardoz.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nombre completo *</Label>
              <Input placeholder="Nombre y apellidos" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>

            {/* DNI */}
            <div className="space-y-1.5">
              <Label>DNI / NIE *</Label>
              <Input placeholder="12345678A" value={form.dni} onChange={e => set('dni', e.target.value)} />
            </div>

            {/* Fecha nacimiento */}
            <div className="space-y-1.5">
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email de contacto *</Label>
              <Input type="email" placeholder="delegado@club.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input placeholder="600 000 000" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>

            {/* Club */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Club / Asociación *</Label>
              <Input placeholder="Nombre del club deportivo" value={form.club_name} onChange={e => set('club_name', e.target.value)} />
            </div>

            {/* Dirección */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Dirección</Label>
              <Input placeholder="Calle, número, localidad" value={form.address} onChange={e => set('address', e.target.value)} />
            </div>

            {/* Estado */}
            {delegate && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Foto del delegado */}
          <div className="space-y-2">
            <Label>Foto del delegado</Label>
            <div className="flex items-center gap-3">
              {form.photo_url && (
                <img src={form.photo_url} alt="Foto" className="w-14 h-14 rounded-full object-cover border border-border" />
              )}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'photo_url', setUploadingPhoto)} />
                <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                  <span>
                    {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {form.photo_url ? 'Cambiar foto' : 'Subir foto'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Imagen DNI */}
          <div className="space-y-2">
            <Label>Imagen del DNI / NIE <span className="text-xs text-muted-foreground">(acceso restringido)</span></Label>
            <div className="border border-dashed border-border rounded-lg p-4 bg-muted/30">
              {form.dni_image_url ? (
                <div className="flex items-center gap-3">
                  <img src={form.dni_image_url} alt="DNI" className="h-16 rounded object-cover border border-border" />
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'dni_image_url', setUploadingDni)} />
                    <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                      <span>
                        {uploadingDni ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Cambiar imagen
                      </span>
                    </Button>
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'dni_image_url', setUploadingDni)} />
                  {uploadingDni
                    ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    : <Upload className="w-8 h-8 text-muted-foreground" />
                  }
                  <p className="text-sm text-muted-foreground">Haz clic para subir imagen del DNI (JPG, PNG, PDF)</p>
                </label>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Input placeholder="Observaciones (uso interno)" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {/* Consentimiento LOPD */}
          <div className="flex items-start gap-3 border border-border rounded-lg p-4 bg-muted/20">
            <Checkbox
              id="lopd"
              checked={form.lopd_consent}
              onCheckedChange={v => set('lopd_consent', !!v)}
              disabled={delegate?.lopd_consent}
            />
            <label htmlFor="lopd" className="text-sm cursor-pointer leading-relaxed">
              <strong>Consentimiento LOPD / RGPD *</strong><br />
              El interesado ha sido informado y ha prestado su consentimiento expreso al tratamiento de sus datos
              personales por parte del Ayuntamiento de Torrejón de Ardoz, conforme al RGPD (UE) 2016/679
              y la Ley Orgánica 3/2018 (LOPDGDD), con finalidad de gestión de actividades deportivas municipales.
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSubmit}
              disabled={!form.full_name.trim() || !form.dni.trim() || !form.email.trim() || !form.club_name.trim()}>
              {delegate ? 'Guardar cambios' : 'Registrar delegado'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}