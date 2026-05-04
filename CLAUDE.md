# STEP D — Claude Code 가이드

## AI 행동 원칙

### 1. 구현 전에 먼저 생각하기
- 가정은 명시적으로 밝힌다. 불확실하면 묻는다.
- 해석이 여러 가지면 선택지를 제시한다 — 조용히 하나를 고르지 않는다.
- 더 단순한 방법이 있으면 말한다. 근거가 있으면 반론한다.
- 헷갈리는 게 있으면 멈추고, 무엇이 불명확한지 명시한 뒤 묻는다.

### 2. 단순함 우선
- 요청된 것만 구현한다. 추측성 기능 없음.
- 단일 용도 코드에 추상화 없음.
- 요청하지 않은 "유연성"이나 "확장성" 없음.
- 200줄로 쓰고 50줄로 될 수 있으면 다시 쓴다.
- "시니어 엔지니어가 과하다고 할까?" → 그렇다면 단순화.

### 3. 외과적 수정
- 반드시 바꿔야 하는 것만 건드린다.
- 인접 코드·주석·포매팅을 "개선"하지 않는다.
- 고장나지 않은 건 리팩토링하지 않는다.
- 기존 스타일을 그대로 따른다.
- **내가 만든 변경이 남긴 고아**(미사용 import/변수/함수)는 즉시 제거한다.
- 기존에 있던 사용하지 않는 코드는 언급만 하고 삭제하지 않는다.
- 모든 변경 라인은 요청으로 직접 추적 가능해야 한다.

### 4. 목표 기반 실행
다단계 작업은 검증 기준과 함께 계획을 먼저 제시한다:
```
1. [단계] → 검증: [확인 방법]
2. [단계] → 검증: [확인 방법]
```
"동작하게 만들기" 같은 약한 기준 대신, 구체적으로 성공/실패를 판별할 수 있는 기준을 정한다.

---

## 프로젝트 개요

**AI 다큐멘터리 자동 제작 파이프라인.**  
사용자가 주제를 입력하면 AI가 시나리오·캐릭터·씬 이미지·씬 영상·최종 합성까지 자동 생성.  
목표 품질 레퍼런스: **Hecksfield** 수준의 고품질 AI 영상 다큐.

사용자 앱(`src/`)과 운영자 어드민(`admin/src/`)이 **완전 분리된 Vite 프로젝트** 2개로 구성됩니다.  
백엔드(Python/FastAPI, 포트 8766)는 이 레포에 없음 — 프론트엔드 레포만 여기에 있습니다.

---

## 모노레포 구조

```
STEP D front/
├── src/                    # 사용자 앱 (포트 5173)
│   ├── api/                # HTTP 클라이언트 모듈 (12개)
│   ├── components/         # React 뷰 컴포넌트 (21개)
│   └── lib/                # auth.js, firebase.js
├── admin/                  # 운영자 어드민 (포트 5174)
│   └── src/
│       ├── pages/          # 어드민 페이지 (10개)
│       ├── App.jsx         # 어드민 라우터 (NAV/ICONS/content 매핑)
│       ├── Login.jsx
│       └── api.js          # 어드민 전용 HTTP 클라이언트
├── api/                    # Vercel Serverless Functions
│   └── notify.js           # Slack/Gmail 알림
├── vite.config.js          # 사용자 앱 빌드 설정
├── API_SPEC.md             # 백엔드 API 명세 (프론트 기준)
└── index.html
```

---

## 앱 1 — 사용자 앱 (`src/`)

### 개발 서버
```bash
npm run dev        # 포트 5173
```
`/api/*` → `http://localhost:8766` 프록시 (Vite)

### 뷰 흐름 (view 상태로 전환)

```
dashboard
  └─ 프로젝트 선택 → home
       └─ 숏츠 선택 → canvas (워크플로우 허브)
            ├─ script        시나리오 편집
            ├─ characters    등장인물 이미지 생성
            ├─ background    배경/구도 설정
            ├─ scene-image   씬 이미지 생성  ← SceneImageView
            ├─ render        씬 영상 생성    ← RenderView
            └─ export        타임라인 편집기 + 합성  ← ExportView
```

`src/App.jsx`의 `view` state가 라우터 역할. `localStorage('sf:view')`로 탭 복원
(단, `scene-image`는 생성 중 버그 방지를 위해 복원 안 함).

### AI 생성 파이프라인 단계

| 단계 | short.stage | short.status | 설명 |
|------|------------|--------------|------|
| 1 | `preproduction` | — | 주제·장르·어조 기획 (SSE 채팅) |
| 2 | `scenario` | `generating` → `choosing` | 시나리오 자동 생성 |
| 3 | `cast` | `choosing` | 캐릭터 등록·이미지 생성 |
| 4 | `scene_image` | `generating` → `choosing` | 씬별 컷 이미지 생성 (GPT-image-1) |
| 5 | `scene_video` | `generating` → `choosing` | 씬별 영상 생성 (Kling v2.1/v1.6) |
| 6 | `done` | — | 합성·내보내기 가능 |

`short.stage + short.status` 조합으로 현재 단계를 판별. SSE(`/api/.../progress`)로 실시간 폴링.

### API 클라이언트 (`src/api/`)

`src/api/client.js`의 `http` 객체를 기반으로 모든 모듈이 구성됨.

```js
import { http } from './client';

http.get(path)           // → json
http.post(path, body)    // → json
http.patch(path, body)   // → json
http.put(path, body)     // → json
http.del(path)           // → json
http.sse(path, onEvent)  // → EventSource (SSE)
http.mediaUrl(pid, path) // → /api/media/{pid}/{path}
```

`src/api.js`(루트)는 별도의 `api` 객체 — 어드민 `api.js`와 같은 인터페이스 (`get/post/patch/put/del`).
컴포넌트에서는 `import { api } from '../api'` 형태로 사용.

### 주요 컴포넌트

| 파일 | 역할 |
|------|------|
| `Chrome.jsx` | Topbar + Sidebar (앱 셸) |
| `NewProjectWizard.jsx` | 프로젝트 생성 마법사 |
| `PreProductionChat.jsx` | 기획 단계 SSE 채팅 |
| `ScriptView.jsx` | 시나리오 뷰·편집 |
| `CharactersView.jsx` | 캐릭터 이미지 생성 |
| `BackgroundView.jsx` | 배경·구도 설정 |
| `SceneImageView.jsx` | 씬 이미지 생성 (3열: 씬목록 / 프리뷰 / 씬패널) |
| `RenderView.jsx` | 씬 영상 생성 |
| `ExportView.jsx` | **타임라인 편집기** — 플레이헤드·클립 자르기·나레이션 배치·합성 |
| `TweaksPanel.jsx` | CSS 변수 실시간 편집 (편집모드) |

### 인증

`src/lib/auth.js` + Firebase (`src/lib/firebase.js`).  
`localStorage('auth_token')`에 JWT 저장. 모든 API 요청에 `Authorization: Bearer {token}` 첨부.  
Google OAuth 리다이렉트 로그인 방식 사용.

---

## 앱 2 — 운영자 어드민 (`admin/`)

### 개발 서버
```bash
cd admin && npm run dev    # 포트 5174
```
`/api/*` → `https://api.stepd.co.kr` 직접 프록시 (프로덕션 API 연결)

### 어드민 페이지 구조

`admin/src/App.jsx`의 `NAV` 배열 + `ICONS` 객체 + `content` 매핑 3곳을 **항상 같이** 수정.  
새 페이지 추가 시 `admin/src/pages/`에 파일 생성 + App.jsx 3곳 추가.

| 섹션 | id | 파일 | 설명 |
|------|-----|------|------|
| 개요 | `dashboard` | Dashboard.jsx | 전체 현황 |
| 개요 | `analytics` | Analytics.jsx | 통계·분석 |
| 데이터 | `users` | Users.jsx | 사용자 관리 |
| 데이터 | `projects` | Projects.jsx | 프로젝트 관리 |
| 데이터 | `shorts` | Shorts.jsx | 숏츠 관리 |
| 데이터 | `videos` | Videos.jsx | 영상 태깅 |
| 콘텐츠 | `rag` | Rag.jsx | RAG 데이터 수집·검색·AI Hub 임포트 |
| 콘텐츠 | `questions` | GuideQuestions.jsx | 가이드 질문 관리 |
| 시험 | `lab` | Lab.jsx | 운영자 격리 프로젝트 (파이프라인 시험) |
| 시스템 | `config` | Config.jsx | 설정 |

### 어드민 API 클라이언트 (`admin/src/api.js`)

```js
import { api } from '../api';

api.get(path)           // → json
api.post(path, body)    // → json
api.patch(path, body)   // → json
api.put(path, body)     // → json
api.del(path)           // → json
```

### RAG 시스템

`Rag.jsx`에서 관리. 카테고리: `docu_ko`, `docu_en`, `interview`, `narration`, `background_ko`.  
AI Hub 배경 데이터셋 임포트: `BackgroundIngestPanel` → `POST /rag/background/ingest-path` → job 폴링(1.5s).

### Lab (운영자 시험 환경)

`Lab.jsx` — `is_lab=true`인 격리 프로젝트. 운영자가 시나리오를 직접 입력해 파이프라인 전체를 시험.  
생성된 Lab 프로젝트는 본 앱(STEP-D) 대시보드에서도 열 수 있음 (role=admin 조건).

---

## 백엔드 API 주요 엔드포인트

상세 명세: `API_SPEC.md`

```
POST /api/projects                              프로젝트 생성
GET  /api/projects/{pid}/shorts/{sid}           숏츠 조회
GET  /api/projects/{pid}/shorts/{sid}/progress  SSE 진행 상황

POST /api/projects/{pid}/shorts/{sid}/cast/approve        씬 이미지 생성 시작
POST /api/projects/{pid}/shorts/{sid}/scene-image/approve 씬 영상 생성 시작

GET  /api/projects/{pid}/shorts/{sid}/cuts               컷 목록
PATCH /api/projects/{pid}/shorts/{sid}/cuts/{cutKey}      컷 수정 (카메라 구도 포함)
POST  /api/projects/{pid}/shorts/{sid}/cuts/{cutKey}/generate  컷 이미지 재생성

GET  /api/camera/options    카메라 구도 옵션 (shot_size / angle / camera_movement / speed)

GET  /rag/stats             RAG 통계
POST /rag/ingest            유튜브 URL 수집
POST /rag/search            RAG 검색 테스트

POST /lab/projects          Lab 프로젝트 생성
GET  /lab/projects          Lab 프로젝트 목록
PUT  /lab/projects/{pid}/scenes  씬 일괄 저장 + 컷 자동 생성
```

---

## YouTube 배포 파이프라인

### 흐름

```
타임라인 편집기 (ExportView)
  │
  ├─ [최종 합성] → POST /api/projects/{pid}/shorts/{sid}/compose
  │                  → composeResult.output_url (합성 영상 URL)
  │
  └─ [YouTube 업로드] → POST /api/projects/{pid}/shorts/{sid}/publish/youtube
                          payload: { title, description, tags[], privacy_status,
                                     channel_id, notify_subscribers }
                          → { job_id }
                          ↓ 3초마다 폴링
                        GET /api/projects/{pid}/shorts/{sid}/publish/jobs/{job_id}
                          → { status: pending|uploading|processing|done|error,
                              progress_pct, youtube_video_id, youtube_url }
```

### API 모듈 (`src/api/publish.js`)

| 함수 | 엔드포인트 | 설명 |
|------|-----------|------|
| `publishToYouTube(pid, sid, meta)` | POST `.../publish/youtube` | 업로드 요청 → job_id |
| `getPublishJob(pid, sid, jobId)` | GET `.../publish/jobs/{id}` | job 상태 폴링 |
| `listPublishes(pid, sid)` | GET `.../publish/history` | 업로드 이력 |
| `listYouTubeChannels()` | GET `/api/youtube/channels` | 연결된 채널 목록 |

### ExportView YouTube 패널 동작

- 합성 완료(`composeResult` 있음) 전까지 업로드 버튼 비활성
- `listYouTubeChannels()` 실패 시 패널은 열리되 채널 드롭다운 숨김 (채널 미연동 안내 표시)
- 업로드 job 폴링: `status === 'done' || 'error'` 시 `clearInterval`
- privacy 옵션: `private`(기본) → `unlisted` → `public` (사고 방지를 위해 기본값 비공개)

### 백엔드 요구사항 (프론트 → 백엔드 연동 체크리스트)

```
POST /api/youtube/channels                           OAuth 연결된 채널 목록
POST /api/projects/{pid}/shorts/{sid}/publish/youtube  업로드 job 생성
GET  /api/projects/{pid}/shorts/{sid}/publish/jobs/{id}  job 상태
GET  /api/projects/{pid}/shorts/{sid}/publish/history  이력
GET  /api/youtube/publishes?limit=N                  전체 배포 이력 (어드민용)
```

YouTube Data API v3 scope: `youtube.upload` (서버사이드 OAuth 2.0 필요)

### 어드민 Videos.jsx 변경사항

- `GET /youtube/publishes` 로 전체 배포 이력 로드 → short_id별 최신 1건 매핑
- 배포 현황 요약 카드 (게시됨 / 업로드 중 / 처리 중 / 오류 집계)
- 게시된 영상 별도 테이블 (YouTube 링크 포함)
- 컷 영상 테이블에 YouTube 상태 컬럼 추가 + `yt_status` 필터

---

## 카메라 구도 시스템

`SceneImageView.jsx`의 `ScenePanel`에서 컷별로 카메라 구도를 설정.  
`useCameraOptions()` 훅 — 앱 수명 동안 1회만 fetch (모듈 레벨 캐시 `_cameraOptionsCache`).

필드 우선순위: `comp_*` > 직접 필드 > 빈값(자동/AI 추천)

```js
cut.shot_size       // 샷 사이즈 (CU / MCU / MS / MLS / LS / ELS)
cut.angle           // 앵글 (eye / low / high / bird / dutch)
cut.camera_movement // 카메라 움직임 — structured_camera_keys에 포함 시 Kling v1.6 라우팅
cut.camera_speed    // 속도 (slow / normal / fast)
```

---

## CSS 설계 패턴

### 사용자 앱
CSS 변수 기반 다크 테마. `TweaksPanel`로 런타임 편집 가능.

```css
var(--mint)      /* 강조: 초록 민트 */
var(--violet)    /* 보조: 보라 */
var(--rose)      /* 경고/에러 */
var(--surface)   /* 카드 배경 */
var(--border)    /* 테두리 */
var(--text)      /* 본문 */
var(--text-3)    /* 흐린 텍스트 */
var(--font-mono) /* 모노스페이스 */
```

### 어드민
`admin/src/style.css` 유틸리티 클래스 기반.

```css
.card .flex .btn .btn-primary .btn-ghost .btn-sm .btn-danger
.badge .badge-mint .badge-blue .badge-violet .badge-orange
.mono .text-muted .ml-auto .gap-8
.page .page-header .page-title .page-sub
.table-wrap .input .spinner .modal .modal-backdrop
```

---

## 개발 주의사항

### 두 앱 공통
- 어드민(`admin/`)과 사용자 앱(`src/`)은 **독립된 node_modules**. 한 쪽 변경이 다른 쪽에 영향 없음.
- `api.del()` 메서드명 사용 (`delete`는 JS 예약어).
- SSE는 컴포넌트 언마운트 시 반드시 `es.close()` — useEffect cleanup으로 처리.

### 사용자 앱
- `view === 'scene-image'`는 `localStorage`에 저장하지 않음 (의도된 제한).
- `SceneImageView` 내 폴링: `setInterval(loadAll, 3000)` — `shortStatus === 'generating'`일 때만 동작.
- 컴포넌트에서 `http` 직접 import 금지 → `api` 객체 사용.

### 어드민
- App.jsx에 새 페이지 추가 시 `NAV`, `ICONS`, `content` 매핑 **3곳 동시** 수정 필수.
- `BackgroundIngestPanel`의 job 폴링: `job.status === 'done' || 'error'` 시 `clearInterval`.
- Lab 프로젝트는 일반 사용자에게 노출되지 않음 (`is_lab=true` 필터링은 백엔드 책임).

---

## 환경변수

### 사용자 앱 (`.env.development` / `.env.production`)
```
VITE_API_BASE_URL=https://api.stepd.co.kr   # 프로덕션 API URL
VITE_FIREBASE_*                              # Firebase 설정
```

### 어드민 (`admin/.env.development` / `admin/.env.production`)
```
VITE_API_BASE_URL=https://api.stepd.co.kr
VITE_ADMIN_*                                # 어드민 로그인 자격증명 (환경변수로 관리)
VITE_MAIN_APP_URL=https://stepd.co.kr       # Lab에서 본 앱 링크용
```

---

## 빌드 & 배포

```bash
# 사용자 앱
npm run build       # dist/ 출력

# 어드민
cd admin
npm run build       # admin/dist/ 출력
```

Vercel 배포. `vercel.json`으로 SPA 라우팅 및 Serverless Functions 설정.  
백엔드 API: `api.stepd.co.kr` (별도 서버, 이 레포에 없음).
