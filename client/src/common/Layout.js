
//
import socket from "../socket";

//
import { NavLink, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTopics } from "../store/topicsSlice";

export default function Layout() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector(state => state.topics);


// useEffect(() => {
//   if (items.length === 0) {
//     dispatch(fetchTopics());
//   }
// }, [dispatch, items.length]);
  useEffect(() => {
    dispatch(fetchTopics());
  }, [dispatch]);
  // ניסוי בשביל הצאט
        const token = useSelector(state => state.auth.token);

  useEffect(() => {

    if (token) {
      socket.auth = { token };
      socket.connect();
    }

    return () => socket.disconnect();

  }, [token]);
  //
  // const user = useSelector((state) => state.auth?.user);
  return (
    <>
      <header>
        <nav style={{ display: "flex", gap: "20px" }}>
          {loading && <p>טוען...</p>}
          {error && <p>שגיאה: {error}</p>}

          {items.map(topic => (
            <NavLink key={topic.id} to={`/topic/${topic._id}`}>
              {topic.title}
            </NavLink>
          ))}
        </nav>
        <nav>

        <NavLink to="/">בית</NavLink>

        {/* {user && ( */}
          <NavLink to="/account">
            האזור האישי
          </NavLink>
        {/* )} */}

      </nav>
      </header>

      <main>
        <Outlet />
      </main>

      

      
    </>
  );
}
