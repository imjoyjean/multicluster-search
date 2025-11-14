import React from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Pagination,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Label,
  Flex,
  FlexItem,
  Checkbox,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  Divider,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { useSearchParams } from 'react-router-dom';

interface VM {
  id: number;
  name: string;
  status: string;
  os: string;
  cpu: string;
  memory: string;
  disk: string;
  ip: string;
  cluster: string;
  namespace: string;
}

const mockVMs: VM[] = [
  { id: 1, name: 'vm-centos-stream8-fuchsia-tarsier-90', status: 'Running', os: 'CentOS Stream 8', cpu: '2 vCPU', memory: '4 GiB', disk: '50 GiB', ip: '192.168.1.10', cluster: 'hub', namespace: 'default' },
  { id: 2, name: 'vm-centos-stream8-violet-sawfish-64', status: 'Running', os: 'CentOS Stream 8', cpu: '2 vCPU', memory: '4 GiB', disk: '50 GiB', ip: '192.168.1.11', cluster: 'hub', namespace: 'default' },
  { id: 3, name: 'vm-diplomatic-alpaca', status: 'Stopped', os: 'RHEL 9', cpu: '4 vCPU', memory: '8 GiB', disk: '100 GiB', ip: '192.168.1.12', cluster: 'production-east', namespace: 'apps' },
  { id: 4, name: 'vm-fedora-brown-salmon-50', status: 'Running', os: 'Fedora 38', cpu: '2 vCPU', memory: '4 GiB', disk: '50 GiB', ip: '192.168.1.13', cluster: 'production-east', namespace: 'default' },
  { id: 5, name: 'vm-rhel-8-apricot-cheetah-33', status: 'Running', os: 'RHEL 8', cpu: '4 vCPU', memory: '8 GiB', disk: '100 GiB', ip: '192.168.1.14', cluster: 'staging-west', namespace: 'apps' },
  { id: 6, name: 'vm-ubuntu-22-emerald-dolphin-77', status: 'Error', os: 'Ubuntu 22.04', cpu: '2 vCPU', memory: '4 GiB', disk: '50 GiB', ip: '192.168.1.15', cluster: 'hub', namespace: 'monitoring' },
  { id: 7, name: 'vm-debian-11-azure-penguin-44', status: 'Running', os: 'Debian 11', cpu: '4 vCPU', memory: '8 GiB', disk: '100 GiB', ip: '192.168.1.16', cluster: 'production-west', namespace: 'default' },
  { id: 8, name: 'vm-rocky-9-crimson-panther-88', status: 'Paused', os: 'Rocky Linux 9', cpu: '2 vCPU', memory: '4 GiB', disk: '50 GiB', ip: '192.168.1.17', cluster: 'staging-east', namespace: 'apps' },
];

export const VirtualMachinesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [page, setPage] = React.useState(parseInt(searchParams.get('page') || '1'));
  const [perPage, setPerPage] = React.useState(parseInt(searchParams.get('perPage') || '10'));
  const [queryText, setQueryText] = React.useState(searchParams.get('query') || '');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
  const queryInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = React.useState<string>(searchParams.get('status') || 'All');
  const [osFilter, setOSFilter] = React.useState<string>(searchParams.get('os') || 'All');
  
  // Dropdown open states
  const [isStatusFilterOpen, setIsStatusFilterOpen] = React.useState(false);
  const [isOSFilterOpen, setIsOSFilterOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  
  // Sync state to URL params
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (queryText) params.set('query', queryText);
    else params.delete('query');
    
    if (statusFilter !== 'All') params.set('status', statusFilter);
    else params.delete('status');
    
    if (osFilter !== 'All') params.set('os', osFilter);
    else params.delete('os');
    
    if (page !== 1) params.set('page', page.toString());
    else params.delete('page');
    
    if (perPage !== 10) params.set('perPage', perPage.toString());
    else params.delete('perPage');
    
    setSearchParams(params, { replace: true });
  }, [queryText, statusFilter, osFilter, page, perPage, searchParams, setSearchParams]);
  
  // Close autocomplete when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as HTMLElement)) {
        setIsAutocompleteOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get unique values for filters
  const availableStatuses = React.useMemo(() => ['All', ...Array.from(new Set(mockVMs.map(vm => vm.status)))], []);
  const availableOSs = React.useMemo(() => ['All', ...Array.from(new Set(mockVMs.map(vm => vm.os)))], []);
  const availableClusters = React.useMemo(() => Array.from(new Set(mockVMs.map(vm => vm.cluster))), []);
  const availableNamespaces = React.useMemo(() => Array.from(new Set(mockVMs.map(vm => vm.namespace))), []);

  // Autocomplete suggestions
  const autocompleteSuggestions = React.useMemo(() => {
    if (!queryText) return { sections: [], hasResults: false };
    
    const searchLower = queryText.toLowerCase();
    const sections: Array<{ title: string; items: Array<{ text: string; displayText: string }> }> = [];
    
    const filterPrefixMatch = queryText.match(/^(status|os|cluster|namespace):/i);
    
    if (filterPrefixMatch) {
      const filterType = filterPrefixMatch[1].toLowerCase();
      const afterColon = queryText.substring(filterType.length + 1).toLowerCase();
      
      if (filterType === 'status') {
        const matches = availableStatuses.filter(s => s !== 'All' && s.toLowerCase().includes(afterColon))
          .map(status => ({ text: `status:${status}`, displayText: status }));
        if (matches.length > 0) sections.push({ title: 'Status', items: matches });
      } else if (filterType === 'os') {
        const matches = availableOSs.filter(os => os !== 'All' && os.toLowerCase().includes(afterColon))
          .map(os => ({ text: `os:${os}`, displayText: os }));
        if (matches.length > 0) sections.push({ title: 'Operating System', items: matches });
      } else if (filterType === 'cluster') {
        const matches = availableClusters.filter(cluster => cluster.toLowerCase().includes(afterColon))
          .map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
        if (matches.length > 0) sections.push({ title: 'Cluster', items: matches });
      } else if (filterType === 'namespace') {
        const matches = availableNamespaces.filter(namespace => namespace.toLowerCase().includes(afterColon))
          .map(namespace => ({ text: `namespace:${namespace}`, displayText: namespace }));
        if (matches.length > 0) sections.push({ title: 'Namespace', items: matches });
      }
    } else {
      // Regular search
      if ('status'.includes(searchLower)) {
        const matches = availableStatuses.filter(s => s !== 'All').slice(0, 5)
          .map(status => ({ text: `status:${status}`, displayText: status }));
        if (matches.length > 0) sections.push({ title: 'Status', items: matches });
      }
      
      if ('os'.includes(searchLower) || 'operating'.includes(searchLower)) {
        const matches = availableOSs.filter(os => os !== 'All').slice(0, 5)
          .map(os => ({ text: `os:${os}`, displayText: os }));
        if (matches.length > 0) sections.push({ title: 'Operating System', items: matches });
      }
      
      if ('cluster'.includes(searchLower)) {
        const matches = availableClusters.slice(0, 5)
          .map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
        if (matches.length > 0) sections.push({ title: 'Cluster', items: matches });
      }
      
      if ('namespace'.includes(searchLower)) {
        const matches = availableNamespaces.slice(0, 5)
          .map(namespace => ({ text: `namespace:${namespace}`, displayText: namespace }));
        if (matches.length > 0) sections.push({ title: 'Namespace', items: matches });
      }
      
      // VM name matches
      const vmMatches = mockVMs.filter(vm => vm.name.toLowerCase().includes(searchLower))
        .slice(0, 3).map(vm => ({ text: vm.name, displayText: vm.name }));
      if (vmMatches.length > 0) sections.push({ title: 'Virtual Machines', items: vmMatches });
      
      // Value matches
      const statusMatches = availableStatuses.filter(s => s !== 'All' && s.toLowerCase().includes(searchLower))
        .map(status => ({ text: `status:${status}`, displayText: status }));
      if (statusMatches.length > 0 && !sections.find(s => s.title === 'Status')) {
        sections.push({ title: 'Status', items: statusMatches });
      }
      
      const osMatches = availableOSs.filter(os => os !== 'All' && os.toLowerCase().includes(searchLower))
        .map(os => ({ text: `os:${os}`, displayText: os }));
      if (osMatches.length > 0 && !sections.find(s => s.title === 'Operating System')) {
        sections.push({ title: 'Operating System', items: osMatches });
      }
      
      const clusterMatches = availableClusters.filter(cluster => cluster.toLowerCase().includes(searchLower))
        .map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
      if (clusterMatches.length > 0 && !sections.find(s => s.title === 'Cluster')) {
        sections.push({ title: 'Cluster', items: clusterMatches });
      }
      
      const namespaceMatches = availableNamespaces.filter(namespace => namespace.toLowerCase().includes(searchLower))
        .map(namespace => ({ text: `namespace:${namespace}`, displayText: namespace }));
      if (namespaceMatches.length > 0 && !sections.find(s => s.title === 'Namespace')) {
        sections.push({ title: 'Namespace', items: namespaceMatches });
      }
    }
    
    return { sections, hasResults: sections.length > 0 };
  }, [queryText, availableStatuses, availableOSs, availableClusters, availableNamespaces]);

  // Filter VMs
  const filteredVMs = React.useMemo(() => {
    return mockVMs.filter(vm => {
      let matchesQueryText = true;
      if (queryText) {
        const labelValueMatch = queryText.match(/^(status|os|cluster|namespace):(.+)$/i);
        
        if (labelValueMatch) {
          const [, label, value] = labelValueMatch;
          const labelLower = label.toLowerCase();
          const valueLower = value.toLowerCase();
          
          if (labelLower === 'status') {
            matchesQueryText = vm.status.toLowerCase().includes(valueLower);
          } else if (labelLower === 'os') {
            matchesQueryText = vm.os.toLowerCase().includes(valueLower);
          } else if (labelLower === 'cluster') {
            matchesQueryText = vm.cluster.toLowerCase().includes(valueLower);
          } else if (labelLower === 'namespace') {
            matchesQueryText = vm.namespace.toLowerCase().includes(valueLower);
          }
        } else {
          matchesQueryText = 
            vm.name.toLowerCase().includes(queryText.toLowerCase()) ||
            vm.status.toLowerCase().includes(queryText.toLowerCase()) ||
            vm.os.toLowerCase().includes(queryText.toLowerCase()) ||
            vm.cluster.toLowerCase().includes(queryText.toLowerCase()) ||
            vm.namespace.toLowerCase().includes(queryText.toLowerCase());
        }
      }
      
      const matchesStatus = statusFilter === 'All' || vm.status === statusFilter;
      const matchesOS = osFilter === 'All' || vm.os === osFilter;
      
      return matchesQueryText && matchesStatus && matchesOS;
    });
  }, [queryText, statusFilter, osFilter]);

  const paginatedVMs = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredVMs.slice(start, start + perPage);
  }, [filteredVMs, page, perPage]);

  const onSetPage = (_event: any, pageNumber: number) => setPage(pageNumber);
  const onPerPageSelect = (_event: any, newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
        <div style={{ padding: 'var(--pf-v5-global--spacer--md) var(--pf-v5-global--spacer--lg) 0' }}>
          <Title headingLevel="h1" size="2xl" style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>Virtual machines</Title>
        </div>
      
        <div style={{ padding: '0 var(--pf-v5-global--spacer--lg) var(--pf-v5-global--spacer--md)' }}>
      
        {/* Search Bar and Action Buttons Row */}
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>
        {/* Query Bar */}
        <FlexItem flex={{ default: 'flex_1' }} style={{ position: 'relative', maxWidth: '600px' }}>
          <div 
            ref={searchContainerRef}
            onClick={() => queryInputRef.current?.focus()}
            style={{
              border: '1px solid var(--pf-t--global--border--color--default)',
              borderRadius: 'var(--pf-t--global--border--radius--small)',
              padding: '8px 12px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
              cursor: 'text',
              width: '100%'
            }}
          >
            <input
              ref={queryInputRef}
              type="text"
              value={queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                setIsAutocompleteOpen(e.target.value.length > 0);
              }}
              onFocus={() => queryText.length > 0 && setIsAutocompleteOpen(true)}
              placeholder="Search by name or query (e.g., status:Running cluster:hub)"
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                minWidth: '150px',
                fontSize: 'var(--pf-t--global--font--size--body--default)',
                backgroundColor: 'transparent',
                fontFamily: 'var(--pf-t--global--font--family--body)',
                color: 'var(--pf-t--global--text--color--regular)'
              }}
            />
            {queryText && (
              <Button 
                variant="plain" 
                onClick={(e) => {
                  e.stopPropagation();
                  setQueryText('');
                }}
              >
                Clear all
              </Button>
            )}
          </div>
          
          {/* Autocomplete Menu */}
          {isAutocompleteOpen && autocompleteSuggestions.hasResults && (
            <div 
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 'var(--pf-t--global--spacer--sm)',
                zIndex: 1000,
                backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
                border: '1px solid var(--pf-t--global--border--color--default)',
                borderRadius: 'var(--pf-t--global--border--radius--medium)',
                boxShadow: 'var(--pf-t--global--box-shadow--lg)',
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              <Menu>
                <MenuContent>
                  <MenuList>
                    {autocompleteSuggestions.sections.map((section, sectionIndex) => (
                      <React.Fragment key={sectionIndex}>
                        {sectionIndex > 0 && <Divider />}
                        <MenuItem isDisabled>
                          <strong style={{ 
                            fontSize: 'var(--pf-t--global--font--size--body--sm)',
                            color: 'var(--pf-t--global--text--color--subtle)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {section.title}
                          </strong>
                        </MenuItem>
                        {section.items.map((item, itemIndex) => (
                          <MenuItem 
                            key={`${sectionIndex}-${itemIndex}`}
                            onClick={() => {
                              setQueryText(item.text);
                              setIsAutocompleteOpen(false);
                              setTimeout(() => queryInputRef.current?.focus(), 0);
                            }}
                          >
                            {item.displayText}
                          </MenuItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </MenuList>
                </MenuContent>
              </Menu>
            </div>
          )}
        </FlexItem>
        
        {/* Action Buttons */}
        <FlexItem>
          <Button variant="control" aria-label="Filter" isDisabled />
        </FlexItem>
        <FlexItem>
          <Button variant="secondary" isDisabled>Save search</Button>
        </FlexItem>
        <FlexItem>
          <Dropdown
            isOpen={isActionsOpen}
            onSelect={() => setIsActionsOpen(false)}
            onOpenChange={(isOpen: boolean) => setIsActionsOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                isExpanded={isActionsOpen}
                variant="secondary"
              >
                Saved searches
              </MenuToggle>
            )}
          >
            <DropdownList>
              <DropdownItem key="search1">Search 1</DropdownItem>
              <DropdownItem key="search2">Search 2</DropdownItem>
            </DropdownList>
          </Dropdown>
        </FlexItem>
        <FlexItem>
          <Divider orientation={{ default: 'vertical' }} />
        </FlexItem>
        <FlexItem>
          <Dropdown
            isOpen={isCreateOpen}
            onSelect={() => setIsCreateOpen(false)}
            onOpenChange={(isOpen: boolean) => setIsCreateOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsCreateOpen(!isCreateOpen)}
                isExpanded={isCreateOpen}
                variant="primary"
              >
                Create
              </MenuToggle>
            )}
          >
            <DropdownList>
              <DropdownItem key="from-template">From template</DropdownItem>
              <DropdownItem key="from-yaml">From YAML</DropdownItem>
            </DropdownList>
          </Dropdown>
        </FlexItem>
        </Flex>
        
        {/* Guided Filters */}
        <Flex spaceItems={{ default: 'spaceItemsMd' }} style={{ marginBottom: 'var(--pf-v5-global--spacer--lg)' }}>
        <FlexItem>
          <Dropdown
            isOpen={isStatusFilterOpen}
            onSelect={() => setIsStatusFilterOpen(false)}
            onOpenChange={(isOpen: boolean) => setIsStatusFilterOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                isExpanded={isStatusFilterOpen}
                variant="default"
              >
                Status: {statusFilter}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {availableStatuses.map(status => (
                <DropdownItem 
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setIsStatusFilterOpen(false);
                  }}
                >
                  {status}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FlexItem>
        <FlexItem>
          <Dropdown
            isOpen={isOSFilterOpen}
            onSelect={() => setIsOSFilterOpen(false)}
            onOpenChange={(isOpen: boolean) => setIsOSFilterOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsOSFilterOpen(!isOSFilterOpen)}
                isExpanded={isOSFilterOpen}
                variant="default"
              >
                Operating system: {osFilter}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {availableOSs.map(os => (
                <DropdownItem 
                  key={os}
                  onClick={() => {
                    setOSFilter(os);
                    setIsOSFilterOpen(false);
                  }}
                >
                  {os}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FlexItem>
        </Flex>
        </div>
        
        {/* Table */}
        <div style={{ padding: '0 var(--pf-v5-global--spacer--lg)' }}>
        <Toolbar>
        <ToolbarContent>
          <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
            <Pagination
              itemCount={filteredVMs.length}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              variant="top"
              isCompact
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table variant="compact">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Operating System</Th>
            <Th>Cluster</Th>
            <Th>Namespace</Th>
            <Th>CPU</Th>
            <Th>Memory</Th>
            <Th>Disk</Th>
            <Th>IP Address</Th>
          </Tr>
        </Thead>
        <Tbody>
          {paginatedVMs.map((vm) => (
            <Tr key={vm.id}>
              <Td dataLabel="Name">{vm.name}</Td>
              <Td dataLabel="Status">
                <Label color={vm.status === 'Running' ? 'green' : vm.status === 'Error' ? 'red' : 'grey'}>
                  {vm.status}
                </Label>
              </Td>
              <Td dataLabel="Operating System">{vm.os}</Td>
              <Td dataLabel="Cluster">{vm.cluster}</Td>
              <Td dataLabel="Namespace">{vm.namespace}</Td>
              <Td dataLabel="CPU">{vm.cpu}</Td>
              <Td dataLabel="Memory">{vm.memory}</Td>
              <Td dataLabel="Disk">{vm.disk}</Td>
              <Td dataLabel="IP Address">{vm.ip}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Toolbar>
        <ToolbarContent>
          <ToolbarItem align={{ default: 'alignRight' }}>
            <Pagination
              itemCount={filteredVMs.length}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              variant="bottom"
            />
          </ToolbarItem>
        </ToolbarContent>
        </Toolbar>
        </div>
      </PageSection>
    </>
  );
};

