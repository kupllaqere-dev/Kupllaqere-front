import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { adminLogout } from "../api/admin";
import styled from "styled-components";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard",  icon: "▦" },
  { to: "/players",   label: "Players",    icon: "👤" },
  { to: "/items",     label: "Items",      icon: "🎒" },
  { to: "/online",    label: "Online Now", icon: "🟢" },
  { to: "/mail",      label: "Mail",       icon: "✉" },
];

export default function Layout() {
  const navigate = useNavigate();

  const logout = () => {
    adminLogout();
    navigate("/login");
  };

  return (
    <Wrapper>
      <Sidebar>
        <Brand>Neclis<Dim>Admin</Dim></Brand>
        <Nav>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <StyledNavLink key={to} to={to}>
              <span>{icon}</span> {label}
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

const Brand = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  padding: 0 20px 24px;
  letter-spacing: -0.3px;
`;

const Dim = styled.span`
  color: #7b2ff7;
  margin-left: 4px;
`;

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
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
    background: rgba(123, 47, 247, 0.18);
    color: #c4a1ff;
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
  padding: 32px;
  background: #18181d;
`;
