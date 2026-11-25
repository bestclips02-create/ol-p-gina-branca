import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AudioLines, Check, ChevronDown, Clapperboard, Download, Film, Gamepad2, HardDrive, LockKeyhole, Music2, Pause, Play, Plus, Scissors, Server, Sparkles, Upload, Volume2, X } from "lucide-react";
import "./studio.css";

type Source = { id: string; file: File; url: string; duration: number };
type Cut = { id: string; sourceId: string; start: number; end: number };
type Exported = { id: string; name: string; url: string; size: number };
const SERVER_NAME = "InfectadoZ";
const SERVER_IP = "89.39.161.172:27105";

export const Route = createFileRoute("/studio")({
  head: () => ({ meta: [{ title: "InfectadoZ Clip Studio" }, { name: "description", content: "Crie cortes dos seus vídeos de gameplay com mixagem de áudio e identificação do servidor." }] }),
  component: Studio,
});

export function Studio() {
  const [sources, setSources] = useState<Source[]>([]);
  const [activeId, setActiveId] = useState("");
  const [music, setMusic] = useState<File | null>(null);
  const [gameVolume, setGameVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(12);
  const [visualEffect, setVisualEffect] = useState("none");
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [exports, setExports] = useState<Exported[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const gameGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const videoNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const active = sources.find((item) => item.id === activeId);

  useEffect(() => () => { sources.forEach((item) => URL.revokeObjectURL(item.url)); }, []);
  useEffect(() => { if (active) { setStart(0); setEnd(active.duration); } }, [activeId]);
  useEffect(() => { if (videoRef.current && active) videoRef.current.src = active.url; }, [activeId, active?.url]);
  useEffect(() => { const url = music ? URL.createObjectURL(music) : ""; if (audioRef.current) audioRef.current.src = url; return () => { if (url) URL.revokeObjectURL(url); }; }, [music]);
  useEffect(() => { if (gameGainRef.current) gameGainRef.current.gain.value = gameVolume / 100; }, [gameVolume]);
  useEffect(() => { if (musicGainRef.current) musicGainRef.current.gain.value = musicVolume / 100; }, [musicVolume]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).filter((file) => file.type.startsWith("video/")).map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file), duration: 0 }));
    if (next.length) { setSources((old) => [...old, ...next]); setActiveId((old) => old || next[0].id); setMessage(""); }
    else setMessage("Selecione um arquivo de vídeo válido.");
  };
  const loadedMetadata = () => {
    const player = videoRef.current;
    if (!player || !active) return;
    const duration = Number.isFinite(player.duration) ? player.duration : 0;
    setSources((old) => old.map((item) => item.id === active.id ? { ...item, duration } : item));
    setEnd(duration);
  };
  const setupAudio = async () => {
    const ctx = contextRef.current ?? new AudioContext(); contextRef.current = ctx;
    if (!destinationRef.current) {
      const dest = ctx.createMediaStreamDestination();
      const gameGain = ctx.createGain(); gameGain.gain.value = gameVolume / 100; gameGain.connect(dest); gameGain.connect(ctx.destination);
      const musicGain = ctx.createGain(); musicGain.gain.value = musicVolume / 100; musicGain.connect(dest); musicGain.connect(ctx.destination);
      destinationRef.current = dest; gameGainRef.current = gameGain; musicGainRef.current = musicGain;
      [110, 164.81, 220].forEach((frequency, index) => { const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = index === 1 ? "sine" : "triangle"; osc.frequency.value = frequency; gain.gain.value = index === 0 ? 0.12 : 0.045; osc.connect(gain); gain.connect(musicGain); osc.start(); });
    }
    if (videoRef.current && !videoNodeRef.current) { videoNodeRef.current = ctx.createMediaElementSource(videoRef.current); videoNodeRef.current.connect(gameGainRef.current!); }
    if (audioRef.current && music && !musicNodeRef.current) { musicNodeRef.current = ctx.createMediaElementSource(audioRef.current); musicNodeRef.current.connect(musicGainRef.current!); }
    await ctx.resume(); return destinationRef.current!;
  };
  const waitFor = (el: HTMLVideoElement, event: "loadeddata" | "seeked") => new Promise<void>((resolve, reject) => {
    const done = () => { el.removeEventListener(event, done); el.removeEventListener("error", fail); resolve(); };
    const fail = () => { el.removeEventListener(event, done); reject(new Error("Não foi possível ler o vídeo.")); };
    el.addEventListener(event, done, { once: true }); el.addEventListener("error", fail, { once: true });
  });
  const renderCut = async (cut: Cut, index: number, total: number, destination: MediaStreamAudioDestinationNode) => {
    const player = videoRef.current; const canvas = canvasRef.current; const source = sources.find((item) => item.id === cut.sourceId);
    if (!player || !canvas || !source) throw new Error("Vídeo não encontrado.");
    if (player.src !== source.url) { const ready = waitFor(player, "loadeddata"); player.src = source.url; await ready; }
    canvas.width = player.videoWidth || 1280; canvas.height = player.videoHeight || 720;
    const stream = canvas.captureStream(30); destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined); const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const finished = new Promise<Blob>((resolve, reject) => { recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" })); recorder.onerror = () => reject(new Error("Falha ao codificar este corte.")); });
    if (Math.abs(player.currentTime - cut.start) > 0.05) { const seeked = waitFor(player, "seeked"); player.currentTime = cut.start; await seeked; }
    if (music && audioRef.current) { audioRef.current.currentTime = 0; await audioRef.current.play().catch(() => {}); }
    let animation = 0;
    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.filter = visualEffect; ctx.drawImage(player, 0, 0, canvas.width, canvas.height); ctx.filter = "none";
        const scale = canvas.width / 1280, pad = Math.round(28 * scale), boxW = Math.round(345 * scale), boxH = Math.round(66 * scale), x = canvas.width - boxW - pad, y = canvas.height - boxH - pad;
        ctx.fillStyle = "rgba(5,9,13,.78)"; ctx.beginPath(); ctx.roundRect(x, y, boxW, boxH, 12 * scale); ctx.fill();
        ctx.fillStyle = "#a7ef55"; ctx.font = `700 ${Math.round(18 * scale)}px Arial`; ctx.fillText(SERVER_NAME.toUpperCase(), x + pad * .6, y + 25 * scale);
        ctx.fillStyle = "#fff"; ctx.font = `500 ${Math.round(16 * scale)}px Arial`; ctx.fillText(SERVER_IP, x + pad * .6, y + 49 * scale);
      }
      const ratio = Math.min(1, Math.max(0, (player.currentTime - cut.start) / (cut.end - cut.start)));
      setProgress(Math.round(((index + ratio) / total) * 100));
      if (player.currentTime >= cut.end || player.ended) { player.pause(); recorder.stop(); if (audioRef.current) audioRef.current.pause(); cancelAnimationFrame(animation); return; }
      animation = requestAnimationFrame(paint);
    };
    recorder.start(250); await player.play(); paint(); const blob = await finished; stream.getTracks().forEach((track) => track.stop());
    return { id: crypto.randomUUID(), name: `${source.file.name.replace(/\.[^.]+$/, "")}-corte-${index + 1}.webm`, url: URL.createObjectURL(blob), size: blob.size };
  };
  const generate = async () => {
    if (!cuts.length || busy) return;
    setBusy(true); setProgress(0); setMessage("");
    try {
      const destination = await setupAudio(), made: Exported[] = [];
      for (let index = 0; index < cuts.length; index++) made.push(await renderCut(cuts[index], index, cuts.length, destination));
      setExports((old) => [...made, ...old]); setCuts([]); setProgress(100); setMessage(`${made.length} clipe${made.length > 1 ? "s foram gerados" : " foi gerado"}. Baixe abaixo.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível gerar os vídeos. Tente em outro navegador."); }
    finally { setBusy(false); }
  };
  const removeSource = (id: string) => { const removed = sources.find((item) => item.id === id); if (removed) URL.revokeObjectURL(removed.url); const remaining = sources.filter((item) => item.id !== id); setSources(remaining); setCuts((old) => old.filter((cut) => cut.sourceId !== id)); if (activeId === id) setActiveId(remaining[0]?.id || ""); };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2,"0")}:${Math.floor(seconds % 60).toString().padStart(2,"0")}`;
  const sizeLabel = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1,Math.round(bytes/1024))} KB`;

  return <main className="studio-app">
    <header className="studio-top"><a className="studio-brand" href="/"><span className="studio-logo"><Gamepad2/></span><span>INFECTADOZ <b>CLIP STUDIO</b></span></a><div className="server-pin"><span className="online-dot"/><div><small>SERVIDOR CONECTADO</small><strong>{SERVER_NAME}</strong></div><code>{SERVER_IP}</code><LockKeyhole size={15}/></div><a className="exit-studio" href="/">Página inicial <X size={15}/></a></header>
    <div className="studio-body"><aside className="studio-side"><div className="side-label">SEU ESTÚDIO</div><div className="side-item side-active"><Clapperboard/> Editor de clips <span>01</span></div><div className="side-tip"><Sparkles/><strong>Pronto para editar?</strong><p>Envie seus gameplays, marque os melhores momentos e crie clips em poucos passos.</p></div><div className="side-format"><span>FORMATO DE EXPORTAÇÃO</span><b>WEBM · RESOLUÇÃO ORIGINAL</b><small>Pronto para compartilhar</small></div></aside>
    <section className="editor-main"><div className="welcome-row"><div><div className="studio-eyebrow">INFECTADOZ / FERRAMENTA DE EDIÇÃO</div><h1>Transforme seu gameplay<br/><em>em clips memoráveis.</em></h1><p>Cortes precisos, áudio equilibrado e identificação do servidor. Tudo direto no navegador.</p></div><div className="welcome-stats"><span><Film/><b>{sources.length.toString().padStart(2,"0")}</b> vídeos</span><span><Scissors/><b>{cuts.length.toString().padStart(2,"0")}</b> cortes</span></div></div>
    <div className="editor-grid"><section className="panel upload-panel"><div className="panel-head"><div><span className="panel-step">01</span><div><h2>Seus vídeos</h2><p>Adicione os gameplays que quer editar.</p></div></div><label className="small-upload"><Plus size={15}/> Adicionar<input type="file" accept="video/*" multiple onChange={(e)=>addFiles(e.currentTarget.files)}/></label></div>
    {!sources.length ? <label className="drop-area" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();addFiles(e.dataTransfer.files);}}><input type="file" accept="video/*" multiple onChange={(e)=>addFiles(e.currentTarget.files)}/><span className="drop-icon"><Upload/></span><b>Arraste seus vídeos para cá</b><span>ou <u>escolha do seu dispositivo</u></span><small>MP4, MOV, WebM e outros formatos</small></label> : <div className="source-list">{sources.map((source)=><button key={source.id} className={source.id===activeId?"source-row selected":"source-row"} onClick={()=>setActiveId(source.id)}><span className="source-thumb"><Film/></span><span className="source-meta"><b>{source.file.name}</b><small>{source.duration?formatTime(source.duration):"Carregando…"} · {sizeLabel(source.file.size)}</small></span>{source.id===activeId&&<span className="source-check"><Check/></span>}<span className="remove-source" role="button" onClick={(e)=>{e.stopPropagation();removeSource(source.id);}}><X size={14}/></span></button>)}</div>}
    <div className="video-preview">{active?<><video ref={videoRef} onLoadedMetadata={loadedMetadata} controls/><div className="video-server-tag"><span className="online-dot"/><b>{SERVER_NAME}</b><code>{SERVER_IP}</code></div></>:<div className="empty-preview"><Play/><span>A prévia do seu gameplay aparece aqui</span></div>}<canvas ref={canvasRef} className="render-canvas"/></div>
    {active&&<div className="cut-controls"><div className="cut-title"><Scissors size={16}/><b>Marque o corte</b><small>Selecione o trecho que quer exportar.</small></div><div className="time-fields"><label>INÍCIO <span><input type="number" min="0" max={active.duration} step="1" value={start} onChange={(e)=>setStart(Number(e.target.value))}/> s</span></label><span className="time-divider">→</span><label>FIM <span><input type="number" min={start} max={active.duration} step="1" value={end} onChange={(e)=>setEnd(Number(e.target.value))}/> s</span></label><button className="add-cut" disabled={end<=start} onClick={()=>setCuts((old)=>[...old,{id:crypto.randomUUID(),sourceId:active.id,start,end}])}><Plus size={15}/> Adicionar corte</button></div><label className="effect-picker">ACABAMENTO VISUAL <select value={visualEffect} onChange={(e)=>setVisualEffect(e.currentTarget.value)}><option value="none">Original</option><option value="contrast(1.08) saturate(.86) brightness(1.03)">Cinemático</option><option value="saturate(1.35) contrast(1.05)">Cores vivas</option><option value="grayscale(1) contrast(1.12)">Preto e branco</option></select><small>Aplicado a todos os cortes da fila</small></label></div>}
    </section>
    <section className="panel sound-panel"><div className="panel-head"><div><span className="panel-step">02</span><div><h2>Som & identidade</h2><p>Encontre o equilíbrio perfeito.</p></div></div><AudioLines className="head-icon"/></div><div className="mix-control"><div className="mix-label"><span className="mix-icon game-icon"><Gamepad2/></span><div><b>Áudio do game</b><small>Som original do gameplay</small></div><strong>{gameVolume}%</strong></div><input aria-label="Volume do áudio do jogo" type="range" min="0" max="150" value={gameVolume} onChange={(e)=>setGameVolume(Number(e.target.value))}/><div className="range-ends"><span>MUDO</span><span>EM DESTAQUE</span></div></div><div className="mix-control music-control"><div className="mix-label"><span className="mix-icon music-icon"><Music2/></span><div><b>Som leve de fundo</b><small>{music?music.name:"Ambiência suave incluída"}</small></div><strong>{musicVolume}%</strong></div><input aria-label="Volume da música de fundo" type="range" min="0" max="60" value={musicVolume} onChange={(e)=>setMusicVolume(Number(e.target.value))}/><div className="range-ends"><span>DESLIGADO</span><label className="music-upload"><Upload size={12}/> Usar minha música<input type="file" accept="audio/*" onChange={(e)=>setMusic(e.currentTarget.files?.[0]||null)}/></label></div></div><audio ref={audioRef} loop className="hidden-audio"/><div className="mix-note"><Volume2/><span>O áudio do jogo fica em destaque. Ajuste o fundo como preferir.</span></div><div className="identity-card"><div className="identity-icon"><Server/></div><div><small>IDENTIDADE NO CLIPE</small><b>{SERVER_NAME}</b><code>{SERVER_IP}</code></div><span className="fixed-chip"><LockKeyhole/> FIXO</span></div><div className="export-info"><HardDrive/><span>O processamento acontece no seu navegador.<br/><b>Seus vídeos não são enviados a um servidor.</b></span></div></section></div>
    <section className="panel timeline-panel"><div className="panel-head"><div><span className="panel-step">03</span><div><h2>Fila de clips</h2><p>Confira seus cortes antes de gerar os arquivos.</p></div></div>{cuts.length>0&&<button className="clear-cuts" onClick={()=>setCuts([])}>Limpar fila <X size={14}/></button>}</div>{cuts.length?<div className="cuts-list">{cuts.map((cut,index)=>{const source=sources.find((item)=>item.id===cut.sourceId);return <div className="cut-row" key={cut.id}><span className="cut-index">{String(index+1).padStart(2,"0")}</span><span className="cut-film"><Film/></span><span className="cut-name"><b>{source?.file.name||"Vídeo"}</b><small>Trecho {formatTime(cut.start)} – {formatTime(cut.end)}</small></span><span className="cut-duration">{formatTime(cut.end-cut.start)}</span><button aria-label="Remover corte" onClick={()=>setCuts((old)=>old.filter((item)=>item.id!==cut.id))}><X/></button></div>})}</div>:<div className="empty-queue"><Scissors/><span>Seus cortes vão aparecer aqui</span><small>Adicione um ou mais trechos dos vídeos acima.</small></div>}
    <div className="generate-row"><div className="generate-status">{busy?<><span className="spinner"/>Gerando seus clips… {progress}%</>:message?<><Check/>{message}</>:<><Sparkles/>Pronto para criar. Cada corte vira um vídeo baixável.</>}</div><button className="generate-button" disabled={!cuts.length||busy} onClick={generate}>{busy?<Pause/>:<Sparkles/>}{busy?"Gerando…":"Gerar clips"}<ChevronDown/></button></div>{busy&&<div className="progress-track"><span style={{width:`${progress}%`}}/></div>}</section>
    {exports.length>0&&<section className="panel exports-panel"><div className="panel-head"><div><span className="panel-step done-step"><Check/></span><div><h2>Seus clips estão prontos</h2><p>Baixe seus vídeos para compartilhar onde quiser.</p></div></div><span className="export-count">{exports.length} ARQUIVO{exports.length>1?"S":""}</span></div><div className="export-list">{exports.map((item)=><article key={item.id} className="export-row"><span className="export-preview"><Play/></span><div className="export-meta"><b>{item.name}</b><small>WEBM · {sizeLabel(item.size)}</small></div><a className="download-button" href={item.url} download={item.name}><Download size={16}/> Baixar vídeo</a></article>)}</div></section>}
    <footer className="studio-footer"><span>Made for the InfectadoZ community <Gamepad2 size={14}/></span><span>O IP do servidor permanece fixo em todos os clips.</span></footer></section></div>
  </main>;
}




