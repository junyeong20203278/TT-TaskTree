import React from 'react';
import Canvas from './components/Canvas/Canvas';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      {/* 팀원이 새로 구현한 캔버스 컴포넌트 마운트 */}
      <Canvas />
    </div>
  );
}

export default App;