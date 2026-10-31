import React from 'react';

export default function SidePanel({ node, isOpen, onClose }) {
  if (!isOpen || !node) return null;

  // parser.js에서 정의한 data 구조 추출
  const {
    label = '태스크 상세 정보',
    startWeek = 1,
    stage = '공통',
    description = '상세 설명이 등록되지 않았습니다.',
    tools = [],
    checklist = [],
    isMilestone = false,
  } = node.data || {};

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '380px',
        height: '100vh',
        backgroundColor: '#ffffff',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.12)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderLeft: '1px solid #e2e8f0',
        transition: 'transform 0.25s ease-in-out',
      }}
    >
      {/* 1. 상단 헤더 */}
      <div
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isMilestone ? '#fef3c7' : '#e0e7ff',
              color: isMilestone ? '#92400e' : '#3730a3',
            }}
          >
            {startWeek}주차 · {String(stage).toUpperCase()}
          </span>
          {isMilestone && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}>
              ◆ 핵심 관문 (Gate)
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
          title="닫기"
        >
          ✕
        </button>
      </div>

      {/* 2. 패널 본문 영역 (스크롤 지원) */}
      <div style={{ padding: '24px 20px', overflowY: 'auto', flex: 1 }}>
        {/* 태스크 제목 */}
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          {label}
        </h2>

        {/* 세부 설명 가이드 */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
            📋 작업 개요 및 가이드
          </h3>
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#334155',
              backgroundColor: '#f1f5f9',
              padding: '12px 14px',
              borderRadius: '8px',
              margin: 0,
            }}
          >
            {description}
          </p>
        </section>

        {/* 추천 개발 도구 및 기술 스택 */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
            🛠️ 추천 도구 및 기술 스택
          </h3>
          {tools && tools.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {tools.map((tool, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0369a1',
                    backgroundColor: '#e0f2fe',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd',
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>추천 도구 정보가 없습니다.</p>
          )}
        </section>

        {/* 실무 검증 체크리스트 (Definition of Done) */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
            ✅ 완료 체크리스트 (DoD)
          </h3>
          {checklist && checklist.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {checklist.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: '13px',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  <input
                    type="checkbox"
                    id={`side-chk-${idx}`}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <label htmlFor={`side-chk-${idx}`} style={{ cursor: 'pointer' }}>
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>등록된 체크리스트가 없습니다.</p>
          )}
        </section>
      </div>

      {/* 3. 하단 닫기 버튼 */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px 0',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          확인 완료 (닫기)
        </button>
      </div>
    </aside>
  );
}