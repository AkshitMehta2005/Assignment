import React, { useState } from "react";

export default function UploadStep({ setReportId, token }) {
  const [file, setFile] = useState(null);
  const [paste, setPaste] = useState("");

  // ✅ Use environment variable
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const doUpload = async (e) => {
    e.preventDefault();
    const form = new FormData();
    if (file) form.append("file", file);
    else form.append("paste", paste);

    const res = await fetch(`${BACKEND_URL}/api/report/upload`, {
      method: "POST",
      body: form,
      headers: token ? { Authorization: "Bearer " + token } : {},
    });

    const j = await res.json();
    if (j.id) {
      setReportId(j.id);
    } else {
      alert("Upload failed: " + (j.error || ""));
    }
  };

  return (
    <div
      style={{
        maxWidth: 750,
        margin: "40px auto",
        padding: "30px 25px",
        borderRadius: 16,
        background: "white",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 25,
          background: "linear-gradient(90deg, #007bff, #00c6ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "28px",
          fontWeight: "700",
          letterSpacing: "1px",
        }}
      >
        InvoReady — E-Invoicing Readiness Tool
      </h2>

      <form onSubmit={doUpload}>
        <h3
          style={{
            color: "#2c3e50",
            marginBottom: 18,
            fontSize: "20px",
            borderLeft: "4px solid #007bff",
            paddingLeft: 10,
          }}
        >
          Upload or Paste Sample Invoices
        </h3>

        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: "600",
              color: "#555",
            }}
          >
            Upload Invoice File (CSV/JSON, ≤200 rows):
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              padding: "10px",
              border: "2px dashed #007bff",
              borderRadius: 10,
              width: "100%",
              cursor: "pointer",
              background: "#f4f9ff",
              transition: "0.3s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#e9f3ff")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#f4f9ff")}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: "600",
              color: "#555",
            }}
          >
            Or Paste Invoice JSON Directly:
          </label>
          <textarea
            rows={8}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder='[{"invoice.id":"123", "invoice.currency":"USD"}...]'
            style={{
              width: "100%",
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 10,
              fontFamily: "monospace",
              resize: "vertical",
              lineHeight: "1.5",
              backgroundColor: "#fdfdfd",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)",
            }}
          />
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            type="submit"
            style={{
              padding: "12px 28px",
              background: "linear-gradient(90deg, #007bff, #00c6ff)",
              color: "white",
              border: "none",
              borderRadius: 50,
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 10px rgba(0,123,255,0.3)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 6px 15px rgba(0,123,255,0.5)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 10px rgba(0,123,255,0.3)";
            }}
          >
            🚀 Analyze Invoices
          </button>
        </div>
      </form>
    </div>
  );
}
