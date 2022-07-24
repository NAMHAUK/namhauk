import * as THREE from 'three'
import Creature from './creature.js' 

export default class World{
    constructor(scene, preyNum,predatorNum){
        this.prey = []
        this.predator = []
        this.size = 250
        this.creatures = Array(this.size).fill(null).map(()=>Array(this.size).fill(null).map(()=>Array(0)))  // creature map
        this.foodMap = Array(this.size).fill(null).map(()=>Array(this.size).fill(null).map(()=>Array(0)))  // food map
        this.foodDict = {}
        this.turn = 1
        this.cid = 1
        this.food_num = 100      //
        this.energy = 300       // number of initial energy
        this.steps = 300        // number of energy amount
        this.scene = scene
        this.foodRadius = 1
        this.stepping = true
        this.creatureInit(preyNum,predatorNum)
    }

    creatureInit(preyNum,predatorNum){
        for (var i =0;i<preyNum;i++){    // 1차 소비자
            this.prey.push(new Creature(this.cid++, Math.floor(Math.random() * this.size), Math.floor(Math.random() * this.size), this.scene, this.size,1,1, true))
        }
        for (var j =0;j<predatorNum;j++){    // 2차 소비자
            this.predator.push(new Creature(this.cid++, Math.floor(Math.random() * this.size), Math.floor(Math.random() * this.size), this.scene, this.size,3,2, true))
        }

        this.prey.forEach((creatures)=>{
            this.creatures[creatures.position.z][creatures.position.x].push(creatures)
        })
        this.predator.forEach((creatures)=>{
            this.creatures[creatures.position.z][creatures.position.x].push(creatures)
        })
        
    }


    foodInit(){
        let i=0
        while(i<this.food_num){
            let x = Math.floor(Math.random() * this.size)
            let z = Math.floor(Math.random() * this.size)
            if(this.foodMap[z][x]>0) continue;
            const food_sphere = new THREE.Mesh(new THREE.SphereGeometry(this.foodRadius), new THREE.MeshBasicMaterial({color: 0x00FF00}))
            food_sphere.position.set(x-this.size/2, this.foodRadius, z-this.size/2)
            this.foodDict[[x,z]]=food_sphere
            //console.log(`create food at ${x} ${z}`)
            this.foodMap[z][x] += 1  // save food's position to my world!
            this.scene.add(food_sphere)
            i++;
        }
    }

    step(isfarsighted){
        this.prey.forEach((creature) => {
            if(creature.changeDirect==0 || creature.isChasing){
                creature.direction = this.searchFood(creature)
                creature.changeDirect = creature.isChasing ? 1 : Math.floor(Math.random() * 5) + 10;
            }

            var direction = creature.direction
            creature.changeDirect--;

            for(var i = 0;i<creature.speed;i++){
                this.creatures[creature.position.z][creature.position.x]=this.creatures[creature.position.z][creature.position.x].filter((element)=>element.object!==creature.object);
                //console.log(this.creatures[creature.position.z][creature.position.x])
                // console.log(direction)
                var next_x = creature.position.x + direction[1]
                var next_z = creature.position.z + direction[0]
                //console.log("x,y",next_x,next_z)
                if(next_x >= this.size){
                    next_x = this.size-1
                }if(next_x <0){
                    next_x = 0
                }if(next_z >= this.size){
                    next_z = this.size-1
                }if(next_z <0){
                    next_z = 0
                }

                creature.update(next_x, next_z, isfarsighted)

                // 이동한 후 생명체의 위치 저장
                this.creatures[creature.position.z][creature.position.x].push(creature)

                if(this.foodMap[next_z][next_x] > 0){
                    //console.log(`creature ${creature.object} get food at ${next_x}, ${next_z}`)
                    this.foodMap[next_z][next_x]-=1
                    creature.food+=1
                    // console.log(this.foodDict[[next_x, next_z]])
                    this.scene.remove(this.foodDict[[next_x, next_z]])
                }
            }
        })
        this.predator.forEach((creature) => {
            if(creature.changeDirect==0 || creature.isChasing){
                creature.direction = this.searchPrey(creature)
                creature.changeDirect = creature.isChasing ? 1 : Math.floor(Math.random() * 5) + 10;;
            }
            var direction = creature.direction
            creature.changeDirect--;
            for(var i = 0;i<creature.speed;i++){
                this.creatures[creature.position.z][creature.position.x]=this.creatures[creature.position.z][creature.position.x].filter((element)=>element.object!==creature.object);
                
                var next_x = creature.position.x + direction[1]
                var next_z = creature.position.z + direction[0]
                //console.log("x,y",next_x,next_z)
                if(next_x >= this.size){
                    next_x = this.size-1
                }if(next_x <0){
                    next_x = 0
                }if(next_z >= this.size){
                    next_z = this.size-1
                }if(next_z <0){
                    next_z = 0
                }
                creature.update(next_x,next_z, isfarsighted)

                // 이동한 후 생명체의 위치 저장
                this.creatures[creature.position.z][creature.position.x].push(creature)
                
                // 이동한 곳에 prey가 있고 포식자의 food가 2보다 작으면 prey 먹음
                for (var p of this.creatures[creature.position.z][creature.position.x]){
                    //console.log(p)
                    //console.log(p.type)
                    if(p.type==1 && p.food<2){
                        this.scene.remove(p.object)
                        this.creatures[creature.position.z][creature.position.x]=this.creatures[creature.position.z][creature.position.x].filter((element)=>element.object!==p.object);
                        this.prey= this.prey.filter((element)=>element.object!==p.object);
                        creature.food+=1
                    }
                }
            }
        })
    }

    turnOver(isfarsighted){
        var babyCreature = []
        this.prey.forEach((creature) => {
            if(creature.food<=0){
                //console.log(`creature ${creature.object} died!`)
                this.prey = this.prey.filter((element)=>element.object!==creature.object);
                this.creatures[creature.position.z][creature.position.x]=this.creatures[creature.position.z][creature.position.x].filter((element)=>element.object!==creature.object);
                this.scene.remove(creature.object)
            }
            else if(creature.food>=2){
                //console.log(`creature ${creature.id} duplicated!`)
                var position = creature.position
                var newCreature =new Creature(this.cid, position.x, position.z, this.scene, this.size,1,1,isfarsighted)
                babyCreature.push(newCreature)
                this.creatures[position.z][position.x].push(newCreature)
                
                this.cid+=1
                creature.food -= 2
            }
            else{
                //console.log(`creature ${creature.object} lived!`)
                creature.food -= 1
            }            
        })
        this.prey.push(...babyCreature)

        babyCreature = []
        this.predator.forEach((creature) => {
            if(creature.food<=0){
                //console.log(`creature ${creature.object} died!`)
                this.predator = this.predator.filter((element)=>element.object!==creature.object);
                this.creatures[creature.position.z][creature.position.x]=this.creatures[creature.position.z][creature.position.x].filter((element)=>element.object!==creature.object);
                this.scene.remove(creature.object)
            }
            else if(creature.food>=2){
                //console.log(`creature ${creature.id} duplicated!`)
                var position = creature.position
                var newCreature =new Creature(this.cid, position.x, position.z, this.scene, this.size,3,2, isfarsighted)
                babyCreature.push(newCreature)
                this.creatures[position.z][position.x].push(newCreature)
                
                this.cid+=1
                creature.food -=2
            }
            else{
                // console.log(`predator ${creature.id} lived!`)
                creature.food -= 1
            }            
        })
        this.predator.push(...babyCreature)

        console.log(`=====turn ${this.turn} end=====`)
        console.log(`${this.predator.length} predator left`)
        console.log(`${this.prey.length} pery left`)
        if(this.prey.length>0)
            this.foodInit()
        
        this.turn += 1
    }



    searchAlgo(xpos,zpos,scope){
        var direction = [0,0] //z,x
        var returnlist = []
        var minDistance = 100
        
        for(var i=this.minScope(xpos,scope);i<this.maxScope(xpos,scope);i++){
            for(var j=this.minScope(zpos,scope);j<this.maxScope(zpos,scope);j++){
                for(var c of this.creatures[zpos][xpos]){
                    if(c.type ==1){
                        var d = this.distance([zpos,xpos],[j,i])

                        // 기존과 같은 거리의 prey가 있다면 returnlist에 push
                        if(d==minDistance){
                            returnlist.push([j,i])
                        }
                        // 만약 거리가 작은게 있다면 returnlist 초기화 하고 push
                        else if(d < minDistance){
                            minDistance=d
                            returnlist=[]
                            returnlist.push([j,i])
                        }
                    }
                }
            }
        }

        // 만약 scope안에 prey가 없다면 랜덤으로 움직임
        if(minDistance==100){
            each_creature.isChasing = false;
            direction= this.makeRandomDirec()
        }
        // 거리가 같은 prey중에서 랜덤으로 하나를 선택하여 그 방향으로 감
        else{
            const idx = Math.floor(Math.random() * returnlist.length);
            direction[0] = returnlist[idx][0] === 0 ? 0 : returnlist[idx][0] / Math.abs(returnlist[idx][0])
            direction[1] = returnlist[idx][1] === 0 ? 0 : returnlist[idx][1] / Math.abs(returnlist[idx][1])
            each_creature.isChasing = true;
            // console.log("success search",direction)
        }

        return direction
    }

    searchFood(each_creature){
        var scope = 5
        var direction = [0,0] //z,x
        var xpos = each_creature.position.x
        var zpos = each_creature.position.z
        // 현재 위치에 먹이가 있다면 안 움직임
        if(this.foodMap[zpos][xpos]>0){
            console.log("prey no move")
            return direction
        }
        
        // 먹이를 찾았다면 그 방향으로 움직임
        var minlength = [0,0]
        for(var i=this.minScope(xpos,scope); i<this.maxScope(xpos,scope);i++){
            for(var j=this.minScope(zpos,scope); j<this.maxScope(zpos,scope);j++){
                if(this.foodMap[j][i]>0){
                    direction[0] = (j - zpos)===0 ? 0 : (j - zpos) / Math.abs((j - zpos))
                    direction[1] = (i - xpos)===0 ? 0 : (i - xpos) / Math.abs((i - xpos))
                    each_creature.isChasing = true;
                    return direction
                }
            }
        }

        each_creature.isChasing = false;

        return this.makeRandomDirec()
    }
    
    searchPrey(each_creature){
        var scope = 3
        var direction = [0,0] //z,x
        var xpos = each_creature.position.x
        var zpos = each_creature.position.z

        // 현재 위치에 먹이가 있다면 안 움직임
        if(this.creatures[zpos][xpos].type==1){
            console.log("predactor no move")
            return direction
        }

        // return this.searchAlgo(xpos,zpos,scope)
        var direction = [0,0] //z,x
        var returnlist = []
        var minDistance = 100
        
        for(var i=this.minScope(xpos,scope);i<this.maxScope(xpos,scope);i++){
            for(var j=this.minScope(zpos,scope);j<this.maxScope(zpos,scope);j++){
                for(var c of this.creatures[zpos][xpos]){
                    if(c.type ==1){
                        var d = this.distance([zpos,xpos],[j,i])

                        // 기존과 같은 거리의 prey가 있다면 returnlist에 push
                        if(d==minDistance){
                            returnlist.push([j,i])
                        }
                        // 만약 거리가 작은게 있다면 returnlist 초기화 하고 push
                        else if(d < minDistance){
                            minDistance=d
                            returnlist=[]
                            returnlist.push([j,i])
                        }
                    }
                }
            }
        }

        // 만약 scope안에 prey가 없다면 랜덤으로 움직임
        if(minDistance==100){
            each_creature.isChasing = false;
            direction= this.makeRandomDirec()
        }
        // 거리가 같은 prey중에서 랜덤으로 하나를 선택하여 그 방향으로 감
        else{
            const idx = Math.floor(Math.random() * returnlist.length);
            direction[0] = returnlist[idx][0] === 0 ? 0 : returnlist[idx][0] / Math.abs(returnlist[idx][0])
            direction[1] = returnlist[idx][1] === 0 ? 0 : returnlist[idx][1] / Math.abs(returnlist[idx][1])
            each_creature.isChasing = true;
            // console.log("success search",direction)
        }

        return direction
    }

    makeRandomDirec(){
        var direction = [0,0]
        // 주위에 먹이가 없다면 랜덤하게 움직임
        const xMoves = [1, -1, 0, 0, 1, -1, 1, -1]
        const zMoves = [0, 0, 1, -1, 1, 1, -1, -1]
        const idx = Math.floor(Math.random() * xMoves.length);
        direction[0]=zMoves[idx]
        direction[1]=xMoves[idx]
        return direction
    }

    distance(n1,n2){return Math.sqrt((n1[0] - n2[0]) ** 2 + (n1[1] - n2[1]) ** 2)}
    minScope(pos,scope){return pos-scope>0 ? pos-scope : 0}
    maxScope(pos,scope){return pos+scope < this.size ? pos+scope : this.size - 1}
}
