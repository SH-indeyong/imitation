let audio;
let analyzer;
let circles = [];
let video;
let poseNet;
let currentPoses = [];
let particles = [];
const numParticles = 50;
const baseColors = [
    [244, 227, 219], [239, 154, 154], [237, 230, 197], [237, 230, 197], [230, 130, 230]
];

let soundRecorder;
let isRecording = false;

function preload() {
    audio = loadSound("Flying.mp3");
}

function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, onPoseNetModelReady);
    poseNet.on('pose', onPoseDetected);
    analyzer = new p5.Amplitude();  // Amplitude 분석기 생성
    analyzer.setInput(audio);  // 분석기에 오디오 연결

    // Initiahe media recorder
    soundRecorder = new p5.SoundRecorder();
    soundRecorder.setInput(audio);

    recordedSound = new p5.SoundFile(); // 녹음된 오디오를 저장할 변수 초기화

    // audio.loop();  // 오디오 루프 재생
    //   circleSize = 10;

    //   for (let i = 0; i < 5; i++) {
    //     circles.push({ x: random(width), y: random(height), size: 10 });
    //   }
}

function draw() {
    // background(220); 
    image(video, 0, 0, width, height);

    let volume = analyzer.getLevel();

    for (let i = 0; i < currentPoses.length; i++) {
        const pose = currentPoses[i].pose;
        if (pose.keypoints.length > 0) {
            // 모든 키포인트에서 파티클 생성
            for (let j = 3; j < pose.keypoints.length; j++) {
                const keypoint = pose.keypoints[j];
                if (keypoint.score > 0.05) {
                    particles.push(new Particle(keypoint.position.x, keypoint.position.y, volume));
                }
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

    if (!isRecording && millis() > 5000) { // Start recording after 5s
        startRecording();
        console.log('recording...')
    }
}

function onPoseNetModelReady() {
    console.log("PoseNet model is ready!");
}

function onPoseDetected(poses) {
    currentPoses = poses;
}

function startRecording() {
    soundRecorder.record(recordedSound, 5); // 5초 동안 녹음 (원하는 시간으로 변경 가능)
    isRecording = true;
    audio.play(); // Start playing audio when recording starts
}

function saveRecording(blob) {
    // Automatically stop recording after 1 minute
    if (millis() > 30000) { // Stop recording after 30s
        soundRecorder.stop();
        isRecording = false;
        audio.stop(); // Stop audio when recording stops
    }
    save(blob, 'recorded_video.webm');
    console.log('video save')
}

class Particle {
    constructor(x, y, volume) {
        this.position = createVector(x, y);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.size = map(volume, 0, 1, 1, 10); // 음량에 따라 크기 변경
        this.alpha = 255;
        this.fadeSpeed = random(1, 5);

        const baseColor = baseColors[Math.floor(random(baseColors.length))];

        // 색상 조절
        const r = baseColor[0] + random(-20, 20);
        const g = baseColor[1] + random(-20, 20);
        const b = baseColor[2] + random(-20, 20);

        this.color = color(r, g, b);
    }

    update() {
        this.position.add(this.velocity);
        this.alpha -= this.fadeSpeed * deltaTime / 20;
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