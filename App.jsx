import { uploadPedidoPhoto } from "./lib/discordWebhook";
import { usePedidos } from "./hooks/usePedidos";
import { useHashRoute } from "./hooks/useHashRoute";
import CapturaPage from "./pages/CapturaPage";
import RegistrosPage from "./pages/RegistrosPage";

const PAGE_CONTENT = {
  "/captura": {
    title: "Captura de Pedidos",
  },
  "/registros": {
    title: "Registros Salvos",
  },
};

export default function App() {
  const { route, navigate } = useHashRoute("/captura");
  const { pedidos, isLoading, error, adicionarPedido, removerPedido } = usePedidos();

  async function handleRegistrarPedido({ pedido, blob }) {
    const registro = await adicionarPedido({ pedido, blob });

    try {
      await uploadPedidoPhoto({
        pedido,
        blob,
        fileName: registro.fileName,
      });

      return {
        uploaded: true,
      };
    } catch (uploadError) {
      return {
        uploaded: false,
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "A foto foi salva localmente, mas o envio falhou.",
      };
    }
  }

  const page = PAGE_CONTENT[route] ?? PAGE_CONTENT["/captura"];

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="card app-header">
          <div className="badge">FotoCheckout</div>

          <div className="app-heading">
            <h1 className="app-title">{page.title}</h1>
            <p className="app-subtitle">{page.subtitle}</p>
          </div>

          <nav className="nav-strip" aria-label="Paginas principais">
            <button
              type="button"
              className={`nav-button ${route === "/captura" ? "is-active" : ""}`}
              onClick={() => navigate("/captura")}
            >
              Captura
            </button>

            <button
              type="button"
              className={`nav-button ${route === "/registros" ? "is-active" : ""}`}
              onClick={() => navigate("/registros")}
            >
              Registros
              <span className="nav-count">{pedidos.length}</span>
            </button>
          </nav>
        </header>

        {route === "/registros" ? (
          <RegistrosPage
            pedidos={pedidos}
            isLoading={isLoading}
            loadError={error}
            onRemoverPedido={removerPedido}
          />
        ) : (
          <CapturaPage
            onRegistrarPedido={handleRegistrarPedido}
            onAbrirRegistros={() => navigate("/registros")}
          />
        )}
      </div>
    </div>
  );
}
