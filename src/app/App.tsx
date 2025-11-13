import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Page,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  PageSection,
  Title,
  Brand,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import { NodesPage } from './pages/NodesPage';
import { VirtualMachinesPage } from './pages/VirtualMachinesPage';

export const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  const onSidebarToggle = () => setIsSidebarOpen(!isSidebarOpen);

  const Header = (
    <Masthead>
      <MastheadToggle>
        <button
          onClick={onSidebarToggle}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          <BarsIcon />
        </button>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Title headingLevel="h1" size="lg">
            🔍 Search Experience
          </Title>
        </MastheadBrand>
      </MastheadMain>
    </Masthead>
  );

  const Sidebar = (
    <PageSidebar>
      <PageSidebarBody>
        <Nav>
          <NavList>
            <NavItem isActive={location.pathname === '/nodes'}>
              <Link to="/nodes" style={{ textDecoration: 'none', color: 'inherit' }}>
                Nodes
              </Link>
            </NavItem>
            <NavItem isActive={location.pathname === '/virtual-machines'}>
              <Link to="/virtual-machines" style={{ textDecoration: 'none', color: 'inherit' }}>
                Virtual Machines
              </Link>
            </NavItem>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page
      header={Header}
      sidebar={isSidebarOpen ? Sidebar : undefined}
      isManagedSidebar
    >
      <Routes>
        <Route path="/" element={<Navigate to="/nodes" replace />} />
        <Route path="/nodes" element={<NodesPage />} />
        <Route path="/virtual-machines" element={<VirtualMachinesPage />} />
      </Routes>
    </Page>
  );
};

