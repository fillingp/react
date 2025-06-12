import plotly.graph_objects as go

# Data
devices = [
    "iPhone15+Safari",
    "S24+Chrome", 
    "iPad+Safari",
    "Pixel8+Chrome",
    "Desktop Chrome",
    "Desktop Safari"
]

fps = [58, 60, 55, 60, 60, 52]
processing_speed = [85, 92, 80, 90, 95, 75]
memory_efficiency = [90, 85, 95, 88, 70, 88]
battery_impact = [75, 80, 85, 82, 95, 70]

# Use specified colors from instructions
colors = {
    'fps': '#10B981',
    'processing': '#F59E0B', 
    'memory': '#3B82F6',
    'battery': '#8B5CF6'
}

# Create figure
fig = go.Figure()

# Add bars for each metric with proper grouping
fig.add_trace(go.Bar(
    name='FPS',
    x=devices,
    y=fps,
    marker_color=colors['fps'],
    text=fps,
    textposition='outside',
    cliponaxis=False,
    offsetgroup=1
))

fig.add_trace(go.Bar(
    name='Processing',
    x=devices,
    y=processing_speed,
    marker_color=colors['processing'],
    text=processing_speed,
    textposition='outside',
    cliponaxis=False,
    offsetgroup=2
))

fig.add_trace(go.Bar(
    name='Memory Effcy',
    x=devices,
    y=memory_efficiency,
    marker_color=colors['memory'],
    text=memory_efficiency,
    textposition='outside',
    cliponaxis=False,
    offsetgroup=3
))

fig.add_trace(go.Bar(
    name='Battery Impct',
    x=devices,
    y=battery_impact,
    marker_color=colors['battery'],
    text=battery_impact,
    textposition='outside',
    cliponaxis=False,
    offsetgroup=4
))

# Update layout
fig.update_layout(
    title='VisionCamera Performance',
    xaxis_title='Device/Browser',
    yaxis_title='Score (0-100)',
    barmode='group',
    bargap=0.15,
    bargroupgap=0.1,
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Update axes
fig.update_yaxes(range=[0, 105])
fig.update_xaxes(tickangle=0)

# Save the chart
fig.write_image('visioncamera_performance.png')