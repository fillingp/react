import plotly.graph_objects as go
import plotly.express as px

# Define layers with their components and positions
layers = [
    {
        "name": "UI Layer",
        "color": "#1FB8CD",
        "components": ["Cam Preview", "Touch Ctrl", "Mode Switch", "Settings", "Gallery", "Notifications"],
        "y": 6
    },
    {
        "name": "Camera API",
        "color": "#FFC185", 
        "components": ["getUserMedia", "MediaRecord", "Img Capture", "Device Enum", "Constraints", "Stream Mgmt"],
        "y": 5
    },
    {
        "name": "Frame Process",
        "color": "#ECEBD5",
        "components": ["Web Workers", "QR Scanner", "Face Detect", "Obj Recogn", "OCR Engine", "Perf Monitor"],
        "y": 4
    },
    {
        "name": "AI Services",
        "color": "#5D878F",
        "components": ["Gemini API", "Img Analysis", "Text Recogn", "Scene Under", "Secure Proxy", "Rate Limit"],
        "y": 3
    },
    {
        "name": "PWA Services",
        "color": "#D2BA4C",
        "components": ["Service Work", "App Manifest", "Offline Cache", "Bg Sync", "Push Notify", "Install Prompt"],
        "y": 2
    },
    {
        "name": "Storage",
        "color": "#B4413C",
        "components": ["LocalStorage", "IndexedDB", "Cache API", "Session Stor", "Settings", "Media Gallery"],
        "y": 1
    },
    {
        "name": "Platform Det",
        "color": "#964325",
        "components": ["iOS Detect", "Android Det", "Safari Opt", "Chrome Feat", "WebKit Fall", "Touch Gesture"],
        "y": 0
    }
]

fig = go.Figure()

# Add layer boxes and component text
for i, layer in enumerate(layers):
    y_pos = layer["y"]
    
    # Add layer box
    fig.add_shape(
        type="rect",
        x0=0, y0=y_pos-0.4, x1=10, y1=y_pos+0.4,
        fillcolor=layer["color"],
        opacity=0.7,
        line=dict(color="white", width=2)
    )
    
    # Add layer title
    fig.add_annotation(
        x=0.5, y=y_pos,
        text=f"<b>{layer['name']}</b>",
        showarrow=False,
        font=dict(size=14, color="white"),
        xanchor="left"
    )
    
    # Add components
    components_text = " • ".join(layer["components"])
    fig.add_annotation(
        x=2.5, y=y_pos,
        text=components_text,
        showarrow=False,
        font=dict(size=10, color="white"),
        xanchor="left"
    )
    
    # Add connection arrows (except for last layer)
    if i < len(layers) - 1:
        fig.add_annotation(
            x=5, y=y_pos-0.5,
            ax=5, ay=y_pos-0.4,
            arrowhead=2,
            arrowsize=1,
            arrowwidth=2,
            arrowcolor="#333333"
        )

# Update layout
fig.update_layout(
    title="VisionCamera Web App Architecture",
    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False, range=[-0.5, 10.5]),
    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False, range=[-0.8, 6.8]),
    showlegend=False,
    plot_bgcolor="white"
)

fig.write_image("visioncamera_architecture.png")