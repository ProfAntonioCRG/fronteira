import { useEffect, useState } from "react";
import { CheckCircle2, Cloud, Download, ExternalLink, GitBranch, HardDrive, LoaderCircle, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { getOfflineState, prepareOffline, type OfflineState } from "../lib/offline";
import guide from "../../docs/INSTALACAO.md?raw";

const STATE_LABELS: Record<OfflineState, string> = {
  checking: "Verificando este navegador...",
  unprepared: "Acesso offline ainda não preparado",
  ready: "Arquivos do aplicativo disponíveis offline",
  unavailable: "Preparação disponível na versão compilada",
};

export default function InstallationGuide() {
  const [section, setSection] = useState<"local" | "online">("local");
  const [online, setOnline] = useState(navigator.onLine);
  const [state, setState] = useState<OfflineState>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

  useEffect(() => {
    let mounted = true;
    const inspect = () => { void getOfflineState().then(value => { if (mounted) setState(value); }); };
    const connectivity = () => { setOnline(navigator.onLine); inspect(); };
    let serviceWorker: ServiceWorkerContainer | undefined;
    try { if (window.isSecureContext) serviceWorker = navigator.serviceWorker; } catch { /* Sandboxed previews may deny access. */ }
    inspect();
    window.addEventListener("online", connectivity); window.addEventListener("offline", connectivity);
    serviceWorker?.addEventListener("controllerchange", inspect);
    return () => { mounted = false; window.removeEventListener("online", connectivity); window.removeEventListener("offline", connectivity); serviceWorker?.removeEventListener("controllerchange", inspect); };
  }, []);

  const prepare = async () => {
    setBusy(true); setError(""); setMessage("");
    try {
      await prepareOffline(); setState("ready");
      setMessage("Aplicativo preparado neste navegador. Fora do atendimento, desligue o Wi-Fi e recarregue as duas janelas para conferir. As imagens enviadas para a TV já ficam salvas separadamente.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível preparar o acesso offline."); }
    finally { setBusy(false); }
  };

  const protect = async () => {
    setError(""); setMessage("");
    try {
      if (!navigator.storage?.persist) { setMessage("Este navegador não oferece essa proteção. Mantenha backups diários."); return; }
      const granted = await navigator.storage.persist();
      setMessage(granted ? "O navegador concedeu armazenamento persistente para reduzir a remoção automática dos dados. Isso não substitui backup nem impede exclusão manual." : "A proteção não foi concedida pelo navegador. O sistema continua funcionando; mantenha backups diários.");
    } catch { setError("Não foi possível solicitar a proteção. Use uma janela normal e mantenha backups diários."); }
  };

  const downloadGuide = () => {
    const url = URL.createObjectURL(new Blob([guide], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "Fronteira-guia-de-instalacao.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section className="settings-section installation-guide">
    <div className="settings-section-heading"><div><h2>O atendimento não precisa depender da internet</h2><p>Use no computador da loja e mantenha uma cópia do projeto e dos seus dados.</p></div><button className="action-button secondary" onClick={downloadGuide}><Download size={17} /> Baixar guia completo</button></div>
    <div className="installation-recommendation"><HardDrive size={22} /><div><strong>Para a loja, recomendamos o uso local.</strong><p>Computador + TV por HDMI + duas janelas do mesmo navegador. Sem mensalidade e sem depender de um servidor online para registrar ou chamar pedidos.</p></div></div>
    <nav className="tv-settings-subnav" aria-label="Guia de instalação"><button className={section === "local" ? "active" : ""} onClick={() => setSection("local")}><HardDrive size={17} /> No computador</button><button className={section === "online" ? "active" : ""} onClick={() => setSection("online")}><GitBranch size={17} /> GitHub e hospedagem</button></nav>
    {section === "local" ? <>
      <ol className="installation-steps">
        <li><span>1</span><div><h3>Prepare uma vez, com internet</h3><p>Instale o <a href="https://nodejs.org/" target="_blank" rel="noopener noreferrer">Node.js LTS</a>. Na pasta do projeto, execute <code>npm install</code> e depois <code>npm run build</code>. Isso cria a pasta <code>dist</code>.</p><p>Alternativa: no GitHub, baixe o pacote <strong>fronteira-offline</strong> gerado em Actions e extraia tudo. Nesse caso, basta ter o Node.js instalado.</p></div></li>
        <li><span>2</span><div><h3>Abra o inicializador da loja</h3><p>No Windows, dê dois cliques em <code>INICIAR-FRONTEIRA.bat</code>. No macOS/Linux, execute <code>sh iniciar-fronteira.sh</code>. Mantenha a janela do servidor aberta.</p><p>Use sempre <code>http://localhost:4173</code>, no mesmo perfil do navegador. Depois da preparação, não é necessário executar npm nem ter internet para iniciar o atendimento.</p></div></li>
        <li><span>3</span><div><h3>Configure a TV e faça um teste sem Wi-Fi</h3><p>Carregue suas imagens, abra o painel da TV e ative o som. Desconecte a internet e teste criar, imprimir e chamar um pedido. O QR Code continua visível; o celular do cliente precisa de internet para abrir o WhatsApp.</p></div></li>
        <li><span>4</span><div><h3>Feche o dia com um backup</h3><p>Exporte em <strong>Configurações &gt; Backup</strong> e guarde uma cópia fora do computador. Trocar navegador, perfil, domínio ou porta não transfere os pedidos automaticamente.</p></div></li>
      </ol>
      <div className="offline-preparation">
        <div className="offline-status"><span className={state === "ready" ? "ready" : ""}>{state === "ready" ? <CheckCircle2 size={20} /> : <Cloud size={20} />}</span><div><h3>Uma proteção extra: cópia no navegador</h3><p>{STATE_LABELS[state]}</p></div><span className="connectivity-label">{online ? <Wifi size={15} /> : <WifiOff size={15} />}{local ? "Endereço local" : online ? "Rede conectada" : "Sem rede"}</span></div>
        <p>Na versão compilada, este botão salva o aplicativo para reabrir o mesmo endereço se a conexão falhar. O servidor local continua sendo a opção mais previsível para a loja.</p>
        <div className="flex flex-wrap gap-3"><button className="action-button primary" disabled={busy || state === "checking"} onClick={() => void prepare()}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Download size={17} />}{busy ? "Preparando..." : state === "ready" ? "Verificar acesso offline" : "Preparar acesso offline"}</button><button className="action-button secondary" onClick={() => void protect()}><ShieldCheck size={17} /> Proteger armazenamento</button></div>
        <p className="settings-help">Fontes, logo e geração do QR Code estão no aplicativo. Fotos por URL só aparecem offline se estiverem em cache; quando indisponíveis, usamos o logo. Prefira os arquivos enviados para a TV. O cache pode ser removido pelo navegador e não é um backup.</p>
        {message && <p className="feedback success" role="status">{message}</p>}{error && <p className="feedback error" role="alert">{error}</p>}
      </div>
    </> : <>
      <ol className="installation-steps">
        <li><span>1</span><div><h3>Guarde o código no GitHub</h3><p>Instale o <a href="https://desktop.github.com/" target="_blank" rel="noopener noreferrer">GitHub Desktop</a>, crie o repositório <code>fronteira-pedidos</code> e copie o projeto para a pasta dele. Faça <strong>Commit to main</strong> e <strong>Publish repository</strong>. Pode ser privado.</p><p>Não envie backups de clientes, senhas nem a pasta node_modules. O arquivo .gitignore já ajuda a excluir arquivos locais.</p></div></li>
        <li><span>2</span><div><h3>Baixe as versões prontas</h3><p>Em <strong>Actions &gt; Preparar pacotes da Fronteira</strong>, aguarde a execução concluir. Na seção Artifacts, baixe <strong>fronteira-offline</strong> para o computador ou <strong>fronteira-site</strong> para hospedar. Se necessário, use Run workflow.</p></div></li>
        <li><span>3</span><div><h3>Para uma cópia online gratuita: Cloudflare Pages</h3><p>Crie uma conta e abra <strong>Workers & Pages &gt; Create application &gt; Pages</strong>. Escolha upload direto e envie a pasta <code>dist</code> ou o ZIP fronteira-site. Você recebe um endereço <code>.pages.dev</code> com HTTPS.</p><p>Não envie o código-fonte no lugar da versão compilada. Publique a pasta completa, com index.html na raiz e suas imagens.</p><a className="installation-source" href="https://developers.cloudflare.com/pages/get-started/direct-upload/" target="_blank" rel="noopener noreferrer">Instruções oficiais de publicação <ExternalLink size={13} /></a></div></li>
      </ol>
      <div className="installation-caution"><strong>GitHub não é o mesmo que GitHub Pages.</strong><p>O GitHub guarda o projeto. Já o GitHub Pages tem restrições a sites voltados a negócios e transações comerciais, então não o recomendamos para operar o caixa da loja.</p><a href="https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits" target="_blank" rel="noopener noreferrer">Consultar os limites e termos do GitHub Pages <ExternalLink size={13} /></a></div>
    </>}
    <div className="installation-footnote"><ShieldCheck size={18} /><p><strong>Nenhuma opção garante zero falhas.</strong> Energia, computador, impressora e armazenamento também precisam de cuidado. A versão atual não tem login nem banco de dados na nuvem: publicar o site não publica seus pedidos nem cria sincronização entre computadores. Use uma só origem durante o atendimento e faça backup diário.</p></div>
  </section>;
}