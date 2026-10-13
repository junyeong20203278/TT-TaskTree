import { useEffect, useRef, useState } from 'react';
import './ProjectInitModal.css';

// 백엔드 API 연결 전, 화면 동작을 시험하기 위한 임시 처리입니다.
async function createProjectPreview(projectInput) {
  await new Promise((resolve) => {
    setTimeout(resolve, 1500);
  });

  return {
    ...projectInput,
    createdAt: new Date().toISOString(),
  };
}

export default function ProjectInitModal({ onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [duration, setDuration] = useState('8');
  const [team, setTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const dialogRef = useRef(null);
  const ideaRef = useRef(null);
  const startButtonRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      ideaRef.current?.focus();
    }
  }, [isOpen]);

  const openModal = () => {
    setError('');
    setIsOpen(true);
  };

  const closeModal = () => {
    if (submittingRef.current) return;

    setIsOpen(false);
    setError('');

    requestAnimationFrame(() => {
      startButtonRef.current?.focus();
    });
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    // 키보드 포커스가 모달 밖으로 나가지 않도록 처리합니다.
    if (event.key !== 'Tab') return;

    const focusableElements =
      dialogRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), ' +
          'textarea:not(:disabled), select:not(:disabled)'
      );

    if (!focusableElements?.length) {
      event.preventDefault();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submittingRef.current) return;

    const projectInput = {
      idea: idea.trim(),
      durationWeeks: Number(duration),
      team: team.trim(),
    };

    if (!projectInput.idea || !projectInput.team) {
      setError('프로젝트 아이디어와 팀 구성을 입력해 주세요.');
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    setError('');

    // 로딩 중에는 비활성화된 입력 대신 모달에 포커스를 둡니다.
    dialogRef.current?.focus();

    try {
      const project = await createProjectPreview(projectInput);
      onComplete(project);
    } catch {
      setError(
        '프로젝트를 시작하지 못했습니다. 다시 시도해 주세요.'
      );

      requestAnimationFrame(() => {
        ideaRef.current?.focus();
      });
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <main className="project-start">
      <section className="project-start__card">
        <span className="project-start__badge">
          Flow Canvas
        </span>

        <h1>아이디어를 프로젝트로 시작하세요</h1>

        <p>
          아이디어와 진행 기간, 팀 구성을 입력하고
          캔버스에서 작업 흐름을 만들어 보세요.
        </p>

        <button
          ref={startButtonRef}
          type="button"
          className="project-primary-button"
          onClick={openModal}
        >
          새 프로젝트 시작
        </button>

        <span className="project-start__note">
          현재는 API 연결 전 화면 시험 버전입니다.
        </span>
      </section>

      {isOpen && (
        <div className="project-modal-backdrop">
          <section
            ref={dialogRef}
            className="project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            aria-describedby="project-modal-description"
            aria-busy={isLoading}
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
          >
            <header className="project-modal__header">
              <div>
                <h2 id="project-modal-title">
                  프로젝트 시작하기
                </h2>

                <p id="project-modal-description">
                  아래 정보를 입력해 주세요.
                </p>
              </div>

              <button
                type="button"
                className="project-close-button"
                onClick={closeModal}
                disabled={isLoading}
                aria-label="프로젝트 입력창 닫기"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <fieldset
                className="project-form-fields"
                disabled={isLoading}
              >
                <div className="project-field">
                  <label htmlFor="project-idea">
                    프로젝트 아이디어
                  </label>

                  <textarea
                    ref={ideaRef}
                    id="project-idea"
                    value={idea}
                    onChange={(event) => setIdea(event.target.value)}
                    placeholder="예: 대학생 팀을 위한 일정 관리 서비스"
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>

                <div className="project-field">
                  <label htmlFor="project-duration">
                    진행 기간
                  </label>

                  <select
                    id="project-duration"
                    value={duration}
                    onChange={(event) =>
                      setDuration(event.target.value)
                    }
                  >
                    <option value="8">8주</option>
                    <option value="15">15주</option>
                  </select>
                </div>

                <div className="project-field">
                  <label htmlFor="project-team">
                    팀 구성
                  </label>

                  <textarea
                    id="project-team"
                    value={team}
                    onChange={(event) => setTeam(event.target.value)}
                    placeholder="예: 기획 1명, 프론트엔드 2명, 백엔드 1명"
                    rows={3}
                    maxLength={1000}
                    required
                  />

                  <small>
                    팀원 수와 역할을 자유롭게 입력해 주세요.
                  </small>
                </div>
              </fieldset>

              {error && (
                <p className="project-error" role="alert">
                  {error}
                </p>
              )}

              {isLoading && (
                <div
                  className="project-loading"
                  role="status"
                  aria-live="polite"
                >
                  <div className="project-loading__heading">
                    <span
                      className="project-spinner"
                      aria-hidden="true"
                    />
                    <span>입력 정보를 준비하고 있습니다…</span>
                  </div>

                  <div
                    className="project-skeleton"
                    aria-hidden="true"
                  >
                    <div className="project-skeleton__line" />
                    <div className="project-skeleton__line project-skeleton__line--short" />
                    <div className="project-skeleton__cards">
                      <div />
                      <div />
                      <div />
                    </div>
                  </div>
                </div>
              )}

              <footer className="project-modal__footer">
                <button
                  type="button"
                  className="project-secondary-button"
                  onClick={closeModal}
                  disabled={isLoading}
                >
                  취소
                </button>

                <button
                  type="submit"
                  className="project-primary-button"
                  disabled={isLoading}
                >
                  {isLoading ? '준비 중…' : '캔버스 시작'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
