let SHADOW_MAP_WIDTH = 4096, SHADOW_MAP_HEIGHT = 4096;

let obj = {};

class ThreeJs {
    intermediate = {};
    canvas = {};
    renderer = {};
    camera = {};
    scene = {};
    root = {};
    objs = [];
    audio = {};
    allAnimations = [];
    ambientLight = {};

    constructor(intermediate) {
        this.intermediate = intermediate;
        this.canvas = document.getElementById("webglcanvas");
        let wav = new Wav();
        wav.fromInterm(intermediate);
        let audioBlob = wav.toFile("audio.wav");
        this.audio = new Audio(audioBlob);
        this.audio.play();
        this.audio.loop = true;
        obj = this;
    }

    createScene() {
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true});

        // Set the viewport size
        this.renderer.setSize(this.canvas.width, this.canvas.height);

        // Create a new Three.js scene
        this.scene = new THREE.Scene();

        // Add  a camera so we can view the scene
        this.camera = new THREE.PerspectiveCamera(45, this.canvas.width / this.canvas.height, 1, 4000);
        this.camera.position.set(0, 0, -10);
        this.camera.lookAt(0, 0, 1);
        this.scene.add(this.camera);

        // Create a group to hold all the objects
        this.root = new THREE.Object3D;

        // Add a directional light to show off the object
        this.ambientLight = new THREE.AmbientLight(0x4a940d, 10);

        this.root.add(this.ambientLight);

        this.scene.add(this.root);
        this.createObj();
    }

    getNPoints(n) {
        let limit = Math.floor(this.intermediate.data.length / n);
        let points = [];
        for(let j = 0; j < n; j++) {
            let point = 0;
            for(let i = 0; i < limit; i+=1){
                point ^= this.intermediate.data[j * n + i];
            }
            points.push(point);
        }
        return points;
    }

    genCoordFromInt(all_points, x_range, y_range, z_range){
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

        for(let i = 0; i < values_pos.length; i++){
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

        for(let i = 0; i < values_rot.length; i++){
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

    createObj() {
        let geometry = new THREE.SphereGeometry(1, 20, 20);
        let material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );

        // And put the geometry and material together into a mesh
        let sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(0, 0, 5);
        this.objs.push(sphere);

        this.createAnimation(sphere);

        this.scene.add(sphere);
        console.log(sphere);
    }

    run() {
        requestAnimationFrame(function () {
            obj.run();
        });

        KF.update();

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

