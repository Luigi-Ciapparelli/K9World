import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Lock,
  PawPrint,
} from 'lucide-react';
import {
  STAGE_1_LESSONS,
  STAGE_1_MODULES,
  getStage1LessonsForModule,
} from '../lib/imparaContent';
import { useRouter } from '../lib/RouterContext';
import { ProfessionalBridge } from '../components/ecosystem/ProfessionalBridge';

const PROGRESS_KEY = 'pawconnect-impara-stage1-v2';

type ImparaProgress = {
  studied: string[];
  activities: string[];
  verified: string[];
};

const EMPTY_PROGRESS: ImparaProgress = {
  studied: [],
  activities: [],
  verified: [],
};

function readProgress(): ImparaProgress {
  try {
    const value = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '{}');
    return {
      studied: Array.isArray(value.studied) ? value.studied : [],
      activities: Array.isArray(value.activities) ? value.activities : [],
      verified: Array.isArray(value.verified) ? value.verified : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

// ECOSYSTEM_PASS_V1
export function ImparaHomePage() {
  const { navigate } = useRouter();
  const [progressState, setProgressState] = useState<ImparaProgress>(EMPTY_PROGRESS);

  useEffect(() => {
    const sync = () => setProgressState(readProgress());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('pawconnect-impara-progress', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pawconnect-impara-progress', sync);
    };
  }, []);

  const totals = useMemo(() => {
    const sublessons = STAGE_1_LESSONS.reduce((sum, lesson) => sum + lesson.sublessons.length, 0);
    const activities = STAGE_1_LESSONS.reduce((sum, lesson) => sum + lesson.activities.length, 0);
    const checks = sublessons + activities + STAGE_1_LESSONS.length;
    const done =
      progressState.studied.length +
      progressState.activities.length +
      progressState.verified.length;

    return {
      sublessons,
      activities,
      progress: checks > 0 ? Math.round((Math.min(done, checks) / checks) * 100) : 0,
    };
  }, [progressState]);

  const lessonStatus = (slug: string, sublessonIds: string[]) => {
    if (progressState.verified.includes(slug)) return 'Verificato';
    const allStudied = sublessonIds.every((id) =>
      progressState.studied.includes(`${slug}:${id}`)
    );
    if (allStudied) return 'Appreso';
    return 'Da conoscere';
  };

  return (
    <div className="min-h-screen bg-[var(--pc-bone-50)]">
      <section className="border-b border-[var(--pc-line)] bg-[var(--pc-paper)]">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-[var(--pc-forest-700)]" />
              <span className="pc-kicker">PortaleCinofilo · Impara</span>
            </div>
            <h1 className="pc-display text-4xl md:text-6xl font-semibold text-[var(--pc-ink-950)] mt-5">
              Capire il cane prima di chiedergli qualcosa.
            </h1>
            <p className="pc-lead pc-reading mt-5">
              Un percorso progressivo fatto di sottolezioni, attività pratiche e verifiche.
              Non basta scorrere una pagina: l’obiettivo è imparare a osservare, ragionare e applicare.
            </p>

            <div className="mt-6 pc-evidence-surface border border-[#cedde1] rounded-[var(--pc-radius-lg)] p-4 max-w-4xl">
              <p className="text-sm text-[var(--pc-ink-800)] leading-relaxed">
                <strong>Revisione editoriale in corso.</strong> Gli appunti del corso ENCI 2024
                sono materiale sorgente, non “verità PortaleCinofilo” automatica. Le formulazioni
                metodologiche specifiche vengono separate dalle nozioni da validare con fonti
                indipendenti prima della versione definitiva.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <ProfessionalBridge
          source="impara"
          topic="fondamenta"
          title="Porta ciò che impari nel lavoro con un professionista."
          text="Capire bisogni, routine e comunicazione ti aiuta a osservare meglio il cane e a fare domande più utili. Il professionista aggiunge esperienza, metodo e continuità sul singolo binomio."
          cta="Trova un professionista"
          className="mb-8"
        />

        <section className="pc-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--pc-forest-700)]">
                Stage 1
              </p>
              <h2 className="text-3xl font-bold text-[var(--pc-ink-950)] mt-2">Fondamenta</h2>
              <p className="text-[var(--pc-muted-600)] mt-2">
                {STAGE_1_MODULES.length} moduli · {STAGE_1_LESSONS.length} lezioni ·{' '}
                {totals.sublessons} sottolezioni · {totals.activities} attività.
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl bg-white border border-[var(--pc-line)] p-4">
              <div className="flex justify-between text-sm font-semibold text-[var(--pc-ink-800)]">
                <span>Progresso reale</span>
                <span>{totals.progress}%</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-[var(--pc-forest-700)] rounded-full"
                  style={{ width: `${totals.progress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--pc-muted-400)] mt-2">
                Studio + attività + verifica finale.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {STAGE_1_MODULES.map((module) => {
              const lessons = getStage1LessonsForModule(module.id);

              return (
                <section
                  key={module.id}
                  className="pc-card p-5 md:p-6"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pc-forest-700)]">
                    Modulo {module.order}
                  </p>
                  <h3 className="text-2xl font-bold text-[var(--pc-ink-950)] mt-1">{module.title}</h3>
                  <p className="text-sm text-[var(--pc-muted-600)] mt-2 max-w-3xl leading-relaxed">
                    {module.description}
                  </p>

                  <div className="grid gap-3 mt-5">
                    {lessons.map((lesson) => {
                      const status = lessonStatus(
                        lesson.slug,
                        lesson.sublessons.map((item) => item.id)
                      );

                      return (
                        <button
                          key={lesson.slug}
                          type="button"
                          onClick={() => navigate(`/impara/stage-1/${lesson.slug}`)}
                          className="group w-full text-left rounded-2xl bg-[var(--pc-bone-50)] border border-[var(--pc-line)] p-5 hover:border-[var(--pc-forest-700)] hover:bg-[var(--pc-forest-100)] transition"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                status === 'Verificato'
                                  ? 'bg-[var(--pc-forest-700)] text-white'
                                  : status === 'Appreso'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-[var(--pc-paper)] border border-[var(--pc-line)] text-[var(--pc-muted-600)]'
                              }`}
                            >
                              {status === 'Verificato' ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <span className="font-bold">{lesson.order}</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap gap-2 items-center">
                                <h4 className="font-bold text-[var(--pc-ink-950)]">{lesson.title}</h4>
                                <span className="text-[11px] font-bold uppercase tracking-wide rounded-full bg-[var(--pc-paper)] border border-[var(--pc-line)] px-2 py-1 text-[var(--pc-muted-400)]">
                                  {status}
                                </span>
                              </div>

                              <p className="text-sm text-[var(--pc-muted-600)] mt-2 leading-relaxed">
                                {lesson.summary}
                              </p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--pc-muted-400)] mt-3">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="w-3.5 h-3.5" />
                                  circa {lesson.durationMinutes} min
                                </span>
                                <span>{lesson.sublessons.length} sottolezioni</span>
                                <span>{lesson.activities.length} attività</span>
                                <span>{lesson.quiz.length} domande di verifica</span>
                              </div>
                            </div>

                            <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-[var(--pc-forest-700)] group-hover:translate-x-1 transition shrink-0 mt-2" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-5">
          {[
            [
              'Stage 2',
              'Pratica e gestione consapevole',
              'Video guidati, esercizi sul campo, comunicazione, gestione e competenze applicate.',
            ],
            [
              'Stage 3',
              'Percorso avanzato',
              'Competenze più tecniche, attività strutturate e preparazione a verifiche pratiche esterne.',
            ],
          ].map(([stage, title, text]) => (
            <article
              key={stage}
              className="pc-card p-6 opacity-80"
            >
              <div className="w-11 h-11 rounded-xl bg-stone-100 text-[var(--pc-muted-400)] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pc-muted-400)] mt-5">
                {stage} · In sviluppo
              </p>
              <h2 className="text-xl font-bold text-[var(--pc-ink-950)] mt-1">{title}</h2>
              <p className="text-sm text-[var(--pc-muted-600)] leading-relaxed mt-2">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl pc-surface-dark p-7 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <PawPrint className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Da conoscere → Appreso → Verificato</h2>
              <p className="text-stone-300 mt-2 leading-relaxed max-w-3xl">
                “Appreso” richiede di studiare le sottolezioni. “Verificato” richiede anche
                attività e quiz. Nel prototipo il progresso resta locale sul dispositivo e non
                rappresenta una qualifica ufficiale.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
