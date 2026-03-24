const DISCORD_WEBHOOK_URL =
  import.meta.env.VITE_DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1469694611344593097/VNPloszJULo4pVMbGmrnqtEnQ3drKeNpF2vJfvPv-zDwSb2chBynkE5mSS-0v-HFWE7m";

export async function uploadPedidoPhoto({ pedido, blob, fileName }) {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error("Configure VITE_DISCORD_WEBHOOK_URL para habilitar o envio das fotos.");
  }

  const formData = new FormData();
  formData.append(
    "payload_json",
    JSON.stringify({
      content: `Pedido #${pedido}`,
    }),
  );
  formData.append("file", blob, fileName);

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("A foto foi salva localmente, mas o envio para o Discord falhou.");
  }
}
