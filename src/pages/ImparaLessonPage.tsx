import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  FileVideo2,
  Lightbulb,
  RotateCcw,
  Target,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  getStage1Lesson,
  STAGE_1_LESSONS,
  type ImparaActivity,
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

function writeProgress(progress: ImparaProgress) {
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event('pawconnect-impara-progress'));
}

function VideoObservationLab({
  activity,
  completed,
  onComplete,
}: {
  activity: ImparaActivity;
  completed: boolean;
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const [markerSound, setMarkerSound] = useState(true);
  const [markerTimes, setMarkerTimes] = useState<number[]>([]);
  const [videoMissing, setVideoMissing] = useState(false);

  const playMarkerSound = () => {
    if (!markerSound) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'square';
      oscillator.frequency.value = 1700;
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.03);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.035);
      oscillator.addEventListener('ended', () => void context.close());
    } catch {
      // Il timing continua a funzionare anche se Web Audio viene bloccato.
    }
  };

  const markMoment = () => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended) return;

    playMarkerSound();
    setMarkerTimes((current) => [
      ...current,
      Number(video.currentTime.toFixed(3)),
    ].slice(-30));
  };

  const resetExercise = () => {
    setMarkerTimes([]);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  const targetTimes = activity.markerTargets || [];
  const toleranceMs = activity.markerToleranceMs ?? 250;

  const markerEvaluation =
    targetTimes.length > 0
      ? markerTimes.map((time) => {
          const nearest = targetTimes.reduce((best, target) => {
            const delta = Math.abs(target - time);
            return delta < best.delta ? { target, delta } : best;
          }, { target: targetTimes[0], delta: Math.abs(targetTimes[0] - time) });

          return {
            time,
            deltaMs: Math.round(nearest.delta * 1000),
            hit: nearest.delta * 1000 <= toleranceMs,
          };
        })
      : [];

  const canComplete = markerTimes.length > 0;

  return (
    <div className="rounded-3xl border border-violet-200 bg-violet-50/60 p-5 md:p-6">
      <div className="flex items-center gap-2">
        <FileVideo2 className="w-5 h-5 text-violet-700" />
        <h3 className="font-bold text-stone-900">{activity.title}</h3>
      </div>

      <p className="text-sm text-stone-700 mt-2 leading-relaxed">{activity.summary}</p>

      <ol className="mt-4 space-y-2 text-sm text-stone-700 list-decimal pl-5">
        {activity.instructions.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ol>

      {!activity.videoSrc || videoMissing ? (
        <div className="mt-5 rounded-2xl border border-dashed border-violet-300 bg-white p-6 text-center">
          <FileVideo2 className="w-8 h-8 text-violet-500 mx-auto" />
          <p className="font-bold text-stone-900 mt-3">Video didattico in preparazione</p>
          <p className="text-sm text-stone-600 mt-1">
            PortaleCinofilo pubblicherà qui il video scelto per questo esercizio.
          </p>
          {activity.videoSrc && (
            <p className="text-xs text-stone-400 mt-3 font-mono">{activity.videoSrc}</p>
          )}
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={activity.videoSrc}
            controls
            muted={videoMuted}
            onError={() => setVideoMissing(true)}
            className="w-full rounded-2xl bg-black mt-5 max-h-[520px]"
          />

          <div className="mt-4 grid md:grid-cols-[auto_1fr] gap-3 items-stretch">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVideoMuted((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700"
              >
                {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {videoMuted ? 'Audio OFF' : 'Audio ON'}
              </button>

              <button
                type="button"
                onClick={() => setMarkerSound((value) => !value)}
                className="rounded-xl bg-white border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700"
              >
                Suono clicker: {markerSound ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={resetExercise}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600"
              >
                <RotateCcw className="w-4 h-4" />
                Ricomincia
              </button>
            </div>

            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                markMoment();
              }}
              className="min-h-16 rounded-2xl bg-violet-700 text-white px-6 py-4 text-lg font-black tracking-wide hover:bg-violet-800 active:scale-[0.99] transition"
            >
              CLICK
            </button>
          </div>

          <p className="text-xs text-stone-500 mt-3">
            Il marker viene registrato appena premi il mouse, per ridurre il ritardo dell’interfaccia.
          </p>

          {markerTimes.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-800">
                Marker registrati: {markerTimes.length}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {markerTimes.map((time, index) => (
                  <span
                    key={`${time}-${index}`}
                    className="rounded-full bg-violet-100 text-violet-800 px-2.5 py-1 text-xs font-semibold"
                  >
                    {time.toFixed(3)}s
                  </span>
                ))}
              </div>
            </div>
          )}

          {markerEvaluation.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white border border-violet-100 p-4">
              <p className="font-bold text-stone-900">Precisione del timing</p>
              <div className="mt-3 space-y-2">
                {markerEvaluation.map((result, index) => (
                  <div
                    key={`${result.time}-${index}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span>Click {index + 1} · {result.time.toFixed(3)}s</span>
                    <span className={result.hit ? 'font-bold text-emerald-700' : 'font-semibold text-amber-700'}>
                      {result.hit ? 'entro finestra' : `scarto ${result.deltaMs} ms`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canComplete || completed}
          onClick={onComplete}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
            completed
              ? 'bg-emerald-100 text-emerald-800'
              : canComplete
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-stone-200 text-stone-500 cursor-not-allowed'
          }`}
        >
          {completed ? 'Laboratorio completato' : 'Completa laboratorio'}
        </button>
        <span className="text-xs text-stone-500">{activity.completionHint}</span>
      </div>
    </div>
  );
}

export function ImparaLessonPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const lesson = getStage1Lesson(slug);
  const [progress, setProgress] = useState<ImparaProgress>(EMPTY_PROGRESS);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    setProgress(readProgress());
    setAnswers({});
    setQuizResult(null);
  }, [slug]);

  const lessonIndex = useMemo(
    () => STAGE_1_LESSONS.findIndex((item) => item.slug === slug),
    [slug]
  );

  if (!lesson) {
    return (
      <div className="min-h-screen bg-stone-50 px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/impara')}
            className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4" /> PortaleCinofilo Impara
          </button>
          <h1 className="text-3xl font-bold text-stone-900 mt-8">Lezione non trovata</h1>
        </div>
      </div>
    );
  }

  const previous = lessonIndex > 0 ? STAGE_1_LESSONS[lessonIndex - 1] : null;
  const next =
    lessonIndex < STAGE_1_LESSONS.length - 1 ? STAGE_1_LESSONS[lessonIndex + 1] : null;

  const sublessonKey = (id: string) => `${lesson.slug}:${id}`;
  const activityKey = (id: string) => `${lesson.slug}:${id}`;

  const studiedCount = lesson.sublessons.filter((item) =>
    progress.studied.includes(sublessonKey(item.id))
  ).length;
  const completedActivityCount = lesson.activities.filter((item) =>
    progress.activities.includes(activityKey(item.id))
  ).length;

  const allSublessonsStudied = studiedCount === lesson.sublessons.length;
  const allActivitiesCompleted = completedActivityCount === lesson.activities.length;
  const prerequisitesDone = allSublessonsStudied && allActivitiesCompleted;
  const verified = progress.verified.includes(lesson.slug);

  const updateProgress = (nextProgress: ImparaProgress) => {
    setProgress(nextProgress);
    writeProgress(nextProgress);
  };

  const toggleStudied = (id: string) => {
    const key = sublessonKey(id);
    const studied = progress.studied.includes(key)
      ? progress.studied.filter((value) => value !== key)
      : [...progress.studied, key];

    const nextProgress = { ...progress, studied };
    updateProgress(nextProgress);
  };

  const completeActivity = (id: string) => {
    const key = activityKey(id);
    if (progress.activities.includes(key)) return;
    updateProgress({
      ...progress,
      activities: [...progress.activities, key],
    });
  };

  const submitQuiz = () => {
    if (!prerequisitesDone) return;

    let score = 0;
    lesson.quiz.forEach((question) => {
      if (answers[question.id] === question.correctIndex) score += 1;
    });

    const required = Math.max(1, Math.ceil(lesson.quiz.length * 0.66));
    const passed = score >= required;
    setQuizResult({ score, passed });

    if (passed && !progress.verified.includes(lesson.slug)) {
      updateProgress({
        ...progress,
        verified: [...progress.verified, lesson.slug],
      });
    }
  };

  const status = verified
    ? 'Verificato'
    : allSublessonsStudied
      ? 'Appreso'
      : 'Da conoscere';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-5 md:px-6 py-10 md:py-14">
        <button
          onClick={() => navigate('/impara')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-emerald-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Stage 1 · Fondamenta
        </button>

        <article className="rounded-[2rem] bg-white border border-stone-200 overflow-hidden">
          <header className="p-7 md:p-10 border-b border-stone-100">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-bold text-emerald-700">
                Modulo {lesson.moduleOrder} · Lezione {lesson.order}
              </span>
              <span className="text-stone-300">•</span>
              <span className="inline-flex items-center gap-1.5 text-stone-500">
                <Clock3 className="w-4 h-4" /> circa {lesson.durationMinutes} min
              </span>
              <span className="text-stone-300">•</span>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">
                {status}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mt-4">
              {lesson.title}
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed mt-4">{lesson.summary}</p>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-stone-700 leading-relaxed">
                <strong>Materiale in revisione editoriale.</strong> Le note del corso ENCI 2024
                vengono usate come sorgente di studio. Quando una formulazione appartiene a uno
                specifico metodo o richiede verifica indipendente, la lezione lo dichiara.
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

            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                    Studio
                  </p>
                  <h2 className="text-2xl font-bold text-stone-900 mt-1">Sottolezioni</h2>
                </div>
                <span className="text-sm text-stone-500">
                  {studiedCount}/{lesson.sublessons.length}
                </span>
              </div>

              <div className="mt-5 space-y-5">
                {lesson.sublessons.map((sublesson) => {
                  const key = sublessonKey(sublesson.id);
                  const studied = progress.studied.includes(key);

                  return (
                    <article
                      key={sublesson.id}
                      className="rounded-3xl border border-stone-200 bg-stone-50/60 p-5 md:p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900">{sublesson.title}</h3>
                          <p className="text-xs text-stone-500 mt-1">
                            circa {sublesson.durationMinutes} min
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStudied(sublesson.id)}
                          className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold ${
                            studied
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-white border border-stone-200 text-stone-700 hover:border-emerald-300'
                          }`}
                        >
                          {studied ? 'Studiata ✓' : 'Segna come studiata'}
                        </button>
                      </div>

                      <div className="mt-4 space-y-4 text-stone-700 leading-7">
                        {sublesson.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>

                      {sublesson.bullets && (
                        <ul className="mt-4 space-y-2">
                          {sublesson.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-3 text-stone-700">
                              <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 shrink-0 mt-2" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-700">
                    Applicazione
                  </p>
                  <h2 className="text-2xl font-bold text-stone-900 mt-1">Attività pratiche</h2>
                </div>
                <span className="text-sm text-stone-500">
                  {completedActivityCount}/{lesson.activities.length}
                </span>
              </div>

              <div className="mt-5 space-y-5">
                {lesson.activities.map((activity) => {
                  const completed = progress.activities.includes(activityKey(activity.id));

                  if (activity.type === 'video-lab') {
                    return (
                      <VideoObservationLab
                        key={activity.id}
                        activity={activity}
                        completed={completed}
                        onComplete={() => completeActivity(activity.id)}
                      />
                    );
                  }

                  return (
                    <article
                      key={activity.id}
                      className="rounded-3xl bg-emerald-50 border border-emerald-100 p-6"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-emerald-700" />
                        <h3 className="font-bold text-stone-900">{activity.title}</h3>
                      </div>
                      <p className="text-stone-700 leading-relaxed mt-3">{activity.summary}</p>

                      <ol className="mt-4 space-y-2 text-sm text-stone-700 list-decimal pl-5">
                        {activity.instructions.map((instruction) => (
                          <li key={instruction}>{instruction}</li>
                        ))}
                      </ol>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={completed}
                          onClick={() => completeActivity(activity.id)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
                            completed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800'
                          }`}
                        >
                          {completed ? 'Attività completata' : 'Ho completato l’attività'}
                        </button>
                        <span className="text-xs text-stone-500">{activity.completionHint}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mt-12 rounded-3xl border border-stone-200 p-6 md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-stone-500">
                Verifica
              </p>
              <h2 className="text-2xl font-bold text-stone-900 mt-1">Dimostra di aver capito</h2>
              <p className="text-sm text-stone-600 mt-2">
                La verifica si sblocca quando hai studiato tutte le sottolezioni e completato le attività.
              </p>

              {!prerequisitesDone && (
                <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-stone-700">
                  Mancano{' '}
                  <strong>{lesson.sublessons.length - studiedCount}</strong> sottolezioni e{' '}
                  <strong>{lesson.activities.length - completedActivityCount}</strong> attività.
                </div>
              )}

              <div className={`mt-6 space-y-7 ${!prerequisitesDone ? 'opacity-50' : ''}`}>
                {lesson.quiz.map((question, questionIndex) => (
                  <fieldset key={question.id} disabled={!prerequisitesDone}>
                    <legend className="font-bold text-stone-900">
                      {questionIndex + 1}. {question.prompt}
                    </legend>

                    <div className="mt-3 space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={option}
                          className="flex gap-3 rounded-xl border border-stone-200 p-3 cursor-pointer bg-white"
                        >
                          <input
                            type="radio"
                            name={`${lesson.slug}-${question.id}`}
                            checked={answers[question.id] === optionIndex}
                            onChange={() =>
                              setAnswers((current) => ({
                                ...current,
                                [question.id]: optionIndex,
                              }))
                            }
                          />
                          <span className="text-sm text-stone-700">{option}</span>
                        </label>
                      ))}
                    </div>

                    {quizResult && (
                      <p className="text-xs text-stone-500 mt-2">{question.explanation}</p>
                    )}
                  </fieldset>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!prerequisitesDone}
                  onClick={submitQuiz}
                  className={`rounded-xl px-5 py-3 font-bold ${
                    prerequisitesDone
                      ? 'bg-stone-900 text-white hover:bg-stone-800'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Verifica le risposte
                </button>

                {verified && (
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Lezione verificata
                  </span>
                )}
              </div>

              {quizResult && (
                <div
                  className={`mt-4 rounded-2xl p-4 text-sm ${
                    quizResult.passed
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  {quizResult.passed
                    ? `Superata: ${quizResult.score}/${lesson.quiz.length}. Stato: Verificato.`
                    : `Hai ottenuto ${quizResult.score}/${lesson.quiz.length}. Rileggi i punti meno chiari e riprova.`}
                </div>
              )}
            </section>
          </div>
        </article>

        <nav className="mt-6 grid sm:grid-cols-2 gap-3">
          {previous ? (
            <button
              onClick={() => navigate(`/impara/stage-1/${previous.slug}`)}
              className="text-left rounded-2xl bg-white border border-stone-200 p-5 hover:border-emerald-300"
            >
              <span className="inline-flex items-center gap-2 text-xs font-bold text-stone-500">
                <ArrowLeft className="w-4 h-4" /> Lezione precedente
              </span>
              <div className="font-bold text-stone-900 mt-2">{previous.title}</div>
            </button>
          ) : (
            <div />
          )}

          {next ? (
            <button
              onClick={() => navigate(`/impara/stage-1/${next.slug}`)}
              className="text-left sm:text-right rounded-2xl bg-white border border-stone-200 p-5 hover:border-emerald-300"
            >
              <span className="inline-flex items-center gap-2 text-xs font-bold text-stone-500">
                Lezione successiva <ArrowRight className="w-4 h-4" />
              </span>
              <div className="font-bold text-stone-900 mt-2">{next.title}</div>
            </button>
          ) : (
            <button
              onClick={() => navigate('/impara')}
              className="text-left sm:text-right rounded-2xl bg-stone-900 text-white p-5 hover:bg-stone-800"
            >
              <span className="text-xs font-bold text-stone-300">Fine dello Stage 1 attuale</span>
              <div className="font-bold mt-2">Torna a PortaleCinofilo Impara</div>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
