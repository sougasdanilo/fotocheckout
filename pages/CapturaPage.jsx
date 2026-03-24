import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { captureHighQualityPhoto } from "../lib/photoCapture";

function pickPreferredCamera(videoInputs) {
  return (
    videoInputs.find((device) => /back|rear|traseira|ambiente|environment/i.test(device.label)) ||
    videoInputs[0] ||
    null
  );
}

async function readVideoInputs() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

function getDeviceLabel(device, index) {
  return device.label || `Camera ${index + 1}`;
}

function formatCaptureResolution(photo) {
  if (!photo?.width || !photo?.height) {
    return "Nativa do dispositivo";
  }

  return `${photo.width} x ${photo.height}`;
}

function formatCameraError(error) {
  const message = error?.message || error?.name || "";

  if (/permission|denied|notallowed/i.test(message)) {
    return "Permita o uso da camera para continuar a captura.";
  }

  if (/notfound|devicesnotfound/i.test(message)) {
    return "Nenhuma camera foi encontrada neste dispositivo.";
  }

  return "Nao foi possivel acessar a camera selecionada.";
}

export default function CapturaPage({ onRegistrarPedido, onAbrirRegistros }) {
  const webcamRef = useRef(null);

  const [pedido, setPedido] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [status, setStatus] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    function updateOrientation() {
      setIsPortrait(window.innerHeight > window.innerWidth);
    }

    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    window.addEventListener("orientationchange", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
      window.removeEventListener("orientationchange", updateOrientation);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadCameraDevices() {
      try {
        const videoInputs = await readVideoInputs();
        if (isCancelled) {
          return;
        }

        setCameraDevices(videoInputs);
        setSelectedDeviceId((currentDeviceId) => {
          if (currentDeviceId && videoInputs.some((device) => device.deviceId === currentDeviceId)) {
            return currentDeviceId;
          }

          return pickPreferredCamera(videoInputs)?.deviceId || "";
        });
      } catch {
        if (!isCancelled) {
          setCameraDevices([]);
        }
      }
    }

    loadCameraDevices();

    if (!navigator.mediaDevices?.addEventListener) {
      return () => {
        isCancelled = true;
      };
    }

    navigator.mediaDevices.addEventListener("devicechange", loadCameraDevices);

    return () => {
      isCancelled = true;
      navigator.mediaDevices.removeEventListener("devicechange", loadCameraDevices);
    };
  }, []);

  useEffect(() => {
    if (!capturedPhoto?.blob) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(capturedPhoto.blob);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [capturedPhoto]);

  async function refreshDeviceList() {
    try {
      const videoInputs = await readVideoInputs();
      setCameraDevices(videoInputs);
      setSelectedDeviceId((currentDeviceId) => {
        if (currentDeviceId && videoInputs.some((device) => device.deviceId === currentDeviceId)) {
          return currentDeviceId;
        }

        return pickPreferredCamera(videoInputs)?.deviceId || "";
      });
    } catch {
      setCameraDevices([]);
    }
  }

  async function handleCapture() {
    const pedidoNumber = pedido.trim();

    if (!pedidoNumber) {
      setStatus({
        tone: "error",
        message: "Informe o numero do pedido antes de capturar a foto.",
      });
      return;
    }

    setIsCapturing(true);
    setStatus(null);

    try {
      const photo = await captureHighQualityPhoto(webcamRef);
      setCapturedPhoto(photo);
      setCameraError("");
    } catch (captureError) {
      setStatus({
        tone: "error",
        message:
          captureError instanceof Error
            ? captureError.message
            : "Nao foi possivel capturar a foto.",
      });
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleSave() {
    if (!capturedPhoto?.blob) {
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const result = await onRegistrarPedido({
        pedido: pedido.trim(),
        blob: capturedPhoto.blob,
      });

      setCapturedPhoto(null);
      setPedido("");

      setStatus(
        result.uploaded
          ? {
              tone: "success",
              message: "Foto salva e enviada com sucesso.",
            }
          : {
              tone: "warning",
              message:
                result.message ||
                "Foto salva localmente. O envio ficou pendente por causa de uma falha externa.",
            },
      );
    } catch (saveError) {
      setStatus({
        tone: "error",
        message:
          saveError instanceof Error ? saveError.message : "Nao foi possivel salvar o registro.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleRetake() {
    setCapturedPhoto(null);
    setStatus(null);
  }

  function handleUserMediaError(error) {
    setCameraError(formatCameraError(error));
  }

  async function handleUserMedia() {
    setCameraError("");
    await refreshDeviceList();
  }

  const selectedCamera = cameraDevices.find((device) => device.deviceId === selectedDeviceId);
  const videoConstraints = selectedDeviceId
    ? {
        deviceId: { exact: selectedDeviceId },
        width: { ideal: 4096 },
        height: { ideal: 3072 },
        aspectRatio: isPortrait ? 0.75 : 1.3333333333,
      }
    : {
        facingMode: { ideal: "environment" },
        width: { ideal: 4096 },
        height: { ideal: 3072 },
        aspectRatio: isPortrait ? 0.75 : 1.3333333333,
      };

  return (
    <div className="page-grid capture-layout">
      <section className="card controls-card">
        <div className="section-head">
          <span className="section-kicker">Nova captura</span>
          <h2 className="section-title">Preparar a foto do pedido</h2>
        </div>

        {status ? <div className={`status status--${status.tone}`}>{status.message}</div> : null}
        {cameraError ? <div className="status status--error">{cameraError}</div> : null}

        

        <div className="field-group">
          <label className="field-label" htmlFor="camera">
            Camera
          </label>

          <select
            id="camera"
            className="select-input"
            value={selectedDeviceId}
            onChange={(event) => setSelectedDeviceId(event.target.value)}
            disabled={cameraDevices.length <= 1}
          >
            {cameraDevices.length === 0 ? (
              <option value="">Aguardando permissao da camera</option>
            ) : (
              cameraDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {getDeviceLabel(device, index)}
                </option>
              ))
            )}
          </select>

          <div className="field-group">
            <label className="field-label" htmlFor="pedido">
              Numero do pedido
            </label>
            <input
              id="pedido"
              className="text-input"
              value={pedido}
              onChange={(event) => setPedido(event.target.value)}
              inputMode="numeric"
              placeholder="Ex.: 48231"
            />
          </div>

          {selectedCamera ? (
            <p className="helper-text">Camera ativa: {selectedCamera.label || "Padrao do sistema"}</p>
          ) : null}
        </div>
        <section className="card camera-card">
          <div className={`camera-frame ${isPortrait ? "is-portrait" : "is-landscape"}`}>
            {capturedPhoto && previewUrl ? (
              <img className="photo-preview" src={previewUrl} alt="Preview da captura" />
            ) : (
              <Webcam
                key={selectedDeviceId || "default-camera"}
                ref={webcamRef}
                audio={false}
                className="camera-video"
                playsInline
                screenshotFormat="image/png"
                screenshotQuality={1}
                forceScreenshotSourceSize
                videoConstraints={videoConstraints}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
              />
            )}
          </div>
        </section>
        <div className="button-row">
          {!capturedPhoto ? (
            <button
              type="button"
              className="button button--primary"
              onClick={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? "Capturando..." : "Capturar foto"}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="button button--primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar registro"}
              </button>

              <button type="button" className="button button--secondary" onClick={handleRetake}>
                Refazer
              </button>
            </>
          )}

          <button type="button" className="button button--secondary" onClick={onAbrirRegistros}>
            Ver registros
          </button>
        </div>
      </section>

      
    </div>
  );
}
