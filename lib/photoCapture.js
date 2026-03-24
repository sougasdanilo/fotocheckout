async function waitForVideoFrame(videoElement) {
  if (videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
    return;
  }

  await new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("A camera ainda nao estava pronta para capturar a imagem."));
    }, 3000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      videoElement.removeEventListener("loadeddata", handleLoadedData);
      videoElement.removeEventListener("error", handleVideoError);
    }

    function handleLoadedData() {
      cleanup();
      resolve();
    }

    function handleVideoError() {
      cleanup();
      reject(new Error("Nao foi possivel preparar o frame da camera."));
    }

    videoElement.addEventListener("loadeddata", handleLoadedData);
    videoElement.addEventListener("error", handleVideoError);
  });
}

async function captureWithImageCapture(track) {
  const ImageCaptureConstructor = typeof window !== "undefined" ? window.ImageCapture : undefined;
  if (!ImageCaptureConstructor || !track) {
    return null;
  }

  try {
    const imageCapture = new ImageCaptureConstructor(track);
    const photoSettings = {};
    const trackSettings = track.getSettings?.() || {};

    if (typeof imageCapture.getPhotoCapabilities === "function") {
      const capabilities = await imageCapture.getPhotoCapabilities();

      if (capabilities.imageWidth?.max) {
        photoSettings.imageWidth = capabilities.imageWidth.max;
      }

      if (capabilities.imageHeight?.max) {
        photoSettings.imageHeight = capabilities.imageHeight.max;
      }
    }

    const blob = await imageCapture.takePhoto(
      Object.keys(photoSettings).length > 0 ? photoSettings : undefined,
    );

    if (!blob) {
      return null;
    }

    return {
      blob,
      width: photoSettings.imageWidth || trackSettings.width || 0,
      height: photoSettings.imageHeight || trackSettings.height || 0,
    };
  } catch {
    return null;
  }
}

async function captureFromVideo(videoElement) {
  const width = videoElement.videoWidth || 1920;
  const height = videoElement.videoHeight || 1080;
  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Nao foi possivel preparar a imagem para upload.");
  }

  context.drawImage(videoElement, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (generatedBlob) => {
        if (!generatedBlob) {
          reject(new Error("A captura retornou vazia."));
          return;
        }

        resolve(generatedBlob);
      },
      "image/png",
    );
  });

  return {
    blob,
    width,
    height,
  };
}

export async function captureHighQualityPhoto(webcamRef) {
  const videoElement = webcamRef.current?.video;
  if (!videoElement) {
    throw new Error("A camera nao foi inicializada.");
  }

  await waitForVideoFrame(videoElement);

  const stream = videoElement.srcObject;
  const track = stream?.getVideoTracks?.()[0];
  const photoFromTrack = await captureWithImageCapture(track);

  if (photoFromTrack) {
    return photoFromTrack;
  }

  return captureFromVideo(videoElement);
}
