/** DSA MCQ bank — 10 questions per level (1–10). */

function q(level, questionText, options, correctOptionIndex) {
  return {
    course: 'Computer Science',
    subject: 'DSA',
    level,
    questionText,
    options,
    correctOptionIndex
  };
}

const dsaQuestions = [
  // Level 1 — Basics & Complexity
  q(1, 'What is a Data Structure?', ['A programming language', 'A way of organizing and storing data', 'A computer hardware', 'An operating system'], 1),
  q(1, 'Which of the following is a Linear Data Structure?', ['Tree', 'Graph', 'Array', 'Heap'], 2),
  q(1, 'Which of the following is a Non-Linear Data Structure?', ['Stack', 'Queue', 'Array', 'Tree'], 3),
  q(1, 'What does Traversing mean?', ['Adding a new element', 'Removing an element', 'Visiting each element of a data structure', 'Sorting the elements'], 2),
  q(1, 'Insertion in an array means:', ['Searching an element', 'Adding a new element', 'Swapping two elements', 'Printing the array'], 1),
  q(1, 'Deletion in an array means:', ['Removing an element', 'Copying an element', 'Sorting the array', 'Reversing the array'], 0),
  q(1, 'What does Big O notation represent?', ['Memory size', 'Algorithm efficiency', 'Variable size', 'File size'], 1),
  q(1, 'Which of the following has the best (fastest) time complexity?', ['O(n²)', 'O(n)', 'O(log n)', 'O(1)'], 3),
  q(1, 'Time complexity of a single loop from 0 to n-1 is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2),
  q(1, 'Time complexity of nested loops both 0..n-1 is:', ['O(1)', 'O(n)', 'O(n log n)', 'O(n²)'], 3),

  // Level 2 — Arrays
  q(2, 'What is the time complexity of accessing an element in an array by index?', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], 2),
  q(2, 'In a static array, size is typically:', ['Dynamic at runtime', 'Fixed at allocation', 'Always infinite', 'Determined by sorting'], 1),
  q(2, 'Worst-case time to search an unsorted array linearly is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2),
  q(2, 'Which operation is costly in the middle of a contiguous array?', ['Read by index', 'Insert/delete shifting elements', 'Compute length', 'Compare two indices'], 1),
  q(2, 'A 2D array is best described as:', ['A linked list of trees', 'An array of arrays', 'A hash map only', 'A stack of queues'], 1),
  q(2, 'Which is true for arrays vs linked lists?', ['Arrays have O(1) random access', 'Arrays never waste memory', 'Linked lists always use less memory', 'Arrays cannot store integers'], 0),
  q(2, 'Reversing an array in-place typically needs:', ['O(n) time and O(1) extra space', 'O(1) time', 'O(n²) time always', 'O(n) extra space only'], 0),
  q(2, 'Finding the maximum in an unsorted array requires in the worst case:', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2),
  q(2, 'Which indexing is common in programming languages for arrays?', ['1-based only', '0-based', '2-based', 'Random-based'], 1),
  q(2, 'Sparse arrays are useful when:', ['Most elements are zero/empty', 'All elements are unique keys', 'Data is always sorted', 'You need O(1) insert in middle'], 0),

  // Level 3 — Linked Lists
  q(3, 'In a singly linked list, each node stores:', ['Only data', 'Data and pointer to next', 'Data and two child pointers', 'Only a previous pointer'], 1),
  q(3, 'Time complexity to insert at the head of a singly linked list is:', ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], 2),
  q(3, 'Searching for a value in a singly linked list is typically:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2),
  q(3, 'A doubly linked list node has:', ['No pointers', 'Next only', 'Prev and next', 'Left and right children'], 2),
  q(3, 'Detecting a cycle in a linked list can use:', ['Binary search', 'Floyd’s tortoise and hare', 'Heap sort', 'BFS on a matrix'], 1),
  q(3, 'Advantage of linked lists over arrays:', ['O(1) random access', 'Easier dynamic insertion without shifting', 'Better cache locality always', 'Fixed size'], 1),
  q(3, 'To delete a node in a singly linked list (given only head and value), worst case is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 2),
  q(3, 'A circular linked list:', ['Has no last node pointing anywhere', 'Last node points to the first', 'Cannot store integers', 'Is always doubly linked'], 1),
  q(3, 'Middle of a linked list can be found in one pass using:', ['Two pointers (slow/fast)', 'Binary search', 'A stack only', 'Hashing only'], 0),
  q(3, 'Which is NOT a typical linked list type?', ['Singly', 'Doubly', 'Circular', 'Quadratic'], 3),

  // Level 4 — Stacks & Queues
  q(4, 'Stack follows which order?', ['FIFO', 'LIFO', 'Random', 'Priority only'], 1),
  q(4, 'Queue follows which order?', ['LIFO', 'FIFO', 'Sorted order', 'Hash order'], 1),
  q(4, 'Which operation removes from a stack?', ['enqueue', 'dequeue', 'pop', 'peek-only'], 2),
  q(4, 'Function call management commonly uses a:', ['Queue', 'Stack', 'Graph', 'Hash set only'], 1),
  q(4, 'A circular queue helps avoid:', ['O(1) dequeue', 'Wasted space in a linear array queue', 'Using arrays', 'Front and rear indices'], 1),
  q(4, 'Evaluating postfix expressions uses a:', ['Queue', 'Stack', 'BST', 'Trie'], 1),
  q(4, 'Deque supports insertion/removal at:', ['Only front', 'Only rear', 'Both ends', 'Only middle'], 2),
  q(4, 'Balanced parentheses checking is classically done with a:', ['Stack', 'Queue', 'Heap', 'Graph'], 0),
  q(4, 'Priority queue typically retrieves:', ['Oldest element', 'Newest element', 'Highest/lowest priority element', 'Random element'], 2),
  q(4, 'Time complexity of push/pop on an array-backed stack (amortized) is:', ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], 2),

  // Level 5 — Trees
  q(5, 'A binary tree node can have at most how many children?', ['1', '2', '3', 'Unlimited'], 1),
  q(5, 'In-order traversal of a BST visits nodes in:', ['Random order', 'Ascending key order', 'Level order only', 'Descending height order'], 1),
  q(5, 'Height of a single-node tree is commonly:', ['0 or 1 depending on convention', 'Always n', 'Always log n', 'Undefined'], 0),
  q(5, 'Full binary tree means:', ['Every node has 0 or 2 children', 'Every level is complete except possibly last', 'All leaves are at different levels', 'It is a BST'], 0),
  q(5, 'Level-order traversal uses a:', ['Stack', 'Queue', 'Hash map only', 'Priority queue only'], 1),
  q(5, 'Number of edges in a tree with n nodes is:', ['n', 'n-1', 'n+1', '2n'], 1),
  q(5, 'Preorder traversal order is:', ['Left, Root, Right', 'Root, Left, Right', 'Left, Right, Root', 'Right, Left, Root'], 1),
  q(5, 'A leaf node has:', ['Two children', 'One child', 'No children', 'Three children'], 2),
  q(5, 'Which structure is hierarchical?', ['Array', 'Stack', 'Tree', 'Queue'], 2),
  q(5, 'Complete binary tree fills levels:', ['Randomly', 'Left to right without gaps (except possibly last level)', 'Right to left only', 'Only with BST property'], 1),

  // Level 6 — BST & Heaps
  q(6, 'In a BST, left child is typically:', ['Greater than parent', 'Less than parent', 'Equal only', 'Unrelated'], 1),
  q(6, 'Average search time in a balanced BST is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 1),
  q(6, 'Worst-case BST height (skewed) leads to search of:', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 2),
  q(6, 'A min-heap root contains the:', ['Maximum', 'Minimum', 'Median', 'Random'], 1),
  q(6, 'Heap is commonly used to implement:', ['DFS', 'Priority queue', 'Hash table', 'Linked list'], 1),
  q(6, 'Insert into a binary heap is typically:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 1),
  q(6, 'Which is true for heaps?', ['Always sorted in-order like BST', 'Complete binary tree with heap property', 'Must be a BST', 'Cannot be stored in arrays'], 1),
  q(6, 'Extract-min from a binary min-heap is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], 1),
  q(6, 'Self-balancing BSTs (e.g. AVL) keep operations near:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 1),
  q(6, 'Heap sort worst-case time is:', ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 1),

  // Level 7 — Hashing
  q(7, 'Average search time in a good hash table is:', ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 0),
  q(7, 'Collision means:', ['Two keys hash to same index', 'Table is empty', 'Key not found', 'Resize succeeded'], 0),
  q(7, 'Chaining resolves collisions using:', ['Linked lists (or buckets) at indices', 'Only sorting', 'Only trees without lists', 'Deleting keys'], 0),
  q(7, 'Open addressing stores collided items:', ['Outside the table only', 'In other slots in the table', 'In a separate database', 'Never'], 1),
  q(7, 'Load factor is approximately:', ['n / table size', 'table size / n always 0', 'Always 1', 'Height of tree'], 0),
  q(7, 'A good hash function should:', ['Cluster all keys', 'Distribute keys uniformly', 'Always return 0', 'Ignore the key'], 1),
  q(7, 'Worst-case lookup with poor hashing/chaining can be:', ['O(1)', 'O(log n)', 'O(n)', 'O(1) always'], 2),
  q(7, 'Hash tables are poor when you need:', ['Fast average lookup', 'Ordered traversal of keys', 'Insert/delete', 'Key-value maps'], 1),
  q(7, 'Rehashing is done when:', ['Load factor grows too high', 'Table is empty', 'Only on deletes', 'Never'], 0),
  q(7, 'Which is a collision resolution strategy?', ['Linear probing', 'Inorder traversal', 'DFS', 'Prim’s algorithm'], 0),

  // Level 8 — Graphs
  q(8, 'A graph G = (V, E) consists of:', ['Only vertices', 'Vertices and edges', 'Only edges', 'Only weights'], 1),
  q(8, 'BFS uses which structure?', ['Stack', 'Queue', 'Heap only', 'BST only'], 1),
  q(8, 'DFS uses which structure (explicit)?', ['Queue', 'Stack', 'Hash only', 'Array only'], 1),
  q(8, 'Adjacency matrix for V vertices needs space:', ['O(V)', 'O(E)', 'O(V²)', 'O(1)'], 2),
  q(8, 'Adjacency list is preferable when graph is:', ['Dense only', 'Sparse', 'Always complete', 'Without edges'], 1),
  q(8, 'Dijkstra’s algorithm finds:', ['MST only', 'Shortest paths from a source (non-negative weights)', 'All cycles', 'Topological order only'], 1),
  q(8, 'A directed graph with no cycles is a:', ['DAG', 'Tree always', 'Complete graph', 'Bipartite only'], 0),
  q(8, 'Degree of a vertex is:', ['Number of incident edges', 'Number of vertices', 'Weight sum only', 'Path length'], 0),
  q(8, 'Connected undirected graph means:', ['Every pair of vertices is reachable', 'No edges exist', 'It is a DAG', 'It has negative weights'], 0),
  q(8, 'Topological sort applies to:', ['Undirected cycles only', 'DAGs', 'Any cyclic digraph', 'Weighted complete graphs only'], 1),

  // Level 9 — Sorting & Searching
  q(9, 'Binary search requires the array to be:', ['Unsorted', 'Sorted', 'Linked', 'Hashed'], 1),
  q(9, 'Binary search time complexity is:', ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], 1),
  q(9, 'Merge sort worst-case time is:', ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'], 1),
  q(9, 'Quick sort worst-case time is:', ['O(n log n)', 'O(n²)', 'O(n)', 'O(1)'], 1),
  q(9, 'Stable sorting means:', ['Equal keys keep relative order', 'Always O(n)', 'Uses no memory', 'Works only on ints'], 0),
  q(9, 'Which sort is typically stable?', ['Quick sort (typical in-place)', 'Heap sort', 'Merge sort', 'Selection sort'], 2),
  q(9, 'Counting sort is efficient when:', ['Keys are in a small integer range', 'Keys are arbitrary strings only', 'n is tiny and keys huge', 'Graph is sparse'], 0),
  q(9, 'Selection sort time complexity is:', ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'], 1),
  q(9, 'Lower bound for comparison-based sorting is:', ['O(n)', 'Ω(n log n)', 'O(1)', 'O(n²) always'], 1),
  q(9, 'Interpolation search works best on:', ['Uniformly distributed sorted data', 'Linked lists', 'Hash collisions', 'Unsorted arrays'], 0),

  // Level 10 — DP & Greedy
  q(10, 'Dynamic programming is useful when problems have:', ['No overlapping subproblems', 'Optimal substructure and overlapping subproblems', 'Only greedy choices', 'Only graph coloring'], 1),
  q(10, 'Memoization refers to:', ['Top-down caching of subproblem results', 'Bottom-up only loops', 'Deleting recursion', 'Hash collisions'], 0),
  q(10, 'Fibonacci with plain recursion is inefficient due to:', ['No base case possible', 'Overlapping subproblems recomputed', 'O(1) time', 'Sorting'], 1),
  q(10, '0/1 Knapsack is a classic:', ['Greedy-only problem always', 'DP problem', 'BFS problem', 'Hashing problem'], 1),
  q(10, 'Greedy algorithms make:', ['Locally optimal choices hoping for global optimum', 'Always explore all states', 'Only DFS', 'Only sorting'], 0),
  q(10, 'Activity selection (interval scheduling) is typically solved by:', ['Greedy by earliest finish time', 'Dijkstra', 'DFS only', 'Counting sort only'], 0),
  q(10, 'Longest Common Subsequence is commonly solved with:', ['DP table', 'Binary search only', 'Stack only', 'BFS only'], 0),
  q(10, 'Coin change (minimum coins) with unlimited coins is often:', ['DP', 'Only BST', 'Only linked list', 'Only topological sort'], 0),
  q(10, 'Which is a hallmark of bottom-up DP?', ['Building solutions iteratively from smaller subproblems', 'Never using arrays', 'Only recursion without storage', 'Random sampling'], 0),
  q(10, 'Greedy fails when:', ['Local optimum does not lead to global optimum', 'Problem is sorting', 'Graph is undirected', 'Array is sorted'], 0)
];

module.exports = { dsaQuestions };
