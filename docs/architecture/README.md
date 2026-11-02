# Prompt de refactorización a arquitectura modular

> **Este es el prompt de refactorización.** Es genérico: sirve para cualquier proyecto, backend o
> frontend, y no depende de SimulaEdu. Se pega al empezar una sesión con Claude Code y se completa
> la parte entre `< >`. Sigue el camino de siempre: primero medir, después definir reglas que un
> test haga cumplir y luego arreglar por fases sin cambiar el comportamiento.
>
> El mismo archivo está en `simulaedu-be/docs/architecture/README.md`.

## Cómo se aplicó en SimulaEdu (frontend)

| Documento | Fase | Contenido |
|---|---|---|
| [diagnostico.md](diagnostico.md) | 0 | Grafo real de dependencias entre zonas y features, ciclos y tabla de problemas |
| [fase-1-reglas.md](fase-1-reglas.md) | 1 | Capas permitidas, reglas entre features, test de arquitectura y baseline |
| [fase-2-compartidos-fuera-de-features.md](fase-2-compartidos-fuera-de-features.md) | 2 | Lo que se movió, diagramas antes/después e historias pendientes |
| [fase-3-monorepo-y-herramientas.md](fase-3-monorepo-y-herramientas.md) | 3 | Monorepo pnpm + Turborepo, `app/`/`shared/`/`features/`, eslint-plugin-boundaries, ArchUnitTS y knip |

Herramientas que hacen cumplir las reglas: **eslint-plugin-boundaries** (`eslint/limites.mjs`), **ArchUnitTS**
(`packages/architecture`, `apps/web/src/app/architecture.test.ts`) y **knip**. Las reglas del día a día están en
`CLAUDE.md`, en la raíz del repo.

Contexto con el que se completó el prompt:

- **Proyecto:** SimulaEdu, plataforma de simulacros de admisión universitaria (Perú) para estudiantes, docentes, coordinadores de institución y administradores.
- **Stack:** React 19 + Vite + TypeScript, Tailwind 4, Zustand, TanStack Query, React Router 7, Vitest. Backend en Kotlin + Spring Boot.
- **Dominio en pocas palabras:** el banco de preguntas alimenta exámenes por universidad. El estudiante rinde simulacros, que se califican y alimentan niveles, ranking y estadísticas. Los planes limitan lo que cada usuario puede hacer.

---

# Refactorización a arquitectura modular

## Contexto
Proyecto: <nombre, qué hace y para quién>
Stack: <lenguaje, framework, build, BD>
Dominio en pocas palabras: <ej. "marketplace de reservas: comercios publican ofertas, compradores reservan y pagan">
Restricción: el comportamiento no cambia. No se tocan contratos HTTP, esquema de BD ni textos que ve el usuario. Si algo lo exige, se anota como historia aparte.

## Objetivo
Dejar el código organizado en módulos (backend) o features (frontend) con límites claros:
- cada módulo es dueño de su lógica, sus datos y sus errores;
- las dependencias van en una sola dirección y sin ciclos;
- de otro módulo solo se usa su API pública;
- las reglas las hace cumplir un test, no la buena voluntad.

## Fase 0 — Diagnóstico (solo lectura, no cambies código)
1. Lista los módulos o features que existen hoy y los que *deberían* existir según el dominio (bounded contexts). Por cada uno: responsabilidad en una frase.
2. Construye el grafo real de dependencias entre módulos a partir de los imports. Para cada flecha indica cuántos imports la forman y qué tipos cruzan.
3. Señala:
   - **Ciclos** (A ↔ B, o A → B → C → A).
   - **Lógica en el módulo equivocado** (ej. validación de reservas dentro de ofertas).
   - **Acceso a internos ajenos**: entidades, repositorios, servicios o stores de otro módulo usados directamente.
   - **Llamadas directas hacia módulos "efecto"** (notificaciones, auditoría, reportes, analytics) que podrían ser eventos.
   - **Tipos de dominio que viven en archivos demo, mock o utils.**
   - **Código compartido (`shared`/`common`) que importa de un módulo.**
4. Entrega un documento `docs/architecture/diagnostico.md` con un diagrama Mermaid del grafo actual (ciclos en rojo) y una tabla de problemas con su número de imports.
Detente aquí y espera mi confirmación.

## Fase 1 — Reglas y red de seguridad
1. Propón la **matriz de dependencias permitidas** (módulo → de quién puede depender). Reglas base:
   - el `common`/`shared` (shared kernel) no depende de nadie;
   - los módulos de "efecto" (notificaciones, auditoría, reportes) escuchan, no son llamados;
   - sin ciclos.
2. Define la estructura interna de cada módulo, por ejemplo `api/` (público), `application/`, `domain/` e `infrastructure/`, o en frontend `index.ts` como única puerta de entrada.
3. Crea un **test de arquitectura** que verifique la matriz y la encapsulación con la herramienta del stack: Spring Modulith / ArchUnit en Java, dependency-cruiser o eslint-plugin-boundaries en TS, import-linter en Python, etc.
4. Como hoy habrá violaciones, crea un **baseline** con las existentes:
   - el test falla si aparece una violación nueva;
   - falla si queda en la lista una ya resuelta (el baseline solo puede bajar);
   - cuando llega a cero, pasa a modo estricto.
5. Documenta todo en `CLAUDE.md` (o el README de arquitectura), separando lo **vigente** (lo exige un test) de lo **objetivo** (adonde va el código nuevo).

## Fase 2 en adelante — Arreglar por historias
Divide el trabajo en historias pequeñas (0,5 a 3 días). Cada una tiene problema, solución, criterios de aceptación medibles (ej. "X no importa nada de Y"), y de qué historias depende o a cuáles bloquea. Ordena primero las que rompen ciclos y mueven lógica a su lugar.

Técnicas a aplicar, de la más simple a la más profunda:
- **Mover** archivos a la feature o módulo correcto, con sus tests.
- **Partir** stores o servicios que mezclan dos responsabilidades.
- **Props o inyección** en lugar de que el código compartido importe de una feature.
- **Separar tipos de dominio** de los datos demo; los demo pasan a fixtures de test.
- **Eventos de dominio** en lugar de llamadas directas: el origen publica un evento con *todos* los datos que el receptor necesita. El receptor escucha de forma asíncrona y después del commit, así un fallo al notificar no revierte el flujo principal. Usa claves de idempotencia fijas.
- **Puertos o fachadas** (`*Query`, `*Api`) que devuelven DTOs cuando un módulo necesita datos de otro. Nunca se cruzan entidades ni repositorios. Las relaciones ORM entre módulos se cambian por ids.
- **Inversión de dependencia**: si `common` necesita algo de un módulo, define una interfaz en `common` y el módulo la implementa.

## Reglas en cada cambio
- No se añade ninguna violación nueva, aunque existan cientos antiguas.
- El baseline solo se regenera *después* de arreglar, y se revisa su diff.
- Una flecha nueva entre módulos es una decisión de arquitectura: se justifica en el PR.
- Cada test nuevo debe haber fallado alguna vez: rompe a propósito lo que protege, comprueba que falla y restáuralo.
- Build y tests en verde antes de dar algo por terminado.
- Al terminar cada fase, escribe `docs/architecture/fase-N-<tema>.md` con lo que se movió (tabla), diagramas Mermaid de antes y después, eventos nuevos y deuda que queda. En los diagramas de secuencia de Mermaid no uses `;` dentro de notas ni mensajes.

## Forma de trabajar
- Antes de cada fase muéstrame el plan y espera mi OK.
- Si una regla choca con una necesidad real, detente y pregunta; no la relajes por tu cuenta.
- Responde en español.

## Cómo usarlo
- Haz la Fase 0 sola al principio. El diagnóstico con el grafo y los ciclos es lo que más vale, y te deja decidir la matriz con datos.
- Después pide: "genera las historias de la fase 1 con el formato de criterios de aceptación". Se pueden pegar en Jira o como issues de GitHub.
- En proyectos pequeños la Fase 1 (el test con baseline) puede parecer de más. Aun así, es lo que impide que el desorden vuelva con el tiempo.
