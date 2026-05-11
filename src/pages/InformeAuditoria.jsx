import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

const COVER_IMG = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/8278f1bf3_generated_image.png';
const AYTO_LOGO = 'https://media.base44.com/images/public/69fb6c65a97eee4d9f984635/eb4bc3502_image.png';

const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

export default function InformeAuditoria() {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Botón de imprimir/descargar */}
      <div className="max-w-4xl mx-auto mb-6 flex gap-3 print:hidden">
        <Button onClick={handlePrint} className="bg-[#3d1a6e] hover:bg-[#2d1355] text-white gap-2">
          <Printer className="w-4 h-4" />
          Imprimir / Guardar como PDF
        </Button>
        <p className="text-sm text-gray-500 self-center">
          En el diálogo de impresión, selecciona <strong>"Guardar como PDF"</strong> como destino.
        </p>
      </div>

      {/* Documento */}
      <div ref={printRef} id="informe" className="max-w-4xl mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none">

        {/* ── PORTADA ── */}
        <div className="print-page" style={{ pageBreakAfter: 'always', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#3d1a6e', height: 12 }} />
          <div className="flex flex-col items-center justify-center flex-1 px-12 py-16 text-center">
            <img src={AYTO_LOGO} alt="Ayuntamiento de Torrejón de Ardoz" style={{ height: 80, marginBottom: 32, objectFit: 'contain' }} />
            <div style={{ background: '#3d1a6e', width: 64, height: 4, marginBottom: 32 }} />
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: '#3d1a6e', lineHeight: 1.2, marginBottom: 16 }}>
              INFORME DE AUDITORÍA TÉCNICA
            </h1>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 400, color: '#555', marginBottom: 8 }}>
              Aplicación de Gestión de Ligas Deportivas Municipales
            </h2>
            <p style={{ fontSize: 16, color: '#777', marginBottom: 48 }}>
              Ayuntamiento de Torrejón de Ardoz · Concejalía de Deportes
            </p>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '16px 32px', marginBottom: 48 }}>
              <p style={{ fontSize: 13, color: '#555', margin: 0 }}>
                <strong>Clasificación:</strong> CONFIDENCIAL — Uso interno exclusivo
              </p>
              <p style={{ fontSize: 13, color: '#555', margin: 0, marginTop: 4 }}>
                <strong>Fecha:</strong> {today}
              </p>
              <p style={{ fontSize: 13, color: '#555', margin: 0, marginTop: 4 }}>
                <strong>Versión:</strong> 1.0 — Borrador para revisión
              </p>
            </div>
            <div style={{ background: '#fff8e1', border: '1px solid #f5c518', borderRadius: 8, padding: '12px 24px' }}>
              <p style={{ fontSize: 12, color: '#7a6000', margin: 0 }}>
                Este informe ha sido elaborado con criterio técnico independiente sobre el estado actual del desarrollo.<br />
                No constituye validación legal ni jurídica. Se recomienda revisión por parte del DPD del Ayuntamiento.
              </p>
            </div>
          </div>
          <div style={{ background: '#f5c518', height: 8 }} />
        </div>

        {/* ── ÍNDICE ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="ÍNDICE" title="Contenido del Informe" />
          <TOCItem n="1" title="Resumen Ejecutivo" />
          <TOCItem n="2" title="Alcance y Metodología" />
          <TOCItem n="3" title="Hallazgos Críticos — Cumplimiento Legal (RGPD / LOPD / RD 1112/2018)" />
          <TOCItem n="4" title="Hallazgos Altos — Seguridad y Control de Accesos" />
          <TOCItem n="5" title="Hallazgos Medios — Integridad de Datos y Trazabilidad" />
          <TOCItem n="6" title="Hallazgos Bajos — Usabilidad y Validación de Datos" />
          <TOCItem n="7" title="Supuestos No Verificados y Riesgos de Proyecto" />
          <TOCItem n="8" title="Plan de Acción Priorizado" />
          <TOCItem n="9" title="Conclusiones Finales" />
          <TOCItem n="10" title="Checklist de Entrega" />
        </div>

        {/* ── SECCIÓN 1: RESUMEN EJECUTIVO ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="1" title="Resumen Ejecutivo" />
          <p style={pStyle}>
            Se ha realizado una auditoría técnica completa sobre la aplicación de gestión de ligas deportivas municipales desarrollada para la Concejalía de Deportes del Ayuntamiento de Torrejón de Ardoz. La auditoría cubre las dimensiones de cumplimiento legal, seguridad, trazabilidad, usabilidad e integridad de datos.
          </p>
          <p style={pStyle}>
            <strong>Resultado global: La aplicación en su estado actual NO está lista para entrar en producción en un entorno de Administración Pública.</strong> Se han identificado 4 hallazgos críticos que deben resolverse antes de cualquier puesta en marcha, 3 hallazgos de prioridad alta, y un conjunto de mejoras de prioridad media y baja.
          </p>
          <p style={pStyle}>
            El riesgo principal no es técnico sino legal: el tratamiento de datos personales (incluyendo DNIs e imágenes de documentos de identidad) sin el marco normativo correcto expone al Ayuntamiento a sanciones de la AEPD que pueden alcanzar los 20 millones de euros o el 4% de la facturación anual según el Reglamento General de Protección de Datos (RGPD).
          </p>

          <div style={{ background: '#fef2f2', border: '2px solid #dc2626', borderRadius: 8, padding: '16px 20px', marginTop: 24 }}>
            <p style={{ fontWeight: 700, color: '#dc2626', fontSize: 14, marginBottom: 8 }}>⚠ Hallazgos por severidad</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <SeverityBox color="#dc2626" bg="#fef2f2" label="CRÍTICOS" count="4" />
              <SeverityBox color="#ea580c" bg="#fff7ed" label="ALTOS" count="3" />
              <SeverityBox color="#ca8a04" bg="#fefce8" label="MEDIOS" count="5" />
              <SeverityBox color="#16a34a" bg="#f0fdf4" label="BAJOS" count="4" />
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 2: ALCANCE ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="2" title="Alcance y Metodología" />
          <p style={pStyle}>La auditoría ha revisado los siguientes componentes de la aplicación:</p>
          <ul style={ulStyle}>
            <li>Arquitectura de datos y modelo de entidades (Sport, League, Team, Player, Match, MatchReport, Delegate)</li>
            <li>Flujos de autenticación y autorización (roles admin/user)</li>
            <li>Tratamiento y almacenamiento de datos personales</li>
            <li>Lógica de negocio: inscripciones, sanciones, clasificaciones, actas</li>
            <li>Interfaz de usuario pública y privada (delegados y administración)</li>
            <li>Notificaciones y comunicaciones automáticas</li>
            <li>Cumplimiento con normativa aplicable a Administraciones Públicas españolas</li>
          </ul>

          <p style={{ ...pStyle, marginTop: 24 }}>
            <strong>Normativa de referencia aplicada:</strong>
          </p>
          <ul style={ulStyle}>
            <li><strong>RGPD</strong> — Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo</li>
            <li><strong>LOPDGDD</strong> — Ley Orgánica 3/2018, de 5 de diciembre</li>
            <li><strong>ENS</strong> — Esquema Nacional de Seguridad (RD 311/2022)</li>
            <li><strong>RD 1112/2018</strong> — Accesibilidad de sitios web del sector público</li>
            <li><strong>Ley 39/2015</strong> — Procedimiento Administrativo Común</li>
            <li><strong>Ley 40/2015</strong> — Régimen Jurídico del Sector Público</li>
          </ul>
        </div>

        {/* ── SECCIÓN 3: CRÍTICOS ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="3" title="Hallazgos Críticos — Cumplimiento Legal" color="#dc2626" />

          <Finding
            severity="CRÍTICO"
            id="C-01"
            title="Tratamiento de datos personales sin marco RGPD documentado"
            color="#dc2626"
            bg="#fef2f2"
          >
            <p style={pStyle}>La aplicación almacena <strong>DNIs, imágenes de documentos de identidad, correos electrónicos, teléfonos y fechas de nacimiento</strong> de personas físicas. No existe evidencia de:</p>
            <ul style={ulStyle}>
              <li>Registro de Actividades de Tratamiento (RAT) según Art. 30 RGPD</li>
              <li>Base legal explícita para cada tratamiento (Art. 6 RGPD)</li>
              <li>Política de privacidad accesible en la aplicación</li>
              <li>Cláusula informativa en los formularios de inscripción</li>
              <li>Procedimiento de ejercicio de derechos ARCO+</li>
            </ul>
            <Recommendation>
              Antes de ir a producción: (1) El DPD del Ayuntamiento debe revisar y aprobar el RAT. (2) Añadir cláusula informativa en todos los formularios que recogen datos personales. (3) Publicar política de privacidad enlazada desde la app. (4) Implementar mecanismo de ejercicio de derechos. Tiempo estimado: 2-3 semanas con apoyo jurídico.
            </Recommendation>
          </Finding>

          <Finding
            severity="CRÍTICO"
            id="C-02"
            title="Imágenes de DNI almacenadas en infraestructura de terceros sin DPA verificado"
            color="#dc2626"
            bg="#fef2f2"
          >
            <p style={pStyle}>Las imágenes del documento de identidad de los delegados se suben y almacenan en la plataforma Base44. El DNI es un dato de categoría especial en el contexto de la identificación. Para que este tratamiento sea lícito, el Ayuntamiento debe tener firmado un <strong>Contrato de Encargado de Tratamiento (DPA)</strong> con Base44 conforme al Art. 28 RGPD, con garantías de que los datos se almacenan en servidores dentro de la UE.</p>
            <Recommendation>
              Solicitar a Base44 el DPA firmable y verificar la ubicación física de los servidores. Si no existe DPA disponible, eliminar el campo de imagen de DNI de la entidad Delegate y sustituir por un proceso manual de verificación presencial. Esta decisión debe tomarla el DPD del Ayuntamiento, no el equipo de desarrollo.
            </Recommendation>
          </Finding>

          <Finding
            severity="CRÍTICO"
            id="C-03"
            title="Menores de edad sin protección específica"
            color="#dc2626"
            bg="#fef2f2"
          >
            <p style={pStyle}>Existen categorías deportivas (benjamín, infantil, juvenil) que implican jugadores menores de 14 años. El tratamiento de datos de menores requiere <strong>consentimiento expreso del tutor legal</strong> (Art. 8 RGPD, Art. 7 LOPDGDD). Actualmente no existe ningún mecanismo que:</p>
            <ul style={ulStyle}>
              <li>Detecte si un jugador inscrito es menor de 14 años</li>
              <li>Requiera o registre el consentimiento del tutor</li>
              <li>Impida inscribir menores sin ese consentimiento</li>
            </ul>
            <Recommendation>
              Añadir lógica en el formulario de inscripción de jugadores: si fecha_nacimiento indica menos de 14 años, bloquear el envío y exigir adjuntar consentimiento del tutor. Crear campo tutor_consent y tutor_name en la entidad Player. Tiempo estimado: 3-4 días de desarrollo.
            </Recommendation>
          </Finding>

          <Finding
            severity="CRÍTICO"
            id="C-04"
            title="Incumplimiento RD 1112/2018 — Accesibilidad WCAG 2.1 AA"
            color="#dc2626"
            bg="#fef2f2"
          >
            <p style={pStyle}>El Real Decreto 1112/2018 obliga a todos los organismos del sector público a que sus sitios web cumplan el estándar WCAG 2.1 nivel AA desde el 20 de septiembre de 2020. La aplicación actual presenta deficiencias graves:</p>
            <ul style={ulStyle}>
              <li>Ausencia de atributos <code>alt</code> descriptivos en imágenes funcionales</li>
              <li>Contraste de color insuficiente en elementos de texto sobre fondo púrpura oscuro</li>
              <li>Formularios sin etiquetas <code>aria-label</code> o <code>aria-describedby</code></li>
              <li>Sin Declaración de Accesibilidad publicada (obligatoria por ley)</li>
              <li>Sin opción de aumentar tamaño de texto ni modo alto contraste</li>
            </ul>
            <Recommendation>
              Realizar auditoría WCAG con herramienta automatizada (axe, Lighthouse) y manual. Publicar Declaración de Accesibilidad conforme al modelo del MPTFP. Estimado: 2-3 semanas de trabajo específico en accesibilidad.
            </Recommendation>
          </Finding>
        </div>

        {/* ── SECCIÓN 4: ALTOS ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="4" title="Hallazgos Altos — Seguridad y Control de Accesos" color="#ea580c" />

          <Finding severity="ALTO" id="A-01" title="Ausencia de autenticación de dos factores (2FA) en panel administrativo" color="#ea580c" bg="#fff7ed">
            <p style={pStyle}>El acceso al panel de administración, que contiene datos personales de cientos de jugadores y delegados, está protegido únicamente por usuario/contraseña. Cualquier credencial comprometida (phishing, reutilización de contraseña) da acceso total a todos los datos. El ENS (Esquema Nacional de Seguridad) clasifica este tipo de sistemas como categoría MEDIA, lo que exige medidas de autenticación reforzada [OP.ACC.5].</p>
            <Recommendation>
              Implementar 2FA para todos los usuarios con rol admin. La plataforma Base44 debe ofrecer esta opción o debe gestionarse externamente. Si no es posible técnicamente en la plataforma actual, documentarlo como riesgo aceptado formalmente por el responsable del Ayuntamiento.
            </Recommendation>
          </Finding>

          <Finding severity="ALTO" id="A-02" title="Modelo de roles insuficiente — Un único rol 'admin' para todos los perfiles" color="#ea580c" bg="#fff7ed">
            <p style={pStyle}>El sistema solo tiene dos roles: <strong>admin</strong> y <strong>user</strong>. En la práctica, el Ayuntamiento tendrá al menos estos perfiles con necesidades distintas:</p>
            <ul style={ulStyle}>
              <li><strong>Técnico deportivo:</strong> gestiona ligas, partidos y clasificaciones</li>
              <li><strong>Administrativo:</strong> gestiona inscripciones y delegados, pero no debería modificar resultados</li>
              <li><strong>Árbitro:</strong> necesita rellenar actas pero no ver datos de otros jugadores</li>
              <li><strong>Concejal / Dirección:</strong> acceso de solo lectura a estadísticas</li>
            </ul>
            <p style={pStyle}>Con el modelo actual, dar acceso a un administrativo implica darle acceso total a todo, incluyendo la posibilidad de modificar resultados o eliminar datos.</p>
            <Recommendation>
              Diseñar e implementar un modelo de roles granular antes de la puesta en producción. Mínimo recomendado: admin_total, tecnico_deportivo, administrativo, arbitro, solo_lectura. Tiempo estimado: 1-2 semanas de desarrollo.
            </Recommendation>
          </Finding>

          <Finding severity="ALTO" id="A-03" title="Sin log de auditoría — Imposible demostrar quién modificó qué y cuándo" color="#ea580c" bg="#fff7ed">
            <p style={pStyle}>No existe ningún registro de auditoría de cambios. Si un resultado se modifica de forma incorrecta o malintencionada, si se elimina un jugador, o si se cambia una sanción, el sistema no puede demostrar quién lo hizo ni cuándo. En un contexto de administración pública, esto tiene implicaciones legales en caso de reclamaciones, recursos de equipos o jugadores, o inspecciones de control interno.</p>
            <Recommendation>
              Implementar una entidad AuditLog que registre: entidad modificada, ID del registro, campo cambiado, valor anterior, valor nuevo, usuario, timestamp. Activar para entidades críticas: Match, MatchReport, Player (sanciones), Team (estado). Tiempo estimado: 3-4 días.
            </Recommendation>
          </Finding>
        </div>

        {/* ── SECCIÓN 5: MEDIOS ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="5" title="Hallazgos Medios — Integridad de Datos y Trazabilidad" color="#ca8a04" />

          <Finding severity="MEDIO" id="M-01" title="Las sanciones no se levantan automáticamente" color="#ca8a04" bg="#fefce8">
            <p style={pStyle}>Las sanciones a jugadores cambian su estado a "sancionado" pero no existe ningún mecanismo automático que levante la sanción cuando se hayan cumplido los partidos de suspensión. Si nadie lo desactiva manualmente, el jugador permanece sancionado indefinidamente. Esto generará errores operativos inevitables.</p>
            <Recommendation>
              Implementar lógica automática: cuando se registra un partido finalizado, el sistema debe verificar si algún jugador sancionado ha cumplido su suspensión (comparando matches_suspended con partidos jugados desde la sanción) y reactivarlo automáticamente.
            </Recommendation>
          </Finding>

          <Finding severity="MEDIO" id="M-02" title="Las actas digitales no tienen valor legal — Sin firma electrónica" color="#ca8a04" bg="#fefce8">
            <p style={pStyle}>El campo <code>status: "firmado"</code> en MatchReport es simplemente un valor en base de datos. No constituye una firma electrónica reconocida. En caso de impugnación de un resultado o una sanción, el acta "firmada" en el sistema no tiene validez legal como documento oficial.</p>
            <Recommendation>
              Dos opciones: (1) Integrar con @firma o Cl@ve del MPTFP para firma electrónica reconocida — costoso pero da validez legal plena. (2) Implementar generación de PDF del acta con hash SHA-256 sellado en tiempo (timestamp) y enviado por correo certificado a las partes — solución más pragmática y suficiente para la mayoría de casos. Recomendación: opción 2 para la versión inicial.
            </Recommendation>
          </Finding>

          <Finding severity="MEDIO" id="M-03" title="Sin gestión de categorías de edad con validación cruzada" color="#ca8a04" bg="#fefce8">
            <p style={pStyle}>Un jugador de categoría benjamín (7-8 años) puede inscribirse en una liga senior sin que el sistema genere ninguna alerta. Esto es un problema operativo que causará incidencias en el día a día.</p>
            <Recommendation>
              Añadir validación en la inscripción de jugadores que cruce la fecha de nacimiento con la categoría de la liga y genere un aviso al delegado y al administrador si hay discrepancia de edad.
            </Recommendation>
          </Finding>

          <Finding severity="MEDIO" id="M-04" title="Sin confirmación de lectura en notificaciones críticas" color="#ca8a04" bg="#fefce8">
            <p style={pStyle}>Las notificaciones de sanciones y cambios de liga se envían por email pero no hay confirmación de recepción ni lectura. Si un delegado no recibe el email (spam, dirección incorrecta) no se entera de la sanción y puede presentar al jugador en el siguiente partido, generando un conflicto en campo.</p>
            <Recommendation>
              Añadir dentro de la app un sistema de notificaciones internas visible al acceder al panel del delegado, independiente del email. El delegado debe confirmar haberlas leído. Tiempo estimado: 2-3 días.
            </Recommendation>
          </Finding>

          <Finding severity="MEDIO" id="M-05" title="Sin gestión de tasas ni pagos de inscripción" color="#ca8a04" bg="#fefce8">
            <p style={pStyle}>Las ligas municipales habitualmente conllevan una tasa de inscripción municipal. El sistema no contempla ningún flujo de pago ni de vinculación con el padrón de tasas del Ayuntamiento. Esto obliga a gestionar los pagos completamente fuera del sistema, creando un proceso manual propenso a errores.</p>
            <Recommendation>
              Aclarar con el Ayuntamiento si las tasas se gestionan por este sistema o por el sistema municipal de recaudación. Si es lo primero, integrar con pasarela de pago aprobada. Si es lo segundo, añadir un campo estado_pago en Team con valores pendiente/acreditado y flujo para que el administrativo lo confirme manualmente.
            </Recommendation>
          </Finding>
        </div>

        {/* ── SECCIÓN 6: BAJOS ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="6" title="Hallazgos Bajos — Usabilidad y Validación de Datos" color="#16a34a" />

          <Finding severity="BAJO" id="B-01" title="El DNI no se valida (formato ni dígito de control)" color="#16a34a" bg="#f0fdf4">
            <p style={pStyle}>El campo DNI en los formularios de jugadores y delegados acepta cualquier texto. Un DNI mal introducido (sin letra, con formato incorrecto, o con dígito de control erróneo) se almacena sin error. Esto corrompe silenciosamente la base de datos.</p>
            <Recommendation>Implementar validación en cliente del formato DNI/NIE español (regex + algoritmo de letra de control). 1 día de desarrollo.</Recommendation>
          </Finding>

          <Finding severity="BAJO" id="B-02" title="Sin versión imprimible de actas ni clasificaciones" color="#16a34a" bg="#f0fdf4">
            <p style={pStyle}>En el contexto deportivo municipal, los árbitros y delegados necesitan frecuentemente versiones imprimibles de las actas y clasificaciones para llevar al campo o entregar en instalaciones sin conexión.</p>
            <Recommendation>Añadir botón "Imprimir / Exportar PDF" en las páginas de acta de partido y clasificación. Ya existe función exportarActas — revisar si cubre este caso o ampliarla.</Recommendation>
          </Finding>

          <Finding severity="BAJO" id="B-03" title="El menú de administración no tiene control de sesión por inactividad" color="#16a34a" bg="#f0fdf4">
            <p style={pStyle}>Si un técnico del Ayuntamiento deja la sesión abierta en un ordenador compartido o de acceso público, cualquier persona puede acceder al panel de administración con todos los datos personales visibles.</p>
            <Recommendation>Implementar cierre de sesión automático tras 30 minutos de inactividad en el área administrativa. Verificar si Base44 lo gestiona nativamente o debe implementarse en cliente.</Recommendation>
          </Finding>

          <Finding severity="BAJO" id="B-04" title="Sin mecanismo de recuperación de contraseña documentado para delegados" color="#16a34a" bg="#f0fdf4">
            <p style={pStyle}>No está claro qué proceso sigue un delegado que pierde acceso a su cuenta. Si el proceso no está documentado y comunicado, el soporte recaerá inevitablemente sobre el técnico deportivo del Ayuntamiento, consumiendo tiempo administrativo innecesario.</p>
            <Recommendation>Documentar y publicar en la app el proceso de recuperación de acceso. Añadir sección de ayuda y contacto soporte visible para usuarios no autenticados.</Recommendation>
          </Finding>
        </div>

        {/* ── SECCIÓN 7: SUPUESTOS ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="7" title="Supuestos No Verificados y Riesgos de Proyecto" />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 16 }}>
            <thead>
              <tr style={{ background: '#3d1a6e', color: 'white' }}>
                <th style={thStyle}>Supuesto</th>
                <th style={thStyle}>Riesgo si no se cumple</th>
                <th style={thStyle}>Acción necesaria</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Los datos se almacenan en servidores UE', 'Alto — Transferencia internacional ilícita de datos', 'Verificar con Base44 y obtener garantías documentadas'],
                ['No existe pliego técnico con requisitos formales', 'Alto — Incumplimiento contractual si hay pliego', 'Solicitar pliego al Ayuntamiento antes de continuar'],
                ['Un solo técnico deportivo gestiona el sistema', 'Medio — Punto único de fallo operativo', 'Definir plan de contingencia y backup de usuario'],
                ['Los delegados tienen email corporativo o personal activo', 'Medio — Notificaciones no llegan a su destino', 'Verificar emails en el proceso de alta'],
                ['No hay integración requerida con sistemas municipales', 'Alto — Puede requerirse integración con SUMA, padrón, etc.', 'Confirmar con informática municipal'],
                ['Los árbitros no necesitan acceso al sistema', 'Medio — Proceso de actas manual y propenso a errores', 'Confirmar con la Concejalía el rol del árbitro'],
                ['El presupuesto cubre el mantenimiento posterior', 'Alto — Sin mantenimiento, la app degrada en meses', 'Definir contrato de mantenimiento y SLA'],
              ].map(([s, r, a], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td style={tdStyle}>{s}</td>
                  <td style={tdStyle}>{r}</td>
                  <td style={tdStyle}>{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── SECCIÓN 8: PLAN DE ACCIÓN ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="8" title="Plan de Acción Priorizado" />
          <p style={pStyle}>El siguiente plan asume un equipo de desarrollo de 1-2 desarrolladores. Los plazos son estimaciones técnicas que no incluyen tiempos de aprobación, revisión jurídica ni validación por parte del DPD.</p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 16 }}>
            <thead>
              <tr style={{ background: '#3d1a6e', color: 'white' }}>
                <th style={thStyle}>Fase</th>
                <th style={thStyle}>Hallazgo</th>
                <th style={thStyle}>Responsable</th>
                <th style={thStyle}>Plazo</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['FASE 0 — ANTES de cualquier desarrollo', 'Obtener DPA firmado con Base44', 'Ayuntamiento + Jurídico', 'Semana 1'],
                ['FASE 0 — ANTES de cualquier desarrollo', 'Revisar/obtener pliego técnico', 'Ayuntamiento + PM', 'Semana 1'],
                ['FASE 0 — ANTES de cualquier desarrollo', 'Designar DPD o consultar al existente', 'Ayuntamiento', 'Semana 1'],
                ['FASE 1 — Bloqueos legales (2-3 sem)', 'C-01: Cláusulas informativas RGPD en formularios', 'Desarrollo + DPD', 'Semana 2'],
                ['FASE 1 — Bloqueos legales (2-3 sem)', 'C-02: Decisión sobre imágenes DNI (eliminar o DPA)', 'Ayuntamiento + DPD', 'Semana 2'],
                ['FASE 1 — Bloqueos legales (2-3 sem)', 'C-03: Consentimiento tutor para menores', 'Desarrollo', 'Semana 3'],
                ['FASE 1 — Bloqueos legales (2-3 sem)', 'C-04: Inicio auditoría accesibilidad WCAG', 'Desarrollo + QA', 'Semana 3'],
                ['FASE 2 — Seguridad (1-2 sem)', 'A-02: Modelo de roles granular', 'Desarrollo', 'Semana 4-5'],
                ['FASE 2 — Seguridad (1-2 sem)', 'A-03: Log de auditoría de cambios', 'Desarrollo', 'Semana 4'],
                ['FASE 2 — Seguridad (1-2 sem)', 'A-01: 2FA admin (o documentar riesgo)', 'Desarrollo + Ayto', 'Semana 5'],
                ['FASE 3 — Integridad (2 sem)', 'M-01: Levantamiento automático de sanciones', 'Desarrollo', 'Semana 6'],
                ['FASE 3 — Integridad (2 sem)', 'M-04: Notificaciones internas en app', 'Desarrollo', 'Semana 6'],
                ['FASE 3 — Integridad (2 sem)', 'M-02: PDF de acta con hash/timestamp', 'Desarrollo', 'Semana 7'],
                ['FASE 4 — Calidad (1 sem)', 'B-01: Validación DNI/NIE', 'Desarrollo', 'Semana 8'],
                ['FASE 4 — Calidad (1 sem)', 'B-02: Impresión de actas y clasificaciones', 'Desarrollo', 'Semana 8'],
                ['FASE 4 — Calidad (1 sem)', 'B-03/B-04: Sesión inactividad + ayuda', 'Desarrollo', 'Semana 8'],
              ].map(([f, h, r, p], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td style={{ ...tdStyle, fontWeight: f.startsWith('FASE') ? 600 : 400, color: f.startsWith('FASE') ? '#3d1a6e' : 'inherit' }}>{f}</td>
                  <td style={tdStyle}>{h}</td>
                  <td style={tdStyle}>{r}</td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{p}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ background: '#fff8e1', border: '1px solid #f5c518', borderRadius: 8, padding: '12px 20px', marginTop: 20 }}>
            <p style={{ fontSize: 13, color: '#7a6000', margin: 0 }}>
              <strong>Nota sobre plazos:</strong> Las Fases 0 y 1 no son negociables. Ninguna de las fases posteriores tiene valor real si la base legal no está resuelta. No iniciar producción hasta completar al menos Fase 0 y Fase 1 en su totalidad.
            </p>
          </div>
        </div>

        {/* ── SECCIÓN 9: CONCLUSIONES ── */}
        <div style={{ pageBreakAfter: 'always', padding: '48px 56px' }}>
          <SectionHeader num="9" title="Conclusiones Finales" />

          <p style={pStyle}>
            La aplicación demuestra un buen nivel de madurez funcional para una primera versión. La cobertura de los procesos deportivos municipales (ligas, equipos, jugadores, partidos, clasificaciones, actas, sanciones) es correcta y el diseño es adecuado para el contexto institucional.
          </p>
          <p style={pStyle}>
            <strong>Sin embargo, hay una brecha importante entre "funciona bien" y "puede desplegarse en una administración pública española".</strong> Esa brecha no es de funcionalidades, es de cumplimiento normativo, y no puede cerrarse solo con código.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24, marginBottom: 24 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #16a34a', borderRadius: 8, padding: 16 }}>
              <p style={{ fontWeight: 700, color: '#15803d', marginBottom: 8, fontSize: 14 }}>✓ Puntos fuertes</p>
              <ul style={{ ...ulStyle, marginTop: 0 }}>
                <li>Arquitectura de datos coherente y bien modelada</li>
                <li>Separación correcta de áreas pública/privada/admin</li>
                <li>Flujos de inscripción completos y usables</li>
                <li>Diseño visual institucional apropiado</li>
                <li>Notificaciones automáticas implementadas</li>
                <li>Generación de documentos PDF existente</li>
              </ul>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 8, padding: 16 }}>
              <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8, fontSize: 14 }}>✗ Bloqueos para producción</p>
              <ul style={{ ...ulStyle, marginTop: 0 }}>
                <li>Sin marco RGPD documentado</li>
                <li>DNIs e imágenes de identidad sin DPA</li>
                <li>Sin protección específica para menores</li>
                <li>Sin cumplimiento de accesibilidad (RD 1112/2018)</li>
                <li>Modelo de roles insuficiente para uso real</li>
                <li>Sin log de auditoría de cambios</li>
              </ul>
            </div>
          </div>

          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '20px 24px', borderLeft: '4px solid #3d1a6e' }}>
            <p style={{ fontWeight: 700, color: '#3d1a6e', marginBottom: 8 }}>Veredicto técnico</p>
            <p style={{ fontSize: 13, color: '#333', margin: 0, lineHeight: 1.7 }}>
              <strong>Confianza en el estado actual para producción en AAPP: 35%.</strong><br />
              Confianza en la base técnica para llegar al 90% si se ejecuta el plan de acción correctamente: <strong>85%</strong>.<br /><br />
              El 15% restante de incertidumbre se debe a: (1) desconocimiento del pliego técnico contractual, (2) posibles requisitos de integración con sistemas municipales no identificados, y (3) la decisión sobre el DPA con Base44, que está fuera del control del equipo de desarrollo.
            </p>
          </div>
        </div>

        {/* ── SECCIÓN 10: CHECKLIST ── */}
        <div style={{ padding: '48px 56px' }}>
          <SectionHeader num="10" title="Checklist de Entrega — No desplegar sin marcar todo" />
          <p style={{ ...pStyle, color: '#dc2626', fontWeight: 600 }}>Este checklist debe completarse y ser firmado por el responsable técnico del Ayuntamiento antes de la puesta en producción.</p>

          {[
            { cat: 'LEGAL / RGPD', items: [
              'DPA firmado con el proveedor de infraestructura (Base44)',
              'RAT (Registro de Actividades de Tratamiento) revisado y aprobado por el DPD',
              'Cláusulas informativas RGPD en todos los formularios con datos personales',
              'Política de privacidad publicada y accesible',
              'Procedimiento de ejercicio de derechos ARCO+ documentado y operativo',
              'Consentimiento de tutor para menores de 14 años implementado',
            ]},
            { cat: 'SEGURIDAD', items: [
              '2FA activado para todos los usuarios administradores',
              'Modelo de roles granular implementado y validado',
              'Log de auditoría de cambios activo en entidades críticas',
              'Cierre de sesión por inactividad configurado',
              'Test de penetración básico realizado (o riesgo documentado)',
            ]},
            { cat: 'ACCESIBILIDAD', items: [
              'Auditoría WCAG 2.1 AA realizada con herramienta automatizada',
              'Declaración de Accesibilidad publicada en la app',
              'Contraste de colores verificado en todos los elementos de texto',
            ]},
            { cat: 'FUNCIONAL', items: [
              'Levantamiento automático de sanciones implementado y probado',
              'Validación de DNI/NIE implementada en todos los formularios',
              'Notificaciones internas en app (independientes del email) operativas',
              'PDF de acta con timestamp implementado',
              'Validación cruzada de categoría de edad activa',
            ]},
            { cat: 'PROYECTO', items: [
              'Pliego técnico revisado y confirmada cobertura de todos los requisitos',
              'Plan de mantenimiento y SLA post-lanzamiento acordado',
              'Formación al personal del Ayuntamiento realizada',
              'Procedimiento de soporte y gestión de incidencias definido',
            ]},
          ].map(({ cat, items }) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 700, color: '#3d1a6e', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</p>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #aaa', borderRadius: 3, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Firma */}
          <div style={{ marginTop: 40, borderTop: '1px solid #ddd', paddingTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <div>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 32 }}>Responsable técnico del Ayuntamiento</p>
              <div style={{ borderBottom: '1px solid #333', height: 1 }} />
              <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Nombre, cargo y fecha</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#999', marginBottom: 32 }}>Responsable del equipo de desarrollo</p>
              <div style={{ borderBottom: '1px solid #333', height: 1 }} />
              <p style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Nombre, empresa y fecha</p>
            </div>
          </div>

          <div style={{ marginTop: 32, textAlign: 'center', paddingBottom: 8 }}>
            <div style={{ background: '#f5c518', height: 4, borderRadius: 2 }} />
            <p style={{ fontSize: 11, color: '#999', marginTop: 12 }}>
              Documento confidencial · Concejalía de Deportes · Ayuntamiento de Torrejón de Ardoz · {today}
            </p>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          @page { margin: 0; size: A4; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-componentes ──

const pStyle = { fontSize: 14, color: '#333', lineHeight: 1.7, marginBottom: 12 };
const ulStyle = { fontSize: 14, color: '#333', lineHeight: 2, paddingLeft: 20, marginBottom: 12 };
const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12 };
const tdStyle = { padding: '8px 12px', fontSize: 12, color: '#444', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' };

function SectionHeader({ num, title, color = '#3d1a6e' }) {
  return (
    <div style={{ borderBottom: `3px solid ${color}`, paddingBottom: 12, marginBottom: 24 }}>
      <p style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Sección {num}</p>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color, margin: 0 }}>{title}</h2>
    </div>
  );
}

function TOCItem({ n, title }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #ddd', padding: '8px 0', fontSize: 14, color: '#333' }}>
      <span><strong style={{ color: '#3d1a6e', marginRight: 8 }}>{n}.</strong>{title}</span>
    </div>
  );
}

function SeverityBox({ color, bg, label, count }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}`, borderRadius: 6, padding: '12px 8px', textAlign: 'center' }}>
      <p style={{ fontSize: 24, fontWeight: 700, color, margin: 0 }}>{count}</p>
      <p style={{ fontSize: 11, color, fontWeight: 600, margin: 0, marginTop: 4 }}>{label}</p>
    </div>
  );
}

function Finding({ severity, id, title, color, bg, children }) {
  return (
    <div style={{ border: `1px solid ${color}`, borderRadius: 8, marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ background: color, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{severity}</span>
        <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{id}</span>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ background: bg, padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  );
}

function Recommendation({ children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: 6, padding: '10px 14px', marginTop: 8 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>→ RECOMENDACIÓN</p>
      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}