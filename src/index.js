import { Scene } from 'three/src/scenes/Scene'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { ShaderMaterial } from 'three/src/materials/ShaderMaterial'
import { Vector2 } from 'three/src/math/Vector2'
import { Vector3 } from 'three/src/math/Vector3'
import { Matrix4 } from 'three/src/math/Matrix4'
import { Euler } from 'three/src/math/Euler'
import { Quaternion } from 'three/src/math/Quaternion'
import { InstancedMesh } from 'three/src/objects/InstancedMesh'
import { PlaneBufferGeometry } from 'three/src/geometries/PlaneBufferGeometry'
import { Clock } from 'three/src/core/Clock'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import gsap from 'gsap'

import Tweakpane from 'tweakpane'

const fragmentShader = require('./shaders/frag.glsl')
const vertexShader = require('./shaders/vert.glsl')

class App {
  constructor(container) {
    this.container = document.querySelector(container)
    this.clock = new Clock()

    this.options = {
      rotation_speed: 1.3,
      layers_distance: 1.2
    }

    this.bloom = {
      effect: null,
      strength: 0.3,
      radius: 0.4,
      threshold: 0.5
    }

    this._resizeCb = () => this._onResize()
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    this._createPostProcess()
    this._createMesh()
    this._addListeners()

    this._createDebugPanel()

    this.renderer.setAnimationLoop(() => {
      this._update()
      this._render()
    })
  }

  destroy() {
    this.renderer.dispose()
    this._removeListeners()
  }

  _update() {
    const t = this.clock.getElapsedTime()

    this._updateUniforms(t)
    this._updateCamera(t)
    this._updateInstancesMatrix(t*0.1)
  }

  _updateUniforms(t) {
    this.mesh.material.uniforms.u_Time.value = t
    this.mesh.material.uniformsNeedUpdate = true
  }

  _updateCamera(t) {
    this.camera.position.x = Math.cos(t*0.2) * 90
    this.camera.position.y = Math.sin(t*0.05) * 90
    this.camera.position.z = Math.sin(t*0.15) * 90
  }

  _render() {
    this.camera.lookAt(this.mesh.position)
    this.composer.render()
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000)
    this.camera.position.set(0, 3, 120)
  }

  _createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    })

    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0x121212)
    this.renderer.gammaOutput = true
    this.renderer.physicallyCorrectLights = true
  }

  _createPostProcess() {
    this.composer = new EffectComposer(this.renderer)

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    this.bloom.effect = new UnrealBloomPass(
      new Vector2(this.container.clientWidth, this.container.clientHeight),
      this.bloom.strength,
      this.bloom.radius,
      this.bloom.threshold
    )
    this.composer.addPass(this.bloom.effect)
  }

  _createMesh() {
    this.instancesAmount = 100

    const geometry = new PlaneBufferGeometry()

    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_Time: {
          type: 'f',
          value: 0
        },
        u_colorsSpeed: {
          type: 'f',
          value: -1.5
        },
        u_Color1: {
          type: 'vec3',
          value: new Vector3(34 / 255, 94 / 255, 188 / 255)
        },
        u_Color2: {
          type: 'vec3',
          value: new Vector3(210 / 255, 12 / 255, 189 / 255)
        },
      },
      blending: 2, // THREE.AdditiveBlending
      vertexColors: false,
      wireframe: false,
      depthWrite: false
    })

    material.side = 2 // No face culling

    this.mesh = new InstancedMesh(geometry, material, this.instancesAmount)

    this._updateInstancesMatrix()

    this.scene.add(this.mesh)
  }

  _updateInstancesMatrix(time = 0) {
    const matrix = new Matrix4()

    for (let i = 0; i < this.instancesAmount; i++) {
      const p = new Vector3(0, 0, (this.instancesAmount - i*2)*this.options.layers_distance)
      const r = new Euler()
      const q = new Quaternion()
      const s = new Vector3()

      r.x = time*this.options.rotation_speed + i*0.13
      r.y = time*this.options.rotation_speed + i*0.1
      q.setFromEuler(r)

      s.x = s.y = gsap.utils.wrapYoyo(0, this.instancesAmount*0.5, i) * 2

      matrix.compose(p, q, s)

      this.mesh.setMatrixAt(i, matrix)
      this.mesh.instanceMatrix.needsUpdate = true
    }
  }

  _createDebugPanel() {
    this.pane = new Tweakpane()

    /**
     * Colors configuration
     */
    const colorsFolder = this.pane.addFolder({ title: 'Colors' })

    let params = {
      color1: { r: 34, g: 94, b: 188 },
      color2: { r: 210, g: 12, b: 189 }
    }

    colorsFolder.addInput(params, 'color1', { label: 'Color 1' }).on('change', ({ r, g, b }) => {
      this.mesh.material.uniforms.u_Color1.value = new Vector3( r / 255, g / 255, b / 255 )
      this.mesh.material.uniformsNeedUpdate = true
    })

    colorsFolder.addInput(params, 'color2', { label: 'Color 2' }).on('change', ({ r, g, b }) => {
      this.mesh.material.uniforms.u_Color2.value = new Vector3( r / 255, g / 255, b / 255 )
      this.mesh.material.uniformsNeedUpdate = true
    })

    /**
     * Bloom post-process
     */
    const bloomFolder = this.pane.addFolder({ title: 'Bloom effect' })

    params = {
      strength: this.bloom.strength,
      radius: this.bloom.radius,
      threshold: this.bloom.threshold
    }

    bloomFolder.addInput(params, 'strength', { label: 'Strength', min: 0, max: 2 }).on('change', value => {
      this.bloom.effect.strength = value
    })

    bloomFolder.addInput(params, 'radius', { label: 'Radius', min: 0, max: 1 }).on('change', value => {
      this.bloom.effect.radius = value
    })

    bloomFolder.addInput(params, 'threshold', { label: 'Threshold', min: 0, max: 1 }).on('change', value => {
      this.bloom.effect.threshold = value
    })

    /**
     * Misc
     */
    const miscFolder = this.pane.addFolder({ title: 'Misc' })

    params = {
      rotation_speed: this.options.rotation_speed,
      layers_distance: this.options.layers_distance,
      colors_speed: -1.5
    }

    miscFolder.addInput(params, 'rotation_speed', { label: 'Rotation speed', min: -5, max: 5 }).on('change', value => {
      this.options.rotation_speed = value
    })

    miscFolder.addInput(params, 'layers_distance', { label: 'Distance between layers', min: 0.5, max: 1.5 }).on('change', value => {
      this.options.layers_distance = value
    })

    miscFolder.addInput(params, 'colors_speed', { label: 'Colors speed', min: -5, max: 5 }).on('change', value => {
      this.mesh.material.uniforms.u_colorsSpeed.value = value
      this.mesh.material.uniformsNeedUpdate = true
    })
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true })
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resizeCb, { passive: true })
  }

  _onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
}

const app = new App('#app')
app.init()
