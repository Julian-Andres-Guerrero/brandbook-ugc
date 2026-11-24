// Textos legales bilingües. Edítalos aquí; el nombre y el correo salen de src/config.ts.
import { Link } from 'react-router-dom'
import { INACTIVITY_DELETE_DAYS as DEL, INACTIVITY_WARN_DAYS as WARN, LEGAL_EMAIL as MAIL, SITE_NAME as N } from '../../config'
import type { LegalDoc } from './LegalPage'

const Mail = () => <a href={`mailto:${MAIL}`}>{MAIL}</a>

export const terms: LegalDoc = {
  title: { en: 'Terms and Conditions', es: 'Términos y Condiciones' },
  body: {
    es: (
      <>
        <h2>1. Qué es {N}</h2>
        <p>{N} es una plataforma web que permite a creadores de contenido UGC (contenido generado por usuarios) publicar un perfil público tipo "link en bio" con su portafolio, y llevar un panel privado para registrar productos recibidos, pagos y facturas. Al crear una cuenta o usar el sitio aceptas estos Términos.</p>
        <h2>2. Requisito de edad</h2>
        <p>Solo pueden registrarse personas de <strong>18 años o más</strong>. Al registrarte confirmas que cumples este requisito. Si detectamos una cuenta de un menor, la eliminaremos.</p>
        <h2>3. Tu cuenta</h2>
        <ul>
          <li>Eres responsable de la veracidad de los datos que publicas y de mantener segura tu contraseña. Te recomendamos activar la verificación en dos pasos.</li>
          <li>Tu nombre de usuario define tu URL pública (/@usuario). No puedes usar nombres que suplanten a otra persona o marca.</li>
          <li>Debes avisarnos de inmediato a <Mail /> si sospechas un acceso no autorizado.</li>
        </ul>
        <h2>4. Contenido prohibido</h2>
        <p>No puedes publicar contenido ilegal; que infrinja derechos de autor, marcas o privacidad de terceros; engañoso (por ejemplo, campañas o colaboraciones inventadas); de odio, acoso, violencia o sexual explícito; malware, spam o enlaces fraudulentos; ni datos personales de otras personas sin su permiso.</p>
        <h2>5. Contenido de los creadores</h2>
        <p>Conservas la propiedad de tus videos, fotos y textos. Las condiciones de licencia y el procedimiento de reporte por derechos de autor están en las <Link to="/legal/contenido">Reglas de contenido y DMCA</Link>.</p>
        <h2>6. Panel privado y finanzas</h2>
        <p>El panel es una <strong>herramienta de registro personal</strong>. {N} no es un servicio de contabilidad, asesoría fiscal ni legal. Los totales e informes dependen de los datos que tú ingresas; verifica con un profesional cómo declarar tus ingresos.</p>
        <h2>7. Cuentas inactivas</h2>
        <p>Si tu cuenta no registra actividad (inicio de sesión o uso del panel) durante <strong>{WARN} días</strong>, te enviaremos un aviso al correo de tu cuenta. Si en los <strong>{DEL} días</strong> siguientes al aviso no hay actividad, <strong>eliminaremos tu cuenta y todos sus datos de forma definitiva</strong> (perfil público, campañas, registros, facturas e historial), <strong>sin posibilidad de recuperación</strong>. Para evitarlo basta con iniciar sesión. Te recomendamos exportar periódicamente un respaldo desde Cuenta y seguridad.</p>
        <h2>8. Suspensión y cancelación</h2>
        <p>Podemos suspender o eliminar cuentas que incumplan estos Términos, reciban reportes válidos de infracción reiterada o pongan en riesgo la seguridad de la plataforma. Puedes eliminar tu cuenta en cualquier momento desde el panel.</p>
        <h2>9. Disponibilidad y limitación de responsabilidad</h2>
        <p>La plataforma se ofrece "tal cual" y "según disponibilidad", actualmente sin costo. Aplicamos medidas razonables de seguridad y respaldo, pero no garantizamos que el servicio esté libre de interrupciones o errores. En la máxima medida permitida por la ley, {N} no responde por daños indirectos, pérdida de ingresos, pérdida de datos derivada de la regla de inactividad o de la eliminación solicitada por ti, ni por decisiones fiscales tomadas con base en el panel. Mantén tus propios respaldos.</p>
        <h2>10. Cambios</h2>
        <p>Podemos actualizar estos Términos. Si el cambio es importante, te avisaremos por correo o dentro de la plataforma antes de que entre en vigor.</p>
        <h2>11. Ley aplicable y contacto</h2>
        <p>Estos Términos se rigen por las leyes del Estado de Florida, EE. UU., sin perjuicio de los derechos que te otorguen las leyes de protección al consumidor y de datos de tu país. Contacto: <Mail />.</p>
      </>
    ),
    en: (
      <>
        <h2>1. What {N} is</h2>
        <p>{N} is a web platform that lets UGC (user-generated content) creators publish a public link-in-bio profile with their portfolio, and keep a private panel to log products received, payments and invoices. By creating an account or using the site you accept these Terms.</p>
        <h2>2. Age requirement</h2>
        <p>Only people <strong>18 years of age or older</strong> may register. By signing up you confirm you meet this requirement. Accounts belonging to minors will be deleted.</p>
        <h2>3. Your account</h2>
        <ul>
          <li>You are responsible for the accuracy of what you publish and for keeping your password secure. We recommend enabling two-step verification.</li>
          <li>Your username defines your public URL (/@username). You may not use names that impersonate another person or brand.</li>
          <li>Tell us right away at <Mail /> if you suspect unauthorized access.</li>
        </ul>
        <h2>4. Prohibited content</h2>
        <p>You may not publish illegal content; content infringing copyright, trademarks or privacy of others; misleading content (e.g. invented campaigns or collaborations); hate, harassment, violence or sexually explicit content; malware, spam or fraudulent links; or other people's personal data without permission.</p>
        <h2>5. Creator content</h2>
        <p>You keep ownership of your videos, photos and text. License terms and the copyright reporting procedure are in the <Link to="/legal/contenido">Content rules & DMCA</Link>.</p>
        <h2>6. Private panel and finances</h2>
        <p>The panel is a <strong>personal record-keeping tool</strong>. {N} is not an accounting, tax or legal advisory service. Totals and reports depend on the data you enter; check with a professional how to report your income.</p>
        <h2>7. Inactive accounts</h2>
        <p>If your account has no activity (sign-in or panel use) for <strong>{WARN} days</strong>, we will email a notice to your account address. If there is no activity during the <strong>{DEL} days</strong> after that notice, <strong>we will permanently delete your account and all its data</strong> (public profile, campaigns, records, invoices and history), <strong>with no possibility of recovery</strong>. Signing in is enough to prevent it. We recommend exporting a backup regularly from Account & security.</p>
        <h2>8. Suspension and termination</h2>
        <p>We may suspend or delete accounts that breach these Terms, receive valid repeat-infringement reports or endanger platform security. You may delete your account at any time from the panel.</p>
        <h2>9. Availability and limitation of liability</h2>
        <p>The platform is provided "as is" and "as available", currently free of charge. We apply reasonable security and backup measures but do not guarantee uninterrupted or error-free service. To the maximum extent permitted by law, {N} is not liable for indirect damages, lost income, data loss resulting from the inactivity rule or from deletion you requested, or tax decisions made based on the panel. Keep your own backups.</p>
        <h2>10. Changes</h2>
        <p>We may update these Terms. For material changes we will notify you by email or in the platform before they take effect.</p>
        <h2>11. Governing law and contact</h2>
        <p>These Terms are governed by the laws of the State of Florida, USA, without prejudice to consumer and data protection rights granted by the laws of your country. Contact: <Mail />.</p>
      </>
    ),
  },
}

export const privacy: LegalDoc = {
  title: { en: 'Privacy Policy', es: 'Política de Privacidad y Tratamiento de Datos' },
  body: {
    es: (
      <>
        <p>Esta política explica cómo {N} trata tus datos personales, alineada con el RGPD/GDPR (Unión Europea), la CCPA/CPRA (California), la Ley 1581 de 2012 (Colombia) y buenas prácticas de ISO/IEC 27701. Responsable del tratamiento: el operador de {N}, contacto <Mail />.</p>
        <h2>1. Qué datos recogemos</h2>
        <ul>
          <li><strong>Cuenta:</strong> correo y contraseña (guardada solo como hash seguro; nadie, ni siquiera el operador, puede verla).</li>
          <li><strong>Perfil público</strong> (lo que tú decides publicar): nombre, usuario, foto, ciudad, biografía, nichos, servicios, redes sociales, campañas, links a videos y, si lo activas, un email de contacto.</li>
          <li><strong>Panel privado:</strong> productos, marcas, campañas, plataformas, fechas, valores, pagos, notas y facturas adjuntas.</li>
          <li><strong>Seguridad:</strong> registro de eventos (inicios de sesión, cambios y borrados, sin copiar los valores), y datos técnicos mínimos que nuestros proveedores registran para operar y proteger el servicio (como dirección IP).</li>
        </ul>
        <h2>2. Para qué los usamos</h2>
        <ul>
          <li>Prestar el servicio: mostrar tu perfil público y darte acceso a tu panel (ejecución del contrato).</li>
          <li>Seguridad, prevención de abusos y auditoría (interés legítimo).</li>
          <li>Enviarte correos del servicio: confirmación, recuperación de contraseña y avisos de inactividad.</li>
          <li>Analítica agregada del sitio <strong>solo si la aceptas</strong> en el aviso de cookies (consentimiento).</li>
        </ul>
        <p>No vendemos ni compartimos tus datos para publicidad. Los datos del panel nunca se muestran en la parte pública.</p>
        <h2>3. Con quién se comparten (encargados)</h2>
        <ul>
          <li><strong>Supabase</strong> (base de datos, autenticación y almacenamiento de archivos).</li>
          <li><strong>Cloudflare</strong> (hosting del sitio, red y, si la aceptas, Web Analytics).</li>
          <li><strong>Proveedor de correo transaccional</strong> (por ejemplo Resend) para los correos del servicio.</li>
        </ul>
        <p>Estos proveedores pueden procesar datos en EE. UU. u otros países, con las garantías contractuales que ofrecen (como cláusulas contractuales tipo). Solo compartiremos datos con autoridades cuando la ley lo exija.</p>
        <h2>4. Cómo los protegemos</h2>
        <ul>
          <li>Cifrado en tránsito (HTTPS/TLS) y en reposo (AES-256) para la base de datos y los archivos.</li>
          <li>Seguridad a nivel de base de datos (Row Level Security): cada usuario solo puede leer y modificar sus propios datos.</li>
          <li>Facturas en almacenamiento privado, accesibles solo mediante enlaces firmados temporales para su dueño.</li>
          <li>Verificación en dos pasos opcional, límite de intentos de inicio de sesión y respaldos de la base de datos.</li>
        </ul>
        <h2>5. Cuánto tiempo los guardamos</h2>
        <p>Mientras tu cuenta exista. Si la eliminas, borramos tus datos de inmediato de la base de datos activa; las copias de respaldo se sobrescriben en su ciclo normal de retención. Las cuentas sin actividad durante <strong>{WARN} días</strong> reciben un aviso por correo y, si no hay actividad en los <strong>{DEL} días</strong> siguientes, se eliminan por completo y de forma irrecuperable.</p>
        <h2>6. Tus derechos</h2>
        <p>Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación, supresión (cancelación), oposición, portabilidad y limitación</strong>, y retirar tu consentimiento:</p>
        <ul>
          <li>Ver y corregir tus datos desde el panel.</li>
          <li>Exportarlos en JSON y CSV desde Cuenta y seguridad.</li>
          <li>Eliminar tu cuenta con todos sus datos desde Cuenta y seguridad.</li>
          <li>Escribirnos a <Mail /> para cualquier otra solicitud; respondemos en un máximo de 15 días hábiles (Colombia) o 30/45 días según GDPR/CCPA.</li>
        </ul>
        <p>Residentes de California: no vendemos ni "compartimos" datos personales en el sentido de la CCPA/CPRA y no te discriminaremos por ejercer tus derechos. También puedes presentar una queja ante tu autoridad de protección de datos (por ejemplo, la Superintendencia de Industria y Comercio en Colombia).</p>
        <h2>7. Menores</h2>
        <p>El servicio es solo para mayores de 18 años. No recogemos conscientemente datos de menores.</p>
        <h2>8. Cambios</h2>
        <p>Publicaremos aquí cualquier cambio y, si es importante, te avisaremos por correo.</p>
      </>
    ),
    en: (
      <>
        <p>This policy explains how {N} handles your personal data, aligned with the GDPR (EU), CCPA/CPRA (California), Colombian Law 1581 of 2012 and ISO/IEC 27701 good practices. Data controller: the operator of {N}, contact <Mail />.</p>
        <h2>1. Data we collect</h2>
        <ul>
          <li><strong>Account:</strong> email and password (stored only as a secure hash; nobody, not even the operator, can see it).</li>
          <li><strong>Public profile</strong> (what you choose to publish): name, username, photo, city, bio, niches, services, social links, campaigns, video links and, if enabled, a contact email.</li>
          <li><strong>Private panel:</strong> products, brands, campaigns, platforms, dates, values, payments, notes and attached invoices.</li>
          <li><strong>Security:</strong> event log (sign-ins, changes and deletions, without copying values), and minimal technical data our providers log to run and protect the service (such as IP address).</li>
        </ul>
        <h2>2. Why we use it</h2>
        <ul>
          <li>To provide the service: show your public profile and give you access to your panel (contract).</li>
          <li>Security, abuse prevention and auditing (legitimate interest).</li>
          <li>Service emails: confirmation, password recovery and inactivity notices.</li>
          <li>Aggregate site analytics <strong>only if you accept it</strong> in the cookie notice (consent).</li>
        </ul>
        <p>We do not sell or share your data for advertising. Panel data is never shown publicly.</p>
        <h2>3. Who we share it with (processors)</h2>
        <ul>
          <li><strong>Supabase</strong> (database, authentication and file storage).</li>
          <li><strong>Cloudflare</strong> (site hosting, network and, if accepted, Web Analytics).</li>
          <li><strong>Transactional email provider</strong> (e.g. Resend) for service emails.</li>
        </ul>
        <p>These providers may process data in the US or other countries under their contractual safeguards (such as standard contractual clauses). We only disclose data to authorities when required by law.</p>
        <h2>4. How we protect it</h2>
        <ul>
          <li>Encryption in transit (HTTPS/TLS) and at rest (AES-256) for the database and files.</li>
          <li>Database-level security (Row Level Security): each user can only read and change their own data.</li>
          <li>Invoices in private storage, reachable only through temporary signed links for their owner.</li>
          <li>Optional two-step verification, sign-in rate limiting and database backups.</li>
        </ul>
        <h2>5. How long we keep it</h2>
        <p>While your account exists. If you delete it, we erase your data immediately from the live database; backups are overwritten in their normal retention cycle. Accounts with no activity for <strong>{WARN} days</strong> receive an email notice and, if there is no activity in the following <strong>{DEL} days</strong>, are permanently and irrecoverably deleted.</p>
        <h2>6. Your rights</h2>
        <p>You may exercise your rights of <strong>access, rectification, erasure, objection, portability and restriction</strong> at any time, and withdraw consent:</p>
        <ul>
          <li>View and correct your data in the panel.</li>
          <li>Export it as JSON and CSV from Account & security.</li>
          <li>Delete your account with all its data from Account & security.</li>
          <li>Email <Mail /> for any other request; we reply within 30 days (GDPR) or 45 days (CCPA).</li>
        </ul>
        <p>California residents: we do not sell or "share" personal information as defined by the CCPA/CPRA and will not discriminate against you for exercising your rights. You may also complain to your data protection authority.</p>
        <h2>7. Minors</h2>
        <p>The service is for people 18 and older only. We do not knowingly collect data from minors.</p>
        <h2>8. Changes</h2>
        <p>We will post any change here and, if material, notify you by email.</p>
      </>
    ),
  },
}

const CookieTable = ({ es }: { es: boolean }) => (
  <div className="overflow-x-auto">
    <table className="mt-3 w-full text-left text-sm">
      <thead className="text-muted">
        <tr><th className="py-2 pr-3">{es ? 'Nombre' : 'Name'}</th><th className="py-2 pr-3">{es ? 'Tipo' : 'Type'}</th><th className="py-2 pr-3">{es ? 'Finalidad' : 'Purpose'}</th><th className="py-2">{es ? 'Duración' : 'Duration'}</th></tr>
      </thead>
      <tbody className="text-muted">
        <tr className="border-t border-line"><td className="py-2 pr-3"><code>sb-*-auth-token</code></td><td className="pr-3">{es ? 'Esencial (localStorage)' : 'Essential (localStorage)'}</td><td className="pr-3">{es ? 'Mantener tu sesión iniciada de forma segura.' : 'Keep you securely signed in.'}</td><td>{es ? 'Hasta cerrar sesión' : 'Until sign-out'}</td></tr>
        <tr className="border-t border-line"><td className="py-2 pr-3"><code>cookie-consent</code></td><td className="pr-3">{es ? 'Esencial (localStorage)' : 'Essential (localStorage)'}</td><td className="pr-3">{es ? 'Recordar tu elección sobre cookies.' : 'Remember your cookie choice.'}</td><td>{es ? 'Hasta que la cambies' : 'Until you change it'}</td></tr>
        <tr className="border-t border-line"><td className="py-2 pr-3"><code>lang</code></td><td className="pr-3">{es ? 'Preferencia (localStorage)' : 'Preference (localStorage)'}</td><td className="pr-3">{es ? 'Recordar el idioma.' : 'Remember your language.'}</td><td>{es ? 'Permanente' : 'Persistent'}</td></tr>
        <tr className="border-t border-line"><td className="py-2 pr-3"><code>login-failures</code>, <code>last-activity-ping</code></td><td className="pr-3">{es ? 'Esencial (localStorage)' : 'Essential (localStorage)'}</td><td className="pr-3">{es ? 'Freno de intentos de inicio de sesión y registro de actividad de la cuenta.' : 'Sign-in attempt throttling and account activity tracking.'}</td><td>{es ? 'Minutos / 1 hora' : 'Minutes / 1 hour'}</td></tr>
        <tr className="border-t border-line"><td className="py-2 pr-3">{es ? 'Reproductores de TikTok, Instagram y YouTube' : 'TikTok, Instagram and YouTube players'}</td><td className="pr-3">{es ? 'Terceros (solo al reproducir)' : 'Third party (only on play)'}</td><td className="pr-3">{es ? 'Mostrar el video dentro del perfil. Solo se cargan cuando tocas "Reproducir aquí"; esas redes pueden usar sus propias cookies según sus políticas. YouTube se carga en modo de privacidad mejorada (youtube-nocookie). Antes de reproducir solo se muestra la miniatura de YouTube desde i.ytimg.com, que no guarda cookies.' : 'Show the video inside the profile. They only load when you tap "Play here"; those networks may set their own cookies under their policies. YouTube loads in privacy-enhanced mode (youtube-nocookie). Before play, only the YouTube thumbnail is shown from i.ytimg.com, which sets no cookies.'}</td><td>{es ? 'Según cada red' : 'Per network'}</td></tr>
        <tr className="border-t border-line"><td className="py-2 pr-3">Cloudflare Web Analytics</td><td className="pr-3">{es ? 'Analítica (opcional)' : 'Analytics (optional)'}</td><td className="pr-3">{es ? 'Estadísticas agregadas de visitas, sin cookies de rastreo ni perfiles. Solo si la aceptas.' : 'Aggregate visit statistics, no tracking cookies or profiling. Only if you accept.'}</td><td>{es ? 'Sesión' : 'Session'}</td></tr>
      </tbody>
    </table>
  </div>
)

export const cookies: LegalDoc = {
  title: { en: 'Cookie Policy', es: 'Política de Cookies' },
  body: {
    es: (
      <>
        <p>{N} usa el mínimo de almacenamiento en tu navegador. No usamos cookies publicitarias. Los videos de los perfiles no cargan el reproductor de TikTok, Instagram o YouTube hasta que el visitante toca "Reproducir aquí" (antes solo se ve la portada).</p>
        <h2>Qué usamos</h2>
        <CookieTable es />
        <h2>Tu elección</h2>
        <p>Las opciones esenciales son necesarias para que el sitio funcione y no requieren consentimiento. La analítica <strong>no se activa hasta que la aceptes</strong>. Puedes rechazarla o cambiar tu elección en cualquier momento desde "Preferencias de cookies" en el pie de página. Si borras el almacenamiento del navegador, se cerrará tu sesión y te volveremos a preguntar.</p>
        <p>Dudas: <Mail />.</p>
      </>
    ),
    en: (
      <>
        <p>{N} uses the minimum browser storage. We do not use advertising cookies. Profile videos do not load the TikTok, Instagram or YouTube player until the visitor taps "Play here" (before that, only the cover is shown).</p>
        <h2>What we use</h2>
        <CookieTable es={false} />
        <h2>Your choice</h2>
        <p>Essential items are required for the site to work and do not need consent. Analytics <strong>is not enabled until you accept it</strong>. You can reject it or change your choice at any time from "Cookie preferences" in the footer. If you clear browser storage you will be signed out and asked again.</p>
        <p>Questions: <Mail />.</p>
      </>
    ),
  },
}

export const content: LegalDoc = {
  title: { en: 'Content Rules & Copyright (DMCA)', es: 'Reglas de Contenido y Derechos de Autor (DMCA)' },
  body: {
    es: (
      <>
        <h2>1. Tu contenido es tuyo</h2>
        <p>Cada creador conserva la propiedad y todos los derechos de sus videos, fotos y textos. Al publicarlos en tu perfil concedes a {N} únicamente una <strong>licencia no exclusiva, gratuita y revocable para mostrarlos dentro de tu perfil</strong> y lo necesario para alojarlos técnicamente. La licencia termina cuando borras el contenido o tu cuenta. No usamos tu contenido para publicidad ni lo cedemos a terceros.</p>
        <h2>2. Lo que publicas</h2>
        <p>Solo publica campañas y videos en los que participaste de verdad y que tienes derecho a mostrar. Respeta los acuerdos con las marcas (por ejemplo, exclusividad o embargos de publicación) y las reglas de divulgación de publicidad (FTC en EE. UU.).</p>
        <h2>3. Reportar contenido que infringe derechos de autor</h2>
        <p>Si crees que un perfil usa tu obra sin permiso, envía un aviso a <Mail /> con el asunto "DMCA" que incluya:</p>
        <ul>
          <li>Tu nombre, dirección, teléfono y correo.</li>
          <li>La obra protegida y la URL exacta del contenido en {N}.</li>
          <li>Una declaración de buena fe de que el uso no está autorizado.</li>
          <li>Una declaración, bajo pena de perjurio, de que la información es exacta y de que eres el titular o estás autorizado a actuar en su nombre.</li>
          <li>Tu firma física o electrónica.</li>
        </ul>
        <p>Retiraremos o desactivaremos el contenido reportado con prontitud y avisaremos al creador.</p>
        <h2>4. Contra-notificación</h2>
        <p>Si eres el creador y crees que el retiro fue un error, puedes enviar una contra-notificación a <Mail /> con tus datos, la identificación del contenido retirado, una declaración bajo pena de perjurio de que fue un error, y tu aceptación de la jurisdicción de los tribunales federales correspondientes. Podremos restaurar el contenido en 10 a 14 días hábiles salvo que el reclamante inicie una acción judicial.</p>
        <h2>5. Infractores reincidentes</h2>
        <p>Eliminaremos las cuentas de quienes infrinjan derechos de forma reiterada.</p>
        <h2>6. Otros reportes</h2>
        <p>Para reportar contenido prohibido por los <Link to="/legal/terminos">Términos</Link> (suplantación, fraude, acoso, etc.), escribe a <Mail /> con la URL del perfil y el motivo.</p>
      </>
    ),
    en: (
      <>
        <h2>1. Your content is yours</h2>
        <p>Each creator keeps ownership and all rights to their videos, photos and text. By publishing them on your profile you grant {N} only a <strong>non-exclusive, royalty-free, revocable license to display them within your profile</strong> and what is technically needed to host them. The license ends when you delete the content or your account. We do not use your content for advertising or transfer it to third parties.</p>
        <h2>2. What you publish</h2>
        <p>Only publish campaigns and videos you actually took part in and have the right to show. Respect your brand agreements (e.g. exclusivity or publishing embargoes) and advertising disclosure rules (FTC in the US).</p>
        <h2>3. Reporting copyright infringement</h2>
        <p>If you believe a profile uses your work without permission, send a notice to <Mail /> with the subject "DMCA" including:</p>
        <ul>
          <li>Your name, address, phone number and email.</li>
          <li>The copyrighted work and the exact URL of the content on {N}.</li>
          <li>A good-faith statement that the use is not authorized.</li>
          <li>A statement, under penalty of perjury, that the information is accurate and that you are the owner or authorized to act on their behalf.</li>
          <li>Your physical or electronic signature.</li>
        </ul>
        <p>We will promptly remove or disable the reported content and notify the creator.</p>
        <h2>4. Counter-notice</h2>
        <p>If you are the creator and believe the removal was a mistake, send a counter-notice to <Mail /> with your details, identification of the removed content, a statement under penalty of perjury that it was a mistake, and your consent to the jurisdiction of the appropriate federal court. We may restore the content in 10 to 14 business days unless the complainant files a court action.</p>
        <h2>5. Repeat infringers</h2>
        <p>We will terminate accounts of repeat infringers.</p>
        <h2>6. Other reports</h2>
        <p>To report content prohibited by the <Link to="/legal/terminos">Terms</Link> (impersonation, fraud, harassment, etc.), email <Mail /> with the profile URL and the reason.</p>
      </>
    ),
  },
}
