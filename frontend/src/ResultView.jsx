import React, { useEffect, useState } from "react";

export default function ResultView({ id }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetch("https://assignment-gcj1.onrender.com/api/report/" + id)
      .then((r) => r.json())  
      .then(setReport)
      .catch(console.error);
  }, [id]);

  const downloadJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(report, null, 2));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `report-${report._id}.json`;
    link.click();
  };

  if (!report)
    return (
      <div style={{ fontSize: "16px", margin: "20px", textAlign: "center" }}>
        Loading Analysis...
      </div>
    );

  return (
    <div
      style={{
        marginTop: 30,
        padding: 30,
        borderRadius: 16,
        backgroundColor: "white",
        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        fontFamily: "Segoe UI, sans-serif",
        maxWidth: 850,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: 25,
          background: "linear-gradient(90deg, #007bff, #00c6ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: "26px",
          fontWeight: "700",
        }}
      >
        Analysis Results — Readiness & Gaps
      </h2>

      {/* Link instead of plain Report ID */}
      <div style={{ marginBottom: 12 }}>
        <strong>Shareable Report Link:</strong>{" "}
        <a
          href={`https://assignment-gcj1.onrender.com/api/report/${report._id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          {report._id}
        </a>
      </div>

      <div style={{ marginBottom: 18 }}>
        <strong>Rows Analyzed:</strong> {report.rowsSampled}
      </div>

      {/* Scores */}
      <h4 style={{ marginTop: 20, marginBottom: 8, color: "#444" }}>
        Readiness Scores
      </h4>
      <pre
        style={{
          background: "#f4f9ff",
          padding: 12,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(report.scores, null, 2)}
      </pre>

      {/* Coverage */}
      <h4 style={{ marginTop: 20, marginBottom: 8, color: "#444" }}>
        Field Coverage vs GETS Schema
      </h4>
      <pre
        style={{
          background: "#f4f9ff",
          padding: 12,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(report.coverage, null, 2)}
      </pre>

      {/* Findings */}
      <h4 style={{ marginTop: 20, marginBottom: 8, color: "#444" }}>
        Rule Check Findings
      </h4>
      <pre
        style={{
          background: "#f4f9ff",
          padding: 12,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(report.findings, null, 2)}
      </pre>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={downloadJSON}
          style={{
            marginTop: 20,
            padding: "12px 28px",
            background: "linear-gradient(90deg, #007bff, #00c6ff)",
            color: "white",
            border: "none",
            borderRadius: 50,
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "600",
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
          ⬇️ Download Full Report (JSON)
        </button>
      </div>
    </div>
  );
}
