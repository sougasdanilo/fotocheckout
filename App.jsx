import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1469694611344593097/VNPloszJULo4pVMbGmrnqtEnQ3drKeNpF2vJfvPv-zDwSb2chBynkE5mSS-0v-HFWE7m";

export default function App() {
  const webcamRef = useRef(null);

  const [pedido, setPedido] = useState("");
  const [foto, setFoto] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("pedidos");
    if (data) setPedidos(JSON.parse(data));
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

  return (
    <div style={{ padding: 20, background: "#000", minHeight: "100vh", color: "#fff" }}>
      <h2>Pedidos</h2>

      <input
        placeholder="Buscar pedido"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      {!foto && (
        <>
          <input
            placeholder="Número do pedido"
            value={pedido}
            onChange={e => setPedido(e.target.value)}
            style={{ padding: 10, width: "100%", marginBottom: 10 }}
          />

          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ width: "100%" }}
          />

          <button onClick={capturar} style={{ marginTop: 10 }}>
            Capturar
          </button>
        </>
      )}

      {foto && (
        <>
          <img src={foto} style={{ width: "100%" }} />
          <button onClick={salvar}>Salvar</button>
          <button onClick={() => setFoto(null)}>Refazer</button>
        </>
      )}

      <hr />

      {pedidos
        .filter(p => p.nome.includes(busca))
        .map(p => (
          <div key={p.nome} style={{ marginBottom: 10 }}>
            <img src={p.imagem} style={{ width: 100 }} />
            <div>{p.nome}</div>
            <button onClick={() => apagar(p.nome)}>Apagar</button>
          </div>
        ))}
    </div>
  );
}


