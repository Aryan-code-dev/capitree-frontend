
import React from 'react';
import Login from "./components/login/Login.js"
import Register from "./components/register/Register.js"
import Flow from "./components/flow/Flow.js"
import { BrowserRouter as Router, Routes, Route,Navigate } from "react-router-dom";
import { AuthProvider } from './utils/auth';
import RequireAuth from './utils/RequireAuth';
import { ReactFlowProvider,} from 'reactflow';
import './App.css'

export default function App(props) {
  return (
    <div  style={{ display: 'flex', height: '100vh' }}> 
    <ReactFlowProvider>
    <AuthProvider>
      <Router>
         
      
        
        <Routes>
        
          <Route path="/" element = {<RequireAuth><Flow/></RequireAuth>}/>
          
          <Route path="/login" element={<Login />}/>
            
          <Route path="/dashboard" element = {<RequireAuth><Flow/></RequireAuth>}/>
          <Route path="/register" element={<Register/>}/>
          
          </Routes>
          
       
          
      </Router>
      </AuthProvider>
    </ReactFlowProvider>
    </div> 
      
    
  );
}