import * as THREE from 'three'
import { Loader } from 'three'
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js'


const urlList = [`assets/nullbird.glb`, `assets/bird1.glb`, `assets/bird.glb`] // new URL(`assets/cow.glb`, import.meta.url)
const colorList = [0x000000,0x0000FF, 0xFF0000]


// Animation object (= Creatures)
export default class Creature{
    constructor(id, x, z, scene, worldSize, speed, type, isfarsighted){
        this.position = {x, z}
        this.scene = scene
        this.food = 1                  
        this.id = id                // creation id of creature
        this.radius = 2          // radius of 3D-sphere
        this.type = type
        this.worldSize = worldSize // information of world
        this.speed =speed

        this.isfarsighted = isfarsighted

        this.object = null
        this.closeView = null
        this.farView = this.draw()
        
        this.clock = new THREE.Clock()
        this.animateMixer = null

        this.init()
    } 
    async init(){
        const loader = new GLTFLoader();
        let gltfData = await loader.loadAsync(urlList[this.type])

        gltfData.scene.position.set(this.position.x-this.worldSize/2, this.radius, this.position.z-this.worldSize/2)
        gltfData.scene.scale.set(this.radius,this.radius,this.radius)
        gltfData.scene.rotation.y = Math.PI
        gltfData.scene.castShadow = true
        gltfData.scene.recieveShadow = true
        // ================ DONOT ERASE!! for ANIMATION ===================
        // this.animateMixer = new THREE.AnimationMixer(gltfData.scene)
        // const clips = gltfData.animations
        // const clip = THREE.AnimationClip.findByName(clips, "ArmatureAction")
        // const action = this.animateMixer.clipAction(clip);
        // action.play()
        
        this.closeView = gltfData.scene
        this.object = this.farView
        if(this.isfarsighted == false){
            this.object = this.closeView
        }
        this.scene.add(this.object)
    }
    draw() {
        const sphereGeometry = new THREE.SphereGeometry(this.radius)    // size, div, division of geometry
    
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: colorList[this.type],
            wireframe: false
        })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        sphere.position.set(this.position.x-this.worldSize/2, this.radius, this.position.z-this.worldSize/2)
        sphere.castShadow = true
        sphere.receiveShadow = true
        return sphere
    }

    update(next_x, next_z, isfarsighted) {
        if(isfarsighted == true && this.isfarsighted == false){  
            this.isfarsighted = true    // change to farsighted
            this.scene.remove(this.object)

            this.farView.position.x = this.object.position.x
            this.farView.position.z = this.object.position.z
            this.object = this.farView
            this.scene.add(this.object)

        }else if(isfarsighted == false && this.isfarsighted == true){   
            this.isfarsighted = false   // change to closesighted
            this.scene.remove(this.object)

            this.closeView.position.x = this.object.position.x
            this.closeView.position.z = this.object.position.z
            this.object = this.closeView
            this.scene.add(this.object)
        }
        
        if(this.object){
            this.position.x = next_x
            this.position.z = next_z
    
            // this.animateMixer.update(this.clock.getDelta())
            let x = next_x - this.worldSize/2
            let z = next_z - this.worldSize/2
            this.object.rotation.y = Math.atan((x - this.object.position.x)/(z - this.object.position.z)) + Math.PI
            this.object.position.x = x
            this.object.position.z= z
        }
    }
    destroy(){
        this.scene.remove(this.object)
    }
}