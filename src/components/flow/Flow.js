
import React, { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../../utils/auth";
import { saveAs } from 'file-saver';
import { Panel, getRectOfNodes, getTransformForBounds } from 'reactflow';
import { socket } from '../../socket.js';
import { toPng } from 'html-to-image';
import ReactFlow, {
  MiniMap,
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
  add
} from 'reactflow';

import 'reactflow/dist/style.css';
import '../../input.css';
import '../../updatenode.css';

import CustomNode from '../../CustomNode.js';
const nodeTypes = { customNode: CustomNode };

const BASE_URL = "http://localhost:3001/";

const Flow = () => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getNodes, getEdges, addNodes, addNode } = useReactFlow();
  const [nodelabel, setLabel] = useState('');
  const [nodereturnType, setReturnType] = useState('');
  const [edgeRequestType, setedgeRequestType] = useState('');
  const [selectedNodeData, setSelectedNodeData] = useState({});
  const [selectedEdgeData, setSelectedEdgeData] = useState({});
  const [isConnected, setIsConnected] = useState(socket.connected);

  const [fooEvents, setFooEvents] = useState([]);
  // Scoket connection
  socket.connect();
  let owner = sessionStorage.getItem('user');
  // socket.emit("hello", "world");
  useEffect(() => {
    function onConnect() {

      setIsConnected(true);
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
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function addNode(newNode) {
      addNodes(newNode);
    }
    function addEdge(e) {
      setEdges((prevEdges) => [
        ...prevEdges,
        e,
      ]);
    }
    function moveNode(mnode) {
      
      setNodes((prevNodes) =>
        prevNodes.map(node =>
          node.id === mnode.id ? { ...node, position: mnode.position } : node
        )
      );
    }
    function deleteNode(deletedNode) {
      setNodes((prevNodes) => prevNodes.filter(node => node.id !== deletedNode.id));
    }
    function deleteEdge(deletedEdge) {
      setEdges((prevEdges) => prevEdges.filter(edge => edge.id !== deletedEdge.id));
    }
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on("AddNode", addNode);
    socket.on("AddEdge", addEdge);
    socket.on("MoveNode", moveNode);
    socket.on("DeleteNode", deleteNode);
    socket.on("DeleteEdge", deleteEdge);


    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off("AddNode", addNode);
      socket.off("AddEdge", addEdge);
      socket.off("MoveNode", moveNode);
      socket.off("DeleteNode", deleteNode);
      socket.off("DeleteEdge", deleteEdge);
      socket.disconnect();
    };
  }, []);

  const auth = useAuth();
  let token;


  const nodeClickListener = useCallback((event, node) => {

    setSelectedNodeData(node.data);
  }, []);
  const edgeClickListener = useCallback((event, edge) => {

    setSelectedEdgeData(edge);
  }, []);

  const nodePositionListener = useCallback((event, node) => {
    socket.emit("MoveNode", node, owner)
    console.log(node.position);
  }, []);

  const removeClickedEdgesNodes = useCallback((event) => {
    setSelectedNodeData({});
    setSelectedEdgeData({});
  }, [])

  const nodeDeleteListener = useCallback((node) => {
    console.log(node);
    socket.emit('DeleteNode', node, owner)
    console.log(node);
  }, [])

  const edgeDeleteListener = useCallback((edge) => {
    console.log(edge);
    socket.emit('DeleteEdge', edge, owner)
    console.log(edge);
  }, [])

  // Function for taking ss

  const downloadImage = async (dataUrl) => {
    const a = document.createElement('a');

    a.setAttribute('download', 'reactflow.png');
    a.setAttribute('href', dataUrl);
    a.click();
  }

  const imageWidth = 1024;
  const imageHeight = 768;



  const takeScreenshot = () => {
    // we calculate a transform for the nodes so that all nodes are visible
    // we then overwrite the transform of the `.react-flow__viewport` element
    // with the style option of the html-to-image library
    const nodesBounds = getRectOfNodes(getNodes());
    const transform = getTransformForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);

    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: '#1a365d',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: imageWidth,
        height: imageHeight,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then(downloadImage);
  };


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
    const label = window.prompt('Enter edge label:');
    //const { color, strokeWidth } = getRandomColor();
    const allEdges = getEdges();
    let maxId = 0;
    let inr = 1;
    for (const e of allEdges) {
      if (e.id > maxId) {
        maxId = e.id;
      }
    }
    // TODO: log the edge and check object values

    if (label !== null) {
      const e = {
        ...params,
        label: label,
        type: 'step',
        id: `${Number(maxId) + Number(inr)}`

      }
      socket.emit('AddEdge', e, owner)
      // Add the edge without checking for duplicates
      setEdges((prevEdges) => [
        ...prevEdges,
        {
          ...params,
          label: label,
          type: 'step',
          id: `${Number(maxId) + Number(inr)}`
          // style: {
          //   strokeWidth: strokeWidth,
          //   stroke: color,
          // },
        },
      ]);

    }
  }, [setEdges]);
  const minimapStyle = {
    height: 120,
  };

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
    //TODO: Send node insert event
    socket.emit("AddNode", newNode, owner)
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

  return (

    <ReactFlow
      onPaneClick={removeClickedEdgesNodes}
      onNodeDragStop={nodePositionListener}
      onNodeClick={nodeClickListener}
      onNodeDrag={nodePositionListener}
      // TODO: ON node double click 

      onNodesDelete={nodeDeleteListener}
      onEdgesDelete={edgeDeleteListener}
      onEdgeClick={edgeClickListener}
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

        {Object.keys(selectedNodeData).length !== 0 && (
          <div key={selectedNodeData.id}>
            <h2>Selected Node Data:</h2>
            <strong>Node {selectedNodeData.id}:</strong>
            <div>{JSON.stringify(selectedNodeData)}</div>
            <p>Update:</p>
            <label>path: </label>
            <input value={nodelabel} onChange={(evt) => setLabel(evt.target.value)} />
            <br /><br />
            <label>returnType: </label>
            <input value={nodereturnType} onChange={(evt) => setReturnType(evt.target.value)} />
          </div>
        )}

        {Object.keys(selectedEdgeData).length !== 0 && (


          <div key={selectedEdgeData.id}>
            <h2>Selected Edge Data:</h2>
            <strong>Edge {selectedEdgeData.id}:</strong>
            <div>Request Type: {JSON.stringify(selectedEdgeData.label)}</div>
            <label>requestType:</label>
            <input value={edgeRequestType} onChange={(evt) => setedgeRequestType(evt.target.value)} />
          </div>
        )}
      </div>
      <div className="input-container" style={{ display: 'flex', justifyContent: 'flex-start', gap: '80px' }}>
        <button className="button" onClick={logout}>Logout</button>
        <button className="button" onClick={takeScreenshot}>Take Screenshot</button>
        <input type="text" className="input-field" placeholder="Node Label" value={label} onChange={handleInputChange} />
        <input type="text" className="input-field" placeholder="Node Return Type" value={returnType} onChange={handleReturnTypeChange} />
        <button className="button" onClick={addNodeHandler}>Add Node</button>
      </div>



      <MiniMap style={minimapStyle} zoomable pannable />
      <Controls />
      <Background color="#aaa" gap={16} />
    </ReactFlow>

  );
}



export default Flow