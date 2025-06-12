class VisionCameraApp {
    constructor() {
        this.currentStream = null;
        this.currentCamera = 'user';
        this.currentZoom = 1;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.currentMode = 'photo';
        this.frameProcessors = {
            qrScanning: false,
            faceDetection: false,
            objectDetection: false,
            textRecognition: false
        };
        this.gallery = [];
        this.settings = {
            quality: '1080p',
            format: 'webm',
            hapticFeedback: true,
            autoSave: true
        };
        this.device = this.detectDevice();
        this.capabilities = { zoom: { max: 8 }, torch: false };
        this.isDemo = false;
        this.analytics = [];
        
        // Quick initialization with fallback
        this.quickInit();
    }

    quickInit() {
        console.log('Quick initializing VisionCamera app...');
        
        // Setup basic functionality immediately
        this.setupEventListeners();
        this.loadSettings();
        
        // Start with demo mode, then try camera
        setTimeout(() => {
            this.hideLoadingScreen();
            this.setupDemoMode();
            this.showToast('Aplikace načtena v demo režimu', 'info');
        }, 1000);

        // Try to initialize camera in background
        this.tryInitializeCamera();
        
        this.startPerformanceMonitoring();
        this.setupServiceWorker();

        // --- Onboarding tooltips for new features ---
        this.showOnboardingTips();
    }

    async tryInitializeCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('Camera API not supported');
                return;
            }

            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            // Try to get camera with timeout
            const stream = await Promise.race([
                navigator.mediaDevices.getUserMedia(constraints),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Camera timeout')), 3000)
                )
            ]);

            this.currentStream = stream;
            const preview = document.getElementById('cameraPreview');
            preview.srcObject = stream;
            preview.style.background = 'none';
            preview.innerHTML = '';
            
            await this.detectCameraCapabilities();
            this.updateFlashButton();
            this.isDemo = false;
            
            this.showToast('Kamera úspěšně aktivována!', 'success');
            
        } catch (error) {
            console.log('Camera initialization failed, staying in demo mode:', error);
        }
    }

    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        return {
            isIOS: /iphone|ipad|ipod/.test(userAgent),
            isAndroid: /android/.test(userAgent),
            isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent),
            isChrome: /chrome/.test(userAgent),
            isMobile: /iphone|ipad|ipod|android/.test(userAgent),
            hasTouch: 'ontouchstart' in window
        };
    }

    setupEventListeners() {
        // Camera controls
        document.getElementById('captureBtn').addEventListener('click', () => this.handleCapture());
        document.getElementById('switchCameraBtn').addEventListener('click', () => this.switchCamera());
        document.getElementById('flashBtn').addEventListener('click', () => this.toggleFlash());
        
        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });
        
        // Zoom controls
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setZoom(parseFloat(e.target.dataset.zoom)));
        });
        
        // Frame processor controls
        document.getElementById('faceDetectionBtn').addEventListener('click', () => this.toggleFrameProcessor('faceDetection'));
        document.getElementById('objectDetectionBtn').addEventListener('click', () => this.toggleFrameProcessor('objectDetection'));
        document.getElementById('textRecognitionBtn').addEventListener('click', () => this.toggleFrameProcessor('textRecognition'));
        
        // Modal controls
        document.getElementById('galleryBtn').addEventListener('click', () => this.showGallery());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('closeGalleryBtn').addEventListener('click', () => this.hideModal('galleryModal'));
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideModal('settingsModal'));
        
        // Settings
        document.getElementById('qualitySelect').addEventListener('change', (e) => this.updateSetting('quality', e.target.value));
        document.getElementById('formatSelect').addEventListener('change', (e) => this.updateSetting('format', e.target.value));
        document.getElementById('hapticFeedback').addEventListener('change', (e) => this.updateSetting('hapticFeedback', e.target.checked));
        document.getElementById('autoSave').addEventListener('change', (e) => this.updateSetting('autoSave', e.target.checked));
        document.getElementById('googleApiKey').addEventListener('change', (e) => this.updateSetting('googleApiKey', e.target.value));
        document.getElementById('perplexityApiKey').addEventListener('change', (e) => this.updateSetting('perplexityApiKey', e.target.value));
        
        // PWA install
        const installBtn = document.getElementById('installPwaBtn');
        const dismissBtn = document.getElementById('dismissPwaBtn');
        if (installBtn) installBtn.addEventListener('click', () => this.installPWA());
        if (dismissBtn) dismissBtn.addEventListener('click', () => this.dismissPWA());
        
        // Touch gestures
        this.setupTouchGestures();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
        
        // Add chat button event
        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) chatBtn.addEventListener('click', () => this.showChatModal());
        
        // Add Google API test button event
        const googleApiBtn = document.getElementById('googleApiBtn');
        if (googleApiBtn) googleApiBtn.addEventListener('click', () => this.showGoogleApiModal());
    }

    setupDemoMode() {
        const preview = document.getElementById('cameraPreview');
        preview.style.background = 'linear-gradient(135deg, #2c3e50, #34495e, #4a6741)';
        preview.style.display = 'flex';
        preview.style.alignItems = 'center';
        preview.style.justifyContent = 'center';
        preview.innerHTML = `
            <div style="color: white; text-align: center; font-size: 18px; padding: 20px;">
                <div style="font-size: 24px; margin-bottom: 10px;">📷 VisionCamera Demo</div>
                <div style="font-size: 14px; opacity: 0.8;">Všechny funkce dostupné</div>
                <div style="font-size: 12px; margin-top: 10px; opacity: 0.6;">Klikněte na kameru pro povolení přístupu</div>
            </div>
        `;
        
        preview.addEventListener('click', () => this.tryInitializeCamera());
        
        this.isDemo = true;
        this.capabilities = { zoom: { max: 8 }, torch: true };
        this.updateFlashButton();
    }

    setupTouchGestures() {
        const preview = document.getElementById('cameraPreview');
        let startDistance = 0;
        let startZoom = 1;
        let lastTap = 0;

        preview.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                startDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                startZoom = this.currentZoom;
            }
        }, { passive: false });

        preview.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                const scale = currentDistance / startDistance;
                const newZoom = Math.max(1, Math.min(8, startZoom * scale));
                this.setZoom(newZoom);
            }
        }, { passive: false });

        preview.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0 && e.touches.length === 0) {
                this.switchCamera();
            }
            lastTap = currentTime;
        });

        preview.addEventListener('click', (e) => {
            if (!this.isDemo) {
                this.showFocusIndicator(e.clientX, e.clientY);
            }
        });
    }

    showFocusIndicator(x, y) {
        const indicator = document.createElement('div');
        indicator.style.cssText =
            'position: absolute;' +
            `left: ${x - 25}px;` +
            `top: ${y - 25}px;` +
            'width: 50px;' +
            'height: 50px;' +
            'border: 2px solid white;' +
            'border-radius: 50%;' +
            'pointer-events: none;' +
            'animation: focusPulse 0.6s ease-out;' +
            'z-index: 200;';
        document.body.appendChild(indicator);
        setTimeout(() => indicator.remove(), 600);
        if (!document.getElementById('focusStyle')) {
            const style = document.createElement('style');
            style.id = 'focusStyle';
            style.textContent = `@keyframes focusPulse {\n0% { transform: scale(1.5); opacity: 0; }\n50% { transform: scale(1); opacity: 1; }\n100% { transform: scale(0.8); opacity: 0; }\n}`;
            document.head.appendChild(style);
        }
    }

    async detectCameraCapabilities() {
        try {
            if (this.currentStream) {
                const track = this.currentStream.getVideoTracks()[0];
                this.capabilities = track.getCapabilities();
            }
        } catch (error) {
            console.error('Error detecting camera capabilities:', error);
            this.capabilities = { zoom: { max: 8 }, torch: false };
        }
    }

    async setZoom(zoom) {
        this.currentZoom = Math.max(1, Math.min(8, zoom));
        
        try {
            if (this.currentStream && !this.isDemo) {
                const track = this.currentStream.getVideoTracks()[0];
                if (this.capabilities.zoom) {
                    await track.applyConstraints({
                        advanced: [{ zoom: this.currentZoom }]
                    });
                }
            }
        } catch (error) {
            console.error('Zoom error:', error);
        }
        
        // Update UI regardless of camera availability
        document.getElementById('zoomIndicator').textContent = `${this.currentZoom.toFixed(1)}x`;
        
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.zoom) === this.currentZoom);
        });
        
        this.hapticFeedback();
        this.showToast(`Zoom: ${this.currentZoom.toFixed(1)}x`);
    }

    async switchCamera() {
        this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
        
        if (this.isDemo) {
            this.showToast(`Přepnuto na ${this.currentCamera === 'user' ? 'přední' : 'zadní'} kameru (demo)`);
            this.hapticFeedback();
            return;
        }

        try {
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
            }
            
            await this.tryInitializeCamera();
            this.hapticFeedback();
            this.showToast(`Přepnuto na ${this.currentCamera === 'user' ? 'přední' : 'zadní'} kameru`);
            
        } catch (error) {
            console.error('Camera switch error:', error);
            this.showToast('Nepodařilo se přepnout kameru (demo režim)', 'warning');
            this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
        }
    }

    async toggleFlash() {
        const flashBtn = document.getElementById('flashBtn');
        
        if (!this.capabilities.torch && !this.isDemo) {
            this.showToast('Flash není podporován na tomto zařízení', 'warning');
            return;
        }
        
        const currentState = flashBtn.classList.contains('on') ? 'on' : 'off';
        const newState = currentState === 'off' ? 'on' : 'off';
        
        try {
            if (this.currentStream && !this.isDemo) {
                const track = this.currentStream.getVideoTracks()[0];
                await track.applyConstraints({
                    advanced: [{ torch: newState === 'on' }]
                });
            }
        } catch (error) {
            console.error('Flash toggle error:', error);
        }
        
        // Update UI regardless
        flashBtn.classList.remove('on', 'off', 'auto');
        flashBtn.classList.add(newState);
        
        this.hapticFeedback();
        this.showToast(`Flash ${newState === 'on' ? 'zapnut' : 'vypnut'}${this.isDemo ? ' (demo)' : ''}`);
    }

    updateFlashButton() {
        const flashBtn = document.getElementById('flashBtn');
        if (this.capabilities.torch || this.isDemo) {
            flashBtn.style.display = 'flex';
            flashBtn.classList.add('off');
        } else {
            flashBtn.style.display = 'none';
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.trackEvent('switchMode', { mode });
        
        // Update active mode button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Reset all overlays and processors
        document.getElementById('qrOverlay').classList.add('hidden');
        document.getElementById('faceOverlay').classList.add('hidden');
        document.getElementById('recordingIndicator').classList.add('hidden');
        document.getElementById('captureBtn').classList.remove('recording');
        
        Object.keys(this.frameProcessors).forEach(processor => {
            this.frameProcessors[processor] = false;
            const btn = document.getElementById(`${processor}Btn`);
            if (btn) btn.classList.remove('active');
        });
        
        if (this.qrScanningInterval) {
            clearInterval(this.qrScanningInterval);
            this.qrScanningInterval = null;
        }
        
        switch (mode) {
            case 'photo':
                this.showToast('Foto režim aktivní');
                break;
            case 'video':
                this.showToast('Video režim aktivní');
                break;
            case 'scanner':
                document.getElementById('qrOverlay').classList.remove('hidden');
                this.frameProcessors.qrScanning = true;
                this.startQRScanning();
                this.showToast('QR scanner aktivní');
                break;
        }
        
        this.hapticFeedback();
    }

    async handleCapture() {
        switch (this.currentMode) {
            case 'photo':
                await this.capturePhoto();
                break;
            case 'video':
                await this.toggleVideoRecording();
                break;
            case 'scanner':
                this.showToast('QR scanner běží automaticky');
                break;
        }
    }

    async capturePhoto() {
        try {
            const canvas = document.getElementById('captureCanvas');
            const ctx = canvas.getContext('2d');
            const width = 1280;
            const height = 720;
            
            canvas.width = width;
            canvas.height = height;
            
            if (this.isDemo) {
                // Create demo photo
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#2c3e50');
                gradient.addColorStop(0.5, '#34495e');
                gradient.addColorStop(1, '#4a6741');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // Add demo elements
                ctx.fillStyle = 'white';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('📷 DEMO FOTO', width/2, height/2 - 50);
                
                ctx.font = '24px Arial';
                ctx.fillText(`${this.currentCamera === 'user' ? 'Přední' : 'Zadní'} kamera`, width/2, height/2);
                ctx.fillText(`Zoom: ${this.currentZoom}x`, width/2, height/2 + 40);
                ctx.fillText(new Date().toLocaleString('cs-CZ'), width/2, height/2 + 80);
                
            } else {
                const preview = document.getElementById('cameraPreview');
                ctx.drawImage(preview, 0, 0, width, height);
            }
            
            const dataURL = canvas.toDataURL('image/jpeg', 0.9);
            const photo = {
                id: Date.now(),
                type: 'photo',
                data: dataURL,
                timestamp: new Date().toISOString(),
                metadata: {
                    camera: this.currentCamera,
                    zoom: this.currentZoom,
                    resolution: `${width}x${height}`,
                    demo: this.isDemo
                }
            };
            
            this.gallery.push(photo);
            this.saveGallery();
            this.trackEvent('capturePhoto', { camera: this.currentCamera, zoom: this.currentZoom });
            
            this.showCaptureFlash();
            this.hapticFeedback();
            this.showToast('Fotka pořízena!', 'success');
            
        } catch (error) {
            console.error('Photo capture error:', error);
            this.showToast('Nepodařilo se pořídit fotku', 'error');
        }
    }

    async toggleVideoRecording() {
        if (this.isRecording) {
            await this.stopVideoRecording();
        } else {
            await this.startVideoRecording();
        }
    }

    async startVideoRecording() {
        this.isRecording = true;
        
        // Update UI immediately
        document.getElementById('captureBtn').classList.add('recording');
        document.getElementById('recordingIndicator').classList.remove('hidden');
        this.startRecordingTimer();
        
        this.hapticFeedback();
        this.showToast(`Nahrávání spuštěno${this.isDemo ? ' (demo)' : ''}`, 'success');
        
        if (this.isDemo) return; // Skip actual recording in demo mode
        
        try {
            if (!this.currentStream) {
                throw new Error('No camera stream available');
            }
            
            const options = { mimeType: this.getPreferredMimeType() };
            this.mediaRecorder = new MediaRecorder(this.currentStream, options);
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => this.saveVideoRecording();
            this.mediaRecorder.start();
            this.trackEvent('startVideoRecording', { camera: this.currentCamera, zoom: this.currentZoom });
            
        } catch (error) {
            console.error('Video recording start error:', error);
            this.showToast('Demo režim - nahrávání simulováno', 'info');
        }
    }

    async stopVideoRecording() {
        this.isRecording = false;
        
        // Update UI
        document.getElementById('captureBtn').classList.remove('recording');
        document.getElementById('recordingIndicator').classList.add('hidden');
        this.stopRecordingTimer();
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        this.hapticFeedback();
        this.showToast(`Nahrávání ukončeno${this.isDemo ? ' (demo)' : ''}`, 'success');
        
        if (this.isDemo) {
            // Create demo video entry
            const video = {
                id: Date.now(),
                type: 'video',
                data: 'demo-video',
                timestamp: new Date().toISOString(),
                metadata: {
                    camera: this.currentCamera,
                    zoom: this.currentZoom,
                    duration: this.recordingDuration,
                    demo: true
                }
            };
            this.gallery.push(video);
            this.saveGallery();
        } else {
            this.trackEvent('stopVideoRecording', { camera: this.currentCamera, zoom: this.currentZoom });
        }
    }

    saveVideoRecording() {
        if (this.recordedChunks.length === 0) return;
        
        const blob = new Blob(this.recordedChunks, {
            type: this.getPreferredMimeType()
        });
        
        const video = {
            id: Date.now(),
            type: 'video',
            data: URL.createObjectURL(blob),
            blob: blob,
            timestamp: new Date().toISOString(),
            metadata: {
                camera: this.currentCamera,
                zoom: this.currentZoom,
                duration: this.recordingDuration,
                format: this.settings.format
            }
        };
        
        this.gallery.push(video);
        this.saveGallery();
        this.showToast('Video uloženo do galerie', 'success');
    }

    getPreferredMimeType() {
        const formats = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
        
        for (const format of formats) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(format)) {
                return format;
            }
        }
        
        return 'video/webm';
    }

    startRecordingTimer() {
        this.recordingStartTime = Date.now();
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            document.getElementById('recordingTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        this.recordingDuration = Date.now() - this.recordingStartTime;
    }

    showCaptureFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: white; z-index: 9998; opacity: 0.8; pointer-events: none;
        `;
        
        document.body.appendChild(flash);
        setTimeout(() => {
            flash.style.opacity = '0';
            flash.style.transition = 'opacity 0.1s';
            setTimeout(() => flash.remove(), 100);
        }, 50);
    }

    toggleFrameProcessor(processor) {
        this.frameProcessors[processor] = !this.frameProcessors[processor];
        
        const btn = document.getElementById(`${processor}Btn`);
        btn.classList.toggle('active', this.frameProcessors[processor]);
        
        const processorNames = {
            faceDetection: 'Detekce obličeje',
            objectDetection: 'Rozpoznání objektů',
            textRecognition: 'Rozpoznání textu'
        };
        
        const status = this.frameProcessors[processor] ? 'aktivováno' : 'deaktivováno';
        this.showToast(`${processorNames[processor]} ${status}`, 
                     this.frameProcessors[processor] ? 'success' : 'info');
        
        switch (processor) {
            case 'faceDetection':
                if (this.frameProcessors[processor]) {
                    this.performFaceDetection();
                }
                this.toggleFaceDetection();
                break;
            case 'objectDetection':
                if (this.frameProcessors[processor]) {
                    this.performObjectDetection();
                }
                break;
            case 'textRecognition':
                if (this.frameProcessors[processor]) {
                    this.performTextRecognition();
                }
                break;
        }
        
        this.hapticFeedback();
    }

    // --- Google Vision API Utility ---
    async callGoogleVision(type, imageBase64) {
        const apiKey = this.settings.googleApiKey || 'AIzaSyC4a1d_9cR5Oj3OfdDEzrAsOtDWwNVpVIc';
        const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        const body = {
            requests: [{
                image: { content: imageBase64 },
                features: [{ type, maxResults: 10 }]
            }]
        };
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                let msg = 'Chyba připojení k Google API';
                try { const err = await res.json(); msg = err.error?.message || msg; } catch {}
                throw new Error(msg);
            }
            return await res.json();
        } catch (e) {
            this.showToast('Chyba Google Vision API: ' + (e.message || e), 'error');
            throw e;
        }
    }

    // --- Generic Google API Call Utility ---
    async callGoogleApi(apiName, params = {}, method = 'GET', body = null) {
        const apiKey = this.settings.googleApiKey || 'AIzaSyC4a1d_9cR5Oj3OfdDEzrAsOtDWwNVpVIc';
        let url = `https://www.googleapis.com/${apiName}?key=${apiKey}`;
        if (method === 'GET' && Object.keys(params).length > 0) {
            const query = new URLSearchParams(params).toString();
            url += `&${query}`;
        }
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: method !== 'GET' && body ? JSON.stringify(body) : undefined
        });
        return await res.json();
    }

    // --- Real-Time Face Detection ---
    async performObjectDetection() {
        this.showProcessingStatus('Analyzuji objekty...');
        try {
            const imageBase64 = await this.captureCurrentFrameBase64();
            const result = await this.callGoogleVision('OBJECT_LOCALIZATION', imageBase64);
            this.hideProcessingStatus();
            const objects = result.responses?.[0]?.localizedObjectAnnotations || [];
            if (objects.length > 0) {
                const names = objects.map(o => o.name).join(', ');
                this.showToast(`Detekovány objekty: ${names}`, 'success');
            } else {
                this.showToast('Žádné objekty nenalezeny', 'info');
            }
        } catch (e) {
            this.hideProcessingStatus();
            this.showToast('Chyba při detekci objektů', 'error');
        }
    }

    async performTextRecognition() {
        this.showProcessingStatus('Rozpoznávám text...');
        try {
            const imageBase64 = await this.captureCurrentFrameBase64();
            const result = await this.callGoogleVision('TEXT_DETECTION', imageBase64);
            this.hideProcessingStatus();
            const text = result.responses?.[0]?.fullTextAnnotation?.text || '';
            if (text) {
                this.showToast(`Text: "${text}"`, 'success');
            } else {
                this.showToast('Žádný text nenalezen', 'info');
            }
        } catch (e) {
            this.hideProcessingStatus();
            this.showToast('Chyba při rozpoznání textu', 'error');
        }
    }

    async performFaceDetection() {
        this.showProcessingStatus('Detekuji obličeje...');
        try {
            const imageBase64 = await this.captureCurrentFrameBase64();
            const result = await this.callGoogleVision('FACE_DETECTION', imageBase64);
            this.hideProcessingStatus();
            const faces = result.responses?.[0]?.faceAnnotations || [];
            if (faces.length > 0) {
                this.showToast(`Detekováno obličejů: ${faces.length}`, 'success');
            } else {
                this.showToast('Žádné obličeje nenalezeny', 'info');
            }
        } catch (e) {
            this.hideProcessingStatus();
            this.showToast('Chyba při detekci obličejů', 'error');
        }
    }

    async captureCurrentFrameBase64() {
        // Capture current video frame as base64
        const preview = document.getElementById('cameraPreview');
        const canvas = document.createElement('canvas');
        canvas.width = preview.videoWidth || 1280;
        canvas.height = preview.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9).replace(/^data:image\/jpeg;base64,/, '');
    }

    // Add Google API key to settings UI (optional, for user override)
    showSettings() {
        document.getElementById('qualitySelect').value = this.settings.quality;
        document.getElementById('formatSelect').value = this.settings.format;
        document.getElementById('hapticFeedback').checked = this.settings.hapticFeedback;
        document.getElementById('autoSave').checked = this.settings.autoSave;
        document.getElementById('googleApiKey').value = this.settings.googleApiKey || '';
        document.getElementById('perplexityApiKey').value = this.settings.perplexityApiKey || '';
        
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.showToast('Nastavení uloženo');
    }

    startPerformanceMonitoring() {
        this.performanceMonitor = {
            fps: 0,
            frameCount: 0,
            lastFrameTime: performance.now()
        };
        
        const updateFPS = () => {
            this.performanceMonitor.frameCount++;
            const now = performance.now();
            const elapsed = now - this.performanceMonitor.lastFrameTime;
            
            if (elapsed >= 1000) {
                this.performanceMonitor.fps = Math.round(
                    (this.performanceMonitor.frameCount * 1000) / elapsed
                );
                document.getElementById('fpsCounter').textContent = `FPS: ${this.performanceMonitor.fps}`;
                
                this.performanceMonitor.frameCount = 0;
                this.performanceMonitor.lastFrameTime = now;
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        requestAnimationFrame(updateFPS);
    }

    handleKeyboard(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.handleCapture();
                break;
            case 'KeyC':
                event.preventDefault();
                this.switchCamera();
                break;
            case 'KeyF':
                event.preventDefault();
                this.toggleFlash();
                break;
            case 'KeyG':
                event.preventDefault();
                this.showGallery();
                break;
            case 'Escape':
                event.preventDefault();
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                });
                break;
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    hapticFeedback() {
        if (this.settings.hapticFeedback && 'vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    showPWAPrompt() {
        if (this.device.isIOS && !window.navigator.standalone) {
            const prompt = document.getElementById('pwaInstallPrompt');
            if (prompt) {
                setTimeout(() => prompt.classList.remove('hidden'), 5000);
            }
        }
    }

    installPWA() {
        if (this.device.isIOS) {
            this.showToast('Pro instalaci: Sdílet > Přidat na plochu', 'info');
        }
        this.dismissPWA();
    }

    dismissPWA() {
        const prompt = document.getElementById('pwaInstallPrompt');
        if (prompt) prompt.classList.add('hidden');
    }

    setupServiceWorker() {
        // Service worker would be implemented for production
        console.log('Service Worker functionality available for production');
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('visionCameraSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('visionCameraSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    saveGallery() {
        try {
            const galleryMeta = this.gallery.map(item => ({
                id: item.id,
                type: item.type,
                timestamp: item.timestamp,
                metadata: item.metadata
            }));
            localStorage.setItem('visionCameraGallery', JSON.stringify(galleryMeta));
        } catch (error) {
            console.error('Error saving gallery:', error);
        }
    }

    // --- Analytics Tracking ---
    trackEvent(event, data = {}) {
        const entry = {
            event,
            timestamp: new Date().toISOString(),
            ...data
        };
        this.analytics.push(entry);
        try {
            localStorage.setItem('visionCameraAnalytics', JSON.stringify(this.analytics));
        } catch (e) {}
    }

    // --- Perplexity AI Chat Integration ---
    async callPerplexity(prompt) {
        const apiKey = this.settings.perplexityApiKey || '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';
        const url = 'https://api.perplexity.ai/v1/chat/completions';
        const body = {
            model: 'pplx-70b-online',
            messages: [{ role: 'user', content: prompt, language: 'cs' }]
        };
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                let msg = 'Chyba připojení k Perplexity API';
                try { const err = await res.json(); msg = err.error?.message || msg; } catch {}
                throw new Error(msg);
            }
            const data = await res.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (e) {
            this.showToast('Chyba Perplexity API: ' + (e.message || e), 'error');
            return 'Došlo k chybě při komunikaci s AI.';
        }
    }

    showChatModal() {
        let modal = document.getElementById('chatModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chatModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:500px">
                    <h3>AI Chat (Perplexity, česky) <span title="Zeptejte se AI na cokoliv v češtině!" style="cursor:help;">❓</span></h3>
                    <div id="chatHistory" style="height:200px;overflow-y:auto;background:#f6f6f6;padding:8px;margin-bottom:8px;"></div>
                    <input id="chatInput" type="text" placeholder="Zeptejte se na cokoliv..." style="width:80%">
                    <button id="chatSendBtn">Odeslat</button>
                    <button id="closeChatBtn" style="float:right">Zavřít</button>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeChatBtn').onclick = () => modal.classList.add('hidden');
            document.getElementById('chatSendBtn').onclick = () => this.sendChatMessage();
            document.getElementById('chatInput').onkeydown = (e) => { if (e.key === 'Enter') this.sendChatMessage(); };
        }
        document.getElementById('chatHistory').innerHTML = '';
        modal.classList.remove('hidden');
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const history = document.getElementById('chatHistory');
        const userMsg = input.value.trim();
        if (!userMsg) return;
        history.innerHTML += `<div><b>Vy:</b> ${userMsg}</div>`;
        input.value = '';
        history.scrollTop = history.scrollHeight;
        history.innerHTML += `<div><i>AI přemýšlí...</i></div>`;
        history.scrollTop = history.scrollHeight;
        let aiMsg = '';
        try {
            aiMsg = await this.callPerplexity(userMsg);
        } catch (e) {
            aiMsg = 'Došlo k chybě při komunikaci s AI.';
        }
        history.innerHTML = history.innerHTML.replace('<div><i>AI přemýšlí...</i></div>', '');
        history.innerHTML += `<div><b>AI:</b> ${aiMsg}</div>`;
        history.scrollTop = history.scrollHeight;
    }

    showGoogleApiModal() {
        let modal = document.getElementById('googleApiModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'googleApiModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:600px">
                    <h3>Google API Test</h3>
                    <label>API jméno (např. vision/v1/images:annotate):<br><input id="googleApiName" style="width:100%"></label><br>
                    <label>Parametry (JSON):<br><textarea id="googleApiParams" style="width:100%;height:40px"></textarea></label><br>
                    <label>Metoda:<br><select id="googleApiMethod"><option>GET</option><option>POST</option></select></label><br>
                    <label>Tělo (JSON, pro POST):<br><textarea id="googleApiBody" style="width:100%;height:40px"></textarea></label><br>
                    <button id="googleApiSendBtn">Odeslat</button>
                    <button id="closeGoogleApiBtn" style="float:right">Zavřít</button>
                    <pre id="googleApiResult" style="background:#f6f6f6;padding:8px;margin-top:8px;max-height:200px;overflow:auto"></pre>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeGoogleApiBtn').onclick = () => modal.classList.add('hidden');
            document.getElementById('googleApiSendBtn').onclick = () => this.sendGoogleApiRequest();
        }
        document.getElementById('googleApiResult').textContent = '';
        modal.classList.remove('hidden');
    }

    async sendGoogleApiRequest() {
        const apiName = document.getElementById('googleApiName').value.trim();
        let params = {};
        try { params = JSON.parse(document.getElementById('googleApiParams').value || '{}'); } catch {}
        const method = document.getElementById('googleApiMethod').value;
        let body = null;
        try { body = JSON.parse(document.getElementById('googleApiBody').value || '{}'); } catch {}
        document.getElementById('googleApiResult').textContent = 'Načítám...';
        try {
            const result = await this.callGoogleApi(apiName, params, method, body);
            document.getElementById('googleApiResult').textContent = JSON.stringify(result, null, 2);
        } catch (e) {
            document.getElementById('googleApiResult').textContent = 'Chyba: ' + e;
        }
    }

    // --- Onboarding tooltips for new features ---
    showOnboardingTips() {
        if (!localStorage.getItem('visionCameraOnboarded')) {
            this.showToast('Novinka: AI chat a Google API v nastavení!', 'success');
            setTimeout(() => {
                this.showToast('Vyzkoušejte tlačítko AI chat 💬 a Google API 🧩 nahoře!', 'info');
            }, 3500);
            localStorage.setItem('visionCameraOnboarded', '1');
        }
    }

    cleanup() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.qrScanningInterval) {
            clearInterval(this.qrScanningInterval);
        }
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing VisionCamera...');
    window.visionCameraApp = new VisionCameraApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.visionCameraApp) {
        window.visionCameraApp.cleanup();
    }
});

// Handle visibility change for battery optimization
document.addEventListener('visibilitychange', () => {
    if (window.visionCameraApp && document.hidden) {
        window.visionCameraApp.frameProcessors.qrScanning = false;
        window.visionCameraApp.frameProcessors.faceDetection = false;
    }
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        if (window.visionCameraApp) {
            window.visionCameraApp.detectCameraCapabilities();
        }
    }, 500);
});