import { useState, useEffect, useCallback, useRef } from "react";
import { CATS, MOTIVACE, SPATNE, ROUND_SIZE } from "./data/constants";
import { getCategory } from "./data/categories";
import { generateQuestions } from "./utils/questions";
import { evaluateAnswer } from "./utils/evaluate";
import { glass, glassStrong, glassBadge, bgStyle, wrapStyle, BgBlobs } from "./utils/styles";
import { useProgress } from "./hooks/useProgress";
import { useAuth } from "./hooks/useAuth";
import { initAudio, playCorrect, playWrong, playTimeout, playResultGreat, playResultOk, playResultBad } from "./utils/sounds";
import TimerRing from "./components/TimerRing";
import ConfettiBurst from "./components/ConfettiBurst";
import AuthScreen from "./components/AuthScreen";
import AnSvazekQuestion from "./components/AnSvazekQuestion";
import OtevrenaQuestion from "./components/OtevrenaQuestion";
import OtevrenaMultiQuestion from "./components/OtevrenaMultiQuestion";
import PrirazovaniQuestion from "./components/PrirazovaniQuestion";

/* ════════════════════════════════════════════════════════════════════════════
   ŠKOLNÍ TRÉNINK — v1
   ════════════════════════════════════════════════════════════════════════════ */

// ── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const { session, user, loading: authLoading, authError, signIn, signUp, signOut } = useAuth();
  const { progress, addCorrect, addWrong, finishRound, addError, recordAnswer, setActiveCats: persistActiveCats, spendCoins, startSession, endSession, discardSession, getTodayTime, getWeekTime, formatTime } = useProgress(user?.id);
  const [soundOn, setSoundOn] = useState(true);
  const [screen, setScreen] = useState("dashboard");
  const activeCats = progress.activeCats?.length ? progress.activeCats : CATS.map(c => c.id);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [fbText, setFbText] = useState("");
  const [fbOk, setFbOk] = useState(true);
  const [results, setResults] = useState([]);
  const [roundStars, setRoundStars] = useState(0);
  const [roundCoins, setRoundCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerMs, setAnswerMs] = useState(null);
  const [lastEval, setLastEval] = useState(null);
  const [catHint, setCatHint] = useState(null);
  const startRef = useRef(null);
  const catHintRef = useRef(null);
  const timerRef = useRef(null);
  const hintRef = useRef(null);
  const skipRef = useRef(null);
  const qRef = useRef(0);
  const roundSizeRef = useRef(ROUND_SIZE);
  const roundCounted = useRef(false);

  // Shortcuts to persisted values
  const stars = progress.stars;
  const coins = progress.coins;
  const streak = progress.streak;
  const dailyCorrect = progress.dailyCorrect;
  const dailyGoal = progress.dailyGoal;

  const q = questions[qIdx];
  const hasTimer = q && (q.category === "nasobilka" || q.category === "pocitani");

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hintRef.current) clearTimeout(hintRef.current);
    if (skipRef.current) clearTimeout(skipRef.current);
    timerRef.current = hintRef.current = skipRef.current = null;
  }, []);

  const advanceQuestion = useCallback(() => {
    const nextIdx = qRef.current + 1;
    if (nextIdx < roundSizeRef.current) {
      setQIdx(nextIdx);
      qRef.current = nextIdx;
      setAnswered(null);
      setLastEval(null);
      setFbText("");
      setShowHint(false);
      setShowSkip(false);
      setAnswerMs(null);
    } else {
      setScreen("results");
    }
  }, []);

  const handleTimeout = useCallback(() => {
    clearTimers();
    if (soundOn) playTimeout();
    setAnswered(-1);
    setFbText(SPATNE[Math.floor(Math.random() * SPATNE.length)]);
    setFbOk(false);
    setCombo(0);
    const q = questions[qRef.current];
    const ms = Date.now() - (startRef.current || Date.now());
    recordAnswer(q, { correct: false, pointsEarned: 0, pointsMax: q?.points ?? 1 }, ms);
    addWrong();
    if (q) addError(q, null);
    setResults(prev => [...prev, {
      ...q,
      userAnswer: "⏱️ Čas vypršel", isCorrect: false, pointsEarned: 0, pointsMax: q?.points ?? 1,
    }]);
    setTimeout(advanceQuestion, 1500);
  }, [questions, clearTimers, advanceQuestion, soundOn, addWrong, addError, recordAnswer]);

  // Timers: odpočet u násobilky/počítání; jinak nápověda + přeskočení
  useEffect(() => {
    if (screen !== "quiz" || !q || answered !== null) return;
    clearTimers();
    setShowHint(false);
    setShowSkip(false);
    setAnswerMs(null);
    startRef.current = Date.now();

    if (hasTimer) {
      const limit = q.timeLimit;
      setTimeLeft(limit);
      const t0 = Date.now();
      timerRef.current = setInterval(() => {
        const rem = limit - (Date.now() - t0) / 1000;
        if (rem <= 0) {
          setTimeLeft(0);
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleTimeout();
        } else {
          setTimeLeft(rem);
        }
      }, 50);
    } else {
      const hintMs = q.category === "slovni-ulohy" ? 45000 : 25000;
      hintRef.current = setTimeout(() => setShowHint(true), hintMs);
      skipRef.current = setTimeout(() => setShowSkip(true), 40000);
    }
    return () => clearTimers();
  }, [qIdx, screen]);

  // Track results and play sounds (must be before conditional returns)
  useEffect(() => {
    if (screen === "results" && results.length > 0 && !roundCounted.current) {
      roundCounted.current = true;
      finishRound(activeCats.length >= 2 ? 15 : 0);
      const size = results.length || roundSizeRef.current;
      const pct = Math.round((results.filter(r => r.isCorrect).length / size) * 100);
      if (pct > 80) {
        endSession();
      } else {
        discardSession();
      }
      if (soundOn) {
        setTimeout(() => {
          if (pct >= 80) playResultGreat();
          else if (pct >= 50) playResultOk();
          else playResultBad();
        }, 300);
      }
    }
  }, [screen, results]);

  const errorDetailFromEval = (evaluation) => {
    if (!evaluation?.detail) return null
    const d = evaluation.detail
    if (q.type === "an-svazek") {
      return {
        perStatement: d.perStatement,
        wrongIds: Object.entries(d.perStatement || {})
          .filter(([, v]) => !v.ok)
          .map(([id]) => id),
      }
    }
    if (q.type === "otevrena-multi") {
      return {
        found: d.found,
        wrong: d.wrong,
        missing: d.missing,
      }
    }
    return d
  }

  const applyEvaluation = (evaluation, userAnswerLabel, delayMs = 1200) => {
    const ms = Date.now() - startRef.current;
    setAnswerMs(ms);
    setLastEval(evaluation);

    const { correct: ok, pointsEarned, pointsMax } = evaluation;
    const partial = !ok && pointsEarned > 0;
    const detail = errorDetailFromEval(evaluation);
    recordAnswer(q, evaluation, ms);

    // Mince: 10 plný / 5 částečný / 0 nula. Hvězdy: stávající logika (+ násobilka).
    if (ok) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 900);
      if (soundOn) playCorrect();
      setFbText(MOTIVACE[Math.floor(Math.random() * MOTIVACE.length)]);
      setFbOk(true);
      const c = combo + 1;
      setCombo(c);

      let es = 10;
      const ec = 10;
      if (q.category === "nasobilka") {
        const sec = ms / 1000;
        if (sec <= 3) es = 30;
        else if (sec <= 5) es = 10;
        else es = 5;
      }
      if (c > 0 && c % 5 === 0) es += 5;

      addCorrect(es, ec);
      setRoundStars(s => s + es);
      setRoundCoins(co => co + ec);
    } else if (partial) {
      if (soundOn) playCorrect();
      setFbText(`Skoro! Získal jsi ${pointsEarned} ze ${pointsMax} bodů.`);
      setFbOk(true);
      setCombo(0);
      addCorrect(5, 5);
      addError(q, detail);
      setRoundStars(s => s + 5);
      setRoundCoins(co => co + 5);
    } else if (evaluation.detail?.diacriticNearMiss) {
      if (soundOn) playWrong();
      setFbText("Skoro! Máš správné slovo, ale zkontroluj si diakritiku.");
      setFbOk(true);
      setCombo(0);
      addWrong();
      addError(q, detail);
    } else {
      if (soundOn) playWrong();
      setFbText(SPATNE[Math.floor(Math.random() * SPATNE.length)]);
      setFbOk(false);
      setCombo(0);
      addWrong();
      addError(q, detail);
    }

    setResults(prev => [...prev, {
      ...q,
      userAnswer: userAnswerLabel,
      isCorrect: ok,
      pointsEarned,
      pointsMax,
      time: ms,
    }]);
    setTimeout(advanceQuestion, delayMs);
  };

  const handleAnswer = (idx) => {
    if (answered !== null) return;
    clearTimers();
    initAudio();
    setAnswered(idx);

    const evaluation = evaluateAnswer(q, idx);
    applyEvaluation(evaluation, q.options[idx], 1200);
  };

  const handleAnSvazekAnswer = (userAnswers) => {
    if (answered !== null) return;
    clearTimers();
    initAudio();
    setAnswered(userAnswers);

    const evaluation = evaluateAnswer(q, userAnswers);
    const label = `${evaluation.detail.correctCount}/${evaluation.detail.total} správně`;
    applyEvaluation(evaluation, label, 2800);
  };

  const handleOtevrenaAnswer = (value) => {
    if (answered !== null) return;
    clearTimers();
    initAudio();
    setAnswered(value);

    const evaluation = evaluateAnswer(q, value);
    applyEvaluation(evaluation, value, 2200);
  };

  const handleOtevrenaMultiAnswer = (values) => {
    if (answered !== null) return;
    clearTimers();
    initAudio();
    setAnswered(values);

    const evaluation = evaluateAnswer(q, values);
    const label = `${evaluation.detail.found.length}/${evaluation.detail.total} správně`;
    applyEvaluation(evaluation, label, 3200);
  };

  const handlePrirazovaniAnswer = (mapping) => {
    if (answered !== null) return;
    clearTimers();
    initAudio();
    setAnswered(mapping);

    const evaluation = evaluateAnswer(q, mapping);
    const label = `${evaluation.detail.correctCount}/${evaluation.detail.total} správně`;
    applyEvaluation(evaluation, label, 3000);
  };

  const handleSkip = () => {
    clearTimers();
    if (soundOn) playWrong();
    setAnswered(-1);
    setLastEval(null);
    setFbText("Přeskočeno — půjde do chybníku 📝");
    setFbOk(false);
    setCombo(0);
    const ms = Date.now() - (startRef.current || Date.now());
    recordAnswer(q, { correct: false, pointsEarned: 0, pointsMax: q?.points ?? 1 }, ms);
    addWrong();
    addError(q, null);
    setResults(prev => [...prev, {
      ...q,
      userAnswer: "Přeskočeno",
      isCorrect: false,
      pointsEarned: 0,
      pointsMax: q?.points ?? 1,
    }]);
    setTimeout(advanceQuestion, 1200);
  };

  const beginQuiz = (qs) => {
    initAudio();
    startSession();
    roundCounted.current = false;
    roundSizeRef.current = qs.length;
    setQuestions(qs);
    setQIdx(0);
    qRef.current = 0;
    setAnswered(null);
    setLastEval(null);
    setFbText("");
    setResults([]);
    setRoundStars(0);
    setRoundCoins(0);
    setCombo(0);
    setShowHint(false);
    setShowSkip(false);
    setScreen("quiz");
  };

  const startRound = () => {
    if (activeCats.length === 0) return;
    beginQuiz(generateQuestions(activeCats, 'advanced', progress.errorLog));
  };

  const toggleCat = (id) => {
    if (activeCats.includes(id) && activeCats.length <= 1) {
      setCatHint("Musí zůstat alespoň jedna kategorie");
      clearTimeout(catHintRef.current);
      catHintRef.current = setTimeout(() => setCatHint(null), 2000);
      return;
    }
    persistActiveCats(prev => {
      const cur = prev?.length ? prev : CATS.map(c => c.id);
      if (cur.includes(id)) {
        if (cur.length <= 1) return cur; // poslední nejde odkliknout
        return cur.filter(c => c !== id);
      }
      return [...cur, id];
    });
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
    @keyframes popIn { 0%{transform:scale(.7);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
    @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes blobMove1 {
      0%,100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(30px,-50px) scale(1.1); }
      66% { transform: translate(-20px,20px) scale(0.9); }
    }
    @keyframes blobMove2 {
      0%,100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(-40px,30px) scale(1.15); }
      66% { transform: translate(25px,-40px) scale(0.85); }
    }
    @keyframes blobMove3 {
      0%,100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(20px,40px) scale(1.05); }
      66% { transform: translate(-30px,-20px) scale(0.95); }
    }
    @keyframes confetti-fall {
      0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
      100% { transform: translateY(350px) rotate(720deg) scale(0.3); opacity: 0; }
    }
    @keyframes confetti-spread {
      0% { transform: translate(0,0) rotate(0deg); opacity: 1; }
      100% { opacity: 0; }
    }
    *{box-sizing:border-box;margin:0;padding:0}
    button{font-family:'Nunito',sans-serif}
    button:active{transform:scale(.96)!important}
  `;

  const bg = bgStyle;
  const wrap = wrapStyle;

  if (authLoading) {
    return (
      <div style={bgStyle}>
        <BgBlobs />
        <div style={{ ...wrapStyle, textAlign: "center", paddingTop: 120, color: "#8892A8", fontWeight: 700 }}>
          Načítám…
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        error={authError}
        busy={false}
      />
    );
  }

  // ═════════ DASHBOARD ═════════

  if (screen === "dashboard") {
    return (
      <div style={bgStyle}>
        <style>{css}</style>
        <BgBlobs />
        <div style={wrapStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{
                ...glassBadge,
                display: "flex", alignItems: "center", gap: 6,
                background: "linear-gradient(135deg,rgba(255,107,53,.3),rgba(255,140,66,.2))",
                fontWeight: 800,
                boxShadow: "0 2px 12px rgba(255,107,53,.25), inset 0 1px 0 rgba(255,255,255,.15)",
              }}>🔥 {streak} dní</div>
              <button
                onClick={() => { initAudio(); setSoundOn(s => !s); }}
                style={{
                  ...glassBadge, cursor: "pointer",
                  opacity: soundOn ? 1 : 0.4,
                  padding: "6px 12px", fontSize: 16,
                }}
              >{soundOn ? "🔊" : "🔇"}</button>
              <button
                onClick={signOut}
                title="Odhlásit"
                style={{
                  ...glassBadge, cursor: "pointer",
                  padding: "6px 12px", fontSize: 13, color: "#8892A8",
                }}
              >Odhlásit</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ ...glassBadge, display: "flex", alignItems: "center", gap: 5 }}>⭐ {stars}</div>
              <div style={{ ...glassBadge, display: "flex", alignItems: "center", gap: 5 }}>🪙 {coins}</div>
            </div>
          </div>

          <div style={{
            fontSize: 30, fontWeight: 900, textAlign: "center", marginBottom: 4,
            background: "linear-gradient(135deg,#FFD166,#FF6B35 50%,#EF476F)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: -0.5,
          }}>Školní Trénink</div>
          <div style={{ fontSize: 14, color: "#8892A8", textAlign: "center", marginBottom: 28 }}>
            Vyber si, co chceš procvičovat
          </div>

          {/* Daily goal */}
          <div style={{
            ...glassStrong,
            borderRadius: 20, padding: "16px 20px", marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
              <span>🎯 Dnešní cíl</span>
              <span style={{ color: "#FFD166" }}>{dailyCorrect} / {dailyGoal}</span>
            </div>
            <div style={{
              height: 10, borderRadius: 5, background: "rgba(255,255,255,.08)",
              marginTop: 10, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 5,
                width: `${Math.min(100, (dailyCorrect / dailyGoal) * 100)}%`,
                background: "linear-gradient(90deg,#FFD166,#FF6B35)",
                transition: "width .5s ease",
              }} />
            </div>
          </div>

          {/* Time tracking */}
          <div style={{
            ...glass,
            borderRadius: 16, padding: "12px 20px", marginBottom: 24,
            display: "flex", justifyContent: "space-around",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#8892A8", marginBottom: 2 }}>⏱️ Dnes</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#E8ECF4" }}>{formatTime(getTodayTime())}</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,.1)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#8892A8", marginBottom: 2 }}>📅 Tento týden</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#E8ECF4" }}>{formatTime(getWeekTime())}</div>
            </div>
          </div>

          {/* Categories */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: catHint ? 12 : 24 }}>
            {CATS.map((cat, i) => {
              const on = activeCats.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  style={{
                    ...glass,
                    background: on
                      ? `linear-gradient(135deg,${cat.color}18,rgba(255,255,255,.06))`
                      : "rgba(255,255,255,.04)",
                    border: on ? `1.5px solid ${cat.color}88` : "1px solid rgba(255,255,255,.1)",
                    borderRadius: 18, padding: 16, cursor: "pointer",
                    transition: "all .25s ease",
                    transform: on ? "scale(1.02)" : "scale(1)",
                    boxShadow: on
                      ? `0 4px 20px ${cat.color}22, inset 0 1px 0 rgba(255,255,255,.15)`
                      : "0 4px 24px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.08)",
                    animation: `slideUp .4s ease ${i * .08}s both`,
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{cat.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: on ? cat.color : "#ccc", marginBottom: 2 }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: "#8892A8" }}>{cat.desc}</div>
                  {on && <div style={{ marginTop: 8, fontSize: 11, fontWeight: 800, color: cat.color, opacity: .8 }}>✓ VYBRÁNO</div>}
                </div>
              );
            })}
          </div>

          {catHint && (
            <div style={{
              textAlign: "center", marginBottom: 24, fontSize: 13,
              color: "#FFD166", fontWeight: 700, animation: "fadeIn .2s ease",
            }}>{catHint}</div>
          )}

          {activeCats.length >= 2 && (
            <div style={{
              textAlign: "center", marginBottom: 16, fontSize: 13,
              color: "#FFD166", fontWeight: 700, animation: "fadeIn .3s ease",
            }}>🎲 Mix kategorií — bonus +15 🪙 za kolo!</div>
          )}

          <button
            onClick={startRound}
            style={{
              width: "100%", padding: 18, borderRadius: 18, 
              border: activeCats.length > 0 ? "1px solid rgba(255,209,102,.3)" : "1px solid rgba(255,255,255,.08)",
              fontSize: 18, fontWeight: 900, cursor: activeCats.length > 0 ? "pointer" : "default",
              background: activeCats.length > 0
                ? "linear-gradient(135deg,rgba(255,209,102,.2),rgba(255,107,53,.15))"
                : "rgba(255,255,255,.04)",
              color: activeCats.length > 0 ? "#FFD166" : "#555",
              boxShadow: activeCats.length > 0
                ? "0 4px 24px rgba(255,107,53,.15), inset 0 1px 0 rgba(255,255,255,.15)"
                : "none",
              letterSpacing: .5, transition: "all .3s",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {activeCats.length > 0 ? "🚀  START  🚀" : "Vyber kategorii"}
          </button>
        </div>
      </div>
    );
  }

  // ═════════ QUIZ ═════════

  if (screen === "quiz" && q) {
    const catFromReg = getCategory(q.category);
    const catMeta = CATS.find(c => c.id === q.category) || {
      id: q.category,
      icon: catFromReg?.icon || "✏️",
      color: "#E85D3A",
      label: catFromReg?.name || q.category,
    };
    const roundLen = questions.length || roundSizeRef.current;
    const isAnSvazek = q.type === "an-svazek";
    const isOtevrena = q.type === "otevrena";
    const isOtevrenaMulti = q.type === "otevrena-multi";
    const isPrirazovani = q.type === "prirazovani";

    const getState = (idx) => {
      if (answered === null) return null;
      if (idx === q.correctIdx) return "correct";
      if (idx === answered && answered !== -1) return "wrong";
      return null;
    };

    const btnStyle = (state) => {
      let b = "rgba(255,255,255,.07)";
      let brd = "1px solid rgba(255,255,255,.12)";
      let sh = "0 4px 16px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.1)";
      let bf = "blur(16px) saturate(1.3)";
      if (state === "correct") {
        b = "linear-gradient(135deg,rgba(39,174,96,.35),rgba(46,204,113,.25))";
        brd = "1.5px solid rgba(39,174,96,.6)";
        sh = "0 4px 20px rgba(39,174,96,.3), inset 0 1px 0 rgba(255,255,255,.15)";
      } else if (state === "wrong") {
        b = "linear-gradient(135deg,rgba(231,76,60,.35),rgba(192,57,43,.25))";
        brd = "1.5px solid rgba(231,76,60,.6)";
        sh = "0 4px 20px rgba(231,76,60,.3), inset 0 1px 0 rgba(255,255,255,.15)";
      }
      return {
        width: "100%", padding: 16, borderRadius: 16, border: brd,
        fontSize: 20, fontWeight: 800, cursor: state ? "default" : "pointer",
        background: b, color: "#fff", transition: "all .2s ease",
        boxShadow: sh,
        backdropFilter: bf, WebkitBackdropFilter: bf,
      };
    };

    // Speed badge for nasobilka
    let speedBadge = null;
    if (answered !== null && answered !== -1 && q.category === "nasobilka" && results.length > 0 && results[results.length - 1].isCorrect) {
      const sec = answerMs / 1000;
      let lbl, col;
      if (sec <= 3) { lbl = "⚡ BLESK ×3"; col = "#FFD166"; }
      else if (sec <= 5) { lbl = "🏃 Rychlá ×1"; col = "#4ADE80"; }
      else { lbl = "🐢 Pomalá ×0.5"; col = "#8892A8"; }
      speedBadge = (
        <div style={{ fontSize: 14, fontWeight: 800, color: col, textAlign: "center", marginBottom: 8, animation: "popIn .3s ease" }}>{lbl}</div>
      );
    }

    return (
      <div style={bgStyle}>
        <style>{css}</style>
        <BgBlobs />
        {confetti && <ConfettiBurst />}
        <div style={wrapStyle}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ ...glassBadge, display: "flex", alignItems: "center", gap: 5, fontSize: 14 }}>⭐ +{roundStars}</div>
            {combo >= 3 && (
              <div style={{
                ...glassBadge,
                display: "flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 800,
                background: "linear-gradient(135deg,rgba(155,81,224,.3),rgba(108,92,231,.2))",
                animation: "popIn .3s ease", color: "#fff",
              }}>🔥 Combo ×{combo}</div>
            )}
            <div style={{ ...glassBadge, display: "flex", alignItems: "center", gap: 5, fontSize: 14 }}>🪙 +{roundCoins}</div>
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>
            {Array.from({ length: roundLen }).map((_, i) => {
              let dotBg = "rgba(255,255,255,.1)";
              if (i < results.length) {
                const r = results[i];
                if (r.isCorrect) dotBg = "#4ADE80";
                else if (r.pointsEarned > 0) dotBg = "#FFD166";
                else dotBg = "#F87171";
              }
              if (i === qIdx && answered === null) dotBg = catMeta.color;
              return <div key={i} style={{
                width: i === qIdx ? 24 : 8, height: 8, borderRadius: 4,
                background: dotBg, transition: "all .3s",
              }} />;
            })}
          </div>

          <div style={{ fontSize: 13, color: "#8892A8", textAlign: "center", marginBottom: 8, fontWeight: 600 }}>
            {catMeta.icon} Otázka {qIdx + 1} / {roundLen}
          </div>

          {/* Timer */}
          {hasTimer && answered === null && (
            <TimerRing timeLeft={timeLeft} timeLimit={q.timeLimit} />
          )}

          {speedBadge}

          {/* Feedback */}
          {fbText && (
            <div style={{
              fontSize: 20, fontWeight: 800, textAlign: "center",
              color: fbOk ? "#4ADE80" : "#F87171",
              marginBottom: 8, animation: "popIn .35s ease",
            }}>{fbText}</div>
          )}

          {isAnSvazek ? (
            <AnSvazekQuestion
              key={q.id || qIdx}
              question={q}
              submitted={answered !== null}
              evaluation={lastEval}
              onSubmit={handleAnSvazekAnswer}
            />
          ) : isOtevrena ? (
            <OtevrenaQuestion
              key={q.id || qIdx}
              question={q}
              submitted={answered !== null}
              evaluation={lastEval}
              onSubmit={handleOtevrenaAnswer}
            />
          ) : isOtevrenaMulti ? (
            <OtevrenaMultiQuestion
              key={q.id || qIdx}
              question={q}
              submitted={answered !== null}
              evaluation={lastEval}
              onSubmit={handleOtevrenaMultiAnswer}
            />
          ) : isPrirazovani ? (
            <PrirazovaniQuestion
              key={q.id || qIdx}
              question={q}
              submitted={answered !== null}
              evaluation={lastEval}
              onSubmit={handlePrirazovaniAnswer}
            />
          ) : (
            <>
              {/* Question card */}
              <div key={qIdx} style={{
                ...glassStrong,
                borderRadius: 24,
                padding: "32px 24px", textAlign: "center", marginBottom: 20,
                animation: "popIn .4s cubic-bezier(.34,1.56,.64,1)",
              }}>
                {(q.category === "nasobilka" || q.category === "pocitani") ? (
                  <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: 3 }}>{q.display}</div>
                ) : (
                  <>
                    <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 2, lineHeight: 1.3 }}>
                      {q.display.split("_").map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span style={{
                              display: "inline-block",
                              borderBottom: `3px solid ${catMeta.color}`,
                              minWidth: 28, color: catMeta.color,
                            }}>_</span>
                          )}
                        </span>
                      ))}
                    </div>
                    {q.rada && (
                      <div style={{ fontSize: 12, color: "#8892A8", marginTop: 6 }}>Řada po {q.rada}</div>
                    )}
                  </>
                )}
                {showHint && !hasTimer && answered === null && q.hint && (
                  <div style={{
                    fontSize: 13, color: "#FFD166", marginTop: 14,
                    fontStyle: "italic", animation: "fadeIn .5s ease",
                  }}>💡 Nápověda: {q.hint}</div>
                )}
              </div>

              {/* Correct answer display on wrong */}
              {answered !== null && !fbOk && (
                <div style={{
                  textAlign: "center", fontSize: 14, color: "#8892A8",
                  marginBottom: 12, animation: "fadeIn .3s ease",
                }}>
                  Správně: <strong style={{ color: "#4ADE80" }}>
                    {(q.category === "vyjna" || q.category === "predpony")
                      ? q.display.replace("_", q.correct)
                      : q.correct}
                  </strong>
                  {q.hint && <span> — {q.hint}</span>}
                </div>
              )}

              {/* Options */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    style={btnStyle(getState(idx))}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered !== null}
                  >{opt}</button>
                ))}
              </div>
            </>
          )}

          {showHint && !hasTimer && answered === null && q.type !== "vyber" && q.hint && (
            <div style={{
              fontSize: 13, color: "#FFD166", textAlign: "center", marginTop: 8,
              fontStyle: "italic", animation: "fadeIn .5s ease",
            }}>💡 Nápověda: {q.hint}</div>
          )}

          {showSkip && !hasTimer && answered === null && (
            <div style={{ textAlign: "center", animation: "fadeIn .4s ease" }}>
              <button
                onClick={handleSkip}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,.15)",
                  color: "#8892A8", borderRadius: 12, padding: "10px 20px",
                  fontSize: 13, cursor: "pointer", fontWeight: 600, marginTop: 8,
                }}
              >Přeskočit →</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════ RESULTS ═════════

  if (screen === "results") {
    const size = results.length || roundSizeRef.current;
    const correct = results.filter(r => r.isCorrect).length;
    const pct = Math.round((correct / size) * 100);
    const mistakes = results.filter(r => !r.isCorrect);
    let emoji = "🎉", msg = "Fantastické kolo!";
    if (pct < 50) { emoji = "💪"; msg = "Nevadí, příště to bude lepší!"; }
    else if (pct < 80) { emoji = "👍"; msg = "Dobrá práce!"; }
    else if (pct < 100) { emoji = "🌟"; msg = "Skvělý výkon!"; }

    // Add mix bonus
    const mixBonus = activeCats.length >= 2 ? 15 : 0;
    const totalCoins = roundCoins + mixBonus;

    return (
      <div style={bgStyle}>
        <style>{css}</style>
        <BgBlobs />
        <div style={wrapStyle}>
          <div style={{ textAlign: "center", marginBottom: 28, animation: "popIn .5s ease" }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>{emoji}</div>
            <div style={{
              fontSize: 26, fontWeight: 900,
              background: "linear-gradient(135deg,#FFD166,#FF6B35 50%,#EF476F)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{msg}</div>
          </div>

          <div style={{
            ...glassStrong,
            borderRadius: 24,
            padding: "28px 24px", textAlign: "center",
            marginBottom: 20,
            animation: "slideUp .4s ease .1s both",
          }}>
            <div style={{
              fontSize: 56, fontWeight: 900,
              background: "linear-gradient(135deg,#FFD166,#FF6B35)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{pct}%</div>
            <div style={{ fontSize: 14, color: "#8892A8", marginTop: 4 }}>{correct} z {size} správně</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700 }}>
                <span>⭐</span><span style={{ color: "#FFD166" }}>+{roundStars}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16, fontWeight: 700 }}>
                <span>🪙</span><span style={{ color: "#FFD166" }}>+{totalCoins}</span>
              </div>
            </div>
            {mixBonus > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#FFD166", fontWeight: 700, opacity: .8 }}>
                🎲 Včetně bonusu za mix kategorií!
              </div>
            )}
          </div>

          {mistakes.length > 0 && (
            <div style={{ animation: "slideUp .4s ease .2s both" }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: "#F87171" }}>
                📝 K procvičení ({mistakes.length})
              </div>
              {mistakes.map((m, i) => (
                <div key={i} style={{
                  background: "rgba(231,76,60,.1)", borderRadius: 12,
                  padding: "10px 14px", marginBottom: 8, textAlign: "left",
                  fontSize: 14, border: "1px solid rgba(231,76,60,.2)",
                }}>
                  <div style={{ fontWeight: 800, marginBottom: 2 }}>
                    {m.type === "an-svazek" || m.type === "otevrena" || m.type === "otevrena-multi" || m.type === "prirazovani"
                      ? (m.display || m.payload?.prompt || m.type)
                      : (m.category === "nasobilka" || m.category === "pocitani")
                        ? `${m.display} = ${m.correct}`
                        : m.display.replace("_", m.correct)}
                  </div>
                  <div style={{ fontSize: 12, color: "#8892A8" }}>
                    Tvá odpověď: <span style={{ color: "#F87171" }}>{m.userAnswer}</span>
                    {(m.type === "an-svazek" || m.type === "otevrena" || m.type === "otevrena-multi" || m.type === "prirazovani") && m.pointsMax != null && (
                      <span> — {m.pointsEarned ?? 0}/{m.pointsMax} b</span>
                    )}
                    {m.hint && ` — ${m.hint}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => setScreen("dashboard")}
              style={{
                ...glass,
                flex: 1, padding: 16, borderRadius: 18,
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                color: "#E8ECF4",
              }}
            >🏠 Zpět</button>
            <button
              onClick={startRound}
              style={{
                ...glass,
                flex: 1, padding: 16, borderRadius: 18,
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                background: "linear-gradient(135deg,rgba(255,209,102,.2),rgba(255,107,53,.15))",
                border: "1px solid rgba(255,209,102,.3)",
                color: "#FFD166",
                boxShadow: "0 4px 24px rgba(255,107,53,.15), inset 0 1px 0 rgba(255,255,255,.15)",
              }}
            >🔄 Další kolo</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
