import { useEffect, useState } from "react";
import {
  listPedidos,
  migrateLegacyPedidos,
  removePedidoRecord,
  savePedidoRecord,
} from "../lib/pedidosDb";

function buildFileName(pedido, createdAt, mimeType) {
  const extension = mimeType === "image/png" ? "png" : "jpg";
  return `${pedido}_${createdAt}.${extension}`;
}

export function usePedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function loadPedidos() {
      setIsLoading(true);

      try {
        await migrateLegacyPedidos();
        const registros = await listPedidos();

        if (!isCancelled) {
          setPedidos(registros);
          setError("");
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nao foi possivel carregar os registros.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPedidos();

    return () => {
      isCancelled = true;
    };
  }, []);

  async function adicionarPedido({ pedido, blob }) {
    const createdAt = Date.now();
    const fileName = buildFileName(pedido, createdAt, blob.type || "image/jpeg");
    const record = {
      id: fileName,
      fileName,
      pedido,
      createdAt,
      blob,
      mimeType: blob.type || "image/jpeg",
    };

    await savePedidoRecord(record);
    setPedidos((currentPedidos) =>
      [record, ...currentPedidos].sort((left, right) => right.createdAt - left.createdAt),
    );
    setError("");

    return record;
  }

  async function removerPedido(id) {
    await removePedidoRecord(id);
    setPedidos((currentPedidos) => currentPedidos.filter((pedido) => pedido.id !== id));
  }

  return {
    pedidos,
    isLoading,
    error,
    adicionarPedido,
    removerPedido,
  };
}
