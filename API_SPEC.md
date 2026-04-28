# AI Shorts — Backend API 명세서

> 프론트엔드 기준 / 더블체크용  
> Base URL: `http://localhost:8766`  
> Vite proxy: `/api/*` → `http://localhost:8766/*`  
> 모든 요청/응답 Content-Type: `application/json`

---

## 목차

1. [프로젝트](#1-프로젝트)
2. [숏츠](#2-숏츠)
3. [사전제작 (Pre-production)](#3-사전제작)
4. [시나리오](#4-시나리오)
5. [캐스트 (일괄)](#5-캐스트-일괄)
6. [캐릭터](#6-캐릭터)
7. [컷 (Cut)](#7-컷)
8. [구도 (Composition)](#8-구도)
9. [렌더 (Clip)](#9-렌더--클립)
10. [미디어](#10-미디어)
11. [공통 모델](#11-공통-모델)
12. [SSE 공통 규칙](#12-sse-공통-규칙)

---

## 1. 프로젝트

### `GET /projects`
프로젝트 목록 조회

**Response**
```json
{
  "projects": [Project]
}
```

---

### `POST /projects`
프로젝트 생성

**Request Body**
```json
{
  "title": "string"
}
```

**Response** → `Project`

---

### `GET /projects/{pid}`
프로젝트 단건 조회

**Response**
```json
{
  "id": "string",
  "title": "string",
  "shorts_count": 0,
  "characters_count": 0,
  "locations_count": 0,
  "shorts": [Short],
  "characters": [Character],
  "locations": [Location],
  "created_at": "ISO8601"
}
```

---

## 2. 숏츠

### `POST /projects/{pid}/shorts`
숏츠 생성

**Request Body**
```json
{
  "title": "string",
  "preproduction_doc": {
    "title": "string",
    "genre": "string",
    "tone": "string",
    "logline": "string",
    "theme": "string",
    "characters": [{ "name": "string", "role": "string", "want": "string" }],
    "plot_points": { "ending": "string" }
  }
}
```

**Response** → `Short`

---

### `GET /projects/{pid}/shorts/{shortId}`
숏츠 단건 조회

**Response** → `Short`

---

### `GET /projects/{pid}/shorts/{shortId}/progress` *(SSE)*
숏츠 생성 진행 상황 스트리밍

**SSE 이벤트**
```json
{ "status": "string", "stage": "string" }
```

---

## 3. 사전제작

> 두 엔드포인트 모두 **POST + ReadableStream** 방식으로 SSE를 반환합니다.  
> `Content-Type: text/event-stream`, 각 이벤트는 `data: {...}\n\n` 형식.

### `POST /projects/{pid}/preproduction/chat`
AI 채팅 — 사전제작 문서 작성 보조

**Query Params**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `message` | string | 사용자 입력 메시지 |
| `urls` | string | 참조 URL (콤마 구분, 선택) |

**SSE 이벤트**
```json
{ "type": "message", "text": "string" }
{ "type": "suggestions", "items": ["string"] }
{ "type": "doc_ready", "doc": PreProductionDoc }
```

---

### `POST /projects/{pid}/preproduction/analyze-url/stream`
참조 URL 자동 분석 SSE

**Query Params**
| 파라미터 | 타입 |
|---------|------|
| `url` | string (URL 인코딩) |

**SSE 이벤트**
```json
{ "type": "analysis", "text": "string" }
{ "type": "error", "message": "string" }
```

---

## 4. 시나리오

### `GET /projects/{pid}/shorts/{shortId}/scenario`
시나리오 조회

**Response**
```json
{
  "screenplay": Screenplay,
  "scenes": [Scene]
}
```

---

### `PATCH /projects/{pid}/shorts/{shortId}/scenario`
씬 목록 저장 (전체 덮어쓰기)

**Request Body**
```json
{
  "scenes": [Scene]
}
```

---

### `POST /projects/{pid}/shorts/{shortId}/scenario/regenerate`
시나리오 재생성 요청 (AI 재작성)

**Request Body** *(모두 선택)*
```json
{
  "notes": "string",
  "current_scenes": [Scene]
}
```

---

### `POST /projects/{pid}/shorts/{shortId}/scenario/approve`
시나리오 확정 → 다음 단계(cast)로 이동

**Request Body**
```json
{
  "image_model": "flux-schnell"
}
```

---

### `GET /projects/{pid}/shorts/{shortId}/scenario/stream` *(SSE)*
시나리오 생성 진행 SSE

**SSE 이벤트**
```json
{ "type": "progress", "message": "string" }
{ "type": "message", "text": "string" }
{ "type": "done" }
{ "type": "error", "message": "string" }
```
> `done: true` (최상위 필드) 도 허용

---

## 5. 캐스트 (일괄)

### `POST /projects/{pid}/cast/extract`
시나리오에서 등장인물·배경 추출 후 DB 저장 (이미지 생성 X)

**Request Body**
```json
{
  "short_id": "string",
  "save": true
}
```

---

### `POST /projects/{pid}/cast/extract-and-generate`
추출 + 이미지 일괄 생성 (한 번에)

**Request Body**
```json
{
  "short_id": "string",
  "model": "flux-schnell"
}
```

---

### `POST /projects/{pid}/cast/generate-all`
이미 추출된 캐릭터·배경 이미지 일괄 생성

**Request Body**
```json
{
  "model": "flux-schnell"
}
```

---

### `GET /projects/{pid}/cast/stream` *(SSE)*
캐스트 이미지 생성 진행 SSE

**SSE 이벤트**
```json
{ "type": "character", "key": "char_01", "name": "지호", "url": "relative/path.png" }
{ "type": "location", "key": "loc_01", "name": "편의점", "url": "relative/path.png" }
{ "done": true }
```

---

### `GET /projects/{pid}/shorts/{shortId}/cast`
숏츠에 연결된 캐스트 목록 조회

**Response**
```json
{
  "characters": [Character],
  "locations": [Location]
}
```

---

### `POST /projects/{pid}/shorts/{shortId}/cast/approve`
캐스트 확정 → 영상 생성 단계로 이동

**Request Body**
```json
{
  "video_model": "fal-ai/kling-video/v2.1/standard/image-to-video"
}
```

---

## 6. 캐릭터

### `GET /projects/{pid}/characters`
프로젝트 캐릭터 목록

**Response**
```json
{
  "characters": [Character]
}
```

---

### `POST /projects/{pid}/characters/generate`
캐릭터 신규 생성

**Request Body**
```json
{
  "name_ko": "string",
  "role_ko": "string",
  "avatar_config": { }
}
```

**Response** → `Character`

---

### `PATCH /projects/{pid}/characters/{charKey}`
캐릭터 정보 수정

**Request Body** *(부분 수정 가능)*
```json
{
  "name_ko": "string",
  "role_ko": "string",
  "appearance": {
    "age": "string",
    "gender": "string",
    "ethnicity": "string",
    "hair": "string",
    "face": "string",
    "eyes": "string",
    "outfit": "string",
    "body_type": "string",
    "expression": "string",
    "style_ref": "string",
    "extra": "string"
  },
  "avatar_config": { }
}
```

---

### `POST /projects/{pid}/characters/{charKey}/describe`
아바타 설정 → 외모 설명 텍스트 자동 생성 (LLM)

**Request Body**
```json
{
  "avatar_style": { },
  "name_ko": "string",
  "role_ko": "string",
  "age_ko": "string"
}
```

**Response**
```json
{
  "appearance_ko": "string",
  "appearance_en": {
    "age": "string",
    "gender": "string",
    "hair": "string",
    "face": "string",
    "eyes": "string",
    "outfit": "string"
  }
}
```
> `appearance_ko` 또는 `appearance_en` 중 하나 이상 반환.  
> `appearance_en`이 객체인 경우 프론트가 한글 변환 처리함.

---

### `POST /projects/{pid}/characters/{charKey}/generate-image`
캐릭터 이미지 생성

**Request Body**
```json
{
  "model": "flux-schnell",
  "appearance_ko": "string"
}
```

**Response**
```json
{
  "image_url": "string"
}
```

---

## 7. 컷

### `GET /projects/{pid}/shorts/{shortId}/cuts?scene_key={sceneKey}`
씬의 컷 목록 조회

**Query Params**
| 파라미터 | 타입 | 필수 |
|---------|------|------|
| `scene_key` | string (URL 인코딩) | ✅ |

**Response**
```json
{
  "cuts": [Cut]
}
```

---

### `POST /projects/{pid}/shorts/{shortId}/cuts`
컷 생성

**Request Body**
```json
{
  "scene_key": "string",
  "cut_order": 1,
  "subject": "string",
  "action": "string",
  "char_keys": ["char_01"],
  "composition_id": 1,
  "duration_sec": 3
}
```

**Response** → `Cut`

---

### `GET /projects/{pid}/shorts/{shortId}/cuts/{cutKey}`
컷 단건 조회

**Response** → `Cut`

---

### `PATCH /projects/{pid}/shorts/{shortId}/cuts/{cutKey}`
컷 수정

**Request Body** *(부분 수정 가능)*
```json
{
  "subject": "string",
  "action": "string",
  "char_keys": ["char_01"],
  "composition_id": 1,
  "duration_sec": 3
}
```

---

### `DELETE /projects/{pid}/shorts/{shortId}/cuts/{cutKey}`
컷 삭제

---

### `POST /projects/{pid}/shorts/{shortId}/cuts/{cutKey}/generate`
컷 이미지 생성

**Request Body**
```json
{
  "char_image_paths": ["relative/path.png"],
  "background_image_path": "relative/path.png",
  "composition_id": 1
}
```

---

## 8. 구도

### `GET /projects/{pid}/compositions`

**Response**
```json
{
  "compositions": [Composition]
}
```

---

### `POST /projects/{pid}/compositions`
구도 생성

**Request Body**
```json
{
  "location_key": "string",
  "shot_size": "medium",
  "angle": "eye-level",
  "camera_movement": "static",
  "lighting": "natural light",
  "lens_style": "35mm",
  "color_grade": "natural",
  "mood": "hopeful",
  "prompt_en": "string"
}
```

**Response** → `Composition`

---

### `PUT /projects/{pid}/compositions/{compId}`
구도 전체 수정 (POST와 동일한 body)

---

### `DELETE /projects/{pid}/compositions/{compId}`
구도 삭제

---

## 9. 렌더 / 클립

### `GET /projects/{pid}/shorts/{shortId}/clips`

**Response**
```json
{
  "clips": [Clip],
  "progress": "string"
}
```

> 프론트는 `stage === 'scene_video' && status === 'generating'`일 때 **4초마다 폴링**함.

---

### `POST /projects/{pid}/shorts/{shortId}/clips/regenerate`
클립 재생성

**Request Body** *(전체 재생성 시 body 생략 가능)*
```json
{
  "key": "string"
}
```

---

## 10. 미디어

### `GET /media/{projectId}/{filePath}`
이미지·영상 자산 파일 제공 (정적 파일 서빙)

> 프론트에서 상대 경로(`char_01.png` 등)를 `/api/media/{pid}/{path}` 형태로 변환하여 사용.

---

## 11. 공통 모델

### `Short`
```json
{
  "id": "string",
  "title": "string",
  "stage": "scenario | cast | scene_video | done",
  "status": "generating | choosing | failed | done"
}
```

### `Scene`
```json
{
  "scene_key": "string",
  "title_ko": "string",
  "action_ko": "string",
  "dialogue_ko": [{ "speaker": "string", "line": "string" }],
  "mood_ko": "string",
  "shot_type_en": "string",
  "shot_type_ko": "string",
  "visual_prompt_en": "string",
  "duration_sec": 6,
  "location_key": "string",
  "characters_in_scene": ["string"],
  "time_of_day_ko": "string",
  "weather_ko": "string"
}
```

### `Character`
```json
{
  "id": "string",
  "char_key": "string",
  "name_ko": "string",
  "role_ko": "string",
  "age_ko": "string",
  "appearance_ko": "string",
  "appearance": {
    "age": "", "gender": "", "ethnicity": "", "hair": "",
    "face": "", "eyes": "", "outfit": "", "body_type": "",
    "expression": "", "style_ref": "", "extra": ""
  },
  "avatar_config": { },
  "image_url": "string",
  "image_path": "string",
  "status": "pending | done",
  "tags": ["string"]
}
```

### `Cut`
```json
{
  "cut_key": "string",
  "scene_key": "string",
  "cut_order": 1,
  "subject": "string",
  "action": "string",
  "char_keys": ["string"],
  "composition_id": 1,
  "duration_sec": 3,
  "prompt_en": "string",
  "status": "pending | generating | done | failed",
  "image_url": "string",
  "video_url": "string"
}
```

### `Composition`
```json
{
  "id": 1,
  "location_key": "string",
  "shot_size": "medium | close-up | wide | full | extreme close-up | OTS | POV | INSERT",
  "angle": "eye-level | low angle | high angle | bird's eye | dutch",
  "camera_movement": "static | push-in | pull-out | pan left | pan right | tilt up | tilt down | handheld",
  "lighting": "natural light | golden hour | harsh fluorescent | neon glow | soft diffused | high contrast | silhouette",
  "lens_style": "35mm | 85mm portrait | anamorphic | 24mm wide | fisheye | 50mm standard",
  "color_grade": "natural | warm golden | cold steel | desaturated blue-green | neon glow | vintage film",
  "mood": "tense | hopeful | melancholic | romantic | suspenseful | joyful | somber",
  "prompt_en": "string",
  "background_image_path": "string"
}
```

### `Clip`
```json
{
  "key": "string",
  "status": "pending | done | failed",
  "video_url": "string",
  "prompt": "string",
  "error": "string"
}
```

---

## 12. SSE 공통 규칙

| 항목 | 규격 |
|------|------|
| Content-Type | `text/event-stream` |
| 이벤트 형식 | `data: {...JSON...}\n\n` |
| 완료 신호 | `{ "type": "done" }` 또는 `{ "done": true }` |
| 에러 신호 | `{ "type": "error", "message": "string" }` |
| 파싱 실패 | 프론트가 raw text를 `{ type: 'message', message: rawText }` 로 처리 |

> **preproduction/chat** 과 **preproduction/analyze-url/stream** 은  
> `EventSource` 가 아닌 **`fetch` + `ReadableStream`** 으로 POST 요청 후 스트리밍 수신.  
> 나머지 SSE 엔드포인트는 모두 GET + `EventSource`.
