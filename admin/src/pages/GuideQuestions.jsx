import React from 'react';
import { api } from '../api.js';

const EMPTY_FORM = { category: '', question_ko: '', options: '', sample_answers: '', order_num: 0 };

const parseArr = (str) => str.split('\n').map(s => s.trim()).filter(Boolean);

const QuestionModal = ({ item, onClose, onSaved }) => {
  const isEdit = !!item?.id;
  const [form, setForm] = React.useState(
    item ? {
      category:       item.category       || '',
      question_ko:    item.question_ko    || '',
      options:        (item.options        || []).join('\n'),
      sample_answers: (item.sample_answers || []).join('\n'),
      order_num:      item.order_num       ?? 0,
    } : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = React.useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.question_ko.trim()) return;
    setSaving(true);
    try {
      const body = {
        category:       form.category,
        question_ko:    form.question_ko,
        options:        parseArr(form.options),
        sample_answers: parseArr(form.sample_answers),
        order_num:      Number(form.order_num),
      };
      if (isEdit) await api.put(`/guide-questions/${item.id}`, body);
      else        await api.post('/guide-questions', body);
      onSaved(); onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{isEdit ? '질문 수정' : '질문 추가'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>카테고리</div>
            <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="예: topic, tone, target" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>질문 (한국어) *</div>
            <textarea value={form.question_ko} onChange={e => set('question_ko', e.target.value)} placeholder="어떤 주제를 다루고 싶으신가요?" style={{ minHeight: 60 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>선택지 (줄바꿈으로 구분)</div>
            <textarea value={form.options} onChange={e => set('options', e.target.value)} placeholder="사회&#10;환경&#10;역사" style={{ minHeight: 60 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>예시 답변 (줄바꿈으로 구분)</div>
            <textarea value={form.sample_answers} onChange={e => set('sample_answers', e.target.value)} placeholder="도시 속 소외된 사람들" style={{ minHeight: 50 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 5 }}>순서</div>
            <input type="number" value={form.order_num} onChange={e => set('order_num', e.target.value)} style={{ width: 100 }} />
          </div>
        </div>
        <div className="flex gap-8" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>취소</button>
          <button className="btn btn-primary" disabled={saving || !form.question_ko.trim()} onClick={save}>
            {saving ? <span className="spinner" /> : (isEdit ? '저장' : '추가')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const GuideQuestions = () => {
  const [questions, setQuestions] = React.useState([]);
  const [catFilter, setCatFilter] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [modal, setModal] = React.useState(null);
  const [deleting, setDeleting] = React.useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = catFilter ? `?category=${catFilter}` : '';
      const data = await api.get(`/guide-questions${p}`);
      setQuestions(data.questions || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, [catFilter]);

  const del = async (id) => {
    if (!confirm('질문을 삭제할까요?')) return;
    setDeleting(id);
    try { await api.del(`/guide-questions/${id}`); load(); }
    catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];

  return (
    <div>
      {modal && <QuestionModal item={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={load} />}

      <div className="flex mb-24">
        <div>
          <div className="page-title">가이드 질문</div>
          <div className="page-sub">AI 기획 대화에서 사용자에게 제시하는 질문 관리</div>
        </div>
        <button className="btn btn-primary ml-auto" onClick={() => setModal('new')}>+ 질문 추가</button>
      </div>

      <div className="flex gap-8 mb-16">
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 180 }}>
          <option value="">모든 카테고리</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}>새로고침</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th style={{ width: 50 }}>순서</th><th>질문</th><th>카테고리</th><th>선택지</th><th>예시 답변</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}><span className="spinner" /></td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>질문 없음</td></tr>
            ) : questions.sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0)).map(q => (
              <tr key={q.id}>
                <td className="mono text-muted" style={{ textAlign: 'center' }}>{q.order_num ?? '-'}</td>
                <td style={{ maxWidth: 320 }}>{q.question_ko}</td>
                <td>{q.category ? <span className="badge badge-violet">{q.category}</span> : <span className="text-muted">-</span>}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {q.options?.length ? q.options.join(', ') : '-'}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {q.sample_answers?.length ? q.sample_answers[0] + (q.sample_answers.length > 1 ? ` 외 ${q.sample_answers.length - 1}개` : '') : '-'}
                </td>
                <td>
                  <div className="flex gap-8">
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(q)}>수정</button>
                    <button className="btn btn-danger btn-sm" disabled={deleting === q.id} onClick={() => del(q.id)}>
                      {deleting === q.id ? <span className="spinner" style={{ width: 10, height: 10 }} /> : '삭제'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
