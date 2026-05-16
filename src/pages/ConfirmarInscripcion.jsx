import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ConfirmarInscripcion() {
  const [status, setStatus] = useState('loading'); // loading | success | already | rejected | error
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const tipo = params.get('tipo');
    const id = params.get('id');
    const accion = params.get('accion') || 'aceptar';

    if (!token || !tipo || !id) {
      setStatus('error');
      setErrorMsg('El enlace de confirmación no es válido o está incompleto.');
      return;
    }

    base44.functions.invoke('confirmarInscripcion', { token, tipo, id, accion })
      .then(res => {
        const data = res.data;
        if (data.success) {
          setName(data.name || '');
          if (data.already_confirmed) setStatus('already');
          else if (data.already_rejected) setStatus('already_rejected');
          else if (data.rejected) setStatus('rejected');
          else setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg(data.error || 'Error al procesar la solicitud.');
        }
      })
      .catch(err => {
        setStatus('error');
        setErrorMsg(err.message || 'Error inesperado.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md text-center p-8">

        <img
          src="https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/1121d3e1f_image.png"
          alt="TorrejónDeporte"
          className="h-12 object-contain mx-auto mb-6"
        />

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="font-oswald font-bold text-2xl mb-2">Procesando...</h2>
            <p className="text-muted-foreground text-sm">Por favor espere.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="font-oswald font-bold text-2xl mb-2 text-emerald-700">¡Inscripción aceptada!</h2>
            {name && <p className="text-lg font-semibold mb-2">{name}</p>}
            <p className="text-muted-foreground text-sm mb-6">
              Has aceptado tu inscripción correctamente. Ya puedes participar en competiciones y aparecer en los equipos.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-emerald-800">
                ✅ Tu cuenta está <strong>activa</strong>. Puedes acceder al sistema con el email que usaste en tu inscripción.
              </p>
            </div>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-colors">
              Ir al inicio
            </Link>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsDown className="w-9 h-9 text-red-600" />
            </div>
            <h2 className="font-oswald font-bold text-2xl mb-2 text-red-700">Inscripción rechazada</h2>
            {name && <p className="text-lg font-semibold mb-2">{name}</p>}
            <p className="text-muted-foreground text-sm mb-6">
              Has rechazado tu inscripción. El delegado del equipo ha sido notificado y procederá a eliminar tu registro del equipo y de la aplicación.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                Si has rechazado por error, contacta con tu delegado lo antes posible para que pueda resolverlo.
              </p>
            </div>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-colors">
              Ir al inicio
            </Link>
          </>
        )}

        {status === 'already' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-blue-600" />
            </div>
            <h2 className="font-oswald font-bold text-2xl mb-2 text-blue-700">Ya confirmado</h2>
            {name && <p className="text-lg font-semibold mb-2">{name}</p>}
            <p className="text-muted-foreground text-sm mb-6">
              Tu inscripción ya estaba confirmada anteriormente. No es necesario hacer nada más.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-colors">
              Ir al inicio
            </Link>
          </>
        )}

        {status === 'already_rejected' && (
          <>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-orange-600" />
            </div>
            <h2 className="font-oswald font-bold text-2xl mb-2 text-orange-700">Ya procesado</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Este enlace ya fue utilizado para rechazar la inscripción. Contacta con tu delegado si necesitas ayuda.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-colors">
              Ir al inicio
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>
            <h2 className="font-oswald font-bold text-2xl mb-2 text-red-700">Enlace inválido</h2>
            <p className="text-muted-foreground text-sm mb-4">{errorMsg}</p>
            <p className="text-sm text-muted-foreground mb-6">
              El enlace puede haber expirado o ya haber sido utilizado. Si crees que hay un error, contacta con la Concejalía de Deportes.
            </p>
            <Link to="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-colors">
              Ir al inicio
            </Link>
          </>
        )}

        <p className="text-xs text-muted-foreground mt-8">
          Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes
        </p>
      </div>
    </div>
  );
}