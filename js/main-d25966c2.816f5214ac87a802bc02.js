(self.webpackChunkhero=self.webpackChunkhero||[]).push([[613],{598:(t,i,e)=>{e.d(i,{l:()=>f});var s=e(479),n=e(577),a=e(527),o=e(944),h=e(815);class r{constructor(t,i){this.callback=t,this.onload=i,this.gltfLoader=new n.E,this.fbxLoader=new a.y,this.textureLoader=new s.dpR,this.caster=new s.iMs,this.vertex=new s.Pa4,this.position=new s.Pa4,this.scale=new s.Pa4,this.roration=new s.Pa4,this.box1=new s.ZzF,this.box2=new s.ZzF,this.progress=[],this.animations=[],this.audios={},this.pendingSounds=[],this.setupLoading(),this.loadModel(),this.setupDecalMaterial()}setupLoading(){if(!this.onload)return;const t=this;this.progress=new Proxy({},{set:function(i,e,s){i[e]=s;let n=Object.values(i).slice().reduce(((t,i)=>t+i),0);return n/=t.loadingElements,t.onload(n),!0}})}setupDecalMaterial(){this.decalMaterial=new s.xoR({specular:4473924,shininess:30,color:16711680,map:this.textureLoader.load("/textures/decal-diffuse.png"),normalMap:this.textureLoader.load("/textures/decal-normal.jpg"),transparent:!0,depthTest:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-4,wireframe:!1})}update(t){this.dead||(window.game.pause||this.mixer?.update(t),this.object&&this.updateActions())}executeCrossFade(t,i=.25,e="repeat"){if(this.lastAction&&t&&(!this.died||"die"==t.name)){if(this.lastAction==t)return t.reset();t.enabled=!0,t.setEffectiveTimeScale(1),t.setEffectiveWeight(1),t.loop="pingpong"==e?s.uEv:"once"==e?s.jAl:s.YKA,t.clampWhenFinished="once"==e,"once"==e&&t.reset(),this.lastAction.crossFadeTo(t,i,!0),this.lastAction=t,t.play()}}synchronizeCrossFade(t,i=.25,e="repeat"){this.mixer.addEventListener("finished",(function n(a){s.mixer.removeEventListener("finished",n),s.executeCrossFade(t,i,e)}));const s=this}updateObjectFollow(t,i,e=.001){let s=t.object.position.clone(),n=this.object.position.clone().sub(s).multiplyScalar(i?e:-1*e);this.object.lookAt(s),this.object.position.add(n)}getDistance(t){if(!this.collider||!t.collider)return;if(this.lastCollisionUpdate>performance.now()-500)return;this.lastCollisionUpdate=performance.now();let i=this.collider.geometry.attributes.position;for(let e=0;e<i.count;e++){let s=this.vertex.fromBufferAttribute(i,e).applyMatrix4(this.object.matrix).sub(this.object.position);this.caster.set(this.object.position,s.normalize());let n=this.caster.intersectObjects([t.collider]),a=n.length>0&&n[0].distance<s.length();if(n.length>0)return{distance:n[0].distance,collided:a}}}hasHit(t,i="weapon",e="pillar"){if(this[i]&&t[e])return this[i].updateMatrixWorld(!0),t[e].updateMatrixWorld(!0),this.box1.copy(this[i].geometry.boundingBox),this.box1.applyMatrix4(this[i].matrixWorld),this.box2.copy(t[e].geometry.boundingBox),this.box2.applyMatrix4(t[e].matrixWorld),this.box1.intersectsBox(this.box2)}async fetchAudio(t,i,e=!1,s=10,n=100){if(window.sound?.audioContext)try{let a=await fetch(i,{cache:"force-cache"}),o=await a.arrayBuffer(),h=await window.sound.audioContext.decodeAudioData(o);this.audios[t]=h,e&&this.setPositionalAudio(t,h,s,n)}catch(t){console.log(t)}}setPositionalAudio(t,i,e=10,n=100){if(!window.sound?.audioListener)return;const a=new s.VYz(window.sound?.audioListener);a.name=t,a.setBuffer(i),a.setRefDistance(e),a.setMaxDistance(n),a.onEnded=()=>{a.stop(),this.se=void 0},this.object?this.object.add(a):this.pendingSounds.push(a)}setupBlood(){if(!this.pillar)return;this.position=this.pillar.position.clone(),this.roration.z=2*Math.random()*Math.PI;let t=(0,h.Z)(3,5,!1);this.scale.set(t,t,t);const i=new o.k(this.pillar,this.position,this.roration,this.scale),e=new s.Kj0(i,this.decalMaterial);e.receiveShadow=!0,window.game.scene.add(e)}loadModel(){}initAudio(){}updateActions(){}resizeScene(){}toggleVisibility(){}setupDamage(t){}}class c extends r{loadingElements=6;animationModels=["idle","walk","attack","hit","die"];constructor(t,i,e){super(i,e),this.player=t,this.hp=100,this.maxhp=100}loadModel(){this.gltfLoader.load("./models/humanoid/humanoid.glb",(t=>{this.object=t.scene,this.object.colorSpace=s.KI_,this.object.traverse((t=>{t.isMesh&&(t.castShadow=!0)})),this.object.position.set(0,0,20),this.object.lookAt(0,0,-1),this.mixer=new s.Xcj(this.object),this.collider=new s.Kj0(new s.xo$(1.1),new s.vBJ({visible:!1})),this.collider.name="collider",this.object.add(this.collider),this.collider.geometry.computeBoundingBox(),this.pillar=new s.Kj0(new s.fHI(.6,.6,2.6),new s.vBJ({visible:!1})),this.pillar.name="pillar",this.pillar.rotation.x=Math.PI/2-.12,this.pillar.position.z-=5.5,this.object.add(this.pillar),this.object.getObjectByName("mixamorigSpine1").attach(this.pillar),this.pillar.geometry.computeBoundingBox(),this.weapon=new s.Kj0(new s.xo$(.35),new s.vBJ({visible:!1})),this.weapon.name="weapon",this.weapon.position.set(this.object.position.x+3.7,this.object.position.y-.3,this.object.position.z+6.5),this.object.getObjectByName("mixamorigRightHand").attach(this.weapon),this.weapon.geometry.computeBoundingBox(),this.onFinishActions(),this.loadAnimations(),this.callback(this.object),this.pendingSounds.forEach((t=>this.object.add(t))),this.pendingSounds.splice(0),this.progress.foe=100}),(t=>{this.progress.foe=99*parseInt(t.loaded/(t.total||1))}),(t=>{console.error(t)}))}loadAnimations(){this.animationModels.forEach((t=>{this.fbxLoader.load(`./models/humanoid/${t}.fbx`,(i=>{this.animations[t]=this.mixer.clipAction(i.animations[0]),this.animations[t].name=t,"idle"==t&&(this.lastAction=this.animations[t],this.animations[t].play()),this.progress[t]=100}),(i=>{this.progress[t]=99*parseInt(i.loaded/(i.total||1))}),(t=>{console.error(t)}))}))}update(t){super.update(t),this.processingAttack&&this.executeMelleeAttack()}updateActions(){if(location.search.includes("stop-enemy"))return;if(this.isAttacking||this.beenHit||this.died)return;let t=this.getDistance(this.player);if(t?.distance<=3.5&&!this.isAttacking){this.isAttacking=!0,this.waitForAnimation=!0;let t=.1;this.executeCrossFade(this.animations.attack,t,"once"),setTimeout((()=>this.executeMelleeAttack()),window.game.delay*(1e3*t*4/3))}if(!this.waitForAnimation){if(this.isWalking){if(!this.se){let t=this.object.children.filter((t=>"Audio"==t.type));if(!t.length)return;let i=(0,h.Z)(0,t.length-1);t[i]&&!t[i].isPlaying&&(t[i].play(),this.se=t[i])}this.updateObjectFollow(this.player,t?.collided)}t?.distance<200&&!this.isWalking?(this.isWalking=!0,this.executeCrossFade(this.animations.walk)):t?.distance>=200&&this.isWalking&&(this.isWalking=!1,this.synchronizeCrossFade(this.animations.idle))}}onFinishActions(){this.mixer.addEventListener("finished",(()=>{this.waitForAnimation=!1,this.isAttacking=!1,this.processingAttack=!1,this.beenHit=!1,this.executeCrossFade(this.returnAction)}))}initAudio(){for(let t=0;t<9;t++)this.fetchAudio(`attack-${t}`,`./audio/monster/homanoid-${t}.mp3`,!0)}executeMelleeAttack(){if(!this.isAttacking)return;let t=this.hasHit(this.player);t&&Math.random()<=.75&&this.player.setupDamage(10),this.processingAttack=!t}setupDamage(t){if(this.hp-=t,this.hp<0&&(this.hp=0),this.waitForAnimation=!0,this.beenHit=!0,this.executeCrossFade(this.animations.hit,.1,"once"),this.hp<=0&&!this.died){let t=this.object.children.find((t=>"attack-8"==t.name));t.play(),this.se=t,this.executeCrossFade(this.animations.die,1,"once"),this.died=!0}}get returnAction(){return this.isWalking?this.animations.walk:this.animations.idle}}var d=e(219),l=e(934);class u extends r{loadingElements=16;animationModels=["idle","running","walkingBack","jumping","jumpingRunning","backflip","kick","rolling","outwardSlash","inwardSlash","stomachHit","dieing","drinking","walking"];constructor(t,i,e){super(i,e),this.camera=t,this.actions=[],this.keysPressed={},this.potions=3,this.hp=100,this.maxhp=100,this.initControls()}update(t){super.update(t),this.gamepadConnected&&this.updateGamepad(),this.processingAttack&&this.executeMelleeAttack()}loadModel(){this.gltfLoader.load("./models/hero/hero.glb",(t=>{this.object=t.scene,this.object.colorSpace=s.KI_,this.object.traverse((t=>{t.isMesh&&(t.castShadow=!0)})),this.camera.position.set(0,this.object.position.y+5,this.object.position.z-15),this.camera.lookAt(0,5,0),this.object.add(this.camera),this.mixer=new s.Xcj(this.object),this.collider=new s.Kj0(new s.xo$(.8),new s.vBJ({visible:!1})),this.collider.name="collider",this.object.add(this.collider),this.collider.geometry.computeBoundingBox(),this.pillar=new s.Kj0(new s.fHI(.6,.6,2.5),new s.vBJ({visible:!1})),this.pillar.name="pillar",this.pillar.rotation.x=Math.PI/2-.25,this.pillar.rotation.y+=.25,this.pillar.position.z-=4.8,this.object.add(this.pillar),this.object.getObjectByName("mixamorigSpine1").attach(this.pillar),this.pillar.geometry.computeBoundingBox(),this.onFinishActions(),this.loadWeapon(),this.callback(this.object),this.progress.player=100}),(t=>{this.progress.player=99*parseInt(t.loaded/(t.total||1))}),(t=>{console.error(t)}))}loadWeapon(){this.gltfLoader.load("./models/equips/sword.glb",(t=>{this.sword=t.scene,this.sword.colorSpace=s.KI_,this.sword.traverse((t=>{t.isMesh&&(t.castShadow=!0,this.weapon||(this.weapon=t))})),this.weapon.geometry.computeBoundingBox(),this.sword.rotation.y=Math.PI/6,this.sword.position.set(this.object.position.x-2.6,this.object.position.y+.6,this.object.position.z-4),this.object.getObjectByName("mixamorigRightHand").attach(this.sword),this.progress.sword=100,this.loadAnimations()}),(t=>{this.progress.sword=99*parseInt(t.loaded/(t.total||1))}),(t=>{console.error(t)}))}loadAnimations(){this.animationModels.forEach((t=>{this.fbxLoader.load(`./models/hero/${t}.fbx`,(i=>{this.animations[t]=this.mixer.clipAction(i.animations[0]),this.animations[t].name=t,this.progress[t]=100,"idle"==t&&(this.lastAction=this.animations.idle,this.animations.idle.play())}),(i=>{this.progress[t]=99*parseInt(i.loaded/(i.total||1))}),(t=>{console.error(t)}))}))}initControls(){window.addEventListener("gamepadconnected",(t=>{this.gamepadConnected=!0;let i,e="default",s=/vendor:\s(\w+)\sproduct:\s(\w+)/i.exec(t.gamepad.id);s&&(e=s[1],i=s[2]),this.gamepadSettings=d.Z.gamepad[e]??d.Z.gamepad.default,window.refreshControlsMenu()})),window.addEventListener("gamepaddisconnected",(t=>{this.gamepadConnected=!1,window.refreshControlsMenu()})),window.onkeydown=t=>{window.refreshControlsMenu(),this.keysPressed[t.keyCode]=!0,this.keysPressed[d.Z.keyboard.keySlash]&&!this.actions.includes("slash")&&this.actions.push("slash"),this.keysPressed[d.Z.keyboard.keyTurnLeft]&&!this.actions.includes("turningLeft")&&this.actions.push("turningLeft"),this.keysPressed[d.Z.keyboard.keyTurnRight]&&!this.actions.includes("turningRight")&&this.actions.push("turningRight"),this.keysPressed[d.Z.keyboard.keyWalk]&&!this.actions.includes("walking")&&this.actions.push("walking"),this.keysPressed[d.Z.keyboard.keyBackflip]&&!this.actions.includes("backflip")&&this.actions.push("backflip"),this.keysPressed[d.Z.keyboard.keyStepBack]&&!this.actions.includes("walkingBack")&&this.actions.push("walkingBack"),this.keysPressed[d.Z.keyboard.keyJump]&&!this.actions.includes("jumping")&&this.actions.push("jumping"),this.keysPressed[d.Z.keyboard.keyKick]&&!this.actions.includes("kick")&&this.actions.push("kick"),this.keysPressed[d.Z.keyboard.keyRoll]&&!this.actions.includes("rolling")&&this.actions.push("rolling"),this.keysPressed[d.Z.keyboard.keyHeal]&&!this.actions.includes("drinking")&&this.actions.push("drinking"),this.keysPressed[d.Z.keyboard.keyPause]&&window.game.togglePause()},window.onkeyup=t=>{this.keysPressed[t.keyCode]=!1,t.keyCode==d.Z.keyboard.keySlash&&this.actions.splice(this.actions.findIndex((t=>"slash"==t)),1),t.keyCode==d.Z.keyboard.keyTurnLeft&&this.actions.splice(this.actions.findIndex((t=>"turningLeft"==t)),1),t.keyCode==d.Z.keyboard.keyTurnRight&&this.actions.splice(this.actions.findIndex((t=>"turningRight"==t)),1),t.keyCode==d.Z.keyboard.keyWalk&&this.actions.splice(this.actions.findIndex((t=>"walking"==t)),1),t.keyCode==d.Z.keyboard.keyBackflip&&this.actions.splice(this.actions.findIndex((t=>"backflip"==t)),1),t.keyCode==d.Z.keyboard.keyStepBack&&this.actions.splice(this.actions.findIndex((t=>"walkingBack"==t)),1),t.keyCode==d.Z.keyboard.keyJump&&this.actions.splice(this.actions.findIndex((t=>"jumping"==t)),1),t.keyCode==d.Z.keyboard.keyKick&&this.actions.splice(this.actions.findIndex((t=>"kick"==t)),1),t.keyCode==d.Z.keyboard.keyRoll&&this.actions.splice(this.actions.findIndex((t=>"rolling"==t)),1),t.keyCode==d.Z.keyboard.keyHeal&&this.actions.splice(this.actions.findIndex((t=>"drinking"==t)),1)};const t=document.querySelector("#button-forward");t.ontouchstart=i=>{this.actions.includes("walking")||this.actions.push("walking"),t.classList.add("active")},t.ontouchmove=i=>{if(i.cancelable&&(i.preventDefault(),i.stopPropagation()),!t.posX&&t.getClientRects()&&(t.posX=t.getClientRects()[0].x),i.changedTouches[0].pageX<t.posX){if(this.actions.includes("turningLeft"))return;this.actions.push("turningLeft"),document.querySelector("#button-left").classList.add("active")}else this.actions.includes("turningLeft")&&(this.actions.splice(this.actions.findIndex((t=>"turningLeft"==t)),1),document.querySelector("#button-left").classList.remove("active"));if(i.changedTouches[0].pageX>t.posX+64){if(this.actions.includes("turningRight"))return;this.actions.push("turningRight"),document.querySelector("#button-right").classList.add("active")}else this.actions.includes("turningRight")&&(this.actions.splice(this.actions.findIndex((t=>"turningRight"==t)),1),document.querySelector("#button-right").classList.remove("active"))},t.ontouchend=i=>{this.actions.splice(this.actions.findIndex((t=>"walking"==t)),1),this.actions.includes("turningLeft")&&this.actions.splice(this.actions.findIndex((t=>"turningLeft"==t)),1),this.actions.includes("turningRight")&&this.actions.splice(this.actions.findIndex((t=>"turningRight"==t)),1),t.classList.remove("active"),document.querySelector("#button-left").classList.remove("active"),document.querySelector("#button-right").classList.remove("active")},document.querySelector("#button-backward").ontouchstart=t=>{this.actions.includes("walkingBack")||this.actions.push("walkingBack")},document.querySelector("#button-backward").ontouchend=t=>{this.actions.splice(this.actions.findIndex((t=>"walkingBack"==t)),1)},document.querySelector("#button-left").ontouchstart=t=>{this.actions.includes("turningLeft")||this.actions.push("turningLeft")},document.querySelector("#button-left").ontouchend=t=>{this.actions.splice(this.actions.findIndex((t=>"turningLeft"==t)),1)},document.querySelector("#button-right").ontouchstart=t=>{this.actions.includes("turningRight")||this.actions.push("turningRight")},document.querySelector("#button-right").ontouchend=t=>{this.actions.splice(this.actions.findIndex((t=>"turningRight"==t)),1)},document.querySelector("#button-attack").ontouchstart=t=>{this.actions.includes("slash")||this.actions.push("slash")},document.querySelector("#button-attack").ontouchend=t=>{this.actions.splice(this.actions.findIndex((t=>"slash"==t)),1)},document.querySelector("#button-heal").ontouchstart=t=>{this.actions.includes("drinking")||this.actions.push("drinking")},document.querySelector("#button-heal").ontouchend=t=>{this.actions.splice(this.actions.findIndex((t=>"drinking"==t)),1)},document.querySelector("#button-kick").ontouchstart=t=>{this.actions.includes("kick")||this.actions.push("kick")},document.querySelector("#button-kick").ontouchend=t=>{this.actions.splice(this.actions.findIndex((t=>"kick"==t)),1)},document.querySelector("#button-jump").ontouchstart=t=>{this.actions.includes("jumping")||this.actions.push("jumping")},document.querySelector("#button-jump").ontouchend=t=>{this.actions.splice(this.actions.findIndex((t=>"jumping"==t)),1)}}updateGamepad(){if(this.gamepad=navigator.getGamepads().find((t=>t?.connected)),this.gamepad&&this.gamepadSettings&&!(this.gamepadLastUpdate<=this.gamepad.timestamp)){if(this.gamepad.axes[this.gamepadSettings.YAxes]<=-.05||this.gamepad.buttons[this.gamepadSettings.UP]?.pressed?this.actions.includes("walking")||this.actions.push("walking"):this.actions.includes("walking")&&this.actions.splice(this.actions.findIndex((t=>"walking"==t)),1),this.gamepad.axes[this.gamepadSettings.YAxes]>=.5||this.gamepad.buttons[this.gamepadSettings.DOWN]?.pressed?this.actions.includes("walkingBack")||this.actions.push("walkingBack"):this.actions.includes("walkingBack")&&this.actions.splice(this.actions.findIndex((t=>"walkingBack"==t)),1),this.gamepad.axes[this.gamepadSettings.XAxes]<=-.05||this.gamepad.buttons[this.gamepadSettings.LEFT]?.pressed?this.actions.includes("turningLeft")||this.actions.push("turningLeft"):this.actions.includes("turningLeft")&&this.actions.splice(this.actions.findIndex((t=>"turningLeft"==t)),1),this.gamepad.axes[this.gamepadSettings.XAxes]>=.05||this.gamepad.buttons[this.gamepadSettings.RIGHT]?.pressed?this.actions.includes("turningRight")||this.actions.push("turningRight"):this.actions.includes("turningRight")&&this.actions.splice(this.actions.findIndex((t=>"turningRight"==t)),1),this.gamepad.buttons[this.gamepadSettings.A].pressed){if(performance.now()<this.healLastUpdate)return;this.actions.includes("jumping")||this.actions.push("jumping"),this.healLastUpdate=performance.now()+250}else this.actions.includes("jumping")&&this.actions.splice(this.actions.findIndex((t=>"jumping"==t)),1);this.gamepad.buttons[this.gamepadSettings.B].pressed?this.actions.includes("rolling")||this.actions.push("rolling"):this.actions.includes("rolling")&&this.actions.splice(this.actions.findIndex((t=>"rolling"==t)),1),this.gamepad.buttons[this.gamepadSettings.X].pressed?this.actions.includes("backflip")||this.actions.push("backflip"):this.actions.includes("backflip")&&this.actions.splice(this.actions.findIndex((t=>"backflip"==t)),1),this.gamepad.buttons[this.gamepadSettings.Y].pressed?this.actions.includes("drinking")||this.actions.push("drinking"):this.actions.includes("drinking")&&this.actions.splice(this.actions.findIndex((t=>"drinking"==t)),1),this.gamepad.buttons[this.gamepadSettings.RB].pressed?this.actions.includes("slash")||this.actions.push("slash"):this.actions.includes("slash")&&this.actions.splice(this.actions.findIndex((t=>"slash"==t)),1),this.gamepad.buttons[this.gamepadSettings.LB].pressed?this.actions.includes("kick")||this.actions.push("kick"):this.actions.includes("kick")&&this.actions.splice(this.actions.findIndex((t=>"kick"==t)),1),this.gamepad.buttons[this.gamepadSettings.MENU].pressed&&window.game.togglePause(),this.gamepadLastUpdate=this.gamepad.timestamp}}updateActions(){if(window.game.pause)return;let t=this.actions.includes("walking"),i=this.actions.includes("slash"),e=this.actions.includes("kick"),s=this.actions.includes("drinking"),n=this.actions.some((t=>["turningLeft","turningRight"].includes(t))),a=this.actions.includes("walkingBack"),o=this.actions.includes("backflip"),h=this.actions.includes("jumping"),r=this.actions.includes("rolling");if(this.actions.length<=0&&this.synchronizeCrossFade(this.animations.idle),!this.waitForAnimation&&s&&this.potions>0)this.isHealing=!0,this.waitForAnimation=!0,this.executeCrossFade(this.animations.drinking,.1,"once"),setTimeout((()=>{this.setupHeal()}),750*window.game.delay);else if(!this.waitForAnimation&&i){let t=.1;this.isSlashing=!0,this.waitForAnimation=!0,this.playAttackSE();let i="outwardSlash"==this.lastAction?.name?this.animations.inwardSlash:this.animations.outwardSlash;this.executeCrossFade(i,t,"once"),setTimeout((()=>this.executeMelleeAttack()),window.game.delay*(1e3*t*4/3))}else!this.waitForAnimation&&e?(this.isKicking=!0,this.waitForAnimation=!0,this.playAttackSE(),this.executeCrossFade(this.animations.kick,.1,"once")):this.waitForAnimation||!o||this.isBackingflip||(this.isBackingflip=!0,this.executeCrossFade(this.animations.backflip,.1,"once"),setTimeout((()=>{this.updateWalk(!1,!0,5)}),250*window.game.delay));if(!(this.waitForAnimation||this.isSlashing||this.isKicking||this.isBackingflip||(this.actions.includes("turningLeft")&&(this.object.rotation.y+=.025),this.actions.includes("turningRight")&&(this.object.rotation.y-=.025),t&&!this.isWalking?(this.isWalking=!0,this.executeCrossFade(this.animations.running)):!t&&this.isWalking&&(n||this.executeCrossFade(this.animations.idle),this.isWalking=!1,this.isRunning=!1),t&&this.updateWalk(!0),this.waitForAnimation||!r||this.isRolling||(this.isRolling=!0,this.executeCrossFade(this.animations.rolling,.25,"once")),this.isRolling||(this.waitForAnimation||!h||this.isJumping||(this.isJumping=!0,this.executeCrossFade(t?this.animations.jumpingRunning:this.animations.jumping,.25,"once")),t||this.isJumping)))){if(a&&!this.isSteppingBack?(this.isSteppingBack=!0,this.executeCrossFade(this.animations.walkingBack)):!a&&this.isSteppingBack&&(this.executeCrossFade(this.returnAction),this.isSteppingBack=!1),a)return this.updateWalk(!1,!0,.025);!this.isRotating&&n?(this.isRotating=!0,this.executeCrossFade(this.animations.walking)):this.isRotating&&!n&&(t||this.executeCrossFade(this.returnAction),this.isRotating=!1)}}updateWalk(t=!1,i=!1,e=.175){if(this.waitForAnimation)return;let s=this.camera.getWorldDirection(this.object.position.clone());i&&s.negate(),window.game.fps<45&&(e+=5/window.game.fps);let n=s.multiplyScalar(t?2.5*e:e),a=this.object.position.clone();a.add(n),a.x>=99||a.x<=-99||a.z>=99||a.z<=-99||this.object.position.add(n)}setupDamage(t){this.hp-=t,this.hp<0&&(this.hp=0),this.waitForAnimation=!0,this.beenHit=!0,this.refreshHPBar(),this.playDamageSE(),this.vibrate(),this.executeCrossFade(this.animations.stomachHit,.1,"once"),this.hp<=0&&!this.died&&(this.executeCrossFade(this.animations.dieing,1,"once"),window.sound.playME(window.sound.gameoverBuffer),this.died=!0)}setupHeal(){this.potions<=0||(this.potions--,this.playHealSE(),this.hp+=this.maxhp/2,this.hp>this.maxhp&&(this.hp=this.maxhp),this.refreshHPBar())}playAttackSE(){if(this.beenHit||this.sePlaying)return;const t=Object.keys(this.audios).filter((t=>t.startsWith("attack")));if(!t.length)return;let i=(0,h.Z)(0,t.length-1);this.sePlaying=!0,window.sound.playSE(this.audios[t[i]],!1,this)}playSlashSE(){const t=Object.keys(this.audios).filter((t=>t.startsWith("slash")));if(!t.length)return;let i=(0,h.Z)(0,t.length-1);window.sound.playSE(this.audios[t[i]],!1,this)}playDamageSE(){if(this.sePlaying)return;const t=Object.keys(this.audios).filter((t=>t.startsWith("damage")));if(!t.length)return;let i=(0,h.Z)(0,t.length-1);this.sePlaying=!0,window.sound.playSE(this.audios[t[i]],!1,this)}playHealSE(){this.sePlaying=!0,window.sound.playSE(this.audios.heal,!1,this)}gameover(){document.querySelector("#game-over").classList.add("show"),document.querySelector("header").style.setProperty("display","none"),document.querySelectorAll("footer").forEach((t=>t.style.setProperty("display","none"))),window.game.gameover=!0}refreshHPBar(){let t=document.querySelector("#hpbar").clientWidth-4,i=Math.max(0,this.hp)*t/this.maxhp;document.querySelector("#hpbar").style.setProperty("--hp-width",`${i}px`),document.querySelector("#count-heal").innerHTML=this.potions}executeCrossFade(t,i=.25,e="repeat"){t&&(this.actions.some((t=>["walking","running","turningLeft","turningRight","walkingBack"].includes(t)))&&"idle"==t.name||super.executeCrossFade(t,i,e))}synchronizeCrossFade(t,i=.25,e="repeat"){this.mixer.addEventListener("loop",(function n(a){s.resetActions(),a.action==s.lastAction&&(s.mixer.removeEventListener("loop",n),s.executeCrossFade(t,i,e))}));const s=this}onFinishActions(){this.mixer.addEventListener("finished",(()=>{if(this.died)return this.gameover();this.actions.some((t=>["slash","kick","backflip"].includes(t)))||this.executeCrossFade(this.returnAction),this.resetActions()}))}resetActions(){this.waitForAnimation=!1,this.isBackingflip=!1,this.isRolling=!1,this.isJumping=!1,this.beenHit=!1,this.isSlashing=!1,this.isKicking=!1,this.isHealing=!1,this.processingAttack=!1}initAudio(){for(let t=0;t<=4;t++)this.fetchAudio(`attack-${t}`,`./audio/hero/attack/${t}.mp3`),this.fetchAudio(`damage-${t}`,`./audio/hero/damage/${t}.mp3`);for(let t=0;t<=3;t++)this.fetchAudio(`slash-${t}`,`./audio/weapons/slash-${t}.mp3`);this.fetchAudio("heal","./audio/misc/drinking.mp3")}vibrate(t=100,i=.1){if(this.gamepad)this.gamepad.vibrationActuator.playEffect(this.gamepad.vibrationActuator.type,{startDelay:0,duration:i,weakMagnitude:t/1e3,strongMagnitude:t/500});else if(l.Z.isMobile)try{navigator.vibrate(t)}catch(t){}}toggleVisibility(){document.hidden&&this.actions.splice(0)}executeMelleeAttack(){if(!this.isSlashing)return;let t=this.hasHit(window.game.enemy);t&&Math.random()<=.75&&(window.game.enemy.setupDamage(10),this.playSlashSE()),this.processingAttack=!t}resizeScene(){this.refreshHPBar()}get returnAction(){return this.actions.some((t=>["walking","turningLeft","turningRight"].includes(t)))?this.animations.running:this.actions.includes("walkingBack")?this.animations.walkingBack:this.animations.idle}}const p=["aoMap","emissiveMap","displacementMap","map","normalMap","specularMap"],g=[],m=new s.dpR;class f{loadingElements=3;constructor(){this.lastFrameTime=performance.now(),this.camera=new s.cPb(75,window.innerWidth/window.innerHeight,.1,1e3),this.clock=new s.SUY,this.ambientLight=new s.Mig(16777215,.1),this.dirLight=new s.Ox3(16777215,.1),this.textureLoader=new s.dpR,this.scene=new s.xsS,this.fps=0,this.fpsLimit=0,this.frames=0,this.clockDelta=0,this.initRender(),this.refreshFPS(),this.refreshResolution(),this.refreshPixelDensity(),this.setupLoading(),window.onresize=()=>this.resizeScene(),document.body.appendChild(this.renderer.domElement)}initRender(){let t=localStorage.getItem("antialiasing");null==t&&l.Z.cpuCores>=4&&(t="true"),this.antialiasing="true"==t,this.renderer=new s.CP7({alpha:!0,antialias:this.antialiasing}),this.scene.background=null,this.renderer.outputColorSpace=s.KI_,this.renderer.shadowMap.enabled=!0,this.dirLight.position.set(0,100,100),this.dirLight.castShadow=!0,this.scene.add(this.ambientLight),this.scene.add(this.dirLight),window.window.refreshAntialiasing(this.antialiasing,!1)}refreshFPS(){let t=localStorage.getItem("fpsLimit");"60"==t?this.fpsLimit=1/60:"30"==t?this.fpsLimit=1/30:l.Z.cpuCores>=4||l.Z.isApple?(this.fpsLimit=1/60,t=60):(this.fpsLimit=1/30,fpsl=30),window.refreshFPS(t,!1)}refreshResolution(){let t=localStorage.getItem("resolution");"1"==t?(this.screenWidth=parseInt(window.innerWidth/4*3),this.screenHeight=parseInt(window.innerHeight/4*3)):"2"==t?(this.screenWidth=parseInt(window.innerWidth/2),this.screenHeight=parseInt(window.innerHeight/2)):(t=0,this.screenWidth=window.innerWidth,this.screenHeight=window.innerHeight),window.refreshResolution(t,!1)}refreshPixelDensity(){let t=localStorage.getItem("pixelDensity");"0"==t?this.pixelDensity=window.devicePixelRatio:"1"==t?this.pixelDensity=window.devicePixelRatio/4*3:"2"==t?this.pixelDensity=window.devicePixelRatio/2:l.Z.cpuCores>=4&&l.Z.memory>=6?(this.pixelDensity=window.devicePixelRatio,t=0):l.Z.cpuCores<4?(this.pixelDensity=window.devicePixelRatio/4*3,t=1):(this.pixelDensity=1,t=2),window.refreshPixelDensity(t,!1)}setupLoading(){const t=this;this.progress=new Proxy({},{set:function(i,e,s){i[e]=s;let n=Object.values(i).slice(),a=document.querySelector("progress"),o=n.reduce(((t,i)=>t+i),0);return o/=t.loadingElements,a&&(a.value=parseInt(o||0)),o>=100&&t.initGame(),!0}}),this.loadModels()}loadModels(){(t=>{if(t.textures)return t.textures.forEach((i=>{p.includes(i.type)&&g.push(new Promise(((e,n)=>{m.load(`/textures/${i.texture}`,(n=>{n.materialType=i.type,n.colorSpace=s.KI_,n.wrapS=s.rpg,n.wrapT=s.rpg,t.repeat&&n.repeat.set(t.repeat,t.repeat),e(n)}),void 0,(t=>{n(t)}))})))})),new Promise(((i,e)=>{Promise.all(g).then((e=>{const n=new s.YBo;t.aoMapIntensity&&(n.aoMapIntensity=t.aoMapIntensity),t.emissiveIntensity&&(n.emissiveIntensity=t.emissiveIntensity),t.displacementScale&&(n.displacementScale=t.displacementScale),t.displacementBias&&(n.displacementBias=t.displacementBias),"object"==typeof t.normalScale&&(n.normalScale=new s.FM8(t.normalScale[0],t.normalScale[1])),"number"==typeof t.normalScale&&(n.normalScale=new s.FM8(t.normalScale,t.normalScale)),e.forEach((t=>{n[t.materialType]=t})),i(n)})).catch((t=>{e(t)}))}))})({repeat:10,aoMapIntensity:3,emissiveIntensity:3,displacementScale:1.5,displacementBias:-.15,normalScale:10,textures:[{type:"aoMap",texture:"GroundForestRoots001_AO_1K.webp"},{type:"emissiveMap",texture:"GroundForestRoots001_GLOSS_1K.webp"},{type:"displacementMap",texture:"GroundForestRoots001_DISP_1K.webp"},{type:"map",texture:"GroundForestRoots001_COL_1K.webp"},{type:"normalMap",texture:"GroundForestRoots001_NRM_1K.webp"},{type:"specularMap",texture:"GroundForestRoots001_REFL_1K.webp"}]}).then((t=>{const i=new s.Kj0(new s._12(200,200,200,200),t);i.rotation.x=-Math.PI/2,i.receiveShadow=!0,this.scene.add(i),this.progress.ground||(this.progress.ground=100)})),this.player=new u(this.camera,(t=>{this.scene.add(t),this.dirLight.target=t}),(t=>{this.progress.player=t})),this.enemy=new c(this.player,(t=>{this.scene.add(t)}),(t=>{this.progress.enemy=t}))}initGame(){this.initiated||(this.resizeScene(),this.update(),setTimeout((()=>{l.Z.isPC||document.querySelectorAll("footer").forEach((t=>t.style.removeProperty("display"))),document.querySelector("header").style.removeProperty("display"),document.body.removeChild(document.querySelector("#loading")),this.player.refreshHPBar()}),250),this.initiated=!0)}update(){this.animationFrameId=requestAnimationFrame((()=>this.update())),document.hidden||this.gameover||(this.clockDelta+=this.clock.getDelta(),this.fpsLimit&&this.clockDelta<this.fpsLimit||(this.renderer.render(this.scene,this.camera),this.player.update(this.clockDelta),this.paused||(this.updateFPSCounter(),this.enemy.update(this.clockDelta)),this.clockDelta=this.fpsLimit?this.clockDelta%this.fpsLimit:this.clockDelta%(1/Math.max(this.fps,30))))}initAudio(){this.player.initAudio(),this.enemy.initAudio()}updateFPSCounter(){if(this.frames++,!(performance.now()<this.lastFrameTime+1e3)){if(this.fps=Math.round(1e3*this.frames/(performance.now()-this.lastFrameTime)),!Number.isNaN(this.fps)){let t=document.querySelector("#fps").getContext("2d");t.font="bold 20px sans-serif",t.textAlign="end",t.textBaseline="middle",t.fillStyle="rgba(255,255,255,0.25)",t.clearRect(0,0,80,20),t.fillText(`${this.fps} FPS`,80,10)}this.lastFrameTime=performance.now(),this.frames=0}}resizeScene(){this.camera.updateProjectionMatrix(),this.renderer.setPixelRatio(this.pixelDensity),this.camera.aspect=this.screenWidth/this.screenHeight,this.renderer.setSize(this.screenWidth,this.screenHeight,!1),this.player.resizeScene(),this.enemy.resizeScene()}toggleVisibility(){this.player?.toggleVisibility(),this.enemy?.toggleVisibility()}togglePause(){this.paused=!this.paused,this.paused?document.querySelector("#glass").classList.add("opened"):document.querySelector("#glass").classList.remove("opened")}get delay(){return this.fpsLimit?100*this.fpsLimit:1}}},354:(t,i,e)=>{e.d(i,{$:()=>n});var s=e(479);class n{constructor(){this.audio=new Audio,this.bgmVolume=.25,this.seVolume=1}init(){this.audioContext=new AudioContext,this.bgmGain=this.audioContext.createGain(),this.bgmGain.gain.value=this.bgmVolume,this.seGain=this.audioContext.createGain(),this.seGain.gain.value=this.seVolume;const t=this.audioContext.createMediaStreamDestination();this.bgmGain.connect(this.audioContext.destination),this.seGain.connect(this.audioContext.destination),this.audio.srcObject=t.stream,this.audio.play(),fetch("./audio/bgm/bgm.mp3",{cache:"force-cache"}).then((t=>{t.arrayBuffer().then((t=>{this.audioContext.decodeAudioData(t).then((t=>{this.bgmBuffer=t,this.playBGM()}))}))})),fetch("./audio/me/gameover.mp3",{cache:"force-cache"}).then((t=>{t.arrayBuffer().then((t=>{this.audioContext.decodeAudioData(t).then((t=>{this.gameoverBuffer=t}))}))})),this.audioListener=new s.SJI,this.audioListener.setMasterVolume(this.seVolume),window.game&&(window.game.camera.add(this.audioListener),window.game.initAudio())}playBGM(t=!0){!window.game.gameover&&this.audioContext&&this.bgmBuffer&&(this.bgmSource=this.audioContext.createBufferSource(),this.bgmSource.buffer=this.bgmBuffer,this.bgmSource.loop=!0,this.bgmSource.connect(this.bgmGain),"false"!==localStorage.getItem("bgm")&&(t?this.bgmSource.start(0):this.bgmSource.start()),this.bgmSource.onended=()=>{this.bgmSource.disconnect(),this.bgmSource=void 0})}stopBGM(){try{this.bgmSource&&this.bgmSource.stop()}catch(t){}}playME(t){t&&(this.stopBGM(),this.meSource=this.audioContext.createBufferSource(),this.meSource.buffer=t,this.meSource.connect(this.bgmGain),this.bgmGain.gain.value=this.seVolume,this.meSource.start(0),this.meSource.onended=()=>{this.bgmGain.gain.value=document.hidden?0:this.bgmVolume,this.meSource?.disconnect(),this.meSource=void 0,this.playBGM(!1)})}playSE(t,i=!1,e){if(!this.audioContext||!t)return;const s=this.audioContext.createBufferSource();return s.buffer=t,s.loop=i,s.connect(this.seGain),s.start(0),s.onended=()=>{s.disconnect(),e&&(e.sePlaying=!1)},s}toggleVisibility(){document.hidden?(this.bgmGain&&(this.bgmGain.gain.value=0),this.audioListener?.setMasterVolume(0)):(this.bgmGain&&(this.bgmGain.gain.value=this.bgmVolume),this.audioListener?.setMasterVolume(this.seVolume))}}}}]);