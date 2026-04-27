import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { creatorLogout, getMe } from "../api/creator";

const NAV_ITEMS = [
  { to: "/create",      label: "Create",      icon: "✦" },
  { to: "/submissions", label: "Submissions",  icon: "📋" },
];

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe().then((d) => setUser(d.user)).catch(() => {});
  }, []);

  const logout = () => {
    creatorLogout();
    navigate("/login");
  };

  return (
    <Wrapper>
      <Sidebar>
        <BrandBlock>
          <BrandName>Neclis <BrandAccent>Creator</BrandAccent></BrandName>
          {user && <UserName>{user.name || user.email}</UserName>}
        </BrandBlock>
        <Nav>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <StyledNavLink key={to} to={to}>
              <Icon>{icon}</Icon> {label}
            </StyledNavLink>
          ))}
        </Nav>
        <LogoutBtn onClick={logout}>Logout</LogoutBtn>
      </Sidebar>
      <Main>
        <Outlet />
      </Main>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 220px;
  flex-shrink: 0;
  background: #1c1c22;
  border-right: 1px solid #ffffff12;
  display: flex;
  flex-direction: column;
  padding: 24px 0 16px;
`;

const BrandBlock = styled.div`
  padding: 0 20px 24px;
  border-bottom: 1px solid #ffffff0a;
  margin-bottom: 12px;
`;

const BrandName = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.3px;
`;

const BrandAccent = styled.span`
  color: #68cfee;
`;

const UserName = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
`;

const Icon = styled.span`
  font-size: 15px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #999;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
  }

  &.active {
    background: rgba(104, 207, 238, 0.15);
    color: #a8e6f5;
  }
`;

const LogoutBtn = styled.button`
  margin: 0 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ffffff15;
  background: transparent;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: color 0.12s, border-color 0.12s;

  &:hover {
    color: #ff7777;
    border-color: rgba(255, 80, 80, 0.4);
  }
`;

const Main = styled.main`
  flex: 1;
  overflow-y: auto;
  background: #18181d;
`;
