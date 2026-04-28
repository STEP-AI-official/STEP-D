/* Seed data for ShortsForge prototype */

const API_BASE = 'http://localhost:8766';

const api = {
  async get(path) {
    const r = await fetch(API_BASE + path);
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
    return r.json();
  },
  async del(path) {
    const r = await fetch(API_BASE + path, { method: 'DELETE' });
    if (!r.ok) throw new Error(`DELETE ${path} → ${r.status}`);
    return r.json();
  },
  sse(path, onMessage, onError) {
    const es = new EventSource(API_BASE + path);
    es.onmessage = (e) => onMessage(e.data);
    es.onerror = (e) => { if (onError) onError(e); es.close(); };
    return es;
  },
  mediaUrl(jobId, filePath) {
    return `${API_BASE}/api/media/${jobId}/${filePath}`;
  }
};

window.API_BASE = API_BASE;
window.api = api;

/* job status → UI status mapping */
const jobStatusToUi = (job) => {
  const s = job.status;
  if (s === 'done') return 'done';
  if (s === 'failed') return 'draft';
  if (s === 'scenario_pending' || s === 'scenario_generating') return 'scripting';
  if (s === 'scenario_done' || s === 'cast_pending' || s === 'cast_generating') return 'generating';
  if (s === 'cast_done' || s === 'clips_pending' || s === 'clips_generating') return 'rendering';
  return 'draft';
};

const jobToProject = (job) => ({
  id: job.id,
  title: job.topic || '제목 없음',
  genre: 'AI 생성',
  duration: 60,
  sceneCount: job.scene_count || 9,
  progress: job.progress || 0,
  status: jobStatusToUi(job),
  cover: ['rose','mint','violet','blue','orange'][parseInt(job.id, 36) % 5] || 'mint',
  updatedAt: job.updated_at ? new Date(job.updated_at).toLocaleString('ko') : '방금',
  thumb: job.topic || '',
  _raw: job
});

window.jobStatusToUi = jobStatusToUi;
window.jobToProject = jobToProject;

window.APP_DATA = {
  projects: [
    {
      id: 'p1',
      title: '비 오는 날의 편의점',
      genre: 'K-드라마 · 로맨스',
      duration: 58,
      sceneCount: 9,
      progress: 72,
      status: 'rendering',
      cover: 'rose',
      updatedAt: '2분 전',
      thumb: '편의점 우산'
    },
    {
      id: 'p2',
      title: '오피스 메이트',
      genre: '시트콤 · 로맨스',
      duration: 45,
      sceneCount: 7,
      progress: 100,
      status: 'done',
      cover: 'mint',
      updatedAt: '어제',
      thumb: '커피 머신'
    },
    {
      id: 'p3',
      title: '마지막 지하철',
      genre: '멜로 · 드라마',
      duration: 60,
      sceneCount: 10,
      progress: 34,
      status: 'generating',
      cover: 'violet',
      updatedAt: '3시간 전',
      thumb: '지하철 창가'
    },
    {
      id: 'p4',
      title: '첫눈 오는 새벽',
      genre: 'K-드라마 · 로맨스',
      duration: 52,
      sceneCount: 8,
      progress: 15,
      status: 'scripting',
      cover: 'blue',
      updatedAt: '방금',
      thumb: '골목 눈'
    },
    {
      id: 'p5',
      title: '도서관에서',
      genre: '청춘 · 로맨스',
      duration: 48,
      sceneCount: 8,
      progress: 100,
      status: 'done',
      cover: 'orange',
      updatedAt: '2일 전',
      thumb: '책장 사이'
    },
    {
      id: 'p6',
      title: '버스 정류장',
      genre: '잔잔 · 드라마',
      duration: 55,
      sceneCount: 9,
      progress: 0,
      status: 'draft',
      cover: 'mint',
      updatedAt: '5일 전',
      thumb: '정류장 노을'
    }
  ],

  // Node graph for active project (p1)
  nodes: [
    { id: 'n1', type: 'prompt', title: '프롬프트', x: 80, y: 280, status: 'done',
      meta: '주제·톤·길이', summary: 'K-드라마 감성 / 58초 / 9씬' },
    { id: 'n2', type: 'script', title: '시나리오', x: 340, y: 280, status: 'done',
      meta: '씬 9개 · PDF', summary: '비 오는 날의 편의점' },
    { id: 'n3', type: 'character', title: '등장인물', x: 620, y: 140, status: 'done',
      meta: '3명 생성', summary: '서연, 지훈, 점주' },
    { id: 'n4', type: 'background', title: '배경 / 구도', x: 620, y: 420, status: 'done',
      meta: '9씬 · 27컷', summary: '편의점, 골목, 버스정류장' },
    { id: 'n5', type: 'render', title: '씬 영상 생성', x: 920, y: 280, status: 'active',
      meta: '6/9 완료', summary: '렌더링 중 (씬 7)' },
    { id: 'n6', type: 'compose', title: '합성·내보내기', x: 1200, y: 280, status: 'pending',
      meta: 'MP4 · 9:16', summary: '대기 중' }
  ],

  edges: [
    { from: 'n1', to: 'n2' },
    { from: 'n2', to: 'n3' },
    { from: 'n2', to: 'n4' },
    { from: 'n3', to: 'n5' },
    { from: 'n4', to: 'n5' },
    { from: 'n5', to: 'n6' }
  ],

  scenes: [
    { id: 's1', num: 1, title: '오프닝 — 쏟아지는 비',
      location: '도심 골목 / 밤 / 비',
      duration: 6.2,
      action: '서연이 얇은 카디건을 끌어안고 비를 피해 뛰어간다. 머리카락이 흠뻑 젖어 있다.',
      dialogue: [
        { who: '서연 (독백)', line: '...하필 오늘따라.' }
      ],
      status: 'done',
      camera: '로우 앵글 트래킹',
      mood: '외로움, 기대' },
    { id: 's2', num: 2, title: '편의점 불빛',
      location: '편의점 앞 / 밤 / 비',
      duration: 5.8,
      action: '빗속에서 노란 편의점 간판이 번져 보인다. 서연이 문을 밀고 들어간다.',
      dialogue: [],
      status: 'done',
      camera: '풀샷 → 미디움',
      mood: '안도' },
    { id: 's3', num: 3, title: '첫 만남',
      location: '편의점 내부 / 밤',
      duration: 7.4,
      action: '우산 코너 앞. 손이 마지막 남은 투명 우산에 동시에 닿는다. 두 사람 시선이 마주친다.',
      dialogue: [
        { who: '지훈', line: '...먼저 드릴게요.' },
        { who: '서연', line: '아, 아니에요. 괜찮아요.' }
      ],
      status: 'done',
      camera: '클로즈업 손 → 아이레벨',
      mood: '설렘, 망설임' },
    { id: 's4', num: 4, title: '양보',
      location: '편의점 내부 / 밤',
      duration: 6.0,
      action: '지훈이 우산을 서연에게 건넨다. 서연이 고개를 숙여 인사한다.',
      dialogue: [
        { who: '지훈', line: '저는 바로 근처라서요.' }
      ],
      status: 'done',
      camera: '오버 더 숄더',
      mood: '따뜻함' },
    { id: 's5', num: 5, title: '나서는 길',
      location: '편의점 앞 / 밤 / 비',
      duration: 5.5,
      action: '서연이 우산을 펴고 뒤돌아본다. 유리창 너머 지훈이 컵라면을 고르고 있다.',
      dialogue: [],
      status: 'done',
      camera: '유리창 반영 샷',
      mood: '미련' },
    { id: 's6', num: 6, title: '돌아서다',
      location: '골목 / 밤 / 비',
      duration: 5.2,
      action: '몇 걸음 걷다 멈춘다. 다시 편의점 쪽으로 고개를 돌린다.',
      dialogue: [
        { who: '서연 (독백)', line: '...이대로 가도 되나.' }
      ],
      status: 'done',
      camera: '핸드헬드',
      mood: '결심' },
    { id: 's7', num: 7, title: '우산 두 개',
      location: '편의점 앞 / 밤 / 비',
      duration: 7.0,
      action: '서연이 다른 우산을 하나 더 사서 돌아온다. 지훈이 밖에 나와 있다.',
      dialogue: [
        { who: '서연', line: '...같이 쓰실래요?' }
      ],
      status: 'rendering',
      progress: 64,
      camera: '미디움 투샷',
      mood: '용기' },
    { id: 's8', num: 8, title: '나란히',
      location: '골목 / 밤 / 비',
      duration: 7.6,
      action: '두 사람이 각자의 우산을 쓰고 나란히 걷는다. 어깨가 스친다.',
      dialogue: [
        { who: '지훈', line: '이름... 물어봐도 돼요?' }
      ],
      status: 'queued',
      camera: '팔로우 트래킹',
      mood: '두근거림' },
    { id: 's9', num: 9, title: '엔딩 — 번지는 불빛',
      location: '버스 정류장 / 밤 / 비',
      duration: 7.3,
      action: '두 사람이 버스 정류장에 도착한다. 카메라가 뒤로 빠지며 빗방울에 번지는 도시 불빛을 담는다.',
      dialogue: [
        { who: '서연', line: '서연이에요.' }
      ],
      status: 'queued',
      camera: '돌리 아웃',
      mood: '여운' }
  ],

  characters: [
    { id: 'c1', name: '서연', role: '주인공 (24)', chip: 'mint',
      desc: '긴 생머리, 얇은 카디건, 짙은 눈동자. 말수 적고 사려 깊음.',
      refs: ['정면', '3/4 측면', '전신', '표정: 놀람'] },
    { id: 'c2', name: '지훈', role: '주인공 (26)', chip: 'blue',
      desc: '짧은 흑발, 베이지 후드, 검은 안경. 차분하고 다정한 성격.',
      refs: ['정면', '측면', '전신', '표정: 미소'] },
    { id: 'c3', name: '점주', role: '조연 (40대)', chip: 'orange',
      desc: '편의점 유니폼, 안경, 무심한 듯 친절한 표정.',
      refs: ['정면', '3/4 측면'] }
  ]
};
