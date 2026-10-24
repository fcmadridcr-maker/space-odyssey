import { useEffect, useMemo, useState } from "react";
import { Rocket, Coins, Target, Trophy, UserRound, Zap, Check, LockKeyhole, RotateCcw, Star, Orbit, ChevronRight } from "lucide-react";

const START = { coins: 0, xp: 0, energy: 100, totalTaps: 0, completed: [], claimed: [], lastEnergy: Date.now(), streak: 1 };
const MISSIONS = [
  { id: "tap-25", title: "Primer contacto", desc: "Toca el planeta 25 veces", reward: 40, xp: 25, goal: 25, type: "taps", icon: "🪐" },
  { id: "earn-100", title: "Recolector cósmico", desc: "Consigue 100 monedas en total", reward: 60, xp: 35, goal: 100, type: "earned", icon: "🪙" },
  { id: "tap-100", title: "Piloto estelar", desc: "Toca el planeta 100 veces", reward: 100, xp: 70, goal: 100, type: "taps", icon: "🚀" },
  { id: "level-3", title: "Explorador avanzado", desc: "Alcanza el nivel 3", reward: 150, xp: 100, goal: 3, type: "level", icon: "🌌" },
];
const STORE_KEY = "space-odyssey-save-v1";
function loadGame() {
  try { return { ...START, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") }; }
  catch { return { ...START }; }
}
function levelInfo(xp) {
  const level = Math.floor(xp / 100) + 1;
  return { level, progress: xp % 100, next: 100 };
}

export default function App() {
  const [game, setGame] = useState(loadGame);
  const [tab, setTab] = useState("home");
  const [toast, setToast] = useState("");
  const [burst, setBurst] = useState(0);
  const level = levelInfo(game.xp);
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const username = tgUser?.first_name || "Explorador";

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(game)); }, [game]);
  useEffect(() => {
    const timer = setInterval(() => setGame(g => {
      const now = Date.now();
      const elapsed = Math.floor((now - (g.lastEnergy || now)) / 60000);
      if (elapsed < 1 || g.energy >= 100) return g;
      return { ...g, energy: Math.min(100, g.energy + elapsed), lastEnergy: (g.lastEnergy || now) + elapsed * 60000 };
    }), 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const missions = useMemo(() => MISSIONS.map(m => {
    let value = 0;
    if (m.type === "taps") value = game.totalTaps;
    if (m.type === "earned") value = game.coins;
    if (m.type === "level") value = level.level;
    return { ...m, value: Math.min(value, m.goal), done: value >= m.goal, claimed: game.claimed.includes(m.id) };
  }), [game, level.level]);

  function tapPlanet() {
    if (game.energy <= 0) { setToast("Sin energía. Vuelve pronto, se recarga sola."); return; }
    setBurst(n => n + 1);
    setGame(g => ({ ...g, coins: g.coins + 1, xp: g.xp + 1, energy: g.energy - 1, totalTaps: g.totalTaps + 1 }));
  }
  function claimMission(m) {
    if (!m.done || m.claimed) return;
    setGame(g => ({ ...g, coins: g.coins + m.reward, xp: g.xp + m.xp, claimed: [...g.claimed, m.id] }));
    setToast(`¡Misión completada! +${m.reward} monedas`);
  }
  function dailyReward() {
    const today = new Date().toDateString();
    if (game.dailyDate === today) { setToast("Ya recogiste tu recompensa diaria."); return; }
    setGame(g => ({ ...g, coins: g.coins + 75, xp: g.xp + 20, dailyDate: today }));
    setToast("¡Recompensa diaria! +75 monedas y +20 XP");
  }
  function resetGame() {
    if (!window.confirm("¿Seguro que quieres reiniciar todo tu progreso?")) return;
    setGame({ ...START, lastEnergy: Date.now() }); setToast("Progreso reiniciado");
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-mark"><Orbit size={22}/></div>
      <div><div className="eyebrow">GALACTIC ADVENTURE</div><div className="brand">SPACE <span>ODYSSEY</span></div></div>
      <div className="coin-pill"><Coins size={16}/><b>{game.coins.toLocaleString("es-ES")}</b></div>
    </header>

    <main>
      {tab === "home" && <section className="home-screen">
        <div className="welcome"><div><p className="muted">BIENVENIDO,</p><h1>{username}</h1><p className="subline">La galaxia te está esperando.</p></div><div className="level-badge"><Star size={15} fill="currentColor"/> NIVEL {level.level}</div></div>
        <div className="hero-card">
          <div className="stars star-a">✦</div><div className="stars star-b">·</div><div className="stars star-c">✧</div>
          <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
          <button className={`planet-button ${burst % 2 ? "bounce" : ""}`} onClick={tapPlanet} aria-label="Tocar planeta para ganar monedas"><span className="planet-art">🪐</span><span className="tap-ring"></span></button>
          <div className="hero-label"><span className="live-dot"></span> PLANETA EXPLORABLE</div>
          <p className="tap-help">TOCA EL PLANETA PARA MINAR</p>
          <div className="reward-line"><Coins size={17}/><strong>+1 moneda</strong><span>por toque</span></div>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon cyan"><Zap size={18}/></div><div className="stat-label">ENERGÍA</div><div className="stat-value">{game.energy}<small>/100</small></div><div className="meter"><span style={{width:`${game.energy}%`}}/></div></div>
          <div className="stat-card"><div className="stat-icon gold"><Trophy size={18}/></div><div className="stat-label">EXPERIENCIA</div><div className="stat-value">{game.xp}<small> XP</small></div><div className="meter gold-meter"><span style={{width:`${level.progress}%`}}/></div></div>
        </div>
        <div className="level-progress"><div className="progress-copy"><span>Progreso al nivel {level.level + 1}</span><b>{level.progress}/100 XP</b></div><div className="meter big"><span style={{width:`${level.progress}%`}}/></div></div>
        <div className="section-heading"><div><span className="section-kicker">RECOMPENSAS</span><h2>Bonificación diaria</h2></div><button className="small-link" onClick={dailyReward}>Recoger <ChevronRight size={15}/></button></div>
        <button className={`daily-card ${game.dailyDate === new Date().toDateString() ? "claimed" : ""}`} onClick={dailyReward}><div className="daily-emoji">🎁</div><div className="daily-copy"><b>{game.dailyDate === new Date().toDateString() ? "Recompensa recogida" : "Regalo de explorador"}</b><span>+75 monedas · +20 XP</span></div><div className="daily-check">{game.dailyDate === new Date().toDateString() ? <Check size={18}/> : <ChevronRight size={18}/>}</div></button>
      </section>}

      {tab === "missions" && <section className="page-screen">
        <div className="page-title"><span className="section-kicker">OBJETIVOS GALÁCTICOS</span><h1>Misiones</h1><p>Completa retos y consigue grandes recompensas.</p></div>
        <div className="mission-summary"><Target size={22}/><div><b>{missions.filter(m=>m.claimed).length} / {MISSIONS.length}</b><span>recompensas reclamadas</span></div></div>
        <div className="mission-list">{missions.map(m => <article className={`mission-card ${m.claimed ? "mission-claimed" : ""}`} key={m.id}><div className="mission-emoji">{m.icon}</div><div className="mission-info"><h3>{m.title}</h3><p>{m.desc}</p><div className="mission-meter"><span style={{width:`${Math.min(100, m.value/m.goal*100)}%`}}/></div><small>{m.value} / {m.goal}</small></div><div className="mission-action">{m.claimed ? <span className="claimed-label"><Check size={14}/> LISTA</span> : <><div className="mission-reward"><Coins size={14}/>{m.reward}</div><button disabled={!m.done} onClick={()=>claimMission(m)} className="claim-button">{m.done ? "Cobrar" : <LockKeyhole size={14}/>}</button></>}</div></article>)}</div>
        <div className="tip-card"><span>💡</span><p><b>Consejo de piloto:</b> cada toque consume 1 punto de energía. Recuperas 1 punto por minuto automáticamente.</p></div>
      </section>}

      {tab === "profile" && <section className="page-screen">
        <div className="profile-hero"><div className="avatar"><UserRound size={36}/></div><span className="section-kicker">PERFIL DEL EXPLORADOR</span><h1>{username}</h1><p>Cadete de la Flota Galáctica</p><div className="profile-level">NIVEL {level.level}</div></div>
        <div className="profile-stats"><div><Coins/><b>{game.coins.toLocaleString("es-ES")}</b><span>Monedas</span></div><div><Zap/><b>{game.totalTaps}</b><span>Toques</span></div><div><Trophy/><b>{game.xp}</b><span>XP total</span></div></div>
        <div className="section-heading"><div><span className="section-kicker">TU PROGRESO</span><h2>Rango galáctico</h2></div></div>
        <div className="rank-card"><div className="rank-symbol">🏅</div><div><b>{level.level < 3 ? "Cadete espacial" : level.level < 6 ? "Piloto estelar" : "Comandante galáctico"}</b><p>Alcanza más niveles ganando XP y completando misiones.</p></div></div>
        <button className="reset-button" onClick={resetGame}><RotateCcw size={16}/> Reiniciar progreso local</button>
        <p className="fine-print">Tu progreso se guarda en este dispositivo. Si cambias de navegador, el progreso no se transfiere automáticamente.</p>
      </section>}
    </main>

    <nav className="bottom-nav">
      <button className={tab==="home"?"active":""} onClick={()=>setTab("home")}><Rocket size={20}/><span>Explorar</span></button>
      <button className={tab==="missions"?"active":""} onClick={()=>setTab("missions")}><Target size={20}/><span>Misiones</span>{missions.some(m=>m.done&&!m.claimed)&&<i/>}</button>
      <button className={tab==="profile"?"active":""} onClick={()=>setTab("profile")}><UserRound size={20}/><span>Perfil</span></button>
    </nav>
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
    <footer>SPACE ODYSSEY <span>•</span> EXPLORA MÁS ALLÁ</footer>
  </div>;
}