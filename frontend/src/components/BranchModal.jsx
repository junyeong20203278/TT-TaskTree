import React from 'react';

export default function BranchModal({ isOpen, onClose, parentTitle, onSelect }) {
  if (!isOpen) return null;

  // 사이드패널(SidePanel.jsx)과 100% 호환되는 3개 추천 옵션 규격
  const choices = [
    {
      title: 'PostgreSQL 정규화 모델링',
      desc: 'ACID 트랜잭션과 데이터 정합성을 보장하는 표준 RDBMS 설계 방식',
      days: '약 3일 소요',
      detail: {
        mentoring: {
          description: '외래키 제약조건과 3차 정규화를 적용해 데이터 중복을 없애고 무결성을 보장합니다.',
          recommended_methods: [
            { title: 'ERD 작성 도구 활용', content: 'dbdiagram.io를 사용해 시각적으로 스키마를 모델링하세요.' },
            { title: '인덱스 설계', content: '조회가 빈번한 컬럼(예: user_id)에 B-Tree 인덱스를 설정합니다.' },
          ],
          common_mistakes: [
            {
              mistake: '과도한 반정규화',
              bad_example: '조회가 편하다는 이유로 테이블 하나에 모든 컬럼을 몰아넣기',
              good_example: '정규화를 우선 적용하고 성능 측정 후 필요할 때만 반정규화하기',
              explanation: '초기 프로젝트에서는 데이터 정합성을 지키는 정규화가 우선입니다.',
            },
          ],
          one_line_tip: '식별자/비식별자 관계를 명확히 구분하여 불필요한 복합키 생성을 피하세요.',
        },
        dictionary: [
          { term: 'ACID', definition: '원자성, 일관성, 독립성, 지속성을 뜻하는 트랜잭션의 4대 속성' },
          { term: '1:N 관계', definition: '한 부모 행이 여러 자식 행과 매핑되는 가장 보편적인 DB 관계' },
        ],
        template_url: 'https://notion.so',
      },
    },
    {
      title: 'Prisma ORM 기반 빠른 모델링',
      desc: 'TypeScript 타입 안전성을 극대화하고 자동 마이그레이션을 지원하는 현대적 설계',
      days: '약 2일 소요',
      detail: {
        mentoring: {
          description: 'schema.prisma 파일에 데이터 모델을 선언하고 CLI 명령어로 마이그레이션을 자동 수행합니다.',
          recommended_methods: [
            { title: 'Prisma Migrate 활용', content: 'npx prisma migrate dev 명령어로 스키마 변경 이력을 남기세요.' },
          ],
          common_mistakes: [
            {
              mistake: 'DB 원격 직접 수정',
              bad_example: 'DB 툴에서 테이블을 직접 고치고 prisma schema와 싱크를 맞추지 않음',
              good_example: '반드시 prisma 파일을 고친 뒤 마이그레이션을 실행',
              explanation: '스키마 드리프트가 발생하여 협업 시 충돌이 일어납니다.',
            },
          ],
          one_line_tip: 'Prisma Studio(npx prisma studio)를 켜두면 GUI로 데이터를 즉시 검증할 수 있습니다.',
        },
        dictionary: [
          { term: 'ORM', definition: '객체와 관계형 데이터베이스의 데이터를 자동으로 매핑해주는 프레임워크' },
        ],
        template_url: 'https://notion.so',
      },
    },
    {
      title: 'Supabase BaaS 클라우드 스키마',
      desc: '별도 DB 서버 구축 없이 GUI 테이블 생성과 실시간 API를 바로 뽑아내는 초고속 방식',
      days: '약 1일 소요',
      detail: {
        mentoring: {
          description: 'PostgreSQL 기반 클라우드 DB로 테이블 생성 즉시 REST/GraphQL API를 사용합니다.',
          recommended_methods: [
            { title: 'RLS(Row Level Security) 활성화', content: '데이터 보안을 위해 반드시 유저별 접근 제어 정책을 켜세요.' },
          ],
          common_mistakes: [
            {
              mistake: 'RLS 비활성화 상태 배포',
              bad_example: '개발 편의를 위해 RLS를 끈 채 anon key를 프론트에 노출',
              good_example: 'auth.uid() = user_id 정책을 각 테이블에 부여',
              explanation: '누구나 프론트 키로 타인의 데이터를 조작할 수 있습니다.',
            },
          ],
          one_line_tip: 'Supabase Table Editor의 Foreign Key 연결 기능을 활용하면 직관적입니다.',
        },
        dictionary: [
          { term: 'BaaS', definition: 'Backend as a Service의 약자로 백엔드 인프라를 클라우드로 제공받는 형태' },
        ],
        template_url: 'https://notion.so',
      },
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          width: '660px',
          maxWidth: '92%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '10px' }}>
              3-Choice 의사결정 확장
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: '6px 0 0 0' }}>
              [{parentTitle}] 구현 방식을 선택하세요
            </h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '20px 0' }}>
          {choices.map((c, idx) => (
            <div
              key={idx}
              onClick={() => onSelect(c)}
              style={{
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#ffffff',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>옵션 {String.fromCharCode(65 + idx)}</span>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', margin: '6px 0' }}>{c.title}</h4>
                <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{c.desc}</p>
              </div>
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#2563eb', fontWeight: 'bold' }}>
                {c.days}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          선택한 카드가 하위 작업으로 추가되며, 우측 패널에서 상세 멘토링을 확인할 수 있습니다.
        </div>
      </div>
    </div>
  );
}