let SHADOW_MAP_WIDTH = 4096, SHADOW_MAP_HEIGHT = 4096;

let obj = {};

class ThreeJs {
    intermediate = {};
    ppm = {};
    wav = {};

    canvas = {};
    renderer = {};
    camera = {};
    scene = {};
    root = {};
    objs = [];
    texture = null;
    uniforms = null;
    ambientLight = {};
    audio = {};
    currentTime = 0;
    allBackgroundCubes = [];
    composers = [];
    mainObject = {};
    raycaster = {};
    energyDisPM = 0.001;
    energyIrrPM = 0.004;
    energyIrrDivDist = 1.5;
    minIntensity = 0.1;
    maxIntensity = 1.0;

    constructor(wav, ppm, intermediate) {
        this.intermediate = intermediate;
        this.canvas = document.getElementById("webglcanvas");
        this.wav = wav;
        this.ppm = ppm;

        let audioBlob = this.wav.toFile("audio.wav");
        this.audio = new Audio(audioBlob);
        //this.audio.play();
        this.audio.loop = true;
        obj = this;
        this.getResourcesFromServer();

    }



    loadTexture(filepath) {
        this.texture = new THREE.TextureLoader().load(filepath);
    }

    createScene() {
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true});

        // Set the viewport siz
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize(window.innerWidth,window.innerHeight);

        // Create a new Three.js scene
        this.scene = new THREE.Scene();

        // Add  a camera so we can view the scene
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.width / this.canvas.height, 1, 4000);
        this.camera.position.set(0, 0, -20);
        this.camera.lookAt(0, 0, 1);
        this.scene.add(this.camera);

        // Create a group to hold all the objects
        this.root = new THREE.Object3D;

        // Add a directional light to show off the object
        this.ambientLight = new THREE.AmbientLight(0x4a940d, 0);

        this.root.add(this.ambientLight);

        this.scene.add(this.root);
        this.raycaster = new THREE.Raycaster();


    }

    getNPoints(n) {
        let limit = Math.floor(this.intermediate.data.length / n);
        let points = [];
        for (let j = 0; j < n; j++) {
            let point = 0;
            for (let i = 0; i < limit; i += 1) {
                point ^= this.intermediate.data[j * n + i];
            }
            points.push(point);
        }
        return points;
    }

    genCoordFromInt(all_points, x_range, y_range, z_range) {
        let coords = [];

        // Point is a 32bit integer
        all_points.forEach(point => {
            let x = Math.sin(point) * x_range;
            let y = Math.cos(point) * y_range;
            let z = Math.sin(point) * Math.cos(point) * z_range;
            coords.push({
                x: x,
                y: y,
                z: z
            });
        });

        return coords;
    }

    genRotFromInt(all_points) {
        let rots = [];

        // Point is a 32bit integer
        all_points.forEach(point => {
            let x = Math.PI + Math.sin(point) * Math.PI;
            let y = Math.PI + Math.cos(point) * Math.PI;
            let z = Math.PI + Math.sin(point) * Math.cos(point) * Math.PI;
            rots.push({
                x: x,
                y: y,
                z: z
            });
        });
        return rots;
    }

    createAnimation(obj) {
        let anim = new KF.KeyFrameAnimator;

        let points_pos = this.getNPoints(10);
        let values_pos = this.genCoordFromInt(points_pos, 5, 5, 5);
        // Adding initial and final value to the animation.
        values_pos.unshift(obj.position);
        values_pos.push(obj.position);
        console.log(values_pos);
        let keys_pos = [];

        for (let i = 0; i < values_pos.length; i++) {
            keys_pos.push(i / values_pos.length);
        }

        let points_rot = this.getNPoints(10);
        let values_rot = this.genRotFromInt(points_rot);
        let initialRot = {
            x: obj.rotation.x,
            y: obj.rotation.y,
            z: obj.rotation.z
        };
        values_rot.unshift(initialRot);
        values_rot.push(initialRot);
        let keys_rot = [];

        for (let i = 0; i < values_rot.length; i++) {
            keys_rot.push(i / values_rot.length);
        }


        anim.init({
            interps:
                [
                    {
                        keys: keys_pos,
                        values: values_pos,
                        target: obj.position
                    },
                    {
                        keys: keys_rot,
                        values: values_rot,
                        target: obj.rotation
                    }
                ],

            loop: true,
            duration: 10000,
        });
        anim.start();
    }

    getResourcesFromServer() {
        let outputBlob = this.ppm.toBlob();

        const Http = new XMLHttpRequest();
        const url = 'http://127.0.0.1:3000/';
        Http.open("POST", url, true);

        Http.setRequestHeader('Content-type', 'blob');
        Http.onreadystatechange = function () {//Call a function when the state changes.
            if (Http.readyState === 4 && Http.status === 200) {
                let filepath = Http.responseText;
                obj.loadTexture(filepath);
                obj.createScene();
                obj.createObj();
                obj.addBackgroundCubes();
                obj.run();
            }
        };
        let reader = new FileReader();
        reader.readAsDataURL(outputBlob);
        reader.onloadend = function () {
            let b64 = reader.result.replace(/^data:.+;base64,/, '');
            Http.send(b64);
        };
    }

    createObj() {
        let geometry = new THREE.SphereGeometry(1, 20, 20);
        let noiseMap = new THREE.TextureLoader().load("resources/noisy-texture.png");

        this.uniforms =
            {
                time: {type: "f", value: 0.2},
                noiseTexture: {type: "t", value: noiseMap},
                imageTexture: {type: "t", value: this.texture}
            };

        this.uniforms.noiseTexture.value.wrapS = this.uniforms.noiseTexture.value.wrapT = THREE.RepeatWrapping;
        this.uniforms.imageTexture.value.wrapS = this.uniforms.imageTexture.value.wrapT = THREE.RepeatWrapping;

        let material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: document.getElementById('fragmentShader').textContent,
            vertexShader: document.getElementById('vertexShader').textContent,
        });

        // And put the geometry and material together into a mesh
        let sphere = new THREE.Mesh(geometry, material);

        sphere.position.set(0, 0, 5);
        this.objs.push(sphere);

        this.createAnimation(sphere);

        this.scene.add(sphere);
        this.mainObject = sphere;
        this.currentTime = Date.now();
        console.log(sphere);
    }

    defaultBackgroundParams() {
        let params = {};
        params['delta'] = 1.0;
        params['startX'] = -10;
        params['endX'] = 10;
        params['startY'] = -10;
        params['endY'] = 10;
        params['allZ'] = 20;

        return params;
    }

    addComposer(){
        // First, we need to create an effect composer: instead of rendering to the WebGLRenderer, we render using the composer.
        let composer = new THREE.EffectComposer(this.renderer);

        // The effect composer works as a chain of post-processing passes. These are responsible for applying all the visual effects to a scene. They are processed in order of their addition. The first pass is usually a Render pass, so that the first element of the chain is the rendered scene.
        const renderPass = new THREE.RenderPass(this.scene, this.camera);

        // There are several passes available. Here we are using the UnrealBloomPass.
        let bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.5, 0.2, 1 );
        bloomPass.threshold = 0;
        bloomPass.strength = 1;
        bloomPass.radius = 1;

        this.renderer.toneMappingExposure = Math.pow( 1, 1.0 );

        // After the passes are configured, we add them in the order we want them.
        composer.addPass(renderPass);
        composer.addPass(bloomPass);

        this.composers.push(composer);
    }

    addBackgroundCubes(params) {
        let maxSide = Math.min(20, this.ppm.header.width, this.ppm.header.height);
        let ratio = Math.max(this.ppm.header.width, this.ppm.header.height) / maxSide;
        let newWidth = Math.floor(this.ppm.header.width / ratio);
        let newHeight = Math.floor(this.ppm.header.height / ratio);
        let chunks = this.ppm.chunkify(newWidth, newHeight);
        if(params === undefined) {
            params = this.defaultBackgroundParams();
        }
        let delta = params['delta'];
        let z = params['allZ'];
        let xIndex = 0;
        let yIndex = 0;
        for (let x = params['startX']; x < params['endX']; x += delta) {
            yIndex = 0;
            let cubeArray = [];
            let realX = - x - params['startX'];
            for (let y = params['startY']; y < params['endY']; y += delta) {
                let realY = - y - params['startY'];
                const rgb = chunks.getPixel(realX, realY);
                const cubeColor = new THREE.Color("rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")");
                let material = new THREE.MeshLambertMaterial(
                    {
                        color: cubeColor,
                        emissive: cubeColor,
                        emissiveIntensity: this.minIntensity
                    });
                let geometry = new THREE.BoxGeometry( 1, 1, 1 );
                let cube = new THREE.Mesh(geometry, material);
                cube.position.set(x, y, z);
                cube.name = xIndex + ":" + yIndex++;
                this.scene.add(cube);
                cubeArray.push(cube);
            }
            this.allBackgroundCubes.push(cubeArray);
            xIndex++;
        }
        this.addComposer();
    }

    parseRowColumn(cubeName){
        let result = [];
        let sep = cubeName.indexOf(':');
        if (sep === -1) return result;
        // Parse x
        result.push(parseInt(cubeName.substr(0, sep)));
        // Parse y
        result.push(parseInt(cubeName.substr(sep + 1, cubeName.length - (sep + 1))));
        return result;
    }

    dissipateEnergy(ms) {
        for(let x = 0; x < this.allBackgroundCubes.length; x++){
            for(let y = 0; y < this.allBackgroundCubes[x].length; y++) {
                let updated = this.allBackgroundCubes[x][y].material.emissiveIntensity - (this.energyDisPM * ms);
                this.allBackgroundCubes[x][y].material.emissiveIntensity =
                    Math.max(this.minIntensity, updated)
            }
        }
    }

    irradiateEnergy(ms, xPos, yPos) {
        for(let x = 0; x < this.allBackgroundCubes.length; x++){
            for(let y = 0; y < this.allBackgroundCubes[x].length; y++) {
                let distance = Math.max(Math.abs(xPos - x), Math.abs(yPos - y));
                let energyIncrease = this.energyIrrPM * ms;
                if (distance > 0) {
                    energyIncrease /= (distance * this.energyIrrDivDist);
                }
                let updated = this.allBackgroundCubes[x][y].material.emissiveIntensity + energyIncrease;
                this.allBackgroundCubes[x][y].material.emissiveIntensity = Math.min(updated, this.maxIntensity);
            }
        }
    }

    launchRay(deltaTime){
        let newPos = new THREE.Vector3();
        newPos.x = this.mainObject.position.x;
        newPos.y = this.mainObject.position.y;
        newPos.z = this.mainObject.position.z;
        let direction = new THREE.Vector3(this.mainObject.position.x, this.mainObject.position.y, 100).normalize();
        this.raycaster.set(newPos, direction);

        let intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0) {
            //console.log("intersected with: ", intersects[intersects.length - 1].object.name);
            this.dissipateEnergy(deltaTime);
            let hitIndex = this.parseRowColumn(intersects[intersects.length - 1].object.name);
            if(hitIndex.length > 0) {
                this.irradiateEnergy(deltaTime, hitIndex[0], hitIndex[1]);
            }
        }
    }

    run() {
        requestAnimationFrame(function () {
            obj.run();
        });

        let time = Date.now();
        let delta = time - this.currentTime;
        this.uniforms.time.value += delta / 2000;
        this.currentTime = time;

        KF.update();
        this.launchRay(delta);

        // Render the scene
        //this.renderer.render(this.scene, this.camera);
        this.composers[0].render();
    }
}

