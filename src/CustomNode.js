import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ data, isConnectable }) {
    return (
      <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px', background: '#fff' }}>
        <div>Path: '{data.label}'</div>
        <div>Return Type: {data.returnType}</div>
        <Handle type="source" position={Position.Right}  isConnectable={isConnectable} />
        <Handle type="target" position={Position.Left}  isConnectable={isConnectable} />
      </div>
    );
  }

  export default CustomNode;