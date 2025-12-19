# Vector Space Visualiser

A cinematic, interactive 3D visualization of semantic vector spaces, built with Three.js and Vite. Built entirely by Gemini3 Pro (High) in Google Antigravity.

## Overview

The **Vector Space Visualiser** renders a "semantic galaxy" where words are represented as stars in a 3D coordinate system. It allows users to explore relationships between concepts through a high-fidelity, immersive interface inspired by sci-fi aesthetics and modern developer tools.

This project simulates a vector embedding space (like Word2Vec or BERT) but focuses on the visual experience, featuring realistic rendering, post-processing effects, and a utilitarian "Dev Style" UI.

## Key Features

### 🌌 Cinematic Visuals
- **JWST-Style Background**: A high-resolution, realistic nebula background derived from James Webb Space Telescope imagery.
- **Bloom & Post-Processing**: Integrated `UnrealBloomPass` for a glowing, ethereal atmosphere.
- **Realistic Star Rendering**: Stars are colored based on real spectral classes (O, B, A, F, G, K, M).

### 🖥️ "Dev Style" Interface
- **Sidebar Layout**: A fixed, utilitarian control panel inspired by VS Code and modern IDEs.
- **Terminal Input**: A command-line style input (`>_`) for searching and navigating the space.
- **Properties Inspector**: Real-time display of vector coordinates, token IDs, and navigational bearings.
- **Dark Mode Aesthetic**: Sleek, dark-themed UI with syntax-highlighting accent colors.

### 🔍 Interactive Exploration
- **Semantic Search**: Type words to "select" stars.
- **Visual Feedback**:
    - **Radial Glow**: Selected stars emit a large, pulsing radial glow.
    - **Semantic Neighbors**: Linked concepts (nearest neighbors) are highlighted with increased brightness and size, visualizing the "meaning" cluster.
- **Camera Control**: Smooth orbital controls to pan, zoom, and rotate around the galaxy.

## Tech Stack

- **Core**: [Three.js](https://threejs.org/) (WebGL Rendering)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: JavaScript (ES6+)
- **Styling**: Vanilla CSS (Custom "Dev Style" Theme)

## Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/vector-space-visualiser.git
    cd vector-space-visualiser
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Navigate to `http://localhost:5173` (or the URL shown in your terminal).

## Usage

1.  **Navigation**:
    - **Left Click + Drag**: Rotate camera.
    - **Right Click + Drag**: Pan camera.
    - **Scroll**: Zoom in/out.

2.  **Search**:
    - Click the input field (`>_`) in the sidebar.
    - Type a word (e.g., "galaxy", "star", "data").
    - The camera will focus on the word's node, and its semantic neighbors will light up.

3.  **UI Controls**:
    - Use the toggle button (`_`) in the top right of the sidebar to minimize/maximize the control panel.

## Project Structure

```
vector-space-app/
├── public/
│   ├── nebula.png       # Background texture
│   └── ...
├── src/
│   ├── main.js          # Core application logic (Three.js scene, interactions)
│   ├── style.css        # UI styling (Dev Style theme)
│   └── ...
├── index.html           # Main entry point and UI structure
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Future Roadmap

- [ ] Integration with real Word2Vec/GloVe embeddings (currently simulated).
- [ ] VR/XR support for immersive exploration.
- [ ] Advanced filtering and cluster analysis tools.

## License

[MIT](LICENSE)
