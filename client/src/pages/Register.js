import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const TERMS_URL = "http://localhost:7500/Forumix/auth/terms";

  const [form, setForm] = useState({
    username: "",
    password: "",
    age: "",
    city: "",
    profession: "",
    educationPlace: "",
    startYear: ""
  });
  const [termsFile, setTermsFile] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleTermsFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && file.type !== "application/pdf") {
      alert("אפשר להעלות רק קובץ PDF חתום");
      e.target.value = "";
      setTermsFile(null);
      return;
    }

    setTermsFile(file);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsFile) {
      alert("חובה להוריד את התקנון, לחתום עליו ולהעלות אותו כ-PDF");
      return;
    }

    try {
      const termsFileData = await fileToBase64(termsFile);

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
          : undefined,
        termsFile: {
          name: termsFile.name,
          type: termsFile.type,
          size: termsFile.size,
          data: termsFileData
        }
      };

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
        {/* <h2>Build your public presence</h2>
        <p>Create an account, enter your basics, and optionally add professional context to your profile.</p> */}

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

        <div className="terms-upload-box">
          <a className="ghost-button" href={TERMS_URL} download>
            הורדת התקנון לחתימה
          </a>

          <label className="terms-file-label">
            העלאת התקנון החתום
            <input
              name="termsFile"
              type="file"
              accept="application/pdf,.pdf"
              required
              onChange={handleTermsFileChange}
            />
          </label>

          {termsFile && <p>{termsFile.name}</p>}
        </div>

        {/* <div className="section-card">
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
        </div> */}

        <button type="submit" className="primary-button">הירשם</button>
      </form>
    </section>
  );
}
