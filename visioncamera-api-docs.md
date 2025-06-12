# VisionCamera Web API Dokumentace

## 📱 Přehled

VisionCamera Web poskytuje kompletní JavaScript API pro práci s kamerou, frame processing a AI funkcemi v webových aplikacích. API je navrženo s důrazem na kompatibilitu s mobilními zařízeními a optimalizace pro iOS Safari a Android Chrome.

## 🚀 Rychlý Start

```javascript
// Inicializace VisionCamera
const camera = new VisionCameraApp();

// Přístup k funkcím
await camera.initializeCamera();
await camera.capturePhoto();
await camera.startRecording();
```

## 📸 Camera API

### Základní Camera Access

```javascript
// Získání přístupu ke kameře
async initializeCamera(constraints = {}) {
    const defaultConstraints = {
        video: {
            facingMode: this.currentCamera, // 'user' | 'environment'
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };
    
    try {
        this.currentStream = await navigator.mediaDevices.getUserMedia({
            ...defaultConstraints,
            ...constraints
        });
        return this.currentStream;
    } catch (error) {
        throw new Error(`Camera access failed: ${error.message}`);
    }
}
```

### Camera Switching

```javascript
// Přepínání mezi přední a zadní kamerou
async switchCamera() {
    this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
    
    if (this.currentStream) {
        this.stopStream();
    }
    
    await this.initializeCamera();
    this.showToast(`Přepnuto na ${this.currentCamera === 'user' ? 'přední' : 'zadní'} kameru`);
}
```

### Photo Capture

```javascript
async capturePhoto() {
    const canvas = document.getElementById('captureCanvas');
    const video = document.getElementById('cameraPreview');
    const context = canvas.getContext('2d');
    
    // Nastavení rozlišení Canvas podle videa
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Zachycení frame z videa
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Konverze na Blob s high quality
    return new Promise(resolve => {
        canvas.toBlob(blob => {
            const photo = {
                blob,
                dataUrl: URL.createObjectURL(blob),
                timestamp: Date.now(),
                metadata: this.extractMetadata()
            };
            resolve(photo);
        }, 'image/jpeg', 0.92);
    });
}
```

### Video Recording

```javascript
async startRecording() {
    if (!this.currentStream) {
        throw new Error('Camera stream not available');
    }
    
    const options = {
        mimeType: this.getSupportedMimeType(),
        videoBitsPerSecond: 8000000 // 8 Mbps
    };
    
    this.mediaRecorder = new MediaRecorder(this.currentStream, options);
    this.recordedChunks = [];
    
    this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
        }
    };
    
    this.mediaRecorder.onstop = () => {
        this.processRecordedVideo();
    };
    
    this.mediaRecorder.start(100); // Chunk každých 100ms
    this.isRecording = true;
}
```

## 🔍 Camera Controls

### Zoom Control

```javascript
async setZoom(zoomLevel) {
    const track = this.currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (capabilities.zoom) {
        const clampedZoom = Math.max(
            capabilities.zoom.min,
            Math.min(capabilities.zoom.max, zoomLevel)
        );
        
        await track.applyConstraints({
            advanced: [{ zoom: clampedZoom }]
        });
        
        this.currentZoom = clampedZoom;
        return clampedZoom;
    }
    
    throw new Error('Zoom not supported on this device');
}
```

### Flash/Torch Control

```javascript
async toggleTorch() {
    const track = this.currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    // iOS 17.4+ a Android podpora
    if (capabilities.torch) {
        const currentTorch = track.getSettings().torch;
        
        await track.applyConstraints({
            advanced: [{ torch: !currentTorch }]
        });
        
        return !currentTorch;
    }
    
    // Fallback pro starší zařízení
    throw new Error('Torch not supported');
}
```

## 🧠 Frame Processors

### QR/Barcode Scanning

```javascript
startQRScanning() {
    if (this.qrWorker) {
        this.qrWorker.terminate();
    }
    
    this.qrWorker = new Worker('/workers/qr-scanner.js');
    
    this.qrWorker.onmessage = (event) => {
        const { result, error } = event.data;
        
        if (result) {
            this.showToast(`QR kod: ${result.text}`);
            this.drawQROverlay(result.location);
        }
    };
    
    // Spuštění pravidelného skenování
    this.qrScanInterval = setInterval(() => {
        this.captureFrameForProcessing('qr');
    }, 100);
}
```

### Face Detection

```javascript
detectFaces() {
    const canvas = document.getElementById('processingCanvas');
    const video = document.getElementById('cameraPreview');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Simulace face detection (v produkci by se použil ML model)
    const faces = this.mockFaceDetection(canvas);
    
    faces.forEach(face => {
        this.drawFaceBox(face);
    });
    
    return faces;
}
```

### AI Object Detection

```javascript
async analyzeWithAI(imageData) {
    try {
        // Simulace Gemini API volání
        const analysisResult = await this.callGeminiAPI({
            image: imageData,
            prompt: "Analyze this image and describe the objects you see"
        });
        
        return {
            objects: analysisResult.objects || [],
            description: analysisResult.description || "",
            confidence: analysisResult.confidence || 0.8
        };
    } catch (error) {
        console.error('AI analysis failed:', error);
        return this.fallbackAnalysis(imageData);
    }
}
```

## 🎯 Touch Gestures

### Pinch to Zoom

```javascript
setupPinchZoom() {
    let initialDistance = 0;
    let initialZoom = this.currentZoom;
    
    this.elements.cameraPreview.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialDistance = this.getTouchDistance(e.touches);
            initialZoom = this.currentZoom;
        }
    });
    
    this.elements.cameraPreview.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            
            const currentDistance = this.getTouchDistance(e.touches);
            const scale = currentDistance / initialDistance;
            const newZoom = Math.max(1, Math.min(8, initialZoom * scale));
            
            this.setZoom(newZoom);
        }
    });
}
```

### Tap to Focus

```javascript
setupTapToFocus() {
    this.elements.cameraPreview.addEventListener('touchend', async (e) => {
        if (e.touches.length === 0 && e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            const rect = this.elements.cameraPreview.getBoundingClientRect();
            
            const x = (touch.clientX - rect.left) / rect.width;
            const y = (touch.clientY - rect.top) / rect.height;
            
            await this.focusAt(x, y);
            this.showFocusIndicator(x, y);
        }
    });
}
```

## 📱 Platform Optimizations

### iOS Safari Specifické

```javascript
optimizeForIOS() {
    // User gesture requirement workaround
    this.setupUserGestureHandling();
    
    // WebKit-specific optimizations
    if (this.device.isSafari) {
        // Disable pinch zoom on video element
        this.elements.cameraPreview.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        // Handle WebKit memory limitations
        this.setupMemoryManagement();
    }
}
```

### Android Chrome Optimizations

```javascript
optimizeForAndroid() {
    if (this.device.isChrome) {
        // Enable hardware acceleration
        this.elements.cameraPreview.style.willChange = 'transform';
        
        // Use optimal codec settings
        this.settings.format = 'webm';
        this.settings.codec = 'vp9';
        
        // Battery optimization
        this.setupBatteryOptimization();
    }
}
```

## 🔧 PWA Features

### Service Worker Setup

```javascript
async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                this.showUpdatePrompt();
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}
```

### Install Prompt

```javascript
showPWAPrompt() {
    if (this.device.isMobile && !this.isStandalone()) {
        setTimeout(() => {
            this.showToast(
                this.device.isIOS 
                    ? 'Přidejte do domovské obrazovky pro lepší zážitek'
                    : 'Nainstalujte aplikaci pro offline přístup',
                'info',
                8000
            );
        }, 3000);
    }
}
```

## 📊 Performance Monitoring

```javascript
startPerformanceMonitoring() {
    setInterval(() => {
        const now = performance.now();
        this.performanceMonitor.frameCount++;
        
        if (now - this.performanceMonitor.lastFrameTime >= 1000) {
            this.performanceMonitor.fps = this.performanceMonitor.frameCount;
            this.performanceMonitor.frameCount = 0;
            this.performanceMonitor.lastFrameTime = now;
            
            this.updateFPSDisplay();
            this.checkPerformanceThresholds();
        }
    }, 16); // ~60 FPS monitoring
}
```

## 🛡️ Error Handling

```javascript
handleCameraError(error) {
    const errorMessages = {
        'NotAllowedError': 'Přístup ke kameře byl odepřen',
        'NotFoundError': 'Kamera nebyla nalezena',
        'NotReadableError': 'Kamera je používána jinou aplikací',
        'OverconstrainedError': 'Požadované nastavení kamery není podporováno',
        'SecurityError': 'HTTPS je vyžadováno pro přístup ke kameře',
        'AbortError': 'Přístup ke kameře byl přerušen'
    };
    
    const message = errorMessages[error.name] || `Chyba kamery: ${error.message}`;
    this.showToast(message, 'error');
    
    // Fallback na demo mode
    if (error.name === 'NotAllowedError') {
        this.setupDemoMode();
    }
}
```

## 📋 API Reference

### Hlavní třída VisionCameraApp

| Metoda | Popis | Parametry | Návratová hodnota |
|--------|-------|-----------|-------------------|
| `initializeCamera()` | Inicializuje přístup ke kameře | `constraints?` | `Promise<MediaStream>` |
| `capturePhoto()` | Zachytí fotografii | - | `Promise<Photo>` |
| `startRecording()` | Spustí nahrávání videa | - | `Promise<void>` |
| `stopRecording()` | Zastaví nahrávání | - | `Promise<Video>` |
| `switchCamera()` | Přepne kameru | - | `Promise<void>` |
| `setZoom(level)` | Nastaví zoom | `number` | `Promise<number>` |
| `toggleTorch()` | Přepne blesk | - | `Promise<boolean>` |

### Events

```javascript
// Poslechněte si události aplikace
camera.addEventListener('photoTaken', (event) => {
    console.log('Photo captured:', event.detail);
});

camera.addEventListener('recordingStarted', () => {
    console.log('Recording started');
});

camera.addEventListener('error', (event) => {
    console.error('Camera error:', event.detail);
});
```

## 🔗 Závěr

VisionCamera Web API poskytuje kompletní řešení pro práci s kamerou v webových aplikacích s důrazem na mobilní optimalizace a cross-platform kompatibilitu. API je navrženo s ohledem na nejlepší praktiky a poskytuje fallback řešení pro omezenou funkcionalitou na různých platformách.

---

*Dokumentace je živý dokument a bude aktualizován s novými funkcemi a vylepšeními.*