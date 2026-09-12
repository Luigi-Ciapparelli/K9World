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
    <div className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1.5 text-sm font-semibold">
              <GraduationCap className="w-4 h-4" />
              PortaleCinofilo Impara
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900 mt-5">
              Capire il cane prima di chiedergli qualcosa.
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed mt-5 max-w-3xl">
              Un percorso progressivo fatto di sottolezioni, attività pratiche e verifiche.
              Non basta scorrere una pagina: l’obiettivo è imparare a osservare, ragionare e applicare.
            </p>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 max-w-4xl">
              <p className="text-sm text-stone-700 leading-relaxed">
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
        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                Stage 1
              </p>
              <h2 className="text-3xl font-bold text-stone-900 mt-2">Fondamenta</h2>
              <p className="text-stone-600 mt-2">
                {STAGE_1_MODULES.length} moduli · {STAGE_1_LESSONS.length} lezioni ·{' '}
                {totals.sublessons} sottolezioni · {totals.activities} attività.
              </p>
            </div>

            <div className="min-w-[220px] rounded-2xl bg-white border border-emerald-100 p-4">
              <div className="flex justify-between text-sm font-semibold text-stone-700">
                <span>Progresso reale</span>
                <span>{totals.progress}%</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${totals.progress}%` }}
                />
              </div>
              <p className="text-xs text-stone-500 mt-2">
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
                  className="rounded-3xl bg-white border border-stone-200 p-5 md:p-6"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                    Modulo {module.order}
                  </p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-1">{module.title}</h3>
                  <p className="text-sm text-stone-600 mt-2 max-w-3xl leading-relaxed">
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
                          className="group w-full text-left rounded-2xl bg-stone-50 border border-stone-200 p-5 hover:border-emerald-300 hover:bg-emerald-50/40 transition"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                status === 'Verificato'
                                  ? 'bg-emerald-600 text-white'
                                  : status === 'Appreso'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-white border border-stone-200 text-stone-600'
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
                                <h4 className="font-bold text-stone-900">{lesson.title}</h4>
                                <span className="text-[11px] font-bold uppercase tracking-wide rounded-full bg-white border border-stone-200 px-2 py-1 text-stone-500">
                                  {status}
                                </span>
                              </div>

                              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                                {lesson.summary}
                              </p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500 mt-3">
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock3 className="w-3.5 h-3.5" />
                                  circa {lesson.durationMinutes} min
                                </span>
                                <span>{lesson.sublessons.length} sottolezioni</span>
                                <span>{lesson.activities.length} attività</span>
                                <span>{lesson.quiz.length} domande di verifica</span>
                              </div>
                            </div>

                            <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition shrink-0 mt-2" />
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
              className="rounded-3xl border border-stone-200 bg-white p-6 opacity-80"
            >
              <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500 mt-5">
                {stage} · In sviluppo
              </p>
              <h2 className="text-xl font-bold text-stone-900 mt-1">{title}</h2>
              <p className="text-sm text-stone-600 leading-relaxed mt-2">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl bg-stone-900 text-white p-7 md:p-8">
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
