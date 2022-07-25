import * as THREE from 'three'
import { OrbitControls } from './jsm/controls/OrbitControls.js'
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js'
import { Loader } from 'three'
import World from './world.js' 
import Creature from './creature.js' 

// =============== RENDERER ===================
const canvas = document.querySelector('#c')
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement)

// =============== SCENE ======================
const scene = new THREE.Scene()

// =============== CAMERA =====================
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1500)
camera.position.set(0, 370, 340)
camera.lookAt(0,0,0)

// ==================== ORBITCONTROL =========================
const controls = new OrbitControls(camera, renderer.domElement)

// ===================== LIGHT ========================
const light = new THREE.DirectionalLight(0xffffff, 1.5)
light.position.copy( camera.position );
light.castShadow = true
light.receiveShadow = true
scene.add(light)
scene.add(light.target)

// =================== PLANE =========================
const PLANESIZE = 300
const planeGeometry = new THREE.PlaneGeometry(PLANESIZE,PLANESIZE)
const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xE4AE5B,
    side: THREE.DoubleSide
})
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
scene.add(plane)
plane.rotation.x = -0.5*Math.PI
plane.receiveShadow = true

// // =================== ENV GLTF (TODO: should remove and module)===
// const loader = new GLTFLoader();
// const iceURL = new URL('./assets/ground.glb', import.meta.url)
// let backgorund
// loader.load(iceURL.href, function(gltf){
//     backgorund = gltf.scene
//     backgorund.rotation
//     backgorund.scale.set(50, 10, 50)
//     backgorund.position.z = 30
//     backgorund.position.x = 10
//     backgorund.castShadow = true
//     backgorund.receiveShadow = true
//     scene.add(backgorund)
// })


// ================== MAIN LOOP 1 ========================
const myWorld = new World(scene, 50, 0)
console.log("=====world creation done=====")

//create adam and eve
let isfarsighted = true

console.log("=====creature creation done=====")

// create food
myWorld.foodInit()
console.log("=====food creation done=====")
console.log(myWorld.prey[0])
var basic_frame = 60
var target_frame = 15
var frame = 0
let animateId

function animate() {
    animateId= requestAnimationFrame(animate)
    light.position.copy( camera.position );

    if(frame > basic_frame){
        frame -= basic_frame
        // set farsighted & closesighted
        const dist = Math.sqrt((camera.position.x*camera.position.x) + (camera.position.y*camera.position.y) + (camera.position.z*camera.position.z))
        if(dist > 400)
            isfarsighted = true
        else
            isfarsighted = false
    
        // creatures move
        if(myWorld.energy>0){
            myWorld.energy-=1
            myWorld.step(isfarsighted)
        }
        else{
            myWorld.turnOver(isfarsighted)
            myWorld.energy=myWorld.steps
        }
        render() 
    }
    frame += target_frame
    
}
 
function render() {
    renderer.render(scene, camera)
}

animate()


window.addEventListener(
    'resize',
    () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        render()
    },
    false
)

var creatureBtn = document.getElementById('creatureBtn')
var creatureDialog = document.getElementById('creatureDialog')

creatureBtn.addEventListener('click', function onOpen(){
    if (typeof creatureDialog.showModal === 'function') {
        creatureDialog.showModal()
    }else {
        alert("the dialog api is not supported by this browser")
    }
})


var creatureBtn = document.getElementById('creatureBtn')
var creatureDialog = document.getElementById('creatureDialog')
var previewBtn = document.getElementById('previewBtn')
var confirmBtn = document.getElementById('confirmBtn')
var cancelBtn = document.getElementById('cancelBtn')
var gridmapC = document.getElementById('gridmapContainer')
let gridmaps = document.getElementsByClassName('grid-item')
let gridmapList = Array.prototype.slice.call(gridmaps)
let gridConfirmBtn = document.getElementById('gridConfirmBtn')


creatureBtn.addEventListener('click', function onOpen(){
    cancelAnimationFrame(animateId)
})

cancelBtn.addEventListener('click', function(){
    animate()
    let input = document.getElementsByTagName('input')
    let inputList = Array.prototype.slice.call(input)
    inputList.forEach(elem => {
        elem.checked = false
        elem.value = null
    }) //.value = null
    
    gridmapC.style.display = "none"
    creatureDialog.close('creatureNotChosen')
})

let newCreatureP
let newPreyList
let newPredetorList
let newCid
confirmBtn.addEventListener('click', function(){
    newPreyList = []
    newPredetorList = []
    newCid = myWorld.cid

    let ctype
    if(document.getElementById('prey').checked){
        ctype = 1;
    } else if(document.getElementById('predetor').checked){
        ctype = 2;
    } else{
        alert("타입을 선택해 주세요.")
        return
    }
    newCreatureP = {
        scene: scene,
        type : ctype,
        speed : parseInt(document.getElementById('speed').value),
        sight : parseInt(document.getElementById('sight').value),
        coldresist : parseInt(document.getElementById('cold').value),
        hotresist : parseInt(document.getElementById('hot').value),
        efficiency : parseInt(document.getElementById('eff').value),
    }
    console.log(newCreatureP)
    gridmapC.style.display = "block"
})

previewBtn.addEventListener('click', function(){
    // TODO: input 스탯 받아서 적절한 애로 보여주기
})

gridmapList.forEach(grid => {
    grid.addEventListener('click', function(event){
        let gridpos = getOffset(grid)
        const absoluteX = gridpos.right - gridpos.left
        const absoluteY = gridpos.bottom - gridpos.top
        const singleGridCount = PLANESIZE/4  // gridcount X gridcount 
        const scaleX = singleGridCount/absoluteX
        const scaleY = singleGridCount/absoluteY
        const xi = parseInt(event.target.id[0])
        const yi = parseInt(event.target.id[1])

        console.log(gridpos)
        // worldsize == planesize라 가정.
        console.log(event.clientX)
        console.log(event.clientY)
        const inputX = event.clientX - gridpos.left
        const inputY = event.clientY - gridpos.top

        newCreatureP.x = parseInt(xi*singleGridCount + inputX*scaleX)
        newCreatureP.z = parseInt(yi*singleGridCount + inputY*scaleY)
        newCreatureP.id = newCid
        if (newCreatureP.type == 1){    // prey
            newPreyList.push(new Creature(newCreatureP))
        } else if (newCreatureP.type == 2){     // predetor
            newPredetorList.push(new Creature(newCreatureP))
        } else{
            console.log("wrong type input!!!")
        }
        newCid++
        console.log(newPredetorList)
    })
})

gridConfirmBtn.addEventListener('click', function(){
    myWorld.prey = myWorld.prey.concat(newPreyList)
    myWorld.predator = myWorld.predator.concat(newPredetorList)
    console.log(myWorld.prey)
    console.log(myWorld.predetor)

    animate()
    let input = document.getElementsByTagName('input')
    let inputList = Array.prototype.slice.call(input)
    inputList.forEach(elem => {
        elem.checked = false
        elem.value = null
    }) //.value = null
    
    gridmapC.style.display = "none"
    creatureDialog.close('creaturesConfirmed')
})

function getOffset(el){
    const rect = el.getBoundingClientRect();
    return {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY
    }
}
