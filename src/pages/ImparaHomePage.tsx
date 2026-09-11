import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, GraduationCap, Lock, PawPrint } from 'lucide-react';
import { STAGE_1_LESSONS } from '../lib/imparaContent';
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

export function ImparaHomePage() {
  const { navigate } = useRouter();
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setCompleted(readProgress());
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('pawconnect-impara-progress', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pawconnect-impara-progress', sync);
    };
  }, []);

  const progress = useMemo(
    () => Math.round((completed.length / STAGE_1_LESSONS.length) * 100),
    [completed]
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1.5 text-sm font-semibold">
              <GraduationCap className="w-4 h-4" />
              PawConnect Impara
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900 mt-5">
              Capire il cane prima di chiedergli qualcosa.
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed mt-5 max-w-3xl">
              Un percorso progressivo per proprietari e futuri proprietari. Non una raccolta
              di articoli, ma lezioni ordinate pensate per crescere nel tempo dal livello base
              a quello avanzato.
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 max-w-3xl">
              <p className="text-sm text-stone-700 leading-relaxed">
                <strong>Versione prototipo.</strong> Le prime lezioni derivano dagli appunti
                del corso ENCI 2024 e sono ancora materiale didattico in revisione.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50/60 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Stage 1</p>
              <h2 className="text-3xl font-bold text-stone-900 mt-2">Fondamenta</h2>
              <p className="text-stone-600 mt-2">
                Capire i bisogni del cane prima di chiedergli qualcosa.
              </p>
            </div>
            <div className="min-w-[180px] rounded-2xl bg-white border border-emerald-100 p-4">
              <div className="flex justify-between text-sm font-semibold text-stone-700">
                <span>Progresso</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-stone-500 mt-2">
                {completed.length} di {STAGE_1_LESSONS.length} lezioni completate
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-bold text-stone-900">Modulo 1 · Benessere, riposo e sicurezza</h3>
            <p className="text-sm text-stone-600 mt-1">
              Le prime tre lezioni costruiscono una base comune prima di entrare in relazione,
              comunicazione, apprendimento e lettura del cane.
            </p>

            <div className="grid gap-3 mt-5">
              {STAGE_1_LESSONS.map((lesson) => {
                const done = completed.includes(lesson.slug);
                return (
                  <button
                    key={lesson.slug}
                    type="button"
                    onClick={() => navigate(`/impara/stage-1/${lesson.slug}`)}
                    className="group w-full text-left rounded-2xl bg-white border border-stone-200 p-5 hover:border-emerald-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        done ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {done ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold">{lesson.order}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-stone-900">{lesson.title}</h4>
                        <p className="text-sm text-stone-600 mt-2 leading-relaxed">{lesson.summary}</p>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-3">
                          <Clock3 className="w-3.5 h-3.5" /> circa {lesson.durationMinutes} min
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition shrink-0 mt-2" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-5">
          {[
            ['Stage 2', 'Gestione consapevole', 'Applicare i principi nella vita quotidiana e leggere meglio il cane.'],
            ['Stage 3', 'Cane buon cittadino', 'Percorso futuro propedeutico alla gestione responsabile del binomio e a eventuali prove pratiche.'],
          ].map(([stage, title, text]) => (
            <article key={stage} className="rounded-3xl border border-stone-200 bg-white p-6 opacity-80">
              <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-500 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500 mt-5">{stage} · In sviluppo</p>
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
              <h2 className="text-2xl font-bold">Un percorso, non un attestato facile</h2>
              <p className="text-stone-300 mt-2 leading-relaxed max-w-3xl">
                Nel prototipo il completamento resta locale sul dispositivo e non genera certificati.
                Progressi persistenti, verifiche e attestati arriveranno dopo aver definito criteri
                didattici seri per ogni Stage.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
