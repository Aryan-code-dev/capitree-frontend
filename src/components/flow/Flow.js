
import React, { useCallback ,useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../../utils/auth";

import ReactFlow, { MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  useOnViewportChange,
  useNodesState, 
  useEdgesState, 
  addEdge, 
  useReactFlow, 
  useStoreApi,
  Edge,
  EdgeTypes,
  Position,
  add} from 'reactflow';

import 'reactflow/dist/style.css';
import '../../input.css';
import '../../updatenode.css';

import CustomNode from '../../CustomNode.js';
const nodeTypes = {customNode: CustomNode};

const BASE_URL="http://localhost:3001/";

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getNodes, getEdges,addNodes,addNode } = useReactFlow();
  const [nodelabel, setLabel] = useState('');
  const [nodereturnType, setReturnType] = useState('');
  const [edgeRequestType, setedgeRequestType] = useState('');
  const [selectedNodeData, setSelectedNodeData] = useState([]);
  const [selectedEdgeData, setSelectedEdgeData] = useState([]);
  
  const auth = useAuth();
  let token;
  // This is hook is for fetching user nodes and edges from previous session
  useEffect(() => {
    const fetchData = async () => {
      try {
        token = sessionStorage.getItem('token');
        
        const response = await axios({
          method: "GET",
          url: 'http://localhost:3001/load/initialData',
          headers: {
            authorization: token,
          },
        });
        
        setNodes(response.data.nodes);
        setEdges(response.data.edges);
      } catch (error) {
        console.error('Error sending data to the server:', error);
      }
    };

    fetchData();
  }, []);

  const nodePositionListener = useCallback((event) => {
    
    const all_nodes = getNodes();
    const all_edges = getEdges();
    console.log(all_nodes);
    console.log(all_edges);
  },[setNodes]);

  // Misc function for generating edges betweeen same nodes with different colours 
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    const strokeWidth = Math.floor(Math.random() * 10) + 1; // Random stroke width between 1 and 10
    return { color, strokeWidth };
  };

  // Custome onConnect Callback function
  const onConnect = useCallback((params) => {
    const label = window.prompt('Enter edge label:'); // Prompt the user for a label
    //const { color, strokeWidth } = getRandomColor();
    const allEdges = getEdges();
    let maxId = 0;
    let inr =1;
    for (const e of allEdges) {
      if (e.id > maxId) {
        maxId = e.id;
      }
    }
    
    if (label !== null) {
      // Add the edge without checking for duplicates
      setEdges((prevEdges) => [
        ...prevEdges,
        {
          ...params,
          label: label,
          type: 'step',
          id: `${Number(maxId)+Number(inr)}`
          // style: {
          //   strokeWidth: strokeWidth,
          //   stroke: color,
          // },
        },
      ]);
      handleSave();
    }
  }, [setEdges]);
  const minimapStyle = {
    height: 120,
  };

  // Function for saving to local storage on a temporary basis 
  const handleSave = () => {
    const allNodes = getNodes();
    const allEdges = getEdges();

    // Save data to local storage
    localStorage.setItem('nodes', JSON.stringify(allNodes));
    localStorage.setItem('edges', JSON.stringify(allEdges));
  };

  // Function used to sync local changes with backend
  const handleTabClose = async () => {
    // Get data from local storage
    const nodesData = localStorage.getItem('nodes');
    const edgesData = localStorage.getItem('edges');
    
      const data = {
        nodes: JSON.parse(nodesData),
        edges: JSON.parse(edgesData),
      };
      console.log("Data acquired");
      // Send data to the server
      try {
        const response = await axios.post('http://localhost:3001/update/localUpdate',{headers: {
          authorization: token, 
        }}, data);
        
        
      } catch (error) {
        console.error('Error sending data to the server:', error);
      }
  };
  
  // Attach the event listener to the 'beforeunload' event
  window.addEventListener('beforeunload', handleTabClose);

  
  // Display components
  // This hook updates data of the selcted node
  useEffect(() => {
    const allNodes = getNodes();
    const selectedNodeId = allNodes.find((node) => node.selected)?.id;
  
    if (selectedNodeId) {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                label: nodelabel,
                returnType: nodereturnType,
              },
            }
          : node
      )
    );
  }
  }, [nodelabel, nodereturnType, setNodes]);
  
  // This hook updates data of the selcted edge
  useEffect(() => {
    const allEdges = getEdges();
    const selectedEdgesource = allEdges.find((edge) => edge.selected)?.source;
    const selectedEdgetarget = allEdges.find((edge) => edge.selected)?.target;
  
    if (selectedEdgesource && selectedEdgetarget) {
      // Update all edges between the same source and target nodes
      setEdges((prevEdges) =>
        prevEdges.map((edge) =>
          edge.source === selectedEdgesource && edge.target === selectedEdgetarget
            ? {
                ...edge,
                label: edgeRequestType,
              }
            : edge
        )
      );
    }
  }, [edgeRequestType, setEdges]);

  // Hook for checking of selected nodes and edges and updating respective state variables
  useEffect(() => {
    const intervalId = setInterval(() => {
      const all_nodes = getNodes();
      const all_edges = getEdges();
      const selectedNodeData = all_nodes
        .filter((node) => node.selected)
        .map((selectedNode) => selectedNode.data);

      const selectedEdgeData = all_edges
        .filter((edge) => edge.selected)
        .map((selectedEdge) => selectedEdge.label);
      setSelectedNodeData(selectedNodeData);
      setSelectedEdgeData(selectedEdgeData);
      handleSave();
    }, 1000); 

    
    return () => clearInterval(intervalId);
  }, [getNodes]);

  // useEffect(() => {

  //     const all_nodes = getNodes();
  //     const all_edges = getEdges();
  //     const selectedNodeData = all_nodes
  //       .filter((node) => node.selected)
  //       .map((selectedNode) => selectedNode.data);

  //     const selectedEdgeData = all_edges
  //       .filter((edge) => edge.selected)
  //       .map((selectedEdge) => selectedEdge.label);
  //     setSelectedNodeData(selectedNodeData);
  //     setSelectedEdgeData(selectedEdgeData);
      
  // }, [getNodes,getEdges]);

  // Add node function
  const [label, setnodeLabel] = useState('');
  const [returnType, setnodeReturnType] = useState('');
  const addNodeHandler = () => {
    const allNodes = getNodes();
    let maxId = 0;

    for (const node of allNodes) {
      if (node.id > maxId) {
        maxId = node.id;
      }
    }

    const newNode = {
      id: `${Number(maxId) + Number(1)}`,
      position: { x: 0, y: 0 },
      data: { label, returnType },
      type: 'customNode'
    };

    addNodes(newNode);
    setnodeLabel('');
    setnodeReturnType('');

  };

  const handleInputChange = (e) => {
    setnodeLabel(e.target.value);
    
  };
  const handleReturnTypeChange = (f) => {
    setnodeReturnType(f.target.value);
  };
  const logout = async () => {
    auth.logout();         
    
}
  
  return( 
  
  <ReactFlow
    onNodeDragStop={nodePositionListener}
    onEdgesDelete={nodePositionListener}
    onNodesDelete={nodePositionListener}
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    onConnect={onConnect}
    nodeTypes={nodeTypes}
    elements={edges}
    connectionLineStyle={{ stroke: "#ddd", strokeWidth: 2 }}
    
    connectionLineType="step"
    snapToGrid={true}
  >
    <div className="updatenode__controls"  >
      <h2>Selected Node Data:</h2>
      {selectedNodeData.map((data, index) => (
        <div key={index}>   
          <strong>Node {index + 1}:</strong>
          <div>{JSON.stringify(data)}</div>
          <p>Update:</p>
          <label>path: </label>
          <input value={nodelabel} onChange={(evt) => setLabel(evt.target.value)} />
          <br/><br/>
          <label>returnType: </label>
          <input value={nodereturnType} onChange={(evt) => setReturnType(evt.target.value)} />
          
        </div>
      ))}
      <h2>Selected Edge Data:</h2>
      {selectedEdgeData.map((label, index) => (
        <div key={index}>
          <strong>Edge {index + 1}:</strong>
          <div>Request Type: {JSON.stringify(label)}</div>
          <label>requestType:</label>
          <input value={edgeRequestType} onChange={(evt) => setedgeRequestType(evt.target.value)} />
        </div>
      ))}
    </div>
    <div className="input-container">
    <input type="text" className="input-field" placeholder="Node Label" value={label} onChange={handleInputChange}/>
    <input type="text" className="input-field" placeholder="Node Return Type" value={returnType} onChange={handleReturnTypeChange}/>
    <button className="add-button" onClick={addNodeHandler}>Add Node</button>
    <button className="logout-button" onClick={logout}>Add Node</button>
    
    </div>
      <MiniMap style={minimapStyle} zoomable pannable />
      <Controls />
      <Background color="#aaa" gap={16} />
      </ReactFlow>
      
  );
}



export default Flow