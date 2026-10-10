import React, { useState } from 'react';

export default function BranchModal({ isOpen, onClose, nodeTitle, options = [], onAccept }) {
  const [selectedId, setSelectedId] = useState(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const chosen = options.find((opt) => opt.option_id === selectedId);
    if (!chosen) return alert('3개 옵션 중 하나를 선택해 주세요!');
    onAccept(chosen);
    setSelectedId(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '760px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          padding: '24px',
          boxShadow: '0 20px 30px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5' }}>관문 의사결정 (3지선다)</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#1E1B4B' }}>{nodeTitle}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {options.map((opt) => {
            const isSelected = selectedId === opt.option_id;
            return (
              <div
                key={opt.option_id}
                onClick={() => setSelectedId(opt.option_id)}
                style={{
                  border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                  background: isSelected ? '#EEF2FF' : '#F8FAFC',
                  borderRadius: '10px',
                  padding: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#4F46E5', marginBottom: '4px' }}>{opt.option_id}</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#0F172A' }}>{opt.title}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>{opt.description}</p>
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', borderTop: '1px solid #E2E8F0', paddingTop: '6px' }}>
                  <div style={{ color: '#059669' }}><strong>장점:</strong> {opt.pros}</div>
                  <div style={{ color: '#DC2626' }}><strong>단점:</strong> {opt.cons}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}>취소</button>
          <button onClick={handleConfirm} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#4F46E5', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>이 옵션으로 결정</button>
        </div>
      </div>
    </div>
  );
}