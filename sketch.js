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
            const leftWrist = pose.keypoints[9];        // 9번은 왼쪽 손목
            const rightWrist = pose.keypoints[10];      // 10번은 오른쪽 손목
            const leftAnkle = pose.keypoints[15];       // 15번은 왼쪽 발목
            const rightAnkle = pose.keypoints[16];      // 16번은 오른쪽 발목

            // 파티클 생성
            if (leftWrist.score > 0.05) {
                particles.push(new Particle(leftWrist.position.x, leftWrist.position.y));
            }
            if (rightWrist.score > 0.05) {
                particles.push(new Particle(rightWrist.position.x, rightWrist.position.y));
            }
            if (leftAnkle.score > 0.05) {
                particles.push(new Particle(leftAnkle.position.x, leftAnkle.position.y));
            }
            if (rightAnkle.score > 0.05) {
                particles.push(new Particle(rightAnkle.position.x, rightAnkle.position.y));
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
        this.size = random(1, 5);
        this.alpha = 255;
        this.fadeSpeed = random(1, 3);

        this.color = color(random(200, 255), random(100, 200), random(200, 255)); // 핑크색 계열 설정
    }

    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.alpha -= this.fadeSpeed * deltaTime / 1000;
        this.alpha = constrain(this.alpha, 0, 255);
    }

    display() {
        fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
        noStroke();
        ellipse(this.position.x, this.position.y, this.size * 2, this.size * 2);
    }

    isFaded() {
        return this.alpha <= 0;
    }
}
