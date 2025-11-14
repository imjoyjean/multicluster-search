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
  SearchInput,
  Badge,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { CheckCircleIcon, FilterIcon } from '@patternfly/react-icons';
import { useSearchParams } from 'react-router-dom';

interface Node {
  name: string;
  status: string;
  roles: string;
  pods: string;
  memory: string;
  cpu: string;
  filesystem: string;
  created: string;
  instanceType: string;
  cluster: string;
  namespace: string;
}

const mockNodes: Node[] = [
  {
    name: 'ip-10-0-45-182.ec2.internal',
    status: 'Ready',
    roles: 'worker',
    pods: '24/110',
    memory: '8.5 GiB / 16 GiB',
    cpu: '1.2 / 4 cores',
    filesystem: '45%',
    created: '2 days ago',
    instanceType: 'm5.xlarge',
    cluster: 'production-east',
    namespace: 'default',
  },
  {
    name: 'ip-10-0-67-234.ec2.internal',
    status: 'Ready',
    roles: 'control-plane,master',
    pods: '18/110',
    memory: '12.1 GiB / 32 GiB',
    cpu: '2.4 / 8 cores',
    filesystem: '62%',
    created: '5 days ago',
    instanceType: 'm5.2xlarge',
    cluster: 'production-east',
    namespace: 'kube-system',
  },
  {
    name: 'ip-10-0-89-156.ec2.internal',
    status: 'Ready',
    roles: 'worker',
    pods: '31/110',
    memory: '6.8 GiB / 16 GiB',
    cpu: '0.9 / 4 cores',
    filesystem: '38%',
    created: '1 day ago',
    instanceType: 'm5.xlarge',
    cluster: 'staging-west',
    namespace: 'default',
  },
  {
    name: 'ip-10-0-123-45.ec2.internal',
    status: 'Ready',
    roles: 'worker',
    pods: '27/110',
    memory: '10.2 GiB / 16 GiB',
    cpu: '1.8 / 4 cores',
    filesystem: '51%',
    created: '3 days ago',
    instanceType: 'm5.xlarge',
    cluster: 'production-west',
    namespace: 'default',
  },
  {
    name: 'ip-10-0-234-67.ec2.internal',
    status: 'Ready',
    roles: 'worker',
    pods: '22/110',
    memory: '7.3 GiB / 16 GiB',
    cpu: '1.1 / 4 cores',
    filesystem: '42%',
    created: '4 days ago',
    instanceType: 'm5.xlarge',
    cluster: 'staging-east',
    namespace: 'monitoring',
  },
];

export const NodesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [page, setPage] = React.useState(parseInt(searchParams.get('page') || '1'));
  const [perPage, setPerPage] = React.useState(parseInt(searchParams.get('perPage') || '10'));
  const [queryText, setQueryText] = React.useState(searchParams.get('query') || '');
  const [queryChips, setQueryChips] = React.useState<Array<{ key: string; label: string; value: string; type: string }>>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
  const queryInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Multi-select filter states
  const [clusterFilter, setClusterFilter] = React.useState<string[]>([]);
  const [namespaceFilter, setNamespaceFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [roleFilter, setRoleFilter] = React.useState<string[]>([]);
  
  // Dropdown open states
  const [isClusterFilterOpen, setIsClusterFilterOpen] = React.useState(false);
  const [isNamespaceFilterOpen, setIsNamespaceFilterOpen] = React.useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = React.useState(false);
  const [isRoleFilterOpen, setIsRoleFilterOpen] = React.useState(false);
  
  // Sync state to URL params
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (queryText) params.set('query', queryText);
    else params.delete('query');
    
    if (page !== 1) params.set('page', page.toString());
    else params.delete('page');
    
    if (perPage !== 10) params.set('perPage', perPage.toString());
    else params.delete('perPage');
    
    setSearchParams(params, { replace: true });
  }, [queryText, page, perPage, searchParams, setSearchParams]);
  
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
  
  // Handle clicking anywhere in the search container to focus input
  const handleSearchContainerClick = () => {
    queryInputRef.current?.focus();
  };

  // Get unique values for filters
  const uniqueClusters = React.useMemo(() => Array.from(new Set(mockNodes.map(n => n.cluster))), []);
  const uniqueNamespaces = React.useMemo(() => Array.from(new Set(mockNodes.map(n => n.namespace))), []);
  const uniqueStatuses = React.useMemo(() => Array.from(new Set(mockNodes.map(n => n.status))), []);
  const uniqueRoles = React.useMemo(() => {
    const roles = new Set<string>();
    mockNodes.forEach(n => n.roles.split(',').forEach(r => roles.add(r.trim())));
    return Array.from(roles);
  }, []);

  // Add query chip
  const addQueryChip = (type: string, label: string, value: string) => {
    const key = `${type}-${value.replace(/\s+/g, '-')}`;
    if (!queryChips.find(chip => chip.key === key)) {
      setQueryChips([...queryChips, { key, label, value, type }]);
    }
  };

  // Remove query chip
  const removeQueryChip = (key: string) => {
    const chip = queryChips.find(c => c.key === key);
    if (chip) {
      // Update corresponding filter state
      if (chip.type === 'cluster') {
        setClusterFilter(clusterFilter.filter(c => c !== chip.value));
      } else if (chip.type === 'namespace') {
        setNamespaceFilter(namespaceFilter.filter(n => n !== chip.value));
      } else if (chip.type === 'status') {
        setStatusFilter(statusFilter.filter(s => s !== chip.value));
      } else if (chip.type === 'role') {
        setRoleFilter(roleFilter.filter(r => r !== chip.value));
      }
    }
    setQueryChips(queryChips.filter(chip => chip.key !== key));
  };

  // Clear all chips
  const clearAllChips = () => {
    setQueryChips([]);
    setQueryText('');
    setClusterFilter([]);
    setNamespaceFilter([]);
    setStatusFilter([]);
    setRoleFilter([]);
  };

  // Autocomplete suggestions
  const autocompleteSuggestions = React.useMemo(() => {
    if (!queryText) return { sections: [], hasResults: false };
    
    const searchLower = queryText.toLowerCase();
    const sections: Array<{ title: string; items: Array<{ text: string; displayText: string }> }> = [];
    
    // Check if user is typing a filter prefix
    const filterPrefixMatch = queryText.match(/^(cluster|namespace|status|role):/i);
    
    if (filterPrefixMatch) {
      const filterType = filterPrefixMatch[1].toLowerCase();
      const afterColon = queryText.substring(filterType.length + 1).toLowerCase();
      
      if (filterType === 'cluster') {
        const matches = uniqueClusters
          .filter(cluster => cluster.toLowerCase().includes(afterColon))
          .map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
        if (matches.length > 0) sections.push({ title: 'Cluster', items: matches });
      } else if (filterType === 'namespace') {
        const matches = uniqueNamespaces
          .filter(ns => ns.toLowerCase().includes(afterColon))
          .map(ns => ({ text: `namespace:${ns}`, displayText: ns }));
        if (matches.length > 0) sections.push({ title: 'Namespace', items: matches });
      } else if (filterType === 'status') {
        const matches = uniqueStatuses
          .filter(status => status.toLowerCase().includes(afterColon))
          .map(status => ({ text: `status:${status}`, displayText: status }));
        if (matches.length > 0) sections.push({ title: 'Status', items: matches });
      } else if (filterType === 'role') {
        const matches = uniqueRoles
          .filter(role => role.toLowerCase().includes(afterColon))
          .map(role => ({ text: `role:${role}`, displayText: role }));
        if (matches.length > 0) sections.push({ title: 'Role', items: matches });
      }
    } else {
      // Regular search
      if ('cluster'.includes(searchLower)) {
        const matches = uniqueClusters.slice(0, 5).map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
        if (matches.length > 0) sections.push({ title: 'Cluster', items: matches });
      }
      
      if ('namespace'.includes(searchLower)) {
        const matches = uniqueNamespaces.slice(0, 5).map(ns => ({ text: `namespace:${ns}`, displayText: ns }));
        if (matches.length > 0) sections.push({ title: 'Namespace', items: matches });
      }
      
      if ('status'.includes(searchLower)) {
        const matches = uniqueStatuses.slice(0, 5).map(status => ({ text: `status:${status}`, displayText: status }));
        if (matches.length > 0) sections.push({ title: 'Status', items: matches });
      }
      
      if ('role'.includes(searchLower)) {
        const matches = uniqueRoles.slice(0, 5).map(role => ({ text: `role:${role}`, displayText: role }));
        if (matches.length > 0) sections.push({ title: 'Role', items: matches });
      }
      
      // Node name matches
      const nodeMatches = mockNodes
        .filter(node => node.name.toLowerCase().includes(searchLower))
        .slice(0, 3)
        .map(node => ({ text: node.name, displayText: node.name }));
      if (nodeMatches.length > 0) sections.push({ title: 'Nodes', items: nodeMatches });
      
      // Value matches
      const clusterMatches = uniqueClusters
        .filter(c => c.toLowerCase().includes(searchLower))
        .map(c => ({ text: `cluster:${c}`, displayText: c }));
      if (clusterMatches.length > 0 && !sections.find(s => s.title === 'Cluster')) {
        sections.push({ title: 'Cluster', items: clusterMatches });
      }
      
      const namespaceMatches = uniqueNamespaces
        .filter(ns => ns.toLowerCase().includes(searchLower))
        .map(ns => ({ text: `namespace:${ns}`, displayText: ns }));
      if (namespaceMatches.length > 0 && !sections.find(s => s.title === 'Namespace')) {
        sections.push({ title: 'Namespace', items: namespaceMatches });
      }
      
      const statusMatches = uniqueStatuses
        .filter(s => s.toLowerCase().includes(searchLower))
        .map(s => ({ text: `status:${s}`, displayText: s }));
      if (statusMatches.length > 0 && !sections.find(s => s.title === 'Status')) {
        sections.push({ title: 'Status', items: statusMatches });
      }
      
      const roleMatches = uniqueRoles
        .filter(r => r.toLowerCase().includes(searchLower))
        .map(r => ({ text: `role:${r}`, displayText: r }));
      if (roleMatches.length > 0 && !sections.find(s => s.title === 'Role')) {
        sections.push({ title: 'Role', items: roleMatches });
      }
    }
    
    return { sections, hasResults: sections.length > 0 };
  }, [queryText, uniqueClusters, uniqueNamespaces, uniqueStatuses, uniqueRoles]);

  // Filter nodes
  const filteredNodes = React.useMemo(() => {
    return mockNodes.filter(node => {
      // Check query text
      let matchesQueryText = true;
      if (queryText) {
        const labelValueMatch = queryText.match(/^(cluster|namespace|status|role):(.+)$/i);
        
        if (labelValueMatch) {
          const [, label, value] = labelValueMatch;
          const labelLower = label.toLowerCase();
          const valueLower = value.toLowerCase();
          
          if (labelLower === 'cluster') {
            matchesQueryText = node.cluster.toLowerCase().includes(valueLower);
          } else if (labelLower === 'namespace') {
            matchesQueryText = node.namespace.toLowerCase().includes(valueLower);
          } else if (labelLower === 'status') {
            matchesQueryText = node.status.toLowerCase().includes(valueLower);
          } else if (labelLower === 'role') {
            matchesQueryText = node.roles.toLowerCase().includes(valueLower);
          }
        } else {
          matchesQueryText = 
            node.name.toLowerCase().includes(queryText.toLowerCase()) ||
            node.cluster.toLowerCase().includes(queryText.toLowerCase()) ||
            node.namespace.toLowerCase().includes(queryText.toLowerCase()) ||
            node.status.toLowerCase().includes(queryText.toLowerCase()) ||
            node.roles.toLowerCase().includes(queryText.toLowerCase());
        }
      }
      
      // Check filters
      const matchesCluster = clusterFilter.length === 0 || clusterFilter.includes(node.cluster);
      const matchesNamespace = namespaceFilter.length === 0 || namespaceFilter.includes(node.namespace);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(node.status);
      const matchesRole = roleFilter.length === 0 || roleFilter.some(role => node.roles.includes(role));
      
      return matchesQueryText && matchesCluster && matchesNamespace && matchesStatus && matchesRole;
    });
  }, [queryText, clusterFilter, namespaceFilter, statusFilter, roleFilter]);

  const paginatedNodes = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredNodes.slice(start, start + perPage);
  }, [filteredNodes, page, perPage]);

  const onSetPage = (_event: any, pageNumber: number) => setPage(pageNumber);
  const onPerPageSelect = (_event: any, newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  // Handle filter changes
  const handleClusterFilterChange = (cluster: string, checked: boolean) => {
    const newFilter = checked 
      ? [...clusterFilter, cluster]
      : clusterFilter.filter(c => c !== cluster);
    setClusterFilter(newFilter);
    
    if (checked) {
      addQueryChip('cluster', `cluster:${cluster}`, cluster);
    } else {
      removeQueryChip(`cluster-${cluster.replace(/\s+/g, '-')}`);
    }
  };

  const handleNamespaceFilterChange = (namespace: string, checked: boolean) => {
    const newFilter = checked 
      ? [...namespaceFilter, namespace]
      : namespaceFilter.filter(n => n !== namespace);
    setNamespaceFilter(newFilter);
    
    if (checked) {
      addQueryChip('namespace', `namespace:${namespace}`, namespace);
    } else {
      removeQueryChip(`namespace-${namespace.replace(/\s+/g, '-')}`);
    }
  };

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    const newFilter = checked 
      ? [...statusFilter, status]
      : statusFilter.filter(s => s !== status);
    setStatusFilter(newFilter);
    
    if (checked) {
      addQueryChip('status', `status:${status}`, status);
    } else {
      removeQueryChip(`status-${status.replace(/\s+/g, '-')}`);
    }
  };

  const handleRoleFilterChange = (role: string, checked: boolean) => {
    const newFilter = checked 
      ? [...roleFilter, role]
      : roleFilter.filter(r => r !== role);
    setRoleFilter(newFilter);
    
    if (checked) {
      addQueryChip('role', `role:${role}`, role);
    } else {
      removeQueryChip(`role-${role.replace(/\s+/g, '-')}`);
    }
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.default} padding={{ default: 'noPadding' }}>
        <div style={{ padding: 'var(--pf-v5-global--spacer--md) var(--pf-v5-global--spacer--lg) 0' }}>
          <Title headingLevel="h1" size="xl" style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>Nodes</Title>
        </div>
      
        <div style={{ padding: '0 var(--pf-v5-global--spacer--lg) var(--pf-v5-global--spacer--md)' }}>
      
        {/* Search Bar */}
        <div style={{ 
          marginBottom: 'var(--pf-v5-global--spacer--md)', 
          position: 'relative',
          width: '100%',
          maxWidth: '600px'
        }}>
          {/* Query Chips */}
          {queryChips.length > 0 && (
            <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: 'var(--pf-v5-global--spacer--sm)' }}>
              {queryChips.map((chip) => (
                <FlexItem key={chip.key}>
                  <Label
                    color="blue"
                    isCompact
                    onClose={() => removeQueryChip(chip.key)}
                  >
                    {chip.label}
                  </Label>
                </FlexItem>
              ))}
              <FlexItem>
                <Button 
                  variant="link" 
                  isInline
                  onClick={clearAllChips}
                >
                  Clear all
                </Button>
              </FlexItem>
            </Flex>
          )}
          
          {/* PatternFly SearchInput */}
          <div ref={searchContainerRef}>
            <SearchInput
              ref={queryInputRef}
              placeholder="Search by name or query (e.g., status:Ready cluster:production-east)"
              value={queryText}
              onChange={(_event, value) => {
                setQueryText(value);
                setIsAutocompleteOpen(value.length > 0);
              }}
              onFocus={() => queryText.length > 0 && setIsAutocompleteOpen(true)}
              onClear={() => {
                setQueryText('');
                setIsAutocompleteOpen(false);
              }}
            />
          </div>
        
        {/* Autocomplete Menu */}
        {isAutocompleteOpen && autocompleteSuggestions.hasResults && (
          <div 
            onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking in autocomplete
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              zIndex: 1000,
              backgroundColor: '#ffffff',
              border: '1px solid #6a6e73',
              borderRadius: '3px',
              boxShadow: '0 0.25rem 0.5rem 0rem rgba(3, 3, 3, 0.2), 0 0 0.25rem 0 rgba(3, 3, 3, 0.12)',
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
                            // Set focus back to input after a brief delay
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
        </div>
        
        {/* Guided Filters */}
        <Flex spaceItems={{ default: 'spaceItemsMd' }} style={{ marginBottom: 'var(--pf-v5-global--spacer--lg)' }}>
        <FlexItem>
          <Dropdown
            isOpen={isClusterFilterOpen}
            onSelect={() => {}}
            onOpenChange={(isOpen: boolean) => setIsClusterFilterOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsClusterFilterOpen(!isClusterFilterOpen)}
                isExpanded={isClusterFilterOpen}
                variant="default"
                aria-label="Cluster filter"
                icon={<FilterIcon />}
                style={{
                  backgroundColor: '#ffffff',
                  minWidth: '160px'
                }}
              >
                Cluster
              </MenuToggle>
            )}
          >
            <DropdownList>
              {uniqueClusters.map(cluster => (
                <DropdownItem 
                  key={cluster}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`cluster-${cluster}`}
                    label={cluster}
                    isChecked={clusterFilter.includes(cluster)}
                    onChange={(event, checked) => handleClusterFilterChange(cluster, checked)}
                  />
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FlexItem>
        <FlexItem>
          <Dropdown
            isOpen={isNamespaceFilterOpen}
            onSelect={() => {}}
            onOpenChange={(isOpen: boolean) => setIsNamespaceFilterOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsNamespaceFilterOpen(!isNamespaceFilterOpen)}
                isExpanded={isNamespaceFilterOpen}
                variant="default"
                aria-label="Namespace filter"
                icon={<FilterIcon />}
                style={{
                  backgroundColor: '#ffffff',
                  minWidth: '160px'
                }}
              >
                Namespace
              </MenuToggle>
            )}
          >
            <DropdownList>
              {uniqueNamespaces.map(namespace => (
                <DropdownItem 
                  key={namespace}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`namespace-${namespace}`}
                    label={namespace}
                    isChecked={namespaceFilter.includes(namespace)}
                    onChange={(event, checked) => handleNamespaceFilterChange(namespace, checked)}
                  />
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FlexItem>
        <FlexItem>
          <Dropdown
            isOpen={isStatusFilterOpen}
            onSelect={() => {}}
            onOpenChange={(isOpen: boolean) => setIsStatusFilterOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                isExpanded={isStatusFilterOpen}
                variant="default"
                aria-label="Status filter"
                icon={<FilterIcon />}
                style={{
                  backgroundColor: '#ffffff',
                  minWidth: '160px'
                }}
              >
                Status
              </MenuToggle>
            )}
          >
            <DropdownList>
              {uniqueStatuses.map(status => (
                <DropdownItem 
                  key={status}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`status-${status}`}
                    label={status}
                    isChecked={statusFilter.includes(status)}
                    onChange={(event, checked) => handleStatusFilterChange(status, checked)}
                  />
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FlexItem>
        <FlexItem>
          <Dropdown
            isOpen={isRoleFilterOpen}
            onSelect={() => {}}
            onOpenChange={(isOpen: boolean) => setIsRoleFilterOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                isExpanded={isRoleFilterOpen}
                variant="default"
                aria-label="Role filter"
                icon={<FilterIcon />}
                style={{
                  backgroundColor: '#ffffff',
                  minWidth: '160px'
                }}
              >
                Role
              </MenuToggle>
            )}
          >
            <DropdownList>
              {uniqueRoles.map(role => (
                <DropdownItem 
                  key={role}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`role-${role}`}
                    label={role}
                    isChecked={roleFilter.includes(role)}
                    onChange={(event, checked) => handleRoleFilterChange(role, checked)}
                  />
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </FlexItem>
        </Flex>
        </div>
        
        {/* Table */}
        <Toolbar>
        <ToolbarContent>
          <ToolbarItem variant="pagination" align={{ default: 'alignRight' }}>
            <Pagination
              itemCount={filteredNodes.length}
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

      <div style={{ 
        backgroundColor: 'var(--pf-v5-global--BackgroundColor--100)',
        borderRadius: '3px',
        padding: '0 var(--pf-v5-global--spacer--lg)',
        marginBottom: 'var(--pf-v5-global--spacer--md)'
      }}>
      <Table variant="compact">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Roles</Th>
            <Th>Cluster</Th>
            <Th>Namespace</Th>
            <Th>Pods</Th>
            <Th>Memory</Th>
            <Th>CPU</Th>
            <Th>Filesystem</Th>
            <Th>Instance Type</Th>
            <Th>Created</Th>
          </Tr>
        </Thead>
        <Tbody>
          {paginatedNodes.map((node, index) => (
            <Tr key={index}>
              <Td dataLabel="Name">{node.name}</Td>
              <Td dataLabel="Status">
                <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }} style={{ gap: '0.25rem' }}>
                  <FlexItem>
                    <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)', fontSize: '14px' }} />
                  </FlexItem>
                  <FlexItem style={{ fontSize: '14px' }}>{node.status}</FlexItem>
                </Flex>
              </Td>
              <Td dataLabel="Roles">{node.roles}</Td>
              <Td dataLabel="Cluster">{node.cluster}</Td>
              <Td dataLabel="Namespace">{node.namespace}</Td>
              <Td dataLabel="Pods">{node.pods}</Td>
              <Td dataLabel="Memory">{node.memory}</Td>
              <Td dataLabel="CPU">{node.cpu}</Td>
              <Td dataLabel="Filesystem">{node.filesystem}</Td>
              <Td dataLabel="Instance Type">{node.instanceType}</Td>
              <Td dataLabel="Created">{node.created}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      </div>

      <Toolbar>
        <ToolbarContent>
          <ToolbarItem align={{ default: 'alignRight' }}>
            <Pagination
              itemCount={filteredNodes.length}
              perPage={perPage}
              page={page}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              variant="bottom"
            />
          </ToolbarItem>
        </ToolbarContent>
        </Toolbar>
      </PageSection>
    </>
  );
};

