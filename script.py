import pandas as pd

# Vytvoření detailní kompatibility matrix pro VisionCamera Web
compatibility_data = {
    'Funkce': [
        'getUserMedia (Camera Access)',
        'MediaRecorder (Video Recording)',
        'Image Capture API',
        'Canvas drawImage', 
        'Web Workers',
        'Service Worker',
        'PWA Manifest',
        'WebRTC',
        'Camera Constraints (zoom)',
        'Torch/Flash Control',
        'Device Enumeration',
        'Screen Wake Lock',
        'Vibration API',
        'File API',
        'Blob URLs',
        'IndexedDB',
        'Local Storage',
        'Touch Events',
        'Fullscreen API',
        'Performance API'
    ],
    'iOS Safari 14+': [
        '✅ Plná podpora',
        '✅ WebM/MP4',
        '❌ Není podporováno',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Od verze 11+',
        '✅ Základní podpora',
        '⚠️ Od iOS 17.4+',
        '✅ Plná podpora',
        '⚠️ Experimentální',
        '❌ Není podporováno',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '⚠️ Omezené v PWA',
        '✅ Plná podpora'
    ],
    'Android Chrome 88+': [
        '✅ Plná podpora',
        '✅ WebM/MP4/WebP',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Pokročilé constraints',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora'
    ],
    'Firefox 90+': [
        '✅ Plná podpora',
        '✅ WebM primarily',
        '⚠️ Experimentální',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Základní podpora',
        '⚠️ Desktop only',
        '✅ Plná podpora',
        '⚠️ Experimentální',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora'
    ],
    'Edge 88+': [
        '✅ Plná podpora',
        '✅ WebM/MP4',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Pokročilé constraints',
        '⚠️ Desktop webcam only',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '❌ Není podporováno',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora',
        '✅ Plná podpora'
    ]
}

# Vytvoření DataFrame
df_compatibility = pd.DataFrame(compatibility_data)

# Uložení do CSV pro export
df_compatibility.to_csv('visioncamera_compatibility.csv', index=False, encoding='utf-8')

print("VisionCamera Web - Kompatibilita prohlížečů")
print("=" * 60)
print(df_compatibility.to_string(index=False))
print(f"\nCelkem funkcí analyzováno: {len(df_compatibility)}")
print(f"Tabulka uložena do: visioncamera_compatibility.csv")