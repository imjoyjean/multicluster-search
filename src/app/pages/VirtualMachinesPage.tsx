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
import { Table, Thead, Tbody, Tr, Th, Td, ThProps } from '@patternfly/react-table';
import { FilterIcon, SearchIcon } from '@patternfly/react-icons';
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
  const [queryChips, setQueryChips] = React.useState<Array<{ key: string; label: string; value: string; type: string }>>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
  const queryInputRef = React.useRef<HTMLInputElement>(null);
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchWrapperRef = React.useRef<HTMLDivElement>(null);
  const isProgrammaticUpdate = React.useRef(false);
  
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
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as HTMLElement)) {
        setIsAutocompleteOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Query chip management functions
  const addQueryChip = (type: string, label: string, value: string) => {
    const newChip = { key: `${type}-${value.replace(/\s+/g, '-')}`, label, value, type };
    setQueryChips(prev => {
      if (!prev.some(chip => chip.key === newChip.key)) {
        // Sync with filter dropdowns
        if (type === 'status' && statusFilter !== value) {
          setStatusFilter(value);
        } else if (type === 'os' && osFilter !== value) {
          setOSFilter(value);
        }
        return [...prev, newChip];
      }
      return prev;
    });
  };

  const removeQueryChip = (key: string) => {
    const chipToRemove = queryChips.find(chip => chip.key === key);
    if (chipToRemove) {
      if (chipToRemove.type === 'status') {
        setStatusFilter('All');
      } else if (chipToRemove.type === 'os') {
        setOSFilter('All');
      }
    }
    setQueryChips(queryChips.filter(chip => chip.key !== key));
  };

  const clearAllChips = () => {
    setQueryChips([]);
    setQueryText('');
    setStatusFilter('All');
    setOSFilter('All');
  };

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
    
    const filterPrefixMatch = queryText.match(/^(name|status|os|cluster|namespace|cpu|memory|disk|ip):/i);
    
    if (filterPrefixMatch) {
      const filterType = filterPrefixMatch[1].toLowerCase();
      const afterColon = queryText.substring(filterType.length + 1);
      
      if (filterType === 'name') {
        const matches = mockVMs
          .filter(vm => !afterColon || vm.name.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(vm => ({ text: `name:${vm.name}`, displayText: vm.name }));
        if (matches.length > 0) sections.push({ title: 'Name', items: matches });
      } else if (filterType === 'status') {
        const matches = availableStatuses.filter(s => s !== 'All' && (!afterColon || s.toLowerCase().includes(afterColon.toLowerCase())))
          .map(status => ({ text: `status:${status}`, displayText: status }));
        if (matches.length > 0) sections.push({ title: 'Status', items: matches });
      } else if (filterType === 'os') {
        const matches = availableOSs.filter(os => os !== 'All' && (!afterColon || os.toLowerCase().includes(afterColon.toLowerCase())))
          .map(os => ({ text: `os:${os}`, displayText: os }));
        if (matches.length > 0) sections.push({ title: 'Operating System', items: matches });
      } else if (filterType === 'cluster') {
        const matches = availableClusters.filter(cluster => !afterColon || cluster.toLowerCase().includes(afterColon.toLowerCase()))
          .map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
        if (matches.length > 0) sections.push({ title: 'Cluster', items: matches });
      } else if (filterType === 'namespace') {
        const matches = availableNamespaces.filter(namespace => !afterColon || namespace.toLowerCase().includes(afterColon.toLowerCase()))
          .map(namespace => ({ text: `namespace:${namespace}`, displayText: namespace }));
        if (matches.length > 0) sections.push({ title: 'Namespace', items: matches });
      } else if (filterType === 'cpu') {
        const cpuValues = Array.from(new Set(mockVMs.map(vm => vm.cpu)));
        const matches = cpuValues
          .filter(cpu => !afterColon || cpu.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(cpu => ({ text: `cpu:${cpu}`, displayText: cpu }));
        if (matches.length > 0) sections.push({ title: 'CPU', items: matches });
      } else if (filterType === 'memory') {
        const memoryValues = Array.from(new Set(mockVMs.map(vm => vm.memory)));
        const matches = memoryValues
          .filter(memory => !afterColon || memory.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(memory => ({ text: `memory:${memory}`, displayText: memory }));
        if (matches.length > 0) sections.push({ title: 'Memory', items: matches });
      } else if (filterType === 'disk') {
        const diskValues = Array.from(new Set(mockVMs.map(vm => vm.disk)));
        const matches = diskValues
          .filter(disk => !afterColon || disk.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(disk => ({ text: `disk:${disk}`, displayText: disk }));
        if (matches.length > 0) sections.push({ title: 'Disk', items: matches });
      } else if (filterType === 'ip') {
        const ipValues = Array.from(new Set(mockVMs.map(vm => vm.ip)));
        const matches = ipValues
          .filter(ip => !afterColon || ip.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(ip => ({ text: `ip:${ip}`, displayText: ip }));
        if (matches.length > 0) sections.push({ title: 'IP Address', items: matches });
      }
    } else {
      // Regular search - show suggestions for searchable fields
      const keywords = ['name:', 'status:', 'os:', 'cluster:', 'namespace:', 'cpu:', 'memory:', 'disk:', 'ip:'];
      const matchingKeywords = keywords.filter(kw => kw.toLowerCase().includes(searchLower));
      
      if (matchingKeywords.length > 0) {
        sections.push({ 
          title: 'Search by field', 
          items: matchingKeywords.map(kw => ({ text: kw, displayText: kw }))
        });
      }
      
      // Add comparison operator examples for numeric fields
      const numericFieldExamples = [
        { text: 'cpu:>=4', displayText: 'cpu:>=4 (4 or more CPUs)' },
        { text: 'memory:>8', displayText: 'memory:>8 (more than 8 GiB)' },
        { text: 'disk:<100', displayText: 'disk:<100 (less than 100 GiB)' },
      ];
      
      const matchingExamples = numericFieldExamples.filter(ex => 
        ex.text.toLowerCase().includes(searchLower) || 
        (searchLower.length >= 2 && ['cpu', 'memory', 'disk'].some(field => field.includes(searchLower)))
      );
      
      if (matchingExamples.length > 0) {
        sections.push({ 
          title: 'Advanced filters (>, <, >=, <=)', 
          items: matchingExamples
        });
      }
      
      // VM name matches
      const vmMatches = mockVMs.filter(vm => vm.name.toLowerCase().includes(searchLower))
        .slice(0, 3).map(vm => ({ text: `name:${vm.name}`, displayText: vm.name }));
      if (vmMatches.length > 0) sections.push({ title: 'Name', items: vmMatches });
      
      // Value matches for filters
      const statusMatches = availableStatuses.filter(s => s !== 'All' && s.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(status => ({ text: `status:${status}`, displayText: status }));
      if (statusMatches.length > 0) {
        sections.push({ title: 'Status', items: statusMatches });
      }
      
      const osMatches = availableOSs.filter(os => os !== 'All' && os.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(os => ({ text: `os:${os}`, displayText: os }));
      if (osMatches.length > 0) {
        sections.push({ title: 'Operating System', items: osMatches });
      }
      
      const clusterMatches = availableClusters.filter(cluster => cluster.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
      if (clusterMatches.length > 0) {
        sections.push({ title: 'Cluster', items: clusterMatches });
      }
      
      const namespaceMatches = availableNamespaces.filter(namespace => namespace.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(namespace => ({ text: `namespace:${namespace}`, displayText: namespace }));
      if (namespaceMatches.length > 0) {
        sections.push({ title: 'Namespace', items: namespaceMatches });
      }
    }
    
    return { sections, hasResults: sections.length > 0 };
  }, [queryText, availableStatuses, availableOSs, availableClusters, availableNamespaces]);

  // Helper function to compare numeric values with operators
  const compareNumeric = (vmValue: string, filterValue: string): boolean => {
    // Check for comparison operators
    const operatorMatch = filterValue.match(/^(>=|<=|>|<)(.+)$/);
    
    if (!operatorMatch) {
      // No operator, use string includes
      return vmValue.toLowerCase().includes(filterValue.toLowerCase());
    }
    
    const [, operator, targetValue] = operatorMatch;
    
    // Extract numeric value from VM value (e.g., "4" -> 4, "8 GiB" -> 8)
    const vmNumMatch = vmValue.match(/^(\d+\.?\d*)/);
    const targetNum = parseFloat(targetValue);
    
    if (!vmNumMatch || isNaN(targetNum)) {
      return false; // Can't compare non-numeric values
    }
    
    const vmNum = parseFloat(vmNumMatch[1]);
    
    switch (operator) {
      case '>': return vmNum > targetNum;
      case '<': return vmNum < targetNum;
      case '>=': return vmNum >= targetNum;
      case '<=': return vmNum <= targetNum;
      default: return false;
    }
  };

  // Filter VMs with AND logic for all filters
  const filteredVMs = React.useMemo(() => {
    return mockVMs.filter(vm => {
      // Collect all filter conditions
      const conditions: boolean[] = [];
      
      // Process query chips (label:value pairs from filter dropdowns)
      queryChips.forEach(chip => {
        if (chip.type === 'status') {
          conditions.push(vm.status.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'os') {
          conditions.push(vm.os.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'cluster') {
          conditions.push(vm.cluster.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'namespace') {
          conditions.push(vm.namespace.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'name') {
          conditions.push(vm.name.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'cpu') {
          conditions.push(compareNumeric(vm.cpu, chip.value));
        } else if (chip.type === 'memory') {
          conditions.push(compareNumeric(vm.memory, chip.value));
        } else if (chip.type === 'disk') {
          conditions.push(compareNumeric(vm.disk, chip.value));
        } else if (chip.type === 'ip') {
          conditions.push(vm.ip.toLowerCase().includes(chip.value.toLowerCase()));
        } else if (chip.type === 'search') {
          // General search - check if it matches any field
          const searchLower = chip.value.toLowerCase();
          const matchesAnyField = 
            vm.name.toLowerCase().includes(searchLower) ||
            vm.status.toLowerCase().includes(searchLower) ||
            vm.os.toLowerCase().includes(searchLower) ||
            vm.cluster.toLowerCase().includes(searchLower) ||
            vm.namespace.toLowerCase().includes(searchLower) ||
            vm.cpu.toLowerCase().includes(searchLower) ||
            vm.memory.toLowerCase().includes(searchLower) ||
            vm.disk.toLowerCase().includes(searchLower) ||
            vm.ip.toLowerCase().includes(searchLower);
          conditions.push(matchesAnyField);
        }
      });
      
      // Process queryText for label:value patterns
      if (queryText) {
        // Extract all label:value patterns from queryText
        const labelValueRegex = /(name|status|os|cluster|namespace|cpu|memory|disk|ip):([^\s]+)/gi;
        const matches = [...queryText.matchAll(labelValueRegex)];
        
        if (matches.length > 0) {
          // Apply each label:value filter with AND logic
          matches.forEach(match => {
            const label = match[1].toLowerCase();
            const value = match[2].toLowerCase();
            
            if (label === 'name') {
              conditions.push(vm.name.toLowerCase().includes(value));
            } else if (label === 'status') {
              conditions.push(vm.status.toLowerCase().includes(value));
            } else if (label === 'os') {
              conditions.push(vm.os.toLowerCase().includes(value));
            } else if (label === 'cluster') {
              conditions.push(vm.cluster.toLowerCase().includes(value));
            } else if (label === 'namespace') {
              conditions.push(vm.namespace.toLowerCase().includes(value));
            } else if (label === 'cpu') {
              conditions.push(compareNumeric(vm.cpu, value));
            } else if (label === 'memory') {
              conditions.push(compareNumeric(vm.memory, value));
            } else if (label === 'disk') {
              conditions.push(compareNumeric(vm.disk, value));
            } else if (label === 'ip') {
              conditions.push(vm.ip.toLowerCase().includes(value));
            }
          });
        } else {
          // No label:value pattern, search across all fields with OR logic
          const searchLower = queryText.toLowerCase();
          const matchesAnyField = 
            vm.name.toLowerCase().includes(searchLower) ||
            vm.status.toLowerCase().includes(searchLower) ||
            vm.os.toLowerCase().includes(searchLower) ||
            vm.cluster.toLowerCase().includes(searchLower) ||
            vm.namespace.toLowerCase().includes(searchLower) ||
            vm.cpu.toLowerCase().includes(searchLower) ||
            vm.memory.toLowerCase().includes(searchLower) ||
            vm.disk.toLowerCase().includes(searchLower) ||
            vm.ip.toLowerCase().includes(searchLower);
          conditions.push(matchesAnyField);
        }
      }
      
      // Apply dropdown filters
      if (statusFilter !== 'All') {
        conditions.push(vm.status === statusFilter);
      }
      if (osFilter !== 'All') {
        conditions.push(vm.os === osFilter);
      }
      
      // AND logic: all conditions must be true
      return conditions.length === 0 || conditions.every(condition => condition);
    });
  }, [queryText, queryChips, statusFilter, osFilter]);

  // Sort VMs
  const sortedVMs = React.useMemo(() => {
    if (activeSortIndex === null) {
      return filteredVMs;
    }

    const sortedArray = [...filteredVMs];
    const columns = ['name', 'status', 'os', 'cluster', 'namespace', 'cpu', 'memory', 'disk', 'ip'];
    const columnKey = columns[activeSortIndex];

    sortedArray.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      // Get values based on column
      switch (columnKey) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'os':
          aValue = a.os;
          bValue = b.os;
          break;
        case 'cluster':
          aValue = a.cluster;
          bValue = b.cluster;
          break;
        case 'namespace':
          aValue = a.namespace;
          bValue = b.namespace;
          break;
        case 'cpu':
          aValue = parseInt(a.cpu) || 0;
          bValue = parseInt(b.cpu) || 0;
          break;
        case 'memory':
          aValue = parseInt(a.memory.split(' ')[0]) || 0;
          bValue = parseInt(b.memory.split(' ')[0]) || 0;
          break;
        case 'disk':
          aValue = parseInt(a.disk.split(' ')[0]) || 0;
          bValue = parseInt(b.disk.split(' ')[0]) || 0;
          break;
        case 'ip':
          aValue = a.ip;
          bValue = b.ip;
          break;
        default:
          return 0;
      }

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const result = aValue.localeCompare(bValue);
        return activeSortDirection === 'asc' ? result : -result;
      } else {
        const result = (aValue as number) - (bValue as number);
        return activeSortDirection === 'asc' ? result : -result;
      }
    });

    return sortedArray;
  }, [filteredVMs, activeSortIndex, activeSortDirection]);

  const paginatedVMs = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedVMs.slice(start, start + perPage);
  }, [sortedVMs, page, perPage]);

  const onSetPage = (_event: any, pageNumber: number) => setPage(pageNumber);
  const onPerPageSelect = (_event: any, newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  // Get sorting parameters for table columns
  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex || undefined,
      direction: activeSortDirection,
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

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
          <Title headingLevel="h1" size="xl" style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>Virtual machines</Title>
      
        {/* Search Bar and Action Buttons Row */}
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }} style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>
        {/* Query Bar */}
        <FlexItem flex={{ default: 'flex_1' }}>
          <div ref={searchWrapperRef} style={{ position: 'relative', maxWidth: '800px' }}>
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
              placeholder={queryChips.length === 0 ? "Search by name or use filters (e.g., status:Running cpu:>=4 memory:>8)" : ""}
              value={queryText}
              onChange={(e) => {
                setQueryText(e.target.value);
                // Only auto-open/close autocomplete if this is a user typing, not a programmatic update
                if (!isProgrammaticUpdate.current) {
                  setIsAutocompleteOpen(e.target.value.length > 0);
                }
              }}
              onFocus={() => queryText.length > 0 && setIsAutocompleteOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && queryText.trim()) {
                  e.preventDefault();
                  // Check if it's a label:value pattern
                  const labelValueMatch = queryText.match(/^(name|status|os|cluster|namespace|cpu|memory|disk|ip):(.+)$/i);
                  
                  if (labelValueMatch) {
                    const [, label, value] = labelValueMatch;
                    const chipKey = `${label.toLowerCase()}-${value.replace(/\s+/g, '-')}`;
                    addQueryChip(label.toLowerCase(), queryText, value);
                  } else {
                    // Add as a general search chip
                    const chipKey = `search-${queryText.replace(/\s+/g, '-')}-${Date.now()}`;
                    addQueryChip('search', queryText, queryText);
                  }
                  setQueryText('');
                  setIsAutocompleteOpen(false);
                }
              }}
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
              onMouseDown={(e) => e.preventDefault()}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              
                              // Check if it's just a field keyword (ends with : and nothing after)
                              const fieldKeywordMatch = item.text.match(/^(name|status|os|cluster|namespace|cpu|memory|disk|ip):$/i);
                              
                              if (fieldKeywordMatch) {
                                // Just insert the field keyword into the search box and keep autocomplete open
                                isProgrammaticUpdate.current = true;
                                setQueryText(item.text);
                                setTimeout(() => {
                                  isProgrammaticUpdate.current = false;
                                  setIsAutocompleteOpen(true);
                                  queryInputRef.current?.focus();
                                }, 10);
                              } else {
                                // Check if it's a complete label:value pattern
                                const labelValueMatch = item.text.match(/^(name|status|os|cluster|namespace|cpu|memory|disk|ip):(.+)$/i);
                                
                                if (labelValueMatch) {
                                  const [, label, value] = labelValueMatch;
                                  addQueryChip(label.toLowerCase(), item.text, value);
                                  setQueryText('');
                                } else {
                                  // Add as a general search chip
                                  addQueryChip('search', item.text, item.text);
                                  setQueryText('');
                                }
                                setIsAutocompleteOpen(false);
                                setTimeout(() => queryInputRef.current?.focus(), 0);
                              }
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
                icon={<FilterIcon />}
                style={{
                  width: '220px'
                }}
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
                    
                    // Add or remove chip
                    if (status !== 'All') {
                      // Remove any existing status chip first
                      const existingChip = queryChips.find(chip => chip.type === 'status');
                      if (existingChip) {
                        removeQueryChip(existingChip.key);
                      }
                      // Add new status chip
                      addQueryChip('status', `status:${status}`, status);
                    } else {
                      // Remove status chip when "All" is selected
                      const existingChip = queryChips.find(chip => chip.type === 'status');
                      if (existingChip) {
                        removeQueryChip(existingChip.key);
                      }
                    }
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
                icon={<FilterIcon />}
                style={{
                  width: '260px'
                }}
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
                    
                    // Add or remove chip
                    if (os !== 'All') {
                      // Remove any existing os chip first
                      const existingChip = queryChips.find(chip => chip.type === 'os');
                      if (existingChip) {
                        removeQueryChip(existingChip.key);
                      }
                      // Add new os chip
                      addQueryChip('os', `os:${os}`, os);
                    } else {
                      // Remove os chip when "All" is selected
                      const existingChip = queryChips.find(chip => chip.type === 'os');
                      if (existingChip) {
                        removeQueryChip(existingChip.key);
                      }
                    }
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
        <Toolbar style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }}>
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

      {filteredVMs.length === 0 ? (
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
              No virtual machines match your current filter criteria. Try adjusting your search or clearing some filters.
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
              <Th sort={getSortParams(0)}>Name</Th>
              <Th sort={getSortParams(1)}>Status</Th>
              <Th sort={getSortParams(2)}>Operating System</Th>
              <Th sort={getSortParams(3)}>Cluster</Th>
              <Th sort={getSortParams(4)}>Namespace</Th>
              <Th sort={getSortParams(5)}>CPU</Th>
              <Th sort={getSortParams(6)}>Memory</Th>
              <Th sort={getSortParams(7)}>Disk</Th>
              <Th sort={getSortParams(8)}>IP Address</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedVMs.map((vm) => (
              <Tr key={vm.id}>
                <Td dataLabel="Name">{vm.name}</Td>
                <Td dataLabel="Status" style={{ fontSize: '14px' }}>
                  {vm.status}
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
        </div>
      )}

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
      </PageSection>
    </>
  );
};

