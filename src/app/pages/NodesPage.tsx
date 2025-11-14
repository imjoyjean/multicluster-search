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
  Modal,
  ModalVariant,
  Alert,
  Form,
  FormGroup,
  Grid,
  GridItem,
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  DataListDragButton,
  DataListControl,
} from '@patternfly/react-core';
import { DragDrop, Draggable, Droppable } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { CheckCircleIcon, FilterIcon, SearchIcon, ColumnsIcon, GripVerticalIcon } from '@patternfly/react-icons';
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
  const searchWrapperRef = React.useRef<HTMLDivElement>(null);
  const isProgrammaticUpdate = React.useRef(false);
  
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
  
  // Column management
  const columnConfig: Record<string, { label: string; isDefault: boolean; isRequired?: boolean }> = {
    name: { label: 'Name', isDefault: true, isRequired: true },
    status: { label: 'Status', isDefault: true },
    roles: { label: 'Roles', isDefault: true },
    pods: { label: 'Pods', isDefault: true },
    memory: { label: 'Memory', isDefault: true },
    cpu: { label: 'CPU', isDefault: true },
    filesystem: { label: 'Filesystem', isDefault: true },
    created: { label: 'Created', isDefault: true },
    instanceType: { label: 'Instance type', isDefault: true },
    cluster: { label: 'Cluster', isDefault: false },
    namespace: { label: 'Namespace', isDefault: false },
  };
  
  const defaultColumns = Object.keys(columnConfig).filter(key => columnConfig[key].isDefault);
  const maxColumns = 9;
  
  const [isManageColumnsOpen, setIsManageColumnsOpen] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('nodesVisibleColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [tempVisibleColumns, setTempVisibleColumns] = React.useState<string[]>(visibleColumns);
  const [draggedItemId, setDraggedItemId] = React.useState<string | null>(null);
  
  const handleColumnToggle = (column: string, checked: boolean) => {
    // Prevent unchecking required columns
    if (columnConfig[column].isRequired) {
      return;
    }
    
    if (checked && tempVisibleColumns.length < maxColumns) {
      setTempVisibleColumns([...tempVisibleColumns, column]);
    } else if (!checked) {
      setTempVisibleColumns(tempVisibleColumns.filter(col => col !== column));
    }
  };
  
  const handleDragStart = (id: string) => {
    setDraggedItemId(id);
  };
  
  const handleDragMove = (oldIndex: number, newIndex: number) => {
    const newColumns = [...tempVisibleColumns];
    const [draggedItem] = newColumns.splice(oldIndex, 1);
    newColumns.splice(newIndex, 0, draggedItem);
    setTempVisibleColumns(newColumns);
  };
  
  const handleDragEnd = () => {
    setDraggedItemId(null);
  };
  
  const handleSaveColumns = () => {
    setVisibleColumns(tempVisibleColumns);
    localStorage.setItem('nodesVisibleColumns', JSON.stringify(tempVisibleColumns));
    setIsManageColumnsOpen(false);
  };
  
  const handleRestoreDefaults = () => {
    setTempVisibleColumns(defaultColumns);
  };
  
  const handleCancelColumns = () => {
    setTempVisibleColumns(visibleColumns);
    setIsManageColumnsOpen(false);
  };
  
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
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as HTMLElement)) {
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
      const afterColon = queryText.substring(filterType.length + 1);
      
      if (filterType === 'name') {
        const matches = mockNodes
          .filter(node => !afterColon || node.name.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(node => ({ text: `name:${node.name}`, displayText: node.name }));
        if (matches.length > 0) sections.push({ title: 'Name', items: matches });
      } else if (filterType === 'cluster') {
        const matches = uniqueClusters
          .filter(cluster => !afterColon || cluster.toLowerCase().includes(afterColon.toLowerCase()))
          .map(cluster => ({ text: `cluster:${cluster}`, displayText: cluster }));
        if (matches.length > 0) sections.push({ title: 'Cluster', items: matches });
      } else if (filterType === 'namespace') {
        const matches = uniqueNamespaces
          .filter(ns => !afterColon || ns.toLowerCase().includes(afterColon.toLowerCase()))
          .map(ns => ({ text: `namespace:${ns}`, displayText: ns }));
        if (matches.length > 0) sections.push({ title: 'Namespace', items: matches });
      } else if (filterType === 'status') {
        const matches = uniqueStatuses
          .filter(status => !afterColon || status.toLowerCase().includes(afterColon.toLowerCase()))
          .map(status => ({ text: `status:${status}`, displayText: status }));
        if (matches.length > 0) sections.push({ title: 'Status', items: matches });
      } else if (filterType === 'role') {
        const matches = uniqueRoles
          .filter(role => !afterColon || role.toLowerCase().includes(afterColon.toLowerCase()))
          .map(role => ({ text: `role:${role}`, displayText: role }));
        if (matches.length > 0) sections.push({ title: 'Role', items: matches });
      } else if (filterType === 'instancetype') {
        const instanceTypes = Array.from(new Set(mockNodes.map(n => n.instanceType)));
        const matches = instanceTypes
          .filter(type => !afterColon || type.toLowerCase().includes(afterColon.toLowerCase()))
          .map(type => ({ text: `instanceType:${type}`, displayText: type }));
        if (matches.length > 0) sections.push({ title: 'Instance Type', items: matches });
      } else if (filterType === 'pods') {
        const podsValues = Array.from(new Set(mockNodes.map(n => n.pods)));
        const matches = podsValues
          .filter(pods => !afterColon || pods.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(pods => ({ text: `pods:${pods}`, displayText: pods }));
        if (matches.length > 0) sections.push({ title: 'Pods', items: matches });
      } else if (filterType === 'memory') {
        const memoryValues = Array.from(new Set(mockNodes.map(n => n.memory)));
        const matches = memoryValues
          .filter(memory => !afterColon || memory.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(memory => ({ text: `memory:${memory}`, displayText: memory }));
        if (matches.length > 0) sections.push({ title: 'Memory', items: matches });
      } else if (filterType === 'cpu') {
        const cpuValues = Array.from(new Set(mockNodes.map(n => n.cpu)));
        const matches = cpuValues
          .filter(cpu => !afterColon || cpu.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(cpu => ({ text: `cpu:${cpu}`, displayText: cpu }));
        if (matches.length > 0) sections.push({ title: 'CPU', items: matches });
      } else if (filterType === 'filesystem') {
        const filesystemValues = Array.from(new Set(mockNodes.map(n => n.filesystem)));
        const matches = filesystemValues
          .filter(filesystem => !afterColon || filesystem.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(filesystem => ({ text: `filesystem:${filesystem}`, displayText: filesystem }));
        if (matches.length > 0) sections.push({ title: 'Filesystem', items: matches });
      } else if (filterType === 'created') {
        const createdValues = Array.from(new Set(mockNodes.map(n => n.created)));
        const matches = createdValues
          .filter(created => !afterColon || created.toLowerCase().includes(afterColon.toLowerCase()))
          .map(created => ({ text: `created:${created}`, displayText: created }));
        if (matches.length > 0) sections.push({ title: 'Created', items: matches });
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
      
      // Add comparison operator examples for numeric fields
      const numericFieldExamples = [
        { text: 'filesystem:>40', displayText: 'filesystem:>40 (greater than 40%)' },
        { text: 'memory:>=8', displayText: 'memory:>=8 (8 GiB or more)' },
        { text: 'cpu:<4', displayText: 'cpu:<4 (less than 4 cores)' },
        { text: 'pods:<=100', displayText: 'pods:<=100 (100 or fewer)' },
      ];
      
      const matchingExamples = numericFieldExamples.filter(ex => 
        ex.text.toLowerCase().includes(searchLower) || 
        (searchLower.length >= 2 && ['filesystem', 'memory', 'cpu', 'pods'].some(field => field.includes(searchLower)))
      );
      
      if (matchingExamples.length > 0) {
        sections.push({ 
          title: 'Advanced filters (>, <, >=, <=)', 
          items: matchingExamples
        });
      }
      
      // Node name matches
      const nodeMatches = mockNodes
        .filter(node => node.name.toLowerCase().includes(searchLower))
        .slice(0, 3)
        .map(node => ({ text: `name:${node.name}`, displayText: node.name }));
      if (nodeMatches.length > 0) sections.push({ title: 'Name', items: nodeMatches });
      
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

  // Helper function to compare numeric values with operators
  const compareNumeric = (nodeValue: string, filterValue: string): boolean => {
    // Check for comparison operators
    const operatorMatch = filterValue.match(/^(>=|<=|>|<)(.+)$/);
    
    if (!operatorMatch) {
      // No operator, use string includes
      return nodeValue.toLowerCase().includes(filterValue.toLowerCase());
    }
    
    const [, operator, targetValue] = operatorMatch;
    
    // Extract numeric value from node value (e.g., "45%" -> 45, "8.9 GiB / 16 GiB" -> 8.9)
    const nodeNumMatch = nodeValue.match(/^(\d+\.?\d*)/);
    const targetNum = parseFloat(targetValue);
    
    if (!nodeNumMatch || isNaN(targetNum)) {
      return false; // Can't compare non-numeric values
    }
    
    const nodeNum = parseFloat(nodeNumMatch[1]);
    
    switch (operator) {
      case '>': return nodeNum > targetNum;
      case '<': return nodeNum < targetNum;
      case '>=': return nodeNum >= targetNum;
      case '<=': return nodeNum <= targetNum;
      default: return false;
    }
  };

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
        } else if (chip.type === 'name') {
          conditions.push(node.name.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'search') {
          // General search - check if it matches any field
          const searchLower = chip.value.toLowerCase();
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
              conditions.push(compareNumeric(node.pods, value));
            } else if (label === 'memory') {
              conditions.push(compareNumeric(node.memory, value));
            } else if (label === 'cpu') {
              conditions.push(compareNumeric(node.cpu, value));
            } else if (label === 'filesystem') {
              conditions.push(compareNumeric(node.filesystem, value));
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

  // Helper function to render cell content
  const renderCellContent = (node: Node, column: string) => {
    switch (column) {
      case 'name':
        return node.name;
      case 'status':
        return (
          <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }} style={{ gap: '0.25rem' }}>
            <FlexItem>
              <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)', fontSize: '14px' }} />
            </FlexItem>
            <FlexItem style={{ fontSize: '14px' }}>{node.status}</FlexItem>
          </Flex>
        );
      case 'roles':
        return node.roles;
      case 'cluster':
        return node.cluster;
      case 'namespace':
        return node.namespace;
      case 'pods':
        return node.pods;
      case 'memory':
        return node.memory;
      case 'cpu':
        return node.cpu;
      case 'filesystem':
        return node.filesystem;
      case 'instanceType':
        return node.instanceType;
      case 'created':
        return node.created;
      default:
        return '';
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
        <div 
          ref={searchWrapperRef}
          style={{ 
            marginBottom: 'var(--pf-v5-global--spacer--md)', 
            position: 'relative',
            width: '100%',
            maxWidth: '800px'
          }}
        >
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
              placeholder={queryChips.length === 0 ? "Search by name or use filters (e.g., status:Ready filesystem:>40 memory:>=8)" : ""}
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
                  const labelValueMatch = queryText.match(/^(name|cluster|namespace|status|role|pods|memory|cpu|filesystem|instancetype|created):(.+)$/i);
                  
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
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            // Check if it's just a field keyword (ends with : and nothing after)
                            const fieldKeywordMatch = item.text.match(/^(name|cluster|namespace|status|role|pods|memory|cpu|filesystem|instancetype|created):$/i);
                            
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
                              const labelValueMatch = item.text.match(/^(name|cluster|namespace|status|role|pods|memory|cpu|filesystem|instancetype|created):(.+)$/i);
                              
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
                              // Set focus back to input after a brief delay
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
          <ToolbarItem>
            <Button 
              variant="secondary" 
              icon={<ColumnsIcon />}
              onClick={() => {
                setTempVisibleColumns(visibleColumns);
                setIsManageColumnsOpen(true);
              }}
            >
              Manage columns
            </Button>
          </ToolbarItem>
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
              {visibleColumns.map(column => (
                <Th key={column}>{columnConfig[column].label}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {paginatedNodes.map((node, index) => (
              <Tr key={index}>
                {visibleColumns.map(column => (
                  <Td key={column} dataLabel={columnConfig[column].label}>
                    {renderCellContent(node, column)}
                  </Td>
                ))}
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
        
        {/* Manage Columns Modal */}
        <Modal
          variant={ModalVariant.medium}
          title="Manage columns"
          isOpen={isManageColumnsOpen}
          onClose={handleCancelColumns}
          actions={[
            <Button key="save" variant="primary" onClick={handleSaveColumns}>
              Save
            </Button>,
            <Button key="cancel" variant="link" onClick={handleCancelColumns}>
              Cancel
            </Button>,
          ]}
        >
          <div style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>
            Selected columns will appear in the table. Drag to reorder.
          </div>
          
          <Alert
            variant="info"
            isInline
            title={`You can select up to ${maxColumns} columns. Name is always visible.`}
            style={{ marginBottom: 'var(--pf-v5-global--spacer--lg)' }}
          />
          
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: 'var(--pf-v5-global--spacer--md)',
            fontSize: 'var(--pf-v5-global--FontSize--sm)'
          }}>
            Selected columns
          </div>
          
          {/* Drag and Drop List for Selected Columns */}
          <DragDrop onDrop={(source, dest) => {
            if (dest) {
              handleDragMove(source.index, dest.index);
            }
            return true;
          }}>
            <Droppable>
              <DataList 
                aria-label="draggable data list"
                isCompact
                style={{ marginBottom: 'var(--pf-v5-global--spacer--lg)' }}
              >
                {tempVisibleColumns.map((column, index) => (
                  <Draggable key={column} hasNoWrapper>
                    <DataListItem aria-labelledby={`column-${column}`}>
                      <DataListItemRow>
                        <DataListControl>
                          <DataListDragButton
                            aria-label={`Reorder ${columnConfig[column].label}`}
                            aria-describedby={`column-${column}`}
                            aria-pressed="false"
                          />
                        </DataListControl>
                        <DataListItemCells
                          dataListCells={[
                            <DataListCell key="primary content" style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              width: '100%'
                            }}>
                              <span id={`column-${column}`}>
                                {columnConfig[column].label}
                                {columnConfig[column].isRequired && 
                                  <span style={{ 
                                    marginLeft: '8px', 
                                    color: 'var(--pf-v5-global--Color--200)',
                                    fontSize: 'var(--pf-v5-global--FontSize--sm)'
                                  }}>
                                    (required)
                                  </span>
                                }
                              </span>
                              {!columnConfig[column].isRequired && (
                                <Button 
                                  variant="link" 
                                  isDanger
                                  onClick={() => handleColumnToggle(column, false)}
                                  style={{ padding: '0' }}
                                >
                                  Remove
                                </Button>
                              )}
                            </DataListCell>,
                          ]}
                        />
                      </DataListItemRow>
                    </DataListItem>
                  </Draggable>
                ))}
              </DataList>
            </Droppable>
          </DragDrop>
          
          {/* Available Columns to Add */}
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: 'var(--pf-v5-global--spacer--md)',
            fontSize: 'var(--pf-v5-global--FontSize--sm)',
            marginTop: 'var(--pf-v5-global--spacer--lg)'
          }}>
            Available columns
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 'var(--pf-v5-global--spacer--sm)' 
          }}>
            {Object.keys(columnConfig)
              .filter(column => !tempVisibleColumns.includes(column))
              .map(column => (
                <Button
                  key={column}
                  variant="secondary"
                  onClick={() => handleColumnToggle(column, true)}
                  isDisabled={tempVisibleColumns.length >= maxColumns}
                  style={{ marginBottom: 'var(--pf-v5-global--spacer--xs)' }}
                >
                  + {columnConfig[column].label}
                </Button>
              ))}
          </div>
          
          <div style={{ marginTop: 'var(--pf-v5-global--spacer--lg)' }}>
            <Button variant="link" onClick={handleRestoreDefaults}>
              Restore default columns
            </Button>
          </div>
        </Modal>
      </PageSection>
    </>
  );
};

