import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Gamepad2, Music2, Scissors, Sparkles, Upload, Volume2 } from "lucide-react";
import "./studio.css";

const DEFAULT_SERVER = "InfectadoZ";
const DEFAULT_IP = "89.39.161.172:27105";

type Moment = { start: number; end: number; score: number };

export const Route = createFileRoute("/studio")({
  head: () => ({ meta: [{ title: "InfectadoZ Clip Studio" }, { name: "description", content: "Transforme seus vídeos de gameplay em compilações de momentos intensos." }] }),
  component: Studio,
});

export function Studio() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState("Nos vemos no servidor!");
  const [serverName, setServerName] = useState(DEFAULT_SERVER);
  const [serverIp, setServerIp] = useState(DEFAULT_IP);
  const [showCaption, setShowCaption] = useState(true);
  const [showServer, setShowServer] = useState(true);
  const [gameVolume, setGameVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(12);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [output, setOutput] = useState("");
  const [outputName, setOutputName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const destination = useRef<MediaStreamAudioDestinationNode | null>(null);
  const gameGain = useRef<GainNode | null>(null);
  const musicGain = useRef<GainNode | null>(null);
  const videoAudio = useRef<MediaElementAudioSourceNode | null>(null);
  const musicAudio = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : "";
    setVideoUrl(url);
    setDuration(0);
    setOutput("");
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file]);
  useEffect(() => {
    const url = musicFile ? URL.createObjectURL(musicFile) : "";
    if (musicRef.current) musicRef.current.src = url;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [musicFile]);
  useEffect(() => { if (gameGain.current) gameGain.current.gain.value = gameVolume / 100; }, [gameVolume]);
  useEffect(() => { if (musicGain.current) musicGain.current.gain.value = musicVolume / 100; }, [musicVolume]);
  useEffect(() => () => { if (output) URL.revokeObjectURL(output); }, [output]);
  useEffect(() => () => { if (audioContext.current) void audioContext.current.close(); }, []);

  const chooseFile = (selected?: File) => {
    if (selected?.type.startsWith("video/")) { setFile(selected); setStatus(""); }
    else if (selected) setStatus("Escolha um arquivo de vídeo válido.");
  };
  const timeLabel = (value: number) => `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, "0")}`;
  const seek = (player: HTMLVideoElement, time: number) => new Promise<void>((resolve, reject) => {
    if (Math.abs(player.currentTime - time) < 0.06) { resolve(); return; }
    const done = () => { player.removeEventListener("seeked", done); player.removeEventListener("error", fail); resolve(); };
    const fail = () => { player.removeEventListener("seeked", done); reject(new Error("Não foi possível analisar esse vídeo.")); };
    player.addEventListener("seeked", done, { once: true }); player.addEventListener("error", fail, { once: true }); player.currentTime = time;
  });

  const findMoments = async (player: HTMLVideoElement): Promise<Moment[]> => {
    const length = player.duration;
    if (length <= 16) return [{ start: 0, end: length, score: 1 }];
    const sample = document.createElement("canvas"); sample.width = 48; sample.height = 27;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) return [{ start: 0, end: Math.min(length, 14), score: 1 }];
    const interval = Math.max(0.65, Math.min(1.6, length / 110));
    const frames: { time: number; pixels: Uint8ClampedArray }[] = [];
    for (let time = 0; time < length - 0.1; time += interval) {
      await seek(player, time);
      context.drawImage(player, 0, 0, sample.width, sample.height);
      frames.push({ time, pixels: context.getImageData(0, 0, sample.width, sample.height).data });
      setProgress(Math.min(28, Math.round((time / length) * 28)));
    }
    const scored: { time: number; score: number }[] = [];
    for (let i = 1; i < frames.length; i++) {
      const before = frames[i - 1].pixels, after = frames[i].pixels;
      let difference = 0;
      for (let p = 0; p < after.length; p += 16) {
        difference += Math.abs(after[p] - before[p]) + Math.abs(after[p + 1] - before[p + 1]) + Math.abs(after[p + 2] - before[p + 2]);
      }
      scored.push({ time: frames[i].time, score: difference / (after.length / 16 * 3 * 255) });
    }
    const clipLength = Math.min(13, Math.max(6, length / Math.min(4, Math.max(1, Math.round(length / 30)))));
    const target = Math.min(5, Math.max(1, Math.round(length / 27)));
    const ranked = scored.map((item, i) => ({ ...item, score: (scored[i - 1]?.score || 0) * 0.2 + item.score * 0.6 + (scored[i + 1]?.score || 0) * 0.2 })).sort((a,b) => b.score - a.score);
    const chosen: Moment[] = [];
    for (const peak of ranked) {
      const start = Math.max(0, Math.min(length - clipLength, peak.time - clipLength * 0.36));
      if (chosen.every((item) => start > item.end + 2 || start + clipLength < item.start - 2)) chosen.push({ start, end: Math.min(length, start + clipLength), score: peak.score });
      if (chosen.length === target) break;
    }
    if (chosen.length < target) {
      for (let i = 0; i < target; i++) {
        const start = (length - clipLength) * (i + 0.5) / target;
        if (chosen.every((item) => start > item.end + 2 || start + clipLength < item.start - 2)) chosen.push({ start, end: start + clipLength, score: 0 });
      }
    }
    return chosen.sort((a,b) => a.start - b.start);
  };

  const prepareAudio = async () => {
    const player = videoRef.current;
    if (!player) throw new Error("Envie um vídeo para começar.");
    const ctx = audioContext.current ?? new AudioContext(); audioContext.current = ctx;
    if (!destination.current) {
      const dest = ctx.createMediaStreamDestination();
      const game = ctx.createGain(); game.gain.value = gameVolume / 100; game.connect(dest); game.connect(ctx.destination);
      const music = ctx.createGain(); music.gain.value = musicVolume / 100; music.connect(dest); music.connect(ctx.destination);
      destination.current = dest; gameGain.current = game; musicGain.current = music;
      [110, 164.81, 220].forEach((frequency, index) => { const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = index === 1 ? "sine" : "triangle"; osc.frequency.value = frequency; gain.gain.value = index ? 0.012 : 0.025; osc.connect(gain); gain.connect(music); osc.start(); });
    }
    if (!videoAudio.current) { videoAudio.current = ctx.createMediaElementSource(player); videoAudio.current.connect(gameGain.current!); }
    if (musicFile && musicRef.current && !musicAudio.current) { musicAudio.current = ctx.createMediaElementSource(musicRef.current); musicAudio.current.connect(musicGain.current!); }
    await ctx.resume();
    return destination.current!;
  };

  const drawFrame = (player: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(player, 0, 0, canvas.width, canvas.height);
    const lines = [showCaption && caption.trim(), showServer && [serverName.trim(), serverIp.trim()].filter(Boolean).join("  ·  ")].filter(Boolean) as string[];
    if (!lines.length) return;
    const scale = Math.min(canvas.width / 1280, 1.5), pad = Math.round(22 * scale), fontSize = Math.max(12, Math.round(20 * scale));
    ctx.font = `600 ${fontSize}px Arial`;
    const width = Math.min(canvas.width * 0.82, Math.max(...lines.map((line) => ctx.measureText(line).width)) + pad * 2);
    const height = lines.length * (fontSize + 8 * scale) + pad * 1.5;
    const x = pad, y = canvas.height - height - pad;
    ctx.fillStyle = "rgba(7,12,9,.78)"; ctx.beginPath(); ctx.roundRect(x, y, width, height, 10 * scale); ctx.fill();
    lines.forEach((line, index) => { ctx.fillStyle = index === 0 && lines.length > 1 ? "#a7ef55" : "#ffffff"; ctx.fillText(line, x + pad, y + pad + fontSize + index * (fontSize + 8 * scale), width - pad * 2); });
  };

  const generate = async () => {
    const player = videoRef.current, canvas = canvasRef.current;
    if (!player || !canvas || !file || busy) return;
    setBusy(true); setProgress(0); setOutput(""); setStatus("Analisando o vídeo completo para encontrar os momentos mais movimentados…");
    try {
      player.pause();
      const moments = await findMoments(player);
      if (!moments.length) throw new Error("Não encontrei trechos para compilar.");
      setStatus(`Encontrei ${moments.length} momentos. Montando sua compilação…`);
      canvas.width = player.videoWidth || 1280; canvas.height = player.videoHeight || 720;
      const audio = await prepareAudio();
      const stream = canvas.captureStream(30); audio.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const finished = new Promise<Blob>((resolve, reject) => { recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" })); recorder.onerror = () => reject(new Error("Falha ao gerar a compilação.")); });
      recorder.start(300);
      for (let index = 0; index < moments.length; index++) {
        if (index > 0) { recorder.pause(); player.pause(); if (musicRef.current) musicRef.current.pause(); }
        const moment = moments[index]; await seek(player, moment.start); drawFrame(player, canvas);
        if (index > 0) recorder.resume();
        if (musicFile && musicRef.current) { if (index === 0) musicRef.current.currentTime = 0; await musicRef.current.play().catch(() => {}); }
        await player.play();
        await new Promise<void>((resolve) => {
          let frame = 0;
          const step = () => {
            drawFrame(player, canvas);
            const part = (player.currentTime - moment.start) / (moment.end - moment.start);
            setProgress(28 + Math.min(71, Math.round(((index + Math.max(0, part)) / moments.length) * 71)));
            if (player.currentTime >= moment.end || player.ended) { player.pause(); if (musicRef.current) musicRef.current.pause(); cancelAnimationFrame(frame); resolve(); return; }
            frame = requestAnimationFrame(step);
          };
          frame = requestAnimationFrame(step);
        });
      }
      if (recorder.state !== "inactive") recorder.stop();
      if (musicRef.current) musicRef.current.pause();
      const blob = await finished; stream.getTracks().forEach((track) => track.stop());
      setOutput(URL.createObjectURL(blob)); const extension = blob.type.includes("mp4") ? "mp4" : "webm"; setOutputName(`${file.name.replace(/\.[^.]+$/, "")}-infectadoz-clips.${extension}`); setProgress(100); setStatus(`Compilação pronta com ${moments.length} momentos selecionados automaticamente.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Não foi possível gerar. Tente um vídeo MP4 ou WebM."); }
    finally { setBusy(false); }
  };

  return <main className="studio-app">
    <header className="studio-top"><a className="studio-brand" href="/"><span className="studio-logo"><Gamepad2/></span><span>INFECTADOZ <b>CLIP STUDIO</b></span></a><div className="server-pin"><span className="online-dot"/><div><small>SERVIDOR</small><strong>{serverName || DEFAULT_SERVER}</strong></div><code>{serverIp || DEFAULT_IP}</code></div></header>
    <div className="studio-content"><div className="intro"><div className="eyebrow"><Sparkles/> EDIÇÃO DE GAMEPLAY, SEM COMPLICAÇÃO</div><h1>Seu melhor gameplay.<br/><em>Em um clip só.</em></h1><p>Envie o vídeo. A gente encontra os momentos de mais ação e monta a compilação.</p></div>
      <div className="workspace"><section className="main-column"><div className="card video-card"><div className="card-heading"><div><span className="step">01</span><div><h2>Seu vídeo</h2><p>Envie um gameplay para começar.</p></div></div>{file&&<button className="replace-video" onClick={()=>document.getElementById("gameplay-file")?.click()}><Upload/> Trocar vídeo</button>}</div><input id="gameplay-file" className="file-hidden" type="file" accept="video/*" onChange={(e)=>chooseFile(e.currentTarget.files?.[0])}/>
      {videoUrl?<div className="preview-wrap"><video ref={videoRef} src={videoUrl} controls onLoadedMetadata={(e)=>setDuration(e.currentTarget.duration)}/>{(showCaption||showServer)&&<div className="preview-overlay">{showCaption&&caption&&<b>{caption}</b>}{showServer&&<span>{serverName||DEFAULT_SERVER}{serverIp&&` · ${serverIp}`}</span>}</div>}<canvas ref={canvasRef} className="hidden-canvas"/></div>:<label className="drop-zone" htmlFor="gameplay-file" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();chooseFile(e.dataTransfer.files[0]);}}><span className="upload-icon"><Upload/></span><b>Arraste seu vídeo para cá</b><span>ou <u>escolha um arquivo</u></span><small>MP4, MOV ou WebM</small></label>}
      {file&&<div className="file-info"><span><strong>{file.name}</strong><small>{duration?`${timeLabel(duration)} · `:""}{(file.size/1024/1024).toFixed(1)} MB</small></span><button aria-label="Remover vídeo" onClick={()=>setFile(null)}>×</button></div>}
      </div><div className="card generate-card"><div className="generate-explain"><span className="magic-icon"><Scissors/></span><div><b>{busy?"Trabalhando no seu vídeo…":"Compilação automática"}</b><small>{busy?status:"Vamos analisar o vídeo inteiro e selecionar os melhores momentos."}</small></div></div><button className="generate-button" disabled={!file||!duration||busy} onClick={generate}>{busy?<><span className="spinner"/> {progress}%</>:<><Sparkles/> Gerar minha compilação</>}</button>{busy&&<div className="progress-track"><span style={{width:`${progress}%`}}/></div>}{!busy&&status&&<p className="result-status">{status}</p>}</div>
      {output&&<section className="card result-card"><div className="card-heading"><div><span className="step complete">✓</span><div><h2>Sua compilação está pronta</h2><p>Os melhores momentos, reunidos em um vídeo.</p></div></div></div><video src={output} controls/><a className="download-button" href={output} download={outputName}><Download/> Baixar compilação</a></section>}
      </section><aside className="settings-column"><section className="card settings-card"><div className="card-heading"><div><span className="step">02</span><div><h2>Personalize</h2><p>Escolha o que aparece no clip.</p></div></div></div><label className="check-row"><input type="checkbox" checked={showCaption} onChange={(e)=>setShowCaption(e.target.checked)}/><span>Mostrar frase</span></label>{showCaption&&<input className="text-input" value={caption} maxLength={70} onChange={(e)=>setCaption(e.target.value)} placeholder="Escreva sua frase"/>}<label className="check-row"><input type="checkbox" checked={showServer} onChange={(e)=>setShowServer(e.target.checked)}/><span>Mostrar servidor e IP</span></label>{showServer&&<><input className="text-input" value={serverName} maxLength={30} onChange={(e)=>setServerName(e.target.value)} placeholder="Nome do servidor"/><input className="text-input" value={serverIp} maxLength={40} onChange={(e)=>setServerIp(e.target.value)} placeholder="IP do servidor"/></>}
      </section><section className="card settings-card sound-card"><div className="card-heading"><div><span className="step">03</span><div><h2>Áudio</h2><p>Deixe o jogo em destaque.</p></div></div><Volume2/></div><label className="slider-label"><span><Gamepad2/> Som do jogo <b>{gameVolume}%</b></span><input aria-label="Volume do som do jogo" type="range" min="0" max="150" value={gameVolume} onChange={(e)=>setGameVolume(Number(e.target.value))}/></label><label className="slider-label"><span><Music2/> Música de fundo <b>{musicVolume}%</b></span><input aria-label="Volume da música de fundo" type="range" min="0" max="60" value={musicVolume} onChange={(e)=>setMusicVolume(Number(e.target.value))}/></label><label className="music-file">{musicFile?<span>{musicFile.name}</span>:<span><Upload/> Adicionar sua música</span>}<input type="file" accept="audio/*" onChange={(e)=>setMusicFile(e.currentTarget.files?.[0]||null)}/></label><audio ref={musicRef} loop className="hidden-audio"/></section><div className="privacy-note"><span>✓</span><p>Seus arquivos são processados neste navegador e não são enviados para um servidor.</p></div></aside></div>
      <footer className="studio-footer"><span><Gamepad2/> InfectadoZ Clip Studio</span><span>A análise seleciona trechos com mais movimento visual.</span></footer>
    </div>
  </main>;
}




