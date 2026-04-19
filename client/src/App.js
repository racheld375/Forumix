
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from './common/Layout';
import Login from './pages/Login';
import TopicDiscussions from './pages/TopicDiscussions';
import TopicComments from './pages/TopicComments';
import UserProfile from './pages/UserProfile';


// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { Provider } from "react-redux";
// import store from "./store"; // ה-store שלך שמכיל chatSlice + discussionsSlice

// import UserProfile from "./pages/UserProfile";
import ChatWindow from "./pages/ChatWindow";
import MyAccount from "./pages/MyAccount";
import { useSelector } from "react-redux";



function App() {
const currentUser = useSelector((state) => state.auth.user);
console.log("currentUser:", currentUser);
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<h1>home page</h1>} />
            <Route path="login" element={<Login />} />
            <Route path="topic/:topicId" element={<TopicDiscussions />} />
            <Route path="discussion/:discussionId" element={<TopicComments />} />
            <Route path="user/:userId" element={<UserProfile />} />

                      {/* אזור אישי */}
          <Route path="my-account" element={<MyAccount />} />

          {/* צ'אט */}
          <Route path="chat/:chatId" element={<ChatWindow />} />

<Route path="account" element={<MyAccount />} />



        
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
