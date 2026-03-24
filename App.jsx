import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1469694611344593097/VNPloszJULo4pVMbGmrnqtEnQ3drKeNpF2vJfvPv-zDwSb2chBynkE5mSS-0v-HFWE7m";

export default function App() {
  const webcamRef = useRef(null);

  const [pedido, setPedido] = useState("");
  const [foto, setFoto] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [busca, setBusca] = useState("");
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("pedidos");
    if (data) setPedidos(JSON.parse(data));

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  function salvarLocal(lista) {
    setPedidos(lista);
    localStorage.setItem("pedidos", JSON.stringify(lista));
  }

  function capturar() {
    if (!pedido) return alert("Informe o número do pedido");
    const image = webcamRef.current.getScreenshot();
    setFoto(image);
  }

  async function enviarDiscord(base64, nome) {
    if (!DISCORD_WEBHOOK_URL) return;

    const blob = await (await fetch(base64)).blob();

    const formData = new FormData();
    formData.append("payload_json", JSON.stringify({
      content: `📸 Pedido #${pedido}`
    }));

    formData.append("file", blob, nome);

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      body: formData
    });
  }

  async function salvar() {
    const nome = `${pedido}_${Date.now()}.jpg`;

    const novo = {
      nome,
      imagem: foto
    };

    const lista = [novo, ...pedidos];
    salvarLocal(lista);

    await enviarDiscord(foto, nome);

    setFoto(null);
    setPedido("");
  }

  function apagar(nome) {
    const lista = pedidos.filter(p => p.nome !== nome);
    salvarLocal(lista);
  }

  const videoConstraints = {
    facingMode: "environment",
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      color: "#fff",
      padding: "24px",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
    },
    header: {
      textAlign: "center",
      marginBottom: "32px"
    },
    title: {
      fontSize: "2rem",
      fontWeight: "700",
      background: "linear-gradient(90deg, #e94560, #ff6b6b)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "8px"
    },
    subtitle: {
      color: "#94a3b8",
      fontSize: "0.95rem"
    },
    card: {
      background: "rgba(255,255,255,0.05)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "20px",
      marginBottom: "20px",
      border: "1px solid rgba(255,255,255,0.1)"
    },
    input: {
      width: "100%",
      padding: "14px 18px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      fontSize: "1rem",
      outline: "none",
      transition: "all 0.2s",
      boxSizing: "border-box"
    },
    webcamContainer: {
      position: "relative",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      width: "100%",
      aspectRatio: isPortrait ? "3/4" : "16/9",
      maxHeight: isPortrait ? "60vh" : "50vh"
    },
    buttonPrimary: {
      width: "100%",
      padding: "16px",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #e94560, #c73e54)",
      color: "#fff",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "transform 0.2s, box-shadow 0.2s",
      marginTop: "16px"
    },
    buttonSecondary: {
      flex: 1,
      padding: "14px",
      borderRadius: "12px",
      border: "1px solid rgba(255,255,255,0.2)",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      fontSize: "0.95rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    buttonDanger: {
      padding: "10px 16px",
      borderRadius: "8px",
      border: "none",
      background: "rgba(239,68,68,0.2)",
      color: "#ef4444",
      fontSize: "0.85rem",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    preview: {
      width: "100%",
      maxHeight: isPortrait ? "60vh" : "50vh",
      borderRadius: "16px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      objectFit: "contain",
      imageRendering: "-webkit-optimize-contrast"
    },
    buttonGroup: {
      display: "flex",
      gap: "12px",
      marginTop: "16px"
    },
    pedidoItem: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      padding: "16px",
      background: "rgba(255,255,255,0.05)",
      borderRadius: "12px",
      marginBottom: "12px",
      border: "1px solid rgba(255,255,255,0.1)"
    },
    pedidoThumb: {
      width: "80px",
      height: "80px",
      objectFit: "cover",
      borderRadius: "10px"
    },
    pedidoInfo: {
      flex: 1
    },
    pedidoNumber: {
      fontSize: "1.1rem",
      fontWeight: "600",
      color: "#f8fafc",
      marginBottom: "4px"
    },
    pedidoDate: {
      fontSize: "0.8rem",
      color: "#94a3b8"
    },
    emptyState: {
      textAlign: "center",
      padding: "40px 20px",
      color: "#64748b"
    },
    badge: {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "20px",
      background: "rgba(233,69,96,0.2)",
      color: "#e94560",
      fontSize: "0.75rem",
      fontWeight: "600",
      marginBottom: "12px"
    },
    divider: {
      border: "none",
      height: "1px",
      background: "rgba(255,255,255,0.1)",
      margin: "24px 0"
    }
  };

  const pedidosFiltrados = pedidos.filter(p => p.nome.includes(busca));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.badge}>📦 FotoCheckout</div>
        <h1 style={styles.title}>Captura de Pedidos</h1>
        <p style={styles.subtitle}>Registre e envie fotos dos pedidos automaticamente</p>
      </div>

      <div style={styles.card}>
        <input
          placeholder="🔍 Buscar pedido por número..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={styles.input}
        />
      </div>

      {!foto ? (
        <div style={styles.card}>
          <input
            placeholder="📋 Digite o número do pedido"
            value={pedido}
            onChange={e => setPedido(e.target.value)}
            inputMode="numeric"
            style={{...styles.input, marginBottom: "16px"}}
          />

          <div style={styles.webcamContainer}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={1}
              videoConstraints={videoConstraints}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <button onClick={capturar} style={styles.buttonPrimary}>
            📸 Capturar Foto
          </button>
        </div>
      ) : (
        <div style={styles.card}>
          <img src={foto} style={styles.preview} alt="Preview" />
          <div style={styles.buttonGroup}>
            <button onClick={salvar} style={{...styles.buttonSecondary, background: "linear-gradient(135deg, #10b981, #059669)", border: "none"}}>
              ✅ Salvar
            </button>
            <button onClick={() => setFoto(null)} style={styles.buttonSecondary}>
              🔄 Refazer
            </button>
          </div>
        </div>
      )}

      <hr style={styles.divider} />

      <div>
        <h3 style={{ marginBottom: "16px", fontSize: "1.2rem", fontWeight: "600" }}>
          📚 Histórico ({pedidosFiltrados.length})
        </h3>

        {pedidosFiltrados.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Nenhum pedido encontrado</p>
          </div>
        ) : (
          pedidosFiltrados.map(p => {
            const parts = p.nome.split('_');
            const numero = parts[0];
            const timestamp = parseInt(parts[1]);
            const data = new Date(timestamp).toLocaleString('pt-BR', { 
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <div key={p.nome} style={styles.pedidoItem}>
                <img src={p.imagem} style={styles.pedidoThumb} alt={p.nome} />
                <div style={styles.pedidoInfo}>
                  <div style={styles.pedidoNumber}>Pedido #{numero}</div>
                  <div style={styles.pedidoDate}>{data}</div>
                </div>
                <button onClick={() => apagar(p.nome)} style={styles.buttonDanger}>
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


