import styled from "styled-components";

export const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const GameWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

export const PlayerMenu = styled.div`
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  background: #1a1a2eee;
  border: 1px solid #ffffff33;
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  transform: translate(12px, -50%);
`;

export const PlayerMenuName = styled.div`
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid #ffffff22;
  margin-bottom: 2px;
`;

export const PlayerMenuButton = styled.button`
  background: transparent;
  border: none;
  color: ${(p) => (p.$danger ? "#ff6b6b" : "#ccc")};
  font-size: 12px;
  padding: 6px 10px;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #ffffff15;
    color: ${(p) => (p.$danger ? "#ff8888" : "#fff")};
  }
`;
