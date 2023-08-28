let video;
let poseNet;
let currentPoses = [];
let particles = [];
const numParticles = 300;

function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, onPoseNetModelReady);
    poseNet.on('pose', onPoseDetected);
}

function onPoseNetModelReady() {
    console.log("PoseNet model is ready!");
}

function onPoseDetected(poses) {
    currentPoses = poses;
}

function draw() {
    image(video, 0, 0, width, height);

    for (let i = 0; i < currentPoses.length; i++) {
        const pose = currentPoses[i].pose;
        if (pose.keypoints.length > 0) {
            // 손목과 발목의 위치 가져오기
            const wrist = pose.keypoints[9]; // 9번은 왼쪽 손목, 10번은 오른쪽 손목
            const ankle = pose.keypoints[15]; // 15번은 왼쪽 발목, 16번은 오른쪽 발목

            // 파티클 생성
            if (wrist.score > 0.2) {
                particles.push(new Particle(wrist.position.x, wrist.position.y));
            }
            if (ankle.score > 0.2) {
                particles.push(new Particle(ankle.position.x, ankle.position.y));
            }
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.display();
        if (p.isFaded()) {
            particles.splice(i, 1);
        }
    }
}

class Particle {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.acceleration = createVector(0, 0.05);
        this.radius = 5;
        this.alpha = 255;
        this.fadeSpeed = 255 / 3;
    }

    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.alpha -= this.fadeSpeed * deltaTime / 1000;
        this.alpha = constrain(this.alpha, 0, 255);
    }

    display() {
        fill(255, 0, 0, this.alpha);
        noStroke();
        ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
    }

    isFaded() {
        return this.alpha <= 0;
    }
}
