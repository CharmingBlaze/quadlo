import React, { useMemo } from 'react'
import * as THREE from 'three'

export type RetroPaletteMode = 'none' | 'retro16' | 'gameboy' | 'mono'

interface PixelArtShaderPassProps {
  pixelSize?: number // 1 to 16
  enableOutline?: boolean
  enableDithering?: boolean
  paletteMode?: RetroPaletteMode
}

/**
 * Custom GLSL Shader for pixelation, Bayer dithering, retro outline, and palette quantization.
 */
export const PixelArtShader = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(800, 600) },
    pixelSize: { value: 4.0 },
    enableOutline: { value: 1.0 },
    enableDithering: { value: 1.0 },
    paletteMode: { value: 0 }, // 0: None, 1: Retro16, 2: GameBoy, 3: Mono
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    uniform float enableOutline;
    uniform float enableDithering;
    uniform int paletteMode;

    varying vec2 vUv;

    // 4x4 Bayer Dither Matrix
    const mat4 bayerMatrix = mat4(
      0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
     12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
      3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
     15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
    );

    float getBayerValue(vec2 pixelCoord) {
      int x = int(mod(pixelCoord.x, 4.0));
      int y = int(mod(pixelCoord.y, 4.0));
      if (x == 0 && y == 0) return bayerMatrix[0][0];
      if (x == 1 && y == 0) return bayerMatrix[0][1];
      if (x == 2 && y == 0) return bayerMatrix[0][2];
      if (x == 3 && y == 0) return bayerMatrix[0][3];
      if (x == 0 && y == 1) return bayerMatrix[1][0];
      if (x == 1 && y == 1) return bayerMatrix[1][1];
      if (x == 2 && y == 1) return bayerMatrix[1][2];
      if (x == 3 && y == 1) return bayerMatrix[1][3];
      if (x == 0 && y == 2) return bayerMatrix[2][0];
      if (x == 1 && y == 2) return bayerMatrix[2][1];
      if (x == 2 && y == 2) return bayerMatrix[2][2];
      if (x == 3 && y == 2) return bayerMatrix[2][3];
      if (x == 0 && y == 3) return bayerMatrix[3][0];
      if (x == 1 && y == 3) return bayerMatrix[3][1];
      if (x == 2 && y == 3) return bayerMatrix[3][2];
      return bayerMatrix[3][3];
    }

    vec3 applyGameBoyPalette(float lum) {
      if (lum < 0.25) return vec3(0.06, 0.22, 0.06);
      if (lum < 0.50) return vec3(0.19, 0.38, 0.19);
      if (lum < 0.75) return vec3(0.54, 0.67, 0.06);
      return vec3(0.61, 0.73, 0.06);
    }

    void main() {
      vec2 dxy = pixelSize / resolution;
      vec2 coord = dxy * floor(vUv / dxy);

      vec4 texel = texture2D(tDiffuse, coord);
      vec3 color = texel.rgb;

      // Edge detection outline
      if (enableOutline > 0.5) {
        vec4 n = texture2D(tDiffuse, coord + vec2(0.0, dxy.y));
        vec4 s = texture2D(tDiffuse, coord - vec2(0.0, dxy.y));
        vec4 e = texture2D(tDiffuse, coord + vec2(dxy.x, 0.0));
        vec4 w = texture2D(tDiffuse, coord - vec2(dxy.x, 0.0));

        float edge = length(texel.rgb - n.rgb) + length(texel.rgb - s.rgb) +
                     length(texel.rgb - e.rgb) + length(texel.rgb - w.rgb);

        if (edge > 0.35) {
          color *= 0.2;
        }
      }

      // Bayer dithering
      if (enableDithering > 0.5) {
        vec2 screenPixel = gl_FragCoord.xy / pixelSize;
        float bayer = getBayerValue(screenPixel) - 0.5;
        color += bayer * 0.08;
      }

      // Palette Quantization
      if (paletteMode == 1) {
        // Retro 16-color posterization
        color = floor(color * 4.0 + 0.5) / 4.0;
      } else if (paletteMode == 2) {
        // Game Boy 4-tone monochrome
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        color = applyGameBoyPalette(lum);
      } else if (paletteMode == 3) {
        // 1-bit B&W
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        color = lum > 0.5 ? vec3(1.0) : vec3(0.0);
      }

      gl_FragColor = vec4(color, texel.a);
    }
  `,
}

export const PixelArtShaderPass: React.FC<PixelArtShaderPassProps> = ({
  pixelSize = 4,
  enableOutline = true,
  enableDithering = true,
  paletteMode = 'none',
}) => {
  const paletteModeInt = useMemo(() => {
    switch (paletteMode) {
      case 'retro16':
        return 1
      case 'gameboy':
        return 2
      case 'mono':
        return 3
      default:
        return 0
    }
  }, [paletteMode])

  const shaderMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(PixelArtShader.uniforms),
      vertexShader: PixelArtShader.vertexShader,
      fragmentShader: PixelArtShader.fragmentShader,
    })
    mat.uniforms.pixelSize.value = pixelSize
    mat.uniforms.enableOutline.value = enableOutline ? 1.0 : 0.0
    mat.uniforms.enableDithering.value = enableDithering ? 1.0 : 0.0
    mat.uniforms.paletteMode.value = paletteModeInt
    return mat
  }, [pixelSize, enableOutline, enableDithering, paletteModeInt])

  return <primitive object={shaderMaterial} attach="material" />
}
