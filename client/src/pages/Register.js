import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PROFESSIONS = [
  "הייטק","עצמאיות","עיצוב גרפי","צילום מקצועי",
  "אדריכלות ועיצוב פנים","אומנות הבמה והפקות תוכן",
  "טיפול יעוץ  והנחיה","כתיבה ספרותית","חשבונאות ומיסים",
  "תזונה בריאות והתעמלות","הוראה למידה ועזרים",
  "אולפן סאונד ונגינה","קופירייטינג"
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    age: "",
    city: "",
    profession: "",
    educationPlace: "",
    startYear: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = {
      username: form.username,
      password: form.password,
      age: Number(form.age),
      city: form.city,
      advancedInfo: form.profession
        ? {
            profession: form.profession,
            educationPlace: form.educationPlace,
            startYear: Number(form.startYear)
          }
        : undefined
    };

    try {
      const res = await fetch("http://localhost:7500/Forumix/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        alert("נרשמת בהצלחה!");
        navigate("/login");
      } else {
        alert(data.message || "שגיאה בהרשמה");
      }
    } catch (err) {
      alert("שגיאת רשת");
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-card auth-card-wide" onSubmit={handleSubmit}>
        <span className="eyebrow">Join Forumix</span>
        <h2>Build your public presence</h2>
        <p>Create an account, enter your basics, and optionally add professional context to your profile.</p>

        <div className="form-grid">
          <input
            name="username"
            placeholder="שם משתמש"
            value={form.username}
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="סיסמה"
            value={form.password}
            onChange={handleChange}
          />

          <input
            name="age"
            type="number"
            placeholder="גיל"
            value={form.age}
            onChange={handleChange}
          />

          <input
            name="city"
            placeholder="עיר"
            value={form.city}
            onChange={handleChange}
          />
        </div>

        <div className="section-card">
          <h3>מידע מקצועי (לא חובה)</h3>

          <select name="profession" value={form.profession} onChange={handleChange}>
            <option value="">בחר מקצוע</option>
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {form.profession && (
            <div className="form-grid">
              <input
                name="educationPlace"
                placeholder="מקום לימודים"
                value={form.educationPlace}
                onChange={handleChange}
              />

              <input
                name="startYear"
                type="number"
                placeholder="שנת התחלה"
                value={form.startYear}
                onChange={handleChange}
              />
            </div>
          )}
        </div>

        <button type="submit" className="primary-button">הירשם</button>
      </form>
    </section>
  );
}
