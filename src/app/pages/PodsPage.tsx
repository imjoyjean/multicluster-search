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
import { Table, Thead, Tbody, Tr, Th, Td, ThProps } from '@patternfly/react-table';
import { 
  CheckCircleIcon, 
  FilterIcon, 
  SearchIcon, 
  ColumnsIcon, 
  GripVerticalIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InProgressIcon,
  BanIcon,
  QuestionCircleIcon
} from '@patternfly/react-icons';
import { useSearchParams } from 'react-router-dom';

interface Pod {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  owner: string;
  memory: string;
  cpu: string;
  created: string;
  node: string;
  labels: string;
  ipAddress: string;
  receivingTraffic: string;
  cluster: string;
}

// Generate mock pods with varied metadata
const generateMockPods = (): Pod[] => {
  const clusters = ['production-east', 'production-west', 'staging-east', 'staging-west', 'dev-central', 'qa-north'];
  const namespaces = ['default', 'kube-system', 'monitoring', 'logging', 'app-prod', 'app-staging', 'database', 'multicluster-engine'];
  
  // Weighted distribution of statuses (more Running, fewer errors)
  const statuses = [
    'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', // 10x Running
    'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', 'Running', // 20x total
    'Completed', 'Completed', 'Completed', 'Completed', // 4x Completed
    'Pending', // 1x Pending
    'CrashLoopBackOff', // 1x CrashLoopBackOff
    'Failed', // 1x Failed
    'Terminating', // 1x Terminating
    'Unknown', // 1x Unknown
  ];
  
  const owners = ['clusterclaims-controller', 'etcd-operator', 'kube-apiserver', 'coredns', 'metrics-server', 'ingress-controller'];
  const nodeNames = ['worker-1', 'worker-2', 'worker-3', 'control-plane-1', 'control-plane-2'];
  const days = ['Nov 7, 2025, 9:49 PM', 'Nov 9, 2025, 3:04 AM', 'Nov 9, 2025, 2:51 AM', 'Nov 7, 2025, 9:40 PM'];
  
  const pods: Pod[] = [];
  
  for (let i = 0; i < 50; i++) {
    const cluster = clusters[i % clusters.length];
    const namespace = namespaces[i % namespaces.length];
    const status = statuses[i % statuses.length];
    const owner = owners[i % owners.length];
    const nodeName = nodeNames[i % nodeNames.length];
    const created = days[i % days.length];
    
    // Generate pod metrics
    const readyCount = Math.random() > 0.2 ? 2 : Math.floor(Math.random() * 2);
    const ready = `${readyCount}/2`;
    const restarts = Math.floor(Math.random() * 5);
    const memoryMiB = (Math.random() * 100 + 10).toFixed(1);
    const cpuCores = (Math.random() * 0.1).toFixed(3);
    
    // Generate pod name with random hash
    const hash = Math.random().toString(36).substring(2, 7);
    const podName = `${owner}-6c8dbfbf85-${hash}`;
    
    // Generate IP address
    const ipOctet3 = Math.floor(Math.random() * 255);
    const ipOctet4 = Math.floor(Math.random() * 255);
    const ipAddress = `10.128.${ipOctet3}.${ipOctet4}`;
    
    // Generate labels
    const labels = `app=${owner},pod-template-hash=6c8dbfbf85`;
    
    // Receiving traffic
    const receivingTraffic = Math.random() > 0.5 ? 'Yes' : 'No';
    
    pods.push({
      name: podName,
      namespace,
      status,
      ready,
      restarts,
      owner: `${owner}-6c8dbfbf85`,
      memory: `${memoryMiB} MiB`,
      cpu: `${cpuCores} cores`,
      created,
      node: nodeName,
      labels,
      ipAddress,
      receivingTraffic,
      cluster,
    });
  }
  
  return pods;
};

const mockPods: Pod[] = generateMockPods();


export const PodsPage: React.FC = () => {
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
  
  // Multi-select filter states
  const [clusterFilter, setClusterFilter] = React.useState<string[]>([]);
  const [namespaceFilter, setNamespaceFilter] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const [ownerFilter, setOwnerFilter] = React.useState<string[]>([]);
  const [instanceTypeFilter, setInstanceTypeFilter] = React.useState<string[]>([]);
  
  // Dropdown open states
  const [isClusterFilterOpen, setIsClusterFilterOpen] = React.useState(false);
  const [isNamespaceFilterOpen, setIsNamespaceFilterOpen] = React.useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = React.useState(false);
  const [isOwnerFilterOpen, setIsOwnerFilterOpen] = React.useState(false);
  const [isInstanceTypeFilterOpen, setIsInstanceTypeFilterOpen] = React.useState(false);
  
  // Column management
  const columnConfig: Record<string, { label: string; isDefault: boolean; isRequired?: boolean }> = {
    name: { label: 'Name', isDefault: true, isRequired: true },
    namespace: { label: 'Namespace', isDefault: true },
    cluster: { label: 'Cluster', isDefault: true },
    status: { label: 'Status', isDefault: true },
    ready: { label: 'Ready', isDefault: true },
    restarts: { label: 'Restarts', isDefault: true },
    owner: { label: 'Owner', isDefault: true },
    memory: { label: 'Memory', isDefault: true },
    cpu: { label: 'CPU', isDefault: true },
    created: { label: 'Created', isDefault: true },
    node: { label: 'Node', isDefault: false },
    labels: { label: 'Labels', isDefault: false },
    ipAddress: { label: 'IP address', isDefault: false },
    receivingTraffic: { label: 'Receiving Traffic', isDefault: false },
  };
  
  const defaultColumns = Object.keys(columnConfig).filter(key => columnConfig[key].isDefault);
  const maxColumns = 9;
  
  const [isManageColumnsOpen, setIsManageColumnsOpen] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('podsVisibleColumns');
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
    localStorage.setItem('podsVisibleColumns', JSON.stringify(tempVisibleColumns));
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
  const uniqueClusters = React.useMemo(() => Array.from(new Set(mockPods.map(n => n.cluster))), []);
  const uniqueNamespaces = React.useMemo(() => Array.from(new Set(mockPods.map(n => n.namespace))), []);
  const uniqueStatuses = React.useMemo(() => Array.from(new Set(mockPods.map(n => n.status))), []);
  const uniqueOwners = React.useMemo(() => Array.from(new Set(mockPods.map(n => n.owner))), []);
  const uniqueNodes = React.useMemo(() => Array.from(new Set(mockPods.map(n => n.node))), []);

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
      } else if (chip.type === 'owner') {
        setOwnerFilter(ownerFilter.filter(o => o !== chip.value));
      } else if (chip.type === 'instancetype' || chip.type === 'instanceType') {
        setInstanceTypeFilter(instanceTypeFilter.filter(i => i !== chip.value));
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
    setOwnerFilter([]);
    setInstanceTypeFilter([]);
  };

  // Autocomplete suggestions
  const autocompleteSuggestions = React.useMemo(() => {
    if (!queryText) return { sections: [], hasResults: false };
    
    const searchLower = queryText.toLowerCase();
    const sections: Array<{ title: string; items: Array<{ text: string; displayText: string }> }> = [];
    
    // Check if user is typing a filter prefix
    const filterPrefixMatch = queryText.match(/^(name|namespace|cluster|status|ready|restarts|owner|node|memory|cpu|created|labels|ipAddress|receivingTraffic):/i);
    
    if (filterPrefixMatch) {
      const filterType = filterPrefixMatch[1].toLowerCase();
      const afterColon = queryText.substring(filterType.length + 1);
      
      if (filterType === 'name') {
        const matches = mockPods
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
      } else if (filterType === 'owner') {
        const matches = uniqueOwners
          .filter(owner => !afterColon || owner.toLowerCase().includes(afterColon.toLowerCase()))
          .map(owner => ({ text: `owner:${owner}`, displayText: owner }));
        if (matches.length > 0) sections.push({ title: 'Owner', items: matches });
      } else if (filterType === 'node') {
        const matches = uniqueNodes
          .filter(node => !afterColon || node.toLowerCase().includes(afterColon.toLowerCase()))
          .map(node => ({ text: `node:${node}`, displayText: node }));
        if (matches.length > 0) sections.push({ title: 'Node', items: matches });
      } else if (filterType === 'ready') {
        const readyValues = Array.from(new Set(mockPods.map(n => n.ready)));
        const matches = readyValues
          .filter(ready => !afterColon || ready.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(ready => ({ text: `ready:${ready}`, displayText: ready }));
        if (matches.length > 0) sections.push({ title: 'Ready', items: matches });
      } else if (filterType === 'memory') {
        const memoryValues = Array.from(new Set(mockPods.map(n => n.memory)));
        const matches = memoryValues
          .filter(memory => !afterColon || memory.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(memory => ({ text: `memory:${memory}`, displayText: memory }));
        if (matches.length > 0) sections.push({ title: 'Memory', items: matches });
      } else if (filterType === 'cpu') {
        const cpuValues = Array.from(new Set(mockPods.map(n => n.cpu)));
        const matches = cpuValues
          .filter(cpu => !afterColon || cpu.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(cpu => ({ text: `cpu:${cpu}`, displayText: cpu }));
        if (matches.length > 0) sections.push({ title: 'CPU', items: matches });
      } else if (filterType === 'created') {
        const createdValues = Array.from(new Set(mockPods.map(n => n.created)));
        const matches = createdValues
          .filter(created => !afterColon || created.toLowerCase().includes(afterColon.toLowerCase()))
          .map(created => ({ text: `created:${created}`, displayText: created }));
        if (matches.length > 0) sections.push({ title: 'Created', items: matches });
      } else if (filterType === 'restarts') {
        const restartsValues = Array.from(new Set(mockPods.map(n => n.restarts.toString())));
        const matches = restartsValues
          .filter(restarts => !afterColon || restarts.includes(afterColon))
          .slice(0, 10)
          .map(restarts => ({ text: `restarts:${restarts}`, displayText: restarts }));
        if (matches.length > 0) sections.push({ title: 'Restarts', items: matches });
      } else if (filterType === 'labels') {
        const labelsValues = Array.from(new Set(mockPods.map(n => n.labels)));
        const matches = labelsValues
          .filter(labels => !afterColon || labels.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(labels => ({ text: `labels:${labels}`, displayText: labels }));
        if (matches.length > 0) sections.push({ title: 'Labels', items: matches });
      } else if (filterType === 'ipaddress') {
        const ipValues = Array.from(new Set(mockPods.map(n => n.ipAddress)));
        const matches = ipValues
          .filter(ip => !afterColon || ip.toLowerCase().includes(afterColon.toLowerCase()))
          .slice(0, 10)
          .map(ip => ({ text: `ipAddress:${ip}`, displayText: ip }));
        if (matches.length > 0) sections.push({ title: 'IP Address', items: matches });
      } else if (filterType === 'receivingtraffic') {
        const trafficValues = Array.from(new Set(mockPods.map(n => n.receivingTraffic)));
        const matches = trafficValues
          .filter(traffic => !afterColon || traffic.toLowerCase().includes(afterColon.toLowerCase()))
          .map(traffic => ({ text: `receivingTraffic:${traffic}`, displayText: traffic }));
        if (matches.length > 0) sections.push({ title: 'Receiving Traffic', items: matches });
      }
    } else {
      // Regular search - show suggestions for searchable fields
      const keywords = [
        'name:', 'namespace:', 'cluster:', 'status:', 'ready:', 'restarts:', 
        'owner:', 'node:', 'memory:', 'cpu:', 'created:', 'labels:', 
        'ipAddress:', 'receivingTraffic:'
      ];
      const matchingKeywords = keywords.filter(kw => kw.toLowerCase().includes(searchLower));
      
      if (matchingKeywords.length > 0) {
        sections.push({ 
          title: 'Search by field', 
          items: matchingKeywords.map(kw => ({ text: kw, displayText: kw }))
        });
      }
      
      // Add comparison operator examples for numeric fields
      const numericFieldExamples = [
        { text: 'memory:>20', displayText: 'memory:>20 (greater than 20 MiB)' },
        { text: 'cpu:>=0.05', displayText: 'cpu:>=0.05 (0.05 cores or more)' },
        { text: 'restarts:>3', displayText: 'restarts:>3 (more than 3 restarts)' },
      ];
      
      const matchingExamples = numericFieldExamples.filter(ex => 
        ex.text.toLowerCase().includes(searchLower) || 
        (searchLower.length >= 2 && ['memory', 'cpu', 'restarts'].some(field => field.includes(searchLower)))
      );
      
      if (matchingExamples.length > 0) {
        sections.push({ 
          title: 'Advanced filters (>, <, >=, <=)', 
          items: matchingExamples
        });
      }
      
      // Pod name matches
      const nameMatches = mockPods
        .filter(p => p.name.toLowerCase().includes(searchLower))
        .slice(0, 3)
        .map(p => ({ text: `name:${p.name}`, displayText: p.name }));
      if (nameMatches.length > 0) sections.push({ title: 'Name', items: nameMatches });
      
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
      
      const ownerMatches = uniqueOwners
        .filter(o => o.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(o => ({ text: `owner:${o}`, displayText: o }));
      if (ownerMatches.length > 0) {
        sections.push({ title: 'Owner', items: ownerMatches });
      }
      
      const nodeMatches = uniqueNodes
        .filter(n => n.toLowerCase().includes(searchLower))
        .slice(0, 5)
        .map(n => ({ text: `node:${n}`, displayText: n }));
      if (nodeMatches.length > 0) {
        sections.push({ title: 'Node', items: nodeMatches });
      }
    }
    
    return { sections, hasResults: sections.length > 0 };
  }, [queryText, uniqueClusters, uniqueNamespaces, uniqueStatuses, uniqueOwners, uniqueNodes]);

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
  const filteredPods = React.useMemo(() => {
    return mockPods.filter(pod => {
      // Collect all filter conditions
      const conditions: boolean[] = [];
      
      // Process query chips (label:value pairs from filter dropdowns)
      queryChips.forEach(chip => {
        if (chip.type === 'cluster') {
          conditions.push(pod.cluster.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'namespace') {
          conditions.push(pod.namespace.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'status') {
          conditions.push(pod.status.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'owner') {
          conditions.push(pod.owner.toLowerCase().includes(chip.value.toLowerCase()));
        } else if (chip.type === 'name') {
          conditions.push(pod.name.toLowerCase() === chip.value.toLowerCase());
        } else if (chip.type === 'ready') {
          conditions.push(pod.ready.toLowerCase().includes(chip.value.toLowerCase()));
        } else if (chip.type === 'memory') {
          conditions.push(compareNumeric(pod.memory, chip.value));
        } else if (chip.type === 'cpu') {
          conditions.push(compareNumeric(pod.cpu, chip.value));
        } else if (chip.type === 'node') {
          conditions.push(pod.node.toLowerCase().includes(chip.value.toLowerCase()));
        } else if (chip.type === 'created') {
          conditions.push(pod.created.toLowerCase().includes(chip.value.toLowerCase()));
        } else if (chip.type === 'search') {
          // General search - check if it matches any field
          const searchLower = chip.value.toLowerCase();
          const matchesAnyField = 
            pod.name.toLowerCase().includes(searchLower) ||
            pod.cluster.toLowerCase().includes(searchLower) ||
            pod.namespace.toLowerCase().includes(searchLower) ||
            pod.status.toLowerCase().includes(searchLower) ||
            pod.owner.toLowerCase().includes(searchLower) ||
            pod.ready.toLowerCase().includes(searchLower) ||
            pod.memory.toLowerCase().includes(searchLower) ||
            pod.cpu.toLowerCase().includes(searchLower) ||
            pod.node.toLowerCase().includes(searchLower) ||
            pod.created.toLowerCase().includes(searchLower);
          conditions.push(matchesAnyField);
        }
      });
      
      // Process queryText for label:value patterns
      if (queryText) {
        // Extract all label:value patterns from queryText
        const labelValueRegex = /(name|cluster|namespace|status|owner|ready|node|memory|cpu|restarts|created|labels|ipAddress|receivingTraffic):([^\s]+)/gi;
        const matches = [...queryText.matchAll(labelValueRegex)];
        
        if (matches.length > 0) {
          // Apply each label:value filter with AND logic
          matches.forEach(match => {
            const label = match[1].toLowerCase();
            const value = match[2].toLowerCase();
            
            if (label === 'name') {
              conditions.push(pod.name.toLowerCase().includes(value));
            } else if (label === 'cluster') {
              conditions.push(pod.cluster.toLowerCase().includes(value));
            } else if (label === 'namespace') {
              conditions.push(pod.namespace.toLowerCase().includes(value));
            } else if (label === 'status') {
              conditions.push(pod.status.toLowerCase().includes(value));
            } else if (label === 'owner') {
              conditions.push(pod.owner.toLowerCase().includes(value));
            } else if (label === 'ready') {
              conditions.push(pod.ready.toLowerCase().includes(value));
            } else if (label === 'node') {
              conditions.push(pod.node.toLowerCase().includes(value));
            } else if (label === 'memory') {
              conditions.push(compareNumeric(pod.memory, value));
            } else if (label === 'cpu') {
              conditions.push(compareNumeric(pod.cpu, value));
            } else if (label === 'restarts') {
              conditions.push(compareNumeric(pod.restarts.toString(), value));
            } else if (label === 'created') {
              conditions.push(pod.created.toLowerCase().includes(value));
            } else if (label === 'labels') {
              conditions.push(pod.labels.toLowerCase().includes(value));
            } else if (label === 'ipaddress') {
              conditions.push(pod.ipAddress.toLowerCase().includes(value));
            } else if (label === 'receivingtraffic') {
              conditions.push(pod.receivingTraffic.toLowerCase().includes(value));
            }
          });
        } else {
          // No label:value pattern, search across all fields with OR logic
          const searchLower = queryText.toLowerCase();
          const matchesAnyField = 
            pod.name.toLowerCase().includes(searchLower) ||
            pod.cluster.toLowerCase().includes(searchLower) ||
            pod.namespace.toLowerCase().includes(searchLower) ||
            pod.status.toLowerCase().includes(searchLower) ||
            pod.owner.toLowerCase().includes(searchLower) ||
            pod.ready.toLowerCase().includes(searchLower) ||
            pod.restarts.toString().toLowerCase().includes(searchLower) ||
            pod.memory.toLowerCase().includes(searchLower) ||
            pod.cpu.toLowerCase().includes(searchLower) ||
            pod.node.toLowerCase().includes(searchLower) ||
            pod.created.toLowerCase().includes(searchLower) ||
            pod.labels.toLowerCase().includes(searchLower) ||
            pod.ipAddress.toLowerCase().includes(searchLower) ||
            pod.receivingTraffic.toLowerCase().includes(searchLower);
          conditions.push(matchesAnyField);
        }
      }
      
      // Apply dropdown filters (multi-select with OR within same type, AND across types)
      if (clusterFilter.length > 0) {
        conditions.push(clusterFilter.includes(pod.cluster));
      }
      if (namespaceFilter.length > 0) {
        conditions.push(namespaceFilter.includes(pod.namespace));
      }
      if (statusFilter.length > 0) {
        conditions.push(statusFilter.includes(pod.status));
      }
      if (ownerFilter.length > 0) {
        conditions.push(ownerFilter.some(owner => pod.owner.includes(owner)));
      }
      
      // AND logic: all conditions must be true
      return conditions.length === 0 || conditions.every(condition => condition);
    });
  }, [queryText, queryChips, clusterFilter, namespaceFilter, statusFilter, ownerFilter]);

  // Sort nodes
  const sortedPods = React.useMemo(() => {
    if (activeSortIndex === null) {
      return filteredPods;
    }

    const sortedArray = [...filteredPods];
    const columnKey = visibleColumns[activeSortIndex];

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
        case 'cluster':
          aValue = a.cluster;
          bValue = b.cluster;
          break;
        case 'namespace':
          aValue = a.namespace;
          bValue = b.namespace;
          break;
        case 'owner':
          aValue = a.owner;
          bValue = b.owner;
          break;
        case 'ready':
          aValue = a.ready;
          bValue = b.ready;
          break;
        case 'restarts':
          aValue = a.restarts;
          bValue = b.restarts;
          break;
        case 'memory':
          aValue = parseFloat(a.memory.split(' ')[0]) || 0;
          bValue = parseFloat(b.memory.split(' ')[0]) || 0;
          break;
        case 'created':
          aValue = a.created;
          bValue = b.created;
          break;
        case 'node':
          aValue = a.node;
          bValue = b.node;
          break;
        case 'cpu':
          aValue = parseInt(a.cpu) || 0;
          bValue = parseInt(b.cpu) || 0;
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
  }, [filteredPods, activeSortIndex, activeSortDirection, visibleColumns]);

  const paginatedPods = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedPods.slice(start, start + perPage);
  }, [sortedPods, page, perPage]);

  const onSetPage = (_event: any, pageNumber: number) => setPage(pageNumber);
  const onPerPageSelect = (_event: any, newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setPage(1);
  }, [queryChips, clusterFilter, namespaceFilter, statusFilter, ownerFilter, queryText]);

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

  const handleOwnerFilterChange = (owner: string, checked: boolean) => {
    const newFilter = checked 
      ? [...ownerFilter, owner]
      : ownerFilter.filter(o => o !== owner);
    setOwnerFilter(newFilter);
    
    if (checked) {
      addQueryChip('owner', `owner:${owner}`, owner);
    } else {
      removeQueryChip(`owner-${owner.replace(/\s+/g, '-')}`);
    }
  };

  const handleInstanceTypeFilterChange = (instanceType: string, checked: boolean) => {
    const newFilter = checked 
      ? [...instanceTypeFilter, instanceType]
      : instanceTypeFilter.filter(i => i !== instanceType);
    setInstanceTypeFilter(newFilter);
    
    if (checked) {
      addQueryChip('instancetype', `instanceType:${instanceType}`, instanceType);
    } else {
      removeQueryChip(`instancetype-${instanceType.replace(/\s+/g, '-')}`);
    }
  };

  // Helper function to render cell content
  const renderCellContent = (pod: Pod, column: string) => {
    switch (column) {
      case 'name':
        return pod.name;
      case 'namespace':
        return pod.namespace;
      case 'cluster':
        return pod.cluster;
      case 'status':
        const getStatusIcon = () => {
          switch (pod.status) {
            case 'Running':
              return <CheckCircleIcon style={{ color: 'var(--pf-v5-global--success-color--100)', fontSize: '14px' }} />;
            case 'Completed':
              return <CheckCircleIcon style={{ color: 'var(--pf-v5-global--info-color--100)', fontSize: '14px' }} />;
            case 'Pending':
              return <InProgressIcon style={{ color: 'var(--pf-v5-global--warning-color--100)', fontSize: '14px' }} />;
            case 'CrashLoopBackOff':
              return <ExclamationCircleIcon style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '14px' }} />;
            case 'Failed':
              return <BanIcon style={{ color: 'var(--pf-v5-global--danger-color--100)', fontSize: '14px' }} />;
            case 'Terminating':
              return <ExclamationTriangleIcon style={{ color: 'var(--pf-v5-global--warning-color--100)', fontSize: '14px' }} />;
            case 'Unknown':
              return <QuestionCircleIcon style={{ color: 'var(--pf-v5-global--disabled-color--100)', fontSize: '14px' }} />;
            default:
              return null;
          }
        };
        
        return (
          <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }} style={{ gap: '0.25rem' }}>
            <FlexItem>{getStatusIcon()}</FlexItem>
            <FlexItem style={{ fontSize: '14px' }}>{pod.status}</FlexItem>
          </Flex>
        );
      case 'ready':
        return pod.ready;
      case 'restarts':
        return pod.restarts;
      case 'owner':
        return pod.owner;
      case 'memory':
        return pod.memory;
      case 'cpu':
        return pod.cpu;
      case 'created':
        return pod.created;
      case 'node':
        return pod.node;
      case 'labels':
        return pod.labels;
      case 'ipAddress':
        return pod.ipAddress;
      case 'receivingTraffic':
        return pod.receivingTraffic;
      default:
        return '';
    }
  };

  // Get sorting parameters for table columns
  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex !== null ? activeSortIndex : undefined,
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
          <Title headingLevel="h1" size="xl" style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>Pods</Title>
      
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
              placeholder={queryChips.length === 0 ? "Search by name or use filters (e.g., status:Running ready:2/2 memory:>20)" : ""}
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
            isOpen={isOwnerFilterOpen}
            onSelect={() => {}}
            onOpenChange={(isOpen: boolean) => setIsOwnerFilterOpen(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle 
                ref={toggleRef} 
                onClick={() => setIsOwnerFilterOpen(!isOwnerFilterOpen)}
                isExpanded={isOwnerFilterOpen}
                icon={<FilterIcon />}
                style={{
                  width: '180px'
                }}
              >
                Owner {ownerFilter.length > 0 && <Badge isRead>{ownerFilter.length}</Badge>}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {uniqueOwners.map(owner => (
                <DropdownItem 
                  key={owner}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`owner-${owner}`}
                    label={owner}
                    isChecked={ownerFilter.includes(owner)}
                    onChange={(event, checked) => handleOwnerFilterChange(owner, checked)}
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
              itemCount={filteredPods.length}
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

      {filteredPods.length === 0 ? (
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
              {visibleColumns.map((column, index) => (
                <Th key={column} sort={getSortParams(index)}>
                  {columnConfig[column].label}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {paginatedPods.map((node, index) => (
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
              itemCount={filteredPods.length}
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
            <Button key="restore" variant="link" onClick={handleRestoreDefaults}>
              Restore default columns
            </Button>,
          ]}
        >
          <div style={{ marginBottom: 'var(--pf-v5-global--spacer--md)' }}>
            Selected columns will appear in the table. Drag to reorder.
          </div>
          
          <Alert
            variant="info"
            isInline
            title={`You can select up to ${maxColumns} columns`}
            style={{ marginBottom: 'var(--pf-v5-global--spacer--lg)' }}
          >
            The namespace column is only shown when in "All projects"
          </Alert>
          
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
          
          {/* Additional Columns to Add */}
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: 'var(--pf-v5-global--spacer--md)',
            fontSize: 'var(--pf-v5-global--FontSize--sm)',
            marginTop: 'var(--pf-v5-global--spacer--lg)'
          }}>
            Additional columns
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
        </Modal>
      </PageSection>
    </>
  );
};

