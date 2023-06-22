import './App.css'
import { Canvas } from '@react-three/fiber'
import { Plane, RenderTexture } from '@react-three/drei';
import { TextureExport } from './components/TextureExport';
import { useRef } from 'react';

function App() {
  const documentRef = useRef<HTMLDivElement>(null);
  const save = useRef<{ Save: () => void }>(null);

  return (
    <div ref={documentRef}>
      <div className="canvasWrapper">
        <div className="grid">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <Canvas className="canvas" dpr={1}>
          <Plane args={[7.7, 7.7]} position={[0, 0, 0]}>
            <meshBasicMaterial side={2} transparent>
              <RenderTexture attach="map">
                <TextureExport ref={save}/>
              </RenderTexture>
            </meshBasicMaterial>
          </Plane>
        </Canvas>
      </div>
      <div className="button">
        <button onClick={() => {save.current && save.current.Save();}}>
          SAVE
        </button>
      </div>
    </div>
  );
}

export default App
