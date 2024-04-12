import React, {useState} from "react"
import "../login/Login.css"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../utils/auth";
const Login = () => {

    const navigate = useNavigate();
    const auth = useAuth();
    const [ user, setUser] = useState({
        email:"",
        password:""
    })
    
    const handleChange = e => {
        const { name, value } = e.target
        setUser({
            ...user,
            [name]: value
        })
    }

    const login = async () => {
        const res = await axios.post("http://localhost:3001/login/", user);
        if(res.status===200){
            const result = res.data.result;
            auth.login(result);
            navigate("/dashboard");
        }         
        
    }

    return (
        <div className="login">
            <h1>Login</h1>
           <input type="text" name="email" value={user.email} onChange={handleChange} placeholder="Enter your Email"></input>
            <input type="password" name="password" value={user.password} onChange={handleChange}  placeholder="Enter your Password" ></input>
            <div className="button" onClick={login}>Login</div>
            <div>or</div>
            <div className="button" onClick={() => navigate("/register")}>Register</div>
        </div>
    )
}

export default Login