import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock3, Lightbulb, Target } from 'lucide-react';
import { getStage1Lesson, STAGE_1_LESSONS } from '../lib/imparaContent';
import { useRouter } from '../lib/RouterContext';

const PROGRESS_KEY = 'pawconnect-impara-stage1-v1';

function readProgress(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function ImparaLessonPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const lesson = getStage1Lesson(slug);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => setCompleted(readProgress()), [slug]);

  const lessonIndex = useMemo(
    () => STAGE_1_LESSONS.findIndex((item) => item.slug === slug),
    [slug]
  );

  if (!lesson) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/impara')} className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" /> PawConnect Impara
          </button>
          <h1 className="text-3xl font-bold text-stone-900 mt-8">Lezione non trovata</h1>
        </div>
      </div>
    );
  }

  const isDone = completed.includes(lesson.slug);
  const previous = lessonIndex > 0 ? STAGE_1_LESSONS[lessonIndex - 1] : null;
  const next = lessonIndex < STAGE_1_LESSONS.length - 1 ? STAGE_1_LESSONS[lessonIndex + 1] : null;

  const toggleCompleted = () => {
    const values = isDone
      ? completed.filter((item) => item !== lesson.slug)
      : [...completed, lesson.slug];
    setCompleted(values);
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(values));
    window.dispatchEvent(new Event('pawconnect-impara-progress'));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-5 md:px-6 py-10 md:py-14">
        <button onClick={() => navigate('/impara')} className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-emerald-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Stage 1 · Fondamenta
        </button>

        <article className="rounded-[2rem] bg-white border border-stone-200 overflow-hidden">
          <header className="p-7 md:p-10 border-b border-stone-100">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold text-emerald-700">Lezione {lesson.order} di {STAGE_1_LESSONS.length}</span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-stone-500">
                <Clock3 className="w-4 h-4" /> circa {lesson.durationMinutes} min
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mt-4">{lesson.title}</h1>
            <p className="text-lg text-stone-600 leading-relaxed mt-4">{lesson.summary}</p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-stone-700 leading-relaxed">
                <strong>Bozza didattica.</strong> Questa lezione deriva dagli appunti del corso ENCI 2024
                ed è destinata a essere ampliata e revisionata prima della versione definitiva.
              </p>
            </div>
          </header>

          <div className="p-7 md:p-10">
            <section>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-700" />
                <h2 className="font-bold text-stone-900">Obiettivi della lezione</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {lesson.objectives.map((objective) => (
                  <li key={objective} className="flex gap-3 text-stone-700 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-10 space-y-10">
              {lesson.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-bold text-stone-900">{section.title}</h2>
                  {section.paragraphs && (
                    <div className="mt-4 space-y-4 text-stone-700 leading-7">
                      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                  )}
                  {section.bullets && (
                    <ul className="mt-4 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 text-stone-700 leading-relaxed">
                          <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 shrink-0 mt-2" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <section className="mt-10 rounded-3xl bg-emerald-50 border border-emerald-100 p-6">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-emerald-700" />
                <h2 className="font-bold text-stone-900">Osservazione pratica</h2>
              </div>
              <p className="text-stone-700 leading-relaxed mt-3">{lesson.reflection}</p>
            </section>

            <div className="mt-10 border-t border-stone-200 pt-7">
              <button
                type="button"
                onClick={toggleCompleted}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold ${
                  isDone
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-emerald-700 text-white hover:bg-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                {isDone ? 'Lezione completata' : 'Segna come completata'}
              </button>
              <p className="text-xs text-stone-500 mt-3">
                Nel prototipo il progresso viene salvato soltanto su questo dispositivo.
              </p>
            </div>
          </div>
        </article>

        <nav className="mt-6 grid sm:grid-cols-2 gap-3">
          {previous ? (
            <button onClick={() => navigate(`/impara/stage-1/${previous.slug}`)} className="text-left rounded-2xl bg-white border border-stone-200 p-5 hover:border-emerald-300">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-stone-500"><ArrowLeft className="w-4 h-4" /> Lezione precedente</span>
              <div className="font-bold text-stone-900 mt-2">{previous.title}</div>
            </button>
          ) : <div />}
          {next ? (
            <button onClick={() => navigate(`/impara/stage-1/${next.slug}`)} className="text-left sm:text-right rounded-2xl bg-white border border-stone-200 p-5 hover:border-emerald-300">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-stone-500">Lezione successiva <ArrowRight className="w-4 h-4" /></span>
              <div className="font-bold text-stone-900 mt-2">{next.title}</div>
            </button>
          ) : (
            <button onClick={() => navigate('/impara')} className="text-left sm:text-right rounded-2xl bg-stone-900 text-white p-5 hover:bg-stone-800">
              <span className="text-xs font-bold text-stone-300">Fine del prototipo</span>
              <div className="font-bold mt-2">Torna allo Stage 1</div>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
