import {
  OrthographicCamera,
  Plane,
  shaderMaterial,
} from "@react-three/drei";
import { Camera, extend, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { ReactElement, forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ShaderMaterial } from "three";

const NoiseMaterial = shaderMaterial(
  {
    size: 2.5,
    start: 0.22,
    stop: 0,
    force: 0.17,
    power: 1.2,
    x: 0,
    y: 0,
    preview: false,
    previewX: -1,
    previewY: -1,
  },
  // vertex shader
  /*glsl*/ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
  // fragment shader
  /*glsl*/ `
    precision highp float;
    varying vec2 vUv;
    uniform float size;
    uniform float start;
    uniform float stop;
    uniform float force;
    uniform float power;
    uniform float x;
    uniform float y;
    uniform bool preview;
    uniform float previewX;
    uniform float previewY;

    vec4 mod289(vec4 x)
    {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
    }

    vec4 permute(vec4 x)
    {
        return mod289(((x*34.0)+1.0)*x);
    }

    vec4 taylorInvSqrt(vec4 r)
    {
        return 1.79284291400159 - 0.85373472095314 * r;
    }

    vec2 fade(vec2 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
    }

    float cnoise(vec2 P)
    {
        vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
        vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
        Pi = mod289(Pi); // To avoid truncation effects in permutation
        vec4 ix = Pi.xzxz;
        vec4 iy = Pi.yyww;
        vec4 fx = Pf.xzxz;
        vec4 fy = Pf.yyww;

        vec4 i = permute(permute(ix) + iy);

        vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
        vec4 gy = abs(gx) - 0.5 ;
        vec4 tx = floor(gx + 0.5);
        gx = gx - tx;

        vec2 g00 = vec2(gx.x,gy.x);
        vec2 g10 = vec2(gx.y,gy.y);
        vec2 g01 = vec2(gx.z,gy.z);
        vec2 g11 = vec2(gx.w,gy.w);

        vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
        g00 *= norm.x;
        g01 *= norm.y;
        g10 *= norm.z;
        g11 *= norm.w;

        float n00 = dot(g00, vec2(fx.x, fy.x));
        float n10 = dot(g10, vec2(fx.y, fy.y));
        float n01 = dot(g01, vec2(fx.z, fy.z));
        float n11 = dot(g11, vec2(fx.w, fy.w));

        vec2 fade_xy = fade(Pf.xy);
        vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
        float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
        return 2.3 * n_xy;
    }

    void main() {
        float noise = pow(power, cnoise((vec2(vUv.x + x, vUv.y + y) * size)));
        float rnoise = cnoise(vec2(noise));
        float smoothnoise = smoothstep(start, stop, rnoise);
        vec3 color = vec3(smoothnoise * (step(force, smoothnoise)));

        float pct = 0.0;
        if (preview && (previewX < 0. || previewY < 0.))
          pct = step(0.495, distance(vUv, vec2(0.5)));
        if (preview && previewX > -1. && previewY > -1.)
          pct = step(2.495, distance(vUv + vec2(previewX, previewY), vec2(2.5, 2.5)));

        gl_FragColor.rgb = color * (1. - vec3(pct));
        // gl_FragColor.rgb = color;
        gl_FragColor.a   = color.x - pct;
        // gl_FragColor.rgba = vec4(pct, 0, 0, 1);
    }
    `
);
extend({ NoiseMaterial });

export const TextureExport = forwardRef(function TextureExport({}, ref): ReactElement {
  const { gl, scene, camera } = useThree();
  const noisem = useRef<ShaderMaterial>(null);
  const [chunkSize, setChunkSize] = useState(5);

  const { size, start, stop, force, power, x, y, preview, previewX, previewY } = useControls({
    size: {
      value: 4.4,
      min: 0.1,
      max: 50,
      step: 0.1,
    },
    start: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    stop: {
      value: 0.04,
      min: 0,
      max: 1,
      step: 0.01,
    },
    force: {
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
    },
    power: {
      value: 0.2,
      min: 0,
      max: 10,
      step: 0.1,
    },
    x: {
      value: 0,
      min: 0,
      max: 10,
      step: 0.01,
    },
    y: {
      value: 0,
      min: 0,
      max: 10,
      step: 0.01,
    },
    preview: {
      value: false,
    },
    previewX: {
      value: -1,
      min: -1,
      max: 4,
      step: 1,
    },
    previewY: {
      value: -1,
      min: -1,
      max: 4,
      step: 1,
    },
  });

  function Save() {
    console.log("saving");
    setChunkSize(1);
    gl.setSize(64, 64);
    (camera as Camera & {top: number}).top = 0.5;
    (camera as Camera & {bottom: number}).bottom = -0.5;
    (camera as Camera & {left: number}).left = -0.5;
    (camera as Camera & {right: number}).right = 0.5;
    gl.domElement.classList.add("saving");
    if (!noisem.current) return;
    noisem.current.uniforms.preview.value = true;
    // noisem.current.uniforms.size.value = size / 5;
    for (let i = 1; i <= 5; i++) {
      setTimeout(() => {
        if (!noisem.current) return;
        noisem.current.uniforms.previewY.value = i - 1;
        for (let j = 1; j <= 5; j++) {
        noisem.current.uniforms.previewX.value = 5 - j;
          let downloadLink = document.createElement("a");
          downloadLink.setAttribute("download", `${i}_${j}.png`);
          let canvas = gl.domElement;
          gl.render(scene, camera);
          canvas.toBlob(function (blob) {
            let url = URL.createObjectURL(blob as Blob);
            downloadLink.setAttribute("href", url);
            downloadLink.click();
          });
          noisem.current.uniforms.x.value -= 1;
        }
        noisem.current.uniforms.x.value = 0;
        noisem.current.uniforms.y.value += 1;
      }, 1000 * i);
    }
    setTimeout(() => {
        console.log("done");
        gl.domElement.classList.remove("saving");
        setChunkSize(5);
        gl.setSize(512, 512);
        if (!noisem.current) return;
        noisem.current.uniforms.x.value = 0;
        noisem.current.uniforms.y.value = 0;
        noisem.current.uniforms.size.value = size * 1;
        noisem.current.uniforms.preview.value = false;
        noisem.current.uniforms.previewX.value = -1;
        noisem.current.uniforms.previewY.value = -1;
    }, 7000);
  }

  useImperativeHandle(ref, function getRefValue() {
    return {
      Save
    }
  }, [])

  return (
    <>
      <OrthographicCamera
        makeDefault
        manual
        left={-0.5 * chunkSize}
        right={0.5 * chunkSize}
        top={0.5 * chunkSize}
        bottom={-0.5 * chunkSize}
        position={[0, 0, 1]}
      />
      <Plane args={[7.7, 7.7]} position={[0, 0, 0]}>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <noiseMaterial
          ref={noisem}
          key={NoiseMaterial.key}
          size={size}
          start={start}
          stop={stop}
          force={force}
          power={power}
          x={x}
          y={y}
          preview={preview}
          previewX={previewX}
          previewY={previewY}
          transparent
        />
      </Plane>
    </>
  );
});
