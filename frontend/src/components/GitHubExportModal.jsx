import React, { useState } from 'react';

export default function GitHubExportModal({ isOpen, onClose, nodes }) {
  if (!isOpen) return null;

  const availableWeeks = Array.from(new Set(nodes.map((n) => n.data.week))).sort((a, b) => a - b);
  const [selectedWeeks, setSelectedWeeks] = useState(availableWeeks);

  const [token, setToken] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const toggleWeek = (w) => {
    if (selectedWeeks.includes(w)) {
      setSelectedWeeks(selectedWeeks.filter((item) => item !== w));
    } else {
      setSelectedWeeks([...selectedWeeks, w].sort((a, b) => a - b));
    }
  };

  const handleExport = async () => {
    if (!token.trim() || !repoOwner.trim() || !repoName.trim()) {
      return alert('GitHub Token, Owner(계정명), Repo(저장소명)를 모두 입력해 주세요!');
    }

    const filteredNodes = nodes
      .filter((n) => selectedWeeks.includes(n.data.week))
      .map((n) => ({
        id: n.id,
        title: n.data.label,
        week: n.data.week,
        category: n.data.category || 'common',
        description: n.data.description || '',
        tools: n.data.tools || [],
        checklist: n.data.checklist || [],
      }));

    if (filteredNodes.length === 0) {
      return alert('내보낼 노드를 최소 1개 이상 선택해 주세요.');
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/github/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_token: token.trim(),
          repo_owner: repoOwner.trim(),
          repo_name: repoName.trim(),
          nodes: filteredNodes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'GitHub 이슈 등록 실패');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert(`오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        style={{
          width: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🐙</span>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0F172A', fontWeight: 800 }}>GitHub Issues 일괄 등록</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          POCO 캔버스에서 결정된 WBS 태스크를 실제 GitHub 저장소의 이슈로 즉시 생성합니다.
        </p>

        {/* 1. 구간 선택 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>1. 내보낼 Stage(주차) 선택</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {availableWeeks.map((week) => {
              const isChecked = selectedWeeks.includes(week);
              return (
                <button
                  key={week}
                  onClick={() => toggleWeek(week)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: isChecked ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                    background: isChecked ? '#EEF2FF' : '#FFF',
                    color: isChecked ? '#4F46E5' : '#64748B',
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {week}주차
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. GitHub 정보 입력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>2. GitHub 연동 정보</div>
          <input
            type="password"
            placeholder="GitHub Personal Access Token (ghp_...)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Repo Owner (예: octocat)"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
            <input
              type="text"
              placeholder="Repo Name (예: my-project)"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>
        </div>

        {/* 결과 알림 */}
        {result && (
          <div style={{ padding: '12px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
              🎉 총 {result.total_created}개의 이슈가 GitHub에 성공적으로 등록되었습니다!
            </div>
            {result.created_issue_urls.length > 0 && (
              <a
                href={result.created_issue_urls[0].split('/issues')[0] + '/issues'}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: '#2563EB', textDecoration: 'underline', marginTop: 4, display: 'inline-block' }}
              >
                GitHub Issues 탭 바로가기 ↗
              </a>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer', fontSize: 13 }}>닫기</button>
          <button
            onClick={handleExport}
            disabled={loading || selectedWeeks.length === 0}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: loading ? '#94A3B8' : '#24292F',
              color: '#FFF',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            {loading ? 'GitHub 전송 중...' : 'GitHub 이슈 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}