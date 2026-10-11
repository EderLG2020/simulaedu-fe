import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, cn, Icon, PageHeader, StatCard, Table, TableHead, Td, Th, type TonoBadge } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

/**
 * Migracion 1:1 del mockup de Google Stitch (antes en public/screen.png,
 * DESIGN.md, code.html - ya eliminados de ahi). Fiel a ese diseño incluso en
 * contenido: los KPIs, el desglose de ingresos por plan, "accesos rapidos" y
 * la tabla de instituciones son datos de ejemplo del mockup, NO vienen del
 * backend todavia - no hay endpoint para "preguntas pendientes de aprobar",
 * "licencias por vencer" ni el detalle por plan con el formato del mockup.
 *
 * El sidebar/topbar (antes montados aqui) viven en AdminLayout, compartidos
 * por las 6 pantallas de /admin/* - esta pagina solo devuelve su contenido.
 */

interface ItemIngresoPlan {
  color: string
  nombre: string
  monto: string
  porcentaje: string
  ancho: string
  detalleIzquierda: string
  detalleDerecha: string
  detalleDerechaClase: string
}

const ingresosPorPlan: ItemIngresoPlan[] = [
  {
    color: 'bg-primary-600',
    nombre: 'Plan Premium Mensual (S/ 29/mes)',
    monto: 'S/ 38,450.00',
    porcentaje: '(51.3%)',
    ancho: '51.3%',
    detalleIzquierda: '1,326 alumnos activos individuales',
    detalleDerecha: 'Simulacros ilimitados',
    detalleDerechaClase: 'font-medium text-slate-600',
  },
  {
    color: 'bg-primary-400',
    nombre: 'Licencias Institucionales (Colegios / Academias)',
    monto: 'S/ 24,600.00',
    porcentaje: '(32.8%)',
    ancho: '32.8%',
    detalleIzquierda: '18 convenios vigentes en Lima, Arequipa y Trujillo',
    detalleDerecha: 'B2B Corp',
    detalleDerechaClase: 'font-medium text-primary-700',
  },
  {
    color: 'bg-violet-400',
    nombre: 'Plan Docente Pro (S/ 49/mes)',
    monto: 'S/ 7,840.00',
    porcentaje: '(10.5%)',
    ancho: '10.5%',
    detalleIzquierda: '160 docentes creadores y supervisores de aula',
    detalleDerecha: 'Herramienta DECO®',
    detalleDerechaClase: 'font-semibold text-primary-600',
  },
  {
    color: 'bg-slate-400',
    nombre: 'Plan Gratuito / Diagnóstico',
    monto: 'S/ 0.00',
    porcentaje: '(Base de embudo)',
    ancho: '5%',
    detalleIzquierda: '14,934 estudiantes en preparación diagnóstica inicial',
    detalleDerecha: 'Alto potencial de upselling',
    detalleDerechaClase: 'font-semibold text-emerald-600',
  },
]

interface AccesoRapido {
  icono: string
  iconoClase: string
  titulo: string
  badge: string
  badgeTono: TonoBadge
  detalle: string
  boton: string
  botonVariante: 'primary' | 'secondary'
}

const accesosRapidos: AccesoRapido[] = [
  {
    icono: 'fact_check',
    iconoClase: 'bg-accent-50 text-accent-600',
    titulo: 'Aprobar preguntas',
    badge: '14 DECO®',
    badgeTono: 'primary',
    detalle: 'UNMSM (8) · UNI (4) · PUCP (2)',
    boton: 'Revisar banco',
    botonVariante: 'primary',
  },
  {
    icono: 'notification_important',
    iconoClase: 'bg-amber-50 text-amber-600',
    titulo: 'Licencias por vencer',
    badge: '3 colegios',
    badgeTono: 'warning',
    detalle: 'Trilce San Isidro, Saco Oliveros',
    boton: 'Gestionar',
    botonVariante: 'secondary',
  },
  {
    icono: 'gavel',
    iconoClase: 'bg-rose-50 text-rose-600',
    titulo: 'Usuarios en revisión',
    badge: '5 casos',
    badgeTono: 'danger',
    detalle: 'Doble sesión e IP irregular',
    boton: 'Auditar',
    botonVariante: 'secondary',
  },
  {
    icono: 'web',
    iconoClase: 'bg-slate-100 text-slate-600',
    titulo: 'Publicar en Landing',
    badge: 'Borrador',
    badgeTono: 'neutral',
    detalle: 'Banner Simulacro Nacional San Marcos',
    boton: 'Previsualizar',
    botonVariante: 'secondary',
  },
]

interface InstitucionAliada {
  iniciales: string
  inicialesClase: string
  nombre: string
  ubicacion: string
  chips: { texto: string; tono: TonoBadge }[]
  alumnos: string
  estado: string
  estadoTono: TonoBadge
  puntoClase: string
  pruebas: string
  accionIcono: string
  accionTitulo: string
}

const instituciones: InstitucionAliada[] = [
  {
    iniciales: 'TR',
    inicialesClase: 'bg-primary-50 text-primary-700',
    nombre: 'Colegio Trilce - San Isidro',
    ubicacion: 'Lima Metropolitana · Contrato Anual',
    chips: [
      { texto: 'UNMSM (DECO)', tono: 'primary' },
      { texto: 'PUCP', tono: 'neutral' },
    ],
    alumnos: '680 alumnos',
    estado: 'Activa',
    estadoTono: 'success',
    puntoClase: 'bg-emerald-500',
    pruebas: '2,480 pruebas',
    accionIcono: 'analytics',
    accionTitulo: 'Descargar reporte',
  },
  {
    iniciales: 'SO',
    inicialesClase: 'bg-sky-50 text-sky-700',
    nombre: 'Academia Saco Oliveros - Los Olivos',
    ubicacion: 'Lima Norte · Plan Intensivo',
    chips: [
      { texto: 'UNI Ciencias', tono: 'neutral' },
      { texto: 'UNMSM', tono: 'primary' },
    ],
    alumnos: '1,120 alumnos',
    estado: 'Vence en 5 días',
    estadoTono: 'warning',
    puntoClase: 'bg-amber-500',
    pruebas: '4,910 pruebas',
    accionIcono: 'autorenew',
    accionTitulo: 'Renovar contrato',
  },
  {
    iniciales: 'PA',
    inicialesClase: 'bg-violet-50 text-violet-700',
    nombre: 'Colegio Mayor Secundario Presidente',
    ubicacion: 'Chaclacayo · Beca Excelencia',
    chips: [
      { texto: 'PUCP Talento', tono: 'neutral' },
      { texto: 'UNMSM', tono: 'primary' },
    ],
    alumnos: '450 alumnos',
    estado: 'Activa',
    estadoTono: 'success',
    puntoClase: 'bg-emerald-500',
    pruebas: '1,980 pruebas',
    accionIcono: 'analytics',
    accionTitulo: 'Descargar reporte',
  },
]

function fechaDeHoyEnEspanol(): string {
  return new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date())
    .replace(/^\w/, (c) => c.toUpperCase())
}

/** Valor de KPI con su variacion (la tendencia es dato de ejemplo del mockup). */
function ValorConTendencia({ valor, tendencia }: { valor: string; tendencia: string }) {
  return (
    <span className="flex items-baseline gap-2">
      {valor}
      <span className="inline-flex items-center gap-0.5 font-body text-xs font-semibold text-emerald-600">
        <Icon name="trending_up" size={14} />
        {tendencia}
      </span>
    </span>
  )
}

/** Encabezado de seccion dentro de una Card: titulo, descripcion y un elemento opcional a la derecha. */
function EncabezadoSeccion({ titulo, descripcion, extra }: { titulo: string; descripcion: string; extra?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
      </div>
      {extra}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { usuario } = useAuth()
  const nombre = usuario?.nombre ?? 'Admin'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Badge tone="primary">Admisión 2025-I</Badge>
          <span className="text-slate-300">•</span>
          <span>Centro de Operaciones</span>
        </div>
        <PageHeader
          title={`Hola, ${nombre}`}
          description={`${fechaDeHoyEnEspanol()} · Resumen operativo nacional`}
          actions={
            <>
              <Button variant="secondary" icon="calendar_today">
                <span>1 Feb – 26 Feb 2025</span>
                <Icon name="expand_more" size={16} className="text-slate-400" />
              </Button>
              <Button icon="download">Exportar reporte</Button>
            </>
          }
        />
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Usuarios activos"
          icon="group"
          tone="primary"
          value={<ValorConTendencia valor="18,420" tendencia="+14.2%" />}
          hint={
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-600" />
              17,180 estudiantes
              <span className="text-slate-300">•</span>
              1,240 docentes
            </span>
          }
        />
        <StatCard
          label="Simulacros rendidos"
          icon="assignment"
          tone="info"
          value={<ValorConTendencia valor="64,850" tendencia="+22.8%" />}
          hint="Promedio 2.4 pruebas / estudiante"
        />
        <StatCard
          label="Conversión Free → Premium"
          icon="auto_graph"
          tone="success"
          value={<ValorConTendencia valor="12.4%" tendencia="+1.8%" />}
          hint="2,130 estudiantes de pago activos"
        />
        <StatCard
          label="Ingresos del período"
          icon="payments"
          tone="warning"
          value={<ValorConTendencia valor="S/ 74,890" tendencia="+18.5%" />}
          hint={
            <span className="flex items-center justify-between gap-2">
              Soles Peruanos (PEN)
              <Badge>SUNAT OK</Badge>
            </span>
          }
        />
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card className="flex flex-col gap-5 p-6 lg:col-span-7">
          <EncabezadoSeccion
            titulo="Ingresos por plan y suscripción"
            descripcion="Rendimiento acumulado en Soles (S/) durante el ciclo de admisión 2025-I"
            extra={<Badge className="self-start sm:self-auto">Ciclo 2025-I</Badge>}
          />

          <div className="flex flex-col gap-5">
            {ingresosPorPlan.map((item) => (
              <div key={item.nombre}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', item.color)} />
                    <span className="font-semibold text-slate-900">{item.nombre}</span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-1.5">
                    <span className="font-display font-bold text-slate-900">{item.monto}</span>
                    <span className="text-xs font-semibold text-slate-500">{item.porcentaje}</span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full', item.color)} style={{ width: item.ancho }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{item.detalleIzquierda}</span>
                  <span className={item.detalleDerechaClase}>{item.detalleDerecha}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <Icon name="calculate" className="text-primary-600" />
              <span className="text-slate-600">Ticket promedio por alumno de pago:</span>
              <span className="font-display text-sm font-bold text-slate-900">S/ 35.15</span>
            </div>
            <a className="flex items-center gap-1 font-semibold text-primary-600 transition-colors hover:text-primary-800" href="#desglose">
              <span>Ver desglose de comisiones</span>
              <Icon name="arrow_forward" size={14} />
            </a>
          </div>
        </Card>

        <Card className="flex flex-col gap-5 p-6 lg:col-span-5">
          <EncabezadoSeccion
            titulo="Accesos rápidos y alertas"
            descripcion="Acciones prioritarias pendientes de supervisión"
            extra={
              <span className="relative hidden h-2.5 w-2.5 sm:flex">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
              </span>
            }
          />

          <div className="flex flex-col divide-y divide-slate-100">
            {accesosRapidos.map((item) => (
              <div key={item.titulo} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', item.iconoClase)}>
                    <Icon name={item.icono} size={20} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{item.titulo}</span>
                      <Badge tone={item.badgeTono}>{item.badge}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{item.detalle}</p>
                  </div>
                </div>
                <Button variant={item.botonVariante} size="sm" className="shrink-0">
                  {item.boton}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-primary-900 to-primary-800 p-4 text-white">
            <div>
              <span className="text-xs font-semibold text-primary-300">Objetivo Admisión Marzo</span>
              <div className="mt-0.5 font-display text-xl font-bold">85,000 Simulacros</div>
              <p className="mt-0.5 text-xs text-primary-200">76.3% completado hacia la meta nacional</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <Icon name="flag" size={24} />
            </span>
          </div>
        </Card>
      </div>

      {/* INSTITUCIONES */}
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-6 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Últimas instituciones aliadas activadas</h2>
            <p className="mt-0.5 text-xs text-slate-500">Convenios educativos implementados para el simulacro nacional universitario</p>
          </div>
          <Link to="/admin/instituciones" className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-800">
            <span>Ver todas las 18 instituciones</span>
            <Icon name="chevron_right" size={16} />
          </Link>
        </div>

        <Table>
          <TableHead>
            <Th>Institución / Sede</Th>
            <Th>Enfoque Admisión</Th>
            <Th>Alumnos Habilitados</Th>
            <Th>Estado Licencia</Th>
            <Th>Simulacros Rendidos</Th>
            <Th className="text-right">Acciones</Th>
          </TableHead>
          <tbody className="text-slate-700">
            {instituciones.map((inst) => (
              <tr key={inst.nombre}>
                <Td className="align-middle">
                  <div className="flex items-center gap-3">
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold', inst.inicialesClase)}>
                      {inst.iniciales}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">{inst.nombre}</div>
                      <div className="text-xs text-slate-500">{inst.ubicacion}</div>
                    </div>
                  </div>
                </Td>
                <Td className="align-middle">
                  <div className="flex items-center gap-1.5">
                    {inst.chips.map((chip) => (
                      <Badge key={chip.texto} tone={chip.tono}>
                        {chip.texto}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td className="align-middle font-medium text-slate-900">{inst.alumnos}</Td>
                <Td className="align-middle">
                  <Badge tone={inst.estadoTono}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', inst.puntoClase)} />
                    {inst.estado}
                  </Badge>
                </Td>
                <Td className="align-middle font-display font-medium text-slate-900">{inst.pruebas}</Td>
                <Td className="py-2.5 text-right align-middle">
                  <Button variant="ghost" size="icon" title={inst.accionTitulo} aria-label={inst.accionTitulo}>
                    <Icon name={inst.accionIcono} />
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
