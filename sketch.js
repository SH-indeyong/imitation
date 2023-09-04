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

let trigger = false;

let mediaRecorder;
let isRecording = false;
let recordedChunks = [];
let recordedVideo;


function preload() {
    audio = loadSound("Flying.mp3");
}

function setup() {
    createCanvas(640, 480);
    backgroundColor = color(0, 0, 0); // 흰
    video = createCapture(VIDEO);
    video.hide();
    poseNet = ml5.poseNet(video, onPoseNetModelReady);
    poseNet.on('pose', onPoseDetected);
    analyzer = new p5.Amplitude();  // Amplitude 분석기 생성
    analyzer.setInput(audio);  // 분석기에 오디오 연결

    // 미디어 레코더 초기화
    let stream = canvas.captureStream();
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = saveRecording;
    mediaRecorder.onstop = displayRecordedVideo;
}

function draw() {
    // background(220);
    if (!trigger) {
        image(video, 0, 0, width, height);
    } else {
        image(recordedVideo, 0, 0, width, height);
    }

    let volume = analyzer.getLevel();

    if (!trigger) {
        for (let i = 0; i < currentPoses.length; i++) {
            const pose = currentPoses[i].pose;
            if (pose.keypoints.length > 0) {
                // leftWrist, rightWrist, leftAnkle, rightAnkle 키포인트만 사용
                const keypointNames = ['leftWrist', 'rightWrist', 'leftAnkle', 'rightAnkle'];
                for (let j = 0; j < pose.keypoints.length; j++) {
                    const keypoint = pose.keypoints[j];
                    if (keypointNames.includes(keypoint.part) && keypoint.score > 0.05) {
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
    }

    if (!isRecording && millis() > 5000) {
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
    recordedChunks = []; // 초기화
    mediaRecorder.start();
    isRecording = true;
    console.log('recording...');
    audio.play(); // Start playing audio when recording starts
    setTimeout(stopRecording, 20000); // 20초 후 녹음 중지
}

function stopRecording() {
    mediaRecorder.stop(); // 녹화 중지
    audio.stop();
    isRecording = false;
    console.log('recording stop');
}

function saveRecording(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

function displayRecordedVideo() {
    let blob = new Blob(recordedChunks, { type: 'video/webm' });
    let url = URL.createObjectURL(blob);

    trigger = true;
    console.log(trigger);

    recordedVideo = createVideo(url);
    recordedVideo.position(10, 10);
    recordedVideo.size(640, 480);
    recordedVideo.loop(); // 자동으로 비디오 재생
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