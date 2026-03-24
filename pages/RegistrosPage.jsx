import { useEffect, useState } from "react";

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatFileSize(size) {
  if (!size) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function RegistrosPage({ pedidos, isLoading, loadError, onRemoverPedido }) {
  const [busca, setBusca] = useState("");
  const [selectedPedidoId, setSelectedPedidoId] = useState("");
  const [previewUrls, setPreviewUrls] = useState({});

  useEffect(() => {
    const nextPreviewUrls = {};

    pedidos.forEach((pedido) => {
      nextPreviewUrls[pedido.id] = URL.createObjectURL(pedido.blob);
    });

    setPreviewUrls(nextPreviewUrls);

    return () => {
      Object.values(nextPreviewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pedidos]);

  const termoBusca = busca.trim().toLowerCase();
  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (!termoBusca) {
      return true;
    }

    return (
      pedido.pedido.toLowerCase().includes(termoBusca) ||
      pedido.fileName.toLowerCase().includes(termoBusca)
    );
  });

  useEffect(() => {
    if (pedidosFiltrados.length === 0) {
      setSelectedPedidoId("");
      return;
    }

    if (!pedidosFiltrados.some((pedido) => pedido.id === selectedPedidoId)) {
      setSelectedPedidoId(pedidosFiltrados[0].id);
    }
  }, [pedidosFiltrados, selectedPedidoId]);

  async function handleDelete(pedido) {
    const confirmed = window.confirm(`Excluir o registro do pedido #${pedido.pedido}?`);
    if (!confirmed) {
      return;
    }

    await onRemoverPedido(pedido.id);
  }

  const selectedPedido =
    pedidosFiltrados.find((pedido) => pedido.id === selectedPedidoId) || pedidosFiltrados[0] || null;

  return (
    <div className="page-grid registros-layout">
      <section className="card card--compact">
        <div className="section-head">
          <span className="section-kicker">Historico local</span>
          <h2 className="section-title">Visualizar registros</h2>
          <p className="section-copy">
            Pesquise por numero do pedido, confira a foto em destaque e remova itens que nao
            precisa mais manter no aparelho.
          </p>
        </div>
      </section>

      <div className="registros-grid">
        <section className="card">
          <div className="field-group">
            <label className="field-label" htmlFor="busca">
              Buscar pedido
            </label>
            <input
              id="busca"
              className="text-input"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Ex.: 48231"
            />
          </div>

          {loadError ? <div className="status status--error">{loadError}</div> : null}

          {isLoading ? (
            <div className="empty-state">Carregando registros...</div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="empty-state">Nenhum registro encontrado para esse filtro.</div>
          ) : (
            <div className="record-list">
              {pedidosFiltrados.map((pedido) => {
                const isActive = pedido.id === selectedPedido?.id;

                return (
                  <article
                    key={pedido.id}
                    className={`record-card ${isActive ? "is-active" : ""}`}
                  >
                    <button
                      type="button"
                      className="record-main"
                      onClick={() => setSelectedPedidoId(pedido.id)}
                    >
                      <img
                        className="record-thumb"
                        src={previewUrls[pedido.id]}
                        alt={`Pedido ${pedido.pedido}`}
                      />

                      <div className="record-info">
                        <div className="record-title">Pedido #{pedido.pedido}</div>
                        <div className="record-meta">{formatDate(pedido.createdAt)}</div>
                        <div className="record-meta">{formatFileSize(pedido.blob.size)}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="button button--danger button--small"
                      onClick={() => handleDelete(pedido)}
                    >
                      Excluir
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="card preview-panel">
          {selectedPedido ? (
            <>
              <div className="section-head">
                <span className="section-kicker">Preview</span>
                <h2 className="section-title">Pedido #{selectedPedido.pedido}</h2>
                <p className="section-copy">
                  Arquivo salvo localmente em armazenamento proprio para lidar melhor com fotos
                  grandes.
                </p>
              </div>

              <img
                className="preview-image"
                src={previewUrls[selectedPedido.id]}
                alt={`Preview do pedido ${selectedPedido.pedido}`}
              />

              <div className="capture-meta">
                <div className="meta-item">
                  <span className="meta-label">Data</span>
                  <strong className="meta-value">{formatDate(selectedPedido.createdAt)}</strong>
                </div>

                <div className="meta-item">
                  <span className="meta-label">Arquivo</span>
                  <strong className="meta-value">{formatFileSize(selectedPedido.blob.size)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="button button--danger"
                onClick={() => handleDelete(selectedPedido)}
              >
                Excluir este registro
              </button>
            </>
          ) : (
            <div className="empty-state">Selecione um registro para visualizar a foto em destaque.</div>
          )}
        </section>
      </div>
    </div>
  );
}
