const DB_NAME = "fotocheckout-db";
const DB_VERSION = 1;
const STORE_NAME = "pedidos";
const LEGACY_STORAGE_KEY = "pedidos";

function ensureIndexedDb() {
  if (typeof indexedDB === "undefined") {
    throw new Error("O navegador nao oferece suporte ao armazenamento local de fotos.");
  }
}

function openDatabase() {
  ensureIndexedDb();

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("pedido", "pedido", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Nao foi possivel abrir a base local."));
  });
}

function finalizeTransaction(transaction, database) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("A transacao foi interrompida."));
    };

    transaction.onabort = () => {
      database.close();
      reject(transaction.error || new Error("A transacao foi abortada."));
    };
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("A operacao no IndexedDB falhou."));
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function extractLegacyPedidoName(fileName) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const separatorIndex = baseName.lastIndexOf("_");

  if (separatorIndex === -1) {
    return {
      pedido: baseName,
      createdAt: Date.now(),
    };
  }

  const pedido = baseName.slice(0, separatorIndex);
  const createdAt = Number.parseInt(baseName.slice(separatorIndex + 1), 10) || Date.now();

  return {
    pedido,
    createdAt,
  };
}

async function normalizeLegacyPedido(legacyPedido) {
  if (!legacyPedido || typeof legacyPedido.imagem !== "string") {
    return null;
  }

  const blob = await dataUrlToBlob(legacyPedido.imagem);
  const fileName = legacyPedido.nome || `pedido_${Date.now()}.jpg`;
  const { pedido, createdAt } = extractLegacyPedidoName(fileName);

  return {
    id: fileName,
    fileName,
    pedido,
    createdAt,
    blob,
    mimeType: blob.type || "image/jpeg",
  };
}

export async function migrateLegacyPedidos() {
  if (typeof window === "undefined") {
    return;
  }

  const rawLegacyPedidos = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!rawLegacyPedidos) {
    return;
  }

  let parsedLegacyPedidos;

  try {
    parsedLegacyPedidos = JSON.parse(rawLegacyPedidos);
  } catch {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  if (!Array.isArray(parsedLegacyPedidos) || parsedLegacyPedidos.length === 0) {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  const normalizedPedidos = await Promise.all(
    parsedLegacyPedidos.map((pedido) => normalizeLegacyPedido(pedido)),
  );
  const validPedidos = normalizedPedidos.filter(Boolean);

  if (validPedidos.length === 0) {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  validPedidos.forEach((pedido) => {
    store.put(pedido);
  });

  await finalizeTransaction(transaction, database);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export async function listPedidos() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.getAll();
  const pedidos = await requestToPromise(request);
  await finalizeTransaction(transaction, database);

  return pedidos.sort((left, right) => right.createdAt - left.createdAt);
}

export async function savePedidoRecord(record) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(record);
  await finalizeTransaction(transaction, database);
}

export async function removePedidoRecord(id) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await finalizeTransaction(transaction, database);
}
