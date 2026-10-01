(() => {
  const defaults = {
    buildUrl: 'unity/Build',
    buildName: 'TwinVillage',
    companyName: 'IDTC',
    productName: 'Twini Twin City',
    productVersion: '1.0',
    bridgeObject: 'TwiniWebBridge',
    bridgeMethod: 'OnWebMessage',
    streamingAssetsUrl: 'unity/StreamingAssets'
  };
  const config = { ...defaults, ...(window.TWINI_UNITY_CONFIG || {}) };
  let unityInstance = null;
  let loadPromise = null;
  let originalFrameParent = null;
  let originalFrameNextSibling = null;

  const getElement = (id) => document.getElementById(id);

  function setStatus(message, tone = 'info') {
    const status = getElement('unityWebGLStatus');
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function showBuildInstructions() {
    setStatus(`Build Unity WebGL belum ditemukan. Letakkan hasil build di ${config.buildUrl}/ dengan nama ${config.buildName}, lalu muat ulang halaman.`, 'missing');
    const progress = getElement('unityWebGLLoading');
    if (progress) progress.hidden = true;
  }

  function buildAsset(fileName) {
    return `${config.buildUrl.replace(/\/$/, '')}/${config.buildName}.${fileName}`;
  }

  function place(target) {
    const frame = getElement('unityWebGLFrame');
    if (!frame) return false;
    if (!originalFrameParent) {
      originalFrameParent = frame.parentNode;
      originalFrameNextSibling = frame.nextSibling;
    }

    if (target === 'home') {
      const homeSlot = getElement('homeUnitySlot');
      if (!homeSlot) return false;
      homeSlot.appendChild(frame);
      frame.classList.add('unity-home-preview');
      return true;
    }

    if (originalFrameParent) originalFrameParent.insertBefore(frame, originalFrameNextSibling);
    frame.classList.remove('unity-home-preview');
    return true;
  }

  function loadLoaderScript(loaderUrl) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-unity-loader="${loaderUrl}"]`);
      if (existing) {
        if (window.createUnityInstance) resolve();
        else existing.addEventListener('load', resolve, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = loaderUrl;
      script.dataset.unityLoader = loaderUrl;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unity loader gagal dimuat.'));
      document.body.appendChild(script);
    });
  }

  async function mount() {
    const frame = getElement('unityWebGLFrame');
    const canvas = getElement('unityWebGLCanvas');
    if (!frame || !canvas) return false;
    if (unityInstance) return true;
    if (loadPromise) return loadPromise;

    loadPromise = (async () => {
      const loaderUrl = config.loaderUrl || buildAsset('loader.js');
      setStatus('Memeriksa build Unity WebGL…');
      try {
        const response = await fetch(loaderUrl, { method: 'HEAD', cache: 'no-store' });
        if (!response.ok) {
          showBuildInstructions();
          return false;
        }
        await loadLoaderScript(loaderUrl);
        if (typeof window.createUnityInstance !== 'function') {
          throw new Error('Unity loader tidak menyediakan createUnityInstance.');
        }

        const progress = getElement('unityWebGLLoading');
        if (progress) progress.hidden = false;
        setStatus('Memuat dunia Twin City…');
        const unityConfig = {
          dataUrl: config.dataUrl || buildAsset('data'),
          frameworkUrl: config.frameworkUrl || buildAsset('framework.js'),
          codeUrl: config.codeUrl || buildAsset('wasm'),
          streamingAssetsUrl: config.streamingAssetsUrl,
          companyName: config.companyName,
          productName: config.productName,
          productVersion: config.productVersion
        };
        unityInstance = await window.createUnityInstance(canvas, unityConfig, (value) => {
          if (progress) progress.value = Math.round(value * 100);
          setStatus(`Memuat dunia Twin City… ${Math.round(value * 100)}%`);
        });
        frame.classList.add('unity-ready');
        if (progress) progress.hidden = true;
        setStatus('Unity terhubung. Data Twin Village siap dikirim.', 'ready');
        window.dispatchEvent(new CustomEvent('twini-unity-ready'));
        return true;
      } catch (error) {
        setStatus(error.message || 'Unity WebGL gagal dimuat.', 'error');
        return false;
      } finally {
        loadPromise = null;
      }
    })();
    return loadPromise;
  }

  function send(type, payload = {}) {
    if (!unityInstance) return false;
    unityInstance.SendMessage(
      config.bridgeObject,
      config.bridgeMethod,
      JSON.stringify({ type, payload })
    );
    return true;
  }

  function receive(type, payload = {}) {
    window.dispatchEvent(new CustomEvent('twini-unity-message', { detail: { type, payload } }));
  }

  window.TwiniUnityBridge = { mount, place, send, receive, get ready() { return Boolean(unityInstance); } };
  window.TwiniUnityReceive = receive;
})();
