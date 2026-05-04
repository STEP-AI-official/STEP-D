# YouTube 배포 백엔드 구현 지시서

> 프론트엔드가 이미 완성된 상태입니다.  
> 이 문서의 엔드포인트·요청·응답 스펙을 **그대로** 맞춰 구현하면 됩니다.  
> Base URL: `https://api.stepd.co.kr`

---

## 전체 흐름 요약

```
1. 운영자가 서버에서 YouTube OAuth 인증 (1회 설정)
   → 서버 DB에 access_token / refresh_token 저장

2. 사용자가 합성 완료 (POST .../compose → output_url 반환)

3. 사용자가 업로드 요청
   POST /api/projects/{pid}/shorts/{sid}/publish/youtube
   → 서버가 백그라운드 worker에 job 등록 → job_id 즉시 반환

4. 프론트가 3초마다 job 상태 폴링
   GET /api/projects/{pid}/shorts/{sid}/publish/jobs/{job_id}
   → pending → uploading(progress_pct 0-100) → processing → done

5. done 시 youtube_video_id, youtube_url 반환
   → 프론트가 DB에 저장된 이력 표시
```

---

## 구현할 엔드포인트 (총 6개)

---

### 1. `GET /api/youtube/channels`

연결된 YouTube 채널 목록 반환.  
운영자가 OAuth로 연결한 채널들. 일반 사용자도 조회 가능 (본인 채널이 없으면 빈 배열).

**Response 200**
```json
{
  "channels": [
    {
      "id": "UCxxxxxxxxxxxxxx",
      "title": "STEP D 공식",
      "thumbnail_url": "https://yt3.ggpht.com/...",
      "custom_url": "@stepd_official"
    }
  ]
}
```

- 연결된 채널 없으면: `{ "channels": [] }` (에러 아님)
- DB의 `youtube_credentials` 테이블에서 `is_active=true` 채널 조회

---

### 2. `POST /api/projects/{pid}/shorts/{sid}/publish/youtube`

업로드 job을 생성하고 즉시 `job_id` 반환.  
실제 업로드는 백그라운드 worker에서 처리.

**인증**: Bearer 토큰 필수 (로그인 사용자만)

**Request Body**
```json
{
  "title": "AI가 만든 다큐 1화 - 제주도의 봄",
  "description": "STEP D AI 파이프라인으로 생성된 다큐멘터리입니다.\n\n#AI다큐 #STEPD",
  "tags": ["AI다큐", "STEPD", "다큐멘터리"],
  "privacy_status": "private",
  "channel_id": "UCxxxxxxxxxxxxxx",
  "notify_subscribers": false
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | string | ✅ | 100자 이내 |
| `description` | string | | 5000자 이내 |
| `tags` | string[] | | 개당 30자 이내, 최대 500자 합산 |
| `privacy_status` | `'private'`\|`'unlisted'`\|`'public'` | ✅ | |
| `channel_id` | string\|null | | null이면 기본 채널 |
| `notify_subscribers` | boolean | | 기본 false |

**서버 처리 순서**
1. `shorts` 테이블에서 `compose_output_path` (합성 결과 파일 경로) 확인
2. 파일 존재 확인 — 없으면 422 반환
3. `youtube_publish_jobs` 테이블에 job 레코드 INSERT (status='pending')
4. worker queue에 job_id 추가
5. 즉시 응답 반환

**Response 200**
```json
{
  "job_id": "pub_a1b2c3d4e5f6"
}
```

**Response 422** — 합성 파일 없음
```json
{
  "detail": "compose_output not found. Run compose first."
}
```

---

### 3. `GET /api/projects/{pid}/shorts/{sid}/publish/jobs/{job_id}`

업로드 job의 현재 상태 조회. 프론트가 3초 간격으로 폴링.

**Response 200**
```json
{
  "job_id": "pub_a1b2c3d4e5f6",
  "status": "uploading",
  "progress_pct": 47,
  "youtube_video_id": null,
  "youtube_url": null,
  "error": null,
  "created_at": "2026-05-04T10:23:00Z",
  "updated_at": "2026-05-04T10:23:45Z"
}
```

**status 값 정의**

| status | 의미 | `progress_pct` |
|--------|------|----------------|
| `pending` | worker 대기 중 | null |
| `uploading` | YouTube로 파일 전송 중 | 0–100 |
| `processing` | YouTube 서버 내부 처리 중 | null |
| `done` | 업로드 완료 | 100 |
| `error` | 실패 | null |

**done 시 응답**
```json
{
  "job_id": "pub_a1b2c3d4e5f6",
  "status": "done",
  "progress_pct": 100,
  "youtube_video_id": "dQw4w9WgXcQ",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "error": null
}
```

**error 시 응답**
```json
{
  "job_id": "pub_a1b2c3d4e5f6",
  "status": "error",
  "progress_pct": null,
  "youtube_video_id": null,
  "youtube_url": null,
  "error": "quotaExceeded: The request cannot be completed because you have exceeded your quota."
}
```

---

### 4. `GET /api/projects/{pid}/shorts/{sid}/publish/history`

이 short의 전체 업로드 이력 (최신순).

**Response 200**
```json
{
  "publishes": [
    {
      "job_id": "pub_a1b2c3d4e5f6",
      "status": "done",
      "youtube_video_id": "dQw4w9WgXcQ",
      "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "privacy_status": "private",
      "title": "AI가 만든 다큐 1화",
      "published_at": "2026-05-04T10:30:00Z",
      "created_at": "2026-05-04T10:23:00Z"
    }
  ]
}
```

---

### 5. `GET /api/youtube/publishes` (어드민 전용)

전체 프로젝트의 YouTube 배포 이력. 어드민 Videos 페이지에서 사용.

**인증**: 어드민 role 필요

**Query params**

| 파라미터 | 기본값 | 설명 |
|---------|--------|------|
| `limit` | 50 | 최대 200 |
| `offset` | 0 | |
| `status` | | 필터: `done`\|`uploading`\|`error` 등 |

**Response 200**
```json
{
  "total": 42,
  "publishes": [
    {
      "job_id": "pub_a1b2c3d4e5f6",
      "short_id": "short_xyz",
      "short_title": "1화 - 제주도의 봄",
      "project_id": "proj_abc",
      "project_title": "제주 다큐 시리즈",
      "status": "done",
      "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "privacy_status": "private",
      "published_at": "2026-05-04T10:30:00Z",
      "created_at": "2026-05-04T10:23:00Z"
    }
  ]
}
```

---

### 6. `GET /api/youtube/oauth/connect` (운영자 1회 설정)

YouTube OAuth 인증 시작. 브라우저를 Google 동의 화면으로 리다이렉트.

**Query**: `?redirect_uri=https://admin.stepd.co.kr/oauth/callback`

**처리**
1. Google OAuth URL 생성 (scope: `youtube.upload`)
2. 302 리다이렉트

---

## DB 테이블 설계

### `youtube_credentials`
```sql
CREATE TABLE youtube_credentials (
    id              SERIAL PRIMARY KEY,
    channel_id      VARCHAR(64) NOT NULL UNIQUE,
    channel_title   VARCHAR(255),
    thumbnail_url   TEXT,
    custom_url      VARCHAR(128),
    access_token    TEXT NOT NULL,
    refresh_token   TEXT NOT NULL,
    token_expiry    TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `youtube_publish_jobs`
```sql
CREATE TABLE youtube_publish_jobs (
    job_id          VARCHAR(32) PRIMARY KEY,   -- 'pub_' + nanoid(12)
    short_id        VARCHAR(64) NOT NULL REFERENCES shorts(id),
    project_id      VARCHAR(64) NOT NULL,
    user_id         VARCHAR(64),               -- 업로드 요청한 사용자
    channel_id      VARCHAR(64),
    title           VARCHAR(100) NOT NULL,
    description     TEXT,
    tags            JSONB DEFAULT '[]',
    privacy_status  VARCHAR(16) DEFAULT 'private',
    notify_subscribers BOOLEAN DEFAULT false,
    status          VARCHAR(16) DEFAULT 'pending',
    progress_pct    SMALLINT,
    youtube_video_id VARCHAR(32),
    youtube_url     TEXT,
    error           TEXT,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON youtube_publish_jobs (short_id);
CREATE INDEX ON youtube_publish_jobs (status);
```

---

## Worker 구현 가이드

### 업로드 방식: Resumable Upload

일반 `multipart/form-data` 업로드는 파일 크기 제한(5MB) 때문에 영상에 사용 불가.  
반드시 **YouTube Resumable Upload** 방식 사용.

```
1. POST https://www.googleapis.com/upload/youtube/v3/videos
   ?uploadType=resumable
   Headers: Authorization: Bearer {access_token}
   Body: video metadata (snippet + status)
   → Response Header의 Location: {upload_session_uri}

2. PUT {upload_session_uri}
   Headers:
     Content-Type: video/mp4
     Content-Length: {file_size}
     Content-Range: bytes 0-{file_size-1}/{file_size}
   Body: 파일 바이너리 스트림
   → 청크 단위 업로드 (8MB 단위 권장)
   → 업로드 중 progress_pct = uploaded_bytes / total_bytes * 100
      → DB에 progress_pct 업데이트
```

### access_token 갱신
```
token_expiry 도달 시 자동 refresh:
POST https://oauth2.googleapis.com/token
  grant_type=refresh_token
  refresh_token={stored_refresh_token}
  client_id={GOOGLE_CLIENT_ID}
  client_secret={GOOGLE_CLIENT_SECRET}
→ 새 access_token + expiry DB에 저장
```

### Worker 상태 업데이트 타이밍

| 시점 | DB status | progress_pct |
|------|-----------|--------------|
| worker 시작 | `uploading` | 0 |
| 청크 업로드마다 | `uploading` | 현재 % |
| 전송 완료 | `processing` | null |
| YouTube insert 완료 | `done` | 100 |
| 예외 발생 | `error` | null |

---

## 환경변수

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://api.stepd.co.kr/api/youtube/oauth/callback
YOUTUBE_DEFAULT_CATEGORY_ID=22   # 22 = People & Blogs
```

---

## 에러 코드 처리

| YouTube 에러 | 처리 방법 |
|-------------|----------|
| `quotaExceeded` | job status='error', error 메시지 그대로 저장. 재시도 불가 |
| `forbidden` | token 만료 → refresh 후 1회 재시도 |
| `uploadLimitExceeded` | status='error', 사유 저장 |
| 네트워크 오류 | 3회까지 자동 재시도 (exponential backoff 5s/15s/45s) |

---

## 체크리스트

```
□ youtube_credentials 테이블 생성
□ youtube_publish_jobs 테이블 생성
□ GET  /api/youtube/oauth/connect   (OAuth 시작)
□ GET  /api/youtube/oauth/callback  (OAuth 콜백, credentials DB 저장)
□ GET  /api/youtube/channels        (채널 목록)
□ POST /api/projects/{pid}/shorts/{sid}/publish/youtube  (job 생성)
□ GET  /api/projects/{pid}/shorts/{sid}/publish/jobs/{job_id}  (상태 폴링)
□ GET  /api/projects/{pid}/shorts/{sid}/publish/history  (이력)
□ GET  /api/youtube/publishes       (어드민 전체 이력)
□ Worker: Resumable Upload 구현
□ Worker: access_token 자동 갱신
□ Worker: progress_pct 청크마다 DB 업데이트
□ 환경변수 설정
```
