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
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { CheckCircleIcon, FilterIcon, SearchIcon } from '@patternfly/react-icons';
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

// Generate 200 mock nodes with varied metadata
const generateMockNodes = (): Node[] => {
  const clusters = ['production-east', 'production-west', 'staging-east', 'staging-west', 'dev-central', 'qa-north'];
  const namespaces = ['default', 'kube-system', 'monitoring', 'logging', 'app-prod', 'app-staging', 'database', 'ingress'];
  const statuses = ['Ready', 'Ready', 'Ready', 'Ready', 'Ready', 'NotReady', 'SchedulingDisabled', 'Unknown'];
  const rolesList = ['worker', 'worker', 'worker', 'worker', 'control-plane,master', 'worker,ingress'];
  const instanceTypes = ['m5.xlarge', 'm5.2xlarge', 'm5.4xlarge', 't3.large', 't3.xlarge', 'c5.2xlarge'];
  const days = ['1 day ago', '2 days ago', '3 days ago', '5 days ago', '1 week ago', '2 weeks ago', '1 month ago'];
  
  const nodes: Node[] = [];
  
  for (let i = 0; i < 200; i++) {
    const cluster = clusters[i % clusters.length];
    const namespace = namespaces[i % namespaces.length];
    const status = statuses[i % statuses.length];
    const roles = rolesList[i % rolesList.length];
    const instanceType = instanceTypes[i % instanceTypes.length];
    const created = days[i % days.length];
    
    // Generate varied metrics
    const podsUsed = Math.floor(Math.random() * 100) + 10;
    const podsMax = 110;
    const memoryUsed = (Math.random() * 28 + 4).toFixed(1);
    const memoryMax = instanceType.includes('2xlarge') ? 32 : instanceType.includes('4xlarge') ? 64 : 16;
    const cpuUsed = (Math.random() * 6 + 0.5).toFixed(1);
    const cpuMax = instanceType.includes('2xlarge') ? 8 : instanceType.includes('4xlarge') ? 16 : 4;
    const filesystem = Math.floor(Math.random() * 70) + 20;
    
    // Generate realistic node name
    const octet1 = Math.floor(Math.random() * 255);
    const octet2 = Math.floor(Math.random() * 255);
    const octet3 = Math.floor(Math.random() * 255);
    const name = `ip-10-${octet1}-${octet2}-${octet3}.ec2.internal`;
    
    nodes.push({
      name,
      status,
      roles,
      pods: `${podsUsed}/${podsMax}`,
      memory: `${memoryUsed} GiB / ${memoryMax} GiB`,
      cpu: `${cpuUsed} / ${cpuMax} cores`,
      filesystem: `${filesystem}%`,
      created,
      instanceType,
      cluster,
      namespace,
    });
  }
  
  return nodes;
};

const mockNodes: Node[] = generateMockNodes();

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
    const filterPrefixMatch = queryText.match(/^(name|cluster|namespace|status|role|pods|memory|cpu|filesystem|instancetype|created):/i);
    
    if (filterPrefixMatch) {
      const filterType = filterPrefixMatch[1].toLowerCase();
      const afterColon = queryText.substring(filterType.length + 1).toLowerCase();
      
      if (filterType === 'name') {
        const matches = mockNodes
          .filter(node => node.name.toLowerCase().includes(afterColon))
          .slice(0, 5)
          .map(node => ({ text: `name:${node.name}`, displayText: node.name }));
        if (matches.length > 0) sections.push({ title: 'Name', items: matches });
      } else if (filterType === 'cluster') {
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
      } else if (filterType === 'instancetype') {
        const instanceTypes = Array.from(new Set(mockNodes.map(n => n.instanceType)));
        const matches = instanceTypes
          .filter(type => type.toLowerCase().includes(afterColon))
          .map(type => ({ text: `instanceType:${type}`, displayText: type }));
        if (matches.length > 0) sections.push({ title: 'Instance Type', items: matches });
      }
    } else {
      // Regular search - show suggestions for searchable fields
      const keywords = ['name:', 'cluster:', 'namespace:', 'status:', 'role:', 'instanceType:', 'pods:', 'memory:', 'cpu:', 'filesystem:', 'created:'];
      const matchingKeywords = keywords.filter(kw => kw.toLowerCase().includes(searchLower));
      
      if (matchingKeywords.length > 0) {
        sections.push({ 
          title: 'Search by field', 
          items: matchingKeywords.map(kw => ({ text: kw, displayText: kw }))
        });
      }
      
      // Node name matches
      const nodeMatches = mockNodes
        .filter(node => node.name.toLowerCase().includes(searchLower))
        .slice(0, 3)
        .map(node => ({ text: node.name, displayText: node.name }));
      if (nodeMatches.length > 0) sections.push({ title: 'Nodes', items: nodeMatches });
      
      // Value matches for filters
      const clusterMatches = uniqueClusters
        .filter(c => c.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(c => ({ text: `cluster:${c}`, displayText: c }));
      if (clusterMatches.length > 0) {
        sections.push({ title: 'Cluster', items: clusterMatches });
      }
      
      const namespaceMatches = uniqueNamespaces
        .filter(ns => ns.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(ns => ({ text: `namespace:${ns}`, displayText: ns }));
      if (namespaceMatches.length > 0) {
        sections.push({ title: 'Namespace', items: namespaceMatches });
      }
      
      const statusMatches = uniqueStatuses
        .filter(s => s.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(s => ({ text: `status:${s}`, displayText: s }));
      if (statusMatches.length > 0) {
        sections.push({ title: 'Status', items: statusMatches });
      }
      
      const roleMatches = uniqueRoles
        .filter(r => r.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(r => ({ text: `role:${r}`, displayText: r }));
      if (roleMatches.length > 0) {
        sections.push({ title: 'Role', items: roleMatches });
      }
    }
    
    return { sections, hasResults: sections.length > 0 };
  }, [queryText, uniqueClusters, uniqueNamespaces, uniqueStatuses, uniqueRoles]);

  // Filter nodes with AND logic for all filters
  const filteredNodes = React.useMemo(() => {
    return mockNodes.filter(node => {
      // Collect all filter conditions
      const conditions: boolean[] = [];
      
      // Process query chips (label:value pairs from filter dropdowns)
      queryChips.forEach(chip => {
        if (chip.type === 'cluster') {
          conditions.push(node.cluster.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'namespace') {
          conditions.push(node.namespace.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'status') {
          conditions.push(node.status.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'role') {
          conditions.push(node.roles.toLowerCase().includes(chip.value.toLowerCase()));
        }
      });
      
      // Process queryText for label:value patterns
      if (queryText) {
        // Extract all label:value patterns from queryText
        const labelValueRegex = /(name|cluster|namespace|status|role|pods|memory|cpu|filesystem|instancetype|instanceType|created):([^\s]+)/gi;
        const matches = [...queryText.matchAll(labelValueRegex)];
        
        if (matches.length > 0) {
          // Apply each label:value filter with AND logic
          matches.forEach(match => {
            const label = match[1].toLowerCase();
            const value = match[2].toLowerCase();
            
            if (label === 'name') {
              conditions.push(node.name.toLowerCase().includes(value));
            } else if (label === 'cluster') {
              conditions.push(node.cluster.toLowerCase().includes(value));
            } else if (label === 'namespace') {
              conditions.push(node.namespace.toLowerCase().includes(value));
            } else if (label === 'status') {
              conditions.push(node.status.toLowerCase().includes(value));
            } else if (label === 'role') {
              conditions.push(node.roles.toLowerCase().includes(value));
            } else if (label === 'pods') {
              conditions.push(node.pods.toLowerCase().includes(value));
            } else if (label === 'memory') {
              conditions.push(node.memory.toLowerCase().includes(value));
            } else if (label === 'cpu') {
              conditions.push(node.cpu.toLowerCase().includes(value));
            } else if (label === 'filesystem') {
              conditions.push(node.filesystem.toLowerCase().includes(value));
            } else if (label === 'instancetype') {
              conditions.push(node.instanceType.toLowerCase().includes(value));
            } else if (label === 'created') {
              conditions.push(node.created.toLowerCase().includes(value));
            }
          });
        } else {
          // No label:value pattern, search across all fields with OR logic
          const searchLower = queryText.toLowerCase();
          const matchesAnyField = 
            node.name.toLowerCase().includes(searchLower) ||
            node.cluster.toLowerCase().includes(searchLower) ||
            node.namespace.toLowerCase().includes(searchLower) ||
            node.status.toLowerCase().includes(searchLower) ||
            node.roles.toLowerCase().includes(searchLower) ||
            node.pods.toLowerCase().includes(searchLower) ||
            node.memory.toLowerCase().includes(searchLower) ||
            node.cpu.toLowerCase().includes(searchLower) ||
            node.filesystem.toLowerCase().includes(searchLower) ||
            node.instanceType.toLowerCase().includes(searchLower) ||
            node.created.toLowerCase().includes(searchLower);
          conditions.push(matchesAnyField);
        }
      }
      
      // Apply dropdown filters (multi-select with OR within same type, AND across types)
      if (clusterFilter.length > 0) {
        conditions.push(clusterFilter.includes(node.cluster));
      }
      if (namespaceFilter.length > 0) {
        conditions.push(namespaceFilter.includes(node.namespace));
      }
      if (statusFilter.length > 0) {
        conditions.push(statusFilter.includes(node.status));
      }
      if (roleFilter.length > 0) {
        conditions.push(roleFilter.some(role => node.roles.includes(role)));
      }
      
      // AND logic: all conditions must be true
      return conditions.length === 0 || conditions.every(condition => condition);
    });
  }, [queryText, queryChips, clusterFilter, namespaceFilter, statusFilter, roleFilter]);

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
      <PageSection 
        variant={PageSectionVariants.default} 
        padding={{ default: 'noPadding' }}
        style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}
      >
        <div style={{ 
          backgroundColor: '#ffffff',
          padding: 'var(--pf-v5-global--spacer--md) var(--pf-v5-global--spacer--lg)'
        }}>
          <Title headingLevel="h1" size="xl" style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>Nodes</Title>
      
        {/* Search Bar */}
        <div style={{ 
          marginBottom: 'var(--pf-v5-global--spacer--md)', 
          position: 'relative',
          width: '100%',
          maxWidth: '800px'
        }}>
          {/* Custom Search Input with Chips Inside */}
          <div 
            ref={searchContainerRef}
            onClick={() => queryInputRef.current?.focus()}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--pf-v5-global--BorderColor--100)',
              borderRadius: 'var(--pf-v5-global--BorderRadius--sm)',
              minHeight: '36px',
              cursor: 'text',
              boxShadow: 'inset 0 1px 1px rgba(3, 3, 3, 0.12)',
              transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--pf-v5-global--primary-color--100)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(3, 3, 3, 0.12), 0 0 0 0.125rem rgba(6, 114, 210, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--pf-v5-global--BorderColor--100)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(3, 3, 3, 0.12)';
            }}
          >
            {/* Query Chips Inside Search Bar */}
            {queryChips.map((chip) => (
              <Label
                key={chip.key}
                color="blue"
                isCompact
                onClose={() => removeQueryChip(chip.key)}
              >
                {chip.label}
              </Label>
            ))}
            
            {/* Search Input */}
            <input
              ref={queryInputRef}
              type="text"
              placeholder={queryChips.length === 0 ? "Search by name or use filters (e.g., status:Ready cluster:production-east instanceType:m5.xlarge)" : ""}
              value={queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                setIsAutocompleteOpen(e.target.value.length > 0);
              }}
              onFocus={() => queryText.length > 0 && setIsAutocompleteOpen(true)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '14px',
                minWidth: '200px'
              }}
            />
            
            {/* Clear All Button */}
            {(queryChips.length > 0 || queryText) && (
              <Button 
                variant="plain"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllChips();
                }}
                style={{ padding: '4px' }}
              >
                <svg fill="currentColor" height="1em" width="1em" viewBox="0 0 352 512">
                  <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/>
                </svg>
              </Button>
            )}
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
                icon={<FilterIcon />}
                style={{
                  width: '180px'
                }}
              >
                Cluster {clusterFilter.length > 0 && <Badge isRead>{clusterFilter.length}</Badge>}
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
                icon={<FilterIcon />}
                style={{
                  width: '180px'
                }}
              >
                Namespace {namespaceFilter.length > 0 && <Badge isRead>{namespaceFilter.length}</Badge>}
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
                icon={<FilterIcon />}
                style={{
                  width: '180px'
                }}
              >
                Status {statusFilter.length > 0 && <Badge isRead>{statusFilter.length}</Badge>}
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
                icon={<FilterIcon />}
                style={{
                  width: '180px'
                }}
              >
                Role {roleFilter.length > 0 && <Badge isRead>{roleFilter.length}</Badge>}
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
        <Toolbar style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }}>
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

      {filteredNodes.length === 0 ? (
        <div style={{ 
          backgroundColor: '#ffffff',
          padding: 'var(--pf-v5-global--spacer--2xl) var(--pf-v5-global--spacer--lg)',
          marginBottom: 'var(--pf-v5-global--spacer--md)'
        }}>
          <EmptyState>
            <EmptyStateHeader 
              titleText="No results found" 
              icon={<EmptyStateIcon icon={SearchIcon} />} 
              headingLevel="h2" 
            />
            <EmptyStateBody>
              No nodes match your current filter criteria. Try adjusting your search or clearing some filters.
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="link" onClick={clearAllChips}>
                  Clear all filters
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#ffffff',
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
      )}

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

