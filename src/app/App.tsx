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
import { PodsPage } from './pages/PodsPage';
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
            <NavItem isActive={location.pathname === '/pods'}>
              <Link to="/pods" style={{ textDecoration: 'none', color: 'inherit' }}>
                Pods
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
        <Route path="/" element={<Navigate to="/pods" replace />} />
        <Route path="/pods" element={<PodsPage />} />
        <Route path="/virtual-machines" element={<VirtualMachinesPage />} />
      </Routes>
    </Page>
  );
};

