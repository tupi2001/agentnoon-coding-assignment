function buildTree(data) {
  const idMap = {},
    roots = [];

  data.forEach((emp) => {
    const department = emp.Department?.trim() || "Default";
    // Add a unique `id` property.
    idMap[emp["Employee Id"]] = {
      id: emp["Employee Id"],
      name: emp.Name?.trim() || "Unknown",
      title: emp["Job Title"]?.trim() || "",
      salary: Number(emp.Salary),
      department,
      children: [],
      _expanded: false,
    };
  });

  data.forEach((emp) => {
    const node = idMap[emp["Employee Id"]];
    const managerId = emp.Manager;
    if (managerId && idMap[managerId]) {
      idMap[managerId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  const root =
    roots.length === 1
      ? roots[0]
      : {
          id: "root", // a fallback id for the artificial root node
          name: "Organization",
          title: "",
          department: "Default",
          salary: 0,
          children: roots,
          _expanded: true,
        };

  function preserveOriginalChildren(node) {
    if (node.children?.length > 0) {
      node._children = [...node.children];
      node.children.forEach(preserveOriginalChildren);
    } else {
      node._children = [];
    }
  }

  preserveOriginalChildren(root);
  // Start with tree collapsed (not root)
  root.children = null;

  return root;
}
