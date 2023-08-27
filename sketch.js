// Demonstrates the ml5.js PoseNet API:
// https://learn.ml5js.org/#/reference/posenet
//
// See:
// https://makeabilitylab.github.io/physcomp/communication/ml5js-serial.html
//
// Based loosely on the official ml5.js PoseNet example:
// https://github.com/ml5js/ml5-library/blob/main/examples/p5js/PoseNet/PoseNet_webcam/sketch.js
//
// As linked to from:
// https://ml5js.org/reference/api-PoseNet/
// 
// By Jon E. Froehlich
// http://makeabilitylab.io/

let video;
let poseNet;
let currentPoses = [];
// 파티클 관련 변수들
let particles = [];
const numParticles = 100;

// The following options are all optional. Here are the defaults:
// {
//   architecture: 'MobileNetV1',
//   imageScaleFactor: 0.3,
//   outputStride: 16,
//   flipHorizontal: false,
//   minConfidence: 0.5,
//   maxPoseDetections: 5,
//   scoreThreshold: 0.5,
//   nmsRadius: 20,
//   detectionType: 'multiple',
//   inputResolution: 513,
//   multiplier: 0.75,
//   quantBytes: 2,
// };
const poseNetOptions = { detectionType: "single" };

function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    //video.size(width, height);
    video.hide();

    // Setup PoseNet. This can take a while, so we load it 
    // asynchronously (when it's done, it will call modelReady)
    poseNet = ml5.poseNet(video, poseNetOptions, onPoseNetModelReady); //call onModelReady when setup

    // PoseNet has one and only one event subscription called 'pose', which is
    // called when pose is detected
    poseNet.on('pose', onPoseDetected); // call onPoseDetected when pose detected
    //frameRate(1);
}

/**
 * Callback function called by ml5.js PoseNet when the PoseNet model is ready
 * Will be called once and only once
 */
function onPoseNetModelReady() {
    print("The PoseNet model is ready...");
}

/**
 * Callback function called by ml5.js PosetNet when a pose has been detected
 */
function onPoseDetected(poses) {
    currentPoses = poses;
}

function draw() {
    image(video, 0, 0, width, height);

    // Iterate through all poses and print them out
    if (currentPoses) {
        for (let i = 0; i < currentPoses.length; i++) {
            drawPose(currentPoses[i], i);
        }
    }
}

function drawPose(pose, poseIndex) {
    // 파티클을 생성하고 스켈레톤을 따라 이동시킴
    for (let i = 0; i < numParticles; i++) {
        if (pose.skeleton.length > 0) {
            // 무작위로 스켈레톤 관절 선택
            const jointIndex = floor(random(pose.skeleton.length));
            const joint = pose.skeleton[jointIndex][0].position;

            // 파티클 생성
            particles.push(new Particle(joint.x, joint.y));
        }
    }

    // 스켈레톤 그리기
    const skeletonColor = color(255, 255, 255, 128);
    stroke(skeletonColor);
    strokeWeight(2);
    const skeleton = pose.skeleton;
    for (let j = 0; j < skeleton.length; j += 1) {
        const partA = skeleton[j][0];
        const partB = skeleton[j][1];
        line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }

    // 파티클 이동 및 표시
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.display();

        // 파티클이 완전히 사라지면 제거
        if (p.isFaded()) {
            particles.splice(i, 1);
        }
    }
}


// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i += 1) {
        // For each pose detected, loop through all the keypoints
        const pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j += 1) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            const keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i += 1) {
        const skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j += 1) {
            const partA = skeleton[j][0];
            const partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}

class Particle {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.acceleration = createVector(0, 0.05); // 중력 효과
        this.radius = 5;
        this.alpha = 255; // 초기 투명도
        this.fadeSpeed = 255 / 3; // 3초에 걸쳐 투명도가 0이 되도록
    }
    
    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.alpha -= this.fadeSpeed * deltaTime / 1000; // deltaTime을 이용하여 시간 기반 투명도 감소
        this.alpha = constrain(this.alpha, 0, 255); // 투명도가 음수가 되지 않도록 제한
    }

    display() {
        fill(255, 0, 0, this.alpha); // 투명도 설정
        noStroke();
        ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
    }

    isFaded() {
        return this.alpha <= 0; // 투명도가 0 이하일 때 true 반환
    }
}