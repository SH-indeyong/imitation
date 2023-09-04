// 변수 초기화
let audio;
let analyzer;
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
    // 오디오 파일 로드
    audio = loadSound("Flying.mp3");
}

function setup() {
    createCanvas(640, 480);
    // 웹캠 비디오 캡쳐
    video = createCapture(VIDEO);
    video.hide();
    // 포즈 감지 모델 설
    poseNet = ml5.poseNet(video, onPoseNetModelReady);
    poseNet.on('pose', onPoseDetected);
    // Amplitude 분석기 생성
    analyzer = new p5.Amplitude();
    // 분석기에 오디오 연결
    analyzer.setInput(audio);

    // 미디어 레코더 초기화
    let stream = canvas.captureStream();
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = saveRecording;
    mediaRecorder.onstop = displayRecordedVideo;
}

function draw() {
    // background(220);
    if (!trigger) {
        // 웹캠 비디오를 캔버스에 그림
        image(video, 0, 0, width, height);
    } else {
        // 녹화된 비디오를 캔버스에 그림
        image(recordedVideo, 0, 0, width, height);
    }

    let volume = analyzer.getLevel();

    if (!trigger) {
        // 포즈 감지된 포즈들에 대해 파티클 생성
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

        // 파티클 업데이트 및 표시
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
        // 녹화 시
        startRecording();
        console.log('recording...')
    }
}

function onPoseNetModelReady() {
    console.log("PoseNet model is ready!");
}

function onPoseDetected(poses) {
    // 현재 감지된 포즈 정보 업데이트
    currentPoses = poses;
}

function startRecording() {
    recordedChunks = [];
    mediaRecorder.start();              // 녹화 시작
    isRecording = true;
    console.log('recording...');        // 녹화 중 상태
    audio.play();                       // 녹화 시작 시 오디오 재생
    setTimeout(stopRecording, 20000);   // 20초 후 녹음 중지
}

function stopRecording() {
    mediaRecorder.stop();               // 녹화 중지
    audio.stop();                       // 오디오 재생 중지
    isRecording = false;                // 녹화 중지 상태
    console.log('recording stop');
}

function saveRecording(event) {
    if (event.data.size > 0) {
        // 녹화된 데이터 청크 저장
        recordedChunks.push(event.data);
    }
}

function displayRecordedVideo() {
    // Blob 객체 생성
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
        this.position = createVector(x, y);                             // 파티클의 위치 벡터 설정
        this.velocity = createVector(random(-1, 1), random(-1, 1));     // 파티클의 속도 벡터 설정
        this.size = map(volume, 0, 1, 1, 10);                           // 음량에 따라 크기 변경
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
        // 파티클 위치 업데이트
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